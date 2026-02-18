# App Store Submission Checklist

Complete each item in order before submitting Chaos Creatures for App Store review.

---

## Xcode Project Configuration

- [ ] **Set Development Team** - Open Xcode > ChaosCreatures target > Signing & Capabilities > set Team to your Apple Developer account
- [ ] **Verify Bundle ID** - Confirm it is `com.chaoscreatures.app` (already set in project)
- [ ] **Set Version to 1.0.0** - In Info.plist, change `CFBundleShortVersionString` from `0.1.0` to `1.0.0`
- [ ] **Verify Build Number** - Confirm `CFBundleVersion` is `1` (already set)
- [ ] **Verify Deployment Target** - Confirm iOS 17.0 minimum (already set)
- [ ] **Verify Entitlements** - `ChaosCreatures.entitlements` should include `com.apple.developer.in-app-purchases` (already created)
- [ ] **Verify Privacy Manifest** - `PrivacyInfo.xcprivacy` is included in the project and Resources build phase (already added)
- [ ] **Verify ITSAppUsesNonExemptEncryption** - Set to NO in Info.plist (already added, avoids export compliance upload dialog)
- [ ] **Test on Physical Device** - Build and run on a real iPhone to verify everything works (Simulator is not sufficient for StoreKit testing)

## App Store Connect Setup

