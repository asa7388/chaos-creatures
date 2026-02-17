# Chaos Creatures — PRD Input Summary
## Condensed Reference for PRD Writer (docs 03–09)

**Purpose:** This file condenses all key decisions, numbers, and specs from docs 03–09 so the PRD writer can produce `10-prd.md` without loading 15,000+ lines of source docs. Read this file instead of reading 03–09 in full.

**Project constraints (from CLAUDE.md):**
- Solo non-engineer owner; Claude Code builds everything
- Three tools: iOS game client (Swift/SwiftUI/SpriteKit, iOS 17+) + Admin Dashboard (Next.js/TypeScript on Railway, 4-5 custom screens) + Supabase Dashboard (built-in, free — player lookup, match history, auth management)
- Budget: $300 total build-to-launch
- 3 factions: Ironwright Collective (Augment), Fey Courts (Bond), Demonic Kingdoms (Corruption)
- 7 keywords: Shield, Lifesteal, Flying, Reach, Deathtouch, Taunt, Piercing
- Chaos Dust only — no real money on cards
- Payments: StoreKit 2 only (no RevenueCat, no Stripe)
- Auth: Apple Sign-In via Supabase Auth (no Google)
- Storage: Cloudflare R2 for card art CDN
- Analytics: PostHog (free tier, 1M events/month)
- Git remote is `chaos`, not `origin`

---

## DOC 03 — Prompt Templates & AI Generation Pipeline
**Version:** 3.0 | **Last Updated:** 2026-02-16

### Key Decisions
- All image generation is server-side (Railway or Supabase Edge Functions). iOS client never calls fal.ai directly.
- Every image prompt is prefixed with `STYLE_ANCHOR` string (locked, non-negotiable).
- Evolution uses img2img (FLUX Kontext) referencing previous tier's art.
- CM (Chaos Mote) cost never changes through evolution — only art, name, stats, abilities change.
- Player modifier selection: Free=2 options, Mid=3, Top=4 (all drawn from same pool).

### Global Style Anchor (LOCKED — prepend to every image request)
```
STYLE_ANCHOR = "fantasy card game art, painterly digital illustration, semi-realistic style, rich saturated colors with deep shadows and bright highlights, dramatic studio lighting, sharp focus on subject, subject centered and filling frame, card-portrait composition 3:4 aspect ratio, no text, no borders, no frames, no UI elements, no watermarks, professional quality"
```

### fal.ai API Endpoints
- Base card (txt2img): `POST https://fal.run/fal-ai/flux/dev`
- Evolution (img2img): `POST https://fal.run/fal-ai/flux-kontext/dev` (free) or `.../pro` (mid/top)
- Auth header: `Authorization: Key ${FAL_API_KEY}`
- Error handling: exponential backoff — 2s, 4s, 8s retries; HTTP 429 = rate limit

### Image Specs by Subscription Tier
| Tier | Endpoint | Image Size | Steps | Guidance | Passes | Cost/image |
|---|---|---|---|---|---|---|
| Free (Planar Shard) | flux-kontext/dev | 768×1024 portrait_4_3 | 28 | 7.0 | 1 | ~$0.02 |
| Mid (Refined Shard) | flux-kontext/pro | 1024×1024 square_hd | 32 | 7.5 | 1 | ~$0.05 |
| Top (Prismatic Shard) | flux-kontext/pro | 1024×1024 square_hd | 40 | 8.0 | 2 | ~$0.08 |

### Denoising Strength (img2img `strength` parameter)
| Evolution Step | Order strength | Chaos strength |
|---|---|---|
| Common → Uncommon | 0.35 | 0.65 |
| Uncommon → Rare | 0.40 | 0.70 |
| Rare → Epic | 0.45 | 0.75 |
| Epic → Legendary | 0.50 | 0.80 |

### Faction Art Prefixes (exact strings)
- **Ironwright:** `steampunk mechanical creature, brass and copper materials, exposed gears and clockwork mechanisms, riveted metal plating, steam vents, intricate precision engineering, industrial Victorian aesthetic, warm metallic tones with amber and rust highlights, glowing amber lenses`
- **Fey Courts:** `ethereal fey fantasy creature, ancient forest setting, bioluminescent flora and glowing fungi, living wood and vine armor, mystical natural magic, soft moonlight and starlight illumination, organic flowing forms, moss and crystal accents, cool nature palette with silver and violet highlights`
- **Demonic Kingdoms:** `demonic corrupted dark fantasy creature, hellfire and deep shadow, obsidian and bone construction, infernal glyphs and runes, corrupted flesh with visible strain, volcanic ash and floating embers, blood-red and deep purple-black tones, visceral menacing presence`

### Composition Instruction (all factions, all cards)
`portrait orientation, centered creature filling 70 percent of frame, dramatic three-quarter view or frontal pose, simple contextual background not cluttered, clear distinct silhouette, card game art composition, eyes visible and facing viewer, dramatic directional lighting`

### Negative Prompt (all requests, never omit)
`text, words, letters, watermarks, signatures, logos, borders, frames, NSFW, explicit content, gore, low quality, blurry, distorted anatomy, multiple heads, deformed limbs, floating objects, extra limbs, fused body parts, speech bubbles, comic panels, grid layout, collage, white background`

