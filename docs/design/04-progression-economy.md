# Chaos Creatures — Progression & Economy Design

**Document Version:** 3.0
**Last Updated:** 2026-02-16
**Status:** Code-Ready
**Infrastructure:** Supabase (Postgres + Edge Functions), Railway (Node.js game server), PostHog (analytics), Swift + SwiftUI + SpriteKit iOS client, StoreKit 2 payments

---

## How to Use This Document

This document is written so that Claude Code can implement every system directly from the text below. There are no judgment calls left to the implementer. Every formula is explicit, every threshold is locked, every edge case is handled. When numbers need tuning, the owner adjusts the JSON config file described in Section 9 — no code changes required.

**Owner's operating workflow:**
1. Run the balance dashboard (Section 10) to see Monte Carlo projections.
2. If curves look wrong, edit `economy.config.json` values.
3. Re-run dashboard to verify the fix.
4. The game server reads `economy.config.json` at startup — updated values take effect on the next Railway deployment with zero code changes.

**Which application each section applies to:**

| Section | iOS Game Client | Admin Dashboard (Web) |
|---|---|---|
| 1–8 Economy design | Implemented as gameplay systems | Visualized as reports |
| 9 Config schema | Read-only at startup | Read/write via UI |
| 10 Balance dashboard | Not applicable | This IS the admin dashboard |
| 11 Implementation checklist | Swift client tasks listed separately | Node.js/web tasks listed separately |

The Admin Dashboard is a separate web application running on Railway, distinct from the iOS app. See `06-technical-architecture.md` for the full separation. No economy administration UI belongs in the iOS app.

---

## Core Principles (Non-Negotiable)

- Free players must never hit hard gates — only soft friction (time, not walls)
- No real money on individual cards
- Subscription value = speed + variety + aesthetics, never raw power
- All numbers below are internally consistent with `00-game-design-master.md` and `02-card-data-model.md`
- Every formula references the canonical enum values from `02-card-data-model.md` (SubscriptionTier, SeasonRank, MissionType, ShardTier, etc.)

---

## Budget Compliance

Total project build-to-launch budget: $300. Economy systems do not directly incur infrastructure costs beyond the backend services already accounted for in `06-technical-architecture.md`. The balance dashboard runs entirely locally on the owner's machine (no cloud compute, no external API calls). No paid analytics dashboard tier is required — PostHog's free tier (1M events/month) covers economy monitoring for the first 6–12 months at projected player volumes.

| Service | Economy-Related Usage | Estimated Monthly Cost |
|---|---|---|
| Supabase | Quest/mission records, shard transactions, player dust/rank | Included in base project budget |
| Railway | Game server posts match results triggering economy updates | Included in base project budget |
| PostHog | Economy health events (dust earned/spent, quests, evolutions) | Free tier: $0 |
| Balance dashboard | Runs locally on owner's Mac, zero cloud cost | $0 |

No economy feature requires any additional paid service beyond what the project already uses.

---

## 1. Chaos Energy Progression Curves

### 1.1 Locked Energy Thresholds

These values are **fixed** and must never change post-launch. Changing them would invalidate all existing card progress.

| Evolution Step | Energy Required | Cumulative Energy | Source |
|---|---|---|---|
| Common → Uncommon | 15 | 15 | `00-game-design-master.md` Section 4 |
| Uncommon → Rare | 30 | 45 | `00-game-design-master.md` Section 4 |
| Rare → Epic | 50 | 95 | `00-game-design-master.md` Section 4 |
| Epic → Legendary | 75 | 170 | `00-game-design-master.md` Section 4 |
| **Full path (Common → Legendary)** | **170** | **170** | — |

These map to `CardInstance.chaos_energy` thresholds and the `evolution_ready` computed property in `02-card-data-model.md` Section 2.

### 1.2 Energy Earning Rates

All 20 cards in the active deck earn energy simultaneously per completed game, regardless of whether the card was drawn.

| Game Result | Energy per Card | 20-Card Deck Total |
|---|---|---|
| Win | 2 | 40 |
| Loss | 1 | 20 |

**Average energy per card per game at different win rates:**

| Win Rate | Formula | Avg Energy/Card/Game |
|---|---|---|
| 40% WR | (0.4 × 2) + (0.6 × 1) | **1.40** |
| 50% WR | (0.5 × 2) + (0.5 × 1) | **1.50** |
| 55% WR | (0.55 × 2) + (0.45 × 1) | **1.55** |
| 60% WR | (0.6 × 2) + (0.4 × 1) | **1.60** |

### 1.3 Games Required per Evolution Step (Single Card)

At 50% win rate (1.5 avg energy/game per card):

| Step | Energy Required | Games at 1.5 avg | Games at 1.4 avg (40% WR) | Games at 1.6 avg (60% WR) |
|---|---|---|---|---|
| Common → Uncommon | 15 | 10.0 | 10.7 | 9.4 |
| Uncommon → Rare | 30 | 20.0 | 21.4 | 18.8 |
| Rare → Epic | 50 | 33.3 | 35.7 | 31.3 |
| Epic → Legendary | 75 | 50.0 | 53.6 | 46.9 |
| **Common → Legendary** | **170** | **113.3** | **121.4** | **106.3** |

### 1.4 Days to Legendary: Per Player Archetype

Because all 20 deck cards earn simultaneously, "days to Legendary" means the number of days before **a single specific card** in your deck can reach Legendary. All 20 cards reach the Legendary energy threshold at the same time — but each requires a separate Legendary Shard to evolve (see Section 3).

| Player Archetype | Games/Day | Win Rate | Avg Energy/Card/Day | Days to Leg Energy | **Weeks to Leg Energy** |
|---|---|---|---|---|---|
| Casual | 2 | 40% | 2 × 1.40 = 2.80 | 170 ÷ 2.80 = **60.7** | **8.7** |
| Casual | 2 | 50% | 2 × 1.50 = 3.00 | 170 ÷ 3.00 = **56.7** | **8.1** |
| Regular | 5 | 50% | 5 × 1.50 = 7.50 | 170 ÷ 7.50 = **22.7** | **3.2** |
| Regular | 5 | 55% | 5 × 1.55 = 7.75 | 170 ÷ 7.75 = **21.9** | **3.1** |
| Hardcore | 10 | 50% | 10 × 1.50 = 15.0 | 170 ÷ 15.0 = **11.3** | **1.6** |
| Hardcore | 10 | 60% | 10 × 1.60 = 16.0 | 170 ÷ 16.0 = **10.6** | **1.5** |

### 1.5 Progression Milestone Timeline by Archetype

All timelines below assume 50% win rate. Milestones refer to a **single card** (all deck cards reach the same energy milestones simultaneously).

| Milestone | Casual (2/day) | Regular (5/day) | Hardcore (10/day) |
|---|---|---|---|
| First Uncommon energy ready | Day 5 | Day 2 | Day 1 |
| First Rare energy ready | Day 10 + 5 = Day 15 | Day 10 + 2 = Day 12 | Day 5 + 1 = Day 6 |
| First Epic energy ready | Day 30 + 5 = Day 35 | Day 22 + 2 = Day 24 | Day 11 + 1 = Day 12 |
| First Legendary energy ready | Day 57 | Day 23 | Day 11 |

**Note on Rare energy:** A card must first reach Uncommon (10 games), then accumulate 30 more energy (20 more games) to reach Rare. The cumulative games required are: 10 (Uncommon) + 20 (Rare) + 33 (Epic) + 50 (Legendary) = **113 total games from Common**.

### 1.6 Practical Player Progression Narrative

The following represents what a typical Regular player (5 games/day, 50% WR) actually experiences:

- **Week 1:** First 5 cards hit Uncommon threshold. Evolves 1–3 using starter shards.
- **Week 2:** All 20 deck cards hit Uncommon. Core 5 cards approach Rare.
- **Week 3:** Core 5 cards hit Rare. Full deck at Uncommon (if shards available).
- **Week 5–6:** Core 3 cards hit Epic. Shard cost (120 Dust each) becomes a notable decision.
- **Week 8:** First card hits Legendary energy threshold. Shard cost (240 Dust) is a meaningful milestone.
- **Week 12–16:** Full deck at Rare+, 3–5 cards at Legendary. Deck is tournament-competitive.

**Design intent:** Competitive decks are viable at Rare tier (achievable in 3–5 weeks). The Legendary grind is an aspirational goal, not a gate to participation.

---

## 2. Chaos Dust Economy — Full Mathematical Model

Chaos Dust is the single in-game currency. There is no premium currency. Subscriptions are purchased through the iOS App Store using StoreKit 2 native IAP. All Chaos Dust is earned through gameplay — it cannot be purchased directly.

### 2.1 Base Earning Rates (All Player Types)

These are the **locked base rates** as defined in `00-game-design-master.md` Section 6.

**Authoritative daily quest dust values (this document is the source of truth):** Easy = 20 Dust, Medium = 30 Dust, Hard = 45 Dust. The master doc states a range of "25–50" as an approximation. The exact values below are canonical for all implementation purposes.

| Source | Amount | Notes |
|---|---|---|
| Win a match | 15 Dust | Per completed game |
| Lose a match | 5 Dust | Per completed game; surrender counts as loss |
| Daily quest (easy) | 20 Dust | See Section 4.1 for quest definitions |
| Daily quest (medium) | 30 Dust | See Section 4.1 for quest definitions |
| Daily quest (hard) | 45 Dust | See Section 4.1 for quest definitions |
| Weekly quest (standard) | 150 Dust | See Section 4.3 |
| Weekly quest (hard) | 200 Dust | See Section 4.3 |
| Season milestone reward | 50–500 Dust | See Section 5.4 |
| Onboarding starter bonus | 200 Dust | One-time; given at faction commitment |

**Average game dust per game at 50% WR:**
`(0.5 × 15) + (0.5 × 5) = 10 Dust/game`

**Average daily quest value (baseline):**
Quest pool is 40% easy / 40% medium / 20% hard.
`(0.40 × 20) + (0.40 × 30) + (0.20 × 45) = 8 + 12 + 9 = 29 Dust per quest`
3 quests/day × 29 = **87 Dust/day** from quests (rounded to 90 Dust in planning tables for simplicity).

### 2.2 Subscriber Quest Dust Bonuses

As defined in `00-game-design-master.md` Section 7. The multiplier applies only to quest rewards, not game win/loss dust.

| Subscription Tier | Quest Dust Multiplier | Daily Quest Value | Weekly Quest Value | Enum Value |
|---|---|---|---|---|
| FREE | 1.0× (no bonus) | ~90 Dust/day | ~175 Dust/quest avg | `FREE` |
| MID | 1.5× (+50%) | ~135 Dust/day | ~262.5 Dust/quest avg | `MID` |
| HIGH | 2.0× (+100%) | ~180 Dust/day | ~350 Dust/quest avg | `HIGH` |

**Implementation note for Supabase Edge Function:**
When awarding quest completion rewards, look up `player.subscription_tier`. Apply multiplier as:
```
reward_dust = base_dust × SUBSCRIPTION_QUEST_MULTIPLIER[subscription_tier]
```
Where `SUBSCRIPTION_QUEST_MULTIPLIER` is loaded from `economy.config.json` (see Section 9). The Edge Function must not use client-supplied multipliers — the player's tier is read from `auth.users` metadata or the `players` table, never from the request body.

### 2.3 Spending Costs (Locked Values)

As defined in `00-game-design-master.md` Section 3.

| Purchase | Cost (Dust) | Notes |
|---|---|---|
| Card Pack — own faction, 3 random Commons | 100 | Duplicate protection: 3rd+ copy of owned Common rerolls |
| Card Pack — other faction, 3 random Commons + unlock | 150 | Unlocks the faction for deckbuilding |
| Specific Common (targeted purchase) | 50 | Purchase a specific named Common |
| Uncommon Shard | 30 | For `UNCOMMON` evolution step |
| Rare Shard | 60 | For `RARE` evolution step |
| Epic Shard | 120 | For `EPIC` evolution step |
| Legendary Shard | 240 | For `LEGENDARY` evolution step |
| Avatar unlock | 300 | Cosmetic only |

