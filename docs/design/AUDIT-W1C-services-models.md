# Audit W1C: Services & Models

**Date:** 2026-02-17
**Auditor:** Claude Opus 4.6
**Scope:** All Swift models, services, config, and extensions in `ChaosCreatures/ChaosCreatures/` vs. docs/design/02-card-data-model.md (doc 02) and docs/design/06-technical-architecture.md (doc 06).

---

## Summary

- Models checked: 10 files (BattleCard, CardInstance, CardTemplate, Deck, EconomyConfig, Enums, GameState, MatchEvent, Player, PlayerAction)
- Services checked: 10 files (AuthService, CollectionService, EconomyService, EvolutionService, ImageCacheService, MatchService, MatchmakingService, PostHogService, StoreKitService, SupabaseService)
- Config checked: 1 file (Secrets.swift)
- Extensions checked: 3 files (Color+Theme, Data+Codable, View+Loading)
- App checked: 1 file (AppState.swift)
- Critical issues found: 2
- High issues found: 7
- Medium issues found: 11
- Enum mismatches found: 3

---

## Enum Consistency

### CardType
- **Doc 02:** `CREATURE | SPELL | STABILIZER`
- **Swift Enums.swift:** `creature = "CREATURE"`, `spell = "SPELL"`, `stabilizer = "STABILIZER"`
- **Verdict: MATCH**

### Keyword
- **Doc 02:** `SHIELD | LIFESTEAL | FLYING | REACH | DEATHTOUCH | TAUNT | PIERCING`
- **Swift Enums.swift:** All 7 present with correct raw values.
- **Verdict: MATCH**

### EvolutionTier
- **Doc 02:** `COMMON | UNCOMMON | RARE | EPIC | LEGENDARY`
- **Swift Enums.swift:** All 5 present with correct raw values.
- **Verdict: MATCH**

### EventType
- **Doc 02:** `ORDER | CHAOS`
- **Swift Enums.swift:** `order = "ORDER"`, `chaos = "CHAOS"`
- **Verdict: MATCH**

### ShardTier
- **Doc 02:** `UNCOMMON | RARE | EPIC | LEGENDARY`
- **Swift Enums.swift:** All 4 present with correct raw values.
- **Verdict: MATCH**

### ShardQuality
- **Doc 02:** `PLANAR | REFINED | PRISMATIC`
- **Swift Enums.swift:** All 3 present with correct raw values.
- **Verdict: MATCH**

### ModifierPoolType
- **Doc 02:** `UNIVERSAL | FACTION`
- **Swift Enums.swift:** All 2 present.
- **Verdict: MATCH**

### TierBracket
- **Doc 02:** `EARLY | LATE`
- **Swift Enums.swift:** All 2 present.
- **Verdict: MATCH**

### FactionMechanic
- **Doc 02:** `AUGMENT | BOND | CORRUPTION`
- **Swift Enums.swift:** All 3 present.
- **Verdict: MATCH**

### TriggerType
- **Doc 02:** `ON_ORDER | ON_CHAOS | ON_PLAY | ON_DEATH | ON_DAMAGE_TAKEN | ON_ATTACK | ON_BLOCK`
- **Swift Enums.swift:** All 7 present with correct raw values.
- **Verdict: MATCH**

### SpellEffectType
- **Doc 02:** `DAMAGE | HEAL | BUFF_ATTACK | BUFF_HEALTH | DRAW | GAIN_MANA | GRANT_KEYWORD | REMOVE_KEYWORD | DESTROY | INSTABILITY_MODIFY | INSTABILITY_SET | CHOOSE_EVENT_TYPE | COST_REDUCTION`
- **Swift Enums.swift:** All 13 present with correct raw values.
- **Verdict: MATCH**

### TargetType
- **Doc 02:** 17 values (SELF through PLAYER_OPPONENT)
- **Swift Enums.swift:** All 17 present with correct raw values.
- **Verdict: MATCH**

### Duration
- **Doc 02:** `THIS_TURN | PERMANENT | WHILE_ON_FIELD | UNTIL_NEXT_ROLL`
- **Swift Enums.swift:** All 4 present.
- **Verdict: MATCH**

### EffectType
- **Doc 02:** `STAT_MODIFY_ATTACK | STAT_MODIFY_HEALTH | STAT_MODIFY_COST | DAMAGE | HEAL | HEAL_PLAYER | DRAW_CARD | GAIN_MANA | GRANT_KEYWORD | REMOVE_KEYWORD | DESTROY_CREATURE | SUMMON_TOKEN | DOUBLE_MODIFIER_ACTIVATION | COST_REDUCTION`
- **Swift Enums.swift:** All 14 present with correct raw values.
- **Verdict: MATCH**

### SubscriptionTier
- **Doc 02:** `FREE | MID | HIGH`
- **Swift Enums.swift:** All 3 present. `maxCardsPerFaction` values (50/100/200) and `maxDeckSlots` values (3/6/10) match doc 02 Section 12.
- **Verdict: MATCH**

### SeasonRank
- **Doc 02:** 17 values (BRONZE_3 through GRANDMASTER)
- **Swift Enums.swift:** All 17 present with correct raw values.
- **Verdict: MATCH**

### TurnPhase
- **Doc 02:** `START_OF_TURN | CHAOS_ROLL | EVENT_RESOLUTION | DRAW_AND_MANA | MAIN_PHASE | DECLARE_ATTACKERS | ASSIGN_BLOCKERS | COMBAT_RESOLUTION | END_TURN`
- **Swift Enums.swift:** All 9 doc 02 phases present. Swift adds `GAME_SETUP` and `GAME_OVER` which are not in doc 02 but are reasonable runtime extensions.
- **Verdict: MINOR MISMATCH** -- Swift adds 2 extra phases not in doc 02. These are additive and do not conflict.

### PlayerSide
- **Doc 02:** `PLAYER_1 | PLAYER_2`
- **Swift Enums.swift:** Both present with correct raw values.
- **Verdict: MATCH**

### LogEntryType
- **Doc 02:** 19 values (ROLL through TURN_TIMEOUT)
- **Swift Enums.swift:** All 19 present with correct raw values.
- **Verdict: MATCH**

### GameMode
- **Doc 02:** `RANKED | CASUAL | PRACTICE`
- **Swift Enums.swift:** All 3 present.
- **Verdict: MATCH**

### EndReason
- **Doc 02:** `HP_ZERO | SURRENDER | DISCONNECT | TIMEOUT`
- **Swift Enums.swift:** All 4 present.
- **Verdict: MATCH**

### MissionType
- **Doc 02:** `WIN_GAMES | PLAY_CARDS | PLAY_CREATURES | PLAY_SPELLS | EVOLVE_CARD | TRIGGER_ORDER_EVENTS | TRIGGER_CHAOS_EVENTS | DEAL_DAMAGE | WIN_WITH_STYLE | PLAY_GAMES`
- **Swift Enums.swift:** All 10 present.
- **Verdict: MATCH**

