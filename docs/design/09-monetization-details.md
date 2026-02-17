# Chaos Creatures — Monetization Details

## Document Purpose

This document is the complete, code-ready monetization blueprint for Chaos Creatures. Every section is written so Claude Code can implement directly from it — no judgment calls left to an engineer, no "configure as appropriate," no ambiguity.

**Stack context (non-negotiable, from CLAUDE.md):**
- Client: React Native (Expo), TypeScript
- IAP library: **RevenueCat** (decided below in Section 2b — not expo-in-app-purchases)
- Backend: Supabase (Postgres, Edge Functions, Auth)
- Analytics: PostHog
- Payments: Apple App Store + Google Play native IAP, routed through RevenueCat

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

## 2. IAP Library Decision: RevenueCat

### Decision

**Use RevenueCat, not expo-in-app-purchases.**

**Reasons:**
- `expo-in-app-purchases` is a thin wrapper with no server-side receipt validation, no subscription state management, and no webhook support. The owner would need to build all of that manually.
- RevenueCat handles receipt validation, subscription status sync, entitlement checks, webhook delivery to Supabase, and a pre-built dashboard — all without writing backend subscription logic.
- RevenueCat's free tier covers the project until $2,500 MRR, which is well past initial launch.
- RevenueCat has official Expo/React Native support and is maintained by a dedicated team.
- RevenueCat integrates directly with PostHog for conversion analytics via a single configuration flag.

### npm Packages

```bash
npx expo install react-native-purchases react-native-purchases-ui
```

**Package versions to use (as of February 2026):**
- `react-native-purchases`: ^8.x (check RevenueCat releases page for latest 8.x)
- `react-native-purchases-ui`: ^8.x (same version as above)

**Do not use** `expo-in-app-purchases` or `react-native-iap`. Remove them if present.

### RevenueCat Account Setup

1. Go to [app.revenuecat.com](https://app.revenuecat.com) and create an account.
2. Create a new project named `chaos-creatures`.
3. In project settings, add two apps:
   - App 1: Platform = App Store, App Bundle ID = `com.chaoscreatures.app`
   - App 2: Platform = Google Play, Package Name = `com.chaoscreatures.app`
4. Copy the **Public SDK Key** for each platform. These go in the `.env` file:
   ```
   EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
5. In RevenueCat dashboard, go to **Entitlements** and create these three:
   - Identifier: `mid_tier` — Display name: Mid Tier
   - Identifier: `top_tier` — Display name: Top Tier
   - Identifier: `battle_pass_active` — Display name: Battle Pass
6. In RevenueCat dashboard, go to **Products** (after creating IAP products in each store — see Sections 3 and 4 below), then attach each store product to its corresponding entitlement.

### RevenueCat Client Initialization

Create `/src/services/purchases.ts`:

```typescript
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY!;
const REVENUECAT_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY!;

export function initializePurchases(userId: string): void {
  const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  Purchases.configure({ apiKey, appUserID: userId });
}

// Call this after Supabase auth resolves the user ID.
// userId must be the Supabase user UUID — never an email or username.
```

Call `initializePurchases(user.id)` immediately after `supabase.auth.getUser()` resolves during app startup.

### Entitlement Check Hook

Create `/src/hooks/useEntitlements.ts`:

```typescript
import { useState, useEffect } from 'react';
import Purchases, { CustomerInfo } from 'react-native-purchases';

export type SubscriptionTier = 'free' | 'mid' | 'top';

export interface Entitlements {
  tier: SubscriptionTier;
  hasBattlePass: boolean;
  isLoading: boolean;
}

export function useEntitlements(): Entitlements {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Purchases.getCustomerInfo().then((info) => {
      setCustomerInfo(info);
      setIsLoading(false);
    });

    const listener = Purchases.addCustomerInfoUpdateListener((info) => {
      setCustomerInfo(info);
    });

    return () => listener.remove();
  }, []);

  const activeEntitlements = customerInfo?.activeSubscriptions ?? [];

  let tier: SubscriptionTier = 'free';
  if (customerInfo?.entitlements.active['top_tier']) {
    tier = 'top';
  } else if (customerInfo?.entitlements.active['mid_tier']) {
    tier = 'mid';
  }

  return {
    tier,
    hasBattlePass: !!customerInfo?.entitlements.active['battle_pass_active'],
    isLoading,
  };
}
```

### RevenueCat Webhook to Supabase

RevenueCat fires webhooks on subscription changes. The Supabase Edge Function at `/supabase/functions/revenuecat-webhook/index.ts` must handle these events and update the `user_subscriptions` table.

**Webhook events to handle:**
- `INITIAL_PURCHASE` — Set subscription tier active.
- `RENEWAL` — Extend subscription expiry.
- `CANCELLATION` — Mark as cancelled (keep active until expiry).
- `EXPIRATION` — Set tier back to `free`.
- `BILLING_ISSUE` — Flag for retry, do not immediately downgrade.

**In RevenueCat dashboard:**
1. Go to **Integrations** > **Webhooks**.
2. Add webhook URL: `https://<your-supabase-project>.supabase.co/functions/v1/revenuecat-webhook`
3. Set Authorization header to a secret value and store it as `REVENUECAT_WEBHOOK_SECRET` in Supabase Edge Function secrets.
4. Select all event types.

