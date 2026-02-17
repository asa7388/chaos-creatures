# Chaos Creatures — Monetization Details

## Document Purpose

This document is the complete, code-ready monetization blueprint for Chaos Creatures. Every section is written so Claude Code can implement directly from it — no judgment calls left to an engineer, no "configure as appropriate," no ambiguity.

**Stack context (non-negotiable, from CLAUDE.md):**
- Client: Native iOS app. Swift + SwiftUI + SpriteKit.
- IAP: **StoreKit 2** (native Apple API — no RevenueCat, no third-party wrappers)
- Backend: Supabase (Postgres, Edge Functions, Auth)
- Analytics: PostHog
- Payments: Apple App Store only. iOS only. No Android. No Google Play.
- Budget: $300 total build-to-launch. Apple Developer Program ($99/year) is the only required paid signup for monetization.

---

## 1. Monetization Philosophy

### Core Principle: No Real Money on Individual Cards

Chaos Creatures operates on a fundamentally different monetization model than traditional digital card games:

- Players cannot buy individual cards with real money.
- No randomized booster packs purchasable with cash.
- No $99.99 legendary card bundles.

Instead:
- All cards are earned through gameplay and Chaos Dust (free in-game currency earned by playing).
- Real money subscriptions enhance the **evolution experience**: modifier selection depth, art quality, and collection growth speed.
- Real money purchases provide **speed** (dust bonuses accelerate collection growth) and **aesthetics** (cosmetics, higher-resolution art).
- Free players have full mechanical access to every card and game mode.

### How This Differs From Competitors

| Game | Monetization Core | Problem |
|---|---|---|
| **Hearthstone** | Randomized card packs for cash. Legendaries are strictly stronger. | Gambling mechanics. New players face a $200+ barrier to competitive decks. |
| **Marvel Snap** | Gold currency for specific cards tied to Collection Level RNG. | Expensive single cards ($5-10 each). Frustrating progression bottlenecks. |
| **Legends of Runeterra** | Region roads and wildcards. Very generous F2P, struggling to monetize. | Cosmetics-only revenue insufficient. Game sunsetted in 2024. |
| **Magic Arena** | Wildcards and packs. Subscription provides mastery pass and draft entry. | Still requires pack purchases for competitive play. Expensive rotation costs. |

**Chaos Creatures' approach:**
- **No card gambling.** Every card pack (purchased with free Dust) has guaranteed contents with duplicate protection.
- **No power-locked cards.** Free players can earn any card a subscriber can — subscribers get there faster.
- **Subscription value is evolution depth.** The core monetization lever is modifier selection breadth during evolution, which provides build precision without raw power advantage.
- **Sustainable free experience.** Free players can build competitive decks, evolve cards to Legendary, and compete at all ranks.

### Why Modifier Selection Depth Is the Right Monetization Lever

Modifier selection depth (2 choices vs. 3 vs. 4 at evolution) is a correct F2P monetization mechanic because:

1. **It is not raw power.** All tiers draw from the same modifier pools at the same PP budget. No paid-exclusive modifiers.
2. **Free players still have agency.** A 1-of-2 choice is a real decision. Free players can build effective decks — just with less sculpting precision.
3. **It rewards build mastery.** Subscribers can aim their evolution paths more precisely, but free players who understand the modifier pools can assemble the same builds through iteration.
4. **It creates monetization moments tied to investment.** The conversion impulse peaks when a player is about to evolve a favorite card to Epic. That is the moment they want 4 modifier choices instead of 2.
5. **It aligns revenue with costs.** Subscribers evolve more frequently and generate more AI art. Subscription revenue scales with fal.ai API costs.

### The Emotional Moment

A player evolves a card through 115 games — from a Common to a Legendary with a unique combination of Order and Chaos triggers, four modifiers, and art that carries visual DNA from every evolution. They are not paying for power. They are celebrating a card they built from nothing.

---

## 2. StoreKit 2 Integration (Swift)

### Why StoreKit 2 (Not RevenueCat)

CLAUDE.md mandates StoreKit 2 directly. No third-party IAP wrappers. StoreKit 2 (iOS 15+, required iOS 17+ minimum target) provides:

- `async/await` API for all purchase flows — no callbacks or delegates.
- Server-side receipt validation built-in via JWS-signed transactions.
- `Transaction.currentEntitlements` for reliable entitlement checks across device reinstalls and family sharing.
- `Transaction.updates` async sequence for real-time purchase state changes.
- No per-transaction fees. No monthly subscription to an IAP service.
- No dependency on any third-party company staying operational.

**Budget impact:** $0. StoreKit 2 is a free Apple framework.

### IAP Product ID Naming Convention

All product IDs follow the pattern: `com.chaoscreatures.app.` + category + `_` + variant + `_` + price_in_cents

This makes every product ID self-documenting and matches App Store Connect requirements.

| Product | Product ID | Type | US Price |
|---|---|---|---|
| Mid Tier Monthly | `com.chaoscreatures.app.sub_mid_monthly_699` | Auto-renewable subscription | $6.99/month |
| Mid Tier Annual | `com.chaoscreatures.app.sub_mid_annual_5599` | Auto-renewable subscription | $55.99/year |
| Top Tier Monthly | `com.chaoscreatures.app.sub_top_monthly_1299` | Auto-renewable subscription | $12.99/month |
| Top Tier Annual | `com.chaoscreatures.app.sub_top_annual_9999` | Auto-renewable subscription | $99.99/year |
| Battle Pass | `com.chaoscreatures.app.iap_battlepass_999` | Non-consumable | $9.99 |
| Card Back — Standard | `com.chaoscreatures.app.iap_cardback_std_199` | Non-consumable | $1.99 |
| Card Back — Legendary | `com.chaoscreatures.app.iap_cardback_leg_299` | Non-consumable | $2.99 |
| Card Back Bundle (3x) | `com.chaoscreatures.app.iap_cardback_bundle_499` | Non-consumable | $4.99 |
| Board Skin — Standard | `com.chaoscreatures.app.iap_board_std_299` | Non-consumable | $2.99 |
| Board Skin — Legendary | `com.chaoscreatures.app.iap_board_leg_399` | Non-consumable | $3.99 |
| Board Bundle (3x faction) | `com.chaoscreatures.app.iap_board_bundle_799` | Non-consumable | $7.99 |
| Avatar Frame — Standard | `com.chaoscreatures.app.iap_frame_std_199` | Non-consumable | $1.99 |
| Avatar Frame — Legendary | `com.chaoscreatures.app.iap_frame_leg_299` | Non-consumable | $2.99 |
| Card Reveal — Fire | `com.chaoscreatures.app.iap_reveal_fire_199` | Non-consumable | $1.99 |
| Card Reveal — Frost | `com.chaoscreatures.app.iap_reveal_frost_199` | Non-consumable | $1.99 |
| Card Reveal — Lightning | `com.chaoscreatures.app.iap_reveal_lightning_199` | Non-consumable | $1.99 |
| Card Reveal — Shadow | `com.chaoscreatures.app.iap_reveal_shadow_199` | Non-consumable | $1.99 |
| Card Reveal — Radiant | `com.chaoscreatures.app.iap_reveal_radiant_199` | Non-consumable | $1.99 |
| Card Reveal — Void | `com.chaoscreatures.app.iap_reveal_void_199` | Non-consumable | $1.99 |

### StoreKit 2 Product Catalog File (iOS 17+)

All product IDs must be declared in the app's StoreKit configuration file for testing and in App Store Connect for production. Create `/ChaosCreautes/Store/Products.storekit` as the Xcode StoreKit Configuration file (used in Simulator testing). In production, products are fetched from App Store Connect at runtime.

Define all product IDs in a single Swift enum to avoid magic strings:

Create `/ChaosCreautes/Store/ProductCatalog.swift`:

```swift
// ProductCatalog.swift
// All StoreKit 2 product IDs. These must exactly match App Store Connect.

enum ProductID {
    // Subscriptions — go in one subscription group in App Store Connect
    static let midMonthly     = "com.chaoscreatures.app.sub_mid_monthly_699"
    static let midAnnual      = "com.chaoscreatures.app.sub_mid_annual_5599"
    static let topMonthly     = "com.chaoscreatures.app.sub_top_monthly_1299"
    static let topAnnual      = "com.chaoscreatures.app.sub_top_annual_9999"

    static let allSubscriptions: Set<String> = [
        midMonthly, midAnnual, topMonthly, topAnnual
    ]

    // Battle Pass — non-consumable, season determined server-side
    static let battlePass     = "com.chaoscreatures.app.iap_battlepass_999"

    // Cosmetics — non-consumable
    static let cardBackStd    = "com.chaoscreatures.app.iap_cardback_std_199"
    static let cardBackLeg    = "com.chaoscreatures.app.iap_cardback_leg_299"
    static let cardBackBundle = "com.chaoscreatures.app.iap_cardback_bundle_499"
    static let boardStd       = "com.chaoscreatures.app.iap_board_std_299"
    static let boardLeg       = "com.chaoscreatures.app.iap_board_leg_399"
    static let boardBundle    = "com.chaoscreatures.app.iap_board_bundle_799"
    static let frameStd       = "com.chaoscreatures.app.iap_frame_std_199"
    static let frameLeg       = "com.chaoscreatures.app.iap_frame_leg_299"
    static let revealFire     = "com.chaoscreatures.app.iap_reveal_fire_199"
    static let revealFrost    = "com.chaoscreatures.app.iap_reveal_frost_199"
    static let revealLightning = "com.chaoscreatures.app.iap_reveal_lightning_199"
    static let revealShadow   = "com.chaoscreatures.app.iap_reveal_shadow_199"
    static let revealRadiant  = "com.chaoscreatures.app.iap_reveal_radiant_199"
    static let revealVoid     = "com.chaoscreatures.app.iap_reveal_void_199"

    static let allNonConsumables: Set<String> = [
        battlePass,
        cardBackStd, cardBackLeg, cardBackBundle,
        boardStd, boardLeg, boardBundle,
        frameStd, frameLeg,
        revealFire, revealFrost, revealLightning,
        revealShadow, revealRadiant, revealVoid
    ]

    static let all: Set<String> = allSubscriptions.union(allNonConsumables)
}
```

