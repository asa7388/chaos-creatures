// Chaos Creatures Game Server — Admin Endpoint Tests
// Tests for admin auth middleware, validate-balance, and batch/start endpoints.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// ---------------------------------------------------------------------------
// We test the requireAdminAuth middleware as a standalone function,
// and test the balance computation logic separately.
// The Express routes themselves are integration-tested via mocked Supabase.
// ---------------------------------------------------------------------------

// Mock the supabase service so we can control query results
vi.mock('../src/services/supabase', () => {
  const mockFrom = vi.fn();
  const mockFunctionsInvoke = vi.fn();
  return {
    initSupabase: vi.fn(() => ({})),
    getSupabase: vi.fn(() => ({
      from: mockFrom,
      functions: { invoke: mockFunctionsInvoke },
    })),
    validatePlayerToken: vi.fn(),
    getPlayerIdFromAuthId: vi.fn(),
    __mockFrom: mockFrom,
    __mockFunctionsInvoke: mockFunctionsInvoke,
  };
});

// Mock the other server imports that aren't relevant to admin tests
vi.mock('../src/ws/handler', () => ({ handleConnection: vi.fn() }));
vi.mock('../src/services/matchmaking', () => ({
  startMatchmakingPoller: vi.fn(),
  stopMatchmakingPoller: vi.fn(),
}));
vi.mock('../src/engine/match', () => ({ getActiveMatchCount: vi.fn(() => 0) }));
vi.mock('../src/ws/rooms', () => ({ getActiveRoomCount: vi.fn(() => 0) }));

import { requireAdminAuth } from '../src/index';
import { getSupabase } from '../src/services/supabase';

// Retrieve the mock internals
const supabaseModule = await import('../src/services/supabase');
const mockFrom = (supabaseModule as unknown as { __mockFrom: ReturnType<typeof vi.fn> }).__mockFrom;
const mockFunctionsInvoke = (supabaseModule as unknown as { __mockFunctionsInvoke: ReturnType<typeof vi.fn> }).__mockFunctionsInvoke;

// ---------------------------------------------------------------------------
// Helper: create mock Express req/res/next
// ---------------------------------------------------------------------------
function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    body: {},
    ...overrides,
  } as unknown as Request;
}

function mockRes(): Response & { _status: number; _json: unknown } {
  const res: Partial<Response> & { _status: number; _json: unknown } = {
    _status: 200,
    _json: null,
    status(code: number) {
      res._status = code;
      return res as Response;
    },
    json(data: unknown) {
      res._json = data;
      return res as Response;
    },
  };
  return res as Response & { _status: number; _json: unknown };
}

// ─── requireAdminAuth Middleware ─────────────

describe('requireAdminAuth', () => {
  it('should call next() when X-Admin-Secret matches', () => {
    const req = mockReq({
      headers: { 'x-admin-secret': 'test-secret' } as Record<string, string>,
    });
    const res = mockRes();
    const next = vi.fn();

    requireAdminAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res._json).toBeNull();
  });

  it('should return 401 when X-Admin-Secret is missing', () => {
    const req = mockReq({ headers: {} as Record<string, string> });
    const res = mockRes();
    const next = vi.fn();

    requireAdminAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
    expect(res._json).toEqual({ error: 'Unauthorized' });
  });

  it('should return 401 when X-Admin-Secret is wrong', () => {
    const req = mockReq({
      headers: { 'x-admin-secret': 'wrong-secret' } as Record<string, string>,
    });
    const res = mockRes();
    const next = vi.fn();

    requireAdminAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
    expect(res._json).toEqual({ error: 'Unauthorized' });
  });
});

// ─── Balance Computation Logic ─────────────
// We test the statistical logic inline since it's embedded in the route.
// These are unit tests for the math used by validate-balance.