**RevenueCat + PostHog integration:**
In RevenueCat dashboard, go to **Integrations** > **PostHog**. Enter your PostHog project API key. This automatically sends `rc_purchase`, `rc_cancellation`, `rc_renewal`, and other events to PostHog with no additional code.

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

### IAP Product Identifiers (Exact Strings)

These product IDs must be entered exactly as shown in both App Store Connect and Google Play Console.

| Product | App Store Product ID | Google Play Product ID | Type |
|---|---|---|---|
| Mid Tier Monthly | `cc_mid_monthly_699` | `cc_mid_monthly_699` | Auto-renewable subscription |
| Mid Tier Annual | `cc_mid_annual_5599` | `cc_mid_annual_5599` | Auto-renewable subscription |
| Top Tier Monthly | `cc_top_monthly_1299` | `cc_top_monthly_1299` | Auto-renewable subscription |
| Top Tier Annual | `cc_top_annual_9999` | `cc_top_annual_9999` | Auto-renewable subscription |
| Battle Pass | `cc_battle_pass_999` | `cc_battle_pass_999` | Non-consumable (one-time per season) |
| Card Back — Standard | `cc_cardback_standard_199` | `cc_cardback_standard_199` | Non-consumable |
| Card Back — Legendary | `cc_cardback_legendary_299` | `cc_cardback_legendary_299` | Non-consumable |
| Board Skin — Standard | `cc_board_standard_299` | `cc_board_standard_299` | Non-consumable |
| Board Skin — Legendary | `cc_board_legendary_399` | `cc_board_legendary_399` | Non-consumable |
| Avatar Frame — Standard | `cc_frame_standard_199` | `cc_frame_standard_199` | Non-consumable |
| Avatar Frame — Legendary | `cc_frame_legendary_299` | `cc_frame_legendary_299` | Non-consumable |
| Card Reveal Animation | `cc_reveal_anim_199` | `cc_reveal_anim_199` | Non-consumable |

**Naming convention:** `cc_` prefix (chaos creatures) + category + tier/variant + price in cents. This makes product IDs self-documenting.

### Price Justification

**Mid Tier ($6.99/month):**
- Positioned as the "committed player" tier for serious-but-budget-conscious players.
- Competes with Netflix basic, Apple Arcade, Spotify — established mobile subscription benchmarks.
- Provides meaningful quality-of-life improvements without being required for competitive play.
- Primary conversion trigger: hitting the 50-card-per-faction limit.

**Top Tier ($12.99/month):**
- Positioned as the "collector" tier for deeply invested players who want the full experience.
- Competes with WoW subscription, Hearthstone Tavern Pass equivalent.
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

## 4. App Store Connect — Subscription Configuration (Step by Step)

Complete these steps after enrolling in the Apple Developer Program ($99/year).

### 4a. Create the App in App Store Connect

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com).
2. Click **My Apps** > **+** > **New App**.
3. Fill in:
   - Platforms: iOS
   - Name: `Chaos Creatures`
   - Primary Language: English (U.S.)
   - Bundle ID: `com.chaoscreatures.app` (must match Expo `app.json` `bundleIdentifier`)
   - SKU: `chaos-creatures-001` (internal identifier, never shown to users)
4. Click **Create**.

### 4b. Create Subscription Groups

Subscriptions in Apple must belong to a group. Users can only hold one subscription per group at a time.

1. In your app page, click **Subscriptions** in the left sidebar (under **In-App Purchases**).
2. Click **Create** next to Subscription Groups.
3. Create one group:
   - Reference Name: `Chaos Creatures Subscription Tiers`
   - This group will contain both Mid Tier and Top Tier subscriptions.
4. Click **Create**.

### 4c. Create Mid Tier Monthly Subscription

Inside the subscription group:

1. Click **+** to add a subscription.
2. Fill in:
   - Reference Name: `Mid Tier Monthly`
   - Product ID: `cc_mid_monthly_699` (copy exactly — no spaces)
3. Click **Create**.
4. On the subscription detail page:
   - Subscription Duration: 1 Month
   - Subscription Price: Click **+** under Prices
     - Select US base price: $6.99
     - Click **Proceed** to auto-fill other territories or set manually per Section 8 (Pricing Localization)
   - Display Name: `Chaos Creatures Mid Tier`
   - Description: `Expand your collection to 100 cards per faction, unlock 3 modifier choices at each evolution, and earn 50% more Chaos Dust from quests.`
   - Localization: Add localizations for any regions you support (see Section 8)
   - Review Screenshot: Upload a 1242x2208 PNG showing the subscription benefits screen in-app. This is required by Apple.
5. Scroll to **App Store Promotional Offer** — skip for now (configure after launch).
6. Click **Save**.

### 4d. Create Mid Tier Annual Subscription

Repeat the process inside the same subscription group:

1. Click **+** to add another subscription.
2. Fill in:
   - Reference Name: `Mid Tier Annual`
   - Product ID: `cc_mid_annual_5599`