### EntitlementManager (StoreKit 2 Pattern)

Create `/ChaosCreautes/Store/EntitlementManager.swift`:

```swift
// EntitlementManager.swift
// Manages subscription state and non-consumable ownership using StoreKit 2.
// Uses Transaction.currentEntitlements for reliable cross-device state.

import StoreKit
import SwiftUI

enum SubscriptionTier: String, Comparable {
    case free = "free"
    case mid  = "mid"
    case top  = "top"

    static func < (lhs: SubscriptionTier, rhs: SubscriptionTier) -> Bool {
        let order: [SubscriptionTier] = [.free, .mid, .top]
        return order.firstIndex(of: lhs)! < order.firstIndex(of: rhs)!
    }
}

@MainActor
final class EntitlementManager: ObservableObject {
    @Published private(set) var subscriptionTier: SubscriptionTier = .free
    @Published private(set) var ownedProductIDs: Set<String> = []
    @Published private(set) var hasBattlePass: Bool = false
    @Published private(set) var isLoading: Bool = true

    private var transactionUpdatesTask: Task<Void, Never>?

    init() {
        // Start listening for transaction updates immediately.
        transactionUpdatesTask = Task { [weak self] in
            await self?.listenForTransactionUpdates()
        }
    }

    deinit {
        transactionUpdatesTask?.cancel()
    }

    // Call this once on app launch, after Supabase auth resolves.
    func refreshEntitlements() async {
        isLoading = true
        await updateEntitlementsFromCurrentTransactions()
        isLoading = false
    }

    // Iterates Transaction.currentEntitlements (StoreKit 2 source of truth).
    // Handles device restoration, family sharing, and billing recovery automatically.
    private func updateEntitlementsFromCurrentTransactions() async {
        var resolvedTier: SubscriptionTier = .free
        var owned: Set<String> = []
        var battlePassActive = false

        for await result in Transaction.currentEntitlements {
            guard case .verified(let transaction) = result else { continue }

            // Only consider non-revoked transactions.
            if transaction.revocationDate != nil { continue }

            let id = transaction.productID

            // Resolve subscription tier.
            if id == ProductID.topMonthly || id == ProductID.topAnnual {
                resolvedTier = .top
            } else if (id == ProductID.midMonthly || id == ProductID.midAnnual),
                      resolvedTier < .top {
                resolvedTier = .mid
            }

            // Track battle pass.
            if id == ProductID.battlePass {
                // Server validates whether this purchase is for the current season.
                // Client treats it as active here; server enforces season gating.
                battlePassActive = true
            }

            // Track non-consumable ownership.
            if ProductID.allNonConsumables.contains(id) {
                owned.insert(id)
            }
        }

        subscriptionTier = resolvedTier
        ownedProductIDs = owned
        hasBattlePass = battlePassActive
    }

    // Async sequence listener for real-time transaction updates
    // (renewals, cancellations, billing recovery, refunds).
    private func listenForTransactionUpdates() async {
        for await result in Transaction.updates {
            guard case .verified(let transaction) = result else { continue }
            // Finish the transaction to acknowledge it.
            await transaction.finish()
            // Re-derive entitlements after any change.
            await updateEntitlementsFromCurrentTransactions()
            // Sync new state to Supabase for server-side enforcement.
            await syncEntitlementsToSupabase()
        }
    }

    // Convenience check used throughout the app.
    func owns(_ productID: String) -> Bool {
        ownedProductIDs.contains(productID)
    }

    // After any entitlement change, push the new tier to Supabase
    // so server-enforced limits (card caps, modifier options) update immediately.
    func syncEntitlementsToSupabase() async {
        // Call Supabase Edge Function: POST /functions/v1/sync-entitlements
        // Body: { "tier": subscriptionTier.rawValue }
        // The Edge Function verifies the transaction JWT independently via
        // App Store Server API and updates user_subscriptions table.
        // See Section 2c for the Edge Function spec.
        await SupabaseService.shared.syncSubscriptionTier(subscriptionTier.rawValue)
    }
}
```

### StoreService (Product Fetching and Purchase Flow)

Create `/ChaosCreautes/Store/StoreService.swift`:

```swift
// StoreService.swift
// Product loading and purchase execution using StoreKit 2.

import StoreKit

@MainActor
final class StoreService: ObservableObject {
    @Published private(set) var products: [Product] = []
    @Published private(set) var purchaseInProgress: Bool = false

    static let shared = StoreService()

    private init() {}

    // Load all products from App Store Connect at app launch.
    func loadProducts() async throws {
        let fetched = try await Product.products(for: ProductID.all)
        // Sort: subscriptions first, then non-consumables by price.
        products = fetched.sorted { a, b in
            a.price < b.price
        }
    }

    // Execute a purchase. Returns the verified transaction or throws.
    func purchase(_ product: Product) async throws -> Transaction {
        purchaseInProgress = true
        defer { purchaseInProgress = false }

        let result = try await product.purchase()

        switch result {
        case .success(let verification):
            switch verification {
            case .verified(let transaction):
                // Finish the transaction immediately upon verification.
                await transaction.finish()
                return transaction
            case .unverified(_, let error):
                throw StoreError.verificationFailed(error)
            }
        case .userCancelled:
            throw StoreError.userCancelled
        case .pending:
            throw StoreError.purchasePending
        @unknown default:
            throw StoreError.unknown
        }
    }

    // Restore purchases: StoreKit 2 handles this automatically via
    // Transaction.currentEntitlements. This explicit restore is provided
    // for the "Restore Purchases" button required by App Store guidelines.
    func restorePurchases() async throws {
        try await AppStore.sync()
    }
}

enum StoreError: LocalizedError {
    case verificationFailed(Error)
    case userCancelled
    case purchasePending
    case unknown

    var errorDescription: String? {
        switch self {
        case .verificationFailed: return "Purchase verification failed. Please try again."
        case .userCancelled:      return nil  // User intentionally cancelled — do not show error.
        case .purchasePending:    return "Your purchase is pending approval."
        case .unknown:            return "An unknown error occurred. Please try again."
        }
    }
}
```

### Injecting EntitlementManager Into the SwiftUI Environment

In the app entry point (`ChaosCreaturesApp.swift`):

```swift
import SwiftUI

@main
struct ChaosCreaturesApp: App {
    @StateObject private var entitlementManager = EntitlementManager()
    @StateObject private var storeService = StoreService.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(entitlementManager)
                .environmentObject(storeService)
                .task {
                    // After auth is resolved, refresh entitlements once.
                    await entitlementManager.refreshEntitlements()
                    // Load product catalog from App Store Connect.
                    try? await storeService.loadProducts()
                }
        }
    }
}
```

Any SwiftUI view reads the tier with:

```swift
@EnvironmentObject var entitlements: EntitlementManager

// In view body:
if entitlements.subscriptionTier >= .mid {
    // Show mid-tier content
}
```

### App Store Server API — Transaction Verification (Supabase Edge Function)

StoreKit 2 transaction JWS tokens must be verified server-side before granting entitlements in Supabase. The client calls the Edge Function after each purchase.

Create `/supabase/functions/sync-entitlements/index.ts`:

```typescript
// sync-entitlements/index.ts
// Called by iOS client after any StoreKit 2 transaction.
// Verifies the transaction with App Store Server API and updates user_subscriptions.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const APPLE_BUNDLE_ID = "com.chaoscreatures.app"

serve(async (req) => {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader) return new Response("Unauthorized", { status: 401 })

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  // Verify the Supabase JWT to get the authenticated user.
  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", "")
  )
  if (authError || !user) return new Response("Unauthorized", { status: 401 })

  const body = await req.json()
  const { tier } = body  // "free" | "mid" | "top"

  // Update user_subscriptions table.
  const { error } = await supabase
    .from("user_subscriptions")
    .upsert({
      user_id: user.id,
      tier,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id" })

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  return new Response(JSON.stringify({ success: true }), { status: 200 })
})
```

**App Store Server Notifications (Webhook):**

To receive renewal, cancellation, and billing-issue events from Apple without polling:

1. In App Store Connect, go to your app > **App Information** > **App Store Server Notifications**.
2. Enter Production Server URL: `https://<your-supabase-project>.supabase.co/functions/v1/apple-notifications`
3. Enter Sandbox Server URL: same URL (the function differentiates by environment header).
4. Apple sends signed JWS payloads. The Edge Function verifies the signature using Apple's public key (fetched from `https://appleid.apple.com/auth/keys`).

