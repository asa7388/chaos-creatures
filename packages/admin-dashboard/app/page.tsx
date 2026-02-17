// Chaos Creatures Admin Dashboard — Dashboard Home
// At-a-glance metrics: active players, evolutions today, revenue, active season.
// Pending actions panel with quick links. Server Component.

import StatCard from '@/components/StatCard';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getMetrics() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Parallel queries
  const [
    playersResult,
    templatesResult,
    pendingJobsResult,
    failedJobsResult,
    seasonResult,
    dustTodayResult,
  ] = await Promise.all([
    // Active players (last 7 days)
    supabase
      .from('players')
      .select('id', { count: 'exact', head: true })
      .gte('updated_at', weekAgo),
    // Total card templates
    supabase
      .from('card_templates')
      .select('id', { count: 'exact', head: true }),
    // Pending review jobs
    supabase
      .from('generation_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'COMPLETED')
      .eq('job_type', 'BASE_CARD_IMAGE'),
    // Failed jobs
    supabase
      .from('generation_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'FAILED'),
    // Active season
    supabase
      .from('seasons')
      .select('*')
      .eq('is_active', true)
      .single(),
    // Dust distributed today
    supabase
      .from('dust_transactions')
      .select('amount')
      .gte('created_at', todayStart)
      .gt('amount', 0),
  ]);

  const dustToday = (dustTodayResult.data || []).reduce(
    (sum: number, t: { amount: number }) => sum + t.amount,
    0
  );

  return {
    activePlayers: playersResult.count || 0,
    totalTemplates: templatesResult.count || 0,
    pendingReview: pendingJobsResult.count || 0,
    failedJobs: failedJobsResult.count || 0,
    activeSeason: seasonResult.data?.name || 'None',
    dustToday,
  };
}

async function getRecentActivity() {
  const { data } = await supabase
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  return data || [];
}

export default async function DashboardPage() {
  const metrics = await getMetrics();
  const recentActivity = await getRecentActivity();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">
          Overview of Chaos Creatures game metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Players (7d)"
          value={metrics.activePlayers}
          subtitle="Updated at login"
        />
        <StatCard
          title="Card Templates"
          value={metrics.totalTemplates}
          subtitle="Approved templates"
        />
        <StatCard
          title="Chaos Dust Today"
          value={metrics.dustToday}
          subtitle="Total distributed"
        />
        <StatCard
          title="Active Season"
          value={metrics.activeSeason}
          subtitle="Current season"
        />
      </div>

      {/* Pending Actions */}
      <div className="card-panel">
        <h2 className="text-lg font-semibold text-white mb-4">
          Pending Actions
        </h2>
        <div className="space-y-3">
          {metrics.pendingReview > 0 && (
            <Link
              href="/cards?status=pending"
              className="flex items-center justify-between p-3 bg-surface-lighter rounded-lg hover:bg-gray-600/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-sm text-gray-200">
                  Cards awaiting review
                </span>
              </div>
              <span className="text-sm font-medium text-amber-400">
                {metrics.pendingReview} pending
              </span>
            </Link>
          )}
          {metrics.failedJobs > 0 && (
            <Link
              href="/cards?status=failed"
              className="flex items-center justify-between p-3 bg-surface-lighter rounded-lg hover:bg-gray-600/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-sm text-gray-200">
                  Failed generation jobs
                </span>
              </div>
              <span className="text-sm font-medium text-red-400">
                {metrics.failedJobs} failed
              </span>
            </Link>
          )}
          {metrics.pendingReview === 0 && metrics.failedJobs === 0 && (
            <p className="text-sm text-gray-500 py-2">
              No pending actions. Everything is up to date.
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-panel">
        <h2 className="text-lg font-semibold text-white mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/cards" className="btn-primary">
            Generate Card Batch
          </Link>
          <Link href="/validate" className="btn-secondary">
            Validate Balance
          </Link>
          <Link href="/economy" className="btn-secondary">
            Edit Economy Config
          </Link>
          <Link href="/seasons" className="btn-secondary">
            Manage Seasons
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card-panel">
        <h2 className="text-lg font-semibold text-white mb-4">
          Recent Activity
        </h2>
        {recentActivity.length > 0 ? (
          <div className="space-y-2">
            {recentActivity.map(
              (entry: {
                id: string;
                action: string;
                admin_user: string;
                target_type: string | null;
                created_at: string;
              }) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-2 border-b border-gray-700/30 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-300">
                      {entry.action}
                    </span>
                    {entry.target_type && (
                      <span className="text-xs text-gray-500">
                        ({entry.target_type})
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                </div>
              )
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No recent activity logged.
          </p>
        )}
      </div>
    </div>
  );
}
