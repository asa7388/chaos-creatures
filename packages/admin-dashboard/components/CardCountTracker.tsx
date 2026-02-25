// Chaos Creatures Admin Dashboard — Card Count Tracker
// Shows progress toward target card counts per faction and subtype.
// Only APPROVED cards count toward targets; pending review shown separately.
'use client';

import { useState } from 'react';
import { CREATURE_SUBTYPES, factionNameToKey } from '@/lib/prompts';
import type { GenerationJob } from '@/components/CardGrid';

interface Faction {
  id: string;
  name: string;
  short_name: string;
}

interface CardCountTrackerProps {
  jobs: GenerationJob[];
  factions: Faction[];
}

/** Target card count per tier */
const SUBTYPE_TARGETS: Record<number, number> = {
  1: 10, // T1
  2: 7,  // T2
  3: 5,  // T3
  4: 3,  // T4
};

/** Total target per faction (sum of all subtype targets) */
function computeFactionTarget(factionKey: string): number {
  const subtypes = CREATURE_SUBTYPES[factionKey];
  if (!subtypes) return 40;
  return subtypes.reduce((sum, s) => sum + (SUBTYPE_TARGETS[s.tier] ?? 0), 0);
}

/** Match a job to a faction key and subtype name */
function classifyJob(
  job: GenerationJob,
  factions: Faction[]
): { factionKey: string; subtypeName: string } | null {
  const factionId = job.input_data?.faction_id;
  if (!factionId) return null;

  const faction = factions.find((f) => f.id === factionId);
  if (!faction) return null;

  const factionKey = factionNameToKey(faction.name);

  // Try explicit subtype first
  const storedSubtype = job.input_data?.creature_subtype;
  if (storedSubtype) {
    const subtypes = CREATURE_SUBTYPES[factionKey];
    const match = subtypes?.find(
      (s) => s.name.toLowerCase() === storedSubtype.toLowerCase()
    );
    if (match) return { factionKey, subtypeName: match.name };
  }

  // Fall back to fuzzy matching on creature_type_hint
  const hint = (job.input_data?.creature_type_hint || '').toLowerCase();
  if (hint) {
    const subtypes = CREATURE_SUBTYPES[factionKey];
    if (subtypes) {
      const match = subtypes.find((s) => hint.includes(s.name.toLowerCase()));
      if (match) return { factionKey, subtypeName: match.name };
    }
  }

  return { factionKey, subtypeName: 'Unclassified' };
}

