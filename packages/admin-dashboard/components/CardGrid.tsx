// Chaos Creatures Admin Dashboard — Card Grid Component
// Grid of generated cards with art preview, name, faction, stats, and status.
// Approve/reject buttons per card with toggle support. Bulk approve visible.
// REQ-182: Card review gallery with approve/reject.
'use client';

import { useState, useCallback, useMemo } from 'react';
import { factionNameToKey, CREATURE_SUBTYPES } from '@/lib/prompts';

interface GenerationJob {
  id: string;
  job_type: string;
  status: string;
  input_data: {
    faction_id?: string;
    card_type?: string;
    creature_type_hint?: string;
    creature_subtype?: string;
    batch_id?: string;
  };
  output_data?: {
    name?: string;
    card_type?: string;
    base_attack?: number;
    base_health?: number;
    base_instability?: number;
    mana_cost?: number;
    base_keywords?: string[];
    art_prompt?: string;
    flavor_text?: string;
    approved?: boolean;
    review_status?: 'APPROVED' | 'REJECTED' | 'PENDING_REVIEW';
    rejection_reason?: string;
  };
  art_url?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

interface Faction {
  id: string;
  name: string;
  short_name: string;
}

interface ProcessQueueState {
  isProcessing: boolean;
  current: number;
  total: number;
}

interface CardGridProps {
  jobs: GenerationJob[];
  allJobs: GenerationJob[];
  factions: Faction[];
  onRefresh: () => void;
  queuedJobCount: number;
  processQueueState: ProcessQueueState | null;
  onProcessQueue: () => void;
  onStopProcessing: () => void;
}

const FACTION_NAMES: Record<string, string> = {
  IRONWRIGHT: 'Ironwright',
  FEY_COURTS: 'Fey Courts',
  DEMONIC_KINGDOMS: 'Demonic Kingdoms',
  CELESTIAL_CRUSADE: 'Celestial Crusade',
  THE_ENDLESS: 'The Endless',
};

const FACTION_COLORS: Record<string, string> = {
  IRONWRIGHT: 'bg-ironwright/20 text-ironwright border-ironwright/30',
  FEY_COURTS: 'bg-fey/20 text-fey border-fey/30',
  DEMONIC_KINGDOMS: 'bg-demonic/20 text-demonic border-demonic/30',
  CELESTIAL_CRUSADE: 'bg-celestial/20 text-celestial border-celestial/30',
  THE_ENDLESS: 'bg-endless/20 text-endless border-endless/30',
};

/** Faction badge background colors keyed by factionNameToKey output */
const FACTION_BADGE_BG: Record<string, string> = {
  ironwright: 'bg-gray-600',
  fey: 'bg-emerald-700',
  demonic: 'bg-red-800',
  celestial: 'bg-blue-700',
  endless: 'bg-purple-800',
};

/** Target card count per tier */
const SUBTYPE_TARGETS: Record<number, number> = {
  1: 10,
  2: 7,
  3: 5,
  4: 3,
};

type ReviewStatus = 'APPROVED' | 'REJECTED' | 'PENDING_REVIEW' | 'NONE';

function getReviewStatus(job: GenerationJob): ReviewStatus {
  // Prefer the explicit review_status field
  if (job.output_data?.review_status) {
    return job.output_data.review_status;
  }
  // Fall back to the legacy approved boolean
  if (job.output_data?.approved === true) return 'APPROVED';
  if (job.output_data?.approved === false) return 'REJECTED';
  return 'NONE';
}

function getStatusBadge(job: GenerationJob) {
  const reviewStatus = getReviewStatus(job);

  if (reviewStatus === 'APPROVED') {
    return (
      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-900/50 text-emerald-400 border border-emerald-700/30">
        Approved
      </span>
    );
  }
  if (reviewStatus === 'REJECTED') {
    return (
      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-900/50 text-red-400 border border-red-700/30">
        Rejected
      </span>
    );
  }
  if (reviewStatus === 'PENDING_REVIEW') {
    return (
      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-900/50 text-amber-400 border border-amber-700/30">
        Pending Review
      </span>
    );
  }
  if (job.status === 'FAILED') {
    return (
      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-900/50 text-red-400 border border-red-700/30">
        Failed
      </span>
    );
  }
  if (job.status === 'PROCESSING') {
    return (
      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-900/50 text-blue-400 border border-blue-700/30">
        Processing
      </span>
    );
  }
  if (job.status === 'PENDING') {
    return (
      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-700/50 text-gray-400 border border-gray-600/30">
        Queued
      </span>
    );
  }
  // COMPLETED but no review_status set yet
  return (
    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-900/50 text-amber-400 border border-amber-700/30">
      Review
    </span>
  );
}

/** Returns card border class based on review status */
function getCardBorderClass(job: GenerationJob): string {
  const reviewStatus = getReviewStatus(job);
  if (reviewStatus === 'APPROVED') return 'border-emerald-600/60';
  if (reviewStatus === 'REJECTED') return 'border-red-600/60';
  return '';
}

/**
 * Find a faction by ID — handles both UUID and legacy short_name formats
 * (e.g. "a0000000-..." or "IRONWRIGHT").
 */
function findFaction(factionId: string | undefined, factions: Faction[]): Faction | null {
  if (!factionId) return null;
  // Try UUID match first
  const byId = factions.find((f) => f.id === factionId);
  if (byId) return byId;
  // Fall back to short_name match (legacy jobs used "IRONWRIGHT", "FEY_COURTS", etc.)
  const byShortName = factions.find((f) => f.short_name === factionId);
  if (byShortName) return byShortName;
  // Last resort: try factionNameToKey on the raw value against faction names
  const upper = factionId.toUpperCase();
  const byName = factions.find((f) => {
    const key = f.short_name || f.name.toUpperCase().replace(/\s+/g, '_').replace(/^THE_/, '');
    return key === upper;
  });
  return byName || null;
}

/** Look up the faction name from a faction_id using the factions list */
function getFactionName(factionId: string | undefined, factions: Faction[]): string | null {
  const faction = findFaction(factionId, factions);
  return faction?.name || null;
}

/** Get the faction badge background color class from a faction name */
function getFactionBadgeBg(factionName: string): string {
  const key = factionNameToKey(factionName);
  return FACTION_BADGE_BG[key] || 'bg-gray-700';
}

/** Get display-friendly short faction name, stripping leading "The " */
function getFactionShortName(fullName: string): string {
  const withoutThe = fullName.replace(/^The\s+/i, '');
  return withoutThe.split(' ')[0];
}

/**
 * Match a job to a subtype name for a given faction. Only uses the explicit
 * creature_subtype field — no fuzzy guessing. Returns the canonical subtype
 * name or null if not explicitly set.
 */
function matchSubtype(job: GenerationJob, factions: Faction[]): string | null {
  const storedSubtype = job.input_data?.creature_subtype;
  if (!storedSubtype) return null;

  const factionId = job.input_data?.faction_id;
  if (!factionId) return null;

  const faction = findFaction(factionId, factions);
  if (!faction) return null;

  const factionKey = factionNameToKey(faction.name);
  const subtypes = CREATURE_SUBTYPES[factionKey];
  if (!subtypes) return null;

  const match = subtypes.find(
    (s) => s.name.toLowerCase() === storedSubtype.toLowerCase()
  );
  return match ? match.name : null;
}

/**
 * Get subtype data (name + tier) for a job. Returns null if no subtype matched.
 */
function getSubtypeData(job: GenerationJob, factions: Faction[]): { name: string; tier: number } | null {
  const factionId = job.input_data?.faction_id;
  if (!factionId) return null;

  const faction = findFaction(factionId, factions);
  if (!faction) return null;

  const factionKey = factionNameToKey(faction.name);
  const subtypes = CREATURE_SUBTYPES[factionKey];
  if (!subtypes) return null;

  // Use matchSubtype to get the name, then look up the full data
  const matchedName = matchSubtype(job, factions);
  if (matchedName) {
    const sub = subtypes.find((s) => s.name === matchedName);
    if (sub) return { name: sub.name, tier: sub.tier };
  }

  return null;
}

/** Build a short creature type label for the grid card (without count) */
function getCreatureTypeLabel(job: GenerationJob, factions: Faction[]): string | null {
  const data = getSubtypeData(job, factions);
  if (data) {
    return `${data.name} (T${data.tier})`;
  }

  // No explicit subtype — show "Unclassified" with optional hint
  const hint = job.input_data?.creature_type_hint;
  if (hint) {
    const truncated = hint.length > 20 ? hint.slice(0, 20) + '...' : hint;
    return `Unclassified — ${truncated}`;
  }

  return 'Unclassified';
}

/** Get the color class for a count/target ratio */
function getCountColorClass(count: number, target: number): string {
  if (target === 0) return 'text-gray-500';
  const ratio = count / target;
  if (ratio >= 1) return 'text-emerald-400';
  if (ratio >= 0.5) return 'text-amber-400';
  return 'text-gray-500';
}

export default function CardGrid({ jobs, allJobs, factions, onRefresh, queuedJobCount, processQueueState, onProcessQueue, onStopProcessing }: CardGridProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<string | null>(null);
  const [detailJob, setDetailJob] = useState<GenerationJob | null>(null);
  // Optimistic review state: job_id -> review_status
  const [optimisticReviews, setOptimisticReviews] = useState<Record<string, ReviewStatus>>({});

  // Compute approved counts per faction+subtype from the full unfiltered job list
  const subtypeCounts = useMemo(() => {
    const counts: Record<string, number> = {}; // key: "factionId:subtypeName"
    for (const job of allJobs) {
      const status = getReviewStatus(job);
      if (status === 'APPROVED') {
        const fId = job.input_data?.faction_id || '';
        const subtype = matchSubtype(job, factions);
        if (subtype && fId) {
          const key = `${fId}:${subtype}`;
          counts[key] = (counts[key] || 0) + 1;
        }
      }
    }
    return counts;
  }, [allJobs, factions]);

  const pendingJobs = jobs.filter(
    (j) =>
      j.status === 'COMPLETED' &&
      getReviewStatus(j) !== 'APPROVED' &&
      getReviewStatus(j) !== 'REJECTED'
  );

  /** Whether a card is a completed job that can show review buttons */
  const isCompleted = (job: GenerationJob) =>
    job.status === 'COMPLETED';

  /** Get effective review status (optimistic overrides server state) */
  const getEffectiveStatus = useCallback(
    (job: GenerationJob): ReviewStatus => {
      if (optimisticReviews[job.id] !== undefined) {
        return optimisticReviews[job.id];
      }
      return getReviewStatus(job);
    },
    [optimisticReviews]
  );

  async function handleReviewAction(jobId: string, action: 'approve' | 'reject' | 'reset') {
    // Determine optimistic status
    const newStatus: ReviewStatus =
      action === 'approve' ? 'APPROVED' :
      action === 'reject' ? 'REJECTED' :
      'PENDING_REVIEW';

    // Apply optimistic update immediately
    setOptimisticReviews((prev) => ({ ...prev, [jobId]: newStatus }));

    try {
      const res = await fetch('/api/review-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, action }),
      });

      if (!res.ok) {
        // Revert on failure
        setOptimisticReviews((prev) => {
          const next = { ...prev };
          delete next[jobId];
          return next;
        });
        console.error('Review action failed:', await res.text());
      } else {
        // Clear optimistic state and refresh to get authoritative data
        setOptimisticReviews((prev) => {
          const next = { ...prev };
          delete next[jobId];
          return next;
        });
        onRefresh();
      }
    } catch (err) {
      // Revert on network error
      setOptimisticReviews((prev) => {
        const next = { ...prev };
        delete next[jobId];
        return next;
      });
      console.error('Review action error:', err);
    }
  }