### RewardType
- **Doc 02:** `XP | SHARDS | CHAOS_ENERGY_BOOST`
- **Swift Enums.swift:** All 3 present.
- **Verdict: MATCH**

### ShardSource
- **Doc 02:** `MATCH_REWARD | DAILY_LOGIN | WEEKLY_CHALLENGE | SEASON_REWARD | MILESTONE | PURCHASE | EVOLUTION_CONSUMED | DISMANTLE_RETURN | SUBSCRIPTION_GRANT`
- **Swift Enums.swift:** All 9 present.
- **Verdict: MATCH**

### AchievementCategory
- **Doc 02:** `EVOLUTION | BATTLE | COLLECTION | CHAOS_ROLL | SOCIAL`
- **Swift Enums.swift:** All 5 present.
- **Verdict: MATCH**

### ColorblindMode
- **Doc 02:** `NONE | DEUTERANOPIA | PROTANOPIA | TRITANOPIA`
- **Swift Enums.swift:** All 4 present.
- **Verdict: MATCH**

### QualityLevel
- **Doc 02:** `FULL | REDUCED | MINIMAL`
- **Swift Enums.swift:** All 3 present.
- **Verdict: MATCH**

### RollResult (Swift-only)
- **Doc 02:** Not defined as a formal enum (outcome is derived from chaos roll comparison logic).
- **Swift Enums.swift:** `RollResult` with cases `order`, `chaos`, `nothing` -- raw values are lowercase, not UPPER_CASE.
- **Also in BattleCard.swift:** `ChaosRollOutcome` with raw values `"ORDER"`, `"CHAOS"`, `"NOTHING"` (UPPER_CASE).
- **Verdict: MISMATCH** -- Two duplicate enums for the same concept with different casing conventions. `RollResult` uses lowercase raw values while `ChaosRollOutcome` uses UPPER_CASE. The server likely sends UPPER_CASE values matching doc 02 conventions. `RollResult` would fail to decode server messages.

### FactionShortName (Swift-only)
- **Doc 02 Section 10:** `short_name` values are `"IRONWRIGHT" | "FEY_COURTS" | "DEMONIC_KINGDOMS"`
- **Swift Enums.swift:** `ironwright = "IRONWRIGHT"`, `feyCourts = "FEY_COURTS"`, `demonicKingdoms = "DEMONIC_KINGDOMS"`
- **Verdict: MATCH**

### Extra Swift Enums Not in Doc 02
- `MissionDifficulty` (EASY, MEDIUM, HARD) -- not in doc 02 but used by the expanded Mission model.
- `MissionPeriod` (DAILY, WEEKLY, ONBOARDING) -- not in doc 02 but used by the expanded Mission model.
- `UnlockConditionType` (FREE_STARTER, FACTION_MASTERY, SEASON_REWARD, CHAOS_DUST) -- matches doc 02 Section 9 UnlockCondition variants.
- **Verdict: Acceptable additions**

---

## Model Audit

### CardTemplate (CardTemplate.swift vs Doc 02 Section 1)

| Doc 02 Field | Swift Field | Match? | Notes |
|---|---|---|---|
| id: string | id: UUID | OK | UUID is appropriate |
| name: string | name: String | OK | |
| card_type: CardType | cardType: CardType | OK | |
| faction_id: string | factionId: UUID | OK | |
| base_attack: int? | baseAttack: Int? | OK | |
| base_health: int? | baseHealth: Int? | OK | |
| base_instability: int | baseInstability: Int | OK | |
| mana_cost: int | manaCost: Int | OK | |
| base_keywords: Keyword[] | baseKeywords: [String] | WARN | Stored as `[String]` not `[Keyword]`. Converted via computed property `keywords`. Works but loses type safety at decode time. |
| spell_effect?: SpellEffect | spellEffect: SpellEffect? | OK | |
| stabilizer_type?: StabilizerType | stabilizerType: StabilizerType? | OK | |
| art_prompt: string | artPrompt: String | OK | |
| art_url: string | artUrl: String | OK | |
| flavor_text: string | flavorText: String | OK | |
| batch_id: string | batchId: String? | DIFF | Doc 02 says non-nullable, Swift says optional. Safer as optional. |
| approved_at: timestamp | approvedAt: Date? | OK | |
| approved_by: string | approvedBy: String? | OK | |
| is_legendary_eligible: bool | isLegendaryEligible: Bool | OK | |
| -- | createdAt: Date | ADD | Not in doc 02 but standard DB practice |

**Missing from Swift:** None critical. All doc 02 fields are present.

### CardInstance (CardInstance.swift vs Doc 02 Section 2)

| Doc 02 Field | Swift Field | Match? | Notes |
|---|---|---|---|
| id | id: UUID | OK | |
| template_id | templateId: UUID | OK | |
| owner_id | ownerId: UUID | OK | |
| tier | tier: EvolutionTier | OK | |
| current_name | currentName: String | OK | |
| current_attack | currentAttack: Int? | OK | |
| current_health | currentHealth: Int? | OK | |
| current_mana_cost | currentManaCost: Int | OK | |
| instability_value | instabilityValue: Int | OK | |
| innate_keywords: Keyword[] | innateKeywords: [String] | WARN | Stored as [String] not [Keyword]. Same pattern as CardTemplate. |
| modifier_keywords: Keyword[] | modifierKeywords: [String] | WARN | Same issue. |
| evolution_history | evolutionHistory: [EvolutionRecord] | OK | |
| modifiers | modifiers: [ModifierInstance] | OK | |
| triggered_abilities | triggeredAbilities: [TriggeredAbility] | OK | |
| chaos_energy | chaosEnergy: Int | OK | |
| games_played | gamesPlayed: Int | OK | |
| art_url | artUrl: String | OK | |
| flavor_text | flavorText: String | OK | |
| art_prompt_history | artPromptHistory: [String] | OK | |
| is_favorite | isFavorite: Bool | OK | |
| in_deck_ids | inDeckIds: [UUID] | OK | |
| created_at | createdAt: Date | OK | |
| last_evolved_at | lastEvolvedAt: Date? | OK | |

**Computed properties check:**
- `effectiveKeywords` -- present, correct (union of innate + modifier)
- `nextEnergyThreshold` -- present, uses tier.nextTier?.energyThreshold. Thresholds match doc 02 (15/30/50/75).
- `isEvolutionReady` -- present, correct (chaosEnergy >= threshold)
- `orderAttunementCount` / `chaosAttunementCount` -- present, correct
- `orderTriggerCount` / `chaosTriggerCount` -- present, correct

### EvolutionRecord (in CardInstance.swift vs Doc 02 Section 3)

All 22 fields present and correctly mapped. CodingKeys correctly convert to snake_case. Full match.

### ModifierInstance (in CardInstance.swift vs Doc 02 Section 4b)

All 16 fields present and correctly mapped. Full match.

### TriggeredAbility (in CardInstance.swift vs Doc 02 Section 5)

All 6 fields present. Full match.

### ModifierDefinition (in CardInstance.swift vs Doc 02 Section 4a)