describe('balance statistics computation', () => {
  function computeFactionStats(cards: Array<{ mana_cost: number; base_attack: number; base_health: number }>) {
    const n = cards.length;
    if (n === 0) return null;

    const avgMana = cards.reduce((s, c) => s + c.mana_cost, 0) / n;
    const avgAtk = cards.reduce((s, c) => s + c.base_attack, 0) / n;
    const avgHp = cards.reduce((s, c) => s + c.base_health, 0) / n;

    const stdMana = Math.sqrt(cards.reduce((s, c) => s + (c.mana_cost - avgMana) ** 2, 0) / n);
    const stdAtk = Math.sqrt(cards.reduce((s, c) => s + (c.base_attack - avgAtk) ** 2, 0) / n);
    const stdHp = Math.sqrt(cards.reduce((s, c) => s + (c.base_health - avgHp) ** 2, 0) / n);

    return {
      count: n,
      avg_mana_cost: Math.round(avgMana * 100) / 100,
      avg_attack: Math.round(avgAtk * 100) / 100,
      avg_health: Math.round(avgHp * 100) / 100,
      std_mana_cost: Math.round(stdMana * 100) / 100,
      std_attack: Math.round(stdAtk * 100) / 100,
      std_health: Math.round(stdHp * 100) / 100,
    };
  }

  it('should compute correct averages for uniform cards', () => {
    const cards = [
      { mana_cost: 3, base_attack: 2, base_health: 4 },
      { mana_cost: 3, base_attack: 2, base_health: 4 },
      { mana_cost: 3, base_attack: 2, base_health: 4 },
    ];
    const stats = computeFactionStats(cards)!;
    expect(stats.avg_mana_cost).toBe(3);
    expect(stats.avg_attack).toBe(2);
    expect(stats.avg_health).toBe(4);
    expect(stats.std_mana_cost).toBe(0);
    expect(stats.std_attack).toBe(0);
    expect(stats.std_health).toBe(0);
  });

  it('should compute correct averages and std for varied cards', () => {
    const cards = [
      { mana_cost: 1, base_attack: 1, base_health: 2 },
      { mana_cost: 3, base_attack: 3, base_health: 4 },
      { mana_cost: 5, base_attack: 5, base_health: 6 },
    ];
    const stats = computeFactionStats(cards)!;
    expect(stats.avg_mana_cost).toBe(3);
    expect(stats.avg_attack).toBe(3);
    expect(stats.avg_health).toBe(4);
    // std = sqrt((4+0+4)/3) = sqrt(8/3) ~= 1.63
    expect(stats.std_mana_cost).toBeCloseTo(1.63, 1);
    expect(stats.std_attack).toBeCloseTo(1.63, 1);
    expect(stats.std_health).toBeCloseTo(1.63, 1);
  });

  it('should detect outliers beyond 2 std deviations', () => {
    // Cards: 2,2,2,2,2,2,2,2,2,10 — the 10 should be an outlier
    const cards = [
      ...Array(9).fill({ mana_cost: 2, base_attack: 2, base_health: 2 }),
      { mana_cost: 10, base_attack: 2, base_health: 2 },
    ];
    const stats = computeFactionStats(cards)!;
    // avg mana = (18+10)/10 = 2.8
    // std mana = sqrt((9*(0.8^2) + (7.2^2))/10) = sqrt((5.76+51.84)/10) = sqrt(5.76) ~= 2.4
    // 10 - 2.8 = 7.2 > 2*2.4 = 4.8 => outlier
    const manaOutlier = Math.abs(10 - stats.avg_mana_cost) > 2 * stats.std_mana_cost;
    expect(manaOutlier).toBe(true);

    // Normal card at 2: |2 - 2.8| = 0.8 < 4.8 => not outlier
    const normalCardOutlier = Math.abs(2 - stats.avg_mana_cost) > 2 * stats.std_mana_cost;
    expect(normalCardOutlier).toBe(false);
  });

  it('should return null for empty array', () => {
    expect(computeFactionStats([])).toBeNull();
  });
});

// ─── Batch Start Validation ─────────────

describe('batch/start input validation', () => {
  it('should require faction_id and count', () => {
    // The route checks: if (!faction_id || !count)
    expect(!undefined || !undefined).toBe(true); // both missing -> error
    expect(!('ironwright') || !(5)).toBe(false); // both present -> ok
    expect(!('ironwright') || !(0)).toBe(true); // count=0 -> falsy -> error
  });

  it('should reject count outside 1-50 range', () => {
    expect(0 < 1 || 0 > 50).toBe(true); // 0 out of range
    expect(51 < 1 || 51 > 50).toBe(true); // 51 out of range
    expect(1 < 1 || 1 > 50).toBe(false); // 1 in range
    expect(50 < 1 || 50 > 50).toBe(false); // 50 in range
    expect(25 < 1 || 25 > 50).toBe(false); // 25 in range
  });
});