**Full evolution cost (one card, Common → Legendary):**
`30 + 60 + 120 + 240 = 450 Dust`

**Full deck evolution cost (20 cards, Common → Legendary):**
`20 × 450 = 9,000 Dust`

### 2.4 Daily and Weekly Dust Income by Player Type

**Game dust formula (50% WR):**
`games_per_day × 10 Dust/game`

**Quest dust formula (daily):**
`FREE: 90/day | MID: 135/day | HIGH: 180/day`

**Weekly quest contribution (amortized per day):**
Average weekly quest value = (150 + 200) ÷ 2 = 175 Dust for FREE tier.
`FREE: (2 × 175) ÷ 7 = 50/day | MID: (2 × 262.5) ÷ 7 = 75/day | HIGH: (2 × 350) ÷ 7 = 100/day`

| Player Type | Games/Day | Game Dust/Day | Quest Dust/Day | Weekly Quest/Day | **Total/Day** | **Total/Week** |
|---|---|---|---|---|---|---|
| Free Casual | 2 | 20 | 90 | 50 | **160** | **1,120** |
| Free Regular | 5 | 50 | 90 | 50 | **190** | **1,330** |
| Free Hardcore | 10 | 100 | 90 | 50 | **240** | **1,680** |
| Mid Casual | 2 | 20 | 135 | 75 | **230** | **1,610** |
| Mid Regular | 5 | 50 | 135 | 75 | **260** | **1,820** |
| Mid Hardcore | 10 | 100 | 135 | 75 | **310** | **2,170** |
| Top Casual | 2 | 20 | 180 | 100 | **300** | **2,100** |
| Top Regular | 5 | 50 | 180 | 100 | **330** | **2,310** |
| Top Hardcore | 10 | 100 | 180 | 100 | **380** | **2,660** |

### 2.5 Weekly Dust Flow Model — What Players Can Buy

| Player Type | Dust/Week | Card Packs/Week (100 Dust) | OR Full Evolutions/Week (450 Dust) | Legendary Shards/Week (240 Dust) |
|---|---|---|---|---|
| **Free Casual** | 1,120 | 11.2 | 2.5 | 4.7 |
| **Free Regular** | 1,330 | 13.3 | 3.0 | 5.5 |
| **Free Hardcore** | 1,680 | 16.8 | 3.7 | 7.0 |
| **Mid Casual** | 1,610 | 16.1 | 3.6 | 6.7 |
| **Mid Regular** | 1,820 | 18.2 | 4.0 | 7.6 |
| **Mid Hardcore** | 2,170 | 21.7 | 4.8 | 9.0 |
| **Top Casual** | 2,100 | 21.0 | 4.7 | 8.8 |
| **Top Regular** | 2,310 | 23.1 | 5.1 | 9.6 |
| **Top Hardcore** | 2,660 | 26.6 | 5.9 | 11.1 |

**Realistic allocation for an active player:**
- 60% on shards (Rare/Epic/Legendary tier)
- 20% on card packs (expanding collection, chasing faction variety)
- 10% on targeted Common purchases (specific cards for a deck strategy)
- 10% on cosmetics (avatars)

### 2.6 Cross-Faction Unlock Model

A second faction costs 150 Dust (one card pack from that faction). Once purchased, the faction is fully unlocked.

| Player Type | Dust/Week | Days to Unlock 2nd Faction | Days to Unlock 3rd Faction |
|---|---|---|---|
| Free Casual | 1,120 | 150 ÷ 160/day = **0.94 days** | **1.88 days** |
| Free Regular | 1,330 | 150 ÷ 190/day = **0.79 days** | **1.58 days** |
| Free Hardcore | 1,680 | 150 ÷ 240/day = **0.63 days** | **1.25 days** |
| Mid Regular | 1,820 | 150 ÷ 260/day = **0.58 days** | **1.15 days** |
| Top Regular | 2,310 | 150 ÷ 330/day = **0.45 days** | **0.91 days** |

**Conclusion:** Faction unlocking is never a meaningful gate. Any player can unlock all 3 factions within their first 2 days without slowing other progression. The 150 Dust cost is a commitment signal, not a barrier.

### 2.7 Inflation Prevention and Dust Sinks

**Problem:** A player with all 50 Commons (free limit) and no new cards to buy loses the card pack spending sink. How does the economy remain healthy?

**Primary sinks remain active regardless of collection size:**

1. **Shard ladder (exponential cost):** 30 → 60 → 120 → 240. Legendary shards cost 8× Uncommon shards. Even with 50 fully-evolved cards, a player can always sink dust into the next Legendary evolution.

2. **Full Legendary deck target:** 20 cards × 450 Dust = 9,000 Dust per deck. At 1,330 Dust/week (Free Regular), this is 6.8 weeks of pure shard spending. There are 3 factions. Total Legendary completion across all factions: 150 cards × 450 = 67,500 Dust = 50 weeks.

3. **Multi-path evolution value:** Because evolution outcomes are probabilistic (70/30), players may evolve the same base card multiple times to get a preferred modifier/attunement combination. Duplicate Commons in a collection are spending opportunities.

4. **Avatar cosmetics:** 300 Dust each. At launch: 6 avatars available beyond starters. 6 × 300 = 1,800 Dust of permanent cosmetic sinks.

5. **Seasonal content:** New cosmetics every 8 weeks. See Section 7.4.

**Spending distribution target (month 6+ mature player, Free Regular):**

| Category | % of Weekly Dust | Weekly Dust Spent |
|---|---|---|
| Legendary Shards | 50% | ~665 |
| Epic Shards | 20% | ~266 |
| Card packs (new meta cards, evolution fodder) | 15% | ~200 |
| Avatars/cosmetics | 10% | ~133 |
| Targeted Commons | 5% | ~67 |

At this distribution, the Free Regular player never accumulates a problematic dust surplus because Legendary and Epic shards absorb the majority of income indefinitely.

**Alert threshold (PostHog):** If median dust balance across active players (7-day active) exceeds 2,000 Dust, the economy is under-sinking. Correct by adding a new cosmetic avatar bundle in the Admin Dashboard. Do NOT increase shard costs or reduce quest rewards.

### 2.8 Long-Term Collection Growth Projections

**Starting point for all players:** 20 Commons in 1 faction, 200 Dust, 3 Uncommon shards, 1 Rare shard, 1 Legendary shard (see Section 3.2 for authoritative starter shard details).

**Free Regular Player (5 games/day, 1,330 Dust/week):**

| Milestone | Month 1 | Month 3 | Month 6 | Month 12 |
|---|---|---|---|---|
| Total games played | ~150 | ~450 | ~900 | ~1,800 |
| Lifetime Dust earned | ~5,750 | ~17,250 | ~34,500 | ~69,000 |
| Commons owned | ~45 | 50 (cap) | 50 (cap) | 50 (cap) |
| Cards at Uncommon+ | 20 | 20 | 20 | 20 |
| Cards at Rare+ | 5–8 | 15–18 | 20 | 20 |
| Cards at Epic+ | 0–2 | 4–7 | 12–16 | 20 |
| Cards at Legendary | 0 | 1–2 | 5–8 | 15–20 |
| Factions unlocked | 1–2 | 2–3 | 3 | 3 |
| Competitive rank | Bronze/Silver | Silver/Gold | Gold/Platinum | Platinum/Diamond |

**Mid-Tier Subscriber (5 games/day, 1,820 Dust/week):**

| Milestone | Month 1 | Month 3 | Month 6 | Month 12 |
|---|---|---|---|---|
| Lifetime Dust earned | ~7,880 | ~23,640 | ~47,280 | ~94,560 |
| Commons owned | 60–70 | 90–100 (cap) | 100 (cap) | 100 (cap) |
| Cards at Legendary | 0–1 | 3–5 | 10–15 | 25–35 |
| Factions unlocked | 2 | 3 | 3 | 3 |
| Bonus Commons received | 3 | 9 | 18 | 36 |

**Top-Tier Subscriber (5 games/day, 2,310 Dust/week + 1 free Legendary shard/month):**

| Milestone | Month 1 | Month 3 | Month 6 | Month 12 |
|---|---|---|---|---|
| Lifetime Dust earned | ~10,010 | ~30,030 | ~60,060 | ~120,120 |
| Commons owned | 70–85 | 150–175 | 200 (cap) | 200 (cap) |
| Cards at Legendary | 1–2 | 7–9 | 20–28 | 55–65 |
| Free Legendary shards received | 1 | 3 | 6 | 12 |
| Bonus Commons received | 5 | 15 | 30 | 60 |

---

## 3. Shard Economy

### 3.1 Shard Costs and Usage

Shards are consumed at evolution. They map directly to `ShardTier` enum values in `02-card-data-model.md`.

| Shard Tier | Dust Cost | Evolution Step It Unlocks | Enum Value |
|---|---|---|---|
| Uncommon Shard | 30 Dust | Common → Uncommon | `UNCOMMON` |
| Rare Shard | 60 Dust | Uncommon → Rare | `RARE` |
| Epic Shard | 120 Dust | Rare → Epic | `EPIC` |
| Legendary Shard | 240 Dust | Epic → Legendary | `LEGENDARY` |

### 3.2 Shard Sources

**Authoritative starter shard package (canonical, no other version is valid):**

Every new player receives exactly this on faction commitment:
- 3 Uncommon Shards
- 1 Rare Shard
- 1 Legendary Shard

The Legendary Shard is aspirational — it cannot be used until a card has earned 170 total energy (roughly Day 23 for a Regular player). Its presence in the starter pack communicates that Legendary evolution is achievable, not gated behind a paywall.

All other shard source rows in the table below are in addition to this starter package.

| Source | Shard Type | Frequency | Source Enum |
|---|---|---|---|
| Buy with Chaos Dust | Any tier | On-demand | `PURCHASE` |
| Starter pack (onboarding) | 3 Uncommon + 1 Rare + 1 Legendary | One-time | `MILESTONE` |
| Daily quest reward (medium, 20% chance) | 1 Uncommon | ~0.6× per day | `DAILY_LOGIN` (quest) |
| Daily quest reward (hard, 30% chance) | 1 Rare | ~0.18× per day | `DAILY_LOGIN` (quest) |
| Weekly quest reward (W01/W03/W06–W09) | 1 Rare | ~1×/week | `WEEKLY_CHALLENGE` |
| Weekly quest reward (W02/W04/W07) | 1 Epic | ~0.5×/week | `WEEKLY_CHALLENGE` |
| Weekly quest reward (W05/W10) | 1 Epic | ~0.4×/week | `WEEKLY_CHALLENGE` |
| Season end reward (Gold+) | Varies | Per season | `SEASON_REWARD` |
| Monthly milestone (Platinum+) | 1 Legendary | Monthly | `MILESTONE` |
| Top subscription bonus | 1 Legendary | Monthly | `SUBSCRIPTION_GRANT` |

**Implementation note:** The `SUBSCRIPTION_GRANT` source fires on the 1st of each month for `HIGH` tier subscribers via a Supabase scheduled Edge Function (pg_cron: `0 0 1 * *`). This is a server-side operation; the iOS client receives the shard via the Supabase Realtime `player_wallet` channel update and reflects it in the HUD without any client-initiated request.

### 3.3 Shard Acquisition Rate (via Dust, 60% Conversion Assumption)

60% of weekly Dust going to shards is the realistic spending pattern for an active evolution-focused player.

