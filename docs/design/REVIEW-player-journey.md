# Chaos Creatures — Player & Owner Journey Audit

**Auditor:** UX Flow Auditor (Claude Code)
**Date:** 2026-02-16
**Method:** Full read of all docs in `docs/design/`. Traced every step of both journeys against `07-ui-ux-specs.md`, `06-technical-architecture.md`, `01-battle-mechanics.md`, `04-progression-economy.md`, `05-content-pipeline.md`, `09-monetization-details.md`, and cross-docs. All finding types are labeled at the end of each step.

---

## Legend

| Label | Meaning |
|---|---|
| OK | Step is fully specced: screen exists, backend exists, logic exists, transition is defined |
| DEAD END | Screen or state where the player/owner has no clear next action |
| MISSING SCREEN | Step references a screen not detailed-specced in 07 |
| MISSING BACKEND | Step requires backend support not specced in 06 |
| UNDEFINED TRANSITION | How the user gets from step A to step B is not specified |
| OWNER REQUIRES CODE | Owner workflow step that requires more than 1 terminal command or code writing |

---

## Part 1 — Player Journey

---

### Step 1: Discovers app in App Store → reads description → downloads

**Status: MISSING SCREEN / PARTIAL**

App Store assets are referenced in `05-content-pipeline.md` (Section 5: launch checklist mentions app icon, screenshots, description) and `06-technical-architecture.md` (Xcode Cloud workflow for App Store Release). The budget doc covers Cloudflare Pages for privacy policy/ToS hosting.

**What is missing:**
- No actual App Store description copy, keywords, or subtitle is specced anywhere in any doc. `05-content-pipeline.md` Section 5 says "generate store assets as part of launch checklist" but does not include the actual text.
- Age rating questionnaire answers are referenced in CLAUDE.md but not provided in any doc.
- App Store privacy nutrition label declarations are referenced in CLAUDE.md but not defined in any doc.
- Screenshots are mentioned (Fastlane / Xcode UI tests) in CLAUDE.md but the spec for which screens to capture and what flow to screenshot is not in any doc.

**What is present:**
- Privacy policy and ToS hosting on Cloudflare Pages is accounted for.
- App icon generation via fal.ai is mentioned in the budget estimate in `06-technical-architecture.md`.
- The Xcode Cloud "App Store Release" workflow handles submission once assets exist.

---

### Step 2: First launch → onboarding flow → tutorial match

**Status: OK**

`07-ui-ux-specs.md` Section 7 specifies the complete 7-step onboarding flow with SwiftUI code:
- Step 1: Intro Cinematic (5 panels, auto-advance, skip button).
- Step 2: Faction Selection (`TabView(.page)` pager, 3 faction cards).
- Step 3: Tutorial Match (standard `BattleView` with `isTutorialMode: true`, `TutorialOverlayView` with spotlight mask, 9-step tutorial, skip button).
- Step 4: Faction Commitment (Alert or custom sheet, `player/commit-faction` Edge Function).
- Step 5: First Evolution (guided, server pre-awards 15 energy + 1 Uncommon Shard).
- Step 6: Deck Builder Tour (5 tooltip steps, `UserDefaults` flag).
- Step 7: Release to Home.

Backend: `player/commit-faction` Edge Function is specced in `06-technical-architecture.md` Section 4.2. `player/complete-onboarding` seeds starter missions. Auth on first sign-in triggers a DB trigger creating the `players` row.

Logic: Turn timer disabled in tutorial mode (`timerSeconds: 0`) is specced. Scripted AI defeat on Step 9 is noted.

Transition: `@AppStorage("onboardingComplete")` drives the root `@main` switch from `OnboardingFlowView` to `MainTabView`.

**Minor gap:** The onboarding flow says Apple Sign-In happens at app launch, but the exact screen where Sign-In with Apple occurs before onboarding starts is not specced. The `AuthService.signInWithApple()` code exists in `06-technical-architecture.md` Section 2.2, and the DB trigger on first sign-in creates the player row, but `07-ui-ux-specs.md` Section 7 jumps straight to the cinematic. There is no specced "Sign In with Apple" screen or loading state before Step 1 of onboarding.

**Finding:** MISSING SCREEN — the Apple Sign-In prompt screen before onboarding Step 1 is not specced in 07.

---

