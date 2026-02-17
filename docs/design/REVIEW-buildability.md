# Chaos Creatures — Buildability Audit

**Auditor:** Technical feasibility reviewer (solo non-engineer + Claude Code build path)
**Date:** 2026-02-16
**Scope:** All docs in `docs/design/` (00–10, plus 03–09 specialist docs)
**Question answered per feature:** *Can a solo non-engineer actually ship this using Claude Code to vibe-code it?*

---

## Rating Scale

| Rating | Meaning |
|--------|---------|
| GREEN | Straightforward. Claude Code handles this well. Standard patterns exist. |
| YELLOW | Doable but tricky. Known pain points for AI-assisted coding. May need multiple iterations. Specific risk flagged. |
| RED | Very high risk. Complex real-time systems, intricate animation choreography, or niche framework APIs that Claude Code may struggle with. Recommend simplification or phased approach. |

---

## Master Feature Table

| Feature | Source Doc | Rating | Risk Description | Suggested Simplification |
|---------|-----------|--------|-----------------|--------------------------|
| Supabase Auth — Apple Sign-In only | 06 §4.1 | GREEN | Standard Supabase Swift SDK flow. Well-documented. Single-platform means no Google fallback edge cases. | — |
| PostgreSQL schema creation + migrations | 06 §3.1, §3.2 | GREEN | Schema is fully written out. `supabase db push` is one command. Claude Code handles SQL migrations well. | — |
| Row Level Security policies | 06 §3.1 | GREEN | All RLS policies are written verbatim in the doc. Claude Code can copy them in. | — |
| Supabase Edge Functions (Deno/TypeScript) | 06 §4 | GREEN | All endpoint signatures are written with actual code. Deno runtime is straightforward. | — |
| Cloudflare R2 upload from Edge Functions | 06 §4.7 | GREEN | S3-compatible API. Pattern is a fetch + PUT. The code is given in the doc. | — |
| fal.ai FLUX base card generation (txt2img) | 03 §1.2 | GREEN | Simple HTTP POST with documented params. Error handling with exponential backoff is specified. | — |
| GPT-4o Mini text generation (names + flavor) | 06 §4.7 | GREEN | Standard OpenAI chat completions with `json_object` response format. Extremely cheap and reliable. | — |
| Card batch pipeline (Node.js + manifest) | 05 §2 | GREEN | Self-contained CLI script. JSON manifest for resumability is well-specified. Admin review gallery is Express + static HTML. | — |
| Content pipeline review gallery (web UI) | 05 §2c | GREEN | Simple Express server + grid of image cards with approve/reject buttons. Claude Code builds this kind of CRUD UI easily. | — |
| Supabase PostgREST CRUD (collection, decks) | 06 §4.2 | GREEN | Direct SDK calls. All table schemas are defined. RLS handles authorization automatically. | — |
| Economy math + Chaos Dust transactions | 06 §4.3 | GREEN | SQL transaction with row-level lock is given verbatim. All values are in `economy_config` table. | — |
| StoreKit 2 — basic subscription purchase flow | 06 §2.4, 09 | GREEN | The full `StoreKitService` implementation is given in the doc with async/await. Product IDs are enumerated. | — |
| App Store Server Notifications V2 webhook | 06 §2.4 | GREEN | Full Edge Function implementation is provided. JWS decode + tier update path is explicit. | — |
| SwiftUI TabView + NavigationStack | 07 §2 | GREEN | Standard iOS 17 navigation. All view names are specified. Claude Code handles SwiftUI navigation well. | — |
| SwiftUI Home, Collection, Profile, Shop views | 07 §4–§8 | GREEN | Each view is sufficiently specified with Swift struct names, layout, and state management approach. | — |
| Collection grid + filters | 07 §5 | GREEN | `LazyVGrid` + filter bar. Standard SwiftUI pattern with clear spec. | — |
| Card rendering (CardView component) | 07 §3.1 | GREEN | Single composable view. Art via `AsyncImage`, stats via `Text` layers. Spec gives exact layout. | — |
| AsyncImage card art from R2 CDN | 07 | GREEN | Built-in SwiftUI API. ImageCacheService in doc uses NSCache + disk cache — standard actor pattern. | — |
| Xcode project folder structure | 06 §2.1 | GREEN | Full directory tree is written out. Claude Code can create this structure precisely from the spec. | — |
| Supabase Swift SDK setup + singleton | 06 §2.2 | GREEN | Implementation is given verbatim with `SupabaseClient` init. Single line of code in `AppChaosCreaturesApp.swift`. | — |
| Xcode Cloud CI/CD config | 06 §2.7 | GREEN | Three workflows are fully specified. The `ci_post_clone.sh` script is given. Xcode Cloud UI settings require no code. | — |
| Daily/weekly quest system (backend) | 04, 06 §3 | GREEN | `missions` table is defined. Quest generation and claim logic are standard SQL + Edge Function patterns. | — |
| Admin Dashboard — economy config editor | 04 §9 | GREEN | Simple CRUD form over the `economy_config` table. React + Supabase client. Standard admin panel pattern. | — |
| Admin Dashboard — card generation trigger | 05 §2 | GREEN | Button calls the batch pipeline CLI command via the Railway API or triggers a Railway job. Straightforward. | — |
| Matchmaking queue (polling model) | 06 §4.5 | YELLOW | The 2-second polling loop on the game server is simple, but: (1) race condition if two Railway instances both try to `createMatch` on the same player pair simultaneously; (2) at scale, polling is inefficient. Risk is low at launch (single Railway instance). **Risk:** Railway may auto-scale to multiple instances — two instances could double-match players. | Use `SELECT FOR UPDATE SKIP LOCKED` on the queue table to make the match-creation transaction atomic. The doc specifies the polling loop but does not specify the locking. Claude Code will need to add this SQL pattern. |
| Deck builder — drag-to-add cards | 07 §6 | YELLOW | SwiftUI drag-and-drop (`onDrop`, `draggable`, `dropDestination`) is finicky on iOS, especially combining it with a scrollable list. Known Claude Code struggle area. **Risk:** Drop targets and scroll interaction fighting each other; Claude Code may produce builds that work in Simulator but have gesture conflicts on device. | Simplify to tap-to-add (tap card → select quantity → confirm). Drag-drop is a nice polish feature but tap-to-add is standard in card games (Hearthstone, Marvel Snap all use tap). This is a phase-2 upgrade. |
| SpriteKit `SKView` + SwiftUI `ZStack` overlay (battle screen) | 07 §3 | YELLOW | Mixing SwiftUI overlay views with `SpriteView` is well-supported in iOS 17 but hit-testing conflicts are a known pain point: touch events intended for SwiftUI buttons can fall through to the SpriteKit scene or vice versa. **Risk:** "End Turn" button or hand card taps being absorbed by the SKScene. | The doc's spec is detailed and correct (uses `.allowsTransparency`, SwiftUI views on top). The pattern works — but Claude Code will likely need 2–3 iterations to get hit-testing right. Plan for this. No simplification needed; just expect iteration. |
| Blocker assignment via drag in SpriteKit | 07 §3.6 | YELLOW | Drag-interaction in SpriteKit (`touchesMoved` + frame intersection) is lower-level than SwiftUI drag. The spec is detailed (lunge animation, green/red hover, snap-back on invalid drop). **Risk:** Touch tracking getting confused between the `HandNode` scroll behavior and the blocker drag; `touchesBegan`/`touchesMoved`/`touchesEnded` coordination with multiple simultaneous targets. | Simplify to tap-to-assign instead of drag-to-assign: tap a defending creature → it highlights as the "selected blocker" → tap an attacker to assign it. This is functionally identical for the player and eliminates the drag gesture complexity entirely. Show draw lines after assignment. |
| Evolution polling (client-side 500ms loop) | 07 §4.2, 06 §4.4 | YELLOW | Client polls `/evolution/status/{jobId}` every 500ms while AI generation runs. **Risk:** (1) Supabase Edge Function has a 60-second timeout — fal.ai Prismatic shard generation (2 passes) may take longer than that; (2) If the user backgrounds the app during polling, the timer stops and the resume logic needs to re-check state correctly; (3) The polling creates a "busy waiting" UX during generation that needs a believable loading animation to not feel broken. | The doc already has a fallback art mechanism for failed generations. For the timeout risk, the generation job should be triggered as a database-tracked async job (which it is via `generation_jobs` table) and the client should poll the DB row directly, not the Edge Function. This decouples generation from the HTTP call lifetime. Consider adding a Supabase Realtime subscription on the `generation_jobs` row as a push alternative to polling. |
| StoreKit 2 — subscription upgrade/downgrade | 09 §2 | YELLOW | Basic purchase and `Transaction.currentEntitlements` are GREEN. The edge cases are not: (1) downgrading from Top to Mid tier — Apple processes this at renewal, not immediately, so there's a window where the player's server-side tier is stale; (2) family sharing — a family member could have a different tier applied to the owner's account; (3) interrupted purchases (`Product.PurchaseResult.pending` for Ask to Buy). **Risk:** The doc handles the happy path but the webhook handling for `EXPIRED` notifications uses `auth_id` matching via `appAccountToken` — this must be configured correctly during initial subscription setup (setting `appAccountToken` in the purchase call). If this UUID is missing from the transaction, the webhook cannot find the player row to downgrade. | Ensure `product.purchase(options: .init(appAccountToken: playerUUID))` is called with the player's UUID set as `appAccountToken`. The doc specifies `syncSubscriptionWithServer` but does not show this being set in the purchase options. Claude Code must add this. |
| Supabase Realtime channel per match | 06 §2.5 | YELLOW | The channel subscription and broadcast pattern is documented with actual code. **Risk:** (1) Supabase Realtime has a default limit of 200 concurrent channel subscriptions on the free tier (500 on Pro). Each match uses one channel; if two players both subscribe, that's 2 subscriptions per match. At 100 concurrent matches that's 200 subscriptions — right at the Pro limit; (2) The `RealtimeChannelV2` Swift API is still evolving — method signatures changed between Supabase Swift SDK versions 2.x. Claude Code may generate code for the wrong API version. | Specify the exact Supabase Swift SDK version in `Package.swift` (`supabase-swift` 2.x pinned). Add a comment noting the 200-subscription cap at launch. This is a post-launch scaling concern, not a build blocker. |
| Game server reconnection + state snapshot | 06 §4.6, §2.5 | YELLOW | The spec says: "periodic snapshots to PostgreSQL for reconnection" but does not specify: (1) snapshot frequency; (2) the exact schema of the snapshot; (3) whether the client re-requests a snapshot via `sendAction(.reconnect)` which the game server must handle as a special case to broadcast full `matchState` rather than a delta. The doc shows the client-side reconnect code but the server-side handler for `.reconnect` actions is not specified. **Risk:** Reconnection will likely fail silently — client reconnects to Realtime but game server does not respond to the reconnect action, leaving the client in a stale state. | Add a server-side `handleReconnect(playerID)` function to the game server spec that: (1) finds the in-memory match state for this player; (2) broadcasts a `matchState` event with full snapshot; (3) logs the reconnect for analytics. This is a 30-line addition. Without it, reconnection is broken by default. |
| Battle log (SpriteKit scroll overlay) | 07 §3.7 | YELLOW | Implementing a scrollable list inside a SpriteKit `SKNode` is non-trivial — SpriteKit has no native scroll view equivalent. The spec uses `SKAction.moveBy` on a content node. **Risk:** The scroll behavior will be jerky because there's no momentum/physics built in. Long matches generate many log entries; manually tracking content offset with `SKAction.moveBy` is fragile. | Use a SwiftUI overlay `ScrollView` instead of an SpriteKit overlay node. This is a legitimate simplification: the battle log panel slides in as a SwiftUI `ScrollView` inside a ZStack overlay on `BattleView`. Spec already shows GraveyardSheet as SwiftUI — same pattern applies here. |
| Adaptive battle music (AVAudioEngine stems) | 08 §3.2 | YELLOW | `AVAudioEngine` with multiple `AVAudioPlayerNode` instances, real-time volume crossfading based on instability, synchronized looping via CAF loop points — this is significantly more complex than the rest of the audio system. **Risk:** (1) Audio engine graph setup is verbose and error-prone (connecting nodes in the wrong order crashes); (2) Seamless looping at the exact same sample position across 6 stems requires all stems to be started with the same `AVAudioTime` — Claude Code may use `AVAudioPlayerNode.play()` (which doesn't synchronize) instead of `scheduleBuffer(at:)` with a shared start time; (3) App backgrounding/foregrounding causes audio session interruptions that must be handled explicitly. | Simplify to a single battle music track per faction matchup (3x3 = 9 tracks, pre-mixed) plus a separate intensity layer that crossfades. This eliminates the need for synchronized multi-stem playback. Use `AVAudioPlayer` instead of `AVAudioEngine` for all tracks. The instability crossfade (Order vs. Chaos intensity) can be done with two overlapping `AVAudioPlayer` instances and simple `.volume` property changes. This produces ~80% of the intended effect with ~20% of the audio engineering complexity. |
| Evolution ceremony animation (SwiftUI multi-step) | 07 §4 | YELLOW | The 9-step evolution state machine with `withAnimation` transitions, typewriter text effects, energy particle animations, and `@State private var pulseScale` patterns is complex but not technically risky — it's all declarative SwiftUI. **Risk:** The sheer number of steps means Claude Code will need to produce 9 view structs plus a ViewModel with correct state transitions. Particle effects (SwiftUI canvas or SpriteKit?) are underspecified for the evolution ceremony — the doc says "chaos energy particles gather" but doesn't specify the implementation mechanism. | The evolution ceremony should use SwiftUI `Canvas` for the particle effects (simple random floating dots — no SpriteKit scene required for this screen). The `Canvas` API is straightforward and Claude Code handles it well. Clarify in the spec: "Use SwiftUI `Canvas` with `TimelineView` for particle animation, not a separate SKScene." |
| Authoritative game server — full turn engine | 06 §5 | RED | The game server turn engine is the most complex piece of the entire project. It involves: (1) a stateful TypeScript class managing in-memory game state per match; (2) a 9-phase state machine with strict sequencing; (3) server-authoritative validation of every player action; (4) correct handling of Taunt forced-attack + forced-block interaction; (5) simultaneous combat resolution with 6 ordered keyword steps (Shield → Damage → Deathtouch → Death → Piercing → Lifesteal); (6) stat recalculation after each modifier attunement change; (7) triggered abilities (ON_PLAY, ON_ATTACK, ON_BLOCK, ON_DEATH, ON_ORDER, ON_CHAOS) firing in the correct sequence. The doc provides full TypeScript implementations for all phases — this is a critical asset. **Risk:** The combat resolution code alone has 10 sequential steps with interdependencies. Bugs in step ordering (e.g., Deathtouch firing before Piercing, or stats not recalculating after an ON_DEATH trigger removes a creature) will manifest as game-breaking exploits. Claude Code will produce _something_ that runs, but correctness requires extensive test coverage. Missing: the doc does not fully spec `resolveEffect()` — the function that all triggered abilities and event effects call. This is the core dispatcher that handles all effect types (DAMAGE, HEAL, BUFF, DRAW, etc.) and is called from at least 6 different places. Without it, the entire turn engine cannot compile. | **Phase the build:** Phase 1 (MVP) — implement the game server with only creatures, no keywords, no triggered abilities, no modifier attunement. Just: play creature, attack, block, deal damage, check HP. This is ~30% of the complexity and produces a playable game. Phase 2 — add keywords one at a time (Shield first, then Lifesteal, then Flying/Reach, then Deathtouch, then Piercing, then Taunt last as it has two-part rules). Phase 3 — add modifier attunement and triggered abilities. Each phase requires a full test suite before moving on. Write unit tests for every combat scenario in `01-battle-mechanics.md` Phase 8 before writing the code. |
| Real-time match synchronization (two players, shared state) | 06 §2.5, §4.6 | RED | Two players sharing authoritative state via Supabase Realtime + Railway game server introduces multiple failure modes that are individually manageable but collectively risky: (1) **Message ordering**: Supabase Realtime does not guarantee message ordering. If a `card_played` event and a `chaos_roll` event arrive out of order, the client renders an impossible game state. The doc does not specify sequence numbers on broadcast messages. (2) **Split-brain during reconnection**: Player A reconnects while Player B is mid-action. The game server must pause the action timer, wait for Player A's reconnect, then send a full snapshot. The timer pause logic is not specified. (3) **Simultaneous actions from both players**: During the Blocker phase, both players technically have control (attacker sees their committed attackers, defender is assigning blockers). If the attacker's client sends a stale action while the defender is blocking, the server must reject it. The validation code in the doc handles the happy path but not this race condition explicitly. (4) **Railway horizontal scaling**: If Railway scales to 2 instances, in-memory match state is not shared between them. A player reconnecting might hit a different Railway instance with no state for their match. | (1) Add a `seq` (sequence number) field to every broadcast message from the game server. Client tracks last received seq and can detect gaps. (2) For reconnection: specify that the server broadcasts `{ event: "timer_paused", seconds_remaining: N }` when a disconnect is detected and `{ event: "timer_resumed" }` when they reconnect (with a 30-second reconnect window before forfeit). (3) For Railway scaling: pin to a single Railway instance for MVP (set `RAILWAY_RUN_UID` in env to prevent auto-scaling during active matches). Long-term solution is Redis for shared match state, but that is post-MVP. |
| Blocker assignment with Taunt enforcement (two-part rule) | 06 §5.2, 07 §3.6 | RED | The Taunt keyword has the most complex rules in the game (forced-attack on attacker, forced-block on defender). The client must: (1) display a banner preventing the attacker from confirming with fewer attackers than the Taunt minimum; (2) pre-assign the Taunt creature's block line automatically at the start of the block phase; (3) disable the Taunt creature's drag interaction if it's already auto-assigned; (4) allow the player to change which attacker the Taunt blocks (if multiple attackers). The server must: (5) validate the minimum attackers rule on `confirm_attackers`; (6) validate the forced-block rule on `confirm_blockers` including the Flying exception. All six of these interactions intersect in real-time across two clients. **Risk:** This is the single most likely source of game-breaking bugs at launch. The Flying + Taunt interaction (Taunt obligation waived if attacker has Flying and Taunt lacks Reach) is especially likely to be implemented incorrectly. | **Defer Taunt to post-launch v1.1.** Ship with 6 keywords: Shield, Lifesteal, Flying, Reach, Deathtouch, Piercing. These are all straightforward and self-contained. Taunt requires two-phase cross-client enforcement and is the most complex keyword by far. Add it in the first balance patch after launch when the game server is proven stable. Mark Taunt cards in the content pipeline as "not approved for launch." |
| AVAudioEngine multi-stem synchronized looping | 08 §3.2 | RED | The spec requires 4 `AVAudioPlayerNode` instances started at exactly the same sample offset, looping indefinitely with zero gap between loops. This requires: (1) scheduling all nodes with `scheduleBuffer(at: commonTime)` using a shared `AVAudioTime`; (2) re-scheduling the next loop before the current one ends (no gap); (3) handling audio session interruptions (phone calls, Siri, other apps) without desynchronizing the stems. In practice, this is a level of audio engineering complexity that trips up even experienced iOS developers, let alone AI-generated code. Claude Code will almost certainly generate `AVAudioPlayerNode.play()` which starts immediately but not in sync with other nodes. The result will be audible phase drift between stems within seconds. **Risk:** This is the single feature most likely to produce a broken result that _appears_ to work in testing (stems are quiet enough that drift isn't obvious) but degrades the experience in play. | Replace with the simpler two-player approach: (1) `AVAudioPlayer` for the faction-matched battle track (single pre-mixed CAF per matchup — 9 files). (2) A second `AVAudioPlayer` for the intensity layer (Order vs. Chaos). Crossfade these two players with `.volume` changes. This is fully documented in Apple's docs, requires 20 lines of code, and produces an adaptive audio result that is 80% as good. The synchronized-stem system can be added in v2 by someone who wants to write the audio engineering code properly. |
| Offline mode / mid-match network recovery with timer sync | 06 §4.6, §2.5 | RED | The spec handles client reconnection (exponential backoff, 5 attempts, full state snapshot request) but does not specify: (1) what happens to the server-side turn timer while the client is reconnecting (timer keeps running per spec — but if the player disconnects for 10 seconds and reconnects with 50s left, how does the client timer sync?); (2) what happens if both players disconnect simultaneously (e.g., server restart); (3) what is the timeout for the reconnect window before the match is forfeited? The doc says "timer keeps running" for single-disconnect but for a simultaneous disconnect (e.g., Railway deploy), both players' timers would expire, triggering auto-end-turns on phantom actions. **Risk:** Match corruption on server restart. Railway restarts the server process during deploys — any in-progress matches are lost. | Specify the reconnect window as 60 seconds (one full turn timer). On reconnect within 60s, server sends current timer state (`{ seconds_remaining: 47 }`). On disconnect >60s, match is forfeited (disconnect loss). For Railway deploys: use Railway's zero-downtime deploy (only available on paid plan) or schedule deploys during low-traffic windows. Add a `force_end_match_on_server_restart()` function that iterates all active matches and records them as `DISCONNECT` results before shutdown (listen on `SIGTERM`). |

---

## Doc-Specific Structural Assessments

### Does doc 06 specify the Xcode project structure clearly enough for Claude Code to create it?

**YES.** Section 2.1 provides a complete directory tree with every file named, its type noted, and its purpose documented. This is more than sufficient for Claude Code to scaffold the project. The `Config.xcconfig` / `Info.plist` / `Secrets.swift` pattern is explicitly specified with the correct Xcode approach.

One gap: the doc does not specify the Xcode project's **Swift Package Manager dependencies** (`Package.swift` or `Package.resolved` content). Claude Code will need to infer the correct package declarations for:
- `supabase-swift` (Supabase Swift SDK)
- `posthog-ios` (PostHog analytics)

These are both available on SwiftPM. The doc should add a `Package.swift` snippet or an explicit list of SPM dependencies with version constraints. Without this, Claude Code will add the packages but may pick the wrong version.

### Does doc 07 specify SwiftUI views with enough detail for Claude Code?

**MOSTLY YES.** The battle screen (Section 3), evolution flow (Section 4), and HUD components are specified with actual Swift structs, modifiers, and layout values. The collection, deck builder, shop, and profile screens (Sections 5–9, which were not fully read due to length) appear to follow the same pattern based on the screen inventory.

**Known gaps:**
- The `DeckBuilderView` interaction model references drag-to-add but as noted above, this should be simplified to tap-to-add.
- The `CardPackOpeningView` (pack reveal animation) is listed in the project structure but not detailed in the visible sections of doc 07. This will need to be spec'd or Claude Code will invent it.
- The `SubscriptionView` (StoreKit 2 paywall) layout is not detailed — doc 09 gives the product IDs but not the UI layout. Claude Code will need to create this screen from scratch.

### Are all SpriteKit animations specified with actual SKAction types?

**YES for the battle screen.** Doc 07 Section 3.5 specifies every combat animation with explicit `SKAction` calls, timing values, and sequencing. Specifically:
- Card play: `SKAction.sequence([group([fadeIn, scale]), move, scale(1.05), scale(1.0)])` — 450ms total — specified.
- Attacker glow: `SKAction.colorize` + `SKAction.repeatForever(pulse)` with key `"attackerGlow"` — specified.
- Damage numbers: `SKAction.group([moveBy(0,50,0.8), sequence([wait(0.4), fadeOut(0.4)])])` — specified.
- Creature death: `SKAction.group([fadeOut, scale(0.7), rotate])` + `SKEmitterNode` per faction — specified.
- Chaos Roll D20: spin (`SKAction.rotate(byAngle:.pi*4, duration:0.4)`) + settle bounce — specified.
- Event overlay: `SKAction.group([fadeIn(0.3), scale(1.0, 0.3)])` + auto-dismiss sequence — specified.

**Underspecified:**
- The evolution ceremony particle effects are described verbally but no `SKAction` types or `SKEmitterNode` file names are given for the evolution screen specifically.
- The card draw animation (hand card appearing from deck) is referenced but not explicitly coded.
- The `spawnSpellParticles(from:to:)` function is called but not implemented in the spec.

### Are all Supabase Edge Functions specified with actual endpoint signatures?

**MOSTLY YES.** The following Edge Functions have actual code or full signatures in the docs:

| Function | Status |
|----------|--------|
| `apple-webhook` (StoreKit sync + App Store notifications) | Full implementation in 06 §2.4 |
| `evolution/start` | Request/response shape specified in 06 §4.7 |
| `evolution/{id}/status` | Request/response shape specified in 06 §4.7 |
| `evolution/{id}/confirm` | Request/response shape specified in 06 §4.7 |
| fal.ai generation call | Full TypeScript in 06 §4.7 |
| OpenAI generation call | Full TypeScript in 06 §4.7 |

**Missing or underspecified Edge Functions:**
- `collection/pack-open` — Card pack purchase and card assignment logic is described conceptually in 00 §3 and 06 §4.2 but no Edge Function code or signature is given. This is a critical economy function.
- `matchmaking/join` and `matchmaking/leave` — The queue table is specified but the Edge Function endpoints for joining/leaving the queue are not given with request/response shapes.
- `auth/onboarding/complete` — Faction selection at end of onboarding must update `players.primary_faction_id` and convert trial deck cards to owned `card_instances`. This logic is described in 00 §3 but not implemented in any Edge Function spec.
- `missions/claim` — Quest reward claim endpoint is not specified.
- `player/daily-reward` — If daily rewards exist (login bonus), no endpoint is specified.

---

## Top 5 Build Risk Summary

| Rank | Feature | Rating | Primary Risk |
|------|---------|--------|-------------|
| 1 | Authoritative game server — full turn engine | RED | `resolveEffect()` dispatcher is unspecified; combat keyword ordering bugs will be game-breaking; no unit test scaffold provided |
| 2 | Real-time match sync — message ordering, reconnect, scaling | RED | No sequence numbers on broadcast messages; server-side reconnect handler is not implemented; Railway horizontal scaling breaks in-memory state |
| 3 | AVAudioEngine multi-stem synchronized battle music | RED | Synchronized multi-stem looping requires advanced audio session management; Claude Code will produce phase-drifting code; replace with simpler `AVAudioPlayer` approach |
| 4 | Blocker assignment + Taunt two-part enforcement | RED | Six-way interaction between client UI, server validation, Flying exception, and real-time cross-client state; defer to post-launch v1.1 |
| 5 | Mid-match offline recovery with timer sync | RED | Timer state reconciliation on reconnect is underspecified; SIGTERM handling for Railway deploys not implemented |

---

## Recommended Build Order (De-Risking Sequence)

Based on this audit, the recommended build order to minimize compounding failures:

1. **Infrastructure first**: Supabase schema, migrations, RLS, Apple Sign-In. (All GREEN)
2. **Game server — MVP combat only**: Creatures with no keywords, no triggered abilities, no modifier attunement. Just play/attack/damage/death. Ship this as the playable alpha.
3. **Client battle screen — MVP**: SpriteKit scene with creature nodes, attack animation, damage numbers. No fancy SFX, no adaptive music. One `AVAudioPlayer` for battle music.
4. **Evolution flow**: AI generation pipeline, polling, modifier selection UI. (YELLOW — plan for 2–3 iterations on the polling UX)
5. **StoreKit 2 subscriptions**: Happy path first, then webhook tier changes. Add `appAccountToken` to purchase call.
6. **Full turn engine with keywords**: Add keywords one at a time, with unit tests per keyword. Taunt last (or post-launch).
7. **Polish**: Adaptive audio, blocker drag gesture, battle log scroll. All deferrable.

---

## Revision Log

| Date | Author | Change |
|------|--------|--------|
| 2026-02-16 | Buildability Auditor | Initial audit created from full read of docs 00–10 |