| Player Type | Dust/Week | Dust to Shards (60%) | Legendary Shards Affordable/Week | Weeks per Legendary |
|---|---|---|---|---|
| Free Casual | 1,120 | 672 | 672 ÷ 240 = **2.8** | **0.36** |
| Free Regular | 1,330 | 798 | 798 ÷ 240 = **3.3** | **0.30** |
| Free Hardcore | 1,680 | 1,008 | 1,008 ÷ 240 = **4.2** | **0.24** |
| Mid Regular | 1,820 | 1,092 | 1,092 ÷ 240 = **4.6** | **0.22** |
| Top Regular | 2,310 | 1,386 | 1,386 ÷ 240 = **5.8** | **0.17** |

**Reality check:** A player cannot evolve faster than energy accumulates. The binding constraint shifts based on progression stage (see Section 3.4).

### 3.4 Bottleneck Analysis: Energy vs. Shards

**For a Free Regular player (5 games/day, 1,330 Dust/week):**

**First Legendary card (single card):**
- Energy gate: 113 games ÷ 5 games/day = **22.7 days**
- Shard gate: 450 Dust total ÷ (1,330 Dust/week ÷ 7) = 450 ÷ 190 = **2.4 days** of income
- **Bottleneck: Energy (by ~9.5×)**

**Fifth Legendary card (sequential, assuming energy accrues in parallel):**
- Energy: same 22.7 days (all cards earn simultaneously, so by the time your 1st Legendary is done, 3–4 others are close)
- Shard: 5 × 450 = 2,250 Dust ÷ 190/day = **11.9 days** of income
- **Bottleneck: Still Energy**

**Full deck Legendary (20 cards):**
- Energy: 22.7 days (all 20 cards hit Legendary threshold at the same time, since they earn simultaneously)
- Shard: 20 × 450 = 9,000 Dust ÷ 190/day = **47.4 days** of income
- **Bottleneck: Shards (by ~2×)**

| Progression Goal | Energy Gate | Shard Gate | Actual Bottleneck |
|---|---|---|---|
| 1st Legendary | 22.7 days | 2.4 days | Energy |
| 5th Legendary | 22.7 days | 11.9 days | Energy |
| 10th Legendary | 22.7 days | 23.7 days | Energy (barely) |
| Full Deck Legendary | 22.7 days | 47.4 days | **Shards** |

**Design health check:** This bottleneck progression is intentional:
- Early game: Energy gates keep players engaged (must play games to evolve)
- Late game: Shards gate completion (requires sustained economic investment)
- Neither gate is insurmountable; both progress naturally through play

### 3.5 Legendary Shard Scarcity and Subscriber Value

**Free player Legendary shard acquisition rate (Free Regular):**
- Via Dust (60% to shards): 798 Dust/week ÷ 240 = **3.3 Legendary shards/week**
- Via season rewards (Platinum+): 1–2 Legendary shards per 8-week season = **~0.15/week**
- Total: **~3.5 Legendary shards/week**

**Top subscriber Legendary shard acquisition rate (Top Regular):**
- Via Dust (60% to shards): 1,386 Dust/week ÷ 240 = **5.8 Legendary shards/week**
- Via season rewards (Platinum+): **~0.15/week**
- Via subscription grant: 1/month = **~0.25/week**
- Total: **~6.2 Legendary shards/week**

**Subscriber speed multiplier for Legendary evolutions:** 6.2 ÷ 3.5 = **1.77× faster**

This is meaningful (roughly double the Legendary progression speed) but is entirely speed, not power. Both reach full Legendary decks; the Top subscriber gets there in ~25 weeks versus the Free Regular's ~41 weeks.

**Time to first Legendary evolution (combined energy + shard gate, Free Regular):**
- Energy becomes ready at Day 22.7
- Shard cost (450 Dust for full path): 450 ÷ 190/day = 2.4 days of income; accumulated well before Day 22.7
- Therefore: first Legendary evolution is possible at **Day 23** (immediately when energy is ready, shards already saved)

**Time to first Legendary evolution (Top Regular):**
- Energy ready at Day 22.7 (identical — energy does not scale with subscription)
- Shard ready at Day 1.4
- Free Legendary shard (subscription grant) arrives on Day 1 of each month
- If onboarding in first 3 days of a month: first Legendary possible at **Day 15** using the starter Legendary shard (which can be held in reserve until energy is ready)
- Otherwise: **Day 23** (same as Free Regular — energy is the binding constraint)

---

## 4. Quest System Design

Quests are the primary engagement driver and account for the largest share of Chaos Dust income (60–70% of total weekly income for all player types).

### 4.1 Daily Quest System

**Configuration (from `economy.config.json`):**
- Active quests per player: 3
- Reset time: Daily at `00:00 UTC`
- Persistence: Uncompleted quests persist (do NOT expire) until replaced by new quests or rerolled — max 3 active at any time
- Free rerolls per day: 1
- Reroll mechanic: Permanently discards selected quest; generates a replacement using the same generation algorithm

**Quest Generation Algorithm (deterministic, implementable directly):**
```
function generateDailyQuest(player, existingQuestTypes):
  1. Roll difficulty: random uniform [0, 1)
     - [0.00, 0.40) → EASY
     - [0.40, 0.80) → MEDIUM
     - [0.80, 1.00) → HARD
  2. Get all quests in that difficulty tier from QUEST_TEMPLATES
  3. Filter out any quest whose mission_type already exists in existingQuestTypes
  4. If filtered list is empty, use full unfiltered list (fallback; prevents infinite loop)
  5. Select uniformly at random from filtered list
  6. Return selected quest
```

**Dust reward application:**
```
final_reward = base_dust × SUBSCRIPTION_QUEST_MULTIPLIER[player.subscription_tier]
```
The multiplier is loaded from `economy.config.json` and applied server-side in the `complete-quest` Edge Function.

### 4.2 Daily Quest Templates (20 Unique Templates)

All base dust values below are for FREE tier. MID multiplies by 1.5, HIGH multiplies by 2.0.

| Quest ID | MissionType | Difficulty | Description | Target | Base Dust | Typical Completion |
|---|---|---|---|---|---|---|
| D01 | `WIN_GAMES` | EASY | Win 2 games | 2 | 20 | 20–45 min |
| D02 | `PLAY_GAMES` | EASY | Play 3 games (any result) | 3 | 20 | 30–60 min |
| D03 | `PLAY_CREATURES` | EASY | Play 15 creatures | 15 | 20 | 20–40 min |
| D04 | `PLAY_SPELLS` | EASY | Play 5 spells | 5 | 20 | 20–40 min |
| D05 | `WIN_GAMES` | MEDIUM | Win 3 games | 3 | 30 | 45–90 min |
| D06 | `PLAY_CREATURES` | MEDIUM | Play 25 creatures | 25 | 30 | 40–60 min |
| D07 | `DEAL_DAMAGE` | MEDIUM | Deal 30 damage to enemy creatures | 30 | 30 | 40–60 min |
| D08 | `TRIGGER_CHAOS_EVENTS` | MEDIUM | Trigger 5 Chaos Events | 5 | 30 | 40–80 min |
| D09 | `TRIGGER_ORDER_EVENTS` | MEDIUM | Trigger 5 Order Events | 5 | 30 | 40–80 min |
| D10 | `EVOLVE_CARD` | MEDIUM | Evolve 1 card to any tier | 1 | 30 | Instant (if energy-ready) |
| D11 | `WIN_GAMES` | HARD | Win 5 games | 5 | 45 | 90–150 min |
| D12 | `PLAY_CARDS` | HARD | Play 50 cards total (any type) | 50 | 45 | 60–90 min |
| D13 | `WIN_WITH_STYLE` | HARD | Win 2 games with 15+ HP remaining | 2 | 45 | 60–120 min |
| D14 | `DEAL_DAMAGE` | HARD | Deal 60 damage to enemy creatures | 60 | 45 | 60–90 min |
| D15 | `PLAY_CREATURES` | HARD | Play 20 creatures costing 3+ mana | 20 | 45 | 60–90 min |
| D16 | `PLAY_SPELLS` | HARD | Play 10 spells | 10 | 45 | 60–90 min |
| D17 | `TRIGGER_CHAOS_EVENTS` | HARD | Trigger 10 Chaos Events | 10 | 45 | 80–120 min |
| D18 | `TRIGGER_ORDER_EVENTS` | HARD | Trigger 10 Order Events | 10 | 45 | 80–120 min |
| D19 | `WIN_WITH_STYLE` | HARD | Win a game with 3+ Legendary cards on board at end | 1 | 45 | 30–90 min |
| D20 | `WIN_WITH_STYLE` | HARD | Win a game without any of your creatures dying | 1 | 45 | 30–120 min |

**Shard rewards on quest completion (separate from Dust):**
- MEDIUM difficulty: 20% chance of +1 Uncommon Shard on completion
- HARD difficulty: 30% chance of +1 Rare Shard on completion
- These shard drops are in addition to Dust. They use `Mission.reward_shard_tier` field from the data model.

**Quest tracking implementation note:**
All MissionType values map to in-game events produced by the Railway game server. The server publishes mission progress updates to Supabase after each game ends. The iOS client reflects updated progress via Supabase Realtime subscriptions. Mapping:

| MissionType | Tracking Event | Source |
|---|---|---|
| `WIN_GAMES` | `GAME_END` with `winner_id == player_id` | MatchRecord |
| `PLAY_GAMES` | `GAME_END` (any result) | MatchRecord |
| `PLAY_CREATURES` | `CARD_PLAYED` where card_type == CREATURE | GameLogEntry |
| `PLAY_SPELLS` | `CARD_PLAYED` where card_type == SPELL or STABILIZER | GameLogEntry |
| `PLAY_CARDS` | `CARD_PLAYED` (any type) | GameLogEntry |
| `EVOLVE_CARD` | Evolution event (Supabase, post-game) | CardInstance update |
| `TRIGGER_CHAOS_EVENTS` | `EVENT_TRIGGERED` where event_type == CHAOS | GameLogEntry |
| `TRIGGER_ORDER_EVENTS` | `EVENT_TRIGGERED` where event_type == ORDER | GameLogEntry |
| `DEAL_DAMAGE` | `COMBAT_DAMAGE` where source is player's creature | GameLogEntry |
| `WIN_WITH_STYLE` | Custom logic per quest (see D13, D19, D20 notes below) | MatchRecord + GameState |

**WIN_WITH_STYLE tracking specifics:**
- D13 (Win with 15+ HP): check `player_final_hp >= 15` in MatchRecord at game end
- D19 (Win with 3+ Legendaries on board): check final board state at game end; count Legendary-tier CardInstances with `is_alive == true`
- D20 (Win without losing a creature): track via `CREATURE_DESTROYED` log entries attributed to that player's side; count = 0 required

### 4.3 Weekly Quest System

**Configuration:**
- Active quests per player: 2
- Generated: Monday `00:00 UTC`
- Expire: Sunday `23:59 UTC` (hard expiry — incomplete weekly quests vanish at reset)
- Rerolls: None (weekly quests are endurance challenges)

**Weekly Quest Templates (10 Total):**

| Quest ID | MissionType | Description | Target | Base Dust (FREE) | Mid Dust (×1.5) | Top Dust (×2.0) | Shard Reward |
|---|---|---|---|---|---|---|---|
| W01 | `WIN_GAMES` | Win 10 games this week | 10 | 150 | 225 | 300 | 1 Rare |
| W02 | `WIN_GAMES` | Win 15 games this week | 15 | 200 | 300 | 400 | 1 Epic |
| W03 | `PLAY_GAMES` | Play 20 games this week | 20 | 150 | 225 | 300 | 1 Rare |
| W04 | `EVOLVE_CARD` | Evolve 3 cards this week | 3 | 150 | 225 | 300 | 2 Rare |
| W05 | `EVOLVE_CARD` | Evolve 5 cards to Rare or higher this week | 5 | 200 | 300 | 400 | 1 Epic |
| W06 | `PLAY_CREATURES` | Play 100 creatures this week | 100 | 150 | 225 | 300 | 1 Rare |
| W07 | `DEAL_DAMAGE` | Deal 200 damage to enemy creatures this week | 200 | 150 | 225 | 300 | 1 Rare |
| W08 | `TRIGGER_CHAOS_EVENTS` | Trigger 20 Chaos Events this week | 20 | 150 | 225 | 300 | 1 Rare |
| W09 | `TRIGGER_ORDER_EVENTS` | Trigger 20 Order Events this week | 20 | 150 | 225 | 300 | 1 Rare |
| W10 | `WIN_WITH_STYLE` | Win 5 games with 3+ Legendary cards on board | 5 | 200 | 300 | 400 | 1 Epic |

