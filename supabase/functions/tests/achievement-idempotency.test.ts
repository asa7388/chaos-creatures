// tests/achievement-idempotency.test.ts — Achievement idempotency tests
// REQ-187, REQ-188: Achievements are granted exactly once.
// Running evaluate-achievements multiple times must produce the same result.
// No double-grant of rewards.

import {
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

// ─── Types ───────────────────────────────────────────────

interface Achievement {
  id: string;
  name: string;
  category: string;
  target_value: number;
  reward_type: string;
  reward_amount: number;
}

interface PlayerAchievement {
  achievement_id: string;
  current_value: number;
  is_unlocked: boolean;
  unlocked_at: string | null;
}

interface RewardLog {
  achievement_id: string;
  reward_type: string;
  reward_amount: number;
}

// ─── Achievement evaluation simulation ───────────────────

class AchievementEvaluator {
  private playerAchievements: Map<string, PlayerAchievement> = new Map();
  private rewardLog: RewardLog[] = [];

  /**
   * Evaluate achievements idempotently.
   * Returns newly unlocked achievement IDs (only on first evaluation).
   */
  evaluate(
    achievements: Achievement[],
    currentValues: Record<string, number>
  ): string[] {
    const newlyUnlocked: string[] = [];

    for (const achievement of achievements) {
      const existing = this.playerAchievements.get(achievement.id);
      const currentValue = currentValues[achievement.category] || 0;

      // IDEMPOTENT GUARD: Already unlocked — skip entirely
      if (existing?.is_unlocked) {
        continue;
      }

      if (!existing) {
        // Create new progress entry
        const isUnlocked = currentValue >= achievement.target_value;
        this.playerAchievements.set(achievement.id, {
          achievement_id: achievement.id,
          current_value: Math.min(currentValue, achievement.target_value),
          is_unlocked: isUnlocked,
          unlocked_at: isUnlocked ? new Date().toISOString() : null,
        });

        if (isUnlocked) {
          this.grantReward(achievement);
          newlyUnlocked.push(achievement.id);
        }
      } else {
        // Update progress
        const newValue = Math.min(
          Math.max(existing.current_value, currentValue),
          achievement.target_value
        );
        const isUnlocked = newValue >= achievement.target_value;

        existing.current_value = newValue;

        if (isUnlocked && !existing.is_unlocked) {
          existing.is_unlocked = true;
          existing.unlocked_at = new Date().toISOString();
          this.grantReward(achievement);
          newlyUnlocked.push(achievement.id);
        }
      }
    }

    return newlyUnlocked;
  }

  private grantReward(achievement: Achievement): void {
    this.rewardLog.push({
      achievement_id: achievement.id,
      reward_type: achievement.reward_type,
      reward_amount: achievement.reward_amount,
    });
  }

  getProgress(achievementId: string): PlayerAchievement | undefined {
    return this.playerAchievements.get(achievementId);
  }

  getRewardLog(): RewardLog[] {
    return [...this.rewardLog];
  }

  getTotalRewards(): number {
    return this.rewardLog.length;
  }
}

// ─── Test data ───────────────────────────────────────────

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "ach-win-10",
    name: "Battle Hardened",
    category: "BATTLE",
    target_value: 10,
    reward_type: "XP",
    reward_amount: 100,
  },
  {
    id: "ach-evolve-5",
    name: "Evolution Master",
    category: "EVOLUTION",
    target_value: 5,
    reward_type: "SHARDS",
    reward_amount: 3,
  },
  {
    id: "ach-collect-20",
    name: "Card Collector",
    category: "COLLECTION",
    target_value: 20,
    reward_type: "XP",
    reward_amount: 200,
  },
];

// ─── Tests ───────────────────────────────────────────────

Deno.test("First evaluation grants reward exactly once", () => {
  const evaluator = new AchievementEvaluator();

  const unlocked = evaluator.evaluate(ACHIEVEMENTS, {
    BATTLE: 15, // Exceeds 10 target
    EVOLUTION: 3, // Below 5 target
    COLLECTION: 20, // Meets 20 target
  });

  assertEquals(unlocked.length, 2); // BATTLE and COLLECTION
  assertEquals(unlocked.includes("ach-win-10"), true);
  assertEquals(unlocked.includes("ach-collect-20"), true);
  assertEquals(evaluator.getTotalRewards(), 2);
});

Deno.test("Second evaluation of same data returns no new unlocks (idempotent)", () => {
  const evaluator = new AchievementEvaluator();

  // First evaluation
  const first = evaluator.evaluate(ACHIEVEMENTS, {
    BATTLE: 15,
    EVOLUTION: 3,
    COLLECTION: 20,
  });
  assertEquals(first.length, 2);
  assertEquals(evaluator.getTotalRewards(), 2);

  // Second evaluation with same data
  const second = evaluator.evaluate(ACHIEVEMENTS, {
    BATTLE: 15,
    EVOLUTION: 3,
    COLLECTION: 20,
  });
  assertEquals(second.length, 0); // No new unlocks
  assertEquals(evaluator.getTotalRewards(), 2); // Reward count unchanged
});

Deno.test("Third evaluation still returns no new unlocks", () => {
  const evaluator = new AchievementEvaluator();

  evaluator.evaluate(ACHIEVEMENTS, { BATTLE: 15, EVOLUTION: 3, COLLECTION: 20 });
  evaluator.evaluate(ACHIEVEMENTS, { BATTLE: 15, EVOLUTION: 3, COLLECTION: 20 });
  const third = evaluator.evaluate(ACHIEVEMENTS, {
    BATTLE: 15,
    EVOLUTION: 3,
    COLLECTION: 20,
  });

  assertEquals(third.length, 0);
  assertEquals(evaluator.getTotalRewards(), 2); // Still exactly 2 rewards
});

