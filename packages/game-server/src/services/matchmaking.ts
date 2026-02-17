// Chaos Creatures Game Server — Matchmaking Service
// Polls matchmaking_queue table, matches by rank, creates matches
// Source: docs/design/06-technical-architecture.md Section 4.5

import type { SeasonRank } from '../types/enums';
import { getSupabase } from './supabase';
import {
  MATCHMAKING_POLL_INTERVAL_MS,
  INITIAL_RANK_RANGE,
  MAX_RANK_RANGE,
  RANK_RANGE_EXPANSION_INTERVAL,
} from '../engine/constants';

/** Queue entry from the matchmaking_queue table */
interface QueueEntry {
  id: string;
  player_id: string;
  deck_id: string;
  avatar_id: string;
  faction_id: string;
  mode: string;
  season_rank: SeasonRank;
  season_rank_points: number;
  hidden_mmr: number;
  queued_at: string;
}

/** Callback when a match is found */
export type MatchFoundCallback = (
  player1: QueueEntry,
  player2: QueueEntry
) => Promise<void>;

/** Rank to number for comparison */
const RANK_ORDER: Record<string, number> = {
  BRONZE_3: 1, BRONZE_2: 2, BRONZE_1: 3,
  SILVER_3: 4, SILVER_2: 5, SILVER_1: 6,
  GOLD_3: 7, GOLD_2: 8, GOLD_1: 9,
  PLATINUM_3: 10, PLATINUM_2: 11, PLATINUM_1: 12,
  DIAMOND_3: 13, DIAMOND_2: 14, DIAMOND_1: 15,
  MASTER: 16, GRANDMASTER: 17,
};

export function rankToNumber(rank: string): number {
  return RANK_ORDER[rank] ?? 1;
}

/**
 * Poll the matchmaking queue and attempt to create matches.
 */
export async function pollMatchmakingQueue(
  onMatchFound: MatchFoundCallback
): Promise<void> {
  try {
    const supabase = getSupabase();
    const { data: queue, error } = await supabase
      .from('matchmaking_queue')
      .select('*')
      .order('queued_at', { ascending: true });

    if (error || !queue || queue.length < 2) return;

    // Group by mode
    const ranked = queue.filter((q: QueueEntry) => q.mode === 'RANKED');
    const casual = queue.filter((q: QueueEntry) => q.mode === 'CASUAL');

    // Process ranked matches
    await processQueue(ranked, true, onMatchFound);

    // Process casual matches (no rank restriction)
    await processQueue(casual, false, onMatchFound);
  } catch (err) {
    console.error('Matchmaking poll error:', err);
  }
}

async function processQueue(
  queue: QueueEntry[],
  useRankMatching: boolean,
  onMatchFound: MatchFoundCallback
): Promise<void> {
  const matched = new Set<string>();

  for (let i = 0; i < queue.length - 1; i++) {
    if (matched.has(queue[i].id)) continue;
    const p1 = queue[i];
    const waitSeconds = (Date.now() - new Date(p1.queued_at).getTime()) / 1000;

    // Expand search range based on wait time
    const rankRange = useRankMatching
      ? Math.min(MAX_RANK_RANGE, INITIAL_RANK_RANGE + Math.floor(waitSeconds / RANK_RANGE_EXPANSION_INTERVAL))
      : Infinity;

    for (let j = i + 1; j < queue.length; j++) {
      if (matched.has(queue[j].id)) continue;
      const p2 = queue[j];

      if (useRankMatching) {
        const rankDiff = Math.abs(rankToNumber(p1.season_rank) - rankToNumber(p2.season_rank));
        if (rankDiff > rankRange) continue;
      }

      // Match found
      matched.add(p1.id);
      matched.add(p2.id);

      // Remove both from queue
      try {
        const supabase = getSupabase();
        await supabase
          .from('matchmaking_queue')
          .delete()
          .in('id', [p1.id, p2.id]);

        await onMatchFound(p1, p2);
      } catch (err) {
        console.error('Failed to create match:', err);
      }

      break;
    }
  }
}

/** Matchmaking poll interval handle */
let pollInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start the matchmaking poller.
 */
export function startMatchmakingPoller(onMatchFound: MatchFoundCallback): void {
  if (pollInterval) return; // Already running
  pollInterval = setInterval(
    () => pollMatchmakingQueue(onMatchFound),
    MATCHMAKING_POLL_INTERVAL_MS
  );
  console.log(`Matchmaking poller started (every ${MATCHMAKING_POLL_INTERVAL_MS}ms)`);
}

/**
 * Stop the matchmaking poller.
 */
export function stopMatchmakingPoller(): void {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
    console.log('Matchmaking poller stopped');
  }
}