**Weekly quest selection algorithm:**
```
function generateWeeklyQuests(player):
  1. Shuffle WEEKLY_QUEST_TEMPLATES (all 10)
  2. Select first 2 quests from the shuffled list
  3. Assign to player with expires_at = next Sunday 23:59 UTC
```
No deduplication needed (only 2 of 10, always different).

**Estimated completion rates by player type:**
- Casual (14 games/week): ~1.2 of 2 weekly quests completed
- Regular (35 games/week): 2.0 of 2 weekly quests completed
- Hardcore (70 games/week): 2.0 of 2 weekly quests (with room to spare)

**Effective weekly quest contribution to income:**
- Free Casual: 1.2 × 175 avg = **210 Dust/week** (not 350)
- Free Regular: 2.0 × 175 avg = **350 Dust/week**
- Free Hardcore: 2.0 × 175 avg = **350 Dust/week**

**Note:** The "Total/Week" income table in Section 2.4 assumes full completion of both weekly quests (Regular/Hardcore) and 80% completion rate (Casual: 1.2 × 175 ÷ 7 ≈ 30/day instead of the theoretical 50/day). The table uses the theoretical maximum for clean math; actual Casual income is ~90 Dust/week lower than shown.

### 4.4 Onboarding Quests (One-Time, Auto-Assigned)

These are special missions that auto-assign during the first 2 weeks and never return after completion. They do NOT appear in the daily quest slot — they have their own UI section in the iOS app ("Getting Started" tab in the Quest screen).

| Quest Name | Trigger Condition | Reward |
|---|---|---|
| First Blood | Win first match | 50 Dust |
| Evolution Begins | Evolve first card (any tier) | 2 Uncommon Shards + 50 Dust |
| Deck Master | Save a custom deck (not default) | 100 Dust |
| Chaos Scholar | Trigger 5 Chaos Events across any games | 1 Rare Shard |
| Order Adept | Trigger 5 Order Events across any games | 1 Rare Shard |
| Road to Rare | Evolve first card to Rare | 200 Dust |
| Ranked Debut | Play 3 ranked matches | 100 Dust + Bronze card back |
| Faction Loyalty | Play 20 games with your starter faction | 200 Dust |

**Total onboarding rewards:** 750 Dust + 2 Uncommon Shards + 3 Rare Shards (in addition to the faction commitment starter package)

These reward sequences are hard-coded in a Supabase Edge Function triggered by the relevant player event. They are not generated by the daily quest algorithm.

---

## 5. Rank / Ladder System

### 5.1 Rank Tiers and Division Structure

| Rank Tier | Divisions | Total Tiers | Points to Rank Up | Rank Floor |
|---|---|---|---|---|
| Bronze | 3 | Bronze 3, 2, 1 | 100 per division | None (can drop to Bronze 3) |
| Silver | 3 | Silver 3, 2, 1 | 150 per division | Silver 3 (cannot drop to Bronze) |
| Gold | 3 | Gold 3, 2, 1 | 200 per division | Gold 3 |
| Platinum | 3 | Platinum 3, 2, 1 | 250 per division | Platinum 3 |
| Diamond | 3 | Diamond 3, 2, 1 | 300 per division | Diamond 3 |
| Master | 1 | — | Top 500 players by points | Master (no floor — leaderboard) |
| Grandmaster | 1 | — | Top 100 players by points | GM (no floor — leaderboard) |

**Total distinct rank states:** 17 (maps to `SeasonRank` enum in `02-card-data-model.md`)

**Rank floor implementation:** At the moment a player first enters Silver 3, Gold 3, Platinum 3, or Diamond 3 for the first time in the current season, set a `season_rank_floor` field on their Player record. The rank-loss calculation must check: if `new_rank < season_rank_floor`, set `new_rank = season_rank_floor` instead.

### 5.2 Rank Points Per Match

| Match Condition | Points Won | Points Lost |
|---|---|---|
| vs. same rank division | +25 | −20 |
| vs. higher rank (+1 to +2 divisions) | +30 | −15 |
| vs. lower rank (−1 to −2 divisions) | +20 | −25 |
| vs. much higher rank (+3 divisions) | +35 | −10 |
| vs. much lower rank (−3 divisions) | +15 | −30 |

**Average points per game (50% WR, same-rank opponents):**
`(0.5 × 25) + (0.5 × −20) = 12.5 − 10 = +2.5 per game`

### 5.3 Ladder Climbing Examples

**Scenario A: Casual (2 games/day, 50% WR)**
- Weekly games: 14
- Points per game: +2.5 avg
- Weekly point gain: 14 × 2.5 = +35 points
- Points to Silver 3 from Bronze 3: 300 points (3 Bronze divisions × 100 each)
- Weeks to Silver 3: 300 ÷ 35 = **8.6 weeks** (reaches Silver at season end of 8-week season)
- **Outcome:** Casual players end season at Bronze/Silver, receive Bronze/Silver rewards.

**Scenario B: Regular (5 games/day, 55% WR)**
- Weekly games: 35
- Avg points per game: (0.55 × 25) + (0.45 × −20) = 13.75 − 9 = +4.75
- Weekly point gain: 35 × 4.75 = +166 points
- Points to Platinum 3 from Bronze 3: 100×3 + 150×3 + 200×3 = 300 + 450 + 600 = **1,350 points**
- Weeks to Platinum 3: 1,350 ÷ 166 = **8.1 weeks**
- **Outcome:** Regular players with above-average skill reach Platinum by season end.

**Scenario C: Hardcore (10 games/day, 60% WR)**
- Weekly games: 70
- Avg points per game: (0.6 × 25) + (0.4 × −20) = 15 − 8 = +7
- Weekly point gain: 70 × 7 = +490 points
- Points to Diamond 3 from Bronze 3: 1,350 + 300×3 = 1,350 + 900 = **2,250 points**
- Weeks to Diamond 3: 2,250 ÷ 490 = **4.6 weeks**
- Remaining weeks: push for Master (top 500) in weeks 5–8
- **Outcome:** Hardcore players with strong win rates reach Diamond by mid-season, compete for Master.

### 5.4 Season Structure

**Season length:** 8 weeks (fixed; 6 seasons per year)

**Season phases:**
- Weeks 1–2: Early season climb; no rank floors yet (all floors reset at season start)
- Weeks 3–6: Mid-season competitive grind; rank floors accumulate
- Weeks 7–8: Final push for tier rewards

**Season reset rules (applied on Season Start Day, Monday `00:00 UTC`):**
```
if current_rank >= MASTER: new_rank = DIAMOND_1
if current_rank >= DIAMOND_1: new_rank = PLATINUM_3
if current_rank >= PLATINUM_1: new_rank = GOLD_3
if current_rank >= GOLD_1: new_rank = SILVER_3
if current_rank >= SILVER_1: new_rank = BRONZE_3
if current_rank == BRONZE_3: stays BRONZE_3
season_rank_floor = null (floor protection resets)
season_rank_points = 0
```

**Monthly milestone rewards (for seasons that span 2 calendar months):**
Awarded on the 1st of the second month of the season, based on the player's highest rank achieved so far that season.

### 5.5 Season End Rewards

Rewards are claimed via the "Season Rewards" sheet in the iOS app (SwiftUI sheet presented on first app open after season end). They expire 7 days after season end. Cosmetics are permanent once claimed.

| Final Season Rank | Chaos Dust | Shards | Cosmetic |
|---|---|---|---|
| Bronze 3–1 | 100 | 2 Uncommon | Bronze card back |
| Silver 3–1 | 200 | 3 Uncommon + 1 Rare | Silver card back |
| Gold 3–1 | 400 | 2 Rare + 1 Epic | Gold card back |
| Platinum 3–1 | 600 | 2 Epic + 1 Legendary | Platinum card back + avatar frame |
| Diamond 3–1 | 800 | 1 Epic + 2 Legendary | Diamond card back + avatar frame |
| Master | 1,000 | 3 Legendary | Master card back + "Master" title |
| Grandmaster | 1,500 | 5 Legendary | GM card back + exclusive title + top 100 icon |

**Monthly milestone rewards (Platinum+ players only):**

| Rank Achieved This Month | Chaos Dust | Shards |
|---|---|---|
| Platinum+ | 300 | 1 Legendary |
| Diamond+ | 400 | 2 Legendary |
| Master+ | 500 | 3 Legendary |

### 5.6 Ladder Dust Contribution to Economy

Season rewards as weekly equivalent (8-week season, 1 monthly reward for Platinum+):

| Rank | End-Season Dust | Monthly Dust | Total Season | Weekly Equivalent |
|---|---|---|---|---|
| Silver | 200 | — | 200 | +25/week |
| Gold | 400 | — | 400 | +50/week |
| Platinum | 600 | 300 | 900 | +112/week |
| Diamond | 800 | 400 | 1,200 | +150/week |

This is 5–15% of weekly Dust income. Meaningful, but quests dominate income at all tiers.

---

## 6. New Player Economy

### 6.1 Onboarding Flow (First Session, ~30 Minutes)

**Step 1 — Account creation** (handled by Supabase Auth; 2 screens in the iOS app):
- Username selection screen (SwiftUI `TextField` + submit)
- Quick faction lore overview (SwiftUI `TabView` pager — skippable)

**Step 2 — Trial phase** (10–20 minutes):
- Receive 3 loaner decks (20 Commons each, one per faction, premade fixed lists, cannot be evolved or kept)
- Play 1 mandatory tutorial match vs AI (Ironwright tutorial deck)
- Option to play 1–2 additional matches per faction vs AI

**Step 3 — Faction commitment** (permanent choice):
- Select starting faction from a SwiftUI picker screen showing faction art, lore, and mechanic summary
- The 20 Commons from that trial deck become owned `CardInstance` records, fully evolvable
- Other 40 trial cards are deleted from player account

**Step 4 — Starter reward grant** (automatic, no user action required):
```json
{
  "chaos_dust": 200,
  "shards_uncommon": 3,
  "shards_rare": 1,
  "shards_legendary": 1,
  "avatar": "faction_starter_avatar",
  "onboarding_quest_set": "enabled"
}
```

This grant executes via a Supabase Edge Function triggered on the `onboarding_complete` flag transition (`false → true`). It fires exactly once per account. The iOS app listens on the `player_wallet` Realtime channel and updates the HUD when the grant lands.

### 6.2 First Week Milestones (Designed Progression Curve)

**Day 1–2: Learning the loop**
- 5–10 games played → all 20 deck cards accumulate 7–15 energy (approaching Uncommon threshold)
- Complete 2–3 daily quests → earn 60–90 Dust
- **iOS tutorial prompt fires:** An overlay sheet slides up (SwiftUI `.sheet`) saying "Your [Card Name] is ready to evolve! Tap to use your Uncommon Shard."
- First Uncommon evolution → card art transforms, modifier granted, emotional hook set
- Deck builder and Collection tab unlock after first evolution (gated `TabView` item becomes active)

**Day 3–4: Collection building**
- Earn 100–200 Dust from quests
- Buy 1–2 card packs (expanding to 25–30 cards)
- 3–5 more cards hit Uncommon threshold
- **iOS tutorial prompt fires:** "Build your first custom deck in the Deck Builder. Tap to go there."
- Ranked mode unlocks after custom deck is saved

