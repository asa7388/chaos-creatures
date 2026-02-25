// Chaos Creatures Admin Dashboard — Card Generation & Review
// Trigger batch generation, review/approve/reject card art in grid view.
// REQ-181 (batch trigger), REQ-182 (card review gallery).
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import CardGrid from '@/components/CardGrid';
import CardCountTracker from '@/components/CardCountTracker';
import GenerateBatchModal from '@/components/GenerateBatchModal';
import type { GenerationJob, ProcessQueueState } from '@/components/CardGrid';
import { getReviewStatus } from '@/components/CardGrid';
import { factionNameToKey, CREATURE_SUBTYPES } from '@/lib/prompts';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'failed';

interface Faction {
  id: string;
  name: string;
  short_name: string;
}

export default function CardsPage() {
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [factions, setFactions] = useState<Faction[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [factionFilter, setFactionFilter] = useState<string>('all');
  const [subtypeFilter, setSubtypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showTracker, setShowTracker] = useState(false);
  const [processQueueState, setProcessQueueState] = useState<ProcessQueueState | null>(null);
  const stopProcessingRef = useRef(false);

  const fetchJobs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('job_type', 'BASE_CARD_IMAGE');
      params.set('limit', '100');

      const res = await fetch(`/api/generation-jobs?${params}`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch {
      console.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFactions = useCallback(async () => {
    try {
      // Factions are read from Supabase directly via our own tiny API
      const res = await fetch('/api/factions');
      if (res.ok) {
        const data = await res.json();
        setFactions(data.factions || []);
      }
    } catch {
      // Factions fetch is best-effort; modal will work without them
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchFactions();
  }, [fetchJobs, fetchFactions]);

  // Auto-refresh every 10s when there are pending/processing jobs
  useEffect(() => {
    const hasPending = jobs.some(
      (j) => j.status === 'PENDING' || j.status === 'PROCESSING'
    );
    if (!hasPending) return;

    const interval = setInterval(fetchJobs, 10000);
    return () => clearInterval(interval);
  }, [jobs, fetchJobs]);

  // Derive available subtypes based on selected faction
  const availableSubtypes = (() => {
    if (factionFilter === 'all') return [];
    const faction = factions.find((f) => f.id === factionFilter);
    if (!faction) return [];
    const key = factionNameToKey(faction.name);
    return CREATURE_SUBTYPES[key] || [];
  })();

  // Filter jobs based on status tab, faction, and subtype
  const filteredJobs = jobs.filter((job) => {
    // Status filter
    if (statusFilter !== 'all') {
      const reviewStatus = getReviewStatus(job);
      if (statusFilter === 'pending') {
        // "Pending Review" = completed but not approved/rejected
        if (job.status !== 'COMPLETED') return false;
        if (reviewStatus === 'APPROVED' || reviewStatus === 'REJECTED') return false;
      } else if (statusFilter === 'approved') {
        if (reviewStatus !== 'APPROVED') return false;
      } else if (statusFilter === 'rejected') {
        if (reviewStatus !== 'REJECTED') return false;
      } else if (statusFilter === 'failed') {
        if (job.status !== 'FAILED') return false;
      }
    }
    // Faction filter
    if (factionFilter !== 'all') {
      if (job.input_data?.faction_id !== factionFilter) return false;
    }
    // Subtype filter
    if (subtypeFilter !== 'all') {
      const hint = (job.input_data?.creature_type_hint || '').toLowerCase();
      const storedSubtype = (job.input_data?.creature_subtype || '').toLowerCase();
      const filterLower = subtypeFilter.toLowerCase();
      if (storedSubtype !== filterLower && !hint.includes(filterLower)) return false;
    }
    return true;
  });

  const statusCounts = {
    all: jobs.length,
    pending: jobs.filter((j) => {
      const rs = getReviewStatus(j);
      return j.status === 'COMPLETED' && rs !== 'APPROVED' && rs !== 'REJECTED';
    }).length,
    approved: jobs.filter((j) => getReviewStatus(j) === 'APPROVED').length,
    rejected: jobs.filter((j) => getReviewStatus(j) === 'REJECTED').length,
    failed: jobs.filter((j) => j.status === 'FAILED').length,
  };

  // Count PENDING (not yet processed) jobs for the process queue
  const queuedJobs = jobs.filter((j) => j.status === 'PENDING');
  const queuedJobCount = queuedJobs.length;

  async function handleProcessQueue() {
    const pendingIds = jobs
      .filter((j) => j.status === 'PENDING')
      .map((j) => j.id);

    if (pendingIds.length === 0) return;

    stopProcessingRef.current = false;
    setProcessQueueState({ isProcessing: true, current: 0, total: pendingIds.length });

    for (let i = 0; i < pendingIds.length; i++) {
      if (stopProcessingRef.current) break;

      setProcessQueueState({ isProcessing: true, current: i + 1, total: pendingIds.length });

      try {
        const res = await fetch('/api/generate-art', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: pendingIds[i] }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error(`Job ${pendingIds[i]} failed:`, data.error || res.statusText);
          // Stop on failure
          break;
        }
      } catch (err) {
        console.error(`Job ${pendingIds[i]} network error:`, err);
        break;
      }

      // Refresh jobs list after each completion so UI updates
      await fetchJobs();
    }

    setProcessQueueState(null);
    stopProcessingRef.current = false;
    // Final refresh
    await fetchJobs();
  }

  function handleStopProcessing() {
    stopProcessingRef.current = true;
  }

  const TABS: { key: StatusFilter; label: string }[] = [
    { key: 'pending', label: 'Pending Review' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'failed', label: 'Failed' },
    { key: 'all', label: 'All Cards' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Card Generation & Review
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Generate, review, and approve card art
          </p>
        </div>
        <button
          onClick={() => setShowBatchModal(true)}
          className="btn-primary"
        >
          Start Batch
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-surface-light rounded-lg p-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === tab.key
                ? 'bg-accent text-white'
                : 'text-gray-400 hover:text-white hover:bg-surface-lighter'
            }`}
          >
            {tab.label}
            {statusCounts[tab.key] > 0 && (
              <span
                className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                  statusFilter === tab.key
                    ? 'bg-white/20'
                    : 'bg-surface-lighter'
                }`}
              >
                {statusCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Card Count Tracker Toggle + Panel */}
      <div>
        <button
          onClick={() => setShowTracker((prev) => !prev)}
          className="text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-md bg-gray-800 border border-gray-700 hover:border-gray-500 transition-colors flex items-center gap-1.5"
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform ${showTracker ? 'rotate-90' : ''}`}
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
          {showTracker ? 'Hide Tracker' : 'Show Tracker'}
        </button>
        {showTracker && (
          <div className="mt-3">
            <CardCountTracker jobs={jobs} factions={factions} />
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Faction Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400 whitespace-nowrap">Faction:</label>
          <select
            value={factionFilter}
            onChange={(e) => {
              setFactionFilter(e.target.value);
              setSubtypeFilter('all');
            }}
            className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-1.5 focus:ring-accent focus:border-accent"
          >
            <option value="all">All Factions</option>
            {factions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subtype Filter — only visible when a faction is selected */}
        {factionFilter !== 'all' && availableSubtypes.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400 whitespace-nowrap">Subtype:</label>
            <select
              value={subtypeFilter}
              onChange={(e) => setSubtypeFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-1.5 focus:ring-accent focus:border-accent"
            >
              <option value="all">All Subtypes</option>
              {availableSubtypes.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name} (T{s.tier})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Active filter count */}
        {(factionFilter !== 'all' || subtypeFilter !== 'all') && (
          <button
            onClick={() => {
              setFactionFilter('all');
              setSubtypeFilter('all');
            }}
            className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-gray-800 border border-gray-700 hover:border-gray-500 transition-colors"
          >
            Clear filters
          </button>
        )}

        {/* Result count */}
        <span className="text-xs text-gray-500 ml-auto">
          {filteredJobs.length} of {jobs.length} cards
        </span>
      </div>


      {/* Card Grid */}
      {loading ? (
        <div className="card-panel text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading cards...</p>
        </div>
      ) : (
        <CardGrid
          jobs={filteredJobs}
          factions={factions}
          onRefresh={fetchJobs}
          queuedJobCount={queuedJobCount}
          processQueueState={processQueueState}
          onProcessQueue={handleProcessQueue}
          onStopProcessing={handleStopProcessing}
        />
      )}

      {/* Generate Batch Modal */}
      <GenerateBatchModal
        factions={factions}
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        onComplete={fetchJobs}
      />
    </div>
  );
}
