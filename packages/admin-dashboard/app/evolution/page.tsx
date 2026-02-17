// Chaos Creatures Admin Dashboard — Evolution Job Monitor
// Evolution jobs and modifier pool management.
// Note: Detailed evolution monitoring is available via Supabase Dashboard.

import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function getEvolutionStats() {
  const [pendingResult, failedResult, completedResult] = await Promise.all([
    supabase
      .from('generation_jobs')
      .select('id', { count: 'exact', head: true })
      .in('job_type', ['EVOLUTION_IMAGE', 'EVOLUTION_TEXT'])
      .eq('status', 'PENDING'),
    supabase
      .from('generation_jobs')
      .select('id', { count: 'exact', head: true })
      .in('job_type', ['EVOLUTION_IMAGE', 'EVOLUTION_TEXT'])
      .eq('status', 'FAILED'),
    supabase
      .from('generation_jobs')
      .select('id', { count: 'exact', head: true })
      .in('job_type', ['EVOLUTION_IMAGE', 'EVOLUTION_TEXT'])
      .eq('status', 'COMPLETED'),
  ]);

  return {
    pending: pendingResult.count || 0,
    failed: failedResult.count || 0,
    completed: completedResult.count || 0,
  };
}

export default async function EvolutionPage() {
  const stats = await getEvolutionStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Evolution Jobs
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Overview of evolution generation jobs
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-panel text-center">
          <p className="text-3xl font-bold text-amber-400">{stats.pending}</p>
          <p className="text-sm text-gray-400">Pending</p>
        </div>
        <div className="card-panel text-center">
          <p className="text-3xl font-bold text-emerald-400">{stats.completed}</p>
          <p className="text-sm text-gray-400">Completed</p>
        </div>
        <div className="card-panel text-center">
          <p className={`text-3xl font-bold ${stats.failed > 0 ? 'text-red-400' : 'text-gray-400'}`}>
            {stats.failed}
          </p>
          <p className="text-sm text-gray-400">Failed</p>
        </div>
      </div>

      {/* Info */}
      <div className="card-panel">
        <p className="text-sm text-gray-300 mb-3">
          Evolution jobs are automatically created when players trigger card evolution.
          Failed jobs can be investigated and retried via the Supabase Dashboard.
        </p>
        <div className="flex gap-3">
          <a
            href={process.env.NEXT_PUBLIC_SUPABASE_DASHBOARD_URL || 'https://app.supabase.com'}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm"
          >
            Open Supabase Dashboard
          </a>
          <Link href="/validate" className="btn-secondary text-sm">
            Validate Card Balance
          </Link>
        </div>
      </div>
    </div>
  );
}