  /** Determine the action when clicking approve/reject on a card */
  function handleToggleReview(jobId: string, button: 'approve' | 'reject') {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    const currentStatus = getEffectiveStatus(job);

    if (button === 'approve') {
      // If already approved, reset to pending; otherwise approve
      if (currentStatus === 'APPROVED') {
        handleReviewAction(jobId, 'reset');
      } else {
        handleReviewAction(jobId, 'approve');
      }
    } else {
      // If already rejected, reset to pending; otherwise reject
      if (currentStatus === 'REJECTED') {
        handleReviewAction(jobId, 'reset');
      } else {
        handleReviewAction(jobId, 'reject');
      }
    }
  }

  // Legacy handleAction kept for bulk approve compatibility
  async function handleAction(jobId: string, action: 'approve' | 'reject', reason?: string) {
    setLoading(jobId);
    try {
      await fetch('/api/generation-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          action,
          rejection_reason: reason,
        }),
      });
      onRefresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleBulkApprove() {
    const idsToApprove =
      selectedIds.size > 0
        ? Array.from(selectedIds)
        : pendingJobs.map((j) => j.id);

    setLoading('bulk');
    try {
      for (const id of idsToApprove) {
        await handleReviewAction(id, 'approve');
      }
      setSelectedIds(new Set());
    } finally {
      setLoading(null);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  /** Build effective status badge for a job (includes optimistic overrides) */
  function getEffectiveStatusBadge(job: GenerationJob) {
    const status = getEffectiveStatus(job);
    if (status === 'APPROVED') {
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-900/50 text-emerald-400 border border-emerald-700/30">
          Approved
        </span>
      );
    }
    if (status === 'REJECTED') {
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-900/50 text-red-400 border border-red-700/30">
          Rejected
        </span>
      );
    }
    if (status === 'PENDING_REVIEW') {
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-900/50 text-amber-400 border border-amber-700/30">
          Pending Review
        </span>
      );
    }
    // Fall through to default badge logic
    return getStatusBadge(job);
  }

  /** Get effective border class (includes optimistic overrides) */
  function getEffectiveBorderClass(job: GenerationJob): string {
    const status = getEffectiveStatus(job);
    if (status === 'APPROVED') return 'border-emerald-600/60';
    if (status === 'REJECTED') return 'border-red-600/60';
    return '';
  }

  /** Check if a card is pending review (for selection checkbox) */
  const canSelect = (job: GenerationJob) => {
    const status = getEffectiveStatus(job);
    return job.status === 'COMPLETED' && status !== 'APPROVED' && status !== 'REJECTED';
  };

  return (
    <div>
      {/* Process Queue */}
      {(queuedJobCount > 0 || processQueueState) && (
        <div className="flex items-center gap-3 mb-4">
          {processQueueState ? (
            <>
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-accent border-t-transparent rounded-full" />
                <span className="text-sm text-gray-300">
                  Generating {processQueueState.current}/{processQueueState.total}...
                </span>
              </div>
              <button
                onClick={onStopProcessing}
                className="btn-danger text-sm"
              >
                Stop
              </button>
            </>
          ) : (
            <button
              onClick={onProcessQueue}
              className="btn-primary"
            >
              Process Queue ({queuedJobCount} pending)
            </button>
          )}
        </div>
      )}

      {/* Bulk Actions */}
      {pendingJobs.length > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={handleBulkApprove}
            disabled={loading === 'bulk'}
            className="btn-success disabled:opacity-50"
          >
            {loading === 'bulk'
              ? 'Approving...'
              : selectedIds.size > 0
              ? `Approve Selected (${selectedIds.size})`
              : `Approve All Visible (${pendingJobs.length})`}
          </button>
          {selectedIds.size > 0 && (
            <button
              onClick={() => setSelectedIds(new Set())}
              className="btn-secondary text-sm"
            >
              Clear Selection
            </button>
          )}
        </div>
      )}

      {/* Card Grid */}
      {jobs.length === 0 ? (
        <div className="card-panel text-center py-12">
          <p className="text-gray-400">No cards found matching the filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {jobs.map((job) => {
            const effectiveStatus = getEffectiveStatus(job);
            const borderClass = getEffectiveBorderClass(job);
            const factionName = getFactionName(job.input_data?.faction_id, factions);
            const creatureTypeLabel = getCreatureTypeLabel(job, factions);
            const subtypeData = getSubtypeData(job, factions);

            // Compute count/target for this card's subtype
            let countLabel: React.ReactNode = null;
            if (subtypeData && job.input_data?.faction_id) {
              const countKey = `${job.input_data.faction_id}:${subtypeData.name}`;
              const count = subtypeCounts[countKey] || 0;
              const target = SUBTYPE_TARGETS[subtypeData.tier] || 0;
              const colorClass = getCountColorClass(count, target);
              countLabel = (
                <span className={`${colorClass} font-semibold`}>
                  {' '}{count}/{target}
                </span>
              );
            }

            return (
              <div
                key={job.id}
                className={`card-panel p-3 relative group cursor-pointer hover:border-gray-600 transition-colors ${
                  selectedIds.has(job.id) ? 'ring-2 ring-accent' : ''
                } ${borderClass}`}
                onClick={() => setDetailJob(job)}
              >
                {/* Checkbox for selection */}
                {canSelect(job) && (
                  <input
                    type="checkbox"
                    checked={selectedIds.has(job.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelect(job.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-2 left-2 z-10 w-4 h-4 rounded bg-surface-lighter border-gray-500"
                  />
                )}

                {/* Art Preview */}
                <div className="w-full aspect-[5/7] bg-surface-lighter rounded-lg mb-2 overflow-hidden flex items-center justify-center relative">
                  {job.art_url ? (
                    <img
                      src={job.art_url}
                      alt={job.output_data?.name || 'Card art'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-600 text-xs text-center p-2">
                      {job.status === 'PENDING'
                        ? 'Generating...'
                        : job.status === 'FAILED'
                        ? 'Failed'
                        : 'No art'}
                    </div>
                  )}

                  {/* Faction badge overlay at top of image */}
                  {factionName && (
                    <span
                      className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[10px] font-semibold rounded text-white/90 shadow-sm ${getFactionBadgeBg(factionName)}`}
                    >
                      {getFactionShortName(factionName)}
                    </span>
                  )}
                </div>

                {/* Card Info */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white truncate">
                    {job.output_data?.name || 'Unnamed'}
                  </p>

                  {/* Creature type label with progress count */}
                  {creatureTypeLabel && (
                    <p className="text-xs text-gray-300 truncate">
                      {creatureTypeLabel}{countLabel}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5">
                    {getEffectiveStatusBadge(job)}
                  </div>
                  {job.output_data?.mana_cost !== undefined && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>Cost: {job.output_data.mana_cost}</span>
                      {job.output_data.base_attack !== undefined && (
                        <span>
                          {job.output_data.base_attack}/{job.output_data.base_health}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Review Action Buttons — shown on all completed cards */}
                {isCompleted(job) && (
                  <div className="flex gap-1.5 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleReview(job.id, 'approve');
                      }}
                      title={effectiveStatus === 'APPROVED' ? 'Reset to pending' : 'Approve'}
                      className={`flex-1 py-1.5 flex items-center justify-center rounded transition-colors ${
                        effectiveStatus === 'APPROVED'
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-gray-700 text-gray-400 hover:bg-emerald-600/30 hover:text-emerald-400'
                      }`}
                    >
                      {/* Checkmark icon */}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleReview(job.id, 'reject');
                      }}
                      title={effectiveStatus === 'REJECTED' ? 'Reset to pending' : 'Reject'}
                      className={`flex-1 py-1.5 flex items-center justify-center rounded transition-colors ${
                        effectiveStatus === 'REJECTED'
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-gray-700 text-gray-400 hover:bg-red-600/30 hover:text-red-400'
                      }`}
                    >
                      {/* X icon */}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {detailJob && (
        <DetailModal
          job={detailJob}
          factions={factions}
          effectiveStatus={getEffectiveStatus(detailJob)}
          onClose={() => setDetailJob(null)}
          onToggleReview={(button) => handleToggleReview(detailJob.id, button)}
          onLegacyAction={handleAction}
          loading={loading}
          getEffectiveStatusBadge={getEffectiveStatusBadge}
          isCompleted={isCompleted}
        />
      )}
    </div>
  );
}

/** Detail modal as a separate component to keep the main render clean */
function DetailModal({
  job,
  factions,
  effectiveStatus,
  onClose,
  onToggleReview,
  onLegacyAction,
  loading,
  getEffectiveStatusBadge,
  isCompleted,
}: {
  job: GenerationJob;
  factions: Faction[];
  effectiveStatus: ReviewStatus;
  onClose: () => void;
  onToggleReview: (button: 'approve' | 'reject') => void;
  onLegacyAction: (jobId: string, action: 'approve' | 'reject', reason?: string) => void;
  loading: string | null;
  getEffectiveStatusBadge: (job: GenerationJob) => React.ReactNode;
  isCompleted: (job: GenerationJob) => boolean;
}) {
  const factionName = getFactionName(job.input_data?.faction_id, factions);

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-light rounded-xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">
              {job.output_data?.name || 'Card Detail'}
            </h3>
            {/* Faction name prominently displayed */}
            {factionName && (
              <span
                className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded text-white/90 ${getFactionBadgeBg(factionName)}`}
              >
                {factionName}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Art */}
          <div className="aspect-[5/7] bg-surface-lighter rounded-lg overflow-hidden">
            {job.art_url ? (
              <img
                src={job.art_url}
                alt={job.output_data?.name || 'Card art'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                No art available
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="space-y-3">
            <div>{getEffectiveStatusBadge(job)}</div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-400">Type:</span>{' '}
                <span className="text-white">
                  {job.output_data?.card_type || job.input_data?.card_type || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Mana Cost:</span>{' '}
                <span className="text-white">
                  {job.output_data?.mana_cost ?? 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Attack:</span>{' '}
                <span className="text-white">
                  {job.output_data?.base_attack ?? 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Health:</span>{' '}
                <span className="text-white">
                  {job.output_data?.base_health ?? 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Instability:</span>{' '}
                <span className="text-white">
                  {job.output_data?.base_instability ?? 'N/A'}
                </span>
              </div>
            </div>

            {/* Creature subtype */}
            {job.input_data?.creature_subtype && (
              <div>
                <span className="text-gray-400 text-sm">Subtype:</span>{' '}
                <span className="text-white text-sm">{job.input_data.creature_subtype}</span>
              </div>
            )}

            {/* Full creature_type_hint */}
            {job.input_data?.creature_type_hint && (
              <div>
                <span className="text-gray-400 text-sm">Creature Type Hint:</span>
                <p className="text-sm text-gray-300 mt-0.5">
                  {job.input_data.creature_type_hint}
                </p>
              </div>
            )}

            {job.output_data?.base_keywords &&
              job.output_data.base_keywords.length > 0 && (
                <div>
                  <span className="text-gray-400 text-sm">Keywords:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {job.output_data.base_keywords.map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 text-xs bg-surface-lighter rounded-full text-gray-300"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {job.output_data?.flavor_text && (
              <div>
                <span className="text-gray-400 text-sm">Flavor Text:</span>
                <p className="text-sm text-gray-300 italic mt-1">
                  &quot;{job.output_data.flavor_text}&quot;
                </p>
              </div>
            )}

            {job.output_data?.art_prompt && (
              <div>
                <span className="text-gray-400 text-sm">Art Prompt:</span>
                <p className="text-xs text-gray-500 mt-1 break-words">
                  {job.output_data.art_prompt}
                </p>
              </div>
            )}

            {job.error_message && (
              <div>
                <span className="text-red-400 text-sm">Error:</span>
                <p className="text-sm text-red-300 mt-1">
                  {job.error_message}
                </p>
              </div>
            )}

            {job.output_data?.rejection_reason && (
              <div>
                <span className="text-red-400 text-sm">Rejection Reason:</span>
                <p className="text-sm text-red-300 mt-1">
                  {job.output_data.rejection_reason}
                </p>
              </div>
            )}

            <div className="text-xs text-gray-500">
              Created: {new Date(job.created_at).toLocaleString()}
              {job.completed_at && (
                <>
                  <br />
                  Completed: {new Date(job.completed_at).toLocaleString()}
                </>
              )}
            </div>

            {/* Review Action Buttons — shown on all completed cards in modal too */}
            {isCompleted(job) && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    onToggleReview('approve');
                    onClose();
                  }}
                  className={`flex-1 py-2 text-sm font-medium rounded transition-colors flex items-center justify-center gap-2 ${
                    effectiveStatus === 'APPROVED'
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-gray-700 text-gray-300 hover:bg-emerald-600/30 hover:text-emerald-400 border border-gray-600'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {effectiveStatus === 'APPROVED' ? 'Approved (click to reset)' : 'Approve'}
                </button>
                <button
                  onClick={() => {
                    onToggleReview('reject');
                    onClose();
                  }}
                  className={`flex-1 py-2 text-sm font-medium rounded transition-colors flex items-center justify-center gap-2 ${
                    effectiveStatus === 'REJECTED'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-700 text-gray-300 hover:bg-red-600/30 hover:text-red-400 border border-gray-600'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {effectiveStatus === 'REJECTED' ? 'Rejected (click to reset)' : 'Reject'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { FACTION_NAMES, FACTION_COLORS, getReviewStatus };
export type { GenerationJob, Faction, ProcessQueueState };