### Evolution Direction Instructions
- **Order:** Refine/structure, crystalline geometric patterns, luminous blue-white-gold energy, symmetrical enhancements. Subtle — creature remains recognizable.
- **Chaos:** Wild volatile energy, fractured asymmetric elements, red-purple crackling energy, jagged distorted proportions. Dramatic — retain core identity but push toward extreme.

### Modifier Pools Summary
- Universal modifiers: U01–U10 (Free), U01–U20 (Mid), U01–U30 (Top)
- Ironwright faction modifiers: IF01–IF10 (Free), IF01–IF18 (Mid), IF01–IF28 (Top)
- Fey Courts faction modifiers: FF01–FF10 (Free), FF01–FF18 (Mid), FF01–FF28 (Top)
- Demonic Kingdoms: same structure DK01–DK28
- Total: 30 universal + 28 per faction × 3 = 114 faction modifiers = 144 modifier definitions in doc 03
- Full modifier descriptions live in doc 03 sections 1.6. Code samples: TypeScript evolution prompt assembly is in doc 03 section 1.4.

### GPT-4o Mini Text Generation
- Endpoint: `POST https://api.openai.com/v1/chat/completions`
- Model: `gpt-4o-mini`, temperature 0.8, max_tokens 150, response_format json_object
- Response: JSON `{ "name": "...", "flavor_text": "..." }`
- Validation: name 3–30 chars, flavor text under 120 chars; retry once if fails
- Cost: ~$0.0001/card (~$0.02 for all 358 cards). Use OpenAI Batch API for >100 cards (50% cheaper).
- Faction voice prompts: Ironwright=industrial/pragmatic, Fey=ethereal/ancient, Demonic=visceral/corrupted

### R2 Art Storage
- All generated art uploads to Cloudflare R2 path: `art/{card_instance_id}/{tier}.webp`
- `art_url` on CardInstance/EvolutionRecord stores the R2 CDN URL
- R2 is S3-compatible (use AWS SDK v3 with R2 endpoint)

### Budget Impact (doc 03)
- ~$0.02–$0.08 per evolution image; ~$0.0001 per text generation
- Code samples for API calls exist in doc 03 sections 1.2, 1.3, 1.4

---

## DOC 04 — Progression & Economy Design
**Version:** 3.0 | **Last Updated:** 2026-02-16

### Key Decisions
- Free players never hit hard gates — only soft friction (time)
- No real money on individual cards
- Subscription = speed + variety + aesthetics, never raw power
- All Chaos Dust earned through gameplay — cannot be purchased directly
- Economy config is in `economy.config.json`, loaded by game server at startup; adjustable without code changes

### Evolution Energy Thresholds (LOCKED — never change post-launch)
| Step | Energy Required | Cumulative |
|---|---|---|
| Common → Uncommon | 15 | 15 |
| Uncommon → Rare | 30 | 45 |
| Rare → Epic | 50 | 95 |
| Epic → Legendary | 75 | 170 |
| Full path Common → Legendary | — | 170 |

### Energy Earning Rates
- Win: +2 energy per card
- Loss: +1 energy per card
- All 20 cards in active deck earn simultaneously per completed game (even if not drawn)
- Average at 50% WR: 1.5 energy/card/game

### Games to Legendary (50% WR)
- Single card: 113 games
- Regular player (5 games/day): Day 23 for first Legendary energy ready
- Casual (2 games/day): ~Day 57
- Hardcore (10 games/day): ~Day 11

### Chaos Dust Economy
**Earning rates (base):**
| Source | Amount |
|---|---|
| Win a match | 15 Dust |
| Lose a match | 5 Dust |
| Daily quest (easy) | 20 Dust |
| Daily quest (medium) | 30 Dust |
| Daily quest (hard) | 45 Dust |
| Weekly quest (standard) | 150 Dust |
| Weekly quest (hard) | 200 Dust |
| Season milestone | 50–500 Dust |
| Onboarding starter bonus | 200 Dust |

**Subscriber quest multipliers:**
- FREE: 1.0× | MID: 1.5× | TOP: 2.0× (applies to quest rewards only, not win/loss)

**Spending costs (LOCKED):**
| Item | Cost |
|---|---|
| Card pack (own faction, 3 Commons) | 100 Dust |
| Card pack (other faction, 3 Commons + unlock) | 150 Dust |
| Specific Common (targeted) | 50 Dust |
| Uncommon Shard | 30 Dust |
| Rare Shard | 60 Dust |
| Epic Shard | 120 Dust |
| Legendary Shard | 240 Dust |
| Avatar unlock | 300 Dust |
| Full evolution cost (1 card, Common → Legendary) | 450 Dust |
| Full deck evolution (20 cards) | 9,000 Dust |

**Daily dust income by player type (50% WR):**
| Player | Games/Day | Dust/Day | Dust/Week |
|---|---|---|---|
| Free Casual | 2 | 160 | 1,120 |
| Free Regular | 5 | 190 | 1,330 |
| Free Hardcore | 10 | 240 | 1,680 |
| Mid Regular | 5 | 260 | 1,820 |
| Top Regular | 5 | 330 | 2,310 |

