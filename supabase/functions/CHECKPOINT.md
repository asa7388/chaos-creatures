# Edge Functions — Build Checkpoint

**Agent:** edge-functions
**Date:** 2026-02-17
**Status:** COMPLETE

---

## Functions Built (21 total)

### Shared Utilities (4 files)
| File | Description |
|---|---|
| `_shared/supabase.ts` | Supabase client initialization (service role + user-scoped) |
| `_shared/auth.ts` | JWT extraction, auth user lookup, player ID resolution |
| `_shared/errors.ts` | Standardized error codes, response helpers, CORS handling |
| `_shared/types.ts` | All TypeScript types, enums, and game constants |
| `_shared/deck-validator.ts` | Shared deck validation logic (used by save-deck and validate-deck) |

### Collection Service (2 functions)
| Function | Method | Path | Description |
|---|---|---|---|
| `get-collection` | GET | `/collection/cards` | Paginated collection with faction/tier/sort filtering |
| `get-card` | GET | `/collection/cards/{id}` | Single card instance with template details |

### Deck Service (3 functions)
| Function | Method | Path | Description |
|---|---|---|---|
| `get-decks` | GET | `/decks` | All player decks |
| `save-deck` | POST/PUT | `/decks` | Create or update deck with full validation |
| `validate-deck` | POST | `/decks/validate` | Dry-run validation (no save) |

### Economy Service (3 functions)
| Function | Method | Path | Description |
|---|---|---|---|
| `purchase-shards` | POST | `/economy/purchase/shard` | Atomic dust-to-shard with double-spend prevention |
| `open-pack` | POST | `/economy/purchase/card-pack` | 3 random Commons with duplicate protection |
| `get-economy-status` | GET | `/economy/balance` | Dust, shards, subscription tier, active missions |

### Evolution Service (2 functions)
| Function | Method | Path | Description |
|---|---|---|---|
| `start-evolution` | POST | `/evolution/start` | Eligibility check, shard deduction, AI job creation |
| `complete-evolution` | POST | `/evolution/{id}/confirm` | Finalize with modifier/name, stats, history |

### Quest Service (3 functions)
| Function | Method | Path | Description |
|---|---|---|---|
| `get-quests` | GET | `/economy/missions` | Active daily/weekly/onboarding quests |
| `evaluate-quests` | POST | `/evaluate-quests` | Match-triggered progress with subscriber bonus |
| `refresh-daily-quests` | CRON | (pg_cron daily) | Generate 3 daily + 2 weekly (Mondays) quests |

### Achievement Service (2 functions)
| Function | Method | Path | Description |
|---|---|---|---|
| `evaluate-achievements` | POST | `/evaluate-achievements` | Idempotent evaluation with double-grant prevention |
| `check-missed-achievements` | POST | `/check-missed-achievements` | Login retroactive check (delegates to evaluate) |

### Matchmaking Service (2 functions)
| Function | Method | Path | Description |
|---|---|---|---|
| `join-queue` | POST | `/matchmaking/queue` | Deck validation + MMR insertion |
| `leave-queue` | DELETE | `/matchmaking/queue` | Remove from queue |

### Subscription Service (2 functions)
| Function | Method | Path | Description |
|---|---|---|---|
| `sync-entitlements` | POST | `/sync-entitlements` | StoreKit 2 transaction sync, tier update |
| `monthly-rewards` | CRON | (pg_cron monthly) | HIGH-tier Legendary shard, MID/HIGH bonus Commons |

### Faction Mastery (1 function)
| Function | Method | Path | Description |
|---|---|---|---|
| `update-mastery` | POST | `/update-mastery` | +10 XP/game +5 win, level-up with unlocks |

---

## Tests (32 passing)

| Test File | Tests | Coverage |
|---|---|---|
| `tests/deck-validation.test.ts` | 12 | All REQ-164 invalid configurations |
| `tests/economy-double-spend.test.ts` | 10 | Concurrent spend prevention, all shard tiers |
| `tests/achievement-idempotency.test.ts` | 10 | REQ-187/188 double-grant prevention |

```
deno test supabase/functions/tests/ --allow-env
ok | 32 passed | 0 failed
```

---

## Design Decisions

1. **Faction mastery storage:** No dedicated `faction_mastery` table exists in migrations. Used `economy_config` table with key pattern `mastery:{player_id}:{faction_id}` as a lightweight key-value store.

2. **Evolution energy model:** `chaos_energy` on `card_instances` is cumulative. The thresholds check against cumulative values (15/45/95/170) not per-step values.

3. **Quest reward auto-grant:** Quests are auto-completed and auto-claimed when progress reaches target during `evaluate-quests`. The subscriber multiplier (1.0x/1.5x/2.0x) is applied server-side from the player's `subscription_tier`.

4. **Double-spend prevention:** Uses PostgreSQL's `WHERE chaos_dust >= cost` pattern in UPDATE statements. If two concurrent requests read the same balance, only the first UPDATE succeeds; the second finds 0 rows affected and returns an error.

5. **Achievement idempotency:** Uses `is_unlocked = false` as a WHERE guard on UPDATE. Duplicate INSERT is caught by unique constraint (`player_id, achievement_id`). Rewards are only granted on the first successful unlock.

6. **StoreKit 2 verification:** MVP uses client-side JWS verification. Server-side App Store Server API verification is marked as TODO for pre-scale hardening.

---

## REQ Coverage

| REQ | Status | Implementation |
|---|---|---|
| REQ-035 | DONE | Deck slot limits by tier in `save-deck` |
| REQ-038 | DONE | Subscriber quest multiplier in `evaluate-quests` |
| REQ-039 | DONE | Shard costs (30/60/120/240) in `purchase-shards` |
| REQ-041 | DONE | Monthly Legendary shard in `monthly-rewards` |
| REQ-162 | DONE | Atomic transactions in all economy functions |
| REQ-164 | DONE | All deck validation rules in `deck-validator.ts` |
| REQ-187 | DONE | Idempotent achievement grants in `evaluate-achievements` |
| REQ-188 | DONE | One-time granted flag prevents double-grant |
| REQ-189 | DONE | Retroactive check in `check-missed-achievements` |
| REQ-191 | DONE | Faction mastery XP and level-up in `update-mastery` |
