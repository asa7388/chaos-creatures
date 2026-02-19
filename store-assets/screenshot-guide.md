# App Store Screenshot Capture Guide

## Required Device Sizes

App Store Connect requires screenshots at specific display sizes. At minimum, one set is required for the largest device in each device family.

| Display Size | Device | Required | Pixel Dimensions |
|-------------|--------|----------|-----------------|
| 6.7-inch | iPhone 15 Pro Max / iPhone 16 Pro Max | **Required** | 1290 x 2796 |
| 6.1-inch | iPhone 15 Pro / iPhone 16 Pro | Recommended | 1179 x 2556 |

**Note**: App Store Connect accepts 6.7-inch screenshots and automatically scales them for smaller devices. Capturing at 6.7-inch is sufficient for submission, but 6.1-inch screenshots are recommended for visual accuracy across device sizes.

## Screenshots to Capture (6 total)

### Screenshot 1: Home Screen
**What to show**: The Home tab with the player's faction displayed, quick-play buttons, and the overall dashboard feel.
**Setup**:
- Use a player account with a chosen faction (not the onboarding state)
- Ensure the player has a realistic username (not "Player 1" or "Test User")
- Have some Chaos Dust and shards visible in the header
- Show the faction's visual theme (Ironwright Collective recommended for first screenshot — brutalist space-industrial aesthetic stands out)

**Overlay text suggestion**: "Roll the Chaos Die. Shape Your Fate."

### Screenshot 2: Collection
**What to show**: The card collection grid with faction tabs, multiple cards at different rarities, and faction-themed card frames.
**Setup**:
- Populate the account with 15-20 cards across at least 2 rarity tiers (Common + Uncommon minimum, Rare preferred)
- Show the faction tab bar at the top
- Cards should display their frames, art, and rarity indicators
- Scroll position: show the top of the grid so the UI chrome is visible

**Overlay text suggestion**: "Every Card Is Unique. Every Collection Is Yours."

### Screenshot 3: Card Detail
**What to show**: A single card in full detail view with the card frame, AI-generated art, stats (attack/health/CM cost), abilities, keywords, and flavor text.
**Setup**:
- Use a visually striking card (Rare or Epic tier preferred for visual impact)
- Ensure the card has at least one keyword and one triggered ability to show depth
- The card's art should be one of the higher-quality generated images

**Overlay text suggestion**: "AI-Generated Art That Evolves Through Play"

### Screenshot 4: Battle
**What to show**: An active battle with creatures on both sides of the board, cards in hand, the chaos roll indicator, and health totals.
**Setup**:
- Start a practice match against an AI bot
- Play until both sides have 2-3 creatures on the board
- Capture during a visually active moment (after a chaos roll, or during attack declaration with glow effects)
- Ensure the hand has 2-3 cards visible for gameplay context

**Overlay text suggestion**: "Tactical Combat. Unpredictable Chaos."

### Screenshot 5: Evolution
**What to show**: The evolution flow — the moment a card is evolving or the reveal of the new evolved card with transformed art.
**Setup**:
- Have a card ready to evolve (sufficient chaos energy + a Planar Shard of the target tier)
- Trigger the evolution flow and capture the reveal moment
- If the evolution reveal animation is in progress, capture mid-reveal for dramatic effect
- Show the before/after art transformation if the UI supports it

**Overlay text suggestion**: "Evolve Your Cards. Transform Their Art."

### Screenshot 6: Shop
**What to show**: The Shop tab with subscription tiers, card pack offerings, and the Chaos Dust balance.
**Setup**:
- Show the shop in its default state (not mid-purchase)
- Subscription tier cards should be visible with pricing
- Card pack options (Starter, Rare, Epic packs) should be visible
- Planar Shard section visible if it fits

**Overlay text suggestion**: "No Pay-to-Win. All Cards Earnable."

---

## Capture Process

### Using Xcode Simulator

1. **Select the correct device**: In Xcode, choose iPhone 15 Pro Max (6.7-inch) as the run destination.
2. **Build and run**: `Cmd+R` to launch the app in the Simulator.
3. **Set up game state**: Navigate to the screen, ensure realistic data is populated.
4. **Capture screenshot**: In Simulator menu bar: `File > Screenshot` (or `Cmd+S`). Saves to Desktop by default.
5. **Verify dimensions**: Confirm the saved PNG is 1290 x 2796 pixels.

### Using a Physical Device

1. Press `Side Button + Volume Up` simultaneously.
2. Screenshot saves to Photos.
3. AirDrop or transfer to Mac.
4. Verify dimensions match the device's native resolution.

---

## Data Preparation Checklist

Before capturing screenshots, ensure the Simulator or test device has realistic-looking data:

- [ ] Player username is something plausible (e.g., "ChaosKnight", "IronforgeAce") -- not default/test names
- [ ] Player has 15+ cards in their collection across at least 2 rarity tiers
- [ ] Player has a non-zero Chaos Dust balance (e.g., 850 Dust)
- [ ] Player has at least 1-2 Planar Shards
- [ ] At least one card has been evolved (to show evolution history in Card Detail)
- [ ] A deck is built and ready for battle screenshots
- [ ] The faction's card frames and visual theme are applied to cards

---

## Adding Overlay Text (Post-Capture)

App Store screenshots benefit from short marketing text overlaid on the screenshot. Options for adding overlay text:

- **Figma** (free tier): Import screenshots, add text layers with consistent typography
- **Keynote** (free, macOS): Use slide templates at exact pixel dimensions, place screenshot as background, add text
- **Screenshots Pro** (web tool): Online App Store screenshot builder

**Typography recommendations**:
- Font: Cinzel (matches in-game card name font) or SF Pro Display (matches iOS system font)
- Color: White text with a subtle dark drop shadow for readability over game backgrounds
- Position: Top 15-20% of the screenshot, centered
- Keep text to 5-7 words maximum per screenshot

---

## Submission Order

Upload screenshots to App Store Connect in this order (first screenshot is the most prominent in search results):

1. Battle (most visually exciting, shows core gameplay)
2. Card Detail (shows AI-generated art quality)
3. Evolution (shows the unique differentiator)
4. Collection (shows breadth of content)
5. Home Screen (shows clean UI)
6. Shop (shows monetization transparency)

**App Preview Video (Optional)**: A 15-30 second video showing a chaos roll, creature attack, and evolution reveal would significantly boost conversion. Capture from Simulator using QuickTime Player's screen recording feature (`File > New Screen Recording`), crop to device frame, and export as H.264 at the required dimensions.