### Shard Economy
**Starter shard package (every new player at faction commitment):**
- 3 Uncommon Shards + 1 Rare Shard + 1 Legendary Shard

**Shard sources:** Purchase with Dust, starter pack, quest rewards (chance), weekly quest rewards, season end rewards, monthly Legendary shard for TOP subscribers

**Top subscriber Legendary shard grant:** 1/month via Supabase pg_cron scheduled Edge Function (`0 0 1 * *`)

**Collection caps by subscription tier:**
| Tier | Cards per faction | Deck slots |
|---|---|---|
| Free | 50 | 3 |
| Mid | 100 | 5 |
| Top | 200 | 10 |

### Daily Quest System
- 3 active quests per player, reset daily at 00:00 UTC
- 1 free reroll per day
- 20 unique quest templates (D01–D20); difficulty distribution: 40% easy, 40% medium, 20% hard
- Medium quests: 20% chance of +1 Uncommon Shard on completion
- Hard quests: 30% chance of +1 Rare Shard on completion
- Quest tracking is server-side (Railway); iOS client reflects updates via Supabase Realtime

**Quest MissionTypes:** WIN_GAMES, PLAY_GAMES, PLAY_CREATURES, PLAY_SPELLS, PLAY_CARDS, EVOLVE_CARD, TRIGGER_CHAOS_EVENTS, TRIGGER_ORDER_EVENTS, DEAL_DAMAGE, WIN_WITH_STYLE

### Weekly Quest System
- 2 active quests per player, generated Monday 00:00 UTC, expire Sunday 23:59 UTC (hard expiry)
- No rerolls
- 10 templates (W01–W10), 2 assigned randomly per week
- Shard rewards: 1 Rare (standard), 1 Epic (hard)

### Onboarding Quests (one-time)
8 named quests that auto-assign in first 2 weeks, shown in "Getting Started" UI tab (not daily quest slot):
- First Blood (win first match): 50 Dust
- Evolution Begins (evolve first card): 2 Uncommon Shards + 50 Dust
- Deck Master (save custom deck): 100 Dust
- Chaos Scholar (5 Chaos Events): 1 Rare Shard
- Order Adept (5 Order Events): 1 Rare Shard
- Road to Rare (evolve to Rare): 200 Dust
- Ranked Debut (3 ranked matches): 100 Dust + Bronze card back
- Faction Loyalty (20 games starter faction): 200 Dust
- **Total onboarding rewards:** 750 Dust + 2 Uncommon Shards + 3 Rare Shards

### Rank/Ladder System
7 rank tiers: Bronze (3 divisions), Silver (3), Gold (3), Platinum (3), Diamond (3), Master (top 500), Grandmaster (top 100)
- Total rank states: 17 (maps to `SeasonRank` enum)
- Rank floors: each player cannot drop below first-time floor in a season (Silver 3, Gold 3, etc.)
- Season length: 8 weeks

### Budget Impact (doc 04)
- Economy systems use no additional services beyond base project
- Balance dashboard runs locally on owner's Mac (zero cloud cost)
- PostHog free tier covers economy monitoring for 6–12 months at launch volumes

---

## DOC 05 — Content Pipeline
**Document** defines the generation pipeline and launch content targets.

### Key Decisions
- Owner runs `npx ts-node scripts/generate-batch.ts --faction=ironwright --count=50` — one command
- Resumable via JSON manifest (`batch_results/run_TIMESTAMP/manifest.json`)
- Review gallery at `http://localhost:3001`; owner clicks Approve/Reject; approved cards auto-upload to R2 then Supabase
- Batch size: 50 cards; full launch = 8 batches
- Pipeline runs on Railway or local Node.js; Admin Dashboard hosts the gallery

### Launch Content Requirements
| Type | Per Faction | Total |
|---|---|---|
| Creatures | 100 | 300 |
| Spells | 17 | 51 |
| Universal stabilizers | — | 7 |
| **Grand total** | | **358 templates** |
- No faction-specific stabilizers at launch (all 7 stabilizers are universal)
- Generation runs in 8 batches of ~45

### Per-Card Requirements
Every card template needs all 6 before Supabase insert:
1. Base art (768×1024 WebP, fal.ai FLUX Dev, stored R2)
2. Card name (2–4 words, GPT-4o Mini)
3. Flavor text (1–2 sentences, under 120 chars, GPT-4o Mini)
4. Stat assignment (ATK, HP, CM cost 1–6, base instability 0–5, keywords 0–1 at Common, within PP budget)
5. Card type and effect (CREATURE/SPELL/STABILIZER)
6. Balance validation (PP check, stat range, instability coherence — all automated)

### Creature Distribution (per faction, 100 creatures)
| Instability | Count | Role |
|---|---|---|
| 0 | 5 | Pure stability |
| 1 | 25 | Order-friendly, HP-heavy |
| 2 | 30 | Balanced, flexible |
| 3 | 25 | Chaos-leaning, ATK-heavy |
| 4 | 10 | Glass cannon |
| 5 | 5 | Extreme chaos |

