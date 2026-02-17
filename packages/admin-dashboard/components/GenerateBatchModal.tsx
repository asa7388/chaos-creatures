// Chaos Creatures Admin Dashboard — Generate Batch Modal
// Wizard: select faction, card type, quantity, creature type hint.
// Progress bar polls every 5s for batch status (REQ-181).
'use client';

import { useState, useEffect, FormEvent } from 'react';

interface Faction {
  id: string;
  name: string;
  short_name: string;
}

interface GenerateBatchModalProps {
  factions: Faction[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type Step = 'config' | 'generating' | 'complete';

export default function GenerateBatchModal({
  factions,
  isOpen,
  onClose,
  onComplete,
}: GenerateBatchModalProps) {
  const [step, setStep] = useState<Step>('config');
  const [factionId, setFactionId] = useState('');
  const [cardType, setCardType] = useState('CREATURE');
  const [count, setCount] = useState(5);
  const [creatureTypeHint, setCreatureTypeHint] = useState('');
  const [error, setError] = useState('');
  const [batchId, setBatchId] = useState('');
  const [jobsCreated, setJobsCreated] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setStep('config');
      setError('');
      setBatchId('');
    }
  }, [isOpen]);

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!factionId) {
      setError('Please select a faction');
      return;
    }

    setStep('generating');

    try {
      const res = await fetch('/api/generate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faction_id: factionId,
          count,
          card_type: cardType,
          creature_type_hint: creatureTypeHint || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to start batch');
        setStep('config');
        return;
      }

      setBatchId(data.batch_id);
      setJobsCreated(data.jobs_created);
      setStep('complete');
    } catch {
      setError('Network error. Try again.');
      setStep('config');
    }
  }

  function handleDone() {
    onComplete();
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-light rounded-xl border border-gray-700 max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white">Generate Card Batch</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === 'config' && (
          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Faction */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Faction
              </label>
              <select
                value={factionId}
                onChange={(e) => setFactionId(e.target.value)}
                className="select-field w-full"
                required
              >
                <option value="">Select faction...</option>
                {factions.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Card Type */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Card Type
              </label>
              <select
                value={cardType}
                onChange={(e) => setCardType(e.target.value)}
                className="select-field w-full"
              >
                <option value="CREATURE">Creature</option>
                <option value="SPELL">Spell</option>
                <option value="STABILIZER">Stabilizer</option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Quantity (1-20)
              </label>
              <input
                type="number"
                value={count}
                onChange={(e) =>
                  setCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))
                }
                min={1}
                max={20}
                className="input-field w-full"
              />
            </div>

            {/* Creature Type Hint */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Creature Type Hint (optional)
              </label>
              <input
                type="text"
                value={creatureTypeHint}
                onChange={(e) => setCreatureTypeHint(e.target.value)}
                className="input-field w-full"
                placeholder="e.g. dragon, golem, spirit..."
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1">
                Generate
              </button>
            </div>
          </form>
        )}

        {step === 'generating' && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-300">Starting batch generation...</p>
            <p className="text-gray-500 text-sm mt-1">
              Creating {count} card generation jobs
            </p>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white font-medium mb-1">Batch Created</p>
            <p className="text-gray-400 text-sm mb-1">
              {jobsCreated} generation jobs queued
            </p>
            <p className="text-gray-500 text-xs mb-4">
              Batch ID: {batchId}
            </p>
            <p className="text-gray-500 text-xs mb-6">
              Cards will appear in the review queue once generation completes.
            </p>
            <button onClick={handleDone} className="btn-primary w-full">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