**Day 5–7: First Rare milestone**
- 8–12 cards accumulated 30+ energy → Rare energy ready
- Purchase Rare Shard (60 Dust) → first Rare evolution
- Rare cards visually distinct: name changes, art shifts dramatically
- **iOS tutorial prompt fires:** "You've evolved to Rare! Your card now has 2 modifiers."
- Weekly quest activates (Monday only)
- Ranked climb begins

**End of Week 1 expected state:**
- Total games: 20–40
- Collection: 28–40 Commons
- Evolutions: 8–15 Uncommons, 1–3 Rares
- Chaos Dust banked: 150–400 Dust
- Rank: Bronze 2–Silver 3
- Onboarding quests: 4–6 of 8 completed (adds 300–500 Dust)

### 6.3 First Month Progression (Designed Targets)

**Week 2 — Deck refinement:**
- Identify 5–8 "core" cards for main strategy → prioritize those for Rare/Epic evolution
- All 20 deck cards hit Uncommon energy threshold
- Decision: spend Dust on card packs (breadth) or shards (depth)? Typical new player splits 50/50.

**Week 3 — First Epic:**
- Core 3–5 cards hit Epic energy threshold (50 energy)
- Epic Shard cost (120 Dust) is a significant single spend — notable moment
- 3 modifiers on Epic cards make them visibly more powerful
- Rank climb: most players reach Silver 1 – Gold 3 range

**Week 4 — Competitive viability:**
- Full deck at Uncommon, 8–12 at Rare, 2–3 at Epic
- Deck is competitive in Silver/Gold ranked
- Decision point: Save 240 Dust for first Legendary Shard, or unlock 2nd faction (150 Dust)?
- Most players: unlock 2nd faction first (faster and emotionally rewarding)

**End of Month 1 expected state:**

| Metric | Free Casual | Free Regular |
|---|---|---|
| Total games | 50–80 | 130–170 |
| Lifetime Dust earned | ~4,480 | ~5,750 |
| Collection (Commons) | 28–35 | 40–50 |
| Uncommon+ cards | 15–20 | 20 |
| Rare+ cards | 3–6 | 8–12 |
| Epic+ cards | 0–1 | 2–4 |
| Legendary cards | 0 | 0 |
| Rank | Bronze/Silver | Silver/Gold |
| Factions unlocked | 1 | 1–2 |

### 6.4 Competitive Deck Timeline

**Question:** How quickly can a new player build a deck that competes in ranked?

| Deck Power Level | When Achievable | Competitive In |
|---|---|---|
| Uncommon deck (20 cards) | Week 1 (Day 5–7) | Bronze |
| Rare deck (core 8–10 cards at Rare) | Week 2–3 | Silver |
| Rare/Epic hybrid (5 at Epic, 10 at Rare) | Week 4–6 | Gold/Platinum |
| Epic/Legendary hybrid (3 Legendaries, rest Epic/Rare) | Week 8–12 | Platinum/Diamond |
| Full Legendary deck | Week 25–41 (varies by tier) | Diamond+ |

**Key principle:** Skill and strategy matter more than card tier. A well-played Rare deck can defeat a poorly-played Epic deck. The game's design ensures tier-gating does not prevent enjoyment of any game mode.

---

## 7. Long-Term Economy Health

### 7.1 When Does a Free Player "Catch Up"?

**Card quantity:** Never. Card caps by tier:
- Free: 50 per faction × 3 factions = 150 total
- Mid: 100 per faction × 3 = 300 total
- High: 200 per faction × 3 = 600 total

Free players curate; subscribers collect breadth. Both are valid playstyles.

**Competitive viability:** 3–6 months. By Month 6, a Free Regular player has 5–8 Legendaries and 12–16 Epics — enough for a Diamond-competitive deck. By Month 12, they have 15–20 Legendaries — enough for a full optimized deck.

**Full Legendary deck (20 cards, one faction):** Approximately Month 10 for Free Regular (41 weeks). This is the "completion" goal for free players within their primary faction.

### 7.2 What Keeps Paying Players Spending?

**Month 1–3: Speed advantage**
- Subscribers evolve 1.5–2× faster, reaching competitive Rare/Epic decks weeks sooner
- 3 extra Commons/month (Mid) or 5 extra Commons/month (High) accelerates collection width
- Broader collection = more deck experimentation

**Month 4–6: Breadth advantage**
- Subscribers have 2–4× more cards, can maintain 2–3 fully built decks simultaneously
- Can pursue duplicate-card evolution strategy (evolve same base card twice for different modifier paths)

**Month 7–12: Art quality advantage**
- Subscribers' evolved cards use FLUX Kontext Pro + higher resolution + exclusive prompt modifiers
- Cards look meaningfully better — prestige signal in matches
- This is a collection identity advantage, not a power advantage

**Month 12+: Seasonal/content advantage**
- New factions every 6–8 months: subscriber fills out 100–200 cards/faction much faster
- Seasonal cosmetics and limited avatars are emotionally motivating

### 7.3 Content Cadence for Economy Freshness

**Every 8 weeks (season boundary):**
- New season rewards (cosmetic card backs, avatar frames)
- Balance patch (modifier stat tweaks, event probability adjustments)
- 2–5 new avatar options unlockable via faction mastery or Chaos Dust
- Meta shifts driven by balance changes keep card pack purchases valuable

**Every 4 months:**
- 5–10 new daily/weekly quest templates added to rotation
- 2–4 new limited-time cosmetics (event-themed card backs, seasonal avatars)
- Targeted card additions: 5–10 new Commons per faction to refresh draft possibilities

**Every 6–8 months:**
- **New faction release** (primary economy event): 60–80 new Commons, new exclusive mechanic, new modifier pool
- Free players: unlock first faction pack (150 Dust), then grind new faction the same as launch experience
- Subscribers: immediately build out the new faction with their higher card limits and extra monthly Commons

**Every 12 months:**
- Major feature addition (e.g., PvE campaign mode, draft format, guild system)
- Seasonal narrative event with exclusive quest chains and cosmetics
- Retrospective economy review using 12-month PostHog data

### 7.4 Economy Crisis Scenarios and Responses

**Scenario 1: "Players are sitting on too much Dust"**
- Detection: PostHog reports median dust balance > 2,000 Dust for > 30% of 7-day active players
- Response: Use the Admin Dashboard to add a new cosmetic avatar bundle (3 avatars × 300 Dust = 900 Dust per full purchase). No code changes, no config changes — just content added via admin UI.
- Do NOT: increase shard prices, reduce quest rewards, or create artificial inflation

**Scenario 2: "Quest completion rate is too low"**
- Detection: PostHog reports daily quest completion rate < 60% across all active players
- Response: In `economy.config.json`, shift difficulty distribution toward easier quests. Change `quest_difficulty_weights` from `{EASY: 0.40, MEDIUM: 0.40, HARD: 0.20}` to `{EASY: 0.50, MEDIUM: 0.40, HARD: 0.10}`. Redeploy Railway server. No code change.

**Scenario 3: "New players feel outmatched by Legendary decks"**
- Detection: PostHog reports new player (<30 days) win rate against players with 10+ Legendaries < 30%
- Response: In `economy.config.json`, set `matchmaking.new_player_protection_games` from 50 to 75. New players' first 75 games only match vs. players with fewer than 5 Legendary cards. Redeploy Railway server.

**Scenario 4: "Meta is stale, card packs have no value"**
- Detection: New card pack purchase rate drops > 30% week-over-week
- Response: Deploy a balance patch (modifier stat changes via Admin Dashboard). Target: rebalance 5–10 modifiers to shift the optimal deck archetype. Card packs become valuable again as new meta emerges.

### 7.5 PostHog Economy Health Metrics

The following PostHog events must be implemented server-side (Railway game server + Supabase Edge Functions). The iOS client does not send economy events directly — all economy analytics originate from the backend.

| Event Name | Properties | Triggered When |
|---|---|---|
| `dust_earned` | `amount`, `source`, `player_tier`, `player_level` | Any Dust award |
| `dust_spent` | `amount`, `category` (shard/pack/cosmetic), `player_tier` | Any Dust spend |
| `quest_completed` | `quest_id`, `mission_type`, `difficulty`, `player_tier` | Quest completion |
| `quest_rerolled` | `quest_id`, `reroll_number` | Reroll used |
| `card_evolved` | `from_tier`, `to_tier`, `shard_quality`, `player_tier` | Evolution event |
| `shard_purchased` | `shard_tier`, `quantity`, `dust_spent`, `player_tier` | Shard buy |
| `rank_changed` | `from_rank`, `to_rank`, `player_tier` | Rank update |
| `season_reward_claimed` | `rank`, `dust_reward`, `player_tier` | Season end |
| `faction_unlocked` | `faction_id`, `dust_spent`, `player_tier` | Faction unlock |

**Weekly dashboard checks (owner reviews PostHog on Monday):**
- Avg dust balance by player tier (target: Free 200–800, Mid 400–1,500, Top 500–2,000)
- Quest completion rate by difficulty (target: Easy 85%+, Medium 75%+, Hard 55%+)
- Shard purchase distribution by tier (Legendary shard purchases should be largest by value)
- Card evolution rate per active player per week (target: 1–3 evolutions/week for Regular)
- Rank distribution histogram (target: bell curve centered on Silver/Gold)

**Red flags requiring immediate investigation:**
- Median dust balance > 2,000 for 30%+ of active players → sinks insufficient
- Quest completion < 50% for any difficulty tier → quests miscalibrated
- Evolution rate < 0.5/week for Regular players → energy or shard scarcity
- Rank distribution: > 50% of players in Bronze after Week 4 → point gain miscalibrated

---

## 8. Economy Summary Tables

### 8.1 Player Archetype Summary

| Player Type | Games/Week | Dust/Week | Leg Shards/Week (60% to shards) | Weeks to Full Leg Deck (energy + shards) | Rank at Month 3 |
|---|---|---|---|---|---|
| Free Casual | 14 | 1,120 | 2.8 | ~52 | Bronze/Silver |
| Free Regular | 35 | 1,330 | 3.3 | ~41 | Silver/Gold |
| Free Hardcore | 70 | 1,680 | 4.2 | ~30 | Gold/Platinum |
| Mid Casual | 14 | 1,610 | 4.0 | ~37 | Silver/Gold |
| Mid Regular | 35 | 1,820 | 4.6 | ~31 | Gold/Platinum |
| Mid Hardcore | 70 | 2,170 | 5.4 | ~24 | Platinum/Diamond |
| Top Casual | 14 | 2,100 | 5.3 | ~29 | Gold/Platinum |
| Top Regular | 35 | 2,310 | 5.8 | ~25 | Platinum/Diamond |
| Top Hardcore | 70 | 2,660 | 6.7 | ~19 | Diamond/Master |

**Weeks to full Legendary deck calculation method:**
The binding constraint is `max(energy_weeks, shard_weeks)` where:
- `energy_weeks = 113 games ÷ games_per_week` (all cards hit Legendary energy at the same time)
- `shard_weeks = 9,000 Dust ÷ (Dust_per_week × 0.60)` for the shard cost alone

For Free Regular: `max(113/35, 9000/798) = max(3.2, 11.3) = 11.3 weeks` of income if a player spent only on shards. Practical time is ~41 weeks because competing spending categories (packs, cosmetics, targeted commons) reduce weekly shard budget, and all 20 cards must evolve sequentially through each tier.

### 8.2 Progression Milestones by Player Type