| CM Cost | Count | PP Budget | ATK Range | HP Range |
|---|---|---|---|---|
| 1 | 15 | 3 | 1–2 | 1–2 |
| 2 | 20 | 5 | 1–3 | 2–4 |
| 3 | 25 | 7 | 2–4 | 2–5 |
| 4 | 20 | 9 | 2–5 | 3–6 |
| 5 | 15 | 11 | 3–6 | 3–7 |
| 6 | 5 | 13 | 4–7 | 4–8 |

- ~40% of creatures have 1 keyword, 60% vanilla
- Spells: 17/faction; CM cost 1–6; effects scale with cost (deal 2 dmg → deal 4 to all)
- Faction stabilizers: 7/faction, CM 2–3, instability manipulation, designed manually before batch

### Pipeline Manifest Status Values
`pending` → `generating` → `qa_pass` / `qa_fail` → `approved` / `rejected` → `published`

### fal.ai Error Handling
Exponential backoff: initial 2s, doubles each retry, cap 32s, max 4 retries
- Code sample for `callFalWithRetry` exists in doc 05 section 2c

### OpenAI Batch API
- Use Batch API for >100 cards (50% cost reduction, no rate limits)
- Submit `.jsonl` to `POST https://api.openai.com/v1/batches`; results within 24h
- Code sample exists in doc 05 section 3b

### QA Automated Checks
PP validation, stat range checks, instability coherence, image size validation, name/flavor_text length; code samples in doc 05 section 4

### App Store Assets (Launch Checklist)
- App icon: 1024×1024, generated via fal.ai; prompt in doc 05 section 6
- Screenshots: automated via Xcode UI test (ScreenshotTests.swift)
- Privacy policy + ToS: static HTML on Cloudflare Pages (free)
- App Store description + keywords: generated via GPT-4o Mini; template in doc 05 section 6
- Age rating questionnaire answers in doc 05 section 6
- Privacy nutrition labels declarations in doc 05 section 6

### Budget Impact (doc 05)
- 358 base card images: ~$14.30 (avg $0.04/image)
- Testing/iteration (3× multiplier): ~$44
- Evolution testing (~200 evolutions): ~$10
- App icon + store assets: ~$2
- Text generation (358 cards): ~$0.04
- **Total AI spend for content: ~$71**

---

## DOC 06 — Technical Architecture
**Title:** Technical Architecture (System design, APIs, DB schemas, deployment)

### Key Decisions
- Railway game server is authoritative match engine (Node.js/TypeScript)
- Supabase Edge Functions handle REST API (collection, economy, evolution, matchmaking)
- Supabase Realtime (WebSocket channels) for match state broadcast to clients
- Apple Sign-In only (no Google Sign-In, iOS-only app)
- App Store Server Notifications V2 webhook for subscription lifecycle

### Infrastructure Stack (Final)
| Layer | Technology |
|---|---|
| Game Client | Swift/SwiftUI/SpriteKit, iOS 17+ |
| Auth | Supabase Auth, Apple Sign-In only |
| Database | Supabase PostgreSQL with RLS |
| Serverless API | Supabase Edge Functions (Deno/TypeScript) |
| Real-time | Supabase Realtime WebSocket channels |
| Game Server | Railway Node.js/TypeScript |
| Image Generation | fal.ai FLUX Kontext |
| Text Generation | OpenAI GPT-4o Mini |
| Card Art CDN | Cloudflare R2 |
| Analytics | PostHog |
| Payments | StoreKit 2 (native Apple) |
| App Distribution | Xcode Cloud + App Store Connect |
| Admin Dashboard | Node.js + Express + static HTML/JS on Railway |
| Legal Pages | Cloudflare Pages (free) |

### Budget Estimate
| Service | Monthly Cost | Build Phase | Notes |
|---|---|---|---|
| Supabase | $0–$25 | $25 | Free dev, Pro for launch |
| Railway | $5–$10 | $15 | Game server + admin |
| fal.ai | ~$0.02–$0.08/image | $80 | ~2000 generations budget |
| OpenAI | ~$0.0001/call | $2 | ~2000 calls |
| Cloudflare R2 | $0 | $0 | Free tier |
| PostHog | $0 | $0 | Free tier |
| Apple Developer | $99/year | $99 | Required |
| Cloudflare Pages | $0 | $0 | |
| Domain (optional) | ~$12/year | $12 | Custom CDN URL |
| **TOTAL** | | **~$233** | $67 buffer |

### Environment Variables
- Backend `.env`: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, FAL_KEY, OPENAI_API_KEY, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL, POSTHOG_API_KEY, ADMIN_PASSWORD, ADMIN_JWT_SECRET, GAME_SERVER_PORT, GAME_SERVER_SECRET, APP_STORE_KEY_ID, APP_STORE_ISSUER_ID, APP_STORE_PRIVATE_KEY_PATH, APP_STORE_BUNDLE_ID, APP_STORE_ENVIRONMENT
- iOS `Config.xcconfig` (gitignored): SUPABASE_URL, SUPABASE_ANON_KEY, R2_PUBLIC_URL, POSTHOG_API_KEY, POSTHOG_HOST