All fields present except:
- **Missing:** `flavor_text` -- present in doc 02 but absent... Wait, checking again: `flavorText: String` is present. All fields accounted for.
- **Extra:** `createdAt: Date` -- not in doc 02 but standard DB practice.
- Full match.

### Effect (in CardTemplate.swift vs Doc 02 Section 7)

| Doc 02 Field | Swift Field | Match? |
|---|---|---|
| effect_type | effectType: EffectType | OK |
| target | target: TargetType | OK |
| value? | value: Int? | OK |
| keyword? | keyword: Keyword? | OK |
| duration? | duration: Duration? | OK |
| secondary_effect? | secondaryEffect: Indirect<Effect>? | OK (uses Indirect wrapper for recursive type) |
| condition? | condition: EffectCondition? | OK |

**EffectCondition note:** Doc 02 defines `Condition` as an enum with variants like `CREATURE_COUNT_GTE(n)`, `HEALTH_BELOW(n)`, etc. Swift models this as a struct with `type: String`, `value: Int?`, `keyword: String?`, `eventType: String?`. This is a pragmatic representation since Swift enums with associated values are harder to make Codable from arbitrary JSON. Acceptable, though the `type` field being a raw String means no compile-time safety. **Low risk.**

### SpellEffect (in CardTemplate.swift vs Doc 02 Section 6)

All fields present and correctly mapped. Full match.

### Deck (Deck.swift vs Doc 02 Section 11)

| Doc 02 Field | Swift Field | Match? |
|---|---|---|
| id | id: UUID | OK |
| owner_id | ownerId: UUID | OK |
| name | name: String | OK |
| faction_id | factionId: UUID | OK |
| avatar_id | avatarId: UUID | OK |
| card_entries | cardEntries: [DeckEntry] | OK |
| is_valid | isValid: Bool | OK |
| validation_errors | validationErrors: [String] | OK |
| created_at | createdAt: Date | OK |
| updated_at | updatedAt: Date | OK |
| games_played | gamesPlayed: Int | OK |
| wins | wins: Int | OK |
| losses | losses: Int | OK |

**DeckEntry:** `card_instance_id` + `quantity` -- both present. Full match.

**Validation:** `validate()` method checks: 20-card rule, max 2 copies per template, max 2 Legendaries total, max 1 copy per Legendary. These match doc 02 Section 11 validation rules. However, it does **not** check `avatar.faction_id == deck.faction_id` or that all card instances belong to `owner_id`. These validations may be server-side only.

### Player (Player.swift vs Doc 02 Section 12)

| Doc 02 Field | Swift Field | Match? | Notes |
|---|---|---|---|
| id | id: UUID | OK | |
| display_name | displayName: String | OK | |
| friend_code | friendCode: String | OK | |
| apple_id | authId: UUID | DIFF | Doc 02 says `apple_id: string`. Swift uses `authId: UUID`. This is the Supabase auth UUID, not the raw Apple ID string. Functionally correct for Supabase auth. |
| subscription_tier | subscriptionTier: SubscriptionTier | OK | |
| primary_faction_id | primaryFactionId: UUID? | OK | |
| unlocked_faction_ids | unlockedFactionIds: [UUID] | OK | |
| onboarding_complete | onboardingComplete: Bool | OK | |
| player_level | playerLevel: Int | OK | |
| player_xp | playerXp: Int | OK | |
| season_rank | seasonRank: SeasonRank | OK | |
| season_rank_points | seasonRankPoints: Int | OK | |
| chaos_dust | chaosDust: Int | OK | |
| max_cards_per_faction | maxCardsPerFaction: Int | OK | |
| max_deck_slots | maxDeckSlots: Int | OK | |
| shards_uncommon | shardsUncommon: Int | OK | |
| shards_rare | shardsRare: Int | OK | |
| shards_epic | shardsEpic: Int | OK | |
| shards_legendary | shardsLegendary: Int | OK | |
| showcase_card_ids | showcaseCardIds: [UUID] | OK | |
| active_title | activeTitle: String? | OK | |
| total_games | totalGames: Int | OK | |
| total_wins | totalWins: Int | OK | |
| total_losses | totalLosses: Int | OK | |
| current_win_streak | currentWinStreak: Int | OK | |
| best_win_streak | bestWinStreak: Int | OK | |
| cards_evolved_total | cardsEvolvedTotal: Int | OK | |
| highest_tier_reached | highestTierReached: EvolutionTier | OK | |
| friend_ids | friendIds: [UUID] | OK | |
| settings | settings: PlayerSettings | OK | |
| created_at | createdAt: Date | OK | |
| -- | updatedAt: Date | ADD | |
| -- | hiddenMmr: Int | ADD | Not in doc 02 but used for matchmaking. |

**Missing from Swift:**
- `faction_mastery: FactionMastery[]` is NOT on the Player struct. However, `FactionMastery` is defined separately in Player.swift. It's likely stored in a separate table (per doc 02 it's a sub-entity) and fetched independently rather than embedded in the player row. Acceptable.

**PlayerSettings:** All 17 fields from doc 02 present with correct types and CodingKeys. Full match.

### Faction (in Player.swift vs Doc 02 Section 10)

All fields present. `shortName` uses `FactionShortName` enum instead of raw String. Full match.

### Avatar (in Player.swift vs Doc 02 Section 9)

All fields present. `unlockCondition` uses the `UnlockCondition` struct. Full match.

### Mission (in Player.swift vs Doc 02 Section 16)

Doc 02 defines `Mission` with fields: `id, player_id, mission_type, description, target_value, current_value, is_completed, is_claimed, reward_type, reward_amount, reward_shard_tier?, expires_at, created_at`.

Swift adds: `difficulty: MissionDifficulty`, `period: MissionPeriod`, `rewardDust: Int`, `rewardShardCount: Int`.
Swift differs: uses `rewardDust` and `rewardShardCount` instead of generic `reward_type`/`reward_amount`. This is a more concrete representation that splits the generic reward into specific fields.
**Missing from Swift:** `reward_type: RewardType` and `reward_amount: Int` -- the generic reward fields from doc 02 are replaced by specific `rewardDust`/`rewardShardTier`/`rewardShardCount` fields.
**Verdict:** Structural divergence from doc 02 but functionally equivalent. The Swift model is arguably better typed for the actual reward structure.

### Achievement / PlayerAchievement (in Player.swift vs Doc 02 Sections 17)

All fields present. Full match.

### GameState (GameState.swift vs Doc 02 Section 13)

Swift uses `ClientGameState` (a client projection) rather than the full `GameState` from doc 02. This is by design -- doc 02 Section 13 notes: "Client receives a projection of this state (hiding opponent's hand/deck contents)."

