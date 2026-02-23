# Landscape iOS Card Game UX Research

**Research Date:** 2026-02-22
**Purpose:** Inform navigation and layout decisions for Chaos Creatures iOS app (landscape-only, iPhone, SwiftUI + SpriteKit)

---

## 1. MTGA (Magic: The Gathering Arena) Mobile

### Navigation Structure
MTG Arena on iOS uses a **top navigation bar with tab labels** — not a bottom tab bar. The main tabs are:
- Home, Profile, Decks, Packs, Store, More (6 tabs total)

This top-bar approach is consistent with MTGA's origin as a desktop application and reflects the fact that all gameplay is landscape-only. The top bar stays anchored in place while content scrolls beneath it. Tab icons appear beside labels horizontally in landscape.

### Active Tab Indicator
Not definitively documented in public sources, but MTGA follows a standard highlighted/selected state using background contrast or an underline indicator on the active tab. The tabs are full-width icons with text labels.

### Navigation Bar Height
MTGA's top navigation bar on mobile is approximately **44–50pt tall** (aligned with Apple's standard navigation bar height of 44pt, with slight padding adjustments for mobile).

### Collection Screen (Card Grid)
MTGA mobile currently displays the collection with a **two-row layout** when in deck-building mode on phones — confirmed by official FAQs noting horizontal deck builder layout (full grid) was flagged as a future improvement target. This suggests the mobile grid may show 2 rows of cards at a time, with scrolling, rather than a full paginated grid. The collection initially shows only owned cards, with filters to expand.

### Battle Screen — Hand Placement
Cards are tucked at the **very bottom of the screen**, accessed by tapping lightly. The hand hovers "just above the thin white iPhone bar that allows a user to swipe out of the app" — meaning the hand sits directly above the iOS home indicator safe area (approximately 34pt from physical bottom on Face ID iPhones).

When holding a card, it expands for better readability. Lands are displayed small and out of the way in the **lower left** corner. The design "uses all available screen real estate for the game" and adapts player avatars to one side rather than centered.

### Known Limitations / Gaps
- Deck editing in landscape mode was not supported at launch and was targeted as an improvement
- Interface was adapted from PC: avatars moved off-center, opponent's hand tucked until needed
- Turn phase indicators are "clearly indicated" along the game zones