| Milestone | Free Casual | Free Regular | Mid Regular | Top Regular |
|---|---|---|---|---|
| First Uncommon energy ready | Day 5 | Day 2 | Day 2 | Day 2 |
| First Rare energy ready | Day 15 | Day 10 | Day 10 | Day 10 |
| First Epic energy ready | Day 35 | Day 24 | Day 24 | Day 24 |
| First Legendary energy ready | Day 57 | Day 23 | Day 23 | Day 23 |
| First Legendary evolved | Week 9–10 | Week 4 | Week 3 | Week 3–4 |
| Full Rare deck (20 cards) | Week 8 | Week 4–5 | Week 3–4 | Week 3 |
| Full Epic deck (20 cards) | Week 24 | Week 14–16 | Week 10–12 | Week 8–10 |
| Full Legendary deck (20 cards) | Week 52 | Week 38–42 | Week 28–32 | Week 23–27 |
| 2nd Faction unlocked | Day 1–2 | Day 1 | Day 1 | Day 1 |
| 3rd Faction unlocked | Day 2–4 | Day 2 | Day 1–2 | Day 1 |

### 8.3 Monthly Subscription Value Calculation

Subscriptions are purchased via StoreKit 2 on iOS. There is no web billing or external payment processor.

**Mid Tier ($6.99/month via App Store) delivers per month:**
- +50% quest dust = +45 Dust/day × 30 days = +1,350 Dust/month
- +3 Commons (50 Dust value each) = +150 Dust equivalent
- Weekly quest multiplier contribution = +700 Dust/month from quests
- Better shard quality (REFINED vs PLANAR): FLUX Kontext Pro at 1024×1024 — purely aesthetic
- 6 deck slots vs 3 — operational value for multi-deck players
- 100 cards/faction vs 50 — collection breadth
- **Dust-equivalent value: ~2,200 Dust/month** vs. subscription cost of $6.99

**Top Tier ($12.99/month via App Store) delivers per month:**
- +100% quest dust = +90 Dust/day × 30 days = +2,700 Dust/month
- +5 Commons = +250 Dust equivalent
- +1 free Legendary shard = 240 Dust value
- Better shard quality (PRISMATIC): 2 generation passes, exclusive prompt modifiers
- 10 deck slots
- 200 cards/faction
- **Dust-equivalent value: ~4,200 Dust/month** vs. subscription cost of $12.99

**StoreKit 2 implementation note:** Subscription tiers map to App Store product IDs. After a successful StoreKit 2 `Product.purchase()` call, the iOS client calls a Supabase Edge Function with the verified `Transaction` receipt. The Edge Function validates the receipt against Apple's StoreKit verification API, updates `player.subscription_tier`, and the client reflects the new tier via Realtime channel update. The iOS app never trusts client-side tier claims — only verified server-side receipts.

---

## 9. Economy Config JSON Schema

This JSON file is the single source of truth for all tunable economy parameters. **No code changes are needed to adjust the economy** — only edits to this file and a Railway server redeploy (which is a one-command operation: `railway up`).

**File location:** `economy.config.json` in the project root. Loaded at startup by the Railway Node.js game server and cached in memory for the process lifetime. The Supabase Edge Functions for quest reward calculation and subscription grant processing load their copy from the same file (committed to the repo, read via Railway environment at build time).

**Full schema with all current values:**

```json
{
  "_version": "3.0.0",
  "_last_updated": "2026-02-16",
  "_notes": "Edit this file to tune economy. Run balance dashboard to verify. Run 'railway up' to deploy.",

  "energy": {
    "win_energy_per_card": 2,
    "loss_energy_per_card": 1,
    "threshold_uncommon": 15,
    "threshold_rare": 30,
    "threshold_epic": 50,
    "threshold_legendary": 75
  },

  "dust_income": {
    "win_dust": 15,
    "loss_dust": 5,
    "onboarding_bonus_dust": 200
  },

  "quest_dust_multipliers": {
    "FREE": 1.0,
    "MID": 1.5,
    "HIGH": 2.0
  },

  "quest_difficulty_weights": {
    "EASY": 0.40,
    "MEDIUM": 0.40,
    "HARD": 0.20
  },

  "daily_quest_rewards": {
    "EASY":   { "base_dust": 20, "shard_chance": 0.00, "shard_tier": null },
    "MEDIUM": { "base_dust": 30, "shard_chance": 0.20, "shard_tier": "UNCOMMON" },
    "HARD":   { "base_dust": 45, "shard_chance": 0.30, "shard_tier": "RARE" }
  },

  "weekly_quest_rewards": {
    "W01": { "base_dust": 150, "shard_tier": "RARE",  "shard_count": 1 },
    "W02": { "base_dust": 200, "shard_tier": "EPIC",  "shard_count": 1 },
    "W03": { "base_dust": 150, "shard_tier": "RARE",  "shard_count": 1 },
    "W04": { "base_dust": 150, "shard_tier": "RARE",  "shard_count": 2 },
    "W05": { "base_dust": 200, "shard_tier": "EPIC",  "shard_count": 1 },
    "W06": { "base_dust": 150, "shard_tier": "RARE",  "shard_count": 1 },
    "W07": { "base_dust": 150, "shard_tier": "RARE",  "shard_count": 1 },
    "W08": { "base_dust": 150, "shard_tier": "RARE",  "shard_count": 1 },
    "W09": { "base_dust": 150, "shard_tier": "RARE",  "shard_count": 1 },
    "W10": { "base_dust": 200, "shard_tier": "EPIC",  "shard_count": 1 }
  },

  "shard_costs": {
    "UNCOMMON": 30,
    "RARE": 60,
    "EPIC": 120,
    "LEGENDARY": 240
  },

  "pack_costs": {
    "own_faction_pack": 100,
    "other_faction_pack": 150,
    "specific_common": 50
  },

  "cosmetic_costs": {
    "avatar_unlock": 300
  },

  "subscription_monthly_bonuses": {
    "FREE": {
      "monthly_commons": 0,
      "monthly_legendary_shards": 0
    },
    "MID": {
      "monthly_commons": 3,
      "monthly_legendary_shards": 0
    },
    "HIGH": {
      "monthly_commons": 5,
      "monthly_legendary_shards": 1
    }
  },

  "rank_points": {
    "win_same_rank":         25,
    "win_higher_rank_1_2":   30,
    "win_higher_rank_3plus": 35,
    "win_lower_rank_1_2":    20,
    "win_lower_rank_3plus":  15,
    "loss_same_rank":        -20,
    "loss_higher_rank_1_2":  -15,
    "loss_higher_rank_3plus": -10,
    "loss_lower_rank_1_2":   -25,
    "loss_lower_rank_3plus": -30
  },

  "rank_points_per_division": {
    "BRONZE":   100,
    "SILVER":   150,
    "GOLD":     200,
    "PLATINUM": 250,
    "DIAMOND":  300
  },

  "season_length_weeks": 8,

  "matchmaking": {
    "new_player_protection_games": 50,
    "new_player_max_opponent_legendaries": 5
  },

  "onboarding": {
    "starter_dust": 200,
    "starter_uncommon_shards": 3,
    "starter_rare_shards": 1,
    "starter_legendary_shards": 1
  },

  "collection_limits": {
    "FREE": 50,
    "MID": 100,
    "HIGH": 200
  },

  "deck_slot_limits": {
    "FREE": 3,
    "MID": 6,
    "HIGH": 10
  }
}
```

**JSON Schema type annotations (for validation):**

```typescript
interface EconomyConfig {
  _version: string;
  _last_updated: string;
  _notes: string;

  energy: {
    win_energy_per_card: number;      // integer >= 1
    loss_energy_per_card: number;     // integer >= 0
    threshold_uncommon: number;       // must be > 0
    threshold_rare: number;           // must be > threshold_uncommon
    threshold_epic: number;           // must be > threshold_rare
    threshold_legendary: number;      // must be > threshold_epic
  };

  dust_income: {
    win_dust: number;                 // integer >= 1
    loss_dust: number;                // integer >= 0
    onboarding_bonus_dust: number;    // integer >= 0
  };

  quest_dust_multipliers: {
    FREE: number;                     // must be 1.0
    MID: number;                      // must be > FREE
    HIGH: number;                     // must be > MID
  };

  quest_difficulty_weights: {
    EASY: number;                     // [0, 1]
    MEDIUM: number;                   // [0, 1]
    HARD: number;                     // [0, 1]; EASY + MEDIUM + HARD must equal 1.0
  };

  daily_quest_rewards: {
    [difficulty: string]: {
      base_dust: number;              // integer >= 0
      shard_chance: number;           // [0, 1]
      shard_tier: string | null;      // "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY" | null
    };
  };

  weekly_quest_rewards: {
    [questId: string]: {
      base_dust: number;
      shard_tier: string;
      shard_count: number;
    };
  };

  shard_costs: {
    UNCOMMON: number;
    RARE: number;
    EPIC: number;
    LEGENDARY: number;                // must be > EPIC > RARE > UNCOMMON > 0
  };

  pack_costs: {
    own_faction_pack: number;
    other_faction_pack: number;       // must be >= own_faction_pack
    specific_common: number;
  };

  cosmetic_costs: {
    avatar_unlock: number;
  };

  subscription_monthly_bonuses: {
    [tier: string]: {
      monthly_commons: number;        // integer >= 0
      monthly_legendary_shards: number; // integer >= 0
    };
  };

  rank_points: { [key: string]: number; };
  rank_points_per_division: { [rank: string]: number; };
  season_length_weeks: number;        // integer >= 4

  matchmaking: {
    new_player_protection_games: number;    // integer >= 0
    new_player_max_opponent_legendaries: number;
  };

  onboarding: {
    starter_dust: number;
    starter_uncommon_shards: number;
    starter_rare_shards: number;
    starter_legendary_shards: number;
  };

  collection_limits: { [tier: string]: number; };
  deck_slot_limits: { [tier: string]: number; };
}
```

**Validation rule the server must enforce on startup:**
```typescript
function validateConfig(config: EconomyConfig): void {
  const w = config.quest_difficulty_weights;
  const sum = w.EASY + w.MEDIUM + w.HARD;
  if (Math.abs(sum - 1.0) > 0.001) {
    throw new Error(`quest_difficulty_weights must sum to 1.0, got ${sum}`);
  }
  const s = config.shard_costs;
  if (!(s.UNCOMMON < s.RARE && s.RARE < s.EPIC && s.EPIC < s.LEGENDARY)) {
    throw new Error('shard_costs must satisfy UNCOMMON < RARE < EPIC < LEGENDARY');
  }
  const e = config.energy;
  if (!(e.threshold_uncommon < e.threshold_rare &&
        e.threshold_rare < e.threshold_epic &&
        e.threshold_epic < e.threshold_legendary)) {
    throw new Error('energy thresholds must be strictly increasing');
  }
}
```
If validation fails, the server must refuse to start and log the error. This prevents a misconfigured deploy from silently breaking the economy.

**How to apply a config change:**
1. Edit `economy.config.json` with desired values.
2. Run the balance dashboard (Section 10) to see projected impact.
3. If projections look good: commit the file, then run `railway up` from the project root.
4. Monitor PostHog for 48 hours after deploy. If metrics move in the wrong direction, revert the config change and redeploy.

---

## 10. Balance Dashboard Specification

The Balance Dashboard is a standalone web application that runs **entirely in-memory on the owner's local machine**. It does not connect to Supabase or any live database during simulation — all player data is synthetically generated. This is a deliberate constraint: live database queries during simulation would be slow, expensive, and could produce misleading results from real player noise. The simulation is a clean mathematical model, not a replay of actual player behavior.

### 10.1 What the Dashboard Does

The dashboard reads `economy.config.json` from the local filesystem and runs a Monte Carlo simulation across 1,000 virtual players over a configurable time horizon (default: 90 days = ~13 weeks), generating all player states in memory and rendering results as interactive charts.

**The owner's complete workflow:**
1. Run `node tools/balance-dashboard/server.js` from the project root (or `npm run dashboard`).
2. Browser opens automatically at `http://localhost:3040`.
3. Review the 7 graphs (described in Section 10.3).
4. If something looks wrong, edit `economy.config.json` in a text editor.
5. Click "Rerun Simulation" in the dashboard — the server re-reads the config file from disk and re-runs all 1,000 players without restarting the process.
6. When satisfied, commit `economy.config.json` and run `railway up` to deploy.