Key differences from full GameState:
- `myHand` is `[BattleCardData]` (only own hand visible, not opponent's)
- `myDeckCount` (count only, not deck contents)
- `opponent` and `me` are `ClientBattlePlayer` (which shows `handCount` and `deckCount` instead of card arrays for the opponent)

`ClientBattlePlayer` maps to `BattlePlayer` from doc 02 with appropriate redactions:
- `board: [BattleCreatureData?]` -- present (both sides can see board creatures)
- `handCount: Int` -- opponent's hand count (redacted from full hand)
- `deckCount: Int` -- redacted from full deck
- `graveyardCount: Int` -- count only
- All other fields (HP, mana, instability, chaos spark, etc.) present.
- `consecutiveMissedTurns` and `isConnected` present for disconnect handling.

**Verdict:** Correctly implements the client projection pattern described in doc 02. MATCH.

### BattleCard / BattleCreature (BattleCard.swift vs Doc 02 Section 13)

`BattleCardData` maps to `BattleCard` from doc 02. All fields present: `instance_id, template_id, card_type, name, mana_cost, art_url`. Swift adds `base_attack, base_health, base_instability, innate_keywords, faction_id, modifiers, triggered_abilities` -- these are denormalized for client rendering convenience.

`BattleCreatureData` maps to `BattleCreature` from doc 02. All core fields present: `attack, health, maxHealth, hasAttacked, isAlive, instabilityValue, activeKeywords, shieldActive, boardSlot`.

**Missing from BattleCreatureData:**
- `modifiers: BattleModifier[]` -- NOT on BattleCreatureData (it's on BattleCardData only). The server should provide modifiers for board creatures too. **Medium issue** -- creature nodes need modifier data for UI (showing attunement state).
- `triggered_abilities` -- same, not on BattleCreatureData.
- `temp_buffs: TempBuff[]` -- not present. Temporary buff display would require this data.

`BattleModifier` struct is present with correct fields: `definitionId, name, isAttunedActive, isPenaltyActive, instabilityAdjustment, grantsKeyword`. Missing from doc 02's `BattleModifier`: `poolType, factionMechanic, attunement, baseEffect, attunedEffect, hasPenalty, penaltyEffect, instabilityIsAttuned`. These are full runtime fields needed for stat recalculation server-side. The client version is a slimmed projection -- acceptable.

`BattleTriggeredAbility` uses `trigger: String` instead of `trigger: TriggerType`. This means no compile-time type safety on the trigger field. **Medium issue.**

### MatchEvent (MatchEvent.swift)

Defines `ServerEvent` enum with 20 event types. Compared against doc 06 Section 2.5 and the game server message types:

- `stateSnapshot` -- for full state sync (matches doc 06)
- `turnStart` / `chaosRoll` / `eventTriggered` / `cardDrawn` / `manaGained` / `cardPlayed` -- all present
- `attackersDeclared` / `blockersAssigned` / `combatResolved` -- all present
- `creatureDestroyed` / `hpChanged` / `instabilityChanged` -- all present
- `timerWarning` / `timerExpired` -- all present
- `matchEnd` -- present
- `mulliganRequest` / `phaseChanged` / `chaosSparkUsed` -- present
- `opponentHandUpdate` / `serverError` -- present

**Verdict:** Comprehensive coverage. All expected event types accounted for. Custom Codable decoding using `type` discriminator field is correct.

### PlayerAction (PlayerAction.swift)

Defines 10 action types:
- `playCard`, `useChaosSpark`, `endMainPhase`, `declareAttackers`, `assignBlockers`, `chooseEventTarget`, `surrender`, `mulligan`, `reconnect`, `endTurn`

All map to expected server action types from doc 06. The `jsonPayload` property correctly serializes to snake_case format matching server expectations.

**Note:** `PlayerAction` implements `Codable` but the `sendAction` in MatchService uses `channel.broadcast(event:message:)` with a Codable payload. The `jsonPayload` dictionary property is also available but appears to be a legacy parallel path. No functional issue.

### EconomyConfig (EconomyConfig.swift)

- `EconomyConfig` struct with `key, value, description, updatedAt, updatedBy` -- matches economy_config table design.
- `EconomyValue` flexible Codable enum handles JSONB values -- well-implemented.
- `ShardTransaction` matches doc 02 Section 15. All fields present.
- `DustTransaction` -- not explicitly in doc 02 but implied by economy operations. Reasonable addition.
- `EnergyConstants` -- thresholds match doc 02 exactly: 15/30/50/75, energyPerWin=2, energyPerLoss=1. `totalForLegendary=170` (sum of all thresholds) is a convenience constant.
- **Verdict: MATCH**

### MatchRecord (in MatchService.swift vs Doc 02 Section 14)

| Doc 02 Field | Swift Field | Match? | Notes |
|---|---|---|---|
| id | id: UUID | OK | |
| mode | gameMode: GameMode | OK | CodingKey maps to "mode" |
| player_1_id | player1Id: UUID | OK | |
| player_2_id | player2Id: UUID? | OK | |
| winner_id | winnerId: UUID? | OK | |
| loser_id | -- | MISSING | Not in Swift. |
| player_1_deck_id | player1DeckId: UUID | OK | |
| player_2_deck_id | player2DeckId: UUID? | OK | |
| end_reason | endReason: EndReason? | OK | |
| total_turns | totalTurns: Int | OK | |
| duration_seconds | durationSeconds: Int | OK | |
| player_1_final_hp | player1FinalHp: Int | OK | |
| player_2_final_hp | player2FinalHp: Int | OK | |
| started_at | createdAt: Date | OK | CodingKey maps to "started_at" |
| ended_at | endedAt: Date? | OK | |

**Missing from Swift MatchRecord:**
- `loser_id` -- not present (derivable from winner_id, but still missing)
- `player_1_avatar_id`, `player_2_avatar_id` -- not present
- `player_1_faction_id`, `player_2_faction_id` -- not present
- `player_1_rank`, `player_2_rank` -- not present
- `cards_played: CardPlayRecord[]` -- not present
- `total_rolls`, `order_events_p1`, `chaos_events_p1`, etc. -- not present
- `full_log: GameLogEntry[]` -- not present
- `season_id` -- not present

**Verdict:** MatchRecord is significantly truncated compared to doc 02. Many analytics/replay fields are missing. This is likely intentional for the client view (the full record exists server-side), but limits client-side post-match display capabilities.

---

## Service Audit

### AuthService.swift

- **Auth method:** Apple Sign-In via Supabase Auth. Uses `signInWithIdToken` with proper nonce/hashing. Matches doc 06 requirement for Apple Sign-In only.
- **Session management:** `restoreSession()` on app launch, `refreshSession()`, `signOut()`. All present.
- **Auth state listener:** `startAuthListener()` listens for `authStateChanges`. Good.
- **Profile creation:** `ensurePlayerProfile()` calls `"player/ensure-profile"` Edge Function after sign-in. This matches the expected flow.
- **Account deletion:** `deleteAccount()` calls `"player/delete-account"` Edge Function. GDPR-compliant.
- **No anonymous auth:** Doc 06 says "Apple Sign-In Only". AuthService does not implement anonymous/guest auth. MATCH.
- **AppleSignInHelper:** Proper implementation with nonce generation, SHA-256 hashing, and ASAuthorizationController delegation.
- **Verdict: MATCH** -- Comprehensive auth implementation.

### CollectionService.swift

- Uses `SupabaseService.shared` for all queries.
- `fetchCollection()` -- direct Supabase query on `card_instances` table. OK.
- `fetchCollectionByFaction()` -- uses Supabase join syntax (`card_templates!inner(faction_id)`). OK.
- `fetchCard()` -- single card by ID. OK.
- `toggleFavorite()` -- direct update. OK.
- `cardCountByFaction()` -- calls Edge Function `"player/card-counts"`. OK.
- `fetchDecks()` / `fetchDeck()` -- direct queries. OK.
- `createDeck()` / `updateDeck()` -- calls `"save-deck"` Edge Function. OK.
- `deleteDeck()` -- direct delete. OK.
- `setActiveDeck()` -- calls `"player/set-active-deck"` Edge Function. OK.
- `openPack()` -- calls `"open-pack"` Edge Function. OK.
- `fetchCardTemplates()` -- direct query. OK.

**Endpoint mismatch vs doc 06 Section 7.3-7.4:**
- Doc 06 defines REST paths like `GET /collection/cards`, `PATCH /collection/cards/{id}`, `GET /decks`, etc.
- Swift code uses a mix of direct Supabase table queries (bypassing Edge Functions) and Edge Function calls (`"save-deck"`, `"open-pack"`, `"player/card-counts"`).
- The function names don't match doc 06 paths (e.g., doc 06 says `POST /decks` but Swift calls `"save-deck"`).
- **Verdict: MEDIUM MISMATCH** -- Function names diverge from doc 06 endpoint paths, but functionally equivalent. The actual Edge Function implementations will need to match whatever names the client uses.

### EconomyService.swift

- `fetchDustBalance()` -- fetches full Player record to get `chaosDust`. Could use a lighter query. OK functionally.
- `fetchShardBalances()` -- same pattern, fetches Player for shard counts. OK.
- `spendDust()` -- calls `"economy/spend-dust"` Edge Function. Matches doc 06 pattern.
- `fetchDustHistory()` -- direct query on `dust_transactions`. OK.
- `fetchShardHistory()` -- direct query on `shard_transactions`. OK.
- `canAffordShard()` -- client-side check. OK.
- `fetchEconomyConfig()` / `fetchConfigValue()` -- direct queries on `economy_config`. OK.
- `fetchActiveMissions()` -- direct query on `missions` table with filters. OK.
- `claimMission()` -- calls `"economy/claim-mission"` Edge Function. OK.
- `processMatchRewards()` -- calls `"economy/match-rewards"` Edge Function. OK.

**Missing vs doc 06 Section 7.5:**
- `POST /economy/purchase/card-pack` -- handled by CollectionService.openPack instead. Slight responsibility split.
- `POST /economy/purchase/specific-card` -- not implemented anywhere in Swift. **HIGH** -- players cannot purchase individual cards.
- `POST /economy/purchase/shard` -- not implemented. **HIGH** -- players cannot purchase shards with dust.
- `POST /economy/purchase/avatar` -- not implemented. **HIGH** -- players cannot purchase avatars.
- `GET /economy/balance` -- not a single endpoint call; balance is derived from fetching the full Player record.

### EvolutionService.swift

- `startEvolution()` -- calls `"start-evolution"` Edge Function with `card_instance_id` and `channel_direction`. Returns modifier options, stat changes, and job IDs.
- **Doc 06 Section 7.6 endpoint:** `POST /evolution/start` expects `{ card_instance_id, prompt_modifiers, channel_direction }`.
- **Missing from startEvolution:** `prompt_modifiers` parameter. Doc 02 Section 20 (Evolution Flow step 4) says the player selects prompt modifiers. The Swift service does not accept or send prompt modifier selections. **HIGH** -- the evolution art prompt customization feature is missing from the client.
- `confirmEvolution()` -- calls `"complete-evolution"` Edge Function with `evolution_id, card_instance_id, modifier_chosen_id, name_chosen`. Matches doc 06 `POST /evolution/{id}/confirm`.
- Polling: polls `generation_jobs` table directly instead of calling `GET /evolution/{id}/status`. Direct DB query vs Edge Function -- functionally equivalent.
- Status tracking: `EvolutionStatus` enum has granular states (generating, generatingArt, generatingText, choosingModifier, applyingModifiers, completed, failed). Good UX.
- **Missing:** `POST /evolution/check` -- no eligibility check endpoint is called before starting. Client uses local `isEvolutionReady` computed property on CardInstance. This could lead to wasted shard if the server-side validation fails.

### MatchService.swift

- Uses Supabase Realtime (WebSocket) for match communication. Matches doc 06.
- `connect()` -- subscribes to `channel("match:\(matchId)")` and listens for `broadcastStream(event: "game_event")`. Matches doc 06.
- `sendAction()` -- broadcasts `PlayerAction` via Realtime channel broadcast. Matches doc 06.
- Heartbeat: sends every 10 seconds. Good for disconnect detection.
- `fetchMatchRecord()` / `fetchMatchHistory()` -- present. History uses Edge Function `"match/history"`.
- **Reconnection:** No explicit reconnection logic in MatchService itself (unlike the doc 06 pseudocode which shows reconnect attempts). The `connect()` method is called once. If the channel drops, there's no auto-reconnect. **MEDIUM** -- the doc 06 pseudocode shows a `maxReconnectAttempts = 5` with exponential backoff, which is absent here.

### MatchmakingService.swift

- `joinQueue()` -- calls `"join-queue"` Edge Function. Doc 06 says `POST /matchmaking/queue`. Function name differs but functionally equivalent.
- Listens on `channel("matchmaking:\(playerId)")` for `broadcastStream(event: "MATCH_FOUND")`. Doc 06 says event name is `"match_found"` (lowercase). **MEDIUM MISMATCH** -- Swift listens for `"MATCH_FOUND"` (uppercase) but doc 06 example shows `"match_found"` (lowercase). This could cause the client to never receive match-found notifications.
- `leaveQueue()` -- calls `"leave-queue"` Edge Function. Doc 06 says `DELETE /matchmaking/queue`. Function name differs.
- `startPracticeMatch()` -- calls game server directly at `POST /api/practice/start` using URLSession. This bypasses Edge Functions and goes straight to Railway. Matches doc 06's game server REST API pattern.
- Search timer: tracks elapsed search time. Good UX.

### StoreKitService.swift

- **Uses StoreKit 2:** Yes. No RevenueCat. Matches CLAUDE.md requirement.
- Product IDs: `com.chaoscreatures.sub.mid`, `com.chaoscreatures.sub.high`, plus monthly variants. Doc 06 uses `com.chaoscreatures.subscription.mid` and `com.chaoscreatures.subscription.high`.
- **MISMATCH on product IDs:** Swift uses `com.chaoscreatures.sub.mid` while doc 06 uses `com.chaoscreatures.subscription.mid`. These must match App Store Connect configuration exactly. **CRITICAL** -- wrong product IDs will cause product loading to fail.
- Transaction listener: `listenForTransactions()` properly observes `Transaction.updates`. OK.
- `updateSubscriptionStatus()` iterates `Transaction.currentEntitlements`. OK.
- `syncSubscriptionWithBackend()` calls `"sync-entitlements"` Edge Function. Doc 06 shows `"apple-webhook"` as the function name. **MEDIUM** -- function name mismatch, though the actual Edge Function could be named either way.
- `currentTier` computed property maps product IDs to `SubscriptionTier`. OK.
- `checkVerified()` properly validates `VerificationResult`. OK.

### ImageCacheService.swift

- Two-tier caching: NSCache (memory, 200 items, 50MB) + URLCache (disk, 200MB). Matches doc 06 Section 2.6 spec of "200MB disk cache."
- `loadImage()` -- memory check, then URL fetch with deduplication via `activeTasks`. Good.
- `preloadBatch()` / `preloadCardArt()` -- preloads deck images before match. Good.
- Cache management: `clearMemoryCache()`, `clearAllCaches()`, `removeFromCache()`, `isCached()`. Complete.
- `CachedCardArt` SwiftUI view: loads and displays with placeholder. Good integration.
- **Handles R2 CDN URLs:** Uses generic URL loading. R2 URLs will work as long as `artUrl` fields contain full CDN URLs. OK.
- **Verdict: MATCH** -- Well-implemented caching service.

### PostHogService.swift

- Uses PostHog HTTP API directly. No third-party SDK. Matches doc 06 approach.
- Event batching with queue (batch size 10, flush interval 30s). Good.
- `identify()` -- sets user with default properties ($os, $app_version, etc.). OK.
- Predefined events: `trackAppOpen`, `trackSignIn`, `trackMatchStart`, `trackMatchEnd`, `trackEvolution`, `trackPackPurchase`, `trackSubscription`, `trackScreenView`, `trackDeckCreated`, `trackChaosRoll`, `trackOnboarding`. Comprehensive coverage.
- Uses `host = "https://us.i.posthog.com"` which is the US PostHog instance. The `POSTHOG_HOST` from Secrets is not used -- the host is hardcoded. **MEDIUM** -- should use `Secrets.postHogHost` if available, or remove the unused config key.
- Fire-and-forget for API calls (no retry). Acceptable for analytics.
- **Verdict: MATCH** -- Good lightweight analytics implementation.

### SupabaseService.swift

- Singleton with `SupabaseClient` initialization from `Secrets.supabaseURL` and `Secrets.supabaseAnonKey`. Matches doc 06.
- `isConfigured` flag for graceful handling when keys are placeholders. Good.
- Generic query helpers: `fetch()`, `fetchAll()`, `insert()`, `update()`, `delete()`, `callFunction()`. Clean abstractions.
- Table name constants in `Table` enum -- all 18 tables present. Matches expected schema tables.
- `currentUserID` and `currentSession` async computed properties. OK.
- **Verdict: MATCH** -- Well-structured service foundation.

---

## Config Audit

### Secrets.swift

- Reads from `Bundle.main.object(forInfoDictionaryKey:)` -- this reads from Info.plist which references .xcconfig values. Matches doc 06 Section 1.3.
- **Keys present:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `POSTHOG_API_KEY`, `R2_PUBLIC_URL`, `GAME_SERVER_URL`.
- **Missing:** `POSTHOG_HOST` -- doc 06 .xcconfig shows `POSTHOG_HOST = https://app.posthog.com`. Not in Secrets.swift, and PostHogService hardcodes it.
- **No secrets in git:** Values read from .xcconfig which should be gitignored. Correct.
- **No service role key on client:** Correctly absent. The service role key is backend-only.
- **Verdict: MATCH** -- All required client-side keys present.

---

## Theme Audit

### Color+Theme.swift

**Faction colors:**
- Ironwright Collective: primary `#C9A84C`, dark `#8B6914`, accent `#D4AF37`. Present.
- Fey Courts: primary `#4CAF50`, dark `#2E7D32`, accent `#81C784`. Present.
- Demonic Kingdoms: primary `#E63946`, dark `#B71C1C`, accent `#FF5252`. Present.
- All 3 factions represented with primary, dark, and accent variants.

**Rarity colors:**
- Common: `#9E9E9E` (gray). Present.
- Uncommon: `#4CAF50` (green). Present.
- Rare: `#2196F3` (blue). Present.
- Epic: `#9C27B0` (purple). Present.
- Legendary: `#FF9800` (orange). Present.
- All 5 tiers have dedicated colors.

**Helper functions:**
- `tierColor(_:)` -- maps EvolutionTier to rarity color. Present.
- `factionPrimary(_:)` -- maps FactionShortName to faction color. Present.
- `rankColor(_:)` -- maps SeasonRank to rank color (bronze/silver/gold/platinum/diamond/master/grandmaster). Present.

**UIColor extensions for SpriteKit:**
- `FactionShortName.primaryUIColor` -- UIColor versions for SpriteKit rendering. Present.
- `FactionShortName.accentUIColor` -- accent versions. Present.
- `EvolutionTier.borderUIColor` (in BattleCard.swift) -- border colors per tier. Present.
- UIColor hex initializer. Present.

**Battle HUD colors:** orderBlue, chaosRed, healGreen, warningYellow, damageOrange, timerBlue, tauntGold, validGreen, invalidRed. Comprehensive.

**UI theme:** Dark theme with bgPrimary through bgElevated (5 levels), text hierarchy (4 levels), border colors. Well-structured.

**Verdict: COMPLETE** -- All faction, rarity, and UI colors are defined with both SwiftUI (Color) and UIKit (UIColor) variants.

---

## AppState Audit

### AppState.swift

- `@Observable` macro (iOS 17+). Correct per doc 06.
- Holds `AuthService`, `Player?`, `[Faction]`, `[Mission]`.
- `initialize()` -- restores session, starts auth listener, loads player data. Good.
- `loadPlayerData()` -- fetches player by `auth_id`, factions, and active missions. Good.
- `hasCompletedOnboarding` / `needsOnboarding` -- checks `primaryFactionId != nil`. Matches expected onboarding flow.
- `AppTab` enum: Home, Collection, Decks, Profile, Shop. 5 tabs.
- Dev mode for Simulator testing with mock data. Good for development.

**Minor issue in loadPlayerData():** Missions filter uses `("completed", "false")` but the Mission CodingKey is `"is_completed"`. This would likely fail to filter correctly. **MEDIUM** -- the filter column name doesn't match the actual DB column name.

---

## Critical Issues

### C-1: StoreKit Product ID Mismatch
**File:** `ChaosCreatures/ChaosCreatures/Services/StoreKitService.swift`
**Issue:** Product IDs use `com.chaoscreatures.sub.mid/high` but doc 06 defines them as `com.chaoscreatures.subscription.mid/high`.
**Impact:** Products will fail to load from App Store Connect, breaking the entire subscription flow.
**Fix:** Align product IDs between StoreKitService and App Store Connect configuration. Decide on one naming convention and use it everywhere.

### C-2: Duplicate/Conflicting Roll Result Enums
**File:** `ChaosCreatures/ChaosCreatures/Models/Enums.swift` (RollResult) and `ChaosCreatures/ChaosCreatures/Models/BattleCard.swift` (ChaosRollOutcome)
**Issue:** `RollResult` uses lowercase raw values (`order`, `chaos`, `nothing`) while `ChaosRollOutcome` uses UPPER_CASE (`ORDER`, `CHAOS`, `NOTHING`). The server will send one format. If it sends UPPER_CASE (consistent with all other enums), `RollResult` will fail to decode.
**Impact:** Potential JSON decode failure during chaos roll events.
**Fix:** Remove one enum. Use `ChaosRollOutcome` (UPPER_CASE) everywhere since all other enums follow the UPPER_CASE convention.

---

## High Issues

### H-1: Missing Economy Purchase Endpoints
**File:** `ChaosCreatures/ChaosCreatures/Services/EconomyService.swift`
**Issue:** Three economy purchase operations from doc 06 are not implemented:
- `POST /economy/purchase/specific-card` -- buy a specific card template with dust
- `POST /economy/purchase/shard` -- buy shards with dust
- `POST /economy/purchase/avatar` -- buy avatars with dust
**Impact:** Players cannot use Chaos Dust to purchase individual items. Major monetization/progression gap.

### H-2: Missing Prompt Modifiers in Evolution Flow
**File:** `ChaosCreatures/ChaosCreatures/Services/EvolutionService.swift`
**Issue:** `startEvolution()` does not send `prompt_modifiers` to the server. Doc 02 Section 20 step 4 says "Player selects prompt modifiers from tier-appropriate list." Doc 06 Section 7.6 expects `{ card_instance_id, prompt_modifiers, channel_direction }`.
**Impact:** Players cannot customize their evolution art with prompt modifiers. This is a key subscriber-differentiating feature (Free: 8-10 modifiers, Mid: 25-30, High: 40+).

### H-3: Missing Evolution Eligibility Check Endpoint
**File:** `ChaosCreatures/ChaosCreatures/Services/EvolutionService.swift`
**Issue:** Doc 06 defines `POST /evolution/check` to validate eligibility before starting. No such call exists. The client uses local `isEvolutionReady` checks only.
**Impact:** If client-side checks are wrong (e.g., shard balance changed on another device), the server would reject after the UI already committed.

### H-4: Matchmaking Event Name Casing Mismatch
**File:** `ChaosCreatures/ChaosCreatures/Services/MatchmakingService.swift`
**Issue:** Listens for broadcast event `"MATCH_FOUND"` (uppercase). Doc 06 Section 7.7 shows the event as `"match_found"` (lowercase per JSON example).
**Impact:** If the server broadcasts `"match_found"`, the client will never receive it. The player would stay in queue forever.

### H-5: Missing Card Dismantle Endpoint
**File:** `ChaosCreatures/ChaosCreatures/Services/CollectionService.swift`
**Issue:** Doc 06 defines `DELETE /collection/cards/{id}` which returns `{ shard_returned, shard_tier }` -- this is the card dismantle feature. No such method exists in CollectionService.
**Impact:** Players cannot dismantle unwanted cards for shards.

### H-6: Missing Player Update Endpoint
**File:** No service file implements this.
**Issue:** Doc 06 defines `PATCH /players/me` for updating `display_name` and `settings`, and `POST /players/me/faction` for committing to a faction. Neither is implemented in any service.
**Impact:** Players cannot change their display name, update settings to the server, or commit to a faction after onboarding trial.

### H-7: Missing Public Profile Endpoint
**File:** No service file implements this.
**Issue:** Doc 06 defines `GET /players/{id}/public` for viewing other players' profiles (display_name, season_rank, showcase_cards, title). Not implemented.
**Impact:** Cannot view opponent profiles or friend profiles.

---

## Medium Issues

### M-1: BattleTriggeredAbility Uses String for Trigger
**File:** `ChaosCreatures/ChaosCreatures/Models/BattleCard.swift`
**Issue:** `BattleTriggeredAbility.trigger` is `String` instead of `TriggerType`.
**Impact:** No compile-time validation of trigger type values in battle context.

### M-2: BattleCreatureData Missing Modifiers/Abilities
**File:** `ChaosCreatures/ChaosCreatures/Models/BattleCard.swift`
**Issue:** `BattleCreatureData` does not include `modifiers` or `triggeredAbilities` arrays. These exist on `BattleCardData` (hand card representation) but not on the board creature representation.
**Impact:** UI cannot display modifier attunement state or triggered ability names on board creatures.

### M-3: MatchRecord Missing Many Doc 02 Fields
**File:** `ChaosCreatures/ChaosCreatures/Services/MatchService.swift`
**Issue:** MatchRecord lacks: `loser_id`, avatar IDs, faction IDs, ranks, `cards_played`, roll summaries, `full_log`, `season_id`.
**Impact:** Post-match screen cannot show detailed stats (cards played, chaos roll summary, rank changes).

### M-4: PostHogService Ignores POSTHOG_HOST Config
**File:** `ChaosCreatures/ChaosCreatures/Services/PostHogService.swift`
**Issue:** Host is hardcoded to `"https://us.i.posthog.com"`. The `POSTHOG_HOST` from Secrets/xcconfig is defined but unused.
**Impact:** Cannot switch PostHog region without code change.

### M-5: MatchService Missing Auto-Reconnect
**File:** `ChaosCreatures/ChaosCreatures/Services/MatchService.swift`
**Issue:** No auto-reconnect with exponential backoff on WebSocket disconnection. Doc 06 Section 2.5 pseudocode shows `maxReconnectAttempts = 5` with exponential backoff.
**Impact:** Temporary network glitch would permanently disconnect the player from a match.

### M-6: Keywords Stored as [String] Instead of [Keyword]
**File:** `ChaosCreatures/ChaosCreatures/Models/CardTemplate.swift`, `CardInstance.swift`
**Issue:** `baseKeywords`, `innateKeywords`, and `modifierKeywords` are `[String]` instead of `[Keyword]`. Computed properties convert them.
**Impact:** Invalid keyword strings could silently be ignored. No decode-time validation.

### M-7: AppState Mission Filter Column Mismatch
**File:** `ChaosCreatures/ChaosCreatures/App/AppState.swift`
**Issue:** Line 86 filters missions with `("completed", "false")` but the actual DB column is `"is_completed"` (per Mission CodingKeys).
**Impact:** Mission filter query would either fail or return all missions (depending on DB behavior with non-existent column).

### M-8: Edge Function Name Inconsistencies vs Doc 06
**Issue:** Multiple Edge Function names in Swift code don't match doc 06 REST endpoint paths:

| Swift Function Name | Doc 06 Endpoint Path |
|---|---|
| `"join-queue"` | `POST /matchmaking/queue` |
| `"leave-queue"` | `DELETE /matchmaking/queue` |
| `"save-deck"` | `POST /decks` or `PUT /decks/{id}` |
| `"open-pack"` | `POST /economy/purchase/card-pack` |
| `"start-evolution"` | `POST /evolution/start` |
| `"complete-evolution"` | `POST /evolution/{id}/confirm` |
| `"sync-entitlements"` | `"apple-webhook"` |
| `"player/ensure-profile"` | Not in doc 06 |
| `"player/delete-account"` | Not in doc 06 |
| `"player/set-active-deck"` | Not in doc 06 |

**Impact:** When building Edge Functions, the names must match what the client actually calls. Currently, the names used by the client diverge from doc 06's REST API design. The Edge Function implementations need to use the names the client expects.

### M-9: TurnPhase Extra Values
**File:** `ChaosCreatures/ChaosCreatures/Models/Enums.swift`
**Issue:** `TurnPhase` includes `GAME_SETUP` and `GAME_OVER` which are not in doc 02 Section 13.
**Impact:** Low risk. Additive phases that don't conflict. But if the server never sends these values, they're dead code.

### M-10: Missing MatchEvent Type Aliases
**File:** `ChaosCreatures/ChaosCreatures/Models/MatchEvent.swift` and `BattleCard.swift`
**Issue:** Doc 06 Section 2.3 references `MatchEvent` and `BattleCard` as types, but the actual Swift types are named `ServerEvent` and `BattleCardData`/`BattleCreatureData`. Doc 06 pseudocode also references `ChaosRollResult` and `ClientGameState` vs actual implementation names.
**Impact:** Naming confusion between doc 06 pseudocode and actual implementation. No runtime impact.

### M-11: Mission Model Schema Divergence
**File:** `ChaosCreatures/ChaosCreatures/Models/Player.swift` (Mission struct)
**Issue:** Swift Mission model uses `rewardDust, rewardShardTier, rewardShardCount` instead of doc 02's `reward_type, reward_amount, reward_shard_tier?`. The generic reward_type/amount pattern is replaced with explicit fields.
**Impact:** If the DB schema uses doc 02's generic pattern, decoding will fail on the missing fields. Must ensure DB migration matches the Swift model.

---

## Files Audited (Full List)

| File | Path | Lines |
|---|---|---|
| BattleCard.swift | ChaosCreatures/ChaosCreatures/Models/BattleCard.swift | 192 |
| CardInstance.swift | ChaosCreatures/ChaosCreatures/Models/CardInstance.swift | 296 |
| CardTemplate.swift | ChaosCreatures/ChaosCreatures/Models/CardTemplate.swift | 151 |
| Deck.swift | ChaosCreatures/ChaosCreatures/Models/Deck.swift | 117 |
| EconomyConfig.swift | ChaosCreatures/ChaosCreatures/Models/EconomyConfig.swift | 138 |
| Enums.swift | ChaosCreatures/ChaosCreatures/Models/Enums.swift | 624 |
| GameState.swift | ChaosCreatures/ChaosCreatures/Models/GameState.swift | 131 |
| MatchEvent.swift | ChaosCreatures/ChaosCreatures/Models/MatchEvent.swift | 445 |
| Player.swift | ChaosCreatures/ChaosCreatures/Models/Player.swift | 382 |
| PlayerAction.swift | ChaosCreatures/ChaosCreatures/Models/PlayerAction.swift | 69 |
| AuthService.swift | ChaosCreatures/ChaosCreatures/Services/AuthService.swift | 215 |
| CollectionService.swift | ChaosCreatures/ChaosCreatures/Services/CollectionService.swift | 260 |
| EconomyService.swift | ChaosCreatures/ChaosCreatures/Services/EconomyService.swift | 235 |
| EvolutionService.swift | ChaosCreatures/ChaosCreatures/Services/EvolutionService.swift | 347 |
| ImageCacheService.swift | ChaosCreatures/ChaosCreatures/Services/ImageCacheService.swift | 239 |
| MatchService.swift | ChaosCreatures/ChaosCreatures/Services/MatchService.swift | 227 |
| MatchmakingService.swift | ChaosCreatures/ChaosCreatures/Services/MatchmakingService.swift | 299 |
| PostHogService.swift | ChaosCreatures/ChaosCreatures/Services/PostHogService.swift | 260 |
| StoreKitService.swift | ChaosCreatures/ChaosCreatures/Services/StoreKitService.swift | 254 |
| SupabaseService.swift | ChaosCreatures/ChaosCreatures/Services/SupabaseService.swift | 190 |
| Secrets.swift | ChaosCreatures/ChaosCreatures/Config/Secrets.swift | 29 |
| Color+Theme.swift | ChaosCreatures/ChaosCreatures/Extensions/Color+Theme.swift | 182 |
| Data+Codable.swift | ChaosCreatures/ChaosCreatures/Extensions/Data+Codable.swift | 112 |
| View+Loading.swift | ChaosCreatures/ChaosCreatures/Extensions/View+Loading.swift | 268 |
| AppState.swift | ChaosCreatures/ChaosCreatures/App/AppState.swift | 207 |

---

## Checklist Summary

### Model Consistency
- [x] Faction enum values match doc 02 (IRONWRIGHT, FEY_COURTS, DEMONIC_KINGDOMS via FactionShortName)
- [x] CardType enum matches (CREATURE, SPELL, STABILIZER)
- [x] Rarity/EvolutionTier enum matches (COMMON, UNCOMMON, RARE, EPIC, LEGENDARY)
- [x] Keyword enum matches (all 7 keywords)
- [x] CardTemplate fields match card_templates table
- [x] CardInstance fields match card_instances table
- [x] GameState fields match (as client projection)
- [x] Player model matches profiles/players table (with minor additions)
- [x] Deck model matches decks/deck_cards tables
- [x] EconomyConfig matches economy values (thresholds: 15/30/50/75, energy: 2 win / 1 loss)

### Auth Flow
- [x] AuthService uses Supabase Auth (Apple Sign-In)
- [x] JWT token management (via Supabase SDK)
- [x] Session persistence (restoreSession on launch)
- [x] Logout cleanup (signOut clears session)

### API Services
- [ ] CollectionService calls correct endpoints (PARTIAL -- names diverge from doc 06)
- [x] EconomyService handles Chaos Dust, shards, gold correctly
- [ ] EvolutionService matches evolution pipeline (PARTIAL -- missing prompt_modifiers)
- [x] MatchService/MatchmakingService uses WebSocket (Supabase Realtime)
- [x] StoreKitService uses StoreKit 2 (not RevenueCat)
- [x] ImageCacheService handles R2 CDN URLs

### Config
- [x] Secrets.swift loads from .xcconfig (via Info.plist)
- [x] All required API keys present (Supabase URL, anon key, game server URL, PostHog key)
- [x] No secrets committed to git (reads from Info.plist which references gitignored .xcconfig)

### Theme
- [x] Color+Theme has faction colors for all 3 factions
- [x] Rarity colors defined for all 5 tiers
- [x] UIColor variants for SpriteKit
- [x] Rank colors for all ranks
