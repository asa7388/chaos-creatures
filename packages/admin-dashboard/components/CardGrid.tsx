// Chaos Creatures Admin Dashboard — Card Grid Component
// Grid of generated cards with art preview, name, faction, stats, and status.
// Approve/reject buttons per card. Bulk approve visible.
// REQ-182: Card review gallery with approve/reject.
'use client';

import { useState } from 'react';

interface GenerationJob {
  id: string;
  job_type: string;
  status: string;
  input_data: {
    faction_id?: string;
    card_type?: string;
    creature_type_hint?: string;
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
    rejection_reason?: string;
  };
  art_url?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

interface ProcessQueueState {
  isProcessing: boolean;
  current: number;
  total: number;
}

interface CardGridProps {
  jobs: GenerationJob[];
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

function getStatusBadge(job: GenerationJob) {
  if (job.output_data?.approved === true) {
    return (
      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-900/50 text-emerald-400 border border-emerald-700/30">
        Approved
      </span>
    );
  }
  if (job.output_data?.approved === false) {
    return (
      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-900/50 text-red-400 border border-red-700/30">
        Rejected
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
        Pending
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-900/50 text-amber-400 border border-amber-700/30">
      Review
    </span>
  );
}

export default function CardGrid({ jobs, onRefresh, queuedJobCount, processQueueState, onProcessQueue, onStopProcessing }: CardGridProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<string | null>(null);
  const [detailJob, setDetailJob] = useState<GenerationJob | null>(null);

  const pendingJobs = jobs.filter(
    (j) =>
      j.status === 'COMPLETED' &&
      j.output_data?.approved === undefined
  );

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
        await fetch('/api/generation-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: id, action: 'approve' }),
        });
      }
      setSelectedIds(new Set());
      onRefresh();
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

  const canReview = (job: GenerationJob) =>
    job.status === 'COMPLETED' && job.output_data?.approved === undefined;

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
          {jobs.map((job) => (
            <div
              key={job.id}
              className={`card-panel p-3 relative group cursor-pointer hover:border-gray-600 transition-colors ${
                selectedIds.has(job.id) ? 'ring-2 ring-accent' : ''
              }`}
              onClick={() => setDetailJob(job)}
            >
              {/* Checkbox for selection */}
              {canReview(job) && (
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
              <div className="w-full aspect-[5/7] bg-surface-lighter rounded-lg mb-2 overflow-hidden flex items-center justify-center">
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
              </div>

              {/* Card Info */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-white truncate">
                  {job.output_data?.name || 'Unnamed'}
                </p>
                <div className="flex items-center gap-1.5">
                  {getStatusBadge(job)}
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

              {/* Quick Actions */}
              {canReview(job) && (
                <div className="flex gap-1.5 mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(job.id, 'approve');
                    }}
                    disabled={loading === job.id}
                    className="flex-1 py-1 text-xs font-medium rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(job.id, 'reject', 'Rejected in review');
                    }}
                    disabled={loading === job.id}
                    className="flex-1 py-1 text-xs font-medium rounded bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {detailJob && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setDetailJob(null)}
        >
          <div
            className="bg-surface-light rounded-xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">
                {detailJob.output_data?.name || 'Card Detail'}
              </h3>
              <button
                onClick={() => setDetailJob(null)}
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
                {detailJob.art_url ? (
                  <img
                    src={detailJob.art_url}
                    alt={detailJob.output_data?.name || 'Card art'}
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
                <div>{getStatusBadge(detailJob)}</div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-400">Type:</span>{' '}
                    <span className="text-white">
                      {detailJob.output_data?.card_type || detailJob.input_data?.card_type || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Mana Cost:</span>{' '}
                    <span className="text-white">
                      {detailJob.output_data?.mana_cost ?? 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Attack:</span>{' '}
                    <span className="text-white">
                      {detailJob.output_data?.base_attack ?? 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Health:</span>{' '}
                    <span className="text-white">
                      {detailJob.output_data?.base_health ?? 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Instability:</span>{' '}
                    <span className="text-white">
                      {detailJob.output_data?.base_instability ?? 'N/A'}
                    </span>
                  </div>
                </div>

                {detailJob.output_data?.base_keywords &&
                  detailJob.output_data.base_keywords.length > 0 && (
                    <div>
                      <span className="text-gray-400 text-sm">Keywords:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {detailJob.output_data.base_keywords.map((kw) => (
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

                {detailJob.output_data?.flavor_text && (
                  <div>
                    <span className="text-gray-400 text-sm">Flavor Text:</span>
                    <p className="text-sm text-gray-300 italic mt-1">
                      &quot;{detailJob.output_data.flavor_text}&quot;
                    </p>
                  </div>
                )}

                {detailJob.output_data?.art_prompt && (
                  <div>
                    <span className="text-gray-400 text-sm">Art Prompt:</span>
                    <p className="text-xs text-gray-500 mt-1 break-words">
                      {detailJob.output_data.art_prompt}
                    </p>
                  </div>
                )}

                {detailJob.error_message && (
                  <div>
                    <span className="text-red-400 text-sm">Error:</span>
                    <p className="text-sm text-red-300 mt-1">
                      {detailJob.error_message}
                    </p>
                  </div>
                )}

                {detailJob.output_data?.rejection_reason && (
                  <div>
                    <span className="text-red-400 text-sm">Rejection Reason:</span>
                    <p className="text-sm text-red-300 mt-1">
                      {detailJob.output_data.rejection_reason}
                    </p>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Created: {new Date(detailJob.created_at).toLocaleString()}
                  {detailJob.completed_at && (
                    <>
                      <br />
                      Completed: {new Date(detailJob.completed_at).toLocaleString()}
                    </>
                  )}
                </div>

                {/* Action Buttons */}
                {canReview(detailJob) && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        handleAction(detailJob.id, 'approve');
                        setDetailJob(null);
                      }}
                      className="btn-success flex-1"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        handleAction(detailJob.id, 'reject', 'Rejected in review');
                        setDetailJob(null);
                      }}
                      className="btn-danger flex-1"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { FACTION_NAMES, FACTION_COLORS };
export type { GenerationJob, ProcessQueueState };
