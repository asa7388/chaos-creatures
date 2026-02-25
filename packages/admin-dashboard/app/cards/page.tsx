// Chaos Creatures Admin Dashboard — Card Generation & Review
// Trigger batch generation, review/approve/reject card art in grid view.
// REQ-181 (batch trigger), REQ-182 (card review gallery).
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import CardGrid from '@/components/CardGrid';
import GenerateBatchModal from '@/components/GenerateBatchModal';
import type { GenerationJob, ProcessQueueState } from '@/components/CardGrid';

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
  const [loading, setLoading] = useState(true);
  const [showBatchModal, setShowBatchModal] = useState(false);
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

  // Filter jobs based on status tab
  const filteredJobs = jobs.filter((job) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') {
      return (
        job.status === 'COMPLETED' &&
        job.output_data?.approved === undefined
      );
    }
    if (statusFilter === 'approved') {
      return job.output_data?.approved === true;
    }
    if (statusFilter === 'rejected') {
      return job.output_data?.approved === false;
    }
    if (statusFilter === 'failed') {
      return job.status === 'FAILED';
    }
    return true;
  });

  const statusCounts = {
    all: jobs.length,
    pending: jobs.filter(
      (j) => j.status === 'COMPLETED' && j.output_data?.approved === undefined
    ).length,
    approved: jobs.filter((j) => j.output_data?.approved === true).length,
    rejected: jobs.filter((j) => j.output_data?.approved === false).length,
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

      {/* Card Grid */}
      {loading ? (
        <div className="card-panel text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading cards...</p>
        </div>
      ) : (
        <CardGrid
          jobs={filteredJobs}
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