### Xcode Project Structure (Key Folders)
```
ChaosCreatures/
  App/                  — @main entry, AppState, AppRouter
  Config/               — Config.xcconfig (gitignored), Secrets.swift
  Services/             — SupabaseService, AuthService, CollectionService,
                          EconomyService, EvolutionService, MatchmakingService,
                          MatchService, ImageCacheService, StoreKitService, PostHogService
  Models/               — Player, CardTemplate, CardInstance, Deck, BattleCard,
                          GameState, MatchEvent, PlayerAction, EconomyConfig
  Views/                — Onboarding/, Home/, Collection/, Shop/, Battle/,
                          Evolution/, Profile/, Components/
  SpriteKit/            — Scenes/BattleScene, ChaosRollScene
                          Nodes/ (BoardNode, CreatureNode, HandNode, AvatarNode, etc.)
                          Actions/ (CardPlayAction, AttackAction, DamageAction, DeathAction, etc.)
  Extensions/           — Color+Theme, View+Loading
ChaosCreaturesTests/    — Unit tests
ChaosCreaturesUITests/  — UI tests including ScreenshotTests.swift
```

### SpriteKit Z-Position Layers (BattleScene)
0=Background, 10=Board slots, 20=Creatures, 30=Avatars+HP, 40=Mana, 50=Hand cards, 60=Phase+timer, 70=Damage numbers, 80=Event banner, 90=Chaos roll overlay, 100=UI buttons

### Supabase Realtime (Match Channel)
- Channel pattern: `match:{matchID}`
- Client subscribes and listens for `game_event` broadcast
- Client sends player actions via `player_action` broadcast
- Reconnection: exponential backoff with jitter, max 5 attempts, then `.failed` status

### Subscription Tier → DB Update
When StoreKit transaction is verified, Edge Function updates `players` table:
- `subscription_tier`: MID or HIGH
- `max_cards_per_faction`: HIGH=200, MID=100, FREE=50
- `max_deck_slots`: HIGH=10, MID=5, FREE=3

### App Store Server Notifications (Webhook)
- Edge Function: `/functions/v1/apple-notifications`
- Handles: SUBSCRIBED, DID_RENEW, DID_CHANGE_RENEWAL_STATUS, EXPIRED, DID_FAIL_TO_RENEW (7-day grace), REFUND, GRACE_PERIOD_EXPIRED
- `user_subscriptions` table schema and full Edge Function code in doc 06 section 2.4

### Key Code Samples (Location References)
- SupabaseService + AuthService (Swift): doc 06 section 2.2
- BattleScene (SpriteKit): doc 06 section 2.3 — full scene with all animations
- StoreKitService (Swift): doc 06 section 2.4
- Apple webhook Edge Function (TypeScript): doc 06 section 2.4
- MatchService Realtime channel (Swift): doc 06 section 2.5
- Image caching: doc 06 section 2.6

---

## DOC 07 — UI/UX Specifications
**Version:** 3.0 — Native iOS: Swift + SwiftUI + SpriteKit

### Key Decisions
- Dark theme default with faction-themed light accents
- Design philosophy: Balatro clarity + Marvel Snap speed + Slay the Spire readability
- All non-battle screens: SwiftUI
- Battle screen: SpriteKit inside a `.fullScreenCover` that hides the tab bar
- Tab bar is hidden during battle via `.toolbar(.hidden, for: .tabBar)`
- Every screen must have loading state, error state, and empty state — no blank screens

### Screen Inventory
**Tab Bar (5 tabs):** Home, Collection, Decks, Profile, Shop

**Battle Flow:** Mode Selection → Matchmaking → Battle (SKScene) → Post-Match Results

**Card Management:** Card Detail, Evolution Flow (full-screen sheet), Graveyard

**Secondary:** Settings, Achievements, Battle Log (SKScene overlay), Onboarding

### Navigation Principles
- `NavigationStack` for all stack-based flows
- `.sheet()` and `.fullScreenCover()` for modals
- `BattleView` is `.fullScreenCover` (hides tab bar completely)
- Deep links via `NavigationPath` binding at root `NavigationStack`
- No custom back navigation logic — use SwiftUI built-in

### Battlefield Layout (390pt iPhone 15 Pro reference)
```
OpponentHUDView (SwiftUI overlay): 68pt
  [Avatar 48x48] [Name] [HPBar] [Instability] [HandCount] [DeckCount] [ManaRow x10]
SpriteKit SKView (fills remaining space)
  Opponent board: 5 slots
  CenterZone: D20Node, PhaseIndicatorNode, EventOverlayNode
  Player board: 5 slots
PlayerHUDView (SwiftUI overlay): 60pt
  [Avatar 48x48] [Name] [HPBar] [Instability] [TimerBar]
HandScrollView (SwiftUI overlay): 132pt
  Horizontal scroll of CardInHandView
BottomControlsView (SwiftUI overlay): 56pt
  [ManaDisplay] [BattleLogButton] [EndTurnButton]
```

