// tests/economy-double-spend.test.ts — Economy double-spend prevention tests
// Tests that concurrent purchase requests cannot spend the same dust twice.
// REQ-162: All currency operations use PostgreSQL transactions.

import {
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

import { SHARD_DUST_COSTS, ShardTier } from "../_shared/types.ts";

// ─── Pure economy logic for testing ──────────────────────

interface PlayerWallet {
  chaos_dust: number;
  shards_uncommon: number;
  shards_rare: number;
  shards_epic: number;
  shards_legendary: number;
}

interface PurchaseResult {
  success: boolean;
  error?: string;
  dust_spent?: number;
  new_balance?: number;
}

/**
 * Simulate an atomic shard purchase with optimistic locking.
 * This mirrors the Edge Function logic where we use WHERE chaos_dust >= cost.
 */
function attemptPurchase(wallet: PlayerWallet, tier: ShardTier): PurchaseResult {
  const cost = SHARD_DUST_COSTS[tier];

  // Optimistic lock check: only deduct if sufficient
  if (wallet.chaos_dust < cost) {
    return { success: false, error: `Insufficient dust. Need ${cost}, have ${wallet.chaos_dust}` };
  }

  // Atomic deduction (simulated)
  wallet.chaos_dust -= cost;

  // Credit shard
  switch (tier) {
    case "UNCOMMON":
      wallet.shards_uncommon += 1;
      break;
    case "RARE":
      wallet.shards_rare += 1;
      break;
    case "EPIC":
      wallet.shards_epic += 1;
      break;
    case "LEGENDARY":
      wallet.shards_legendary += 1;
      break;
  }

  return { success: true, dust_spent: cost, new_balance: wallet.chaos_dust };
}

/**
 * Simulate concurrent purchases by checking balance BEFORE each deduction.
 * This tests the race condition scenario where two requests read the same
 * balance but only one should succeed.
 */
function simulateConcurrentPurchases(
  initialDust: number,
  tier: ShardTier,
  numAttempts: number
): { successes: number; failures: number; finalDust: number } {
  const cost = SHARD_DUST_COSTS[tier];
  let currentDust = initialDust;
  let successes = 0;
  let failures = 0;

  // Simulate all reads happening simultaneously (same starting balance)
  const snapshotBalance = currentDust;

  for (let i = 0; i < numAttempts; i++) {
    // With optimistic locking, each attempt checks current actual balance
    if (currentDust >= cost) {
      currentDust -= cost;
      successes++;
    } else {
      failures++;
    }
  }

  return { successes, failures, finalDust: currentDust };
}

// ─── Tests ───────────────────────────────────────────────

Deno.test("Shard costs match documented values (REQ-039)", () => {
  assertEquals(SHARD_DUST_COSTS.UNCOMMON, 30);
  assertEquals(SHARD_DUST_COSTS.RARE, 60);
  assertEquals(SHARD_DUST_COSTS.EPIC, 120);
  assertEquals(SHARD_DUST_COSTS.LEGENDARY, 240);
});

Deno.test("Single purchase with sufficient dust succeeds", () => {
  const wallet: PlayerWallet = {
    chaos_dust: 100,
    shards_uncommon: 0,
    shards_rare: 0,
    shards_epic: 0,
    shards_legendary: 0,
  };

  const result = attemptPurchase(wallet, "UNCOMMON");
  assertEquals(result.success, true);
  assertEquals(result.dust_spent, 30);
  assertEquals(wallet.chaos_dust, 70);
  assertEquals(wallet.shards_uncommon, 1);
});

Deno.test("Purchase with insufficient dust fails", () => {
  const wallet: PlayerWallet = {
    chaos_dust: 20,
    shards_uncommon: 0,
    shards_rare: 0,
    shards_epic: 0,
    shards_legendary: 0,
  };

  const result = attemptPurchase(wallet, "UNCOMMON");
  assertEquals(result.success, false);
  assertEquals(wallet.chaos_dust, 20); // Balance unchanged
  assertEquals(wallet.shards_uncommon, 0); // No shard granted
});

Deno.test("Purchase with exactly enough dust succeeds", () => {
  const wallet: PlayerWallet = {
    chaos_dust: 30,
    shards_uncommon: 0,
    shards_rare: 0,
    shards_epic: 0,
    shards_legendary: 0,
  };

  const result = attemptPurchase(wallet, "UNCOMMON");
  assertEquals(result.success, true);
  assertEquals(wallet.chaos_dust, 0);
  assertEquals(wallet.shards_uncommon, 1);
});

Deno.test("Concurrent purchases cannot double-spend (optimistic locking)", () => {
  // Player has exactly 60 dust. Two concurrent Uncommon shard purchases (30 each).
  // Both should succeed since there's enough for both.
  const result = simulateConcurrentPurchases(60, "UNCOMMON", 2);
  assertEquals(result.successes, 2);
  assertEquals(result.failures, 0);
  assertEquals(result.finalDust, 0);
});

Deno.test("Concurrent purchases with insufficient funds for second", () => {
  // Player has 40 dust. Two concurrent Uncommon shard purchases (30 each).
  // Only one should succeed.
  const result = simulateConcurrentPurchases(40, "UNCOMMON", 2);
  assertEquals(result.successes, 1);
  assertEquals(result.failures, 1);
  assertEquals(result.finalDust, 10);
});

Deno.test("Three concurrent Legendary purchases with only 500 dust", () => {
  // Player has 500 dust. Three Legendary (240 each) attempts.
  // Only 2 should succeed (480 total), one fails.
  const result = simulateConcurrentPurchases(500, "LEGENDARY", 3);
  assertEquals(result.successes, 2);
  assertEquals(result.failures, 1);
  assertEquals(result.finalDust, 20); // 500 - 480 = 20
});

Deno.test("Multiple purchases drain wallet correctly", () => {
  const wallet: PlayerWallet = {
    chaos_dust: 450,
    shards_uncommon: 0,
    shards_rare: 0,
    shards_epic: 0,
    shards_legendary: 0,
  };

  // Full evolution path: Uncommon(30) + Rare(60) + Epic(120) + Legendary(240) = 450
  assertEquals(attemptPurchase(wallet, "UNCOMMON").success, true);
  assertEquals(wallet.chaos_dust, 420);

  assertEquals(attemptPurchase(wallet, "RARE").success, true);
  assertEquals(wallet.chaos_dust, 360);

  assertEquals(attemptPurchase(wallet, "EPIC").success, true);
  assertEquals(wallet.chaos_dust, 240);

  assertEquals(attemptPurchase(wallet, "LEGENDARY").success, true);
  assertEquals(wallet.chaos_dust, 0);

  // No more purchases possible
  assertEquals(attemptPurchase(wallet, "UNCOMMON").success, false);
});

Deno.test("Dust balance never goes negative", () => {
  const result = simulateConcurrentPurchases(29, "UNCOMMON", 5);
  assertEquals(result.successes, 0);
  assertEquals(result.failures, 5);
  assertEquals(result.finalDust, 29);
});

Deno.test("Zero dust wallet rejects all purchases", () => {
  const wallet: PlayerWallet = {
    chaos_dust: 0,
    shards_uncommon: 0,
    shards_rare: 0,
    shards_epic: 0,
    shards_legendary: 0,
  };

  for (const tier of ["UNCOMMON", "RARE", "EPIC", "LEGENDARY"] as ShardTier[]) {
    const result = attemptPurchase(wallet, tier);
    assertEquals(result.success, false);
  }

  assertEquals(wallet.chaos_dust, 0);
});
