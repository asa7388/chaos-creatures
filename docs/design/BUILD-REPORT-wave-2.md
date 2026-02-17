# Build Validation — Wave 2

**Date:** 2026-02-17
**Branch:** main
**Validator:** build-validation agent

| Module | Build | Tests | Errors |
|---|---|---|---|
| supabase | PASS | N/A | WARN: APPLE_CLIENT_ID / APPLE_CLIENT_SECRET env vars unset (non-fatal) |
| game-server | FAIL | 318/319 pass (1 failed) | TS2367 in src/engine/turn.ts:159 |
| edge-functions | PASS | 32/32 pass | None |
| admin-dashboard | PASS | N/A | None |
| ios | SKIP | N/A | No valid Xcode project file — needs manual Xcode project setup |

---

## Build Errors

### game-server — TypeScript Compilation FAIL

**Command:** `cd packages/game-server && npm run build`
**Exit code:** 2

```
src/engine/turn.ts(159,33): error TS2367: This comparison appears to be unintentional because the types 'EventType' and '"NOTHING"' have no overlap.
```

**Location:** `packages/game-server/src/engine/turn.ts`, line 159, column 33

**Code at that line:**
```typescript
export function resolveEventResolution(state: GameState): EventResolutionResult | null {
  if (!state.last_roll_event || state.last_roll_event === 'NOTHING') {
    return null;
  }
  // ...
}
```

**Root cause:** The `EventType` union type does not include the string literal `"NOTHING"`. The comparison `state.last_roll_event === 'NOTHING'` is flagged as unintentional by TypeScript because `"NOTHING"` is not a member of the `EventType` enum/union. TypeScript strict mode (`strictNullChecks` or `noUncheckedIndexedAccess`) flags this as TS2367 "no overlap."

**Impact:** The TypeScript compiler exits with code 2, meaning no compiled JavaScript output is produced. The `dist/` directory is not generated. The game server cannot be started in production.

---

### admin-dashboard — npm audit warnings (non-blocking)

**Command:** `cd packages/admin-dashboard && npm install`
**Exit code:** 0 (install succeeded)

```
1 high severity vulnerability
To address all issues (including breaking changes), run: npm audit fix --force
```

**Note:** This is a dependency audit warning only. The build itself (`npm run build`) completed successfully with no errors.

---

### ios — SKIP

**Command:** `ls ChaosCreatures/ChaosCreatures.xcodeproj/project.pbxproj`
**Result:** File does not exist.

```
ls: /Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures.xcodeproj/project.pbxproj: No such file or directory
```

The directory `ChaosCreatures/ChaosCreatures.xcodeproj/` exists but is completely empty (0 bytes, no `project.pbxproj`). The Xcode project has not been created yet. No xcodebuild was attempted.

**Reason for SKIP:** No valid Xcode project file — needs manual Xcode project setup.

---

### supabase — WARN (non-fatal)

**Command:** `supabase db reset`
**Exit code:** 0 (success)

```
WARN: environment variable is unset: APPLE_CLIENT_ID
WARN: environment variable is unset: APPLE_CLIENT_SECRET
```

These warnings appear because `supabase/config.toml` references Apple OAuth environment variables that are not set in the local dev environment. They are warnings only — migrations applied and completed successfully. All 12 migration files applied in order:

```
00001_enums.sql          ✓
00002_core_tables.sql    ✓
00003_battle_tables.sql  ✓
00004_economy_tables.sql ✓
00005_social_tables.sql  ✓
00006_content_tables.sql ✓
00007_generation_tables.sql ✓
00008_season_tables.sql  ✓
00009_admin_tables.sql   ✓
00010_indexes.sql        ✓
00011_rls_policies.sql   ✓
00012_triggers.sql       ✓
seed.sql                 ✓
```

---

## Test Failures

### game-server — 1 test failed

**Test file:** `tests/turn.test.ts`
**Test name:** `executeAutomaticPhases > should draw a card during phase 4`

```
FAIL  tests/turn.test.ts > executeAutomaticPhases > should draw a card during phase 4
AssertionError: expected 6 to be 5 // Object.is equality

- Expected
+ Received

- 5
+ 6

 ❯ tests/turn.test.ts:523:40
    521|     const handBefore = state.player_1.hand.length;
    522|     executeAutomaticPhases(state);
    523|     expect(state.player_1.hand.length).toBe(handBefore + 1);
       |                                        ^
    524|   });
```

**Analysis:** The test expects the hand to increase by exactly 1 after `executeAutomaticPhases`. The actual hand size increased by 2 (`6` instead of expected `5`). This suggests `executeAutomaticPhases` is drawing 2 cards when it should draw 1, or drawing a card in an unexpected phase in addition to phase 4.

**All other test suites passed:**

| Test file | Tests | Status |
|---|---|---|
| tests/ai-pipeline/fallback-art.test.ts | 12 | PASS |
| tests/ai-pipeline/openai-client.test.ts | 17 | PASS |
| tests/ai-pipeline/prompts.test.ts | 31 | PASS |
| tests/messages.test.ts | 31 | PASS |
| tests/combat.test.ts | 44 | PASS |
| tests/rng.test.ts | 12 | PASS |
| tests/match.test.ts | 22 | PASS |
| tests/instability.test.ts | 15 | PASS |
| tests/events.test.ts | 23 | PASS |
| tests/effects.test.ts | 41 | PASS |
| tests/turn.test.ts | 49/50 | FAIL (1) |
| tests/ai-pipeline/fal-client.test.ts | 11 | PASS |
| tests/ai-pipeline/r2-keys.test.ts | 10 | PASS |

---

## Summary

- **Total modules checked:** 5
- **Passed:** 3 (edge-functions, admin-dashboard, supabase)
- **Failed:** 1 (game-server — TypeScript build error + 1 test failure)
- **Skipped:** 1 (ios — no Xcode project file)

### Action Items Required

1. **game-server (BLOCKING):** Fix TS2367 in `packages/game-server/src/engine/turn.ts:159`. The `'NOTHING'` literal must either be added to the `EventType` union type, or the comparison must be removed/refactored to use the correct type guard. The server cannot produce a compiled build until this is resolved.

2. **game-server (NON-BLOCKING):** Fix the failing test `executeAutomaticPhases > should draw a card during phase 4` in `tests/turn.test.ts:523`. The function draws 2 cards instead of 1 during automatic phases.

3. **ios (BLOCKING for App Store):** The Xcode project (`ChaosCreatures.xcodeproj/project.pbxproj`) has never been created. The iOS app cannot be built or submitted until a valid Xcode project is generated. This requires opening Xcode, creating a new project, and configuring it per the architecture docs.

4. **admin-dashboard (NON-BLOCKING):** 1 high severity npm vulnerability in dependencies. Run `npm audit` in `packages/admin-dashboard/` to review and decide whether to address before production deploy.

5. **supabase (NON-BLOCKING):** Set `APPLE_CLIENT_ID` and `APPLE_CLIENT_SECRET` environment variables to suppress Apple OAuth warnings during local development.