3. On detail page:
   - Subscription Duration: 1 Year
   - Price: $55.99 USD
   - Display Name: `Chaos Creatures Mid Tier (Annual)`
   - Description: `Everything in Mid Tier, billed annually. Save $28 compared to monthly.`
4. Click **Save**.

### 4e. Create Top Tier Monthly Subscription

Repeat inside the same subscription group:

1. Product ID: `cc_top_monthly_1299`
2. Duration: 1 Month
3. Price: $12.99 USD
4. Display Name: `Chaos Creatures Top Tier`
5. Description: `The full collector experience. 200 cards per faction, 4 modifier choices at evolution, 2-pass premium art, 1 free Legendary Shard monthly, and 100% Chaos Dust quest bonus.`

### 4f. Create Top Tier Annual Subscription

1. Product ID: `cc_top_annual_9999`
2. Duration: 1 Year
3. Price: $99.99 USD
4. Display Name: `Chaos Creatures Top Tier (Annual)`
5. Description: `Everything in Top Tier, billed annually. Save $56 compared to monthly.`

### 4g. Create Battle Pass (Non-Consumable)

The Battle Pass is not a subscription — it is a one-time non-consumable purchase per season. However, it must be reset each season. This is handled server-side: the Supabase `user_battle_passes` table stores which season each user purchased for. The IAP product itself is permanent but the server checks if the purchase is for the current active season.

1. In your app page, click **In-App Purchases** in the left sidebar.
2. Click **+** > **Non-Consumable**.
3. Fill in:
   - Reference Name: `Battle Pass Season`
   - Product ID: `cc_battle_pass_999`
4. On detail page:
   - Price: $9.99 USD
   - Display Name: `Chaos Creatures Battle Pass`
   - Description: `Unlock 50 tiers of seasonal rewards including exclusive cosmetics, Legendary Shards, Chaos Dust, and Commons.`
5. Click **Save**.

### 4h. Create Cosmetic Products (Non-Consumable)

For each cosmetic product in the IAP product identifier table above, repeat:

1. Click **+** > **Non-Consumable**.
2. Enter Reference Name, Product ID, and pricing per the table.
3. Add Display Name and Description.
4. Click **Save**.

### 4i. Configure Subscription Offer Codes (First-Month Trial)

1. In the subscription group, click on **Mid Tier Monthly**.
2. Scroll to **Offer Codes** > **+**.
3. Create:
   - Offer Reference Name: `first_month_trial_mid`
   - Type: Pay as you go
   - Duration: 1 month
   - Price: $2.99
   - Customer Eligibility: New subscribers only
   - Offer Code: Apple will generate this. Save it — you will show it in-app at conversion moments.

### 4j. App Store Review Information

Apple requires a test account for subscription review. Create a Sandbox tester:

1. In App Store Connect, go to **Users and Access** > **Sandbox Testers**.
2. Click **+** and create a test account: `sandbox-tester@chaoscreatures.com` with a secure password.
3. In your app's review notes, write:
   ```
   Test credentials: sandbox-tester@chaoscreatures.com / [password]
   To test subscriptions: use the test account on a real device.
   Subscriptions are available in the Upgrade screen, accessible from the profile tab > "Upgrade Plan".
   ```

---

## 5. Google Play Console — Subscription Configuration (Step by Step)

Complete these steps after registering for a Google Play Developer account ($25 one-time fee).

### 5a. Create the App in Play Console

