// Chaos Creatures Admin Dashboard — Economy Config Editor
// REQ-180: Read/write interface for economy_config. Changes take effect immediately.
// Inline editing with audit log panel.
'use client';

import { useState, useEffect, useCallback } from 'react';

interface EconomyConfig {
  key: string;
  value: unknown;
  description: string;
  updated_at: string;
  updated_by: string;
}

interface AuditEntry {
  id: string;
  admin_user: string;
  action: string;
  target_id: string | null;
  details: {
    old_value?: unknown;
    new_value?: unknown;
  } | null;
  created_at: string;
}

export default function EconomyPage() {
  const [configs, setConfigs] = useState<EconomyConfig[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/economy-config');
      const data = await res.json();
      setConfigs(data.config || []);
    } catch {
      console.error('Failed to fetch economy config');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAuditLog = useCallback(async () => {
    try {
      // Fetch recent economy-related audit entries
      const res = await fetch('/api/economy-config/audit');
      if (res.ok) {
        const data = await res.json();
        setAuditLog(data.entries || []);
      }
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
    fetchAuditLog();
  }, [fetchConfigs, fetchAuditLog]);

  function startEditing(config: EconomyConfig) {
    setEditingKey(config.key);
    setEditValue(JSON.stringify(config.value));
    setError('');
  }

  function cancelEditing() {
    setEditingKey(null);
    setEditValue('');
    setError('');
  }

  async function saveConfig(key: string) {
    setSaving(true);
    setError('');

    try {
      // Try to parse as JSON first, fall back to string
      let parsedValue: unknown;
      try {
        parsedValue = JSON.parse(editValue);
      } catch {
        parsedValue = editValue;
      }

      const res = await fetch('/api/economy-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: parsedValue }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save');
        setSaving(false);
        return;
      }

      setEditingKey(null);
      setEditValue('');
      await Promise.all([fetchConfigs(), fetchAuditLog()]);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  function formatValue(value: unknown): string {
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Economy Controls</h1>
        <p className="text-gray-400 text-sm mt-1">
          Edit economy configuration values. Changes take effect immediately.
        </p>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg px-4 py-3 flex items-center gap-3">
        <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p className="text-sm text-amber-200">
          Changes take effect immediately. All active game clients will read
          new values on their next request.
        </p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Config Table */}
      <div className="card-panel overflow-hidden p-0">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400">Loading economy config...</p>
          </div>
        ) : configs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400">
              No economy config values found. Add values via Supabase Dashboard.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="table-header">Key</th>
                  <th className="table-header">Value</th>
                  <th className="table-header">Description</th>
                  <th className="table-header">Last Updated</th>
                  <th className="table-header w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {configs.map((config) => (
                  <tr
                    key={config.key}
                    className="border-b border-gray-700/20 hover:bg-surface-lighter/50"
                  >
                    <td className="table-cell font-mono text-sm text-accent">
                      {config.key}
                    </td>
                    <td className="table-cell">
                      {editingKey === config.key ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="input-field w-full text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveConfig(config.key);
                            if (e.key === 'Escape') cancelEditing();
                          }}
                        />
                      ) : (
                        <span
                          className="font-mono text-sm cursor-pointer hover:text-white"
                          onClick={() => startEditing(config)}
                        >
                          {formatValue(config.value)}
                        </span>
                      )}
                    </td>
                    <td className="table-cell text-gray-500 text-xs">
                      {config.description || '-'}
                    </td>
                    <td className="table-cell text-xs text-gray-500">
                      {new Date(config.updated_at).toLocaleString()}
                      <br />
                      <span className="text-gray-600">by {config.updated_by}</span>
                    </td>
                    <td className="table-cell">
                      {editingKey === config.key ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => saveConfig(config.key)}
                            disabled={saving}
                            className="px-2 py-1 text-xs font-medium rounded bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                          >
                            {saving ? '...' : 'Save'}
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="px-2 py-1 text-xs font-medium rounded bg-gray-600 hover:bg-gray-700 text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(config)}
                          className="px-2 py-1 text-xs font-medium rounded bg-surface-lighter hover:bg-gray-600 text-gray-300"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Log */}
      <div className="card-panel">
        <h2 className="text-lg font-semibold text-white mb-4">
          Recent Changes (Audit Log)
        </h2>
        {auditLog.length > 0 ? (
          <div className="space-y-2">
            {auditLog.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start justify-between py-2 border-b border-gray-700/20 last:border-0"
              >
                <div className="space-y-0.5">
                  <p className="text-sm text-gray-300">
                    <span className="font-mono text-accent text-xs">
                      {entry.target_id}
                    </span>{' '}
                    updated by {entry.admin_user}
                  </p>
                  {entry.details && (
                    <p className="text-xs text-gray-500">
                      {formatValue(entry.details.old_value)} &rarr;{' '}
                      {formatValue(entry.details.new_value)}
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                  {new Date(entry.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No recent changes.</p>
        )}
      </div>
    </div>
  );
}