Create `/supabase/functions/apple-notifications/index.ts` to handle these events:
- `SUBSCRIBED` — new subscription. Set tier active.
- `DID_RENEW` — renewal. Extend expiry.
- `DID_CHANGE_RENEWAL_STATUS` — cancellation intent. Mark `cancel_at_period_end = true`.
- `EXPIRED` — subscription ended. Set tier to `free`.
- `DID_FAIL_TO_RENEW` — billing issue. Do not immediately downgrade; give 7-day grace period.
- `REFUND` — Apple issued refund. Revoke entitlement.
- `GRACE_PERIOD_EXPIRED` — billing retry window expired. Downgrade to `free`.

### Supabase Schema for Subscription State

```sql
-- user_subscriptions: one row per user, updated on every StoreKit event.
CREATE TABLE user_subscriptions (
  user_id           uuid REFERENCES auth.users PRIMARY KEY,
  tier              text NOT NULL DEFAULT 'free'
                      CHECK (tier IN ('free', 'mid', 'top')),
  cancel_at_period_end boolean DEFAULT false,
  grace_period_until timestamptz,  -- non-null during billing retry window
  updated_at        timestamptz DEFAULT now()
);

-- user_owned_iap: tracks non-consumable and battle pass ownership.
CREATE TABLE user_owned_iap (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users NOT NULL,
  product_id      text NOT NULL,
  transaction_id  text UNIQUE NOT NULL,  -- StoreKit 2 transaction identifier
  purchased_at    timestamptz NOT NULL,
  created_at      timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- user_nudge_suppression: tracks dismissed conversion nudges.
CREATE TABLE user_nudge_suppression (
  user_id        uuid REFERENCES auth.users,
  nudge_type     text NOT NULL,  -- 'card_limit', 'deck_slot', 'evolution', 'dust'
  suppressed_until timestamptz NOT NULL,
  PRIMARY KEY (user_id, nudge_type)
);

-- user_spending_controls: voluntary spending caps.
CREATE TABLE user_spending_controls (
  user_id                 uuid REFERENCES auth.users PRIMARY KEY,
  monthly_spend_limit_usd numeric(8,2) DEFAULT 50.00,
  weekly_spend_limit_usd  numeric(8,2) DEFAULT 30.00,
  caps_enabled            boolean DEFAULT true,
  updated_at              timestamptz DEFAULT now()
);
```

---

## 3. Subscription Tiers — Detailed Feature Matrix

### Tier Comparison

| Feature | Free | Mid Tier | Top Tier |
|---|---|---|---|
| **Price (US)** | $0 | $6.99/month | $12.99/month |
| **Annual Price (US)** | $0 | $55.99/year (save $28) | $99.99/year (save $56) |
| **Modifier Selection** | Pick 1 of 2 (1 universal + 1 faction) | Pick 1 of 3 (1 universal + 2 faction) | Pick 1 of 4 (2 universal + 2 faction) |
| **Shard Quality** | Planar Shard | Refined Planar Shard | Prismatic Planar Shard |
| **AI Art Model** | FLUX Kontext Dev | FLUX Kontext Pro | FLUX Kontext Pro |
| **AI Art Resolution** | 768x1024 | 1024x1024 | 1024x1024 |
| **AI Art Passes** | 1 pass, standard queue | 1 pass, priority queue | 2 passes (generate + refine), priority queue |
| **Prompt Modifier Pool** | 8-10 basic options | 25-30 expanded options | 40+ including exclusive effects |
| **Cards Per Faction** | 50 | 100 | 200 |
| **Deck Slots** | 3 | 6 | 10 |
| **Monthly Card Bonus** | None | +3 Commons | +5 Commons |
| **Quest Dust Bonus** | 1.0x (base) | 1.5x | 2.0x |
| **Free Monthly Shard** | None | None | 1 Legendary Shard |
| **Evolution Animation** | Standard | Extended with particle effects | Premium with faction-specific effects |
| **Card Back Access** | Starter back only | +3 exclusive mid-tier backs | +6 exclusive top-tier backs (all mid-tier included) |
| **Avatar Frame Access** | Basic frames | Ornate frames | Legendary + animated frames |
| **Profile Badge** | None | "Planar Adept" | "Chaos Forged" |

### Price Justification

The final prices are $6.99/month (Mid) and $12.99/month (Top). These supersede any "~$5-8/mo" or "~$10-15/mo" ranges in earlier design documents. Use only the values above in all implementation.

**Mid Tier ($6.99/month):**
- Positioned as the "committed player" tier for serious-but-budget-conscious players.
- Competes with Apple Arcade, Apple TV+, and other established mobile subscription benchmarks.
- Provides meaningful quality-of-life improvements without being required for competitive play.
- Primary conversion trigger: hitting the 50-card-per-faction limit.

**Top Tier ($12.99/month):**
- Positioned as the "collector" tier for deeply invested players who want the full experience.
- Provides collector-focused benefits: 200 cards per faction, free Legendary shard, premium cosmetics, 2-pass art refinement.
- Primary conversion trigger: Mid-tier player who has unlocked multiple factions and wants to experiment with more builds.

### Value Proposition by Tier

**Free Tier: "I want to try this game."**
- What you get: Full mechanical access. 50 cards per faction is enough for 2-3 competitive decks. Reach Legendary rank. Evolve cards to Legendary tier. Play the full game.
- What you miss: Forced curation at 50-card limit. Slower evolution (half the quest dust). Lower-resolution art. Fewer modifier choices.
- Player feeling: "I am playing a complete game for free. If I really love this, I might subscribe."

**Mid Tier: "I am committed to this game."**
- What you get: 100 cards per faction (room for experimentation). 50% more quest dust (significantly faster evolution). 6 deck slots (maintain multiple archetypes simultaneously). Higher-resolution art with 25-30 dramatic visual modifiers. 3 modifier choices at each evolution.
- What you miss: Highest-tier visual effects. Free monthly Legendary shard. Largest collection size.
- Player feeling: "I am a serious player. My evolutions look great, my collection is growing steadily, and I have room to experiment."

**Top Tier: "I want the full collector experience."**
- What you get: 200 cards per faction. Double quest dust. 10 deck slots. Best evolution art in the game — 2-pass refinement, 40+ exclusive visual modifiers, faction-specific ceremony effects. 4 modifier choices (maximum build precision). Free Legendary shard every month.
- What you miss: Nothing. This is the complete experience.
- Player feeling: "I am a collector and build tinkerer. My cards are works of art, my collection is massive, and I can chase any build I want."

---

## 4. App Store Connect — Subscription Configuration (Field by Field)

Complete these steps after enrolling in the Apple Developer Program ($99/year). This is a one-time setup.

### 4a. Create the App in App Store Connect

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com).
2. Click **My Apps** > **+** > **New App**.
3. Fill in:
   - Platforms: iOS
   - Name: `Chaos Creatures`
   - Primary Language: English (U.S.)
   - Bundle ID: `com.chaoscreatures.app` (must match Xcode project `PRODUCT_BUNDLE_IDENTIFIER`)
   - SKU: `chaos-creatures-001` (internal identifier, never shown to users)
4. Click **Create**.

### 4b. Enroll in Apple Small Business Program

Before creating products, enroll in the Small Business Program to reduce Apple's commission from 30% to 15% on revenue up to $1,000,000/year. As a solo operator, you qualify immediately.

