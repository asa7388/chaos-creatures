// Chaos Creatures Admin Dashboard — Analytics
// REQ-185: PostHog dashboard iframe embed.
// Tabs: DAU/Retention, Match Metrics, Economy Health, Funnels.

'use client';

import { useState } from 'react';

const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
const POSTHOG_API_KEY = process.env.NEXT_PUBLIC_POSTHOG_API_KEY || '';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'retention', label: 'DAU / Retention' },
  { key: 'matches', label: 'Match Metrics' },
  { key: 'economy', label: 'Economy Health' },
  { key: 'funnels', label: 'Funnels' },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  if (!POSTHOG_API_KEY) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 text-sm mt-1">
            PostHog analytics dashboard
          </p>
        </div>

        <div className="card-panel text-center py-12">
          <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-medium text-white mb-2">
            PostHog Not Configured
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Set the <code className="text-accent">NEXT_PUBLIC_POSTHOG_API_KEY</code> and{' '}
            <code className="text-accent">NEXT_PUBLIC_POSTHOG_HOST</code> environment
            variables to enable analytics.
          </p>
          <a
            href="https://posthog.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-block"
          >
            Open PostHog
          </a>
        </div>
      </div>
    );
  }

  // Build the PostHog shared dashboard URL
  const dashboardUrl = `${POSTHOG_HOST}/shared_dashboard/${POSTHOG_API_KEY}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 text-sm mt-1">
            PostHog analytics dashboard — DAU, retention, match metrics, economy health
          </p>
        </div>
        <a
          href={`${POSTHOG_HOST}/project`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Open in PostHog
        </a>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-surface-light rounded-lg p-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-accent text-white'
                : 'text-gray-400 hover:text-white hover:bg-surface-lighter'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* PostHog iframe */}
      <div className="card-panel p-0 overflow-hidden">
        <iframe
          src={dashboardUrl}
          className="w-full border-0"
          style={{ height: 'calc(100vh - 280px)', minHeight: '600px' }}
          title={`PostHog — ${activeTab}`}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    </div>
  );
}
