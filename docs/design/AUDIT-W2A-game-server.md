# AUDIT-W2A: Game Server Implementation vs Spec

**Audit Date**: 2026-02-17
**Auditor**: Claude Code (Wave 2A — Game Server Audit)
**Scope**: All files under `packages/game-server/src/` compared against `docs/design/01-battle-mechanics.md` and `docs/design/06-technical-architecture.md`

---

## Files Audited (27)

### Engine (`src/engine/`)
- `index.ts` — Barrel exports
- `turn.ts` — 9-phase turn engine
- `combat.ts` — Combat resolution with keyword priority
- `effects.ts` — Effect resolution & triggered abilities
- `events.ts` — 8 Order + 8 Chaos events
- `instability.ts` — Instability formula & recalculation
- `match.ts` — Match lifecycle (create, store, end, forfeit, reconnect)
- `rng.ts` — Seeded PRNG (mulberry32)
- `constants.ts` — All game constants

### Bot (`src/bot/`)
- `ai.ts` — Bot deck builder, main phase, attackers, blockers AI
- `runner.ts` — Bot turn orchestrator

### WebSocket (`src/ws/`)
- `handler.ts` — Supabase Realtime match handler
- `protocol.ts` — Zod-validated message parsing
- `rooms.ts` — Match room management

### Services (`src/services/`)
- `matchmaking.ts` — Queue polling, rank-based matching
- `timer.ts` — Decision timers (60s turn, 10s event)
- `reconnection.ts` — Disconnect tracking, grace period
- `supabase.ts` — Service role Supabase client
- `fal-client.ts` — fal.ai image generation
- `openai-client.ts` — GPT-4o Mini text generation
- `fallback-art.ts` — SVG-based fallback card art
- `r2.ts` — Cloudflare R2 storage

### Types (`src/types/`)
- `enums.ts` — All game enums
- `game-state.ts` — Full type definitions
- `messages.ts` — Client/server message schemas
- `index.ts` — Barrel exports

### Config (`src/`)
- `config.ts` — Zod-validated environment config
- `index.ts` — Express entry point + API routes

---

## 1. Turn Engine

### Phase Coverage

| # | Phase | Spec Section | Status | Notes |
|---|-------|-------------|--------|-------|
| 1 | START_OF_TURN | 01-BM Section 3 Phase 1 | PASS | Increments turn, fires Corruption self-damage left-to-right, processes deaths, recalculates instability |
| 2 | CHAOS_ROLL | 01-BM Section 3 Phase 2 | PASS | D20 roll via seeded RNG, compares to instability, updates attunement on all modifiers |
| 3 | EVENT_RESOLUTION | 01-BM Section 3 Phase 3 | PASS (with issues) | Delegates to `events.ts`. See Section 6 for event-specific bugs |
| 4 | DRAW_AND_MANA | 01-BM Section 3 Phase 4 | PASS | Draw 1 card, gain 1 mana (unspent carries over, cap 10). Matches spec |
| 5 | MAIN_PHASE | 01-BM Section 3 Phase 5 | PASS (partial) | Play creatures and stabilizers works. Spell resolution is a stub (see CRIT-01) |
| 6 | DECLARE_ATTACKERS | 01-BM Section 3 Phase 6 | PASS | Validates Taunt forced-attack minimum, P1 Turn 1 restriction, no stabilizer attacks, fires ON_ATTACK triggers |
| 7 | ASSIGN_BLOCKERS | 01-BM Section 3 Phase 7 | PASS | Validates Flying/Reach rules, Taunt forced-block, one blocker per attacker, fires ON_BLOCK triggers |
| 8 | COMBAT_RESOLUTION | 01-BM Section 3 Phase 8 | PASS | Full keyword priority algorithm. See Section 3 for details |
| 9 | END_TURN | 01-BM Section 3 Phase 9 | PASS | Expires temp buffs, resets has_attacked, clears combat state, switches active player |

### Automatic Phase Execution

`executeAutomaticPhases()` runs phases 1-4 in sequence with win-condition checks between each phase. Correctly handles:
- Corruption self-damage killing active player at start of turn
- Events causing lethal damage to either player
- Simultaneous death (active player loses) during event resolution