### Step 3: Opens collection → sees starter cards → builds first deck

**Status: OK (with one gap)**

`07-ui-ux-specs.md` Section 5.1 (Collection Screen) is fully specced: `CollectionView` with `FactionTabBar`, `FilterBar`, `CollectionGridView` (`LazyVGrid`), `CardGridItemView` with evolution-ready badge, empty state `ContentUnavailableView`. Section 5.2 (Card Detail View) fully specced including sticky Evolve/Add to Deck buttons.

`07-ui-ux-specs.md` Section 5.3 (Deck Builder) fully specced: `DeckBuilderView` with `DeckBuilderPhoneLayout` and `DeckBuilderTabletLayout`, `DeckContentsPanel`, `CardPoolPanel`, `DeckStatsSummaryBar`, mana curve, validation, save WIP, 20-card requirement.

Backend: `card_instances`, `decks` tables fully defined in `06-technical-architecture.md` Section 3.1. Collection service (Edge Functions) specced in Section 4.2.

**Gap:** `07-ui-ux-specs.md` Section 5.3 specifies `FactionSelectorRow` and `AvatarSelectorRow` in the deck builder header but does not specify what the AvatarSelectorRow looks like when displayed (it's referenced but not detailed). The Avatar unlock flow (300 Dust via `EconomyService`) is also not specced as a separate screen.

**Finding:** MISSING SCREEN — no spec for an "Avatar Shop/Unlock" screen; avatars are referenced in the deck builder's `AvatarSelectorRow` and cost is in the economy tables, but there is no screen in 07 for browsing/unlocking avatars.

---

### Step 4: Queues for first real match → matchmaking → match starts

**Status: OK (with one gap)**

`07-ui-ux-specs.md` Section 1 (Screen Inventory) lists `Mode Selection` (Home → NavigationStack push) and `Matchmaking` screens. Section 2 (Navigation Map) shows `ModeSelectView` → `MatchmakingView` → `BattleView`. Error state during matchmaking (network loss) is specced in Section 11.1.

Backend: `matchmaking_queue` table defined in `06-technical-architecture.md` Section 4.5. Game server polls queue every 2 seconds. Both players notified via Supabase Realtime `matchmaking:{player_id}` channel. `MatchmakingService.swift` listed in project structure (Section 2.1).

Logic: Game setup (draw 4/5, mulligan, Chaos Spark for P2) fully specced in `01-battle-mechanics.md` Section 3.

**Finding:** MISSING SCREEN — Neither `ModeSelectionView` nor `MatchmakingView` has a dedicated detailed spec section in `07-ui-ux-specs.md`. They are listed in the Screen Inventory (Section 1) and appear in the Navigation Map (Section 2) and file structure (Section 18.1), but no SwiftUI layout, component breakdown, timer display, opponent card reveal, or "match found" transition is specced. This is a significant gap for implementation.

---

### Step 5: Full match — draw → mana → play cards → chaos roll → events → combat → end turn → opponent turn → repeat → match ends

**Status: OK**

`07-ui-ux-specs.md` Section 3 (Battlefield Screen) is the most extensively specced section in the entire doc:
- Layout spec (ZStack with SpriteKit + SwiftUI overlays) at pixel level.
- All HUD components: `PlayerHUDView`, `OpponentHUDView`, `HPBarView`, `TimerBarView`, `EndTurnButton`, `ManaRowView`.
- `BoardCardNode`, `D20Node`, `PhaseIndicatorNode`, `EventOverlayNode` fully specced with Swift code.
- Section 3.4: Turn Phase Visual States table.
- Section 3.5: All animations (`animateCardPlay`, `animateAttackerSelected`, drag blocker assignment, `spawnDamageNumber`, `animateCreatureDeath`).
- Section 3.6: Taunt indicators.
- Section 3.7: Battle Log.
- Section 3.8: Graveyard Sheet.

`01-battle-mechanics.md` Sections 1-9 cover turn structure, phases, combat resolution, keywords, events in full detail.

`06-technical-architecture.md` Section 4.6 (Game Server) and Section 2.3 (BattleScene) and Section 2.5 (MatchService realtime) cover the backend.

All 9 turn phases, timer behavior, auto-action on timeout, Taunt forced-attack/block rules, Flying blocking rules, Piercing damage, Deathtouch, and Lifesteal are all fully specced.

**No gaps identified for the core match loop.**

---

### Step 6: Post-match — rewards (dust, energy) → sees evolution progress

**Status: OK (with minor gap)**

`07-ui-ux-specs.md` Section 15 (Post-Match Results Screen) fully specced: `PostMatchResultsView` with `ResultHeaderView` (VICTORY/DEFEAT animation), `RewardsSection` (XP bar animation, dust "+N" fade-in), `EnergyEarnedSection` (card thumbnails with "+2 Energy" labels and evolution-ready badge), `OpponentProfileSection`, bottom buttons (Play Again, Evolve Cards, Home).

Backend: Match result economy updates (dust per win/loss, energy per card) are specced in `06-technical-architecture.md` Section 4.3 and `04-progression-economy.md` Sections 1-2. Game server writes `match_records` to Supabase on match end.

**Minor gap:** The `PostMatchResultsView` shows evolution-ready cards, and "Evolve Cards" button navigates to `CollectionView?filter=evolutionReady`. The navigation transition from `PostMatchResultsView` back to the tab bar is specified in the Navigation Map (Section 2) as "PostMatchResultsView → HomeView (Play Again)" but the exact SwiftUI navigation mechanism for dismissing the post-match screen and returning to the tab bar is not specified. The Navigation Map says it "replaces BattleView" but `BattleView` is a `.fullScreenCover` — how `PostMatchResultsView` replaces a `.fullScreenCover` and then transitions to the tab bar is not specced.

**Finding:** UNDEFINED TRANSITION — the mechanism for replacing `BattleView` (`.fullScreenCover`) with `PostMatchResultsView` and then returning to the main `TabView` is not defined in 07.

---

### Step 7: First evolution — energy threshold reached → triggers evolution → AI generates new art → evolution reveal

**Status: OK**

`07-ui-ux-specs.md` Section 4 (Evolution Screen) is the second most extensively specced section. All 9 steps are fully specced with SwiftUI code:
- Step 1: Card Presentation (stats, energy progress bar, shard requirement, evolution history timeline).
- Step 2: Channel Selection (Order/Chaos options, fires `evolution/start` Edge Function, returns `evolutionJobId`).
- Step 3: Evolution Animation SpriteKit Loading Screen (4 phases: dissolve, shard materializes, orbit loop, shard cracks).
- Step 4: Art Reveal (iris wipe with `RadialGradient` mask, tier badge bounce-in).
- Step 5: Name Selection (3 GPT-4o Mini suggestions, auto-advance after 500ms).
- Step 6: Ability Reveal (slide-in animation).
- Step 7: Modifier Selection (horizontal scroll, 2/3/4 options by tier).
- Step 8: Flavor Text (typewriter effect, tap to complete instantly).
- Step 9: Final Confirm (`evolution/confirm` Edge Function, Share via `UIActivityViewController`).

Backend: `06-technical-architecture.md` Section 4.4 (Evolution Service) and Section 4.7 (AI Generation Pipeline) fully specced including fal.ai call parameters, OpenAI call, polling, R2 upload, fallback art.

Polling: 500ms interval, 10s timeout with shard/energy refund, PostHog event on timeout.

**No gaps identified for the evolution flow.**

---

### Step 8: Explores shop → sees subscription tiers → considers purchase

**Status: OK (with one gap)**

`07-ui-ux-specs.md` Section 6 (Shop & Economy Screens) fully specced:
- `ShopView` with `CurrencyHeaderView` (dust + shard counts), `subscriptionSection`, `cardPacksSection`, `shardsSection`, `cosmeticsSection`.
- Section 6.2: Three `SubscriptionCardView` components (Free, Mid, Top) with gradients, pricing, benefit lists.
- Section 6.3: Card pack purchase with `PackOpeningView` (card flip animation, 800ms per card).
- Section 6.4: Shards section (2-column LazyVGrid, StoreKit 2 one-time purchase).
- Section 6.5: `UpgradePromptView` shown once per session per trigger type.

`09-monetization-details.md` provides full IAP product catalog, App Store Connect configuration steps.

**Gap:** `07-ui-ux-specs.md` does not spec a dedicated cosmetics section detail (card backs, board skins, avatar frames, card reveals). Section 6.1 lists `cosmeticsSection` in the `ShopView` struct but there is no SwiftUI spec for what `cosmeticsSection` looks like or how it navigates to individual cosmetic purchases. `09-monetization-details.md` defines all the product IDs but the UI for browsing/purchasing cosmetics in the shop is not specced.

**Finding:** MISSING SCREEN — no detailed spec for the cosmetics subsection of the shop (card backs, board skins, avatar frames, reveal effects).

---

### Step 9: Makes first purchase (subscription) → StoreKit 2 flow → entitlements update

**Status: OK**

`07-ui-ux-specs.md` Section 6.2 shows StoreKit 2 purchase in `ShopViewModel.purchase(tier:)` with `.success`, `.pending`, `.userCancelled` cases. `06-technical-architecture.md` Section 2.4 specifies the full `StoreKitService` with `listenForTransactions()`, `syncSubscriptionWithServer()`, `restorePurchases()`, and the `apple-webhook` Edge Function for tier updates. App Store Server Notifications V2 webhook handling is fully specced including SUBSCRIBED, DID_RENEW, EXPIRED, REVOKE events.

`09-monetization-details.md` provides App Store Connect configuration steps (Sections 4a-4i), subscription group creation, product IDs, and server webhook URL configuration.

**No gaps identified for the purchase flow.**

---

### Step 10: Daily routine — quests → matches → dust/shard spending → pack opening → deck editing

**Status: MISSING SCREEN / PARTIAL**

**Quests:** `04-progression-economy.md` Section 4 fully speccs quest types, refresh cadence, dust values, shard rewards, and weekly quest pool. Backend: `missions` table fully defined in `06-technical-architecture.md` Section 3.1. Economy service handles quest completion rewards.

**Pack opening:** `07-ui-ux-specs.md` Section 6.3 (`PackOpeningView`) fully specced.

**Deck editing:** `07-ui-ux-specs.md` Section 5.3 fully specced.

**What is missing:**

1. **MISSING SCREEN — Home Screen:** The Home screen (`HomeView`) is listed in Screen Inventory (Section 1) as "Dashboard and play entry point" and appears in the Navigation Map, but there is no dedicated Home Screen spec in `07-ui-ux-specs.md`. There is no SwiftUI layout, no quest card display, no "Play" button placement, no daily mission progress display, no "evolution ready" notification section, no faction quick-stat summary. `06-technical-architecture.md` Section 2.1 lists `HomeView.swift` and `DailyMissionsView.swift` in the project structure but neither is specced in 07. This is the most frequently visited screen in the game and its layout is entirely unspecced.

2. **MISSING SCREEN — Profile Screen:** `ProfileView` is listed in Screen Inventory and the Navigation Map but has no dedicated section in `07-ui-ux-specs.md`. The file structure lists `ProfileView.swift` and `AchievementsView.swift`. `04-progression-economy.md` specifies rank tiers, achievements, and titles. `06-technical-architecture.md` defines the `players` table with all relevant stats. But the actual profile screen layout, what stats are shown, how the showcase cards work, and how the rank badge is displayed are not specced.

3. **UNDEFINED TRANSITION — Quest claim flow:** `04-progression-economy.md` describes quests but does not specify where in the UI the player claims quest rewards. There is no "claim reward" button specced anywhere in 07.

---

### Step 11: Ranked ladder — plays ranked → gains/loses rank → sees leaderboard

**Status: MISSING SCREEN / PARTIAL**

**Ranked logic:** `04-progression-economy.md` Section 5.2 fully speccs the rank ladder (Bronze 3 → Grandmaster), rank points per win/loss, rank floors, promotion/demotion, hidden MMR alongside visible rank, matchmaking by rank with expanding search window. `06-technical-architecture.md` has `season_rank` and `season_rank_points` in the `players` table and `ranked_points_win_same` / `ranked_points_loss_same` in `economy_config`. Match result writing to `match_records` is fully specced.

**What is missing:**

1. **MISSING SCREEN — Ranked Ladder / Rank Progress Screen:** No screen in `07-ui-ux-specs.md` shows the player their current rank, rank points, progress to next division, recent rank history, or season standing. The profile screen is not specced (see Step 10 gap), and even if it were, there is no leaderboard screen listed anywhere in the Screen Inventory.

2. **MISSING SCREEN — Leaderboard:** Master and Grandmaster ranks are "top 500 / top 100 players by points" (`04-progression-economy.md`). There is no leaderboard screen specced anywhere in 07. No navigation path from any tab to a leaderboard is defined.

3. **UNDEFINED TRANSITION — Post-ranked-match rank update:** After a ranked match ends, `PostMatchResultsView` shows rewards and dust but there is no specced component showing "You gained 25 rank points" or "You advanced to Silver 2."

---

### Step 12: New season — battle pass → seasonal content → new cards

**Status: PARTIAL / MISSING SCREEN**

**Battle pass product:** `09-monetization-details.md` Section 4h fully speccs the Battle Pass IAP product (`$9.99`, non-consumable, season determined server-side). `09-monetization-details.md` Section 3 (Season Architecture) speccs 8-week seasons, free track (50 tiers) and premium track (50 tiers with exclusive cosmetics), reward tier breakdown.

`04-progression-economy.md` Section 7 speccs season end rewards, rank reset behavior, and seasonal Dust/shard income.

**What is missing:**

1. **MISSING SCREEN — Battle Pass Screen:** No screen in `07-ui-ux-specs.md` shows the battle pass track, tier rewards, free vs. premium rows, progress bar, or "Unlock Battle Pass" button. There is no navigation path from any tab bar item or the Home screen to a Battle Pass screen.

2. **MISSING SCREEN — Season End / Season Transition Screen:** No screen spec for when the season ends: rank rewards delivered, season reset, "New Season Begins" announcement, or how seasonal content (new card templates) is surfaced to players.

3. **MISSING BACKEND — Season advancement logic:** While `players` has `season_id` in `match_records` and `04-progression-economy.md` specifies reward tiers, there is no Edge Function or game server logic specced in `06-technical-architecture.md` for season-end reward distribution, rank reset, or battle pass tier advancement tracking. No `battle_pass_progress` table or `seasons` table is defined in the DB schema in 06 (though `09-monetization-details.md` references a `seasons` table for determining which season a battle pass purchase applies to — this table is not in 06's schema section).

4. **UNDEFINED TRANSITION — How new season cards reach players:** `05-content-pipeline.md` speccs the batch generation pipeline and admin approval. But the player-facing flow for discovering that new cards are available (notification? banner on Home? shop update?) is not specced.

---

## Part 1 Summary — Player Journey Findings

| Finding | Step | Severity |
|---|---|---|
| MISSING SCREEN: App Store description, keywords, age rating, privacy labels not specced | 1 | Medium |
| MISSING SCREEN: Apple Sign-In prompt before onboarding not specced in 07 | 2 | Low |
| MISSING SCREEN: Avatar unlock/browse screen not specced | 3 | Medium |
| MISSING SCREEN: ModeSelectionView not detailed-specced in 07 | 4 | High |
| MISSING SCREEN: MatchmakingView not detailed-specced in 07 | 4 | High |
| UNDEFINED TRANSITION: PostMatchResultsView replacing BattleView fullScreenCover mechanism | 6 | Medium |
| MISSING SCREEN: Cosmetics section of Shop not specced | 8 | Medium |
| MISSING SCREEN: HomeView layout and content not specced | 10 | Critical |
| MISSING SCREEN: ProfileView layout and content not specced | 10 | High |
| UNDEFINED TRANSITION: Quest reward claim flow not specced | 10 | Medium |
| MISSING SCREEN: Ranked Ladder / Rank Progress screen not specced | 11 | High |
| MISSING SCREEN: Leaderboard screen not specced | 11 | Medium |
| UNDEFINED TRANSITION: Rank change notification in PostMatchResultsView | 11 | Medium |
| MISSING SCREEN: Battle Pass screen not specced | 12 | High |
| MISSING SCREEN: Season End / Season Transition screen not specced | 12 | High |
| MISSING BACKEND: `seasons` table, `battle_pass_progress` table not in 06 schema | 12 | High |
| MISSING BACKEND: Season-end reward distribution and rank reset Edge Function | 12 | High |
| UNDEFINED TRANSITION: How new season cards are surfaced to players | 12 | Medium |

---

## Part 2 — Owner Journey

---

### Step 1: Creates all accounts → sets up .xcconfig / .env

**Status: OK**

`CLAUDE.md` lists all 7 accounts to create with URLs. `06-technical-architecture.md` Section 1.3 provides the complete `.env` and `Config.xcconfig` templates with every required key. The Xcode Cloud `ci_scripts/ci_post_clone.sh` script writes `.xcconfig` from environment variables automatically.

**No gaps identified.**

---

### Step 2: Triggers batch card generation → reviews in gallery → approves/rejects

**Status: OK (two modes, one with terminal)**

Two workflows are specced:

**Terminal mode (`05-content-pipeline.md` Section 2b):** `npx ts-node scripts/generate-batch.ts --faction=ironwright --count=50`. Opens review gallery at `http://localhost:3001`. Owner approves/rejects per card. Approved cards uploaded to R2 and inserted into Supabase. This is 1 terminal command + browser clicks. Compliant with the 1-command rule.

**Browser mode (`07-ui-ux-specs.md` Section 16.9):** Owner opens admin dashboard → `/admin/cards` → "Generate Card Batch" → wizard (faction, type, archetype, quantity) → "Generate" → progress bar → Pending Review tab → approve/reject per card. Total: browser open + 2 clicks + review grid. Fully compliant with the 3-clicks/1-command rule.

Both modes are specced with resumable JSON manifest (`05-content-pipeline.md` Section 2c), exponential backoff on fal.ai errors, automated QA checks, and regeneration on reject.

**No gaps identified.**

---

### Step 3: Deploys backend (Railway + Supabase) → deploys iOS app (Xcode Cloud)

**Status: OK (with one minor gap)**

**Backend deployment:** `06-technical-architecture.md` Section 3.2 specifies `npx supabase db push` for migrations. Railway deploys from GitHub push (`railway up` referenced in CLAUDE.md). Game server and admin dashboard are separate Railway services.

**iOS deployment:** `06-technical-architecture.md` Section 2.7 (Xcode Cloud CI/CD) speccs three workflows: "Build and Test" (push to main), "TestFlight Beta" (tag `beta/*`), "App Store Release" (tag `release/*`). CI script writes `Config.xcconfig` from Xcode Cloud environment variables. Code signing is automatic.

**Minor gap:** The exact command for initial Railway deployment is referenced as "railway up" in CLAUDE.md but no `railway.toml` or service configuration is specced anywhere. The owner would need to know how to create/link Railway services via the Railway dashboard before `railway up` works.

**Finding:** OWNER REQUIRES CODE — setting up Railway services (creating project, linking GitHub repo, configuring environment variables in Railway dashboard) is described at the account-creation level ("sign up, link GitHub repo" in CLAUDE.md) but the actual Railway configuration steps (service names, environment variables, PORT settings, start commands) are not specced. This requires the owner to navigate Railway dashboard settings independently.

---

### Step 4: Submits to App Store → configures subscriptions in App Store Connect

**Status: OK**

`06-technical-architecture.md` Section 2.7 speccs the "App Store Release" Xcode Cloud workflow (tag `release/*` → archive → submit to review). `09-monetization-details.md` Sections 4a-4j provide step-by-step App Store Connect configuration for every IAP product: subscription group creation, each product ID, display name, price, description, all configured via screenshots-level instructions. The `apple-webhook` Edge Function URL for App Store Server Notifications is specced.

**No gaps identified.**

---

### Step 5: Game goes live → monitors PostHog dashboards

**Status: OK (partial)**

`07-ui-ux-specs.md` Section 16.7 (Admin Analytics) speccs an embedded PostHog dashboard iframe in the admin dashboard showing: DAU/WAU, retention cohorts (D1/D7/D30), match completion rate, evolution funnel, economy health, subscription conversion. Alternatively "Open in PostHog" link.

`04-progression-economy.md` Section 2.7 speccs a PostHog alert threshold for dust balance inflation.

`06-technical-architecture.md` Section 1.2 speccs PostHog iOS SDK and notes "Player behavior, retention, match data, economy health."

**Minor gap:** No specific PostHog event taxonomy is documented. Individual events sent to PostHog are scattered across docs (`evolution_flux_timeout` in `07-ui-ux-specs.md` Section 4.3, `PostHogService.swift` listed in project structure). There is no consolidated event list that the owner could verify is being tracked or set up as PostHog dashboards.

**Finding:** MISSING BACKEND — No consolidated PostHog event taxonomy document or table is specced. The owner cannot verify analytics coverage or set up dashboards without knowing which events fire.

---

### Step 6: Weekly routine — check analytics → review generated content → adjust economy config → push updates

**Status: OK**

`07-ui-ux-specs.md` Section 16 (Admin Dashboard) is fully specced:
- Section 16.2 (Dashboard): Stats grid, Pending Actions panel, Recent Activity feed, Quick Actions.
- Section 16.3 (Cards): Approve/reject workflow, batch approve, edit stats inline.
- Section 16.6 (Economy): Currency overview, quest management (edit/toggle), subscription breakdown.
- Section 16.8 (Settings): Game Configuration fields (turn timer, energy thresholds, dust rewards, pack costs, shard costs), save button calls `PATCH /admin/config`.

`04-progression-economy.md` Section 9 speccs the `economy.config.json` schema. Section 10 (balance dashboard) runs locally — no cloud compute.

`06-technical-architecture.md` Section 4.3 speccs that economy values are read from `economy_config` table at runtime so changes take effect without code.

**No gaps identified.** All weekly routine tasks are within 3 clicks from the admin dashboard homepage.

---

### Step 7: New season — generate new cards → configure battle pass → deploy content update

**Status: PARTIAL / OWNER REQUIRES CODE**

**Generate new cards:** OK — see Step 2 above. Admin dashboard batch generation workflow handles this.

**Configure battle pass:**

`07-ui-ux-specs.md` Section 16 (Admin Dashboard) does not include a "Battle Pass" or "Season Management" section. There is no admin UI specced for:
- Creating or activating a new season.
- Configuring the battle pass tier rewards for a new season.
- Setting the season start/end dates.
- Marking a season as active.

`09-monetization-details.md` references a `seasons` table but this table is not in `06-technical-architecture.md`'s DB schema. The owner has no specced UI path to configure a new season without writing SQL or code.

**Finding:** OWNER REQUIRES CODE — No admin dashboard screen for season management (create season, set dates, configure battle pass rewards) is specced. The owner would need to write SQL or call an API directly to create a new season.

**Finding:** MISSING SCREEN — No "Season Management" or "Battle Pass Configuration" section in the admin dashboard spec.

**Deploy content update:** `06-technical-architecture.md` Section 2.7 speccs Xcode Cloud workflows for deployment. For backend, `railway up` is the deploy command. Economy config changes take effect immediately via the `economy_config` table. Card template approvals go live immediately in Supabase. For new iOS features, push to `main` branch triggers build.

This part is OK — a deploy is 1 git push command or 1 click in Xcode Cloud dashboard.

---

### Step 8: Incident — player reports bug → owner checks admin dashboard → identifies issue → pushes fix

**Status: PARTIAL**

`07-ui-ux-specs.md` Section 16.5 (Players Management) speccs a player detail page with activity log, admin actions (grant dust, grant shard, suspend, reset evolution). A player report can be investigated via this screen.

`07-ui-ux-specs.md` Section 16.2 (Dashboard) shows "Player reports: count + Review link" in the Pending Actions Panel.

**Gaps:**

1. **MISSING SCREEN — Player Reports Queue:** The admin dashboard shows a count of player reports with a "Review" link, but there is no specced screen for what the player reporting flow looks like on the player side (how do players submit a bug report?) and no spec for the admin-side reports review queue.

2. **UNDEFINED TRANSITION — Bug → Fix:** Once the owner identifies an issue in the admin dashboard, the fix path is:
   - Economy/config issue: Admin Settings → edit config value → save. OK (1 click).
   - Game logic bug: Requires code fix → git push → Xcode Cloud / Railway auto-deploy. This is acceptable (1 command).
   - But there is no specced process for the owner to test a fix before deploying. The Xcode Simulator testing process (referenced in CLAUDE.md) requires Claude Code to run tests, not the owner to independently verify.

3. **MISSING BACKEND — `player_reports` table:** No `player_reports` table is defined in `06-technical-architecture.md` Section 3.1. The admin dashboard references player reports count but there is no mechanism for players to submit reports in the iOS app spec (no "Report Bug" or "Report Player" button in any specced screen), and no table to store them.

**Finding:** MISSING BACKEND — No `player_reports` table in DB schema; no "Report" button in iOS app spec.

**Finding:** MISSING SCREEN — No player-facing bug report / player report screen specced in 07.

---

## Part 2 Summary — Owner Journey Findings

| Finding | Step | Severity |
|---|---|---|
| OWNER REQUIRES CODE: Railway service setup (service names, env vars, start commands) not specced | 3 | Medium |
| MISSING BACKEND: No consolidated PostHog event taxonomy | 5 | Medium |
| OWNER REQUIRES CODE: No admin UI for season creation / battle pass configuration | 7 | High |
| MISSING SCREEN: No "Season Management" admin dashboard section | 7 | High |
| MISSING SCREEN: No player-facing bug/player report screen | 8 | Medium |
| MISSING BACKEND: No `player_reports` table in DB schema | 8 | Medium |
| MISSING SCREEN: No admin-side player reports review queue | 8 | Medium |

---

## Consolidated Finding Index

### Critical

- **MISSING SCREEN:** `HomeView` (dashboard, play entry, daily quests) is listed in the Screen Inventory and Navigation Map but has zero layout/component spec in `07-ui-ux-specs.md`. This is the most frequently visited screen in the game.

### High

- **MISSING SCREEN:** `ModeSelectionView` (Ranked / Casual / Practice selector) — listed in Screen Inventory, in Navigation Map, in file structure, but no SwiftUI layout spec.
- **MISSING SCREEN:** `MatchmakingView` — same situation as ModeSelectionView.
- **MISSING SCREEN:** `ProfileView` — listed in Screen Inventory and file structure, no layout spec.
- **MISSING SCREEN:** Ranked Ladder / Rank Progress screen — no screen in 07 shows rank points, progression, or rank history.
- **MISSING SCREEN:** Battle Pass screen — no navigation path or SwiftUI spec exists.
- **MISSING SCREEN:** Season End / Transition screen — no spec.
- **MISSING BACKEND:** `seasons` table, `battle_pass_progress` table not defined in `06-technical-architecture.md` DB schema.
- **MISSING BACKEND:** Season-end reward distribution and rank reset Edge Function not specced.
- **OWNER REQUIRES CODE:** No admin dashboard screen for creating a new season or configuring battle pass rewards.
- **MISSING SCREEN:** Season Management section missing from admin dashboard spec.

### Medium

- **MISSING SCREEN:** Apple Sign-In prompt before onboarding Step 1 not specced.
- **MISSING SCREEN:** Avatar unlock/browse screen not specced.
- **MISSING SCREEN:** Cosmetics subsection of Shop (card backs, board skins, frames) not specced.
- **UNDEFINED TRANSITION:** `PostMatchResultsView` replacement of `.fullScreenCover` BattleView and return to tab bar.
- **UNDEFINED TRANSITION:** Quest reward claim flow not specced in any screen.
- **UNDEFINED TRANSITION:** Rank change notification in Post-Match results.
- **UNDEFINED TRANSITION:** How new season cards are surfaced to players.
- **MISSING SCREEN:** App Store submission assets (description, keywords, age rating, privacy labels).
- **MISSING BACKEND:** No consolidated PostHog event taxonomy.
- **OWNER REQUIRES CODE:** Railway service configuration steps not fully specced.
- **MISSING SCREEN:** Player-facing bug/player report screen not specced.
- **MISSING BACKEND:** `player_reports` table not in DB schema.
- **MISSING SCREEN:** Admin-side player reports review queue not specced.
- **MISSING SCREEN:** Leaderboard screen (Master/Grandmaster top players) not specced.

### Low

- **MISSING SCREEN:** No loading/splash screen between app launch and Apple Sign-In / onboarding.

---

## Recommended Resolution Priority

1. Spec `HomeView` immediately — it is the navigation hub and daily-use screen. Without it, onboarding has no clear landing and quests have no clear entry point.
2. Spec `ModeSelectionView` and `MatchmakingView` — together they are the critical path from home to battle.
3. Spec `ProfileView` — needed for ranked play feel and player identity.
4. Add `seasons` and `battle_pass_progress` tables to `06-technical-architecture.md` DB schema.
5. Add a Season Management section to the admin dashboard spec in `07-ui-ux-specs.md`.
6. Spec the Battle Pass screen and Season End screen.
7. Define the `PostMatchResultsView` → `TabView` navigation mechanism explicitly.
8. Spec the cosmetics shop section, avatar unlock screen, and quest claim flow.
