// Chaos Creatures Admin Dashboard — Game Settings
// Game config, API key status, maintenance mode.
// Server Component by default (no interactivity needed for status display).

import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function getApiKeyStatus() {
  const keys = [
    { name: 'SUPABASE_URL', label: 'Supabase URL' },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Supabase Service Role' },
    { name: 'GAME_SERVER_URL', label: 'Game Server URL' },
    { name: 'GAME_SERVER_SECRET', label: 'Game Server Secret' },
    { name: 'ADMIN_PASSWORD', label: 'Admin Password' },
    { name: 'ADMIN_JWT_SECRET', label: 'Admin JWT Secret' },
    { name: 'NEXT_PUBLIC_POSTHOG_API_KEY', label: 'PostHog API Key' },
  ];

  return keys.map((k) => ({
    ...k,
    configured: !!process.env[k.name],
  }));
}

async function getDbStats() {
  const [
    playersResult,
    templatesResult,
    matchesResult,
    generationResult,
  ] = await Promise.all([
    supabase.from('players').select('id', { count: 'exact', head: true }),
    supabase.from('card_templates').select('id', { count: 'exact', head: true }),
    supabase.from('generation_jobs').select('id', { count: 'exact', head: true }),
    supabase.from('generation_jobs').select('cost_usd').not('cost_usd', 'is', null),
  ]);

  const totalCost = (generationResult.data || []).reduce(
    (sum: number, j: { cost_usd: number | null }) => sum + (Number(j.cost_usd) || 0),
    0
  );

  return {
    totalPlayers: playersResult.count || 0,
    totalTemplates: templatesResult.count || 0,
    totalMatches: matchesResult.count || 0,
    totalAiCost: totalCost.toFixed(4),
  };
}

export default async function SettingsPage() {
  const apiKeys = await getApiKeyStatus();
  const dbStats = await getDbStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">
          System status, API key configuration, and database statistics
        </p>
      </div>

      {/* API Key Status */}
      <div className="card-panel">
        <h2 className="text-lg font-semibold text-white mb-4">
          API Key Status
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Shows whether each required environment variable is configured.
          Actual key values are never displayed.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {apiKeys.map((key) => (
            <div
              key={key.name}
              className="flex items-center justify-between bg-surface-lighter rounded-lg px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-gray-200">{key.label}</p>
                <p className="text-xs font-mono text-gray-500">{key.name}</p>
              </div>
              {key.configured ? (
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Database Stats */}
      <div className="card-panel">
        <h2 className="text-lg font-semibold text-white mb-4">
          Database Statistics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-surface-lighter rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-white">{dbStats.totalPlayers}</p>
            <p className="text-xs text-gray-400 mt-1">Total Players</p>
          </div>
          <div className="bg-surface-lighter rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-white">{dbStats.totalTemplates}</p>
            <p className="text-xs text-gray-400 mt-1">Card Templates</p>
          </div>
          <div className="bg-surface-lighter rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-white">{dbStats.totalMatches}</p>
            <p className="text-xs text-gray-400 mt-1">Generation Jobs</p>
          </div>
          <div className="bg-surface-lighter rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-white">${dbStats.totalAiCost}</p>
            <p className="text-xs text-gray-400 mt-1">AI Cost (USD)</p>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="card-panel">
        <h2 className="text-lg font-semibold text-white mb-4">
          System Information
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-700/20">
            <span className="text-gray-400">Node.js Version</span>
            <span className="text-white font-mono">{process.version}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-700/20">
            <span className="text-gray-400">Environment</span>
            <span className="text-white font-mono">{process.env.NODE_ENV || 'development'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-700/20">
            <span className="text-gray-400">Admin Dashboard Port</span>
            <span className="text-white font-mono">{process.env.PORT || '3002'}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-400">Supabase URL</span>
            <span className="text-white font-mono text-xs">
              {process.env.SUPABASE_URL ? '(configured)' : '(not set)'}
            </span>
          </div>
        </div>
      </div>

      {/* External Links */}
      <div className="card-panel">
        <h2 className="text-lg font-semibold text-white mb-4">
          External Services
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Supabase Dashboard', url: 'https://app.supabase.com', desc: 'Player/data management' },
            { label: 'Railway Dashboard', url: 'https://railway.app', desc: 'Server deployment' },
            { label: 'PostHog', url: 'https://posthog.com', desc: 'Analytics' },
            { label: 'fal.ai', url: 'https://fal.ai', desc: 'AI image generation' },
            { label: 'Cloudflare R2', url: 'https://dash.cloudflare.com', desc: 'Card art storage' },
            { label: 'App Store Connect', url: 'https://appstoreconnect.apple.com', desc: 'iOS app management' },
          ].map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-surface-lighter rounded-lg px-4 py-3 hover:bg-gray-600/50 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-gray-200">{link.label}</p>
                <p className="text-xs text-gray-500">{link.desc}</p>
              </div>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