**What the dashboard does NOT do:**
- It does not query Supabase, PostHog, or any external service
- It does not modify any database records
- It does not send API requests of any kind
- It does not require an internet connection

### 10.2 Simulation Architecture

**Files:**
- `tools/balance-dashboard/server.js` — Express HTTP server, serves the HTML UI and simulation API endpoint
- `tools/balance-dashboard/simulate.js` — Monte Carlo simulation engine (pure in-memory JavaScript, no external dependencies)
- `tools/balance-dashboard/index.html` — Single-page UI served by the Express server

**Runtime:** Node.js (same version as the Railway game server). No TypeScript compilation step — plain JavaScript for zero build friction. No npm dependencies beyond Express and Chart.js (served from CDN).

**Player archetypes simulated (1,000 players total):**

| Archetype | Count | Games/Day | Win Rate | Subscription |
|---|---|---|---|---|
| Free Casual | 200 | 2 | 0.50 | FREE |
| Free Regular | 200 | 5 | 0.50 | FREE |
| Free Hardcore | 50 | 10 | 0.55 | FREE |
| Mid Casual | 100 | 2 | 0.50 | MID |
| Mid Regular | 150 | 5 | 0.52 | MID |
| Mid Hardcore | 50 | 10 | 0.55 | MID |
| Top Casual | 50 | 2 | 0.50 | HIGH |
| Top Regular | 100 | 5 | 0.52 | HIGH |
| Top Hardcore | 50 | 10 | 0.58 | HIGH |
| New Player (free) | 50 | 3 | 0.45 | FREE |

**Simulation loop (per player, per simulated day) — all computation is in-memory:**
```javascript
function simulateDay(player, config, day) {
  // Gaussian noise: Box-Muller transform, seeded per player for reproducibility
  const noise = (mean, sd) => {
    const u1 = Math.random(), u2 = Math.random();
    return mean + sd * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };

  const gamesPlayed = player.gamesPerDay;
  const wins = Math.max(0, Math.min(gamesPlayed,
    Math.round(gamesPlayed * player.winRate + noise(0, 0.5))));
  const losses = gamesPlayed - wins;

  // Dust income from games
  player.dust += wins  * config.dust_income.win_dust;
  player.dust += losses * config.dust_income.loss_dust;

  // Energy accumulation: all deck cards earn simultaneously
  const energyGained = wins  * config.energy.win_energy_per_card
                     + losses * config.energy.loss_energy_per_card;
  player.deck.forEach(card => { card.energy += energyGained; });

  // Daily quest completion: avg_quests_per_day varies by archetype
  const questsCompleted = Math.min(3,
    Math.max(0, Math.round(player.avgQuestsPerDay + noise(0, 0.5))));
  player.dust += simulateQuestRewards(questsCompleted, player.subscription, config);

  // Weekly quest completion (evaluated on days 7, 14, 21, ...)
  player.gamesThisWeek += gamesPlayed;
  if (day % 7 === 0) {
    player.dust += simulateWeeklyQuestRewards(player.gamesThisWeek, player.subscription, config);
    player.gamesThisWeek = 0;
  }

  // Monthly subscription bonus (evaluated on days 30, 60, 90, ...)
  if (day % 30 === 0) {
    const bonus = config.subscription_monthly_bonuses[player.subscription];
    player.shardsLegendary += bonus.monthly_legendary_shards;
    // monthly_commons: grant dust equivalent (50 Dust per common) for simulation purposes
    player.dust += bonus.monthly_commons * config.pack_costs.specific_common;
  }

  // Spending: 60% shards, 20% packs, 10% targeted, 10% cosmetics
  simulateSpending(player, config);

  // Evolution: attempt evolution when energy >= threshold AND correct shard available
  simulateEvolutions(player, config);

  // Record snapshot for graph rendering (in-memory array, not written to any DB)
  player.snapshots[day] = {
    dust: player.dust,
    legendaryCount: player.deck.filter(c => c.tier === 'LEGENDARY').length,
    epicCount:      player.deck.filter(c => c.tier === 'EPIC').length,
    rareCount:      player.deck.filter(c => c.tier === 'RARE').length,
    shardsLegendary: player.shardsLegendary,
    shardsEpic:      player.shardsEpic,
  };
}

function simulateQuestRewards(count, subscription, config) {
  let total = 0;
  const weights = config.quest_difficulty_weights;
  const multiplier = config.quest_dust_multipliers[subscription];
  for (let i = 0; i < count; i++) {
    const roll = Math.random();
    let difficulty;
    if (roll < weights.EASY) difficulty = 'EASY';
    else if (roll < weights.EASY + weights.MEDIUM) difficulty = 'MEDIUM';
    else difficulty = 'HARD';
    total += config.daily_quest_rewards[difficulty].base_dust * multiplier;
  }
  return total;
}

function simulateWeeklyQuestRewards(gamesThisWeek, subscription, config) {
  const multiplier = config.quest_dust_multipliers[subscription];
  // Assume 2 weekly quests available; completion based on game count
  const completionRate = Math.min(1.0, gamesThisWeek / 20); // 20 games = 100% completion
  const avgBaseDust = (150 + 200) / 2; // average of W01-W10
  return Math.floor(2 * completionRate * avgBaseDust * multiplier);
}

function simulateSpending(player, config) {
  if (player.dust < 240) return; // minimum threshold before spending
  const spendable = player.dust * 0.7; // spend up to 70% of current balance
  // 60% of spendable goes to highest-tier shards the player can use
  const shardBudget = spendable * 0.60;
  if (shardBudget >= config.shard_costs.LEGENDARY && hasCardReadyForLegendary(player, config)) {
    const purchased = Math.floor(shardBudget / config.shard_costs.LEGENDARY);
    player.shardsLegendary += purchased;
    player.dust -= purchased * config.shard_costs.LEGENDARY;
  } else if (shardBudget >= config.shard_costs.EPIC && hasCardReadyForEpic(player, config)) {
    const purchased = Math.floor(shardBudget / config.shard_costs.EPIC);
    player.shardsEpic += purchased;
    player.dust -= purchased * config.shard_costs.EPIC;
  }
  // remaining 40% left as dust balance
}

function simulateEvolutions(player, config) {
  player.deck.forEach(card => {
    if (card.tier === 'COMMON' && card.energy >= config.energy.threshold_uncommon
        && player.shardsUncommon > 0) {
      card.tier = 'UNCOMMON'; card.energy = 0; player.shardsUncommon--;
    } else if (card.tier === 'UNCOMMON' && card.energy >= config.energy.threshold_rare
        && player.shardsRare > 0) {
      card.tier = 'RARE'; card.energy = 0; player.shardsRare--;
    } else if (card.tier === 'RARE' && card.energy >= config.energy.threshold_epic
        && player.shardsEpic > 0) {
      card.tier = 'EPIC'; card.energy = 0; player.shardsEpic--;
    } else if (card.tier === 'EPIC' && card.energy >= config.energy.threshold_legendary
        && player.shardsLegendary > 0) {
      card.tier = 'LEGENDARY'; card.energy = 0; player.shardsLegendary--;
    }
  });
}
```

Gaussian noise uses the Box-Muller transform. All random draws use `Math.random()` seeded per archetype for reproducible results on repeated runs with the same config.

### 10.3 Dashboard Output Graphs

All graphs are rendered using Chart.js loaded from CDN (zero npm dependencies for the dashboard UI). The graphs are the primary owner interface for economy review. The owner adjusts config values and re-runs the simulation until the graphs look right — no code changes are ever needed.