1. Go to [play.google.com/console](https://play.google.com/console).
2. Click **Create app**.
3. Fill in:
   - App name: `Chaos Creatures`
   - Default language: English (United States)
   - App or game: Game
   - Free or paid: Free
   - Declarations: Check both (access to children guidelines, US export laws)
4. Click **Create app**.

### 5b. Create Subscriptions

1. In the left sidebar, go to **Monetize** > **Products** > **Subscriptions**.
2. Click **Create subscription**.
3. For Mid Tier Monthly:
   - Product ID: `cc_mid_monthly_699` (copy exactly)
   - Name: `Chaos Creatures Mid Tier`
   - Description: `Expand your collection to 100 cards per faction, unlock 3 modifier choices at each evolution, and earn 50% more Chaos Dust from quests.`
   - Benefits (shown on Play Store subscription page — add 3 bullet points):
     - `100 cards per faction storage`
     - `3 modifier choices at each evolution`
     - `50% bonus Chaos Dust from quests`
4. Under **Base plans**, click **Add base plan**:
   - Base plan ID: `monthly`
   - Billing period: Monthly
   - Pricing: Click **Set price** > Enter `6.99` for USD > Click **Set price for other countries** to configure regional pricing (see Section 8)
   - Auto-renewing: Yes
5. Click **Activate base plan**.
6. Click **Save** and then **Activate** the subscription.

Repeat for:
- `cc_mid_annual_5599` — same structure but Annual billing period, price $55.99
- `cc_top_monthly_1299` — Top Tier, Monthly, $12.99
- `cc_top_annual_9999` — Top Tier, Annual, $99.99

### 5c. Create In-App Products (One-Time Purchases)

1. Go to **Monetize** > **Products** > **In-app products**.
2. Click **Create product**.
3. For each product in the cosmetics/battle-pass list (all non-subscription IAP):
   - Product ID: exactly as shown in Section 3 table
   - Name: Display name
   - Description: Brief description
   - Price: Set per Section 8
   - Status: Active
4. Click **Save**.

### 5d. Configure Introductory Offers (First-Month Trial)

1. Navigate to `cc_mid_monthly_699` subscription.
2. Under **Base plans**, click the monthly plan.
3. Click **Add offer**.
4. Fill in:
   - Offer ID: `first_month_trial`
   - Eligibility: New subscribers
   - Phase 1: 1 month at $2.99
   - After phase 1: Full price auto-renews
5. Click **Save** and **Activate**.

### 5e. Link to RevenueCat

1. In Google Play Console, go to **Setup** > **API access**.
2. Click **Link to a Google Cloud project** > Link to a new project.
3. In Google Cloud Console, create a Service Account with **Pub/Sub Editor** role.
4. Download the JSON key.
5. In RevenueCat dashboard, go to your Android app settings > **Service Credentials** > upload the JSON key.

This allows RevenueCat to validate purchases server-side and receive real-time subscription state changes from Google.

### 5f. Developer Program Policies — Required Declarations

Before publishing, complete all required policy declarations in Play Console:

1. **App content** > **Target audience**: Select age 13+ (or 16+ if implementing strict COPPA). Do not select "Ages 5-8" unless parental controls are built.
2. **App content** > **Subscriptions**: Confirm your app contains subscriptions. Enter the URL to your subscription terms page.
3. **Data safety**: Declare that you collect User ID (Supabase auth), Purchase history (RevenueCat), and App activity (PostHog). All are encrypted in transit. User data can be deleted on request.

---

## 6. Conversion Funnels

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
1. **Grace period.** If a subscription lapses, give a 7-day grace period before enforcing card limits. Store `grace_period_until` in `user_subscriptions`. Prevent accidental lapses from forcing painful deletions.
2. **Downgrade warnings.** If a player tries to cancel Top tier, display: "You have [N] cards in [Faction]. Downgrading to Mid tier will require you to delete [N-100] cards. Are you sure?" Pull N from Supabase `card_instances` count.
3. **Win-back.** If a player cancels, RevenueCat fires a `CANCELLATION` webhook. The Supabase Edge Function enqueues a PostHog event. A win-back email is sent 14 days post-cancellation via Supabase auth email with a RevenueCat offer code for 50% off one month.
4. **Annual discount.** Annual subscriptions are shown at 2-months-free pricing (10-month price for 12 months). Surface the annual option prominently on the subscription paywall screen.

### Retention Metrics to Track in PostHog

- Monthly Churn Rate (MCR): % of subscribers who cancel each month. Target: <5% Mid tier, <3% Top tier.
- LTV per subscriber: Target $80+ Mid tier (12+ months), $180+ Top tier (14+ months).
- Conversion Rate: % of free players who convert within 30 days. Target: 6-8%.
- Upgrade Rate: % of Mid-tier subscribers who upgrade to Top within 6 months. Target: 20-30%.
- Nudge conversion rate: % of conversion nudges shown that result in a purchase within 7 days. PostHog funnel: `nudge_shown` → `paywall_opened` → `purchase_completed`.

---

## 7. Battle Pass / Season System

### Season Length

**8 weeks per season (2 months).**

Rationale: Long enough for casual players to complete the free track (1-2 games/day can finish it). Short enough to maintain urgency. Aligns with 6-season-per-year content cadence. Matches the 8-week ladder season length already established in `04-progression-economy.md`.

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
- Price: $9.99 USD (IAP product ID: `cc_battle_pass_999`)

| Tier Range | Free Track Reward | Premium Track Reward |
|---|---|---|
| Tiers 1-5 | 30 Dust per tier | 50 Dust per tier |
| Tier 6-10 | 30 Dust per tier (Uncommon Shard at tier 10) | Rare Shard at tier 6, 50 Dust x4 |
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

The Battle Pass is a non-consumable IAP (`cc_battle_pass_999`). The server stores:

```sql
-- In Supabase
CREATE TABLE user_battle_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  season_id integer NOT NULL,  -- e.g., 1, 2, 3
  is_premium boolean DEFAULT false,
  current_tier integer DEFAULT 0,
  current_xp integer DEFAULT 0,
  purchased_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, season_id)
);
```

When RevenueCat fires a purchase webhook for `cc_battle_pass_999`, the Edge Function sets `is_premium = true` for the user's current season row. Because the IAP is non-consumable, Apple and Google will not re-charge for the same product ID across seasons. Each new season, the backend creates a new row for all users — a new season is a new database record, not a new IAP product.

This means: **the same product ID `cc_battle_pass_999` is used every season**. The server determines which season it counts for based on the purchase timestamp vs. the active season date range stored in `seasons` table.

---

## 8. Cosmetics Revenue

All cosmetics are direct purchases with transparent pricing — no loot boxes.

### Cosmetic Categories and Pricing

#### Card Backs

Card backs replace the default card back visual when cards are in hand or deck.

**Launch inventory:**
- 1 starter back: free (generic)
- 3 faction-themed backs per faction (9 total): earned via Faction Mastery milestones, not purchasable
- 6 premium backs per faction (18 total): direct purchase

**Pricing:**
- Standard premium card back: $1.99 (product ID prefix: `cc_cardback_standard_`)
- Legendary premium card back (animated with particle effects): $2.99 (prefix: `cc_cardback_legendary_`)
- Bundle (3 card backs): $4.99 — implemented as a separate non-consumable product `cc_cardback_bundle_499`

**Revenue estimate:**
- 10% of players buy 1 card back at $1.99: $0.199 ARPU
- 3% of players buy a bundle at $4.99: $0.15 ARPU
- Total card back ARPU: ~$0.20-$0.35

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
- Standard board: $2.99 (`cc_board_standard_299`)
- Legendary board (advanced animations + ambient audio): $3.99 (`cc_board_legendary_399`)
- All 3 faction boards bundle: $7.99 (`cc_board_bundle_faction_799`)

#### Avatar Frames and Effects

Avatar frames surround the player's avatar portrait during battle. Effects include animated borders, particle auras, and entrance animations.

**Launch inventory:**
- 3 basic frames: free, earned via Player Level milestones
- 6 ornate frames per faction (18 total): Mid-tier subscription exclusive (no direct purchase)
- 6 Legendary frames per faction (18 total): Top-tier subscription exclusive (no direct purchase)
- 12 premium standalone frames (holiday/event/achievement): direct purchase

**Pricing:**
- Premium frame: $1.99 (`cc_frame_standard_199`)
- Legendary animated frame: $2.99 (`cc_frame_legendary_299`)

#### Card Reveal Animations

When a card is drawn or played, a brief animation plays.

**Launch inventory:**
- 1 default animation: free
- 6 premium animations (fire, frost, lightning, shadow, radiant, void): direct purchase at $1.99 each

**Product IDs:**
- `cc_reveal_fire_199`, `cc_reveal_frost_199`, `cc_reveal_lightning_199`, `cc_reveal_shadow_199`, `cc_reveal_radiant_199`, `cc_reveal_void_199`

### Total Cosmetics ARPU

Estimated cosmetics ARPU: $0.65-$0.95 per player over lifetime. Secondary to subscription revenue but meaningful at scale (at 100K players: $65K-$95K in cosmetics revenue over time).

### Cosmetics Admin UI

The owner needs a simple way to add new cosmetics to the store without touching the database directly. The admin UI for the cosmetics store lives at the `/admin` route (Supabase Dashboard or a custom Next.js admin page).

**Cosmetic record creation:**
1. Owner opens the admin UI.
2. Fills in: Name, Category, Faction, IAP Product ID, Price, Preview Image URL (uploaded to Cloudflare R2), Description.
3. Clicks **Create**. The admin UI writes to the `cosmetics` Supabase table. The item appears in the in-app store immediately (no deploy required).

The `cosmetics` table schema:
```sql
CREATE TABLE cosmetics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('card_back', 'board', 'avatar_frame', 'reveal_animation')),
  faction text CHECK (faction IN ('ironwright', 'fey', 'demonic', 'universal')),
  iap_product_id text UNIQUE NOT NULL,
  price_usd numeric(5,2) NOT NULL,
  preview_image_url text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

---

## 9. Revenue Projections and Financial Model

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
- Store commission: 30% Apple/Google cut applied. Revenue figures below are **net after store fees**.

| DAU | Paying Users (7%) | Mid (65%) | Top (30%) | Monthly Gross | Net After 30% Store Fee |
|---|---|---|---|---|---|
| 10,000 | 700 | 455 @ $6.99 | 210 @ $12.99 | $12,540 | **$8,778** |
| 50,000 | 3,500 | 2,275 @ $6.99 | 1,050 @ $12.99 | $62,700 | **$43,890** |
| 100,000 | 7,000 | 4,550 @ $6.99 | 2,100 @ $12.99 | $125,401 | **$87,781** |
| 500,000 | 35,000 | 22,750 @ $6.99 | 10,500 @ $12.99 | $627,005 | **$438,904** |

Note: Apple reduces commission to 15% for developers earning under $1M/year (Small Business Program). Enroll at [developer.apple.com/app-store/small-business-program](https://developer.apple.com/app-store/small-business-program). This meaningfully improves margins at early scale.

### AI Generation Cost Offset (fal.ai)

**Cost per evolution:**
- Free player: ~$0.02 (FLUX Kontext Dev)
- Subscriber: ~$0.04 (FLUX Kontext Pro)

**Monthly evolution volume estimates:**
- Free player: 10-15 evolutions/month = $0.20-$0.30 in fal.ai costs
- Mid Tier subscriber: 25 evolutions/month = $1.00 in fal.ai costs
- Top Tier subscriber: 40 evolutions/month = $1.60 in fal.ai costs

**AI cost analysis:**

| Segment | Monthly Subscription Revenue | Monthly fal.ai Cost | Margin After AI |
|---|---|---|---|
| Free player | $0 | $0.25 | -$0.25 (loss leader) |
| Mid Tier subscriber | $6.99 | $1.00 | $5.99 (86% margin) |
| Top Tier subscriber | $12.99 | $1.60 | $11.39 (88% margin) |

**Monthly fal.ai costs at scale:**
- 10K DAU: ~$3,900/month
- 50K DAU: ~$19,500/month
- 100K DAU: ~$39,000/month
- 500K DAU: ~$195,000/month

**Revenue vs. fal.ai costs (net revenue after store fee and AI):**
- At 10K DAU: $8,778 net revenue - $3,900 AI costs = **$4,878** (56% margin after AI)
- At 50K DAU: $43,890 net revenue - $19,500 AI costs = **$24,390** (56% margin after AI)
- At 100K DAU: $87,781 net revenue - $39,000 AI costs = **$48,781** (56% margin after AI)
- At 500K DAU: $438,904 net revenue - $195,000 AI costs = **$243,904** (56% margin after AI)

### Infrastructure Cost Estimate (Actual Stack)

Monthly infrastructure costs at each scale level:

| Service | 10K DAU | 50K DAU | 100K DAU |
|---|---|---|---|
| Supabase (Pro plan) | $25 | $25 (scale up at ~50K) | $599 (Team plan) |
| Railway (game server, auto-scale) | $50-100 | $200-400 | $400-800 |
| Cloudflare R2 (card art storage + CDN) | $5 | $25 | $50 |
| OpenAI (GPT-4o Mini for card text) | $20 | $100 | $200 |
| PostHog (Cloud) | $0 (free up to 1M events) | $50 | $150 |
| RevenueCat | $0 (free under $2,500 MRR) | $99 | $299 |
| **Total Infrastructure** | **~$100-$150** | **~$500-$700** | **~$1,700-$2,100** |

These are substantially lower than the generic "$5,000-$10,000" infrastructure estimate in the previous doc version because the committed stack (Supabase, Railway, Cloudflare R2) is far more cost-efficient than general cloud at this scale.

### Break-Even Analysis

**Revised fixed costs (solo operator model, no engineering team):**
- Infrastructure (per above): $100-$2,100/month (scale-dependent)
- Apple Developer Program: $99/year = $8.25/month
- Google Play Developer: $25 one-time (negligible monthly)
- RevenueCat: $0-$299/month (free until $2,500 MRR, then percentage-based)
- Optional: Community/social manager at $2,000-$3,000/month
- **Total monthly fixed costs: $200-$5,500/month** (scale-dependent, no salary)

**Break-even DAU (solo operator, all-in infrastructure only):**
- Net revenue per DAU after AI costs: ~$0.49/month
- At $500/month total fixed costs (50K DAU level): $500 / $0.49 = ~**1,020 DAU**
- This is reachable very early. The business is operationally profitable at ~1,000 active paying users.

**If hiring a part-time community manager ($3,000/month):**
- Break-even: $3,500 / $0.49 = ~**7,150 DAU**
- Still reachable within a few months of launch.

---

## 10. Anti-Predatory Design

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

**Why this matters:** Loot boxes trigger compulsive gambling behavior in vulnerable players. Many countries regulate them as gambling (Belgium, Netherlands). By making card acquisition deterministic and free-currency-only, we eliminate this risk entirely and the associated regulatory exposure.

### 2. Spending Caps and Warnings

**Implementation — stored in Supabase `user_spending_controls` table:**

```sql
CREATE TABLE user_spending_controls (
  user_id uuid REFERENCES auth.users PRIMARY KEY,
  monthly_spend_limit_usd numeric(8,2) DEFAULT 50.00,
  weekly_spend_limit_usd numeric(8,2) DEFAULT 30.00,
  caps_enabled boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);
```

**Behavior:**
- After $30 in purchases in any rolling 7-day period: display a confirmation sheet before the next purchase: "You have spent $30 this week on Chaos Creatures. Continue?"
- After $50 in purchases in any rolling 30-day period: same confirmation, with the addition of "You can set a monthly limit in Settings."
- Players can disable caps in Settings > Account > Spending Controls. Disabling requires a confirmation tap and is logged to PostHog as `spending_cap_disabled`.
- RevenueCat purchase webhooks update a running spend total in Supabase. The client checks the total before presenting the purchase confirmation sheet.

### 3. Parental Controls

**For accounts created by users identifying as under 18:**
- Require parental approval (via linked parent email) for any purchase over $5.
- Default spending cap: $20/month for accounts under 13, $50/month for accounts ages 13-17.
- Parent can view purchase history and set custom limits via a web portal at `chaoscreatures.com/parental-controls`.

**iOS and Android integration:**
- Respect Apple Screen Time and Google Family Link restrictions automatically — RevenueCat purchase calls will fail gracefully if the platform rejects the purchase due to parental controls.
- In the app's age gate (first launch), if the user enters a birth year indicating they are under 13, flag the account in Supabase and apply COPPA-compliant defaults (no purchase without parental consent).

**COPPA compliance note:** If the app is available to users under 13, it must comply with COPPA in the US. The safest approach at launch is to set the minimum age to 13 in both app stores and in the age gate UI, which bypasses most COPPA obligations. Document this decision.

### 4. Transparent Odds and Rates

**For any element with randomness:**
- Card pack contents: Show "Each pack contains 3 Commons. Duplicate protection active after 2 copies owned." on the pack purchase screen.
- Evolution outcomes: Show "70% chance of Chaos evolution, 30% chance of Order evolution" on the evolution confirmation screen.
- Modifier selection pool: Show full pool identifier and contents on the modifier selection screen.

**Apple App Store requirement:** For any "loot box" mechanic, Apple requires disclosure of drop rates before purchase. Our card packs do not qualify as loot boxes (fixed guaranteed contents, purchased with free currency), but we disclose anyway for trust.

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
- Players can cancel at any time via platform subscription management (iOS Settings > Apple ID > Subscriptions, or Google Play > Subscriptions).
- Subscription benefits remain active until end of current billing period (no immediate shutoff).
- If a player cancels within 48 hours of initial subscription, offer a full refund via in-app "Contact Support" button which opens a pre-filled email: `support@chaoscreatures.com?subject=Refund%20Request`.

**For cosmetic purchases:**
- 7-day refund window via support ticket.
- No refund after 7 days or if the cosmetic has been used in 5+ battles.

---

## 11. Pricing Localization

### Regional Pricing Tiers

Use Apple's and Google's built-in pricing tier systems. Both platforms auto-convert a base USD price to all currencies, but you can override per-region. The values below are the overrides to enter manually.

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
2. Under **Subscription Price**, click **Set Prices**.
3. Choose base country (United States).
4. After setting USD price, click **Proceed** — Apple will auto-suggest equivalent prices in all currencies.
5. Review and adjust Tier 2 and Tier 3 markets by clicking each territory and entering the values from the tables above.
6. Click **Confirm** and **Save**.

### How to Set Regional Prices in Play Console

1. In Play Console, open any subscription or in-app product.
2. Under **Pricing**, click **Set price** for USD first.
3. Click **Set price for other countries** to expand the full territory list.
4. Enter values for each territory from the tables above.
5. Click **Update**.

### Currency Handling

- Always show prices in the user's local currency (detected via platform).
- Both Apple and Google handle local currency display, tax calculation, and payment processing.
- Review and adjust regional pricing quarterly based on significant exchange rate movements (more than 20% vs. USD).
- Prices shown are inclusive of taxes where required (EU VAT, etc.). Platforms handle tax remittance — the developer receives net revenue.

---

## 12. Monetization Roadmap and Future Opportunities

### Year 1 Priorities

**Months 1-3 (Launch):**
- Focus: Prove free-to-paid conversion. Target 6-8% conversion rate.
- Tactics: First-month discount offers, evolution moment upsells, deck slot friction nudges.
- Revenue target: 10K DAU, $8K-$10K/month net.

**Months 4-6 (Growth):**
- Focus: Scale user base, introduce first battle pass.
- Tactics: User acquisition, influencer partnerships, first seasonal content drop.
- Revenue target: 50K DAU, $40K-$50K/month net.

**Months 7-12 (Maturity):**
- Focus: Optimize conversion funnels, introduce cosmetics store.
- Tactics: A/B test subscription pricing, launch cosmetics bundles, introduce annual subscription.
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
- Requires Top Tier subscription or a one-time $4.99 Prestige unlock per card.

---

## 13. Success Metrics and KPIs

### Core Monetization KPIs (Tracked in PostHog)

| Metric | Target Month 1 | Target Month 6 | Target Month 12 |
|---|---|---|---|
| Conversion Rate (Free to Paid) | 4-5% | 6-7% | 7-9% |
| ARPU (All Players) | $0.60-$0.80 | $0.85-$1.10 | $1.20-$1.60 |
| ARPPU (Paying Players Only) | $8-$12 | $10-$15 | $12-$18 |
| Monthly Churn Rate (Subscribers) | 8-10% | 5-7% | 3-5% |
| DAU | 5K-10K | 40K-60K | 100K-150K |

### PostHog Events to Fire

The client must fire these PostHog events. Claude Code will implement them in the corresponding screens.

| Event Name | When to Fire | Properties |
|---|---|---|
| `paywall_shown` | Any paywall or upgrade screen is displayed | `trigger_reason`, `current_tier`, `screen_name` |
| `paywall_dismissed` | User closes paywall without purchasing | `trigger_reason`, `current_tier` |
| `purchase_started` | User taps a buy button | `product_id`, `price_usd` |
| `purchase_completed` | RevenueCat confirms purchase | `product_id`, `price_usd`, `new_tier` |
| `purchase_failed` | Purchase flow returns an error | `product_id`, `error_code` |
| `subscription_cancelled` | RevenueCat webhook fires CANCELLATION | `tier`, `months_subscribed` |
| `nudge_shown` | A conversion nudge banner or sheet appears | `nudge_type`, `context` |
| `nudge_dismissed` | User dismisses a nudge | `nudge_type` |
| `spending_cap_warning_shown` | Spending cap threshold reached | `cap_type` (weekly/monthly), `amount_usd` |

---

## Conclusion

Chaos Creatures' monetization strategy is built on three core principles:

1. **No real money on individual cards.** This eliminates gambling mechanics, creates a fair playing field, and builds trust.
2. **Subscriptions enhance the experience, not the power.** Modifier selection depth, art quality, and collection growth are the monetization levers — all meaningful, none pay-to-win.
3. **Sustainable economics.** AI generation costs (fal.ai) are more than covered by subscription revenue at scale. Free players are a sustainable loss leader.

With an expected 7-9% conversion rate, $1.20-$1.60 ARPU at maturity, and 56% margin after AI costs, Chaos Creatures achieves profitability at a modest DAU and can scale to a multi-million-dollar annual revenue business at 500K+ DAU.

The monetization model respects players, avoids predatory mechanics, and aligns revenue with value delivered.

---

**Document version:** 2.0
**Last updated:** 2026-02-16
**Owner:** Monetization and Economy Design

---

## Revision Log

The following changes were made during the revision from v1.0 to v2.0 to ensure the document is directly implementable by Claude Code without any engineering judgment calls, manual processes, or ambiguous recommendations.

### Section 2 (New): IAP Library Decision: RevenueCat
- **Added.** The previous document did not specify which IAP library to use. This section makes an explicit, committed decision: RevenueCat (not expo-in-app-purchases), with full reasoning.
- **Added** exact npm install command with package names.
- **Added** step-by-step RevenueCat account setup instructions (project creation, platform apps, entitlement definitions).
- **Added** complete TypeScript client initialization code for `/src/services/purchases.ts`.
- **Added** complete `useEntitlements` React hook for `/src/hooks/useEntitlements.ts`.
- **Added** RevenueCat webhook integration instructions (webhook URL, event types to handle, Supabase Edge Function requirements).
- **Added** RevenueCat + PostHog integration configuration steps.

### Section 3 (Subscription Tiers): IAP Product Identifiers Table
- **Added** explicit IAP product identifier table with exact strings for every purchasable product — both App Store and Google Play. Previous version had no product IDs anywhere in the document.
- **Added** annual subscription products (`cc_mid_annual_5599`, `cc_top_annual_9999`) that were not in v1.0.
- **Added** cosmetic product IDs for all individual cosmetic items.

### Section 4 (New): App Store Connect Configuration (Step by Step)
- **Added entirely.** Previous version said "Use Apple App Store native IAP" with no setup instructions. This section provides field-by-field configuration: app creation, subscription group creation, each subscription product with exact field values, battle pass as non-consumable, offer codes for first-month trial, sandbox tester setup, and review notes.

### Section 5 (New): Google Play Console Configuration (Step by Step)
- **Added entirely.** Previous version said "Use Google Play native IAP" with no setup instructions. This section provides: app creation, subscription creation with base plans, in-app product creation, introductory offer setup, service account linking to RevenueCat, and required policy declarations (Data Safety, Target Audience, Subscriptions declaration).

### Section 6 (Conversion Funnels): In-App Conversion Tactics Table
- **Replaced** generic bullet-point descriptions with a concrete trigger/UI/CTA table that Claude Code can implement directly.
- **Added** 30-day nudge suppression logic with `user_nudge_suppression` Supabase table reference.
- **Added** specific PostHog funnel definition for nudge conversion tracking.

### Section 7 (Battle Pass): Server-Side Logic and SQL Schema
- **Added** SQL schema for `user_battle_passes` table.
- **Added** explicit explanation of how one non-consumable IAP product ID is reused across seasons server-side, resolving the ambiguity of how a non-consumable battle pass works per season.

### Section 8 (Cosmetics): Admin UI Specification and Cosmetics Table Schema
- **Added** specification for cosmetics admin UI (how the owner adds cosmetics without touching the database directly).
- **Added** `cosmetics` Supabase table SQL schema.
- **Added** explicit product IDs for all cosmetic variant items (reveal animations per element type).

### Section 9 (Revenue Projections): Infrastructure Costs Updated to Actual Stack
- **Replaced** generic "$5,000-$10,000/month cloud infrastructure" estimate with actual cost estimates for the committed stack (Supabase, Railway, Cloudflare R2, OpenAI, PostHog, RevenueCat).
- **Added** note about Apple Small Business Program (15% vs 30% commission under $1M/year) and how to enroll.
- **Revised** break-even analysis to reflect solo-operator model (no engineering team salaries) — previous version assumed a 6-person team costing $60,000/month.
- **Added** 30% store fee applied to all revenue figures to make them net figures.

### Section 11 (Pricing Localization): Explicit Currency Tables
- **Replaced** generic "~$4.99 USD equivalent" descriptions with explicit per-currency price tables for all major markets and all subscription products.
- **Added** step-by-step instructions for setting regional prices in both App Store Connect and Play Console.

### Section 13 (New): PostHog Events Table
- **Added** explicit table of all PostHog events that must be fired, with event names, trigger conditions, and required properties. Previous version mentioned PostHog tracking in general terms only.

### Throughout: Technology Specificity
- **Replaced** all references to generic cloud (AWS, GCP, CloudFront) with the committed stack from CLAUDE.md (Supabase, Railway, Cloudflare R2, fal.ai, PostHog).
- **Removed** "engineers should decide" and "consider X" language throughout.
- **Removed** assumption of a 6-person engineering team from the break-even model.
