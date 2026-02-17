// Chaos Creatures Admin Dashboard — Season Management
// REQ-186: Create, activate, deactivate seasons. View stats.
'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';

interface Season {
  id: string;
  season_number: number;
  name: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  battle_pass_tiers: number;
  created_at: string;
}

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Create form state
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState(1);
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newTiers, setNewTiers] = useState(50);

  const fetchSeasons = useCallback(async () => {
    try {
      const res = await fetch('/api/season');
      const data = await res.json();
      setSeasons(data.seasons || []);
    } catch {
      console.error('Failed to fetch seasons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError('');
    setActionLoading('create');

    try {
      const res = await fetch('/api/season', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: newName,
          season_number: newNumber,
          starts_at: new Date(newStartDate).toISOString(),
          ends_at: new Date(newEndDate).toISOString(),
          battle_pass_tiers: newTiers,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create season');
        return;
      }

      setShowCreateForm(false);
      setNewName('');
      setNewStartDate('');
      setNewEndDate('');
      await fetchSeasons();
    } catch {
      setError('Network error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggle(seasonId: string, currentlyActive: boolean) {
    setActionLoading(seasonId);
    setError('');

    try {
      const res = await fetch('/api/season', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: currentlyActive ? 'deactivate' : 'activate',
          season_id: seasonId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to update season');
        return;
      }

      await fetchSeasons();
    } catch {
      setError('Network error');
    } finally {
      setActionLoading(null);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function getSeasonStatus(season: Season) {
    const now = new Date();
    const start = new Date(season.starts_at);
    const end = new Date(season.ends_at);

    if (season.is_active) return 'active';
    if (now < start) return 'upcoming';
    if (now > end) return 'ended';
    return 'inactive';
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Season Management</h1>
          <p className="text-gray-400 text-sm mt-1">
            Create, activate, and manage game seasons
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary"
        >
          {showCreateForm ? 'Cancel' : 'Create Season'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Create Season Form */}
      {showCreateForm && (
        <div className="card-panel">
          <h2 className="text-lg font-semibold text-white mb-4">
            Create New Season
          </h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Season Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="input-field w-full"
                placeholder="e.g. Season of Chaos"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Season Number
              </label>
              <input
                type="number"
                value={newNumber}
                onChange={(e) => setNewNumber(parseInt(e.target.value) || 1)}
                className="input-field w-full"
                min={1}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="input-field w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                className="input-field w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Battle Pass Tiers
              </label>
              <input
                type="number"
                value={newTiers}
                onChange={(e) => setNewTiers(parseInt(e.target.value) || 50)}
                className="input-field w-full"
                min={10}
                max={100}
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={actionLoading === 'create'}
                className="btn-primary disabled:opacity-50"
              >
                {actionLoading === 'create' ? 'Creating...' : 'Create Season'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Seasons List */}
      {loading ? (
        <div className="card-panel text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading seasons...</p>
        </div>
      ) : seasons.length === 0 ? (
        <div className="card-panel text-center py-12">
          <p className="text-gray-400">
            No seasons created yet. Click &quot;Create Season&quot; to start.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {seasons.map((season) => {
            const status = getSeasonStatus(season);
            return (
              <div
                key={season.id}
                className={`card-panel flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  season.is_active ? 'ring-2 ring-emerald-500/50' : ''
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">
                      {season.name}
                    </h3>
                    <span className="text-sm text-gray-500">
                      #{season.season_number}
                    </span>
                    {status === 'active' && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-900/50 text-emerald-400 border border-emerald-700/30">
                        Active
                      </span>
                    )}
                    {status === 'upcoming' && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-900/50 text-blue-400 border border-blue-700/30">
                        Upcoming
                      </span>
                    )}
                    {status === 'ended' && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-700/50 text-gray-400 border border-gray-600/30">
                        Ended
                      </span>
                    )}
                    {status === 'inactive' && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-900/50 text-amber-400 border border-amber-700/30">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>
                      {formatDate(season.starts_at)} - {formatDate(season.ends_at)}
                    </span>
                    <span>{season.battle_pass_tiers} BP tiers</span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(season.id, season.is_active)}
                  disabled={actionLoading === season.id}
                  className={`${
                    season.is_active ? 'btn-danger' : 'btn-success'
                  } disabled:opacity-50 whitespace-nowrap`}
                >
                  {actionLoading === season.id
                    ? '...'
                    : season.is_active
                    ? 'Deactivate'
                    : 'Activate'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