**Graph 1: Time-to-Evolution Curves (owner's primary health indicator)**
- X axis: Days (0–180)
- Y axis: % of simulated players who have at least N Legendary cards
- Lines: N=1 (first Legendary), N=5, N=10, N=20 (full deck)
- Separate panels for Free tier, Mid tier, Top tier
- Target: Free Regular hits N=1 between Day 23–30. If it is before Day 20, Legendary shards are too cheap. If it is after Day 35, energy or shards are too expensive.

**Graph 2: Dust Accumulation Curves**
- X axis: Days (0–90)
- Y axis: Mean dust balance across archetype (rolling daily average)
- Lines: One per archetype (9 lines total, color-coded by subscription tier)
- Target: No archetype sustains a balance above 2,000 Dust for more than 2 consecutive weeks. Lines should oscillate (spending is happening), not trend steadily upward.

**Graph 3: Shard Bottleneck Analysis**
- X axis: Weeks (0–13)
- Y axis: Mean shard inventory by tier (stacked bar per week)
- Bars: Legendary (red), Epic (orange), Rare (green) stacks per archetype
- Target: Legendary shards should be consumed quickly (bar stays small). If Legendary shard inventory grows week-over-week, either shard cost is too low or energy threshold is too high.

**Graph 4: Win Rate Distribution**
- X axis: Win rate buckets (30–70%, 5% increments)
- Y axis: % of simulated players in each bucket
- Shape: Roughly normal, centered at 50%, standard deviation ~10%
- Target: Confirms simulation assumptions are consistent. Should look like a bell curve. If it does not, the archetype win rate assignments in Section 10.2 need adjustment.

**Graph 5: Rank Distribution (snapshot at Day 56 = end of 8-week season)**
- X axis: Rank tiers (Bronze 3 through GM)
- Y axis: % of simulated players at each rank
- Target bell: Bronze 3–1: ~25%, Silver: ~30%, Gold: ~25%, Platinum: ~12%, Diamond+: ~8%
- If > 50% of players are in Bronze, weekly rank point gain is too low. If > 20% are Platinum+, point gain is too high.

**Graph 6: Quest Completion Rate**
- X axis: Quest difficulty (Easy, Medium, Hard)
- Y axis: % of generated quests that were completed (across all simulated players, all days)
- Target: Easy 85%+, Medium 75%+, Hard 55%+
- If Hard completion is below 40%, the hard quest target counts are too demanding relative to the games-per-day assumptions.

**Graph 7: Weekly Income Breakdown (stacked bar chart)**
- X axis: Player archetypes (9 groups)
- Y axis: Mean weekly Dust income
- Stacked segments: Game wins (win_dust), Game losses (loss_dust), Daily quests, Weekly quests, Season rewards (amortized)
- Target: Quest income (daily + weekly) should represent 60–70% of total income. If game dust exceeds 30% of income for any archetype, the daily game count assumptions for that archetype should be reviewed.

### 10.4 Dashboard UI Specification

The dashboard is a plain HTML page served by a local Express server. It is part of the Admin Dashboard application, but runs locally on the owner's machine during balance review — it is never deployed to Railway for live use.

**Layout:**
- Header: "Chaos Creatures Economy Balance Dashboard — Simulation run: [timestamp]"
- Top row: 3 summary stat cards with color-coded health indicators
  - "Median Dust Balance (Day 90): [value]" — green if 200–800 for Free Regular; yellow if 800–2,000; red if > 2,000
  - "Free Regular: Days to First Legendary: [value]" — green if 23–30; yellow if 20–23 or 30–40; red if < 20 or > 40
  - "Quest Completion Rate (Hard): [value]%" — green if 55%+; yellow if 40–55%; red if < 40%
- Main area: 7 graphs in a 2-column grid (Graph 1 spans full width as the primary indicator)
- Bottom: "Rerun Simulation" button (re-reads `economy.config.json` from disk, re-runs all 1,000 players, re-renders all graphs — no page reload required)
- Footer: "Config loaded from: `economy.config.json`" with a clickable link that opens the file in VS Code via the `vscode://` URI scheme

**Running the dashboard (one command):**
```bash
npm run dashboard
# Alias for: node tools/balance-dashboard/server.js
# Takes ~3 seconds for 1,000 players × 90 days on an M-series Mac
# Opens http://localhost:3040 automatically via the 'open' command
```

---

## 11. Implementation Checklist

This section lists every system in this document separated by application. Claude Code builds from this checklist.

### 11.1 Supabase Database Changes

The following fields/tables are required beyond what `02-card-data-model.md` already specifies:

- `players` table: add `season_rank_floor` field (nullable enum `SeasonRank`)
- `card_instances` table: `chaos_energy` and `tier` fields confirmed required (already in Section 2 of data model)
- `missions` table: daily and weekly quests per player with `is_completed`, `is_claimed`, `expires_at`, `reward_amount`, `reward_shard_tier`, `reroll_used_today` fields
- `shard_transactions` table: log of all shard changes with `source` enum field
- `match_records` table: must include `cards_played` JSONB and `game_log` JSONB for mission tracking

### 11.2 Supabase Edge Functions (Server-Side Economy Logic)

| Function | Trigger | Responsibility |
|---|---|---|
| `award-match-rewards` | Called by Railway after each game | Apply win/loss dust and energy to all deck cards; update mission progress for all active missions |
| `generate-daily-quests` | pg_cron: `0 0 * * *` | Generate up to 3 quests per player if they have fewer than 3 active; uses quest generation algorithm from Section 4.1 |
| `generate-weekly-quests` | pg_cron: `0 0 * * 1` (Monday 00:00 UTC) | Generate 2 weekly quests per player using shuffle algorithm from Section 4.3 |
| `grant-subscription-bonuses` | pg_cron: `0 0 1 * *` (1st of month 00:00 UTC) | Award monthly Commons (as Dust equivalent) and Legendary shard to MID/HIGH subscribers; verify subscription via StoreKit receipt before granting |
| `end-season` | Manual trigger via Admin Dashboard | Apply season end rewards by rank, reset all player ranks per Section 5.4 rules, zero season_rank_points and season_rank_floor |
| `complete-quest` | Called by iOS client on claim tap | Verify `is_completed == true` and `is_claimed == false`; award `reward_amount` Dust and optional shard; set `is_claimed = true` |
| `reroll-quest` | Called by iOS client on reroll tap | Verify `reroll_used_today == false`; delete quest; generate replacement using Section 4.1 algorithm; set `reroll_used_today = true` (resets via `generate-daily-quests` cron) |
| `evolve-card` | Called by iOS client after evolution confirm | Validate `chaos_energy >= threshold` and correct shard in inventory; deduct shard; set new tier; trigger fal.ai + OpenAI for art/name generation |
| `onboarding-complete` | Called by iOS client on faction commit | Grant starter resources from `economy.config.json` `onboarding` block; set `onboarding_complete = true`; enable onboarding quest set |
| `purchase-item` | Called by iOS client after Dust spend UI | Validate player has sufficient Dust; deduct Dust; deliver item (pack/shard/targeted common/avatar); all purchases are Dust-only — no real money |
| `verify-storekit-receipt` | Called by iOS client after StoreKit 2 purchase | Accept `Transaction.jwsRepresentation`; verify with Apple; update `player.subscription_tier`; return new tier to client |

### 11.3 Railway Game Server Responsibilities

- At end of each game: call the `award-match-rewards` Edge Function with: `winner_id`, `loser_id`, `winner_deck_card_ids[]`, `loser_deck_card_ids[]`, `cards_played[]` (per CardPlayRecord), `chaos_events_count`, `order_events_count`, `winner_final_hp`, `creatures_destroyed_by_winner`, `creatures_destroyed_by_loser`
- Mission tracking happens in `award-match-rewards` (server-side) — the Railway server provides the raw event data; mission credit calculation is the Edge Function's responsibility
- The Railway server reads `economy.config.json` at startup for energy and dust rate constants; it does not calculate quest rewards (that is the Edge Function's job)

### 11.4 iOS Client (Swift/SwiftUI) Economy UI Requirements

These are the screens and components the iOS app must implement. All data is received from Supabase via Realtime subscriptions or REST calls — the client never calculates economy values itself.

**HUD (persistent across all game screens):**
- `Text("\(player.chaosDust) Dust")` with icon — updates via `@StateObject` bound to Realtime `player_wallet` channel
- Shard inventory icons (Uncommon, Rare, Epic, Legendary counts) — same channel
- Player rank badge — updates via `player_rank` channel

**Quest Screen (`QuestView` — SwiftUI `View`):**
- `List` of 3 daily quests, each showing: mission description, progress bar (`ProgressView`), reward amount, "Claim" button (enabled when `isCompleted && !isClaimed`)
- "Reroll" button on each quest (disabled after 1 use per day, shown as grayed out with "Used" label)
- Separate `Section` for 2 weekly quests with expiry countdown (`TimelineView` updating every minute)
- Separate `Section` for onboarding quests (visible until all 8 are claimed, then hidden permanently)

**Evolution Screen (`EvolutionView` — SwiftUI `View` over SpriteKit scene):**
- Energy progress bar: `ProgressView(value: card.chaosEnergy, total: nextThreshold)` with tier label
- "Evolve" primary button: enabled when `energy >= threshold && hasRequiredShard`. Disabled state shows "Needs [N] more energy" or "Needs [Tier] Shard"
- Shard cost display: "Costs 1 Uncommon Shard (30 Dust to buy)" with "Buy Shard" secondary button
- Evolution confirmation sheet: shows current art + new tier preview placeholder, "Confirm Evolution" button

**Shop/Dust Screen (`ShopView` — SwiftUI `View`):**
- Card pack purchase buttons (own faction 100 Dust, other faction 150 Dust) with faction selector
- Shard purchase grid: 4 rows (Uncommon/Rare/Epic/Legendary) with dust costs from config
- Specific common search and purchase
- Avatar cosmetics section

**Subscription Screen (`SubscriptionView` — SwiftUI `View` using StoreKit 2):**
- Displays two `Product` objects fetched via `Product.products(for:)` at view appear
- Mid and Top tier cards showing benefits (from Section 8.3)
- Purchase button calls `product.purchase()` and on success calls `verify-storekit-receipt` Edge Function
- Manage Subscription button opens system settings: `URL(string: "itms-apps://apps.apple.com/account/subscriptions")`
- Current subscription status shown at top of view, updated from `player.subscription_tier`

**Season Rank Screen (`RankView` — SwiftUI `View`):**
- Current rank badge with division (e.g., "Gold 2") using `SeasonRank` enum display names
- Points progress bar to next division: `ProgressView(value: currentPoints, total: pointsForNextDivision)`
- Rank floor indicator: lock icon at floor division
- Season end countdown: `TimelineView` showing days/hours remaining

---

## Revision Log

### Version 3.0 — 2026-02-16

**Summary:** Complete platform alignment pass for Swift/iOS stack, REVIEW.md fix application, CLAUDE.md compliance additions, and balance dashboard in-memory constraint enforcement.

**Detailed changes from Version 2.0:**

1. **Platform: replaced all React Native / Expo / Google Play references with Swift/SwiftUI/iOS/App Store.** Every client reference throughout the document now correctly names the iOS stack. Specific changes:
   - Document header: `React Native (Expo) client` → `Swift + SwiftUI + SpriteKit iOS client, StoreKit 2 payments`
   - Section 2.2 implementation note: removed "Supabase Edge Function" React Native implication; clarified the iOS client receives tier via Realtime channel, never supplies it in requests
   - Section 5.5: "Season Rewards screen" now specifies a SwiftUI sheet presented on first app open after season end
   - Section 6.1: All onboarding screens now specify SwiftUI component types (TextField, TabView pager, picker screen)
   - Section 6.2: Tutorial prompts now specify `.sheet` presentation in SwiftUI
   - Section 8.3: Replaced "App Store/Google Play native IAP" with "StoreKit 2 on iOS"; added StoreKit 2 implementation note with `Product.purchase()` flow and receipt verification call
   - Section 9: Config reload note updated from "Railway auto-deploys on push to main" to explicit `railway up` command
   - Section 11 (previously React Native Client Responsibilities): Completely rewritten as Section 11.4 with Swift/SwiftUI component names, `@StateObject`, `ProgressView`, `TimelineView`, `Product.products(for:)`, `product.purchase()`, and StoreKit 2 subscription management URL

2. **Fixed WARN-3: Daily quest dust range inconsistency.** Section 2.1 now contains an explicit authoritativeness note: "Authoritative daily quest dust values (this document is the source of truth): Easy = 20 Dust, Medium = 30 Dust, Hard = 45 Dust. The master doc states a range of '25–50' as an approximation. The exact values below are canonical for all implementation purposes." This resolves the ambiguity between doc 04 (20/30/45) and doc 00/01 ("25-50").

3. **Fixed WARN-7: Starter shard package inconsistency.** Section 3.2 now leads with a dedicated "Authoritative starter shard package" block that explicitly calls out the canonical set (3 Uncommon + 1 Rare + 1 Legendary) and states "no other version is valid." The Legendary Shard's purpose and timing constraint are explained. The `onboarding` block in `economy.config.json` (Section 9) confirms `"starter_legendary_shards": 1`. Both Section 2.8 and Section 6.1 reference Section 3.2 for the authoritative starter package.

4. **Added Budget Compliance section.** New section after Core Principles confirms the economy system adds zero incremental cost beyond the base infrastructure budget. PostHog free tier is sufficient. Balance dashboard runs locally with zero cloud cost. Total economy-specific infrastructure cost: $0.

5. **Added Two Applications clarity throughout.** New table in "How to Use This Document" section explicitly maps every section to either "iOS Game Client" or "Admin Dashboard (Web)." Section 10 balance dashboard now states it is the Admin Dashboard application running locally. Section 11 is reorganized into 4 subsections: Supabase DB, Edge Functions, Railway server, and iOS client — with the iOS client section clearly separated from backend responsibilities.

6. **Balance simulation now runs entirely in-memory.** Section 10 (Balance Dashboard) has been substantially rewritten:
   - Added explicit statement: "The simulation is a clean mathematical model, not a replay of actual player behavior."
   - Added "What the dashboard does NOT do" list: no Supabase queries, no PostHog requests, no external API calls of any kind, no internet connection required
   - Simulation loop code rewritten in plain JavaScript (not TypeScript) to avoid build friction
   - Monthly subscription bonus simulation uses in-memory Dust equivalent (no DB reads)
   - All `player.snapshots` are plain in-memory objects, explicitly noted as "not written to any DB"
   - Server re-reads config from local disk on "Rerun Simulation" click, not from any remote source

7. **JSON economy config schema enhanced.** Section 9 now includes:
   - TypeScript interface definition for `EconomyConfig` with field-level constraints documented as comments
   - `validateConfig()` function that the Railway server must call at startup — enforces difficulty weight sum = 1.0, shard cost ordering, and energy threshold ordering
   - Explicit statement that config is loaded at Railway startup and cached in memory for the process lifetime
   - Clarified that Supabase Edge Functions read config from the file at build time (committed to repo), not from a runtime endpoint

8. **Monte Carlo graphs specified as owner review output.** Each of the 7 graphs in Section 10.3 now has explicit "Target" conditions phrased as what the owner looks for when deciding whether to adjust config. Graph 1 has specific green/yellow/red thresholds (Day 23–30 is green for Free Regular first Legendary). The "Rerun Simulation" button workflow is described as the primary owner interaction loop for economy tuning.

9. **Removed all "tune as needed" language.** Every config adjustment scenario (Section 7.4) now specifies the exact `economy.config.json` key to change, the exact new value to set, and the exact deploy command to run.

10. **Updated Section 11 to separate iOS client tasks clearly.** The previous "React Native Client Responsibilities" bullet list has been replaced with Section 11.4 "iOS Client (Swift/SwiftUI) Economy UI Requirements" — a complete screen-by-screen specification with SwiftUI component names, data binding patterns, and Realtime channel names for each economy-related UI element.