- [ ] **Create App in App Store Connect** - Go to [App Store Connect](https://appstoreconnect.apple.com) > My Apps > New App
  - Platform: iOS
  - Name: Chaos Creatures
  - Primary Language: English (U.S.)
  - Bundle ID: `com.chaoscreatures.app`
  - SKU: `chaoscreatures001`

## Build & Upload

- [ ] **Archive the Build** - Xcode > Product > Archive (make sure a real device or "Any iOS Device" is selected, not a Simulator)
- [ ] **Upload to App Store Connect** - In the Xcode Organizer, select the archive > Distribute App > App Store Connect > Upload
- [ ] **Wait for Processing** - Apple processes the build (usually 15-30 minutes). You will get an email when it is ready.

## App Store Listing

- [ ] **App Name** - "Chaos Creatures"
- [ ] **Subtitle** - "AI-Generated Card Battles" (max 30 characters)
- [ ] **Category** - Primary: Games > Card. Secondary: Games > Strategy
- [ ] **Description** - Write or paste the App Store description (see below)
- [ ] **Keywords** - `card game, collectible, CCG, TCG, AI, chaos, creatures, battle, deck builder, strategy` (max 100 characters total, comma separated)
- [ ] **Promotional Text** - Optional, can be updated anytime without review: "Build decks. Roll for chaos. Evolve your creatures."
- [ ] **Support URL** - Link to a support page or email (`mailto:support@chaoscreatures.app`)
- [ ] **Marketing URL** - Optional, leave blank if no website yet

## Screenshots

- [ ] **iPhone 6.7" (iPhone 15 Pro Max)** - At least 3 screenshots, recommended 5-8:
  1. Home screen / collection overview
  2. Battle scene with cards on board
  3. Chaos Roll D20 moment
  4. Card detail / evolution reveal
  5. Deck builder
  - Capture from Xcode Simulator: iPhone 15 Pro Max, 6.7-inch display (2796 x 1290 portrait)
- [ ] **iPhone 6.5" (iPhone 11 Pro Max)** - Required if supporting older devices. Same screenshots at 2688 x 1242.
- [ ] **iPad Pro 12.9" (6th gen)** - Required if app runs on iPad. 2048 x 2732.

## Privacy & Legal

- [ ] **Privacy Policy URL** - Host `legal/privacy-policy.html` at a public URL and enter it in App Store Connect
  - Options: GitHub Pages, Cloudflare Pages, or any static hosting (free)
  - Example: `https://chaoscreatures.app/privacy-policy.html`
- [ ] **Terms of Service URL** - Host `legal/terms-of-service.html` at the same location
  - Example: `https://chaoscreatures.app/terms-of-service.html`

## App Privacy (Nutrition Labels)

Fill out the App Privacy section in App Store Connect. Based on actual data collection:

- [ ] **Contact Info** - Email Address
  - Collected: Yes
  - Linked to User: Yes
  - Used for Tracking: No
  - Purpose: App Functionality
- [ ] **Identifiers** - User ID
  - Collected: Yes
  - Linked to User: Yes
  - Used for Tracking: No
  - Purpose: App Functionality
- [ ] **Purchases** - Purchase History
  - Collected: Yes
  - Linked to User: Yes
  - Used for Tracking: No
  - Purpose: App Functionality
- [ ] **Usage Data** - Product Interaction
  - Collected: Yes
  - Linked to User: Yes
  - Used for Tracking: No
  - Purpose: Analytics

## Age Rating

Complete the age rating questionnaire in App Store Connect:

- [ ] **Cartoon or Fantasy Violence** - Infrequent/Mild (card battles with creatures)
- [ ] **Realistic Violence** - None
- [ ] **Prolonged Graphic or Sadistic Realistic Violence** - None
- [ ] **Profanity or Crude Humor** - None
- [ ] **Mature/Suggestive Themes** - None
- [ ] **Horror/Fear Themes** - Infrequent/Mild (Demonic faction has dark fantasy art)
- [ ] **Medical/Treatment Information** - None
- [ ] **Alcohol, Tobacco, or Drug Use** - None
- [ ] **Simulated Gambling** - Infrequent/Mild (card pack opening, Chaos Roll is random but not gambling)
- [ ] **Sexual Content and Nudity** - None
- [ ] **Unrestricted Web Access** - No
- [ ] **Gambling with Real Currency** - No

Expected rating: **9+** or **12+**

## In-App Purchases

- [ ] **Create IAP Products** in App Store Connect > In-App Purchases:
  - Auto-Renewable Subscriptions (create a subscription group "Chaos Pass"):
    - Chaos Pass Mid Tier (monthly)
    - Chaos Pass Top Tier (monthly)
  - Consumable purchases (if applicable):
    - Chaos Dust packs at various price points
- [ ] **Set Pricing** for each IAP product
- [ ] **Add Localized Descriptions** for each IAP product
- [ ] **Submit IAP for Review** - IAP products must be submitted alongside the app

## Pricing & Availability

- [ ] **Price** - Free
- [ ] **Availability** - All territories (or select specific countries)
- [ ] **Pre-Orders** - Optional, skip for initial launch

## Final Review

- [ ] **Test the Archive Build** - Install the archived IPA on a test device via TestFlight
- [ ] **Verify all screens load** without crashes
- [ ] **Verify Sign in with Apple** works end-to-end
- [ ] **Verify practice match** plays through without errors
- [ ] **Verify in-app purchases** appear correctly (sandbox testing)
- [ ] **Check for placeholder text** - Search entire app for "TODO", "placeholder", "lorem ipsum"
- [ ] **Review app for compliance** with [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

## Submit for Review

- [ ] **Select Build** in App Store Connect > App Store tab > select the uploaded build
- [ ] **Add App Review Notes** - "This is a collectible card game with AI-generated card art. All card art is generated server-side. Practice match mode is available without network connection for testing. Sign in with Apple is required for full features."
- [ ] **Submit for Review** - Click Submit for Review

---

## Suggested App Store Description

```
Build decks. Roll for chaos. Evolve your creatures.

Chaos Creatures is a collectible card game where every card is a unique work of AI-generated art. Build strategic decks from three rival factions, battle other players in real-time matches, and evolve your creatures into more powerful forms through gameplay.

ROLL THE CHAOS DIE
Every turn begins with a D20 Chaos Roll. Low rolls bring Order events that stabilize the battlefield. High rolls unleash Chaos events that can turn the tide of battle. Your instability rating determines how wild things get.

THREE FACTIONS, THREE PHILOSOPHIES
- Ironwright Collective: Masters of augmentation and mechanical precision
- Fey Courts: Wielders of natural bonds and symbiotic magic
- Demonic Kingdoms: Commanders of corruption and dark power

EVOLVE YOUR CARDS
Every card in your deck earns evolution energy through battle. When a card evolves, its art transforms, its stats shift, and it gains new abilities. Your collection grows and changes the more you play.

STRATEGIC DEPTH
Declare attackers, assign blockers, and manage your mana in MTG-style combat. Seven keywords (Shield, Lifesteal, Flying, Reach, Deathtouch, Taunt, Piercing) create deep strategic possibilities.

FAIR PLAY
Chaos Creatures is not pay-to-win. Every card is earnable through gameplay. Subscriptions offer cosmetic variety, never power.

Download now and unleash chaos.
```

---

## Hosting Legal Pages

The privacy policy and terms of service HTML files are in the `legal/` directory. To host them for free:

### Option A: GitHub Pages
1. Push the `legal/` folder to a public GitHub repo (or this repo if public)
2. Go to repo Settings > Pages > Deploy from branch (main, /legal folder)
3. URLs will be: `https://<username>.github.io/<repo>/legal/privacy-policy.html`

### Option B: Cloudflare Pages
1. Connect the repo to Cloudflare Pages
2. Set build output directory to `legal/`
3. Deploy — URLs will be assigned automatically

### Option C: Custom Domain
1. If you own `chaoscreatures.app`, point it to any static host
2. URLs: `https://chaoscreatures.app/privacy-policy.html`