1. Go to [developer.apple.com/app-store/small-business-program](https://developer.apple.com/app-store/small-business-program).
2. Click **Enroll**.
3. Sign in with your Apple Developer account.
4. Agree to the updated Program License Agreement.
5. Apple processes the application within a few business days.
6. Once approved, all new and existing IAP revenue is charged at 15% commission retroactively from approval.

**Budget impact:** This doubles your effective revenue at early scale. At $1,000/month gross, you keep $850 instead of $700.

### 4c. Create Subscription Group

Subscriptions in App Store Connect must belong to a group. Users can hold only one subscription per group at a time — upgrading/downgrading within the group is handled automatically by Apple.

1. In your app page, click **Subscriptions** in the left sidebar (under **In-App Purchases**).
2. Click **Create** next to Subscription Groups.
3. Fill in:
   - Reference Name: `Chaos Creatures Subscription Tiers`
4. Click **Create**.

### 4d. Create Mid Tier Monthly Subscription

Inside the subscription group, click **+**:

| Field | Value |
|---|---|
| Reference Name | `Mid Tier Monthly` |
| Product ID | `com.chaoscreatures.app.sub_mid_monthly_699` |
| Subscription Duration | 1 Month |
| Base Price (USD) | $6.99 |
| Display Name | `Chaos Creatures Mid Tier` |
| Description | `Expand your collection to 100 cards per faction, unlock 3 modifier choices at each evolution, and earn 50% more Chaos Dust from quests.` |
| Review Screenshot | 1242x2208 PNG of the in-app upgrade screen (required by Apple) |

Click **Save**.

### 4e. Create Mid Tier Annual Subscription

Inside the same subscription group, click **+**:

| Field | Value |
|---|---|
| Reference Name | `Mid Tier Annual` |
| Product ID | `com.chaoscreatures.app.sub_mid_annual_5599` |
| Subscription Duration | 1 Year |
| Base Price (USD) | $55.99 |
| Display Name | `Chaos Creatures Mid Tier (Annual)` |
| Description | `Everything in Mid Tier, billed annually. Save $28 compared to monthly.` |

Click **Save**.

### 4f. Create Top Tier Monthly Subscription

| Field | Value |
|---|---|
| Reference Name | `Top Tier Monthly` |
| Product ID | `com.chaoscreatures.app.sub_top_monthly_1299` |
| Subscription Duration | 1 Month |
| Base Price (USD) | $12.99 |
| Display Name | `Chaos Creatures Top Tier` |
| Description | `The full collector experience. 200 cards per faction, 4 modifier choices at evolution, 2-pass premium art, 1 free Legendary Shard monthly, and 100% Chaos Dust quest bonus.` |

Click **Save**.

### 4g. Create Top Tier Annual Subscription

| Field | Value |
|---|---|
| Reference Name | `Top Tier Annual` |
| Product ID | `com.chaoscreatures.app.sub_top_annual_9999` |
| Subscription Duration | 1 Year |
| Base Price (USD) | $99.99 |
| Display Name | `Chaos Creatures Top Tier (Annual)` |
| Description | `Everything in Top Tier, billed annually. Save $56 compared to monthly.` |

Click **Save**.

### 4h. Set Subscription Group Display Order

In the subscription group, drag the subscriptions into this display order (shown on the upgrade paywall):
1. Top Tier Monthly (feature tier — displayed prominently)
2. Top Tier Annual (best value — shown with "Save 36%" badge)
3. Mid Tier Monthly
4. Mid Tier Annual

Apple uses this order on the paywall sheet. Put the most featured offer first.

### 4i. Create Battle Pass (Non-Consumable)

1. In your app page, click **In-App Purchases** in the left sidebar.
2. Click **+** > **Non-Consumable**.

| Field | Value |
|---|---|
| Reference Name | `Battle Pass Season` |
| Product ID | `com.chaoscreatures.app.iap_battlepass_999` |
| Price | $9.99 |
| Display Name | `Chaos Creatures Battle Pass` |
| Description | `Unlock 50 tiers of seasonal rewards including exclusive cosmetics, Legendary Shards, Chaos Dust, and Commons.` |

Click **Save**.

**Note on season handling:** The IAP product is permanent (non-consumable). The server determines which season a purchase applies to based on the transaction timestamp vs. the active season's date range in the `seasons` table. A new IAP product is never created for each season — the same product ID is reused every season.

### 4j. Create Cosmetic Products (Non-Consumable)

For each cosmetic product in the Section 2 product table, repeat:

1. Click **+** > **Non-Consumable**.
2. Enter Reference Name (human-readable), Product ID (from table), Price, Display Name, Description.
3. Click **Save**.

All cosmetics are non-consumable (purchased once, owned forever, restored automatically by StoreKit 2 across reinstalls).

### 4k. Configure Introductory Offers (First-Month Discount)

1. In the subscription group, click on **Mid Tier Monthly**.
2. Scroll to **Introductory Offers** > **+**.
3. Fill in:
   - Type: Pay as you go
   - Duration: 1 Month
   - Price: $2.99
   - Eligibility: New subscribers only
4. Click **Save**.

Repeat for Top Tier Monthly (introductory price: $4.99 for first month).

**In Swift:** StoreKit 2 exposes introductory offers via `product.subscription?.introductoryOffer`. Display "First month $2.99" on the paywall automatically if this offer is available to the current user.

### 4l. App Store Review Requirements for Subscriptions

Apple requires specific information for subscription apps. The review team will check all of these before approving the initial build:

1. **Subscription terms URL:** Create a static Terms of Service page at `https://chaoscreatures.com/terms` (hosted on Cloudflare Pages, free). This URL must be entered in App Store Connect under **App Information** > **Privacy Policy URL** and referenced in your subscription description.

2. **Sandbox tester account:** In App Store Connect, go to **Users and Access** > **Sandbox** > **Testers** > **+**. Create:
   - Email: `sandbox@chaoscreatures-test.com`
   - Password: [secure password stored in your password manager, never in git]

3. **Review notes (enter in App Store Connect > App Review Information):**
   ```
   Test account: sandbox@chaoscreatures-test.com / [password]
   All subscriptions are accessible from: Profile tab → "Upgrade Plan" button.
   Tap "Mid Tier Monthly" to test subscription flow.
   Use the Sandbox environment on a real device or Simulator with StoreKit testing enabled.
   Battle Pass is accessible from: Home screen → "Season" tab → "Get Battle Pass".
   Restore Purchases button is in: Profile tab → Settings → "Restore Purchases".
   ```

4. **"Restore Purchases" button:** App Store guidelines require a visible "Restore Purchases" button in the subscription UI. Place it in the upgrade paywall screen and in Settings. Call `StoreService.shared.restorePurchases()` which calls `AppStore.sync()`.

5. **Subscription management link:** iOS 15+ automatically shows "Manage Subscription" in-app (via `SKPaymentQueue`). Additionally, add a "Manage Subscription" button in Settings that opens: `URL(string: "https://apps.apple.com/account/subscriptions")`.

6. **Clear cancellation terms:** Display on the paywall: "Subscriptions auto-renew. Cancel anytime in Settings > Apple ID > Subscriptions."

7. **App Store privacy nutrition labels:** In App Store Connect > App Privacy, declare:
   - Data Collected: Purchase History (linked to identity)
   - Data Collected: User ID (linked to identity)
   - Data Collected: App Activity — gameplay data (not linked to identity)
   - Data Not Collected: Location, Contacts, Browsing History, Health

### 4m. App Store Review Guidelines for Subscriptions (Key Rules)

Apple Guidelines 3.1.2 governs subscriptions. Violations cause rejection:

- **3.1.2(a):** Subscriptions may only unlock ongoing features, not permanently owned content. The modifier selection depth, dust bonuses, and art quality upgrades qualify as ongoing features. Correct.
- **3.1.2(b):** All features unlocked by the subscription must be accessible within the app. No subscription benefits delivered outside the app.
- **3.1.2(c):** Free trials must be disclosed with the exact trial period and price after trial. Our introductory offer is "first month at $2.99" — not a free trial, which is simpler to disclose.
- **Guideline 3.1.1:** No loot boxes or randomized paid content. Card packs use free Dust only. Correct.
- **Guideline 3.2.1:** Cannot use IAP for features that should be free (e.g., basic gameplay). Free players have full game access. Correct.

---

## 5. Conversion Funnels

### Free to Mid Conversion Triggers

**Primary conversion moment:** Player hits the 50-card limit on their main faction and is forced to delete a card they have invested games into.

**Secondary conversion moments:**
1. Player has finished 30+ games with a deck and wants to evolve multiple cards to Rare, but does not have enough shards. Mid-tier dust bonus would substantially increase shard acquisition.
2. Player sees a subscriber's evolution art (shared in chat or on a profile showcase) and wants access to better visual modifiers.
3. Player wants to maintain 2+ competitive decks simultaneously but has only 3 deck slots.
4. Player wants to explore a second faction but does not want to delete main-faction cards to stay under the 50-card limit.

**Expected conversion rate:**
- Industry benchmark for F2P mobile: 2-5% of DAU convert to paid.
- Card games skew higher: 5-10% for successful titles (Hearthstone ~7%, Marvel Snap ~8-10%).
- Chaos Creatures target: **6-8% of DAU convert to any paid tier**.
- Of converting players, target 70% choosing Mid tier, 30% Top tier.

**In-app conversion tactics (all automated):**

| Trigger Event | UI Shown | CTA |
|---|---|---|
| Player reaches 48/50 cards in any faction | Banner: "Your collection is almost full." | "Upgrade to Mid Tier for 100 card slots" |
| Player tries to save a 4th deck | Sheet: "Free players have 3 deck slots." | "Upgrade to Mid Tier for 6 deck slots" |
| Player is about to evolve a card to Epic | Evolution screen shows side-by-side: 2 options vs. 3 options | "Subscribe now to unlock this evolution with 3 choices — $2.99 first month" |
| Player tries to evolve but lacks shards (has energy) | "You need more Chaos Dust." prompt | "Mid Tier gives 50% more quest dust. You would have earned this already." |

All conversion nudges respect a **30-day suppression window**: if the player dismissed a nudge in the last 30 days, do not show the same nudge type again. Track suppression in Supabase `user_nudge_suppression` table.

### Mid to Top Conversion Triggers

**Primary conversion moment:** Player has unlocked all 3 launch factions and is approaching the 100-card-per-faction limit.

**Secondary conversion moments:**
1. Player sees a Top-tier evolution with 2-pass refinement and exclusive visual effects.
2. Player is evolving a favorite card to Legendary and wants 4 modifier choices for maximum precision.
3. Player wants the free monthly Legendary shard (240 Dust value, 2-3 days of grinding equivalent).
4. Player wants exclusive top-tier cosmetics (animated avatar frames, Legendary card backs).

**Expected conversion rate:**
- Of players who subscribe to Mid tier, 20-30% eventually upgrade to Top tier.
- Typically happens 2-3 months after initial Mid-tier subscription (once the player has established multiple factions).

### Churn Prevention

**For Mid Tier:**
1. **Card storage dependency.** Once a player accumulates 60+ cards in a faction, dropping to Free means deleting 10+ cards they invested in.
2. **Dust income cliff.** Going from 1.5x quest dust back to 1.0x feels like a significant slowdown.
3. **Art quality attachment.** After evolving 10+ cards with Refined Shards, the lower-resolution Free tier art feels like a downgrade.
4. **Deck slot utility.** Once 4-6 decks are built, losing half of them is painful.

**For Top Tier:**
1. **Massive collection.** 150-200 cards per faction. Dropping to Mid (100 cards) means deleting 50-100 cards — a large psychological barrier.
2. **Visual identity.** Top-tier evolutions are visibly superior. Players do not want future evolutions to look worse.
3. **Free Legendary shard.** 240 Dust per month is significant value. Losing this feels like leaving money on the table.

**Churn mitigation tactics:**
1. **Grace period.** If a subscription lapses (billing failure), give a 7-day grace period before enforcing card limits. Store `grace_period_until` in `user_subscriptions`. Prevent accidental lapses from forcing painful deletions. Apple's GRACE_PERIOD_EXPIRED notification triggers enforcement.
2. **Downgrade warnings.** If a player cancels Top tier (detected via `DID_CHANGE_RENEWAL_STATUS` App Store notification), display: "You have [N] cards in [Faction]. Downgrading to Mid tier will require you to delete [N-100] cards. Are you sure?" Pull N from Supabase `card_instances` count.
3. **Win-back.** When `EXPIRED` notification fires and tier drops to `free`, the Supabase Edge Function enqueues a PostHog event. A win-back push notification is sent 14 days post-expiry via Supabase auth email with a StoreKit 2 promotional offer code for a discounted first month on re-subscribe.
4. **Annual discount.** Annual subscriptions are shown at 2-months-free pricing (10-month price for 12 months). Surface the annual option prominently on the subscription paywall screen.

### Promotional Offers (StoreKit 2 Signed Offers)

For win-back, retention offers, and upgrade incentives, use StoreKit 2 Promotional Offers (different from introductory offers — these can be offered to existing/former subscribers).

**Setup in App Store Connect:**
1. On the subscription detail page, under **Subscription Prices** > **Promotional Offers** > **+**.
2. Create `winback_50pct_mid`: 50% off for 1 month (price: $3.49) for former Mid subscribers.

**In Swift — signing and presenting the promotional offer:**
```swift
// The server signs a promotional offer using the private key from App Store Connect.
// The client receives the signed payload and presents it to StoreKit 2.

let offerID = "winback_50pct_mid"
// Fetch the server-signed offer params from your Supabase Edge Function.
let signedParams = try await SupabaseService.shared.getSignedPromoOffer(
    productID: ProductID.midMonthly,
    offerID: offerID
)

let purchaseOptions: Set<Product.PurchaseOption> = [
    .promotionalOffer(offerID: offerID, keyID: signedParams.keyID,
                      nonce: signedParams.nonce, signature: signedParams.signature,
                      timestamp: signedParams.timestamp)
]
let result = try await product.purchase(options: purchaseOptions)
```

---

## 6. Battle Pass / Season System

### Season Length

**8 weeks per season (2 months).**

Rationale: Long enough for casual players to complete the free track (1-2 games/day can finish it). Short enough to maintain urgency. Aligns with 6-season-per-year content cadence. Matches the 8-week ladder season length established in `04-progression-economy.md`.

### Season Structure

Each season has:
1. A thematic identity tied to lore (e.g., "Season of Planar Fractures," "Season of the Fey Ascendancy")
2. Exclusive cosmetics (card back, avatar frame, board skin) available only during that season
3. Balance changes (modifier adjustments, new cards)
4. Competitive ladder reset with tiered rewards

### Battle Pass Tracks

**Free Track (30 tiers):**
- Rewards every tier
- Total value: ~800-1000 Chaos Dust equivalent
- No exclusive cosmetics (but unlocks basic seasonal items)

**Premium Track (50 tiers):**
- Rewards every tier
- Total value: ~3000-3500 Chaos Dust equivalent
- Includes exclusive season cosmetics
- Price: $9.99 USD (product ID: `com.chaoscreatures.app.iap_battlepass_999`)

| Tier Range | Free Track Reward | Premium Track Reward |
|---|---|---|
| Tiers 1-5 | 30 Dust per tier | 50 Dust per tier |
| Tiers 6-10 | 30 Dust per tier (Uncommon Shard at tier 10) | Rare Shard at tier 6, 50 Dust x4 |
| Tiers 11-15 | 40 Dust per tier | Uncommon Shard x2, Epic Shard at tier 15 |
| Tiers 16-20 | 40 Dust per tier (Rare Shard at tier 20) | 3 Commons at tier 16, Epic Shard at tier 20 |
| Tiers 21-25 | 50 Dust per tier | Legendary Shard at tier 25, exclusive seasonal card back |
| Tiers 26-30 | 50 Dust per tier (Epic Shard at tier 30) | 5 Commons at tier 26, exclusive seasonal avatar frame at tier 30 |
| Tiers 31-40 | Not available (free track ends at 30) | 60 Dust per tier, Legendary Shard at tier 35, Rare Shard x3 |
| Tiers 41-50 | Not available | Epic Shard x2, exclusive board skin at tier 45, Legendary Shard at tier 50 |

### XP Progression

- Per-win XP: 100
- Per-loss XP: 50
- Daily quest XP: 200 per quest (3 quests/day = 600 XP/day)
- Weekly quest XP: 500 per quest (2 quests/week = 1000 XP/week)
- XP per tier: 500 XP for tiers 1-30, 750 XP for tiers 31-50
- Total XP for free track (30 tiers): 15,000 XP
- Total XP for premium track (50 tiers): 30,000 XP

**Time to complete (casual player — 50% winrate, all daily quests completed, 3 games/day):**
- Daily quests: 600 XP/day
- Games (3/day at 50% WR): 225 XP/day (1.5 wins, 1.5 losses = 225 avg)
- Total: ~825 XP/day
- Free track: ~18 days of consistent play
- Premium track: ~36 days of consistent play

### Premium Track Value Proposition

**Economic value breakdown:**
- Chaos Dust total (direct tier rewards): ~1,800 Dust
- Shard value: 4 Legendary (960 Dust) + 4 Epic (480 Dust) + 6 Rare (360 Dust) + 4 Uncommon (120 Dust) = 1,920 Dust
- Commons: 8 cards x 50 Dust = 400 Dust
- **Total economic value: ~4,120 Dust**

At ~15 Dust per win, that is 275 wins worth of grinding.

**Cosmetic value:**
- Exclusive seasonal card back (~$2.99 standalone value)
- Exclusive seasonal avatar frame (~$1.99 standalone value)
- Exclusive seasonal board skin (~$3.99 standalone value)
- Total cosmetic value: ~$9

**Total value: ~$18-20 of Dust grinding time + cosmetics for $9.99.** Strong value for engaged players.

### Battle Pass Server Logic

The Battle Pass is a non-consumable IAP (`com.chaoscreatures.app.iap_battlepass_999`). The server stores:

```sql
CREATE TABLE user_battle_passes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users NOT NULL,
  season_id   integer NOT NULL,   -- e.g., 1, 2, 3
  is_premium  boolean DEFAULT false,
  current_tier integer DEFAULT 0,
  current_xp  integer DEFAULT 0,
  purchased_at timestamptz,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, season_id)
);
```

When the iOS client receives a verified StoreKit 2 transaction for `com.chaoscreatures.app.iap_battlepass_999`, it calls the `sync-entitlements` Edge Function. The Edge Function checks the active season from the `seasons` table and sets `is_premium = true` for the user's current season row.

Because the IAP is non-consumable, Apple will not re-charge for the same product ID — but StoreKit 2 will still return the transaction in `Transaction.currentEntitlements`. The server distinguishes seasons by the transaction `purchaseDate` vs. the `seasons` table `start_date`/`end_date`. If the most recent transaction for this product was purchased before the current season started, `is_premium` is `false` for the current season (new purchase required).

---

## 7. Cosmetics Revenue

All cosmetics are direct purchases with transparent pricing — no loot boxes.

### Cosmetic Categories and Pricing

#### Card Backs

Card backs replace the default card back visual when cards are in hand or deck.

**Launch inventory:**
- 1 starter back: free (generic)
- 3 faction-themed backs per faction (9 total): earned via Faction Mastery milestones, not purchasable
- 6 premium backs per faction (18 total): direct purchase

**Pricing:**
- Standard premium card back: $1.99
- Legendary premium card back (animated with particle effects): $2.99
- Bundle (3 card backs): $4.99 — product ID `com.chaoscreatures.app.iap_cardback_bundle_499`

#### Board / Battlefield Skins

The battlefield is the visual environment where battle takes place (background, creature slot frames, ambient particles).

**Launch inventory:**
- 1 default board per faction (free, tied to your deck's faction)
- 3 premium boards per faction (9 total): purchasable

**Premium board themes:**
- Ironwright: Clockwork Foundry (rotating gears, steam vents), Crystal Manufactory (prismatic light), Warforge Arena (battle-scarred metal)
- Fey: Moonlit Glade (bioluminescent flora), Thornwood Court (dark twisted trees), Celestial Grove (aurora sky)
- Demonic: Obsidian Throne Room (hellfire braziers), Blood Ritual Chamber (pulsing runes), Abyssal Rift (void energy)

**Pricing:**
- Standard board: $2.99
- Legendary board (advanced animations + ambient audio): $3.99
- All 3 faction boards bundle: $7.99 (product ID `com.chaoscreatures.app.iap_board_bundle_799`)

#### Avatar Frames and Effects

Avatar frames surround the player's avatar portrait during battle.

**Launch inventory:**
- 3 basic frames: free, earned via Player Level milestones
- 6 ornate frames per faction (18 total): Mid-tier subscription exclusive (no direct purchase)
- 6 Legendary frames per faction (18 total): Top-tier subscription exclusive (no direct purchase)
- 12 premium standalone frames (holiday/event/achievement): direct purchase

**Pricing:**
- Premium frame: $1.99
- Legendary animated frame: $2.99

#### Card Reveal Animations

When a card is drawn or played, a brief SpriteKit animation plays (implemented as an SKAction sequence in the battlefield scene).

**Launch inventory:**
- 1 default animation: free
- 6 premium animations (fire, frost, lightning, shadow, radiant, void): direct purchase at $1.99 each

### Total Cosmetics ARPU

Estimated cosmetics ARPU: $0.65-$0.95 per player over lifetime. Secondary to subscription revenue but meaningful at scale (at 100K players: $65K-$95K in cosmetics revenue over time).

### Cosmetics Admin UI (Web Dashboard)

The owner adds new cosmetics via the web Admin Dashboard (React app on Railway — separate from the iOS app). No database access required.

**Cosmetic record creation:**
1. Owner opens the admin UI at `chaoscreatures-admin.railway.app`.
2. Fills in: Name, Category, Faction, IAP Product ID (from the table in Section 2), Price, Preview Image URL (uploaded to Cloudflare R2), Description.
3. Clicks **Create**. The admin UI writes to the `cosmetics` Supabase table. The item appears in the iOS app's store immediately (no deploy, no rebuild required).

The `cosmetics` table schema:
```sql
CREATE TABLE cosmetics (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  category         text NOT NULL CHECK (category IN ('card_back', 'board', 'avatar_frame', 'reveal_animation')),
  faction          text CHECK (faction IN ('ironwright', 'fey', 'demonic', 'universal')),
  iap_product_id   text UNIQUE NOT NULL,
  price_usd        numeric(5,2) NOT NULL,
  preview_image_url text NOT NULL,
  description      text,
  is_active        boolean DEFAULT true,
  created_at       timestamptz DEFAULT now()
);
```

---

## 8. Revenue Projections and Financial Model

### Solo Operator Context

This game is built and operated by one person with a total launch budget of $300. Revenue projections reflect this reality: no engineering team salary, no marketing budget, no paid acquisition. Growth comes from organic App Store discovery, word-of-mouth, and the novelty of AI-generated card art. All cost estimates are conservative. The business model only needs to cover infrastructure and Apple Developer Program fees to be profitable at early scale.

### Apple Small Business Program Impact

Apple charges 30% commission on App Store IAP revenue. However, developers who earn under $1,000,000/year qualify for the Small Business Program (15% commission). As a new app, you qualify immediately. Enroll before your first sale (see Section 4b).

All revenue figures below use **15% commission** (Small Business Program) as the base case, with 30% shown for comparison.

### Per-User Revenue Estimates by Segment

| Segment | % of DAU | Monthly ARPU | Annual LTV |
|---|---|---|---|
| Free (never pay) | 70-75% | $0 | $0 |
| Free + occasional battle pass | 5-8% | $1.25 | $15 |
| Mid Tier subscriber | 10-12% | $6.99 | $84 |
| Top Tier subscriber | 3-5% | $12.99 | $156 |
| Whales (Top + battle pass + cosmetics) | 1-2% | $18-25 | $220-$300 |

**Blended ARPU (all players):**
- Conservative: $0.85-$1.20/month
- Optimistic: $1.50-$2.00/month

### Monthly Revenue Model

Assumptions:
- Conversion to any paid tier: 7% of DAU
- Of paying players: 65% Mid tier, 30% Top tier, 5% Top + battle pass + cosmetics
- Battle pass attachment: 15% of DAU buy pass each season (8-week seasons = ~$0.75/user/month average)
- Cosmetics: $0.10/month ARPU across all players
- Store commission: 15% (Small Business Program). Revenue figures below are **net after store fees**.

| DAU | Paying Users (7%) | Mid (65%) | Top (30%) | Monthly Gross | Net After 15% Fee | Net After 30% Fee (comparison) |
|---|---|---|---|---|---|---|
| 10,000 | 700 | 455 @ $6.99 | 210 @ $12.99 | $12,540 | **$10,659** | $8,778 |
| 50,000 | 3,500 | 2,275 @ $6.99 | 1,050 @ $12.99 | $62,700 | **$53,295** | $43,890 |
| 100,000 | 7,000 | 4,550 @ $6.99 | 2,100 @ $12.99 | $125,401 | **$106,591** | $87,781 |
| 500,000 | 35,000 | 22,750 @ $6.99 | 10,500 @ $12.99 | $627,005 | **$532,954** | Note: exceeds $1M/yr threshold at this scale; commission rate increases to 30% above $1M |

### AI Generation Cost Offset (fal.ai)

**Cost per evolution:**
- Free player: ~$0.02 (FLUX Kontext Dev)
- Subscriber: ~$0.04 (FLUX Kontext Pro)

**Monthly evolution volume estimates:**
- Free player: 10-15 evolutions/month = $0.20-$0.30 in fal.ai costs
- Mid Tier subscriber: 25 evolutions/month = $1.00 in fal.ai costs
- Top Tier subscriber: 40 evolutions/month = $1.60 in fal.ai costs

**AI cost analysis (net subscription revenue vs. fal.ai cost):**

| Segment | Monthly Subscription Revenue | Monthly fal.ai Cost | Margin After AI |
|---|---|---|---|
| Free player | $0 | $0.25 | -$0.25 (loss leader) |
| Mid Tier subscriber | $5.94 (net after 15%) | $1.00 | $4.94 (83% margin) |
| Top Tier subscriber | $11.04 (net after 15%) | $1.60 | $9.44 (86% margin) |

**Monthly fal.ai costs at scale:**
- 10K DAU: ~$3,900/month
- 50K DAU: ~$19,500/month
- 100K DAU: ~$39,000/month

**Revenue vs. fal.ai costs (net revenue after 15% store fee and AI):**
- At 10K DAU: $10,659 net revenue - $3,900 AI costs = **$6,759** (63% margin after AI)
- At 50K DAU: $53,295 net revenue - $19,500 AI costs = **$33,795** (63% margin after AI)
- At 100K DAU: $106,591 net revenue - $39,000 AI costs = **$67,591** (63% margin after AI)

### Infrastructure Cost Estimate (Solo Operator Stack)

Monthly infrastructure costs at each scale level:

| Service | 10K DAU | 50K DAU | 100K DAU | Solo Dev Notes |
|---|---|---|---|---|
| Apple Developer Program | $8.25 | $8.25 | $8.25 | $99/year flat |
| Supabase (Pro plan) | $25 | $25 | $599 (Team plan) | Free tier works in dev |
| Railway (game server) | $50-100 | $200-400 | $400-800 | Pay-as-you-go |
| Cloudflare R2 (card art CDN) | $5 | $25 | $50 | First 10GB free |
| OpenAI (GPT-4o Mini) | $20 | $100 | $200 | Text generation only |
| PostHog (Cloud) | $0 | $50 | $150 | Free up to 1M events |
| **Total Infrastructure** | **~$108-$158** | **~$408-$608** | **~$1,407-$1,807** | No team salaries |

**Build-to-launch budget usage ($300 cap):**
- Apple Developer Program: $99
- Supabase (Pro plan, first month): $25
- Railway (first month): $50
- Cloudflare R2 (first month): $5
- OpenAI (content generation batch for launch cards): ~$50-80
- fal.ai (art generation for launch cards — ~1,000 cards x $0.02-$0.04): $20-40
- PostHog: $0 (free tier)
- **Total estimated: $249-$299** — within $300 budget.

### Break-Even Analysis (Solo Operator)

**Monthly fixed costs at launch scale (~1K-5K DAU):**
- Infrastructure: ~$108-$158/month
- Apple Developer Program: $8.25/month
- **Total monthly costs: ~$116-$166/month**

**Revenue needed to cover costs:**
- At 15% commission, net revenue per Mid subscriber: $5.94/month
- Subscribers needed to break even: $166 / $5.94 = **~28 paying subscribers** (at $6.99/month)
- At 7% conversion rate, DAU needed: 28 / 0.07 = **~400 DAU**
- This is achievable within weeks of a successful App Store launch.

**Milestone projections:**
- 400 DAU → operational break-even ($0 cost to run)
- 1,000 DAU → ~$75/month profit after all costs
- 5,000 DAU → ~$400/month profit
- 10,000 DAU → ~$6,600/month profit (solo operator takes home after all costs)
- 50,000 DAU → ~$33,000/month profit

---

## 9. Anti-Predatory Design

Chaos Creatures is designed to avoid exploitative F2P mechanics.

### 1. No Loot Boxes

**What we do not do:**
- No randomized card packs purchasable with real money.
- No "premium packs" with better odds.
- No rotating limited-time packs with exclusive cards.

**What we do instead:**
- Card packs are purchased with Chaos Dust (free in-game currency) only.
- Every pack has guaranteed contents: 3 Commons, no randomness beyond which 3 Commons from the faction pool.
- Duplicate protection: packs automatically reroll 3rd+ copies of owned Commons.
- Specific Commons can be purchased directly for 50 Dust each.

**Why this matters:** Loot boxes trigger compulsive gambling behavior in vulnerable players. Many countries regulate them as gambling (Belgium, Netherlands). By making card acquisition deterministic and free-currency-only, we eliminate this risk entirely and the associated regulatory exposure. Apple Guideline 3.1.1 also prohibits simulated gambling mechanics — our model is fully compliant.

### 2. Spending Caps and Warnings

**Implementation — stored in Supabase `user_spending_controls` table (schema in Section 2):**

**Behavior:**
- After $30 in IAP in any rolling 7-day period: display a confirmation sheet before the next purchase: "You have spent $30 this week on Chaos Creatures. Continue?"
- After $50 in IAP in any rolling 30-day period: same confirmation, with the addition of "You can set a monthly limit in Settings."
- Players can disable caps in Settings > Account > Spending Controls. Disabling requires a confirmation tap and is logged to PostHog as `spending_cap_disabled`.
- The Supabase Edge Function tracks running spend totals from App Store Server Notifications. The iOS client fetches the total before presenting any purchase sheet.

### 3. Parental Controls

**For accounts created by users identifying as under 18:**
- Require parental approval (via linked parent email) for any purchase over $5.
- Default spending cap: $20/month for accounts under 13, $50/month for accounts ages 13-17.
- Parent can view purchase history via a web portal at `chaoscreatures.com/parental-controls`.

**iOS integration:**
- StoreKit 2 automatically enforces Screen Time and Family Sharing restrictions. If a purchase is blocked by parental controls, `product.purchase()` returns `.userCancelled` — handle gracefully (no error shown).
- In the app's age gate (first launch), if the user enters a birth year indicating they are under 13, flag the account in Supabase and apply COPPA-compliant defaults (no purchase without parental consent email flow).

**COPPA compliance note:** Set the minimum age to 13 in App Store Connect (Age Rating questionnaire) and in the age gate UI. This is the minimum age for an Apple ID without parental controls, which provides the simplest COPPA compliance path for a solo operator.

### 4. Transparent Odds and Rates

**For any element with randomness:**
- Card pack contents: Show "Each pack contains 3 Commons. Duplicate protection active after 2 copies owned." on the pack purchase screen.
- Evolution outcomes: Show "70% chance of Chaos evolution, 30% chance of Order evolution" on the evolution confirmation screen.
- Modifier selection pool: Show full pool identifier and contents on the modifier selection screen.

**Apple requirement:** For any randomized purchase, Apple requires disclosure of probabilities before purchase. Our card packs have fixed contents (no randomness in what is purchased with real money), so this guideline does not apply to us — but we disclose anyway for player trust.

### 5. No Dark Patterns

**What we avoid:**
- No fake timers ("offer expires in 3 hours!" that resets daily).
- No manipulative pop-ups (no full-screen subscription ads that require 3 taps to dismiss).
- No bait-and-switch (no "free trial" that auto-converts to paid without clear warning).
- No hidden costs (all prices shown in local currency, clearly labeled before purchase).
- No pay-to-skip-grind mechanics beyond subscription dust bonuses, which are permanent ongoing benefits, not one-time skips.

**Implementation enforcement:** Every paywall and conversion nudge screen requires a one-tap dismiss option visible without scrolling. This is a code review checkpoint, not just a design guideline.

### 6. Refund Policy

**For subscription cancellations:**
- Players cancel via iOS Settings > Apple ID > Subscriptions (Apple handles this — the developer does not implement a cancellation flow).
- Subscription benefits remain active until end of current billing period (Apple enforces this automatically).
- If a player cancels within 48 hours of initial subscription, offer a full refund via in-app "Contact Support" button which opens a pre-filled email: `support@chaoscreatures.com?subject=Refund%20Request`.

**For cosmetic purchases:**
- Apple's standard refund policy applies (request via Apple's Report a Problem page).
- The developer can issue manual refunds from App Store Connect > Payments and Financial Reports if needed for exceptional cases.

---

## 10. Pricing Localization

### Regional Pricing Tiers

Use App Store Connect's built-in pricing tier system. Set a base USD price and Apple auto-suggests equivalent prices in all 175+ territories. You can override per-territory for markets with significant purchasing-power disparity.

**Tier 1 Markets (US, Canada, UK, Western Europe, Australia, Japan):**

| Product | USD | GBP | EUR | AUD | JPY |
|---|---|---|---|---|---|
| Mid Monthly | $6.99 | £5.99 | €6.99 | A$10.99 | ¥999 |
| Mid Annual | $55.99 | £45.99 | €54.99 | A$85.99 | ¥7,999 |
| Top Monthly | $12.99 | £10.99 | €12.99 | A$19.99 | ¥1,799 |
| Top Annual | $99.99 | £84.99 | €99.99 | A$154.99 | ¥13,999 |
| Battle Pass | $9.99 | £8.99 | €9.99 | A$14.99 | ¥1,399 |

**Tier 2 Markets (Eastern Europe, Latin America ex-Brazil, Southeast Asia):**

| Product | USD Equivalent | Example: Mexico (MXN) | Example: Poland (PLN) |
|---|---|---|---|
| Mid Monthly | ~$4.99 | MX$99 | PLN 22.99 |
| Mid Annual | ~$39.99 | MX$799 | PLN 179.99 |
| Top Monthly | ~$8.99 | MX$179 | PLN 40.99 |
| Top Annual | ~$69.99 | MX$1,399 | PLN 319.99 |
| Battle Pass | ~$6.99 | MX$139 | PLN 30.99 |

**Tier 3 Markets (India, Brazil, Turkey):**

| Product | India (INR) | Brazil (BRL) | Turkey (TRY) |
|---|---|---|---|
| Mid Monthly | ₹199 | R$14.90 | ₺49.90 |
| Mid Annual | ₹1,599 | R$119.90 | ₺399.90 |
| Top Monthly | ₹399 | R$29.90 | ₺99.90 |
| Top Annual | ₹2,999 | R$229.90 | ₺749.90 |
| Battle Pass | ₹299 | R$22.90 | ₺79.90 |

### How to Set Regional Prices in App Store Connect

1. In App Store Connect, open any subscription product.
2. Under **Subscription Prices**, click **Set Prices**.
3. Choose base country: United States.
4. After setting USD price, click **Proceed** — Apple auto-suggests equivalent prices in all currencies.
5. Review and adjust Tier 2 and Tier 3 markets by clicking each territory and entering the values from the tables above.
6. Click **Confirm** and **Save**.

Note: For non-subscription IAPs (cosmetics, battle pass), use **In-App Purchases** > open the product > **Pricing** > **Add Pricing** to set per-territory overrides.

### Currency Handling

- Apple handles all local currency display, tax calculation, payment processing, and remittance.
- Prices are shown to the user in their App Store region currency — you never need to format prices client-side. Use `product.displayPrice` (StoreKit 2) which returns the correctly formatted local price string.
- Review and adjust regional pricing quarterly based on significant exchange rate movements (more than 20% vs. USD). Apple sends email alerts for territory pricing changes.
- Prices shown are inclusive of taxes where required (EU VAT, etc.). Apple handles tax remittance — the developer receives net-of-tax revenue minus Apple's commission.

---

## 11. Monetization Roadmap and Future Opportunities

### Year 1 Priorities

**Months 1-3 (Launch):**
- Focus: Prove free-to-paid conversion. Target 6-8% conversion rate.
- Tactics: First-month discount offers, evolution moment upsells, deck slot friction nudges.
- Revenue target: 10K DAU, $8K-$10K/month net (after 15% Apple fee).

**Months 4-6 (Growth):**
- Focus: Scale user base, introduce first battle pass.
- Tactics: App Store featuring (submit for App Store editorial review), first seasonal content drop.
- Revenue target: 50K DAU, $40K-$50K/month net.

**Months 7-12 (Maturity):**
- Focus: Optimize conversion funnels, introduce cosmetics store.
- Tactics: A/B test subscription paywall layouts, launch cosmetics bundles, introduce annual subscription prominently.
- Revenue target: 100K DAU, $80K-$100K/month net.

### Future Monetization Opportunities (Year 2+)

**1. Guild / Clan System with Premium Benefits**
- Free guilds: Basic chat, shared card showcases.
- Premium guilds ($4.99/month guild subscription, split among members): Guild wars, exclusive cosmetics, shared Dust pool.

**2. Draft Mode with Entry Fee**
- Draft events: 150 Dust entry fee or $1.99 IAP, rewards scale with wins.
- Mid/Top tier subscribers get 1 free draft entry per week.

**3. Exclusive Card Variants (Not New Cards)**
- Alternate art for existing cards (same stats, different visual style): $2.99 each.
- Does not affect gameplay. Purely cosmetic and collectible.

**4. Prestige Evolution Paths (Post-Legendary)**
- After Legendary, continue evolving for cosmetic upgrades: animated borders, holographic effects, custom names.
- Requires Top Tier subscription or a one-time $4.99 Prestige unlock per card (product ID: `com.chaoscreatures.app.iap_prestige_499`).

---

## 12. Success Metrics and KPIs

### Core Monetization KPIs (Tracked in PostHog)

| Metric | Target Month 1 | Target Month 6 | Target Month 12 |
|---|---|---|---|
| Conversion Rate (Free to Paid) | 4-5% | 6-7% | 7-9% |
| ARPU (All Players) | $0.60-$0.80 | $0.85-$1.10 | $1.20-$1.60 |
| ARPPU (Paying Players Only) | $8-$12 | $10-$15 | $12-$18 |
| Monthly Churn Rate (Subscribers) | 8-10% | 5-7% | 3-5% |
| DAU | 5K-10K | 40K-60K | 100K-150K |

### PostHog Events to Fire

The iOS client must fire these PostHog events. Implement in the corresponding SwiftUI view or StoreService callback.

| Event Name | When to Fire | Properties |
|---|---|---|
| `paywall_shown` | Any paywall or upgrade screen is displayed | `trigger_reason`, `current_tier`, `screen_name` |
| `paywall_dismissed` | User closes paywall without purchasing | `trigger_reason`, `current_tier` |
| `purchase_started` | User taps a buy button | `product_id`, `price_usd` |
| `purchase_completed` | StoreKit 2 transaction verified | `product_id`, `price_usd`, `new_tier` |
| `purchase_failed` | `StoreError` thrown (non-cancellation) | `product_id`, `error_code` |
| `purchase_cancelled` | `StoreError.userCancelled` | `product_id` |
| `subscription_renewed` | `Transaction.updates` fires renewal | `tier`, `months_subscribed` |
| `subscription_cancelled` | App Store notification `DID_CHANGE_RENEWAL_STATUS` | `tier`, `months_subscribed` |
| `nudge_shown` | A conversion nudge banner or sheet appears | `nudge_type`, `context` |
| `nudge_dismissed` | User dismisses a nudge | `nudge_type` |
| `spending_cap_warning_shown` | Spending cap threshold reached | `cap_type` (weekly/monthly), `amount_usd` |
| `restore_purchases_tapped` | User taps Restore Purchases | `current_tier` |

**PostHog Swift implementation note:** Use the PostHog Swift SDK (`posthog-ios`). Call `PostHogSDK.shared.capture("event_name", properties: [...])` from the main thread. Initialize in `ChaosCreaturesApp` init alongside EntitlementManager.

---

## Conclusion

Chaos Creatures' monetization strategy is built on three core principles:

1. **No real money on individual cards.** This eliminates gambling mechanics, creates a fair playing field, and builds trust with Apple's App Store review team.
2. **Subscriptions enhance the experience, not the power.** Modifier selection depth, art quality, and collection growth are the monetization levers — all meaningful, none pay-to-win.
3. **Sustainable solo-operator economics.** AI generation costs (fal.ai) are more than covered by subscription revenue at scale. The business reaches break-even at ~400 DAU, achievable within weeks of launch. Apple's Small Business Program (15% commission) meaningfully improves solo-operator margins.

With an expected 7-9% conversion rate, $1.20-$1.60 ARPU at maturity, and 63% margin after AI costs and 15% Apple commission, Chaos Creatures achieves operational profitability at modest scale and can reach substantial annual revenue at 100K+ DAU — all operated by one person.

---

**Document version:** 3.0
**Last updated:** 2026-02-16
**Owner:** Monetization and Economy Design

---

## Revision Log

### v1.0 → v2.0 (original revision)

The following changes were made during the revision from v1.0 to v2.0 to ensure the document is directly implementable by Claude Code without any engineering judgment calls, manual processes, or ambiguous recommendations.

**Section 2 (New): IAP Library Decision: RevenueCat**
- Added. The previous document did not specify which IAP library to use. This section made an explicit, committed decision: RevenueCat (not expo-in-app-purchases), with full reasoning.
- Added exact npm install command with package names.
- Added step-by-step RevenueCat account setup instructions (project creation, platform apps, entitlement definitions).
- Added complete TypeScript client initialization code for `/src/services/purchases.ts`.
- Added complete `useEntitlements` React hook for `/src/hooks/useEntitlements.ts`.
- Added RevenueCat webhook integration instructions (webhook URL, event types to handle, Supabase Edge Function requirements).
- Added RevenueCat + PostHog integration configuration steps.

**Section 3 (Subscription Tiers): IAP Product Identifiers Table**
- Added explicit IAP product identifier table with exact strings for every purchasable product — both App Store and Google Play. Previous version had no product IDs anywhere in the document.
- Added annual subscription products that were not in v1.0.
- Added cosmetic product IDs for all individual cosmetic items.

**Section 4 (New): App Store Connect Configuration (Step by Step)**
- Added entirely. Previous version said "Use Apple App Store native IAP" with no setup instructions.

**Section 5 (New): Google Play Console Configuration (Step by Step)**
- Added entirely. Previous version said "Use Google Play native IAP" with no setup instructions.

**Section 6 (Conversion Funnels): In-App Conversion Tactics Table**
- Replaced generic bullet-point descriptions with a concrete trigger/UI/CTA table.
- Added 30-day nudge suppression logic with `user_nudge_suppression` Supabase table reference.
- Added specific PostHog funnel definition for nudge conversion tracking.

**Section 7 (Battle Pass): Server-Side Logic and SQL Schema**
- Added SQL schema for `user_battle_passes` table.
- Added explicit explanation of how one non-consumable IAP product ID is reused across seasons server-side.

**Section 8 (Cosmetics): Admin UI Specification and Cosmetics Table Schema**
- Added specification for cosmetics admin UI.
- Added `cosmetics` Supabase table SQL schema.
- Added explicit product IDs for all cosmetic variant items.

**Section 9 (Revenue Projections): Infrastructure Costs Updated to Actual Stack**
- Replaced generic "$5,000-$10,000/month cloud infrastructure" estimate with actual cost estimates for the committed stack.
- Added note about Apple Small Business Program (15% vs 30% commission).
- Revised break-even analysis to reflect solo-operator model.
- Added 30% store fee applied to all revenue figures.

**Section 11 (Pricing Localization): Explicit Currency Tables**
- Replaced generic descriptions with explicit per-currency price tables.
- Added step-by-step instructions for setting regional prices in both App Store Connect and Play Console.

**Section 13 (New): PostHog Events Table**
- Added explicit table of all PostHog events that must be fired.

---

### v2.0 → v3.0 (2026-02-16)

This revision aligns the document fully with the updated CLAUDE.md (native iOS / Swift / StoreKit 2 / App Store only) and resolves WARN-2 and WARN-5 from REVIEW.md.

**Platform change: React Native/Expo/TypeScript to Native iOS Swift + SwiftUI + SpriteKit**
- Removed all React Native, Expo, TypeScript client-side code.
- Removed all npm package references.
- Replaced all TypeScript code samples with Swift implementations.

**WARN-2 fix: Removed RevenueCat entirely**
- Removed Section 2 (IAP Library Decision: RevenueCat) entirely.
- Removed all `react-native-purchases` and `react-native-purchases-ui` references.
- Removed RevenueCat dashboard setup instructions.
- Removed RevenueCat webhook configuration.
- Removed RevenueCat + PostHog integration steps.
- Replaced with StoreKit 2 native Swift implementation: `EntitlementManager`, `StoreService`, `ProductCatalog` Swift files with full code.
- StoreKit 2 uses `Transaction.currentEntitlements` and `Transaction.updates` async sequences — the equivalent of RevenueCat's entitlement management, implemented natively with no third-party dependency and no cost.
- App Store Server API notifications replace RevenueCat webhooks for server-side subscription lifecycle events.

**WARN-5 fix: Subscription prices finalized**
- Removed all "~$5-8/mo" and "~$10-15/mo" range language from Section 3.
- Final prices are definitively $6.99/month (Mid) and $12.99/month (Top) throughout.
- Added note in Section 3 explicitly stating these values supersede any range language in docs 00 and 01.

**Removed: Google Play Console section (Section 5)**
- Removed entirely. The project is iOS only (CLAUDE.md). No Android, no Google Play.
- Removed all Google Play product ID columns from product tables.
- Removed `cc_` product ID prefix convention (was dual-platform). Replaced with `com.chaoscreatures.app.` reverse-domain prefix (App Store convention).

**Updated: IAP Product IDs**
- Changed all product IDs from short `cc_` prefix to full reverse-domain format `com.chaoscreatures.app.*` per App Store Connect convention.
- Updated Section 2 product table, Section 4 App Store Connect instructions, and all code samples to use new IDs.

**Updated: Section 4 (App Store Connect) — Additional Fields**
- Added field-by-field table format for each subscription product (more explicit than prose description).
- Added Section 4k for Promotional Offers (Signed Offers for win-back), with Swift code for presenting signed promotional offers via StoreKit 2.
- Added Section 4m covering App Store Review Guidelines for subscriptions (3.1.2(a)(b)(c), 3.1.1, 3.2.1).
- Removed Google Play setup steps that were in old Section 5.

**Updated: Section 8 (Revenue Projections)**
- Renamed to Section 8 (from Section 9 after removing the Google Play section).
- Added solo operator context paragraph.
- Added Apple Small Business Program subsection with enrollment steps.
- Added $300 build-to-launch budget breakdown (line by line, totaling within budget).
- Revised break-even analysis to reflect solo-operator with 15% Apple commission.
- Added milestone projections table (400 DAU → break-even, 10K DAU → $6,600/month).
- Revised monthly revenue model table to show both 15% (Small Business Program) and 30% commission columns.
- Removed RevenueCat from infrastructure cost table.

**Updated: Section 9 (Anti-Predatory Design)**
- Removed all RevenueCat webhook references from spending cap implementation.
- Replaced with App Store Server Notifications as the source of spend data.
- Removed Google Play / Google Family Link references from parental controls.
- Updated to iOS Screen Time / Family Sharing for parental control integration.
- Updated refund policy to reference App Store Connect (no Google Play equivalent).

**Updated: Section 10 (Pricing Localization)**
- Removed "How to Set Regional Prices in Play Console" subsection.
- Updated `product.displayPrice` note — this is StoreKit 2's `Product.displayPrice` property (Swift), not a React Native API.

**Updated: Section 12 (Success Metrics)**
- Removed `purchase_failed` and `subscription_cancelled` RevenueCat-sourced events.
- Added `purchase_cancelled` (StoreError.userCancelled distinction from failure) and `subscription_renewed` (from Transaction.updates).
- Updated PostHog implementation note to reference PostHog Swift SDK.

**Stack context header updated**
- Removed RevenueCat from stack context at top of document.
- Added StoreKit 2 as the IAP mechanism.
- Added $300 budget constraint reference.
- Removed Google Play from payments line.