### Component Specs
- **AvatarView:** `AsyncImage` 48×48pt, 3pt faction-color border, tap→GraveyardSheet
- **HPBarView:** Color thresholds: >60% green (#4CAF50), >30% yellow (#FFC107), ≤30% red (#F44336); damage flash + shake animation on HP change
- **InstabilityView:** 18pt bold; white normally; red (#E63946) if ≥15; blue (#5BC0EB) if ≤4
- **ManaRowView:** 10 circles, 20pt diameter, 3pt spacing; filled=faction accent, empty=#2A2A2A
- **TimerBarView:** 60–16s = blue (#4A90E2); 15–0s = red (#E63946) with pulse animation; 15s threshold triggers `UIImpactFeedbackGenerator`
- **EndTurnButton:** 100×44pt, hold 0.4s if `confirmBeforeEndTurn` setting active; green (#1A6A3A) when no actions remain
- Background color: `#141414` for HUD bars, `#1A1A1A` for empty elements, `#2A2A2A` for inactive elements

### Admin Dashboard (Part B)
- Framework: Next.js (TypeScript) on Railway
- Auth: Supabase Auth (email/password, single owner account)
- Custom screens (4-5): batch generation trigger + review gallery, economy config editor, PostHog analytics embed, season management, balance simulation
- Player lookup, match history, auth management (ban/unban), direct data fixes → Supabase Dashboard (built-in, no custom UI)
- Full Admin Dashboard specs in doc 07 Part B (screens, components, layout)

### Key Code Samples (Location References)
- Full ZStack battlefield layout (Swift): doc 07 section 3.1
- HPBarView with animation (Swift): doc 07 section 3.2
- TimerBarView (Swift): doc 07 section 3.2
- EndTurnButton (Swift): doc 07 section 3.2
- Evolution flow screens: doc 07 section 5
- Card detail view: doc 07 section 6
- Onboarding screens: doc 07 section 8
- Collection/deck builder screens: doc 07 sections 9–10
- Admin Dashboard screens: doc 07 Part B

---

## DOC 08 — Audio Design
**Platform:** iOS 17+, Swift/AVFoundation/SpriteKit. No external audio SDK.

### Key Decisions
- `AVAudioEngine` + `AVAudioPlayerNode` for adaptive battle music (instability-responsive crossfading)
- `AVAudioPlayer` for menu music, shop ambient, evolution ceremony
- `SKAction.playSoundFileNamed` for battle SFX triggered inside SpriteKit
- Music format: **CAF** (zero-gap looping, 44.1 kHz stereo)
- Long ambient: **AAC 128 kbps** (smaller file size for backgrounds)
- SFX format: **CAF** (lowest iOS latency)
- Latency target: <20ms for gameplay SFX

### Audio File Budget
| Category | Size |
|---|---|
| Music (CAF) | ~18 MB |
| SFX (CAF) | ~3 MB |
| Ambient (AAC) | ~2 MB |
| **Total** | **~23 MB** |

### Volume Defaults
- Master: 100%, Music: 60%, SFX: 80%
- Max concurrent channels: 16 (8 SFX + 4 music layers + 2 ambient + 2 OS reserved)

### Faction Sonic Identities
| Faction | Sonic Palette | Tempo | Mode |
|---|---|---|---|
| Ironwright | Brass, mechanical percussion, steam vents | 90–110 BPM | Minor/industrial |
| Fey Courts | Woodwinds, Celtic harp, bowed strings, crystal chimes | 70–85 BPM | Dorian/Lydian |
| Demonic Kingdoms | Deep brass, war drums, throat singing, fire crackle | 100–120 BPM | Phrygian |

### Music Tracks
| Context | Track | Tempo | Length | Adaptive | Format |
|---|---|---|---|---|---|
| Main Menu/Home | Planes of Chaos Theme | 75 BPM | 2:30 loop | No | CAF ~2.5 MB |
| Battle | 6-stem faction layers | 95 BPM | 2:00 loop each | Yes (AVAudioEngine) | CAF ~12 MB total |
| Evolution Ceremony | Transformation Ritual | Variable | 1:10 one-shot | Faction+outcome | CAF ~1.5 MB |
| Shop/Collection | Calm Ambient | 60 BPM | 3:00 loop | No | AAC ~2 MB |

### Battle Music Adaptive System (4-stem architecture)
1. Foundation layer: bass + minimal percussion (always full volume, faction-neutral)
2. Player faction layer: player's faction instrumentation
3. Opponent faction layer: opponent's faction instrumentation
4. Intensity layer: two parallel stems (Order.caf = consonant, Chaos.caf = dissonant), crossfaded by instability

**Intensity volume by board state:**
- 0–2 creatures: 20% | 3–5: 50% | 6–8: 80% | 9–10: 100%

**Instability → harmonic treatment:**
- 1–6 (Order zone): consonant, major/Dorian
- 7–13 (Hybrid): neutral mix
- 14–20 (Chaos zone): dissonant, tremolo, atonal stabs

### SFX Inventory (Key Events)
All SFX have faction variations for card play, creature attack, creature death:
- Ironwright: metallic click/gear turn, piston thrust, metal collapse
- Fey Courts: harp glissando/leaf rustle, wind gust/chime, fading harp/nature sigh
- Demonic Kingdoms: bone crack/growl, war drum/roar, obsidian shatter/chant

Universal SFX: card draw, mana gain/spend, avatar damage, heal, turn transition, timer warning, surrender

**Total SFX budget: ~3 MB (~40 files)**

### Evolution Ceremony Audio (3 phases)
1. Energy Buildup (0:00–0:20): ambient drone, rising synth, crackling energy, heartbeat percussion
2. Transformation (0:20–0:40): shard crack SFX, energy whoosh, choir swell, faction flavor (brass/harp/war drum)
3. Reveal (0:40–1:10): triumphant fanfare; Order=bright major chord+chimes; Chaos=dissonant resolution+distortion

**Implementation:** `AVAudioPlayer`, non-looping. Player can skip (tap) — 2-second fade-out via `setVolume(0, fadeDuration: 2.0)`.

### Audio Asset Sourcing (Free/AI)
- Music: Suno AI (generate with BPM-specific prompts), export WAV, convert to CAF: `afconvert -f caff -d LEI16 input.wav output.caf` (free macOS built-in)
- Trim to clean loop in Audacity (free)
- SFX: Freesound.org (CC0 license) or Suno/ElevenLabs sound effects

### Budget Impact (doc 08)
- $0 for audio pipeline (all free tools + AI generators)
- No external audio SDK or paid library

---

## DOC 09 — Monetization Details
**Version:** code-ready | Payments: StoreKit 2 only

### Key Decisions
- No real money on individual cards; no randomized pack gambling
- No RevenueCat, no Stripe; StoreKit 2 only (free Apple framework, $0 cost)
- Subscription value = evolution depth (modifier choices) + speed + art quality
- Server-side receipt validation via App Store Server API v2 (not local validation)
- App Store Server Notifications V2 for subscription lifecycle events

### Subscription Tiers
| Tier | Monthly | Annual | Key Benefits |
|---|---|---|---|
| Free | $0 | $0 | 2 modifier choices at evolution, 768×1024 art, 50 cards/faction, 3 deck slots |
| Mid | $6.99/mo | $55.99/yr | 3 modifier choices, 1024×1024 art, 100 cards/faction, 5 deck slots, 1.5× quest dust |
| Top | $12.99/mo | $99.99/yr | 4 modifier choices, 1024×1024 + 2-pass art, 200 cards/faction, 10 deck slots, 2× quest dust, 1 Legendary shard/month |

### IAP Product IDs (Full List)
| Product | Product ID | Type | Price |
|---|---|---|---|
| Mid Monthly | `com.chaoscreatures.app.sub_mid_monthly_699` | Auto-renewable | $6.99/mo |
| Mid Annual | `com.chaoscreatures.app.sub_mid_annual_5599` | Auto-renewable | $55.99/yr |
| High Monthly | `com.chaoscreatures.app.sub_high_monthly_1299` | Auto-renewable | $12.99/mo |
| High Annual | `com.chaoscreatures.app.sub_high_annual_9999` | Auto-renewable | $99.99/yr |
| Battle Pass | `com.chaoscreatures.app.iap_battlepass_999` | Non-consumable | $9.99 |
| Card Back — Standard | `com.chaoscreatures.app.iap_cardback_std_199` | Non-consumable | $1.99 |
| Card Back — Legendary | `com.chaoscreatures.app.iap_cardback_leg_299` | Non-consumable | $2.99 |
| Card Back Bundle (3x) | `com.chaoscreatures.app.iap_cardback_bundle_499` | Non-consumable | $4.99 |
| Board Skin — Standard | `com.chaoscreatures.app.iap_board_std_299` | Non-consumable | $2.99 |
| Board Skin — Legendary | `com.chaoscreatures.app.iap_board_leg_399` | Non-consumable | $3.99 |
| Board Bundle (3x faction) | `com.chaoscreatures.app.iap_board_bundle_799` | Non-consumable | $7.99 |
| Avatar Frame — Standard | `com.chaoscreatures.app.iap_frame_std_199` | Non-consumable | $1.99 |
| Avatar Frame — Legendary | `com.chaoscreatures.app.iap_frame_leg_299` | Non-consumable | $2.99 |
| Card Reveal — Fire/Frost/Lightning/Shadow/Radiant/Void | `com.chaoscreatures.app.iap_reveal_{type}_199` | Non-consumable | $1.99 each |

### StoreKit 2 Implementation
- `EntitlementManager` uses `Transaction.currentEntitlements` (reliable across reinstalls, family sharing)
- `Transaction.updates` async sequence handles real-time renewals/cancellations
- After purchase: call Supabase Edge Function `/functions/v1/sync-entitlements` to update `user_subscriptions` table
- Products declared in `Products.storekit` file (Xcode StoreKit Configuration) for Simulator testing
- All product IDs in `ProductCatalog.swift` enum to avoid magic strings
- Bundle ID: `com.chaoscreatures.app`
- Full EntitlementManager.swift code: doc 09 section 2
- Full StoreService.swift code: doc 09 section 2
- sync-entitlements Edge Function (TypeScript): doc 09 section 2c
- apple-notifications Edge Function: doc 09 section 2d

### Subscription State Schema
```sql
CREATE TABLE user_subscriptions (
  user_id uuid REFERENCES auth.users PRIMARY KEY,
  tier text NOT NULL DEFAULT 'FREE' CHECK (tier IN ('FREE', 'MID', 'HIGH')),
  cancel_at_period_end boolean DEFAULT false,
  grace_period_until timestamptz,
  ...
)
```

### Paywall/Conversion Design
- Conversion trigger: evolution ceremony moment (player about to evolve to Epic → sees "get 4 choices")
- Paywall screen shown inline at modifier picker when player would benefit from upgrade
- Free trial: not offered at launch (subscription value is immediately apparent)
- Annual plan promoted as default (saves 33–36% vs monthly)

### App Store Requirements
- Bundle ID: `com.chaoscreatures.app`
- Subscription group name: "Chaos Creatures Pro" (one group for all subscription tiers)
- Required: "Restore Purchases" button in Settings screen (App Store guideline)
- Server Notifications V2 URL: `https://<supabase-project>.supabase.co/functions/v1/apple-notifications`

### Budget Impact (doc 09)
- StoreKit 2: $0 (free Apple framework)
- Apple Developer Program: $99/year (already in base budget)
- App Store commission: 30% on subscriptions year 1, 15% year 2+ (Small Business Program)
- No payment processing fees outside App Store

---

## Cross-Doc Numbers Quick Reference

### Evolution
- Energy thresholds: 15 / 30 / 50 / 75 (cumulative: 15 / 45 / 95 / 170)
- Earn: Win=+2, Loss=+1 (per card, all 20 deck cards simultaneously)
- Full path Legendary: 170 total energy = ~113 games at 50% WR

### Economy
- Dust/game: Win=15, Loss=5
- Quest dust: Easy=20, Med=30, Hard=45 (base, FREE tier)
- Shard costs: Uncommon=30, Rare=60, Epic=120, Legendary=240 Dust
- Full card evolution (Common→Legendary): 450 Dust in shards
- Full deck Legendary (20 cards): 9,000 Dust
- Starter package: 200 Dust + 3 Uncommon + 1 Rare + 1 Legendary shard

### Collection Caps
- Free: 50 cards/faction, 3 deck slots
- Mid: 100 cards/faction, 6 deck slots
- High: 200 cards/faction, 10 deck slots

### Content
- Launch cards: 358 total (300 creatures + 51 spells + 7 universal stabilizers, no faction-specific stabilizers)
- Instability range: 0–5 base (creatures), 1–20 board total (clamped)
- CM cost range: 1–6 for creatures and spells
- Board size: 5 slots per player (10 total)

### Subscriptions
- Mid: $6.99/mo or $55.99/yr | Top: $12.99/mo or $99.99/yr
- Quest dust multiplier: Free=1×, Mid=1.5×, Top=2×
- Top gets: 1 free Legendary shard/month (via pg_cron on 1st of month)

### Infrastructure Costs
- Total build-to-launch: ~$233 of $300 budget (~$67 buffer)
- AI content generation: ~$71 (images $14.68 + testing ~$44 + evolutions $10 + assets $2)
- Apple Developer: $99/year (mandatory)

### Audio
- Total audio package: ~23 MB (18 MB music CAF + 3 MB SFX CAF + 2 MB ambient AAC)
- Battle music: 6 stems at 95 BPM, 32-bar loops (~2:00 each)
- Evolution ceremony: 1:10 one-shot, non-looping

### Art
- Base card art: 768×1024 WebP (Free/all base cards)
- Mid/Top evolution art: 1024×1024 WebP
- STYLE_ANCHOR: prepended to every single image prompt (locked string, do not modify)

---

## What The PRD Must Cover (Checklist)

From docs 03–09, the PRD (10-prd.md) must formally specify these systems as requirements:

1. **AI Generation Pipeline** (doc 03): Style anchor, faction prefixes, modifier pools, evolution img2img flow, server-side-only generation
2. **Progression System** (doc 04): Energy earn rates, evolution thresholds, Legendary timeline, all dust earning/spending values
3. **Economy** (doc 04): Dust economy, shard costs, collection caps, quest system (daily+weekly+onboarding), rank ladder
4. **Content Pipeline** (doc 05): Batch generation tool, manifest-based resumable pipeline, review gallery, QA automation, App Store asset generation
5. **Technical Architecture** (doc 06): All service integrations, Xcode project structure, auth flow, Realtime match channels, StoreKit 2 subscription sync, budget breakdown
6. **UI/UX** (doc 07): All screens (listed), navigation map, battlefield layout, component specs, animation requirements for every key interaction, admin dashboard
7. **Audio** (doc 08): Adaptive battle music system, faction audio identities, SFX inventory, evolution ceremony audio, all file formats and sizes, sourcing approach
8. **Monetization** (doc 09): StoreKit 2 only, all product IDs, subscription tier benefits, receipt validation flow, App Store Notifications webhook, paywall design

**Do not contradict protected files:** CLAUDE.md, 00-game-design-master.md, 01-battle-mechanics.md, 02-card-data-model.md

---

*Generated: 2026-02-16. Condensed from docs 03–09 for PRD writer context efficiency.*