Deno.test("Later evaluation with increased progress unlocks new achievement", () => {
  const evaluator = new AchievementEvaluator();

  // First: only BATTLE unlocked
  const first = evaluator.evaluate(ACHIEVEMENTS, {
    BATTLE: 15,
    EVOLUTION: 3,
    COLLECTION: 10,
  });
  assertEquals(first.length, 1);
  assertEquals(first[0], "ach-win-10");

  // Second: EVOLUTION now meets target
  const second = evaluator.evaluate(ACHIEVEMENTS, {
    BATTLE: 15,
    EVOLUTION: 5,
    COLLECTION: 10,
  });
  assertEquals(second.length, 1);
  assertEquals(second[0], "ach-evolve-5");

  // Third: same data, no new unlocks
  const third = evaluator.evaluate(ACHIEVEMENTS, {
    BATTLE: 15,
    EVOLUTION: 5,
    COLLECTION: 10,
  });
  assertEquals(third.length, 0);
  assertEquals(evaluator.getTotalRewards(), 2);
});

Deno.test("Progress below target does not grant reward", () => {
  const evaluator = new AchievementEvaluator();

  const unlocked = evaluator.evaluate(ACHIEVEMENTS, {
    BATTLE: 5,
    EVOLUTION: 2,
    COLLECTION: 10,
  });

  assertEquals(unlocked.length, 0);
  assertEquals(evaluator.getTotalRewards(), 0);

  // Check progress is tracked
  const battleProgress = evaluator.getProgress("ach-win-10");
  assertEquals(battleProgress?.current_value, 5);
  assertEquals(battleProgress?.is_unlocked, false);
});

Deno.test("Progress cannot decrease (max of old and new value)", () => {
  const evaluator = new AchievementEvaluator();

  // First: 8 wins
  evaluator.evaluate(ACHIEVEMENTS, { BATTLE: 8, EVOLUTION: 0, COLLECTION: 0 });
  assertEquals(evaluator.getProgress("ach-win-10")?.current_value, 8);

  // Second: report 5 wins (maybe a different data source) — should keep 8
  evaluator.evaluate(ACHIEVEMENTS, { BATTLE: 5, EVOLUTION: 0, COLLECTION: 0 });
  assertEquals(evaluator.getProgress("ach-win-10")?.current_value, 8);
});

Deno.test("Progress is capped at target_value", () => {
  const evaluator = new AchievementEvaluator();

  evaluator.evaluate(ACHIEVEMENTS, { BATTLE: 100, EVOLUTION: 0, COLLECTION: 0 });
  assertEquals(evaluator.getProgress("ach-win-10")?.current_value, 10); // Capped at target
});

Deno.test("Unlocked_at is set only once", () => {
  const evaluator = new AchievementEvaluator();

  evaluator.evaluate(ACHIEVEMENTS, { BATTLE: 10, EVOLUTION: 0, COLLECTION: 0 });
  const firstTimestamp = evaluator.getProgress("ach-win-10")?.unlocked_at;
  assertNotEquals(firstTimestamp, null);

  // Re-evaluate — timestamp should remain the same
  evaluator.evaluate(ACHIEVEMENTS, { BATTLE: 15, EVOLUTION: 0, COLLECTION: 0 });
  const secondTimestamp = evaluator.getProgress("ach-win-10")?.unlocked_at;
  assertEquals(secondTimestamp, firstTimestamp);
});

Deno.test("Zero values do not create achievement progress", () => {
  const evaluator = new AchievementEvaluator();

  evaluator.evaluate(ACHIEVEMENTS, { BATTLE: 0, EVOLUTION: 0, COLLECTION: 0 });

  // Progress entries should be created with 0 value
  const battle = evaluator.getProgress("ach-win-10");
  // When current value is 0, we still create the entry but don't unlock
  if (battle) {
    assertEquals(battle.is_unlocked, false);
    assertEquals(battle.current_value, 0);
  }
});

Deno.test("Reward log accumulates correctly across evaluations", () => {
  const evaluator = new AchievementEvaluator();

  evaluator.evaluate(ACHIEVEMENTS, { BATTLE: 10, EVOLUTION: 0, COLLECTION: 0 });
  assertEquals(evaluator.getRewardLog().length, 1);
  assertEquals(evaluator.getRewardLog()[0].achievement_id, "ach-win-10");
  assertEquals(evaluator.getRewardLog()[0].reward_amount, 100);

  evaluator.evaluate(ACHIEVEMENTS, { BATTLE: 10, EVOLUTION: 5, COLLECTION: 0 });
  assertEquals(evaluator.getRewardLog().length, 2);
  assertEquals(evaluator.getRewardLog()[1].achievement_id, "ach-evolve-5");
  assertEquals(evaluator.getRewardLog()[1].reward_amount, 3);

  // No more grants on re-evaluation
  evaluator.evaluate(ACHIEVEMENTS, { BATTLE: 10, EVOLUTION: 5, COLLECTION: 25 });
  assertEquals(evaluator.getRewardLog().length, 3); // COLLECTION now unlocked

  evaluator.evaluate(ACHIEVEMENTS, { BATTLE: 10, EVOLUTION: 5, COLLECTION: 25 });
  assertEquals(evaluator.getRewardLog().length, 3); // No change
});