function ProgressBar({
  value,
  max,
  colorClass,
}: {
  value: number;
  max: number;
  colorClass: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
      <div
        className={`h-2 rounded-full transition-all duration-300 ${colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function getBarColor(approved: number, target: number): string {
  if (target === 0) return 'bg-gray-500';
  const ratio = approved / target;
  if (ratio >= 1) return 'bg-emerald-500';
  if (ratio >= 0.5) return 'bg-amber-500';
  return 'bg-gray-500';
}

export default function CardCountTracker({
  jobs,
  factions,
}: CardCountTrackerProps) {
  const [expandedFactions, setExpandedFactions] = useState<Set<string>>(
    new Set()
  );

  // Classify all completed jobs
  type CountEntry = { approved: number; pending: number };
  const factionCounts: Record<
    string,
    { subtypes: Record<string, CountEntry>; total: CountEntry }
  > = {};

  // Initialize all factions and subtypes
  for (const faction of factions) {
    const key = factionNameToKey(faction.name);
    const subtypes = CREATURE_SUBTYPES[key] || [];
    const subtypeCounts: Record<string, CountEntry> = {};
    for (const s of subtypes) {
      subtypeCounts[s.name] = { approved: 0, pending: 0 };
    }
    subtypeCounts['Unclassified'] = { approved: 0, pending: 0 };
    factionCounts[key] = {
      subtypes: subtypeCounts,
      total: { approved: 0, pending: 0 },
    };
  }

  // Count jobs
  for (const job of jobs) {
    if (job.status !== 'COMPLETED') continue;

    const classification = classifyJob(job, factions);
    if (!classification) continue;

    const { factionKey, subtypeName } = classification;
    const factionData = factionCounts[factionKey];
    if (!factionData) continue;

    // Ensure subtype entry exists
    if (!factionData.subtypes[subtypeName]) {
      factionData.subtypes[subtypeName] = { approved: 0, pending: 0 };
    }

    const isApproved = job.output_data?.approved === true;
    const isPending = job.output_data?.approved === undefined;

    if (isApproved) {
      factionData.subtypes[subtypeName].approved++;
      factionData.total.approved++;
    } else if (isPending) {
      factionData.subtypes[subtypeName].pending++;
      factionData.total.pending++;
    }
    // Rejected cards are not counted
  }

  // Grand totals
  let grandApproved = 0;
  let grandPending = 0;
  let grandTarget = 0;

  for (const faction of factions) {
    const key = factionNameToKey(faction.name);
    const data = factionCounts[key];
    if (data) {
      grandApproved += data.total.approved;
      grandPending += data.total.pending;
    }
    grandTarget += computeFactionTarget(key);
  }

  function toggleFaction(key: string) {
    setExpandedFactions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const grandPct =
    grandTarget > 0 ? Math.round((grandApproved / grandTarget) * 100) : 0;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-4">
      {/* Grand Total */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-semibold text-white">
            Total: {grandApproved}/{grandTarget} ({grandPct}%)
          </span>
          {grandPending > 0 && (
            <span className="text-xs text-amber-400">
              +{grandPending} pending review
            </span>
          )}
        </div>
        <ProgressBar
          value={grandApproved}
          max={grandTarget}
          colorClass={getBarColor(grandApproved, grandTarget)}
        />
      </div>

      {/* Per-Faction Sections */}
      <div className="space-y-2">
        {factions.map((faction) => {
          const key = factionNameToKey(faction.name);
          const data = factionCounts[key];
          if (!data) return null;

          const factionTarget = computeFactionTarget(key);
          const factionPct =
            factionTarget > 0
              ? Math.round((data.total.approved / factionTarget) * 100)
              : 0;
          const isExpanded = expandedFactions.has(key);
          const subtypes = CREATURE_SUBTYPES[key] || [];

          return (
            <div
              key={key}
              className="bg-gray-900/50 border border-gray-700/50 rounded-md"
            >
              {/* Faction Header */}
              <button
                onClick={() => toggleFaction(key)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-700/30 transition-colors rounded-md"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <svg
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-200 truncate">
                    {faction.name}: {data.total.approved}/{factionTarget} (
                    {factionPct}%)
                  </span>
                  {data.total.pending > 0 && (
                    <span className="text-xs text-amber-400 flex-shrink-0">
                      +{data.total.pending} pending
                    </span>
                  )}
                </div>
                <div className="w-24 flex-shrink-0 ml-2">
                  <ProgressBar
                    value={data.total.approved}
                    max={factionTarget}
                    colorClass={getBarColor(data.total.approved, factionTarget)}
                  />
                </div>
              </button>

              {/* Expanded Subtypes */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 space-y-1.5">
                  {subtypes.map((subtype) => {
                    const entry = data.subtypes[subtype.name] || {
                      approved: 0,
                      pending: 0,
                    };
                    const target = SUBTYPE_TARGETS[subtype.tier] ?? 0;

                    return (
                      <div key={subtype.name} className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-36 truncate flex-shrink-0">
                          {subtype.name} (T{subtype.tier}): {entry.approved}/
                          {target}
                          {entry.pending > 0 && (
                            <span className="text-amber-400">
                              {' '}
                              (+{entry.pending} pending)
                            </span>
                          )}
                        </span>
                        <div className="flex-1">
                          <ProgressBar
                            value={entry.approved}
                            max={target}
                            colorClass={getBarColor(entry.approved, target)}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Unclassified, only if > 0 */}
                  {(data.subtypes['Unclassified']?.approved ?? 0) +
                    (data.subtypes['Unclassified']?.pending ?? 0) >
                    0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-36 truncate flex-shrink-0">
                        Unclassified: {data.subtypes['Unclassified'].approved}
                        {data.subtypes['Unclassified'].pending > 0 && (
                          <span className="text-amber-400">
                            {' '}
                            (+{data.subtypes['Unclassified'].pending} pending)
                          </span>
                        )}
                      </span>
                      <div className="flex-1">
                        <ProgressBar
                          value={0}
                          max={1}
                          colorClass="bg-gray-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
