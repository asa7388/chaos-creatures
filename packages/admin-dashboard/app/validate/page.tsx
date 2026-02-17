// Chaos Creatures Admin Dashboard — Validate Balance
// REQ-165: Balance validation suite against all card templates.
// Calls POST /api/admin/validate-balance on game server.
// Shows results: table of cards with pass/fail, specific violations, summary.
'use client';

import { useState } from 'react';

interface ValidationResult {
  status: string;
  total_cards?: number;
  passed?: number;
  failed?: number;
  results?: CardValidation[];
  error?: string;
}

interface CardValidation {
  card_id?: string;
  card_name?: string;
  status: 'pass' | 'fail';
  violations?: string[];
}

export default function ValidatePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState('');

  async function runValidation() {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/validate-balance', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Validation request failed');
        setLoading(false);
        return;
      }

      setResult(data);
    } catch {
      setError('Network error. Is the game server running?');
    } finally {
      setLoading(false);
    }
  }

  const passCount = result?.passed ?? result?.results?.filter((r) => r.status === 'pass').length ?? 0;
  const failCount = result?.failed ?? result?.results?.filter((r) => r.status === 'fail').length ?? 0;
  const totalCount = result?.total_cards ?? result?.results?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Balance Validation</h1>
          <p className="text-gray-400 text-sm mt-1">
            Run automated balance checks against all card templates (REQ-165)
          </p>
        </div>
        <button
          onClick={runValidation}
          disabled={loading}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Validating...
            </span>
          ) : (
            'Validate Cards'
          )}
        </button>
      </div>

      {/* Info Panel */}
      <div className="card-panel">
        <h3 className="text-sm font-medium text-gray-400 mb-2">
          What this checks
        </h3>
        <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
          <li>PP budget validation (tolerance +/- 1)</li>
          <li>Instability/stat profile consistency</li>
          <li>Keyword limits per card</li>
          <li>Modifier PP cost matching</li>
          <li>Mana cost / stat ratio validation</li>
        </ul>
        <p className="text-xs text-gray-500 mt-3">
          Calls <code className="text-accent">POST /api/admin/validate-balance</code> on the
          game server.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-panel text-center">
              <p className="text-3xl font-bold text-white">{totalCount}</p>
              <p className="text-sm text-gray-400">Total Cards</p>
            </div>
            <div className="card-panel text-center">
              <p className="text-3xl font-bold text-emerald-400">{passCount}</p>
              <p className="text-sm text-gray-400">Passed</p>
            </div>
            <div className="card-panel text-center">
              <p className={`text-3xl font-bold ${failCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {failCount}
              </p>
              <p className="text-sm text-gray-400">Failed</p>
            </div>
          </div>

          {/* Overall Status */}
          {failCount === 0 ? (
            <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-lg px-4 py-3 flex items-center gap-3">
              <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-emerald-200">
                All cards passed balance validation.
              </p>
            </div>
          ) : (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg px-4 py-3 flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-sm text-red-200">
                {failCount} card(s) failed balance validation. Review violations below.
              </p>
            </div>
          )}

          {/* Detailed Results */}
          {result.results && result.results.length > 0 && (
            <div className="card-panel overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700/50">
                      <th className="table-header">Card</th>
                      <th className="table-header w-24">Status</th>
                      <th className="table-header">Violations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((card, i) => (
                      <tr
                        key={card.card_id || i}
                        className="border-b border-gray-700/20"
                      >
                        <td className="table-cell">
                          <span className="font-medium text-white">
                            {card.card_name || card.card_id || `Card #${i + 1}`}
                          </span>
                        </td>
                        <td className="table-cell">
                          {card.status === 'pass' ? (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-900/50 text-emerald-400">
                              Pass
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-900/50 text-red-400">
                              Fail
                            </span>
                          )}
                        </td>
                        <td className="table-cell">
                          {card.violations && card.violations.length > 0 ? (
                            <ul className="text-sm text-red-300 space-y-0.5">
                              {card.violations.map((v, vi) => (
                                <li key={vi} className="flex items-start gap-1">
                                  <span className="text-red-400 mt-0.5">-</span>
                                  {v}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-gray-500 text-sm">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* If server returned status but no detailed results */}
          {result.status === 'not_implemented' && (
            <div className="card-panel text-center py-8">
              <p className="text-gray-400">
                The game server&apos;s validate-balance endpoint returned &quot;not_implemented&quot;.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                The validation logic needs to be implemented in the game server
                at <code className="text-accent">POST /api/admin/validate-balance</code>.
              </p>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!result && !error && !loading && (
        <div className="card-panel text-center py-12">
          <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-400">
            Click &quot;Validate Cards&quot; to run balance checks against all card templates.
          </p>
        </div>
      )}
    </div>
  );
}