**Sources:**
- [MTG Arena Mobile FAQs — Wizards](https://magic.wizards.com/en/news/mtg-arena/mtg-arena-mobile-faqs-2021-01-28)
- [TechRaptor MTG Arena Mobile Preview](https://techraptor.net/tabletop/previews/magic-gathering-arena-mobile-preview)
- [MTGA Zone Interface Guide](https://mtgazone.com/using-arena-interface-and-add-ons/)

---

## 2. Hearthstone Mobile

### Navigation Structure
Hearthstone mobile (iPhone) uses a **hub-based main menu** rather than a persistent tab bar. The main screen is a central hub displaying mode buttons for Hearthstone Classic, Battlegrounds, Tavern Brawl, and a Modes expander (Arena, Duels, Solo Adventures). Secondary navigation items — My Collection, Open Packs, Journal, Shop — are accessible from this hub.

For the iPhone specifically, early versions used **4 tabs arranged along the bottom left and right sides** of the screen, described as "a much clearer presentation of the various sub-menu options." This bilateral arrangement (2 tabs bottom-left, 2 tabs bottom-right) is unusual and reflects Hearthstone's highly branded visual approach where navigation is integrated into the game world aesthetic rather than presented as standard iOS chrome.

### Collection Screen
- Hearthstone collection on desktop uses a multi-column grid; on iPhone the behavior differs substantially
- Phone version uses auto-detected UI based on device screen properties (phone vs. tablet UI)
- Class filter tabs appear at the top of the collection screen
- Search field appears at top of screen

### Battle Screen — Hand Placement
Cards in hand are displayed in the **bottom right corner** of the battle screen (on iPhone). The player taps this area to expand the full hand view. The unique approach: cards are "displayed in a single row" and the player pans horizontally through them, turning each over one at a time. This pan-to-browse design differs from the fan/arc arrangement on desktop or tablet.

On tablet (iPad), the experience is closer to desktop: cards fan across the bottom of the board in a traditional arc. On phone, the condensed single-row scroll is a deliberate phone-specific adaptation for the smaller screen.

### Key Design Insight
Hearthstone's phone UI was described as "almost a complete overhaul to the entire game screen by screen" compared to desktop — the team did not simply scale down the desktop UI but redesigned every screen specifically for the touch + small-screen context.

**Sources:**
- [Hearthstone Main Menu Wiki](https://hearthstone.fandom.com/wiki/Main_menu)
- [Hearthstone on iPhone — Waiting For Rez](https://waitingforrez.wordpress.com/2015/04/15/hearthstone-on-the-iphone/)
- [HearthPwn: The Way Hearthstone Looks on Phone](https://www.hearthpwn.com/forums/hearthstone-general/general-discussion/165310-the-way-hearthstone-looks-on-phone)
- [iPad and Android Patch Changes Wiki](https://hearthstone.fandom.com/wiki/Platform-specific_patch_changes)

---

## 3. Other Games

### Marvel Snap

**Navigation:** Marvel Snap uses a **bottom navigation bar with 5 tabs**: Shop, Collection, Main (home), Season Pass, and News. The tabs are icon-based but have been criticized for using non-universally-recognized icons — players sometimes cannot identify sections without tapping them. This is a documented UX weakness of their implementation.

**Design Philosophy:** The Marvel Snap team explicitly made a design decision to move "a lot more interactable elements closer to the bottom half of the screen to make it easier to tap," reflecting ergonomic research on how players hold phones. The UI aesthetic is "dark piano glass" with holographic button elements.

**Battle Screen Layout:**
- Energy/mana is displayed at the **bottom center** of the screen during matches
- Cards in hand are positioned at the **bottom** of the screen
- The bottom HUD displays a concise set of information
- Location zones are in the middle of the screen
- Cards always take precedence in visual hierarchy — UI elements serve the cards, not the other way around

**Collection Screen:** Deck building was specifically called out as a UX priority — the team was "especially proud of the deck building experience, which is notoriously unintuitive in many card games." The shop was built as a modular system allowing sections to be reordered.

**Orientation:** Marvel Snap runs in portrait mode on mobile. The PC version adopted landscape. As of 2024, the widescreen/landscape UI for Marvel Snap was still in development ("nearly done"). This means Marvel Snap is primarily a portrait-mode game on mobile and is not a direct landscape comparator.

**Sources:**
- [Marvel Snap UI Case Study — Medium](https://medium.com/design-bootcamp/marvels-snap-ui-ux-case-study-9f727d8f3875)
- [Marvel Snap UI Design — Tiffany Smart Portfolio](https://www.tiffanysmart.com/work/marvel-snap)
- [Marvel Snap UX Analysis](https://curaxuan.com/game-ux-marvel-snap-ux-redesign/)
- [TouchArcade: Marvel Snap March 2024 UI Update](https://toucharcade.com/2024/03/13/new-marvel-snap-march-12th-balance-adjustments-patch-notes-update-ui-features/)

### Legends of Runeterra

**Navigation:** The Home tab launches at start. Key UI elements at the top left include the player icon (tapping opens Profile), News, and Weekly Vaults. The main navigation uses a combination of top-area secondary actions and hub-style menu presentation.

**Orientation:** Legends of Runeterra supports both portrait and landscape on mobile. The backgrounds include a parallax tilt effect (device tilt moves background layers).

**Battle Screen:** The UI is designed to be "simple and intuitive." The interface includes standard card game battle zones with the player's board, opponent's board, and hand areas — but specific hand placement details for landscape mode are not thoroughly documented in public sources.

**Sources:**
- [Legends of Runeterra Mobile — Interface In Game](https://interfaceingame.com/games/legends-of-runeterra-mobile/)
- [LoR: How to Play on Phone — Mastering Runeterra](https://masteringruneterra.com/how-to-play-legends-of-runeterra-on-your-phone/)
- [LoR User Interface — GamePressure](https://guides.gamepressure.com/legends-of-runeterra/guide.asp?ID=53051)

---

## 4. iOS HIG Recommendations

### Tab Bar Standards

Apple's Human Interface Guidelines establish tab bars as the standard for top-level navigation in iOS apps. Key specifications:

- **Default tab bar height:** 49pt on non-Face ID iPhones (iPhone 8 and earlier)
- **Height on Face ID iPhones (iPhone X and later):** 83pt total (49pt bar + 34pt safe area inset for home indicator)
- **Compact variant (landscape):** When iPhone enters landscape (compact height size class), the tab bar may switch to a compact layout where icon and label are side-by-side horizontally rather than stacked, reducing the bar's total height impact
- **Minimum tabs:** 2; maximum recommended: 5
- **Icons:** Should be recognizable without labels where possible, but labels are recommended

### Landscape iPhone Size Class
- In landscape, iPhone uses **compact height (hC)** size class vertically and **regular width (wR)** horizontally
- The vertical compact size class means there is less vertical real estate — approximately 375pt tall on an iPhone 16 in landscape vs. 844pt in portrait
- For games, this means a 49pt navigation bar in landscape consumes ~13% of total vertical screen height — a significant amount

### Safe Area in Landscape
On Face ID iPhones in landscape mode, safe area insets are:
- **Bottom:** 21–34pt (home indicator gesture area)
- **Left / Right:** 44pt on the "notch side" and minimal on the other (for older notch designs); 0pt on Dynamic Island iPhones in landscape since the island is top-center
- Content must not be placed behind these insets

### Apple's Game Exception
Apple's HIG explicitly notes that **immersive games are an exception** to standard navigation pattern rules. For games, custom navigation metaphors (world maps, hub menus, game-specific chrome) are accepted and expected. The HIG guidance on tab bars, navigation bars, etc. is written for standard utility/productivity apps — game UIs are given design freedom to match their world.

### Top Bar vs. Bottom Bar in Landscape
For landscape-only game apps:
- Top bars waste less vertical space for nav chrome when content fills the screen (cards, battlefield)
- Bottom placement is ergonomically preferable for thumb reach during two-handed landscape hold
- The two-handed "gamer stance" (phone held landscape in both hands, thumbs at bottom corners) makes **bottom corners and bottom center** the most ergonomically accessible zones
- Top corners in landscape are difficult to reach without repositioning grip

**Sources:**
- [Apple HIG — Tab Bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- [Apple HIG — Navigation Bars](https://developer.apple.com/design/human-interface-guidelines/navigation-bars)
- [iOS Tab Bar Height — svasilevkin.wordpress.com](https://svasilevkin.wordpress.com/2018/12/06/calculating-height-of-uitabbar/)
- [iOS Safe Area — Rosberry Medium](https://medium.com/rosberryapps/ios-safe-area-ca10e919526f)
- [Supporting iPhone X Safe Areas — useyourloaf.com](https://useyourloaf.com/blog/supporting-iphone-x/)
- [Mobile Free-to-Play: Touch Control Design](https://mobilefreetoplay.com/control-mechanics/)

---

## Design Recommendations for Chaos Creatures

### Navigation Bar

**Position:** Top of screen (not bottom)

**Rationale:** Chaos Creatures is landscape-only and battle screens are the primary use case. Placing the main menu navigation at the top (outside the battlefield) keeps the bottom edge of the screen — the most ergonomically accessible zone — reserved entirely for the card hand. MTGA follows this same pattern. During battle, there is no persistent navigation bar at all; the battlefield is full-screen. The top navigation bar appears only in menus (Collection, Deck Builder, Shop, etc.) where the thumb-reach tradeoff is less critical than in-game.

**Height:** 44pt (standard iOS navigation bar height). Do not use a full 83pt tab bar — that is too tall for a landscape iPhone with only ~375pt vertical. Use a 44pt top bar with the status bar above it (approximately 20pt in landscape on most Face ID iPhones, though status bar is often hidden in games).

**Tab layout:** Icon + label, horizontal arrangement (side by side), in a flat row. Given compact height in landscape, do not stack icon above label. Maximum 5 tabs. Recommend: Home / Collection / Deck Builder / Shop / Profile.

**Active indicator:** Background highlight (filled pill or underline beneath the active tab item). Avoid underline-only in landscape — it can be hard to distinguish at the top of a wide screen. A subtle tinted background on the active tab item is cleaner.

**Background:** Semi-transparent blur (material: `.ultraThinMaterial` in SwiftUI) over the game world background. Avoid a fully opaque bar — Chaos Creatures has rich textured backgrounds and a solid nav bar would feel disconnected from the game world aesthetic.

---

### Collection Grid

**Recommended columns at ~750pt landscape width:** 4 columns

**Rationale:** At a landscape iPhone width of approximately 750–844pt (depending on model), with standard padding:
- A 4-column grid gives each card approximately 170–185pt wide
- At the standard card aspect ratio of 63:88 (or roughly 5:7), a 175pt-wide card is approximately 245pt tall — this fits 1 full row plus part of a second row in a landscape viewport after accounting for the nav bar and filter controls (approximately 44pt nav + 40pt filter bar = ~84pt overhead, leaving ~290pt for cards at 375pt total height)
- 4 columns is consistent with competitive card games on similar screen sizes
- 5 columns would make cards too small (approximately 140pt wide) to read card art; 3 columns wastes screen width

**Card aspect ratio handling:** Cards should maintain their fixed aspect ratio and not be cropped. If vertical space is tight, prefer a slightly compressed row height with a "peek" of the second row to signal scrollability.

**Filter/search bar:** Place immediately below the navigation bar (approximately y=44pt from safe area top). Height: approximately 40pt. Should contain: text search field, faction filter (icon buttons), rarity filter, sort control. Sticky — does not scroll with the card grid.

---

### Battle Hand

**Recommended hand placement:** Bottom center, full-width arc or fan across the bottom edge

**Rationale:** MTGA, Hearthstone, and Marvel Snap all converge on the bottom of the screen for the active hand of cards. This is the most ergonomically natural position in the two-handed landscape "gamer stance" — thumbs rest at the bottom of the screen. Cards fan across the bottom, with their tops visible above the bottom safe area.

**Hand height recommendation:** Approximately 130–160pt for the hand area (cards are partially submerged into the bottom edge, with the top two-thirds visible above). Add the bottom safe area inset (21–34pt) below the lowest card edge. Total bottom zone reserved for hand + safe area: approximately 155–190pt from physical bottom.

**Card reveal behavior:** Tapping a card in hand should expand it upward to a readable size (approximately 250–300pt tall) centered horizontally. This matches MTGA's "tap to access" pattern and prevents the hand from always obscuring the battlefield.

**Implementation note:** In SpriteKit, position hand cards as nodes anchored to the bottom of the scene, with the anchorPoint set to (0.5, 0) so they grow upward. Use safeAreaInsets.bottom to offset the base position above the home indicator zone.

---

### Battlefield Layout (Battle Screen)

**Zones (top to bottom, landscape):**
1. Opponent info bar (avatar, HP, instability) — top 32pt strip, left-aligned
2. Opponent board zone — upper 40% of remaining screen height
3. Ruins zone / neutral center strip — middle 10% (thin horizontal band)
4. Player board zone — lower 40% of remaining screen height
5. Player hand — bottom 130–160pt (above safe area)

**Player info / controls:** Bottom-right corner cluster for End Turn button, mana/PP display, instability indicator. This matches Marvel Snap's energy-at-bottom-center approach and keeps the most frequently used control (End Turn) accessible to the right thumb. Approximately 120pt wide × 80pt tall control cluster in bottom-right, inset from safe area edges.

**Chaos Roll / Event overlay:** Full-screen modal overlay centered on screen, slides up from bottom or scales from center. Duration should be brief (1.5–2s auto-dismiss with tap-to-dismiss option).

---

### Summary

The leading landscape card game on iOS — MTGA — uses a top navigation bar for menus and a full-screen battlefield with the hand tucked at the very bottom of the screen, just above the iOS home indicator safe area. This is not coincidental: it reflects the ergonomics of the two-handed landscape hold, where the bottom edge of the screen is the most natural thumb interaction zone and must be kept clear during gameplay.

Chaos Creatures should adopt the same pattern: a 44pt top navigation bar with icon+label tabs (visible only in menu screens), a 4-column card grid in the Collection screen with a sticky filter bar just below the nav, and a bottom-anchored card hand during battle that respects the safe area inset. The bottom-right corner should host the primary turn-control cluster (End Turn, PP display). This layout matches player expectations set by MTGA and aligns with Apple's HIG guidance for immersive game experiences that are permitted to deviate from standard app navigation chrome in favor of game-world-appropriate UI.

One important divergence from Marvel Snap: that game runs primarily in portrait mode on mobile, which changes its ergonomic constraints significantly. Its bottom-tab navigation pattern makes more sense for portrait. For a landscape-only game like Chaos Creatures, the top navigation bar for menus (MTGA's approach) is the right pattern — it preserves the critical bottom zone for the card hand during battle without any visual conflict between menu chrome and gameplay controls.