### Phase Transition Flow

The handler (`ws/handler.ts`) correctly manages the full flow:
1. `startNextTurn()` -> auto phases 1-4 -> broadcasts all events -> sets MAIN_PHASE
2. Player actions during MAIN_PHASE (play cards, use Chaos Spark)
3. END_MAIN_PHASE -> DECLARE_ATTACKERS -> player declares
4. DECLARE_ATTACKERS -> ASSIGN_BLOCKERS -> defender assigns
5. ASSIGN_BLOCKERS -> COMBAT_RESOLUTION -> END_TURN -> next turn

### Mana System

- `current_mana` starts at 0, gains +1 per turn up to `mana_cap` (10). **Matches spec.**
- Unspent mana carries over (only adds 1, doesn't reset). **Matches spec.**
- Chaos Spark (P2 only) grants +1 mana, capped at `mana_cap`. **Matches spec.**

### Opening Hands

- P1: 4 cards (`P1_HAND_SIZE = 4`). **Matches spec.**
- P2: 5 cards (`P2_HAND_SIZE = 5`) + Chaos Spark. **Matches spec.**

---

## 2. Combat Resolution

### Keyword Priority Algorithm

The `resolveCombatPair()` function in `combat.ts` implements the spec's keyword priority:

1. **Shield absorb** (both sides): If defender has Shield, all attacker damage is absorbed, Shield breaks. Same for attacker's Shield vs blocker damage. **PASS**
2. **Deal damage** (simultaneous): Both sides take damage at once. **PASS**
3. **Deathtouch check**: If damage > 0 from a Deathtouch creature, target is killed regardless of remaining HP. **PASS**
4. **Normal death check**: Health <= 0 means death. **PASS**
5. **Piercing overflow**: Excess attacker damage (ATK - blocker HP before combat) goes to defending player face. Blocked by Shield absorb (no pierce if shield absorbed). **PASS**
6. **Lifesteal heal**: Both attacker and blocker can Lifesteal. Heal amount equals damage dealt (not excess). Capped at max_hp. **PASS**

### Blocker Assignment Rules

- Each blocker blocks exactly one attacker. **PASS** (matches spec: "Each blocker can only block one attacker")
- Each attacker can only be blocked by one creature. **PASS** (matches spec: "Each attacker can only be blocked by one creature")
- Flying creatures can only be blocked by Flying or Reach. **PASS**
- Taunt creatures MUST block if they can legally block any unblocked attacker. **PASS**
- Stabilizers cannot block. **PASS**

### Unblocked Attackers

- Deal full ATK as face damage to defending player. **PASS**
- Lifesteal on unblocked damage heals the attacking player. **PASS**

### Death Processing

- `processDeaths()` fires ON_DEATH abilities left-to-right (slot 0 -> slot 4). **PASS**
- Active player's deaths are processed first in combat. **PASS**
- Dead creatures are removed from board and placed in graveyard. **PASS**
- Instability is recalculated after deaths. **PASS**

### Simultaneous Death Rule

`resolveCombat()` checks if both players hit 0 HP. If so, the defending player (non-active) wins. **PASS** — matches spec: "active player loses."

### P1 Turn 1 No-Attack Rule

`validateDeclareAttackers()` returns `{ valid: false }` if `current_turn === 1` and `active_player === first_player`. **PASS**

---

## 3. Keywords (7)

| Keyword | Implemented | Spec Match | Notes |
|---------|------------|------------|-------|
| SHIELD | Yes | PASS | Absorbs ALL first damage instance, then breaks. Removes from active_keywords on break. Both combat and effect damage check Shield via `applyDamageToCreature()` |
| LIFESTEAL | Yes | PASS | Heals owner for damage dealt (combat and unblocked). Capped at max_hp |
| FLYING | Yes | PASS | Can only be blocked by Flying or Reach. Validated in `validateBlockerAssignments()` |
| REACH | Yes | PASS | Can block Flying creatures. No other special behavior |
| DEATHTOUCH | Yes | PASS | Any non-zero damage kills target. Checked after simultaneous damage step |
| TAUNT | Yes | PASS | Two-part rule: (1) forces minimum attackers equal to min(opponent Taunt count, attackable creature count); (2) Taunt creatures must block if able |
| PIERCING | Yes | PASS | Excess damage (ATK - blocker pre-combat HP) goes to face. Blocked by Shield absorb. Only applies to attacker, not blocker |

### Keyword Interaction Edge Cases

- **Shield + Deathtouch**: Shield absorbs damage, so Deathtouch doesn't trigger (damage = 0). **Correct.**
- **Shield + Piercing**: Shield absorbs damage, so no Piercing overflow. Code explicitly checks `!blockerShieldBroke`. **Correct.**
- **Deathtouch + Piercing**: If attacker has both and blocker has no Shield, Deathtouch kills blocker and Piercing calculates overflow from ATK - blocker HP. **Correct.**

---

## 4. Instability System

### Formula

`calculatePlayerInstability()` in `instability.ts`:
```
player_instability = avatar_modifier + SUM(creature_instability for each board creature)
```

`calculateCreatureInstability()`:
```
creature_instability = base_instability + SUM(modifier.instability_adjustment for active/always-on modifiers)
clamped to min 0
```

Player instability clamped to [1, 20] via `INSTABILITY_MIN` and `INSTABILITY_MAX`. **Matches spec.**

### Recalculation Triggers

Instability is recalculated:
- At start of turn (after Corruption deaths). **PASS**
- After Chaos Roll (attunement state changes may affect modifier instability adjustments). **PASS**
- After event resolution (board changes). **PASS**
- After playing a card (new creature on board). **PASS**
- After combat (creature deaths). **PASS**

### D20 Chaos Roll Logic

```
roll < instability -> CHAOS
roll > instability -> ORDER
roll === instability -> NOTHING
```

**PASS** — matches spec exactly.

### Attunement State Updates

After a Chaos Roll, all modifiers on the active player's creatures are updated:
- `is_attuned_active = (modifier.attunement === result)`
- `is_penalty_active = (modifier.has_penalty && modifier.attunement !== result)`

Then `recalculateAllCreatureStats()` is called to apply/remove attunement bonuses. **PASS**

---

## 5. D20 Chaos Roll

- Uses seeded PRNG (`SeededRNG.fromState()`). **PASS**
- Roll range: `D20_MIN` (1) to `D20_MAX` (20). **PASS**
- RNG counter is persisted to `state.rng_counter` after each use. **PASS**
- `last_roll_value` and `last_roll_event` are stored on state. **PASS**

---

## 6. Events

### Order Events (O1-O8)

| ID | Name | Spec Effect | Implemented | Status |
|----|------|-------------|------------|--------|
| O1 | Mending Light | Heal most damaged creature 3 HP | `HEAL, LOWEST_HP_FRIENDLY, 3` | PASS |
| O2 | Planar Ward | Grant Shield to chosen friendly (no Shield yet) | `GRANT_KEYWORD, FRIENDLY_CREATURE, SHIELD, PERMANENT` | PASS — `eventRequiresChoice('O2')` returns true |
| O3 | Steady Growth | All friendlies +0/+1 permanent | `STAT_MODIFY_HEALTH, ALL_FRIENDLY, 1, PERMANENT` | PASS |
| O4 | Clarity | Draw 1 card | `DRAW_CARD, PLAYER_SELF, 1` | PASS |
| O5 | Fortify | Chosen friendly +1/+1 permanent | `STAT_MODIFY_ATTACK, FRIENDLY_CREATURE, 1, PERMANENT` + secondary `STAT_MODIFY_HEALTH, FRIENDLY_CREATURE, 1, PERMANENT` | PASS — `eventRequiresChoice('O5')` returns true |
| O6 | Sanctuary | Heal avatar 3 HP | `HEAL_PLAYER, PLAYER_SELF, 3` | PASS |
| O7 | Bulwark | Lowest HP friendly +0/+2 permanent | `STAT_MODIFY_HEALTH, LOWEST_HP_FRIENDLY, 2, PERMANENT` | PASS |
| O8 | Harmonize | All friendlies heal 2 HP; full HP creatures get +0/+1 instead | `HEAL, ALL_FRIENDLY, 2` + special-case code | WARN (see WARN-01) |

### Chaos Events (C1-C8)

| ID | Name | Spec Effect | Implemented | Status |
|----|------|-------------|------------|--------|
| C1 | Surge | Random friendly +3 ATK this turn | `STAT_MODIFY_ATTACK, RANDOM_FRIENDLY, 3, THIS_TURN` | PASS |
| C2 | Wildfire | 2 damage to random enemy creature | `DAMAGE, RANDOM_ENEMY, 2` | PASS |
| C3 | Upheaval | 1 damage to ALL creatures | `DAMAGE, ALL_CREATURES, 1` | PASS |
| C4 | Frenzy | All friendlies +1 ATK this turn | `STAT_MODIFY_ATTACK, ALL_FRIENDLY, 1, THIS_TURN` | PASS |
| C5 | Rift Bolt | 3 damage to enemy avatar | `DAMAGE, PLAYER_OPPONENT, 3` | PASS |
| C6 | Chaos Siphon | 2 damage to random friendly; that creature +3 ATK permanent | See CRIT-02 | FAIL |
| C7 | Maelstrom | 3 damage to random creature (any side) | `DAMAGE, RANDOM_ANY, 3` | PASS |
| C8 | Overcharge | Random friendly +2 ATK + Piercing this turn; already has Piercing = +4 ATK instead | See CRIT-03 | FAIL |

### Event Selection

Equal weight (12.5% each) via seeded RNG. Pool size constant `EVENT_POOL_SIZE = 8`. **PASS**

### Event Choice Handling

`eventRequiresChoice()` correctly identifies O2 and O5 as requiring player choice. `getValidEventTargets()` returns valid creature IDs. However, the CHOOSE_EVENT_TARGET handler in `ws/handler.ts` is a stub (just `break`). See HIGH-01.

### Triggered Abilities on Events

After event resolution, `resolveTriggeredAbilities()` fires ON_ORDER or ON_CHAOS triggers left-to-right (slot 0->4) on the active player's board. **PASS**

---

## 7. Bot AI

### Deck Building (`buildBotDeck`)

- Queries `card_templates` from Supabase for CREATURE and SPELL types. **PASS**
- Target composition: 16 creatures + 4 spells. **PASS**
- Mana curve prioritization: 2-4 cost preferred, then 1, then 5+. **PASS**
- Max 2 copies per template. **PASS**
- Fallback deck: 20 hardcoded vanilla creatures if DB is empty. **PASS**
- Bot uses synthetic UUIDs (no real card_instances). **PASS**

### AI Decisions

| Decision | Strategy | Notes |
|----------|----------|-------|
| Main Phase | Greedy mana use: play most expensive creature first | Correct. Skips spells (no targeting logic) |
| Declare Attackers | Attack with ALL creatures | Aggressive but simple. Respects P1 Turn 1 restriction |
| Assign Blockers | Taunt creatures block first; then weakest blocker vs strongest attacker; only blocks ATK >= 3 or if bot HP <= 8 | Reasonable strategy |

### Bot Turn Orchestration (`runner.ts`)

- Think delay: 1500ms before first action. **PASS**
- Action delay: 800ms between card plays. **PASS**
- Block delay: 1000ms before blocker assignment. **PASS**
- Full turn sequence: think -> play cards -> transition to DECLARE_ATTACKERS -> declare all attackers -> wait for human blockers or skip to end. **PASS**
- Prevents double-execution: `performBotEndOfTurn()` uses `startNextTurn()` which itself checks `shouldBotAct()`. Comment explicitly warns against adding redundant calls. **PASS**
- Bot cancels its own decision timer (bot never times out). **PASS**
- Practice match cleanup: no match record saved, no chaos energy awarded. **PASS**

### Bot Constants

- `BOT_PLAYER_ID = '00000000-0000-0000-0000-000000000000'` (fixed UUID). **PASS**
- `BOT_DECK_ID = '00000000-0000-0000-0000-000000000001'`. **PASS**
- `BOT_AVATAR_ID = 'b0000000-0000-0000-0000-000000000005'` (Kael, the Bound Tyrant). **PASS**
- Bot is always PLAYER_2. **PASS**

---

## 8. WebSocket Protocol

### Transport

Uses Supabase Realtime channels (not raw WebSocket). Channel per match: `match:<matchId>`. iOS clients broadcast `player_action` events; server listens and broadcasts `game_event` responses. **Matches doc 06 architecture.**

### Client Actions (10 types, Zod-validated)

| Action | Schema | Handler | Status |
|--------|--------|---------|--------|
| PLAY_CARD | `card_id: string, target_slot?: number, target_id?: string` | `handlePlayCardAction()` | PASS |
| USE_CHAOS_SPARK | (no fields) | `handleChaosSparkAction()` | PASS |
| END_MAIN_PHASE | (no fields) | `handleDeclareAction()` | PASS |
| DECLARE_ATTACKERS | `attacker_ids: string[]` | `handleDeclareAction()` | PASS |
| ASSIGN_BLOCKERS | `assignments: { blocker_id, attacker_id }[]` | `handleBlockerAction()` | PASS |
| CHOOSE_EVENT_TARGET | `target_id: string` | Stub (no-op) | FAIL (HIGH-01) |
| SURRENDER | (no fields) | `handleSurrenderAction()` | PASS |
| MULLIGAN | (no fields) | Stub (no-op) | FAIL (HIGH-02) |
| RECONNECT | (no fields) | `handleReconnectAction()` | PASS |
| END_TURN | (no fields) | `handleEndTurnAction()` | PASS |

### Server Events (20+ types)

Major events implemented and broadcast:
- `TURN_START`, `CHAOS_ROLL`, `EVENT_TRIGGERED`, `CARD_DRAWN`, `MANA_GAINED`
- `PHASE_CHANGED`, `CARD_PLAYED`, `CHAOS_SPARK_USED`
- `OPPONENT_HAND_UPDATE` (sent only to opponent, not active player)
- `ATTACKERS_DECLARED`, `BLOCKERS_ASSIGNED`, `COMBAT_RESOLVED`
- `MATCH_END`, `STATE_SNAPSHOT`, `SERVER_ERROR`
- `TIMER_WARNING`, `TIMER_EXPIRED`

### State Projection

`createClientGameState()` in `match.ts` filters state per player:
- Shows own hand/deck count, opponent hand count (not contents), opponent deck count (not contents). **PASS**
- Both players see full board state. **PASS**

### Error Handling

- All actions wrapped in try/catch with `GameError` or `ProtocolError`
- Errors sent as `SERVER_ERROR` events to the specific player
- Invalid actions do not crash the server or corrupt state

### Reconnection

- `onPlayerReconnect()` marks player as connected, sends full `STATE_SNAPSHOT`
- Heartbeat broadcasts from iOS clients also trigger reconnection check
- 60-second grace period via `RECONNECT_GRACE_SECONDS`
- 3 consecutive missed turns trigger auto-forfeit via `MAX_MISSED_TURNS`

---

## 9. Matchmaking

### Queue Mechanism

`matchmaking.ts` polls `matchmaking_queue` table in Supabase on a 2-second interval (`MATCHMAKING_POLL_INTERVAL_MS`). **PASS**

### Rank-Based Matching

- Initial range: +/- 2 tiers (`INITIAL_RANK_RANGE`). **PASS**
- Expands by 1 tier every 5 seconds (`RANK_RANGE_EXPANSION_INTERVAL`). **PASS**
- Maximum range: 5 tiers (`MAX_RANK_RANGE`). **PASS**
- Supports RANKED and CASUAL modes. **PASS**

### Practice Match

- Bypasses matchmaking queue entirely
- Initiated via `POST /api/practice/start` endpoint
- Bot deck built from DB or fallback
- Match created with bot as PLAYER_2

---

## 10. Additional Systems

### Seeded RNG

- `SeededRNG` class uses mulberry32 algorithm. **PASS**
- `nextInt(min, max)` for bounded integers. **PASS**
- `shuffle()` using Fisher-Yates. **PASS**
- `fork()` creates independent sub-stream. **PASS**
- `fromState(seed, counter)` recreates deterministic state for replay. **PASS**
- Match seed generated via `generateMatchSeed()` using `crypto.randomInt()`. **PASS**

### Timer Management

- 60s decision timer per turn (`TURN_TIMER_SECONDS`). **PASS**
- 10s event choice sub-timer (`EVENT_CHOICE_TIMER_SECONDS`). **PASS**
- 15s warning broadcast (`TIMER_WARNING_SECONDS`). **PASS**
- Timer expiry triggers auto-action (no blockers / end turn). **PASS**
- Timers cancelled on player action or phase transition. **PASS**

### In-Memory Match Store

- `activeMatches` Map keyed by matchId. **PASS**
- No persistence to DB during match (intentional — Railway is authoritative). **Matches doc 06.**
- Match record saved to Supabase on match end via `saveMatchRecordAndAwardEnergy()`. **PASS**

---

## Issue Summary

### CRITICAL (Must Fix Before Testing)

#### CRIT-01: Spell Resolution is a Stub

**File**: `packages/game-server/src/engine/turn.ts` line 259-268
**Spec**: 01-BM Section 3 Phase 5 — "Spells resolve immediately when played."
**Implementation**: The `handlePlayCard()` function handles CREATURE and STABILIZER placement correctly, but the SPELL branch contains only `// TODO: resolve spell with specific target`. The spell card is moved to graveyard and mana is deducted, but no spell effect is resolved.
**Impact**: Spells in player decks cost mana but do nothing. Bot AI already skips spells, so practice matches are unaffected, but any player deck with spells will be broken.
**Fix**: Implement spell effect resolution using `resolveEffect()` with the spell card's effect and target. Spells should support all effect types and target types defined in the Effect schema.

#### CRIT-02: C6 Chaos Siphon Targets Two Different Random Creatures

**File**: `packages/game-server/src/engine/events.ts` line 206-221
**Spec**: 01-BM Section 9 Event C6 — "Deal 2 damage to a random friendly creature. **That creature** gets +3 ATK permanently."
**Implementation**: The primary effect targets `RANDOM_FRIENDLY` for 2 damage. The `secondary_effect` independently targets `RANDOM_FRIENDLY` for +3 ATK. Since `resolveEffect()` calls `resolveTargets()` separately for the secondary effect, the RNG may select a different random creature for the +3 ATK buff.
**Impact**: The buff should always go to the same creature that took damage. Currently, the damage and buff can hit different creatures, violating the "that creature" clause and changing the risk/reward profile of the event.
**Fix**: The secondary effect's target should be `SELF` (referring to the primary target), or the event resolution code should pass the primary target as `specificTarget` to the secondary effect resolution. This requires either a new target type like `SAME_AS_PRIMARY` or custom handling in `resolveEventPhase()`.

#### CRIT-03: C8 Overcharge "Already Has Piercing" Special Case Not Implemented

**File**: `packages/game-server/src/engine/events.ts` line 306-311
**Spec**: 01-BM Section 9 Event C8 — "A random friendly creature gains +2 ATK and Piercing this turn. If it already has Piercing, it gets +4 ATK instead."
**Implementation**: The C8 event always applies +2 ATK and grants Piercing. The special-case code block (lines 307-311) is empty with a comment: "This is a simplification."
**Impact**: Creatures that already have Piercing get +2 ATK + redundant Piercing grant instead of +4 ATK. This weakens Piercing-oriented decks and contradicts the spec's explicit escalation mechanic.
**Fix**: After resolving C8's effect, check if the targeted creature already had Piercing before the event. If so, apply an additional +2 ATK (total +4) and skip the Piercing grant. This requires tracking the target creature from the primary effect.

---

### HIGH (Should Fix Before Alpha)

#### HIGH-01: CHOOSE_EVENT_TARGET Handler is a Stub

**File**: `packages/game-server/src/ws/handler.ts` line 277-279
**Spec**: 01-BM Events O2 (Planar Ward) and O5 (Fortify) require player choice.
**Implementation**: The `handleMessage()` switch case for `CHOOSE_EVENT_TARGET` is `break` (no-op). The `eventRequiresChoice()` and `getValidEventTargets()` functions exist and work correctly, and `executeAutomaticPhases()` detects choice events and returns `requiresEventChoice: true` with valid targets. But the handler never processes the player's response.
**Impact**: O2 and O5 events fire but auto-resolve to the leftmost alive creature (via `resolveTargets` default for `FRIENDLY_CREATURE`), removing player agency for these two events.
**Fix**: Implement a handler that:
1. Pauses event resolution when `requiresEventChoice` is true
2. Starts the 10s event choice timer
3. On CHOOSE_EVENT_TARGET action, validates the target is in `validEventTargets`, then resolves the effect with `specificTarget`
4. On timer expiry, auto-resolve with a random valid target

#### HIGH-02: Mulligan Not Implemented

**File**: `packages/game-server/src/ws/handler.ts` line 273-275
**Spec**: 01-BM Section 3.2 — "Each player may mulligan once (shuffle hand into deck, draw same number minus 1)."
**Implementation**: The MULLIGAN action type exists in the Zod schema but the handler is `break` (no-op). There is no GAME_SETUP phase implementation where mulligan would occur.
**Impact**: Players cannot mulligan bad opening hands, reducing strategic depth in the early game.
**Fix**: Add a GAME_SETUP phase before the first turn where both players can optionally mulligan. P1 mulligans first (draws 3), P2 second (draws 4). Timer of 15-20s per player. If timer expires, no mulligan.

#### HIGH-03: O8 Harmonize Special Case Timing Issue

**File**: `packages/game-server/src/engine/events.ts` line 296-304
**Spec**: 01-BM Section 8 Event O8 — "All your creatures heal 2 HP. Creatures already at full HP get +0/+1 permanently instead."
**Implementation**: The code first resolves the HEAL effect (all creatures heal 2), then checks which creatures are at full HP. The problem is that creatures which WERE below full HP but got healed TO full HP by the 2-HP heal will now pass the `health >= max_health` check and incorrectly receive the +0/+1 bonus.
**Impact**: Creatures that were 1-2 HP below max get both the heal AND the +0/+1, when they should only get the heal. This makes O8 stronger than spec intends.
**Fix**: Record which creatures are at full HP BEFORE resolving the heal effect, then only apply +0/+1 to those pre-identified creatures.

#### HIGH-04: Event Resolution Auto-Fires Before Player Choice

**File**: `packages/game-server/src/engine/turn.ts` line 440-449
**Spec**: O2 and O5 should pause for player targeting choice.
**Implementation**: `executeAutomaticPhases()` calls `resolveEventResolution()` immediately, which calls `resolveEffect()` with auto-targeting. THEN it checks `eventRequiresChoice()`. The event has already resolved with default targeting by the time the code realizes it needed player input.
**Impact**: Same as HIGH-01 — O2 and O5 always auto-target leftmost creature. This is the root cause; HIGH-01 is the handler gap.
**Fix**: Check `eventRequiresChoice()` BEFORE calling `resolveEventResolution()`. If choice is required, return early from auto phases with a `pendingEventChoice` flag. Only resolve the event after receiving the player's CHOOSE_EVENT_TARGET action.

---

### MEDIUM (Should Fix Before Beta)

#### MED-01: Bot Cannot Play Spells

**File**: `packages/game-server/src/bot/ai.ts` line 247-248
**Impact**: Bot decks can include spells (up to 4), but `decideBotMainPhase()` filters them out (`return false` for non-creature/stabilizer). These spells are dead cards in the bot's hand, reducing effective hand size.
**Fix**: Either remove spells from bot deck building, or implement basic spell targeting AI (e.g., damage spells target highest-ATK enemy, buff spells target own strongest creature).

#### MED-02: Mana Gain Cap Logic Could Be Clearer

**File**: `packages/game-server/src/engine/turn.ts` line 188-189
**Spec**: "Gain 1 chaos mote (up to the cap of 10)."
**Implementation**: `if (current_mana < mana_cap) current_mana += 1`. This works correctly — if you have 10 mana, you don't gain more. If you have 9 and spent 0, you gain 1 to reach 10. Unspent mana carries over.
**Status**: Functionally correct but worth noting that the mana system is accumulate-and-carry, not set-mana-to-turn-number. This is intentional per spec. **No fix needed.**

#### MED-03: Surrender Allowed Before Turn 2 in Practice

**File**: `packages/game-server/src/ws/handler.ts` line 458
**Implementation**: `if (state.current_turn < 2 && state.mode !== 'PRACTICE')` — practice matches can surrender at turn 1.
**Impact**: Minor, since practice matches don't count. But could allow exploit if practice match results ever gain meaning.
**Status**: Acceptable for now. Flag for review if practice match rewards are added.

#### MED-04: No Hand Size Limit Enforcement

**File**: `packages/game-server/src/engine/constants.ts` line 13-14
**Implementation**: `MAX_HAND_SIZE = 10` is defined but never checked. Drawing cards never triggers a discard-to-max mechanic.
**Spec**: 01-BM does not explicitly define a maximum hand size or discard rule.
**Impact**: Theoretically a player could accumulate 15+ cards via O4 Clarity draws across many turns. This is unlikely in practice (20-card deck, 20-HP games) but could cause iOS UI issues.
**Fix**: Either enforce MAX_HAND_SIZE with a discard step, or remove the constant and note in the spec that hand size is unlimited.

#### MED-05: No Deck-Out Condition

**Spec**: 01-BM does not explicitly state what happens when a player's deck is empty.
**Implementation**: `resolveDrawAndMana()` silently skips the draw if `deck.length === 0`. No damage, no loss, no notification.
**Impact**: With 20-card decks and 4-5 card opening hands, deck-out can occur around turn 16-17. Games typically end before this, but a stalemate could cause indefinite play.
**Fix**: Either add fatigue damage (e.g., 1 damage increasing per empty draw) or add a maximum turn limit (e.g., 30 turns, then highest HP wins). Or document that deck-out is a no-draw scenario and rely on natural game length.

#### MED-06: Blocker Assignment Field Name Mismatch

**File**: `packages/game-server/src/engine/turn.ts` line 354-357 vs `packages/game-server/src/engine/combat.ts` line 301-303
**Implementation**: The client sends `{ blocker_id, attacker_id }` but the internal `BlockerAssignment` type uses `{ blocker_creature_id, attacker_creature_id }`. The `handleAssignBlockersAction()` maps between them (line 354-357). This is handled correctly but adds an unnecessary translation layer.
**Impact**: Minor code complexity. Could cause bugs if the mapping is missed in future code paths.
**Fix**: Standardize on one field naming convention throughout.

---

## Checklist Summary

| Area | Items Checked | Pass | Fail | Warn |
|------|--------------|------|------|------|
| Turn Engine (9 phases) | 9 | 8 | 0 | 1 (spell stub) |
| Combat Resolution | 8 | 8 | 0 | 0 |
| Keywords (7) | 7 | 7 | 0 | 0 |
| Instability | 5 | 5 | 0 | 0 |
| D20 Chaos Roll | 4 | 4 | 0 | 0 |
| Events (16) | 16 | 14 | 2 | 0 |
| Bot AI | 6 | 5 | 0 | 1 (no spells) |
| WebSocket Protocol | 10 | 8 | 2 | 0 |
| Matchmaking | 4 | 4 | 0 | 0 |
| **Total** | **69** | **63** | **4** | **2** |

---

## Priority Fix Order

1. **CRIT-02** (C6 Chaos Siphon targeting) — Game logic bug, wrong outcomes
2. **CRIT-03** (C8 Overcharge special case) — Missing mechanic, wrong outcomes
3. **HIGH-04** (Event auto-fires before choice) — Root cause of O2/O5 targeting failure
4. **HIGH-01** (CHOOSE_EVENT_TARGET handler) — Completes the event choice pipeline
5. **HIGH-03** (O8 Harmonize timing) — Gameplay balance bug
6. **CRIT-01** (Spell resolution) — Core mechanic missing, blocks spell cards
7. **HIGH-02** (Mulligan) — Core mechanic missing, blocks strategic depth
8. **MED-01** (Bot spells) — Quality of practice matches
9. **MED-04** (Hand size limit) — Edge case protection
10. **MED-05** (Deck-out condition) — Edge case protection

---

## Revision Log

| Date | Author | Changes |
|------|--------|---------|
| 2026-02-17 | Claude Code (Audit Agent) | Initial audit — 27 files reviewed, 3 CRITICAL, 4 HIGH, 6 MEDIUM issues found |
