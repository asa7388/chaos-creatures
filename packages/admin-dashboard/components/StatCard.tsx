// Chaos Creatures Admin Dashboard — Stat Card Component
// Displays a single metric with label, value, and optional delta.

interface StatCardProps {
  title: string;
  value: string | number;
  delta?: number; // Positive = up, negative = down, undefined = no change shown
  subtitle?: string;
}

export default function StatCard({ title, value, delta, subtitle }: StatCardProps) {
  return (
    <div className="card-panel">
      <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-bold text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {delta !== undefined && (
          <span
            className={`text-sm font-medium flex items-center gap-0.5 mb-0.5 ${
              delta > 0
                ? 'text-emerald-400'
                : delta < 0
                ? 'text-red-400'
                : 'text-gray-500'
            }`}
          >
            {delta > 0 ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : delta < 0 ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : null}
            {delta > 0 ? '+' : ''}{delta}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
