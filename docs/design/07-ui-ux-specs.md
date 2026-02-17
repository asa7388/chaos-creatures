# 07 — UI/UX Specifications

**Chaos Creatures — Mobile Card Game Interface Design**

This document expands the UI/UX section of the master design document into a complete specification for engineering handoff. It defines every screen, interaction pattern, navigation flow, and responsive consideration needed to implement the game's interface.

**Design Philosophy:** Clean, stylish, card-game-native. The UI should feel like a premium card game app (Balatro's clarity, Marvel Snap's speed, Slay the Spire's readability), not a mobile game with cards bolted on. Dark theme default with faction-themed light accents. Every screen serves one primary purpose with minimal navigation friction.

**Depends on:** `00-game-design-master.md` (overall systems), `01-battle-mechanics.md` (battle mechanics), `02-card-data-model.md` (data structures)

---

## 1. Screen Inventory

Complete list of all screens in the application with their primary purpose and access paths.

### Core Screens (Always Accessible)

| Screen | Primary Purpose | Access Path |
|--------|----------------|-------------|
| **Home** | Dashboard and play entry point | Bottom tab bar (leftmost tab) |
| **Collection** | Browse and manage owned cards | Bottom tab bar |
| **Decks** | Build and edit decks | Bottom tab bar |
| **Profile** | Player stats, achievements, showcase | Bottom tab bar |
| **Shop** | Subscriptions, card packs, cosmetics | Bottom tab bar (rightmost tab) |

### Battle Flow Screens

| Screen | Primary Purpose | Access Path |
|--------|----------------|-------------|
| **Mode Selection** | Choose Ranked/Casual/Practice | Tap Play button on Home |
| **Matchmaking** | Queue for match, display opponent | After mode selection |
| **Battle** | Main gameplay screen | After matchmaking completes |
| **Post-Match Results** | Display results, rewards, XP gains | After battle ends |

### Card Management Screens

| Screen | Primary Purpose | Access Path |
|--------|----------------|-------------|
| **Card Detail** | Full card stats, evolution history, actions | Tap any card in Collection, Deck Builder, or Battle |
| **Evolution Flow** | Evolve a card through ritual UI | Tap "Evolve" from Card Detail when eligible |
| **Graveyard** | View destroyed cards during battle | Tap avatar during battle |

### Secondary Screens

| Screen | Primary Purpose | Access Path |
|--------|----------------|-------------|
| **Settings** | Account, audio, visual, gameplay preferences | Gear icon in header or Profile tab |
| **Achievements** | View achievement progress | Profile tab → Achievements section |
| **Battle Log** | Chronological action history during battle | Battle screen → log icon (bottom-left) |
| **Friends List** | Manage friends, view online status | Profile tab → Friends section |
| **Onboarding Tutorial** | First-time user education | First launch only |

---

## 2. Navigation Map

Text-based flowchart showing how screens connect. The app uses a persistent 5-tab bottom bar as its only top-level navigation.

```
[App Launch]
    ↓
[Onboarding] (first launch only)
    ↓
┌─────────────────────────────────────────────────────────────┐
│                  Bottom Tab Bar (Persistent)                │
├─────────┬─────────────┬─────────┬─────────┬────────────────┤
│  HOME   │ COLLECTION  │  DECKS  │ PROFILE │     SHOP       │
└─────────┴─────────────┴─────────┴─────────┴────────────────┘
    ↓            ↓            ↓         ↓            ↓
[Home Screen]  [Collection] [Deck    [Profile]   [Shop]
    ↓            ↓         Builder]      ↓            ↓
    ↓         [Card Detail]  ↓       [Achievements] [Subscription]
    ↓            ↓            ↓       [Friends]      [Style Packs]
    ↓         [Evolution]    ↓       [Stats]        [Cosmetics]
    ↓                         ↓                      [Shards]
[Mode Selection]          [Card Detail]
    ↓                         ↓
[Matchmaking]             [Evolution]
    ↓
[Battle Screen] ←──────────────────────┐
    ↓                                   │
[Battle Log] (side panel)              │
[Graveyard] (modal)                    │
[Card Detail] (in-battle tap)          │
    ↓                                   │
[Post-Match Results] ───────────────────┘
    ↓
[Home] or [Evolution] (if card ready)


[Settings] ← Accessible from gear icon in header (any screen)
```

**Key Navigation Principles:**

- **Bottom tab bar is always visible** except during battle (battle is full-screen immersive)
- **No nested tab systems** — every tab is one tap from every other tab
- **Modal overlays** for focused actions (card detail, evolution, settings) dismiss back to calling screen
- **Linear flows** for critical paths (matchmaking → battle → results)
- **Deep linking allowed:** Notification "Card ready to evolve" → directly to Evolution screen for that card

---

## 3. Battlefield Screen (Detailed)

The most important screen in the game. Every element must be readable at a glance during fast decision-making.

### 3.1 Layout Specification

```
┌──────────────────────────────────────────────────────────┐
│  OPP AVATAR │ OPP HP BAR [████████░░] 16/20               │ ← Top Header
│  Instability: 11        [5 cards]  [mana: ●●●●●○○○○○]    │
├──────────────────────────────────────────────────────────┤
│                                                           │
│         ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐                   │ ← Opponent Board
│         │C1│  │C2│  │C3│  │C4│  │C5│                   │   (5 slots)
│         └──┘  └──┘  └──┘  └──┘  └──┘                   │
│                                                           │
├──────────────────────────────────────────────────────────┤
│                  ═══ CHAOS ROLL ZONE ═══                 │ ← Central Zone
│                        [ D20 ]                           │
│                   "Attack Phase"                         │   (phase indicator)
├──────────────────────────────────────────────────────────┤
│                                                           │
│         ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐                   │ ← Your Board
│         │C1│  │C2│  │C3│  │C4│  │C5│                   │   (5 slots)
│         └──┘  └──┘  └──┘  └──┘  └──┘                   │
│                                                           │
├──────────────────────────────────────────────────────────┤
│  YOUR AVATAR │ YOUR HP BAR [████████████] 20/20          │ ← Bottom Header
│  Instability: 8         [Timer: ███████░░░ 45s]          │
├──────────────────────────────────────────────────────────┤
│  [Hand - Horizontally Scrollable Card Row]               │ ← Hand Area
│  [Card1] [Card2] [Card3] [Card4] [Card5] →              │
├──────────────────────────────────────────────────────────┤
│  [Mana: ●●●●●●○○○○]  [Log]          [END TURN]          │ ← Bottom Controls
└──────────────────────────────────────────────────────────┘
```

### 3.2 Component Specifications

#### Chaos Roll Zone (Center)
- **Position:** Vertical center of screen, between opponent and player boards
- **Visual:** Neutral background (not aligned to either player)
- **D20 Animation:** Full 3D roll when active, static display of current roll result afterward
- **Roll Display:** Large number (48-60pt), visible for 2-3 seconds before fading to smaller persistent indicator
- **Event Overlay:** When event triggers, semi-transparent overlay slides in from center
  - Event name and icon at top
  - Brief effect description (1 sentence, 18pt)
  - Highlighting/pulsing on affected creatures
  - Auto-dismisses after 2.5 seconds or on tap
  - Visual treatment: Order = blue/gold glow, Chaos = red/purple crackle
- **Phase Indicator:** Below roll zone, shows current phase
  - 9 phases: "Start" → "Chaos Roll" → "Event" → "Draw" → "Main" → "Attack" → "Block" → "Combat" → "End"
  - Active phase highlighted (bright), completed phases dimmed, future phases grayed
  - Font size: 14pt, always visible but subtle

#### Board Slots (5 per side)
- **Slot Dimensions:** Approx 60x85pt each (portrait card ratio)
- **Empty Slot:** Dim outline/border (30% opacity) so capacity is always visible
- **Card Display (Compact):**
  - Card art thumbnail (top 60% of slot)
  - ATK/HP numbers (bottom corners, 16pt bold)
  - Active keyword icons (row of small icons, 12x12pt each, max 3 visible, tap for more)
  - Attunement indicator (small glow effect: blue for Order-attuned, red for Chaos-attuned)
  - Taunt indicator (shield icon, 16x16pt, bright yellow, top-right corner)
  - Tap to expand to full Card Detail view
- **Spacing:** 4-8pt horizontal gap between slots
- **Positioning:** Centered horizontally, with equal margins on both sides

#### HP Bars
- **Dimensions:** Full width of screen, 32pt height
- **Components:**
  - Filled bar (gradient: green at high HP → yellow at medium → red at low)
  - Numeric display overlay (center): "16/20" (20pt bold)
  - Background bar (darker shade, shows total HP capacity)
- **Damage Animation:**
  - Bar flash (white overlay for 0.2s)
  - Screen shake (4pt amplitude) on damage to player
  - Number pop (damaged amount flies up in red, -3pt offset)
- **Healing Animation:**
  - Green sparkle effect
  - Number pop (healed amount flies up in green, +3pt offset)

#### Hand Area
- **Position:** Bottom of screen, above bottom controls
- **Dimensions:** Full width, 120pt height
- **Layout:** Horizontal scrollable row (swipe left/right)
- **Card Display (Full Art):**
  - Full card portrait (90x130pt)
  - Cards overlap slightly (10pt) to save space
  - Affordable cards: bright, full opacity
  - Unaffordable cards: dimmed 50%, grayscale filter
  - Selected card for play: lifted 10pt, drop shadow
- **Drag to Play:** Drag card upward from hand to board or target area
  - Visual: Card follows finger with 20% scale increase
  - Drop zones highlight when valid target is available
  - Release on invalid zone: card snaps back to hand with bounce animation

#### Mana Crystals
- **Position:** Bottom-left corner, above hand
- **Display:** Row of 10 circular icons (chaos mote symbols)
  - Filled (bright, colored): available mana
  - Empty (dim outline): spent mana
  - Outlined (pulsing): upcoming next turn (preview)
- **Size:** 20pt diameter each, 4pt spacing
- **Animation:** When mana is spent, crystal dims with a brief flash

#### Timer Bar
- **Position:** Embedded in bottom header, to right of instability display
- **Dimensions:** 120pt wide x 12pt tall
- **States:**
  - Normal (60-16s remaining): Green/blue gradient, smooth depletion
  - Warning (15-0s remaining): Red, pulsing, audio cue at transition
  - Inactive (opponent's turn): Gray, not depleting
- **Numeric Display:** Seconds remaining shown as text overlay (12pt)

#### Avatars
- **Position:**
  - Player avatar: Bottom-left corner, 60x60pt
  - Opponent avatar: Top-left corner, 60x60pt
- **Frame:** Faction-themed border (4pt thick) with subtle ambient particle effects
- **Tap Interaction:** Opens graveyard panel for that player
- **Instability Display:** Shown directly next to avatar (18pt bold)

#### End Turn Button
- **Position:** Bottom-right corner
- **Dimensions:** 100x44pt (minimum tap target)
- **States:**
  - Active (your turn, actions available): Bright, pulsing glow
  - Inactive (opponent's turn): Grayed out, no interaction
  - Ready (your turn, no more actions possible): Strong pulse, audio hint
- **Label:** "END TURN" (14pt bold)
- **Confirmation:** Optional setting "Confirm before ending turn" adds a 0.5s long-press requirement

#### Opponent Information Display
- **Hand Count:** Small number badge next to hand icon (top-right): "[5 cards]"
- **Deck Count:** Small deck icon with number (top-right, next to hand)
- **Mana Crystals:** Row of 10 icons (mirroring player's) at top, showing opponent's available mana
- **Instability:** Displayed next to opponent avatar (same styling as player's)

### 3.3 Turn Phase Indicators

Visual states for each of the 9 phases:

| Phase | Visual State | Timer Active? | Primary Interaction |
|-------|-------------|---------------|---------------------|
| **Start** | Label visible, brief (0.5s) | No | None (automatic) |
| **Chaos Roll** | D20 animating, label bright | No | Watch roll |
| **Event** | Event overlay visible | No | Read event |
| **Draw** | Card draw animation | No | None (automatic) |
| **Main** | Label highlighted | Yes (60s) | Play cards from hand |
| **Attack** | Label highlighted, "Select Attackers" prompt | Yes (continues) | Tap creatures to attack |
| **Block** | Label highlighted, "Assign Blockers" prompt | Yes (continues) | Drag blockers onto attackers |
| **Combat** | Damage numbers flying, animations | No | Watch resolution |
| **End** | Label visible, brief (0.5s) | No | None (automatic) |

**Phase Label Styling:**
- Active phase: Bright white text, 16pt, subtle glow
- Completed phases: 50% opacity, strikethrough
- Upcoming phases: 30% opacity, no strikethrough

### 3.4 Combat Animations

#### Attacker Selection (Attack Phase)
- **Interaction:** Tap a creature on your board to toggle attack
- **Visual:**
  - Selected attacker: Red glow border (4pt), "crossing swords" icon above
  - Deselect: Tap again, glow disappears
  - Taunt enforcement: If opponent has Taunt creature, all eligible attackers auto-selected with prompt: "Taunt forces attack"
- **Duration:** No time limit on selection, but turn timer continues

#### Blocker Assignment (Block Phase)
- **Interaction:** Drag your creature onto opponent's attacker
- **Visual:**
  - Dragging creature: Lifted 20pt, follows finger, drop shadow
  - Valid drop zone: Attacker highlights with green border
  - Invalid drop: Red border flash, creature snaps back
  - Assigned blocker: Visual line connecting blocker to attacker (yellow, 2pt thick)
  - Taunt creatures: Auto-assigned with prompt "Taunt creature must block", cannot be unassigned
- **Multiple blockers:** Not allowed (1-to-1 blocking only)
- **Reassignment:** Drag blocker to different attacker or drag to board to unassign

#### Damage Numbers
- **Timing:** Simultaneous during Combat phase
- **Visual:**
  - Damage number flies up from creature (red, bold, 24pt)
  - Fade out over 0.8s
  - Critical/lethal damage: Larger (32pt), shake effect
  - Lifesteal: Green number flies to player's HP bar
  - Piercing: Damage splits (creature and face), two numbers fly simultaneously

#### Death Animation
- **Trigger:** When creature HP reaches 0
- **Visual:**
  - Card dissolves into particles (matching faction aesthetic)
  - Slot briefly highlights with dark pulse
  - Card moves to graveyard (small icon animation to avatar)
- **Duration:** 1.2s (cannot be skipped to maintain game state clarity)
- **On-Death Effects:** Fire immediately, small popup shows effect text (0.8s)

#### Spell Cast Animation
- **Visual:**
  - Card enlarges briefly in center screen (0.6s)
  - Effect particles emanate toward target(s)
  - Spell name flashes at top of card
  - Card then moves to graveyard
- **Targeting:** If targeted spell:
  - All valid targets glow (green for friendly, red for enemy)
  - Player taps target to confirm
  - Cancel: Tap outside targets or tap the spell card again

### 3.5 Taunt Indicators

Taunt is a special keyword that affects both attack and block phases.

- **Visual Indicator on Taunt Creature:**
  - Large shield icon (20x20pt) in top-right corner of card
  - Bright yellow/gold color
  - Pulsing glow (1.5s cycle)
  - Visible on both your creatures and opponent's

- **Attack Phase with Opponent Taunt:**
  - Prompt appears: "Enemy Taunt creature forces your attack"
  - All eligible attackers auto-selected
  - Cannot deselect attackers while opponent Taunt creature is alive
  - Taunt creature is auto-targeted (attacks directed at it visually)

- **Block Phase with Your Taunt:**
  - Your Taunt creature auto-assigned to block an attacker
  - Prompt: "Your Taunt creature must block"
  - Cannot reassign the Taunt creature
  - If multiple attackers, Taunt blocks the first declared attacker

### 3.6 Event Overlay Details

When a Chaos Roll triggers an Order or Chaos event:

- **Overlay Appearance:**
  - Semi-transparent dark background (70% opacity) behind event card
  - Event card slides in from center (0.4s animation)
  - Size: 280x180pt centered

- **Event Card Contents:**
  - Top: Event icon (48x48pt) + event name (20pt bold)
  - Middle: Effect description (16pt, 2-3 lines max)
  - Bottom: Order/Chaos indicator (icon + label, 14pt)

- **Affected Creatures Highlighting:**
  - Any creature affected by the event pulses with matching color
  - Order: Blue pulse (0.6s cycle, 3 cycles)
  - Chaos: Red pulse (0.6s cycle, 3 cycles)
  - If triggered abilities fire, those creatures get secondary highlight ring

- **Dismissal:**
  - Auto-dismiss after 2.5 seconds
  - Tap anywhere to dismiss immediately
  - Game state updates visible behind semi-transparent overlay

### 3.7 Battle Log (Side Panel)

Accessible via small icon (bottom-left corner, 32x32pt) or swipe from left edge.

- **Panel Dimensions:** 280pt wide x full height, slides in from left
- **Content:** Scrollable chronological list of all actions this game
- **Entry Format:**
  - Icon (24x24pt) + timestamp (relative: "3 turns ago") + description (14pt)
  - Color-coded: Order events (blue), Chaos events (red), damage (orange), healing (green), cards played (white)

- **Example Entries:**
  - "[D20] Roll: 14 → Order Event triggered"
  - "[Event] All creatures +1 HP"
  - "[Play] Temple Warden (3 mana)"
  - "[Attack] Rift Slasher attacked (4 damage)"
  - "[Block] Temple Warden blocked Rift Slasher"
  - "[Combat] Rift Slasher destroyed Temple Warden"

- **Tap Entry:** Highlights the relevant card/zone briefly on the board
- **Persistence:** Log clears at end of game

### 3.8 Graveyard Panel

Accessible by tapping player or opponent avatar during battle.

- **Panel:** Modal overlay (90% screen height, centered)
- **Header:** "Your Graveyard" or "[Opponent] Graveyard"
- **Layout:** Grid of card thumbnails (3 columns, scrollable)
- **Card Thumbnails:** 80x110pt each, show card art + tier badge
- **Tap Thumbnail:** Opens full Card Detail view
- **Sort Options:** Chronological (most recent first) or by mana cost
- **Dismiss:** Tap outside panel or back button

---

## 4. Evolution Screen (Detailed)

The evolution screen is the most emotionally impactful moment in the game. It's a ritual—a multi-step flow that builds anticipation and gives the player ownership over the transformation.

### 4.1 Evolution Flow Overview

```
[Card Detail - Evolve Button Pressed]
    ↓
[Step 1: Card Presentation & History]
    ↓
[Step 2: Channel Selection (Order/Chaos)]
    ↓
[Step 3: Evolution Animation + AI Art Generation]
    ↓
[Step 4: Art Reveal (Dramatic Unveil)]
    ↓
[Step 5: Name Selection]
    ↓
[Step 6: New Ability Reveal]
    ↓
[Step 7: Modifier Selection (2/3/4 options)]
    ↓
[Step 8: Flavor Text Reveal]
    ↓
[Step 9: Final Card Presentation & Confirm]
    ↓
[Collection - Updated Card]
```

**Total Flow Duration:** 25-40 seconds (player-controlled pacing, can tap to skip certain animations)

### 4.2 Step-by-Step Specifications

#### Step 1: Card Presentation & History
- **Layout:**
  - Left side: Current card displayed large (280x400pt), centered
  - Right side: Evolution history timeline (vertical, scrollable if needed)

- **Evolution History Timeline:**
  - Each evolution step shown as a node:
    - Icon: Order (blue crystal) or Chaos (red flame)
    - Label: Tier achieved (e.g., "Uncommon (Order)")
    - Modifier gained (small icon + name)
    - Ability gained (small icon + name)
  - Visual connector lines between nodes
  - Current tier highlighted, past tiers dimmed
  - Next tier shown as empty outline (preview)

- **Card Stats Display:**
  - Current ATK/HP (large, 28pt)
  - Current tier badge (top-right corner)
  - Chaos energy progress: "[75/75 Energy Ready]" (green checkmark)
  - Shard requirement: "Requires: 1x Epic Shard" (icon + text)

- **Button:** "Begin Evolution" (center-bottom, 180x52pt, pulsing glow)

#### Step 2: Channel Selection (Order/Chaos)
- **Layout:** Two large buttons, side-by-side, centered

- **Order Button:**
  - Icon: Blue crystal with geometric patterns
  - Label: "Channel toward Order" (18pt bold)
  - Probability: "70% chance" (14pt, below label)
  - Flavor text: "Stabilize and harmonize"
  - Color: Blue gradient background
  - Size: 280x160pt

- **Chaos Button:**
  - Icon: Red flame with chaotic wisps
  - Label: "Channel toward Chaos" (18pt bold)
  - Probability: "30% chance" (14pt, below label)
  - Flavor text: "Embrace transformation"
  - Color: Red gradient background
  - Size: 280x160pt

- **Reminder Text (top):** "This influences the new ability and modifier attunement" (14pt, 70% opacity)

- **Selection Animation:**
  - Player taps one button
  - Selected button pulses and grows 10%
  - Other button fades out
  - Transition to Step 3 after 0.6s

#### Step 3: Evolution Animation + AI Art Generation
This is where the magic happens. The animation runs while FLUX generates the new card art in the background (typically 2-4 seconds).

- **Visual Sequence:**
  1. **Card Dissolves (0.8s):**
     - Current card breaks into particles (faction-themed: crystals for Order, embers for Chaos)
     - Particles swirl toward center of screen

  2. **Shard Appears (0.4s):**
     - Planar Shard materializes at center (60x60pt icon)
     - Shard quality visual matches tier:
       - Uncommon: Standard glow
       - Rare: Refined shimmer
       - Epic: Prismatic rainbow refraction
       - Legendary: Intense radiant aura
     - Rotation: Slow spin (2s per rotation)

  3. **Energy Channeling (1.5-3s, looping until AI completes):**
     - Particles flow through the shard
     - Shard pulses with each particle pass
     - Order: Blue energy flows smoothly
     - Chaos: Red energy crackles erratically
     - Sound: Deep resonant hum, building intensity

  4. **Shard Cracks Open (0.6s):**
     - When AI art is ready, shard splits
     - Bright flash (white screen overlay, 0.2s)
     - Particles reform on the other side

- **Loading State (if AI is slow):**
  - If generation exceeds 3s, small text appears: "Channeling energy..." (bottom, 14pt, 50% opacity)
  - Animation continues looping smoothly (no jank, no spinner)

- **Audio:** Continuous ambient sound, crescendo at shard crack, climactic swell

#### Step 4: Art Reveal (Dramatic Unveil)
The new card art is revealed with maximum impact.

- **Animation:**
  1. **Card Assembles (1.2s):**
     - New card frame fades in at center (280x400pt)
     - Art is initially obscured by bright glow/mist
     - Glow fades out gradually, revealing art from center outward (iris wipe)

  2. **Card Flourish (0.8s):**
     - Card pulses once (scale 1.0 → 1.05 → 1.0)
     - Tier badge appears in top-right corner (fade in + small bounce)
     - Particle effects matching evolution outcome swirl around card

- **Pause:** Hold on revealed art for 2 seconds (player can tap to continue earlier)
- **Audio:** Triumphant chord, magical shimmer sound

#### Step 5: Name Selection
The player chooses the evolved card's new name from AI-generated options.

- **Layout:**
  - Top: New card art (smaller, 200x280pt), centered
  - Middle: Current name shown with strikethrough: "~~Ashscale Wyvern~~" (20pt, 50% opacity)
  - Bottom: 2-3 name options as tappable buttons

- **Name Options:**
  - Each displayed as a button (280x52pt)
  - Font: 18pt bold, center-aligned
  - Example names:
    - "Ashscale Fury"
    - "Emberstorm Wyvern"
    - "Wyrmfire Tyrant"
  - Generated by GPT-4o Mini based on evolution history + transformation modifiers

- **Selection:**
  - Tap a name button
  - Selected button highlights (gold border)
  - Name fades in below card art, replacing old name
  - Transition to Step 6 after 0.6s

#### Step 6: New Ability Reveal
The triggered ability gained from this evolution is presented.

- **Layout:**
  - Top: Card with new name (200x280pt)
  - Middle: Ability card (300x140pt, centered)

- **Ability Card Design:**
  - Border: Order (blue) or Chaos (red) depending on evolution outcome
  - Icon: 40x40pt ability icon (top-left)
  - Trigger label: "Chaos Trigger" or "Order Trigger" (16pt bold, top-right)
  - Ability name: 18pt bold, centered
  - Ability text: 14pt, 2-3 lines, centered
  - Background: Gradient matching trigger type

- **Animation:**
  - Ability card slides in from right (0.6s)
  - Icon pulses once
  - Border glows (0.8s pulse)

- **Audio:** Ability-specific sound cue (sharp for Order, crackle for Chaos)

#### Step 7: Modifier Selection (2/3/4 options)
Player chooses from available modifiers based on subscription tier.

- **Number of Options:**
  - Free tier: 2 options
  - Mid tier: 3 options
  - Top tier: 4 options

- **Layout:**
  - Top: Card with name and new ability (smaller, 180x260pt)
  - Middle: "Choose a Modifier" prompt (18pt bold)
  - Bottom: Modifier option cards (scrollable horizontal row if 4 options)

- **Modifier Card Design (each):**
  - Size: 260x180pt
  - Background: Faction-themed gradient
  - Header: Modifier name (16pt bold) + attunement icon (Order/Chaos)
  - Body:
    - Base effect (14pt): Always active bonus
    - Attuned bonus (14pt, colored): Bonus when attuned event triggers
    - Penalty (14pt, red): Penalty when opposite event triggers (if applicable)
  - Footer: Tier badge (where this modifier was gained)

- **Composition Guarantee:**
  - Always at least 1 universal modifier
  - Always at least 1 faction-exclusive modifier
  - PP budget matches tier (see `01-battle-mechanics.md` Section 1)

- **Selection:**
  - Tap a modifier card
  - Selected card glows (gold border, 4pt)
  - Other cards fade to 30% opacity
  - Confirm button appears (center-bottom): "Confirm Modifier" (180x52pt)
  - Tap confirm → selected modifier slides onto card, transition to Step 8

#### Step 8: Flavor Text Reveal
AI-generated lore snippet reflecting the transformation.

- **Layout:**
  - Top: Fully evolved card (200x280pt) showing all updates
  - Bottom: Flavor text box (300x100pt)

- **Flavor Text Box:**
  - Background: Dark semi-transparent (80% opacity)
  - Border: Faction-colored (2pt)
  - Text: Italicized, 14pt, center-aligned, 2-3 lines
  - Example: *"Once bound by Order's chains, it now dances on the edge of madness, each strike a symphony of chaos."*

- **Animation:**
  - Text types out letter-by-letter (0.05s per character)
  - Small sparkle effect on final character
  - Auto-continue after typing completes + 1.5s pause (or tap to skip)

#### Step 9: Final Card Presentation & Confirm
The fully evolved card is presented with all new stats, abilities, modifiers, and flavor text.

- **Layout:**
  - Center: Final card (300x430pt, maximum size)
  - Card shows:
    - New art
    - New name
    - Updated ATK/HP (if stat growth occurred)
    - New tier badge (corner)
    - New triggered ability (icon on card)
    - New modifier (icon on card)
    - Chaos mana cost (unchanged, prominently displayed)

- **Evolution Summary Panel (below card):**
  - "Evolution Complete!" header (24pt bold, gold)
  - Stats change: "3/4 → 5/6" (18pt, green if increased)
  - Instability change: "2 → 3" (18pt, color-coded: red = increased, blue = decreased, white = unchanged)
  - New ability summary (14pt, 1 line)
  - New modifier summary (14pt, 1 line)

- **Buttons (bottom):**
  - "Save & Continue" (primary, 180x52pt, gold glow)
  - "Share Screenshot" (secondary, 180x52pt, white border)

- **Share Functionality:**
  - Generates shareable image: card art + stats + evolution history summary
  - Opens native share sheet (iOS/Android)
  - Image dimensions: 1080x1920px (mobile-optimized)
  - Watermark: "Chaos Creatures" logo (small, bottom-right)

### 4.3 Art Generation Loading State (FLUX Wait Time)

FLUX typically generates images in 2-4 seconds, but can occasionally take 5-8 seconds if server load is high.

**Handling Strategy:**

- **Optimistic Animation:** Evolution animation (Step 3) is designed to loop gracefully
- **Minimum Animation Duration:** 2.5 seconds (even if FLUX finishes faster, hold the animation for dramatic effect)
- **Extended Wait (3-8s):**
  - Animation continues looping (shard pulsing with energy)
  - Small text appears after 3s: "Channeling energy..." (14pt, bottom-center, 50% opacity)
  - Music/audio continues without interruption
  - No loading spinner (feels jarring in a ritual moment)

- **Fallback (8s+ rare failure):**
  - If FLUX fails or times out, show error modal:
    - "Evolution interrupted. Your shard and energy have been refunded."
    - "Try again" button returns to Card Detail
    - Shard and chaos energy restored to player's inventory
    - Error logged to analytics

---

## 5. Collection & Deck Builder

### 5.1 Collection Screen

The player's card library across all factions.

#### Layout
- **Top Bar:**
  - Faction tabs (horizontal, scrollable): "All" | "Ironwright" | "Fey Courts" | "Demonic Kingdoms"
  - Active tab highlighted with faction color underline (4pt thick)
  - Tab icons: faction symbols (32x32pt)

- **Filter Bar (below tabs):**
  - Sort dropdown: Tier | Newest | Most Played | Name | Mana | ATK | HP
  - Filter button: Opens filter panel (see below)
  - Search icon: Opens search field

- **Card Grid:**
  - 3 columns on phone (portrait), 5 columns on tablet
  - Card thumbnails: 100x140pt each
  - Each thumbnail shows:
    - Card art (top 70%)
    - Tier badge (top-right corner, 20x20pt)
    - Evolution-ready indicator (bottom-right corner, small pulsing shard icon if eligible)
    - Favorite star (top-left corner, yellow if favorited)
  - 8pt spacing between cards
  - Scrolls vertically (infinite scroll / pagination if collection is large)

- **Empty State:**
  - If faction has no cards: "No cards in this faction yet. Visit the Shop to get started!"
  - Icon: faction symbol at 50% opacity
  - Button: "Visit Shop" (primary CTA)

#### Filter Panel
- **Trigger:** Tap filter button in top bar
- **Layout:** Bottom sheet modal (slides up from bottom, 60% screen height)
- **Sections:**

  1. **Card Type:**
     - Checkboxes: Creature | Spell | Stabilizer
     - Default: All checked

  2. **Evolution Tier:**
     - Checkboxes: Common | Uncommon | Rare | Epic | Legendary
     - Default: All checked

  3. **Mana Cost:**
     - Range slider: 1-10
     - Default: 1-10

  4. **Attunement Leaning:**
     - Radio buttons: Mostly Order | Balanced | Mostly Chaos | Any
     - Definition: "Mostly Order" = >60% modifiers are Order-attuned
     - Default: Any

  5. **Keywords:**
     - Checkboxes: Shield | Lifesteal | Flying | Reach | Deathtouch | Taunt | Piercing
     - Label: "Has Keyword"
     - Default: None

  6. **Special Filters:**
     - Checkbox: "Evolution Ready" (has enough energy + player has shard)
     - Checkbox: "In Deck" (currently in any deck)
     - Checkbox: "Not in Deck" (not in any deck)
     - Checkbox: "Favorited Only"

- **Buttons:**
  - "Apply Filters" (primary, bottom-center)
  - "Reset All" (secondary, bottom-left)
  - "Cancel" (text button, top-right corner of modal)

#### Search Bar
- **Trigger:** Tap search icon in filter bar
- **Layout:** Search field slides down from top, pushes grid down
- **Functionality:** Real-time search by card name (fuzzy matching)
- **Clear:** X icon on right side of field
- **Dismiss:** Tap X or swipe search bar up

### 5.2 Card Detail View (from Collection)

Accessible by tapping any card in Collection, Deck Builder, or Battle.

#### Layout (Portrait Mode)
- **Top 50%:** Full card art, edge-to-edge
  - Card name overlaid at bottom of art (24pt bold, white with dark outline)
  - Faction tag (top-left corner, small pill: faction name + icon)
  - Tier badge (top-right corner, 32x32pt)

- **Bottom 50%:** Scrollable detail panel with sections:

  1. **Stats Row:**
     - ATK | HP | Mana Cost (large icons + numbers, 28pt bold)
     - Instability (small icon + number, 18pt)
     - Spacing: evenly distributed across width

  2. **Keywords Row:**
     - Icons for each keyword (32x32pt) with labels below (12pt)
     - Tap keyword icon → tooltip with full keyword description

  3. **Triggered Abilities Section:**
     - Header: "Triggered Abilities" (16pt bold)
     - Each ability displayed as a card:
       - Trigger type icon (Order/Chaos, 24x24pt)
       - Ability name (16pt bold)
       - Ability description (14pt)
       - Tier earned (small badge: "Gained at Rare")
     - If no abilities: "No triggered abilities yet"

  4. **Modifiers Section:**
     - Header: "Modifiers" (16pt bold)
     - Each modifier displayed as an expandable accordion:
       - Closed: Modifier name + attunement icon
       - Expanded:
         - Base effect (always active)
         - Attuned bonus (colored: blue for Order, red for Chaos)
         - Penalty (if applicable, red text)
         - Tier earned badge
     - If no modifiers: "No modifiers yet"

  5. **Evolution History Section:**
     - Header: "Evolution History" (16pt bold)
     - Timeline (vertical, same as Evolution screen Step 1)
     - Each node shows: Tier achieved, Order/Chaos outcome, modifier chosen, ability gained

  6. **Veterancy Section:**
     - Header: "Card Progress" (16pt bold)
     - Games played: "[47 games]"
     - Chaos energy progress bar: "[45/50 Energy]" (green if ready, yellow if in progress)
     - Next evolution requirement: "Requires: 1x Epic Shard" (if not max tier)
     - If max tier: "Fully Evolved" (gold badge)

  7. **Flavor Text Section:**
     - Italicized, centered, 14pt
     - Quote marks, dark background box

- **Action Buttons (bottom, sticky):**
  - **Evolve** (primary, 160x52pt, gold, pulsing) — only if evolution-ready
  - **Add to Deck** (secondary, 160x52pt, white border)
  - **More Actions** (three-dot icon, 52x52pt) → opens action menu:
    - Favorite/Unfavorite
    - Dismantle (confirmation required)
    - Share Screenshot

#### Flip Interaction (Future Enhancement)
- **Concept:** Swipe left/right on card art to flip card
  - Front: Card art + stats + abilities (current view)
  - Back: Lore panel + full evolution history + flavor text from all tiers
- **Status:** Deferred to post-launch (engineering complexity)

### 5.3 Deck Builder Screen

Where strategy crystallizes. Must make it easy to understand what a deck does, how it responds to events, and where its strengths/weaknesses are.

#### Layout (Desktop/Tablet: Side-by-Side, Mobile: Stacked)

**Top Section: Deck Identity**

- **Deck Name Field:**
  - Editable text field (18pt, center-aligned)
  - Placeholder: "Untitled Deck"
  - Max 30 characters
  - Tap to edit

- **Faction Selector:**
  - Dropdown or segmented control: "Ironwright" | "Fey Courts" | "Demonic Kingdoms"
  - Locked once any card is added (grayed out, shows lock icon)
  - To change faction: "Clear Deck" button required

- **Avatar Selector:**
  - Horizontal scrollable row of avatar portraits (60x60pt each)
  - Filtered to show only avatars matching selected faction
  - Selected avatar has gold border (4pt)
  - Avatar's instability modifier shown below portrait (14pt)

**Deck Stats Summary Bar** (always visible, sticky)

- **Mana Curve:**
  - Horizontal bar chart (10 bars, one per mana cost 1-10)
  - Height = number of cards at that cost
  - Color-coded by tier (Common = gray, Uncommon = green, Rare = blue, Epic = purple, Legendary = gold)
  - Shows distribution at a glance

- **Attunement Balance:**
  - Horizontal bar: left = Order (blue), right = Chaos (red)
  - Width proportional to total attuned modifiers across all cards in deck
  - Example: 60% Order, 40% Chaos → bar is 60% blue, 40% red
  - Neutral (no attunement) shown as gray in middle

- **Avg Instability:**
  - Single number (18pt bold)
  - Calculated assuming 3-4 creatures on board
  - Color-coded: 1-6 (blue, Order-leaning), 7-13 (white, balanced), 14-20 (red, Chaos-leaning)

- **Card Count:**
  - "[14/20 cards]" (18pt)
  - Green if 20, yellow if 15-19, red if <15

- **Legendary Count:**
  - "[1/2 Legendaries]" (14pt)
  - Only shown if deck contains Legendaries

**Left Panel: Deck Contents**

- **Layout:** Scrollable vertical list of cards in deck

- **Card Row (each):**
  - Card thumbnail (60x85pt, left)
  - Card name (16pt bold)
  - Mana cost icon (right, 24x24pt)
  - ATK/HP (small, 12pt)
  - Attunement dots (small circles: blue = Order-attuned modifier, red = Chaos-attuned, gray = neutral)
    - Example: 3 Chaos-attuned modifiers = 3 red dots
  - Tap row → opens Card Detail
  - Long-press row → "Remove from Deck" confirmation

- **Sort Options (top of panel):**
  - Dropdown: Mana Cost | Tier | ATK | HP | Name
  - Default: Mana Cost (ascending)

- **Empty State:**
  - "Add cards to your deck" message
  - Faction selector enabled

**Right Panel: Card Pool** (cards NOT in deck)

- **Layout:** Same as Collection screen grid (3 columns)

- **Filters:**
  - Same filter options as Collection screen
  - Additional filter: "Already in Deck" (grayed out, unchecked by default)

- **Tap Card:**
  - If deck <20 cards → add to deck, card slides to left panel
  - If deck =20 cards → brief shake + "Deck full" toast message

- **Validation:**
  - Max 2 copies per card → if card already has 2 copies in deck, it's grayed out in pool
  - Max 2 Legendaries → if deck has 2 Legendaries and card is a 3rd unique Legendary, grayed out
  - Max 2 copies of a single Legendary → if deck has 1 copy of a Legendary, adding the same Legendary again grays it out

#### Deck Stats Detailed Panel (Expandable)

Tap "View Stats" button on summary bar → expands full stats panel (modal overlay).

- **Trigger Breakdown:**
  - Total Order triggers: [12]
  - Total Chaos triggers: [8]
  - Visualization: horizontal bar chart

- **Modifier Attunement Breakdown:**
  - Order-attuned modifiers: [18]
  - Chaos-attuned modifiers: [14]
  - Neutral modifiers: [6]
  - Visualization: pie chart or stacked bar

- **Keyword Distribution:**
  - Shield: [3 creatures]
  - Lifesteal: [2 creatures]
  - Flying: [4 creatures]
  - Reach: [1 creature]
  - Deathtouch: [0 creatures]
  - Taunt: [2 creatures]
  - Piercing: [1 creature]

- **Type Distribution:**
  - Creatures: [16]
  - Spells: [3]
  - Stabilizers: [1]

- **Estimated Instability Range:**
  - Low (1-2 creatures out): [4-6]
  - Medium (3-4 creatures out): [8-12] ← used for summary bar
  - High (5 creatures out): [14-18]
  - Calculated based on deck composition + avatar modifier

- **Close Button:** Top-right corner, dismisses modal

#### Deck Validation

Deck cannot be used in matchmaking unless:
- Exactly 20 cards
- All cards from same faction
- Max 2 copies of any card
- Max 2 Legendaries (max 1 copy each)

**Invalid Deck Indicators:**
- "Save Deck" button grayed out with validation message below
- Example: "Need 6 more cards" or "Remove 1 Legendary"
- Invalid decks can be saved as "Work in Progress" with WIP badge
- WIP decks shown in deck selector but cannot be used in matchmaking

#### Deck Slots

- **Free tier:** 3 deck slots
- **Mid tier:** 6 deck slots
- **Top tier:** 10 deck slots

**Deck Selector (Home Screen):**
- Horizontal swipe carousel of saved decks
- Each deck shows: Deck name, faction icon, avatar portrait, card count badge
- Tap deck to select as active (used for matchmaking)
- Long-press deck → "Edit" or "Duplicate" or "Delete"

**Duplicate Deck:**
- Creates a copy of the deck in a new slot (if available)
- Prompts for new deck name
- Preserves all cards and avatar selection

---

## 6. Shop & Economy Screens

Clean, non-predatory, no dark patterns. The shop should feel like a curated boutique, not a casino.

### 6.1 Shop Screen Layout

**Top Bar:**
- Current Chaos Dust balance (large, 24pt, icon + number)
- Current Planar Shards by tier (row of icons + numbers, 16pt)
  - Uncommon Shard: [3]
  - Rare Shard: [1]
  - Epic Shard: [0]
  - Legendary Shard: [0]

**Scrollable Sections:**

#### Section 1: Subscription Tiers
- **Layout:** Three cards, side-by-side (scrollable horizontally on mobile)

- **Free Tier Card:**
  - Label: "Free" (18pt bold)
  - Background: Dark gray
  - Benefits list:
    - 3 deck slots
    - 2 modifier options on evolution
    - Standard card pack earnings
  - Status: "Current Tier" badge (if applicable)
  - No action button (always available)

- **Mid Tier Card:**
  - Label: "Mid Tier" (18pt bold)
  - Price: "$4.99/month" (16pt)
  - Background: Blue gradient
  - Benefits list:
    - 6 deck slots
    - 3 modifier options on evolution
    - +50% Chaos Dust from packs
    - Monthly Epic Shard
  - Button: "Upgrade" or "Current Tier"

- **Top Tier Card:**
  - Label: "Top Tier" (18pt bold)
  - Price: "$9.99/month" (16pt)
  - Background: Gold gradient
  - Benefits list (includes all Mid benefits +):
    - 10 deck slots
    - 4 modifier options on evolution
    - +100% Chaos Dust from packs
    - Monthly Legendary Shard
    - Access to premium card styles
  - Button: "Upgrade" or "Current Tier"

**Design Notes:**
- Current tier highlighted with gold border
- No countdown timers
- No "limited offer" pressure
- Benefits plainly listed, no marketing fluff

#### Section 2: Card Packs
- **Layout:** Vertical scrollable list, each pack type as a card

- **Standard Pack:**
  - Icon: Chaos mote icon
  - Contents: "5 random cards (Common-Rare)" (14pt)
  - Cost: "500 Chaos Dust" (18pt bold)
  - Button: "Purchase" (140x44pt)

- **Premium Pack:**
  - Icon: Shard icon
  - Contents: "5 random cards, guaranteed 1 Epic+" (14pt)
  - Cost: "1,500 Chaos Dust" (18pt bold)
  - Button: "Purchase" (140x44pt)

- **Faction Pack:**
  - Icon: Faction symbol
  - Contents: "5 cards from [Faction], guaranteed 1 Rare+" (14pt)
  - Cost: "800 Chaos Dust" (18pt bold)
  - Button: "Purchase" (140x44pt)

**Pack Opening Flow:**
- Purchase → brief animation (pack appears, shakes)
- Pack explodes into 5 cards (reveal one at a time, 0.8s each)
- Cards flip over to show art + tier
- Final screen: "Cards Added to Collection" + button to view in Collection

#### Section 3: Planar Shards
- **Layout:** Grid of shard bundles (2 columns on mobile)

- **Uncommon Shard Bundle:**
  - Icon: Uncommon shard (48x48pt)
  - Quantity: "x3" (16pt bold)
  - Price: "$1.99" (14pt)
  - Button: "Purchase"

- **Rare Shard Bundle:**
  - Icon: Rare shard
  - Quantity: "x2"
  - Price: "$3.99"
  - Button: "Purchase"

- **Epic Shard Bundle:**
  - Icon: Epic shard
  - Quantity: "x1"
  - Price: "$4.99"
  - Button: "Purchase"

- **Legendary Shard Bundle:**
  - Icon: Legendary shard
  - Quantity: "x1"
  - Price: "$9.99"
  - Button: "Purchase"

**Pricing Note:**
- Intentionally less efficient than subscribing
- Subscriptions should feel like the better deal for active players
- Shards available for players who want to accelerate a specific evolution without committing to subscription

#### Section 4: Premium Styles (Top Tier Only)
- **Layout:** Horizontal scrollable cards

- **Each Style Card:**
  - Sample card rendered in that style (200x280pt)
  - Style name (16pt bold)
  - Description: "Apply to all cards in your collection" (12pt)
  - Price: "$4.99" (one-time purchase) or "Included with Top Tier"
  - Button: "Preview" (opens modal with 6 sample cards in style)
  - Button: "Purchase" or "Apply" (if already owned)

**Style Preview Modal:**
- 6 sample cards from different factions/tiers rendered in the style
- Swipe to view each card
- "Purchase Style" button (bottom)

#### Section 5: Cosmetics
- **Layout:** Grid (2 columns on mobile)

- **Card Frames:**
  - Thumbnail: Sample card with frame applied (100x140pt)
  - Name (14pt)
  - Price: "$1.99"
  - Button: "Purchase"

- **Card Backs:**
  - Thumbnail: Card back design (100x140pt)
  - Name (14pt)
  - Price: "$1.99"
  - Button: "Purchase"

- **Board Skins:**
  - Thumbnail: Screenshot of battlefield with skin applied (140x100pt)
  - Name (14pt)
  - Price: "$2.99"
  - Button: "Preview" → full-screen screenshot
  - Button: "Purchase"

### 6.2 Currency Balance Display

**Persistent Header (all shop screens):**
- Chaos Dust: Icon + number (24pt)
- Planar Shards: Row of tier icons + numbers (16pt each)
  - Tap icon → explanation tooltip

**What Shop Does NOT Have:**
- Loot boxes (all purchases are deterministic)
- "First purchase bonus" or manipulative conversion tactics
- Currency obfuscation (real money prices always shown, no intermediary premium currency beyond Chaos Dust which is earned in-game)
- FOMO timers on core items (seasonal exclusives are cosmetic-only and clearly labeled)

### 6.3 Subscription Upgrade Prompt

Triggered when free player attempts action requiring higher tier (e.g., trying to create 4th deck).

**Modal Overlay:**
- Header: "Unlock More Deck Slots" (20pt bold)
- Body: "Upgrade to Mid Tier for 6 deck slots, 3 modifier options, and bonus Chaos Dust" (16pt)
- Subscription comparison table (simplified, 2 columns: Free vs Mid)
- Button: "Upgrade to Mid Tier — $4.99/mo" (primary, 200x52pt)
- Button: "Not Now" (secondary, text-only, bottom)

**Design Note:**
- Not aggressive or blocking
- Player can dismiss and continue using free tier
- Prompt only appears once per session for a given action

---

## 7. Onboarding Flow

New player experience optimized for immediate engagement and education.

### 7.1 First Launch Sequence

```
[App Launch - First Time]
    ↓
[Intro Cinematic (30-60s, skippable)]
    ↓
[Faction Selection]
    ↓
[Tutorial Match - Guided Battle]
    ↓
[First Evolution - Guided Flow]
    ↓
[Deck Builder Tour - Overlay Tooltips]
    ↓
[Home Screen - Free to Play]
```

### 7.2 Step-by-Step Specifications

#### Step 1: Intro Cinematic
- **Duration:** 30-60 seconds
- **Style:** Motion graphic / illustrated sequence (not video, to keep app size small)
- **Content:**
  - The world
  - Chaos rifts opening
  - Creatures transforming through the rifts
  - Planar shards appearing
  - Brief lore: "The rifts have opened. Channel their power. Transform your creatures. Master the chaos."
- **Audio:** Epic orchestral swell
- **Skip Button:** Top-right corner, always visible (44x44pt tap target)
- **Auto-advance:** After 60s, transitions to Faction Selection

#### Step 2: Faction Selection
- **Layout:** Three large cards, side-by-side (swipeable on mobile)

- **Each Faction Card:**
  - Faction name (24pt bold, top)
  - Faction icon (80x80pt, center)
  - Personality description (16pt, 2-3 lines)
    - Ironwright Collective: "Forge the perfect machine. Augment your creatures with mechanical precision."
    - Fey Courts: "Weave bonds of loyalty. Your creatures grow stronger together."
    - Demonic Kingdoms: "Embrace corruption. Sacrifice for overwhelming power."
  - Sample card (200x280pt, center) representing faction aesthetic
  - Button: "Choose [Faction]" (180x52pt, bottom)

- **Selection:**
  - Tap "Choose" button
  - Other cards fade out
  - Selected card pulses and grows
  - "You have chosen [Faction]" confirmation (2s)
  - Transition to Tutorial Match

#### Step 3: Tutorial Match (Guided Battle)
AI opponent using a simple deck. Hand-holding overlays guide the player through every action.

**Tutorial Steps (in order):**

1. **Start of Turn:**
   - Overlay: "This is the Chaos Roll. It determines which event triggers this turn."
   - D20 rolls automatically (scripted to roll 15 → Order event)
   - Overlay: "Order event triggered! Your creatures gain +1 HP."

2. **Draw Phase:**
   - Overlay: "You drew a card. You now have 1 chaos mote to spend."
   - Mana crystals pulse

3. **Main Phase:**
   - Overlay: "Drag a creature from your hand to the board."
   - Arrow points to a 1-cost creature in hand
   - Player must drag it to board (forced tutorial action)
   - Creature appears on board
   - Overlay: "Creatures have ATK (attack) and HP (health). Tap a creature to see its details."

4. **Opponent Turn (Auto-plays):**
   - Overlay: "Your opponent plays a creature and attacks."
   - Opponent creature appears, attacks (unblocked, player takes 2 damage)

5. **Your Turn - Attack Phase:**
   - Overlay: "Now it's your turn to attack. Tap your creature to select it as an attacker."
   - Arrow points to player's creature
   - Player taps creature → creature glows
   - Overlay: "Your creature will attack the opponent directly. Tap 'End Turn' to continue."

6. **Combat:**
   - Player's creature attacks, deals damage
   - Overlay: "Your creature dealt damage! The opponent's HP decreased."

7. **Chaos Roll (Scripted):**
   - Roll scripted to trigger Chaos event
   - Overlay: "A Chaos event triggered! Random effects can help or hurt you."
   - Event resolves (e.g., random creature gets +2 ATK)

8. **Modifier Introduction:**
   - Player draws a creature with an Uncommon modifier
   - Overlay: "This creature has a modifier! Tap it to see its special abilities."
   - Player taps creature → Card Detail opens
   - Overlay: "Modifiers have base effects (always active) and attuned bonuses (active when the right event triggers)."

9. **Tutorial End:**
   - AI opponent reduced to 0 HP (scripted victory)
   - Overlay: "Victory! You've mastered the basics. Now let's evolve your first card."

**Tutorial Controls:**
- Forced actions (player cannot proceed until completing the prompted action)
- Skip button (top-right): Skips entire tutorial, awards starter deck, proceeds to home screen
- Overlays are semi-transparent, never fully block the view
- No turn timer during tutorial

#### Step 4: First Evolution (Guided Flow)
Player is awarded 15 chaos energy and 1 Uncommon Shard to immediately evolve one card from starter deck.

- **Pre-selected Card:** A 2-cost creature from starter deck
- **Overlay:** "You earned enough energy to evolve this creature! Let's transform it."
- **Evolution Flow:** Same as normal (see Section 4), but with overlays explaining each step:
  - "Choose Order to stabilize, or Chaos to empower"
  - "This is your new art, generated just for you"
  - "Choose a name for your evolved creature"
  - "This is the new ability your creature gained"
  - "Choose a modifier to enhance your creature"
- **Result:** Player completes first evolution, sees fully evolved card
- **Overlay:** "You can evolve cards by playing games and earning energy. Each evolution makes your deck more powerful and unique."

#### Step 5: Deck Builder Tour
Brief overlay tooltips when player first opens Deck Builder.

- **Tooltip 1:** Points to deck name field: "Name your deck"
- **Tooltip 2:** Points to avatar selector: "Choose an avatar. Each has a different instability modifier."
- **Tooltip 3:** Points to mana curve: "This shows your deck's mana distribution. Aim for a balanced curve."
- **Tooltip 4:** Points to card pool: "Add cards from here to your deck. You need exactly 20 cards."
- **Tooltip 5:** Points to "Save Deck" button: "Save when you're done."
- All tooltips dismissible by tap or auto-advance after 4s

#### Step 6: Release to Home Screen
- **Overlay:** "You're ready! Play matches to earn chaos energy, evolve your cards, and climb the ranks."
- **Button:** "Start Playing" (180x52pt, gold glow)
- **Daily Missions:** Pre-populated with 3 easy missions:
  - "Play 1 game" → 50 Chaos Dust
  - "Evolve 1 card" → 100 Chaos Dust (already completed from tutorial)
  - "Win 1 game" → 1 Uncommon Shard

### 7.3 Starter Deck Composition

Each faction's starter deck (20 cards):

- **14 Common Creatures:**
  - 4x 1-cost (various instability values: 0, 1, 2, 3)
  - 4x 2-cost (instability 1, 2, 2, 3)
  - 3x 3-cost (instability 2, 2, 3)
  - 2x 4-cost (instability 2, 3)
  - 1x 5-cost (instability 3)

- **4 Common Spells:**
  - 1x removal (3-cost: "Deal 3 damage to a creature")
  - 1x buff (2-cost: "Give a creature +2 ATK this turn")
  - 1x heal (2-cost: "Restore 3 HP")
  - 1x draw (3-cost: "Draw 2 cards")

- **2 Common Stabilizers:**
  - 1x Order-leaning (3-cost, 0 instability, 0/4 stats, aura effect)
  - 1x Chaos-leaning (3-cost, 3 instability, 0/3 stats, aura effect)

**Additional Cards (in collection, not in deck):**
- 6 Common creatures (various costs/instability)
- 2 Common spells

**Total Starting Collection:** 28 cards (20 in starter deck + 8 extras for deck experimentation)

---

## 8. Interaction Patterns

Mobile-first design. All interactions optimized for thumb-reachable touch targets.

### 8.1 Touch Targets

**Minimum Tap Target Size:** 44x44pt (Apple HIG standard)

All interactive elements (buttons, cards, icons) meet this minimum to prevent misclicks.

**Examples:**
- Card thumbnails in grid: 100x140pt (well above minimum)
- Small icons (mana crystals, keyword icons): 20-24pt visual, but 44x44pt tap area (invisible padding)
- End Turn button: 100x44pt (exact minimum width)

### 8.2 Tap Interactions

| Element | Tap Action | Visual Feedback |
|---------|------------|----------------|
| **Card in hand** | Select to play | Card lifts 10pt, drop shadow |
| **Card on board** | Open Card Detail | Card pulses, modal slides up |
| **Creature (attack phase)** | Toggle attacker | Red glow border appears/disappears |
| **Avatar (battle)** | Open graveyard | Avatar pulses, modal slides up |
| **Button** | Execute action | Button darkens 20%, brief scale (0.95x) |
| **Tab** | Switch tab | Tab underline slides, content fades in |
| **Faction tab** | Filter collection | Tab highlights, grid updates with fade |

### 8.3 Long Press Interactions

| Element | Long Press Action | Visual Feedback | Duration |
|---------|------------------|----------------|----------|
| **Card in hand (battle)** | Preview detail without playing | Modal appears, semi-transparent background | Hold to maintain |
| **Card in deck builder** | Quick remove from deck | "Remove?" confirmation tooltip | 0.5s hold |
| **Deck in deck selector** | Open action menu (Edit/Duplicate/Delete) | Menu slides up | 0.5s hold |

### 8.4 Drag Interactions

| Element | Drag Action | Visual Feedback |
|---------|------------|----------------|
| **Card from hand → board** | Play card | Card follows finger (1.2x scale), drop zones highlight green, invalid zones red |
| **Card from hand → target** | Target spell | Card follows finger, valid targets glow green, release to cast |
| **Blocker → attacker** | Assign block | Blocker follows finger, valid attackers glow green, line connects on release |
| **Blocker → board** | Unassign block | Blocker follows finger, connection line breaks on release |
| **Hand (horizontal)** | Scroll hand | Cards slide smoothly, momentum scrolling |

**Drag Tolerance:**
- Minimum 10pt movement before drag activates (prevents accidental drags on taps)
- Drag follows finger with 0.1s smoothing (feels natural, not laggy)

### 8.5 Swipe Interactions

| Element | Swipe Direction | Action |
|---------|----------------|--------|
| **Hand (horizontal)** | Left/right | Scroll through cards in hand |
| **Collection grid** | Up/down | Scroll through card collection |
| **Deck selector (home)** | Left/right | Switch between saved decks |
| **Left edge of battle screen** | Right | Open battle log panel |
| **Card in Card Detail** | Left/right | Flip card (front: stats, back: lore) — *future* |

**Swipe Sensitivity:**
- Minimum 50pt movement to trigger swipe
- Velocity threshold: 100pt/s to distinguish from slow drag

### 8.6 Pinch/Zoom

**Not Used** — Cards are viewed at fixed sizes (hand, board, detail view). Pinch/zoom adds complexity without clear UX benefit on fixed layouts.

### 8.7 Haptic Feedback (iOS)

| Action | Haptic Type |
|--------|-------------|
| Card played | Light impact |
| Damage dealt | Medium impact |
| Creature destroyed | Heavy impact |
| Roll D20 | Light impact (on roll start) + medium impact (on result) |
| Evolution complete | Success notification |
| Error (invalid action) | Error notification |
| Button tap | Selection feedback |

**Android:** Use equivalent vibration API with similar intensity levels.

---

## 9. Responsive Considerations

Mobile-first, but supports tablets and landscape mode where appropriate.

### 9.1 Phone vs Tablet Layouts

#### Phone (Portrait, 375-428pt width)
- Collection grid: 3 columns
- Deck builder: Stacked layout (deck contents above card pool)
- Battle: Portrait orientation (see Section 3 layout)
- Shop: Single column scrolling
- Bottom tab bar: 5 tabs (icons only below 375pt width)

#### Tablet (768pt+ width)
- Collection grid: 5-6 columns
- Deck builder: Side-by-side layout (deck contents left, card pool right)
- Battle: Landscape orientation preferred (wider board visibility)
- Shop: 2-column layout for sections
- Bottom tab bar: 5 tabs (icons + labels)

### 9.2 Orientation Lock Strategy

**Battle Screen:**
- **Option 1 (Recommended):** Landscape lock during battle, portrait for all menus
  - Pros: Wider board visibility, easier to see all 5 slots at once, more hand space
  - Cons: Requires orientation change when entering/exiting battle (can be jarring)

- **Option 2 (Alternative):** Always portrait
  - Pros: No orientation changes, consistent experience, one-handed play easier
  - Cons: Cramped board layout, hand area smaller

**Decision:** Start with **Option 2 (always portrait)** for MVP to reduce complexity. Add landscape battle mode post-launch based on player feedback.

**All Other Screens:** Portrait preferred, but adapts to landscape gracefully
- Collection, Deck Builder, Shop: Layouts adjust to landscape (more columns, side-by-side panels)
- Evolution Screen: Portrait only (forced orientation during flow)

### 9.3 Safe Area Insets (iPhone Notch, etc.)

All critical UI respects safe area insets:
- Top bar: Padded below notch/Dynamic Island
- Bottom tab bar: Padded above home indicator
- Full-screen modals: Content within safe bounds, backgrounds extend to edges

### 9.4 Font Scaling (Accessibility)

Support system font size preferences (iOS: Dynamic Type, Android: Font Scale).

**Scalable Text:**
- Card names, descriptions, flavor text
- UI labels, buttons, tooltips
- Battle log entries

**Fixed-Size Text:**
- ATK/HP numbers on cards (must fit in fixed space)
- Mana cost icons (visual consistency required)

**Overflow Handling:**
- Long card names: Truncate with ellipsis (…) after 25 characters
- Long modifier descriptions: Scrollable in Card Detail view
- Long flavor text: Scrollable in flavor text box

---

## 10. Animation & Timing Specifications

Consistent animation speeds create a polished feel.

### 10.1 Standard Durations

| Animation Type | Duration | Easing |
|---------------|----------|--------|
| **Modal slide in/out** | 0.3s | Ease-out |
| **Card flip** | 0.4s | Ease-in-out |
| **Button press** | 0.1s | Linear |
| **Page transition** | 0.25s | Ease-out |
| **Tooltip appear/dismiss** | 0.2s | Ease-out |
| **Card draw** | 0.5s | Ease-out (card slides from deck to hand) |
| **Card play** | 0.6s | Ease-out (hand → board) |
| **Damage number** | 0.8s | Ease-out (flies up, fades) |
| **Death animation** | 1.2s | Ease-in (dissolves) |
| **D20 roll** | 1.5-2.5s | Custom (bounce, settle) |
| **Evolution shard crack** | 0.6s | Ease-in-out |
| **Art reveal** | 1.2s | Ease-out (iris wipe) |

### 10.2 Animation Priorities

Animations never block critical actions. Player can always tap to skip or accelerate non-essential animations.

**Skippable:**
- Evolution animations (tap to skip to reveal)
- Intro cinematic (skip button always visible)
- Flavor text typing (tap to complete instantly)

**Non-Skippable (Critical for Game State):**
- Combat damage resolution (must see what died)
- D20 roll result (must see event outcome)
- Card draw (must see what was drawn)

### 10.3 Reduced Motion Mode

When "Reduced Motion" is enabled in settings:
- D20 roll: Instant result display (no spinning/bouncing)
- Card animations: Fade instead of slide
- Damage numbers: Static display instead of flying
- Particle effects: Disabled
- Screen shake: Disabled

---

## 11. Error States & Edge Cases

### 11.1 Network Loss

**During Matchmaking:**
- Show "Connection lost" toast
- Cancel matchmaking automatically
- Return to mode selection screen

**During Battle:**
- Show "Reconnecting..." overlay
- Attempt reconnect for 10 seconds
- If reconnect successful: Resume game
- If reconnect fails: Forfeit game, count as loss, return to home screen

**During Evolution:**
- If AI generation fails: Show error modal, refund shard + energy, return to Card Detail
- If network lost before save: Evolution not committed, return to Card Detail with retry option

### 11.2 Empty States

| Screen | Empty Condition | Empty State Message | CTA |
|--------|----------------|---------------------|-----|
| **Collection** | No cards in faction | "No cards in this faction yet. Visit the Shop!" | "Visit Shop" button |
| **Deck Builder** | No cards in deck | "Add cards to your deck from the card pool below" | (None, instructions only) |
| **Friends List** | No friends | "Add friends to challenge them and view their profiles!" | "Add Friend" button |
| **Graveyard** | No destroyed cards | "No cards destroyed yet this game" | (None, close graveyard) |
| **Shop Shards** | Out of shards | "Out of shards. Purchase more to evolve your cards." | (Shop section, no special CTA) |

### 11.3 Validation Messages

| Invalid Action | Message | Display Type |
|---------------|---------|-------------|
| **Deck full (20/20)** | "Deck is full" | Toast (2s, bottom) |
| **Not enough mana** | "Not enough mana" | Toast (1s, red) |
| **Max Legendaries (2/2)** | "Deck already has 2 Legendaries" | Toast (2s, bottom) |
| **Max copies (2/2)** | "Already have 2 copies of this card" | Toast (2s, bottom) |
| **Card not evolution-ready** | "Card needs [X] more energy or a shard" | Tooltip on "Evolve" button (disabled) |
| **Purchase failed** | "Purchase failed. Please try again." | Modal (error icon, "OK" button) |

---

## 12. Accessibility Features

### 12.1 Colorblind Modes

**Supported Modes:**
- Deuteranopia (red-green)
- Protanopia (red-green)
- Tritanopia (blue-yellow)

**Implementation:**
- Order/Chaos indicators: Use icons + patterns, not just color
  - Order: Blue + striped pattern + crystal icon
  - Chaos: Red + dotted pattern + flame icon
- Attunement indicators: Shapes + color
  - Order-attuned: Blue circle
  - Chaos-attuned: Red triangle
  - Neutral: Gray square
- HP bars: Green → yellow → red remains (but also shows numeric HP always)

### 12.2 Screen Reader Support (Aspirational)

**Basic Labeling:**
- All cards: Name, ATK, HP, mana cost, tier, keywords read aloud
- All buttons: Clear labels ("End Turn", "Play Card", "Evolve")
- Battle state: "Your turn, 45 seconds remaining, 3 creatures on board, instability 8"

**Priority:** Post-MVP, but architecture should not block future implementation.

### 12.3 Turn Timer Extension

**Setting:** "Extended Turn Timer" (Casual and Practice only)
- Standard: 60 seconds
- Extended: 90 seconds
- Ranked: Always 60 seconds (fairness)

### 12.4 Text Scaling

See Section 9.4 (Responsive Considerations)

### 12.5 One-Handed Play

All critical battle interactions reachable in portrait mode with thumb-only input:
- Hand area: Bottom (thumb zone)
- End Turn button: Bottom-right (thumb zone)
- Mana display: Bottom-left (thumb zone)
- Card on board: Tap to view (center screen, reachable)
- No essential controls in top corners (opponent info is read-only)

---

## 13. Dark Theme & Visual Styling

### 13.1 Color Palette

**Base Colors:**
- Background (darkest): #0D0D0D
- Surface (cards, panels): #1A1A1A
- Surface elevated (modals): #242424
- Borders: #3A3A3A
- Text primary: #FFFFFF
- Text secondary: #B0B0B0

**Faction Accents (used for highlights, borders, glows):**
- Ironwright Collective: #4A90E2 (steel blue)
- Fey Courts: #7ED321 (verdant green)
- Demonic Kingdoms: #D0021B (crimson red)

**Event Colors:**
- Order: #5BC0EB (light blue)
- Chaos: #E63946 (bright red)
- Neutral: #F1F1F1 (white)

**Tier Colors (card borders, badges):**
- Common: #9E9E9E (gray)
- Uncommon: #4CAF50 (green)
- Rare: #2196F3 (blue)
- Epic: #9C27B0 (purple)
- Legendary: #FFD700 (gold)

### 13.2 Typography

**Font Family:**
- Primary: System font (SF Pro on iOS, Roboto on Android) for UI
- Display: Custom serif or fantasy font for card names, lore (TBD based on art direction)

**Font Sizes (Base, scales with Dynamic Type):**
- Display large (card names): 24pt
- Headline (section headers): 20pt
- Body large (card descriptions): 16pt
- Body (UI labels): 14pt
- Caption (metadata): 12pt
- ATK/HP numbers on board: 16pt bold
- ATK/HP numbers in detail: 28pt bold

### 13.3 Card Frame Design

**Standard Card:**
- Aspect ratio: 5:7 (portrait)
- Border: 4pt, color matches tier
- Corners: 8pt radius
- Art area: Top 65% of card
- Stats area: Bottom 35%, dark gradient overlay
- Tier badge: Top-right corner, 24x24pt circle

**Card on Board (Compact):**
- Aspect ratio: Same (5:7)
- Smaller size (60x85pt on phone)
- Border glows when selected (4pt glow, color = action type)
  - Attack: Red glow
  - Block: Green glow
  - Attunement active: Blue (Order) or Red (Chaos) glow

**Card in Hand (Full Art):**
- Larger size (90x130pt on phone)
- Full art visible, stats overlay at bottom
- Tap to lift, drag to play

---

## 14. Settings Screen

Accessible from gear icon in header (top-right, 44x44pt) or Profile tab.

### 14.1 Settings Categories

**Account:**
- Display Name (editable field, 3-20 characters)
- Friend Code (read-only, copyable: "AB1234")
- Linked Account (Apple ID / Google Play)
- Data Export (download all player data as JSON)
- Delete Account (requires confirmation + password)

**Audio:**
- Master Volume (slider, 0-100%)
- Music Volume (slider, 0-100%)
- SFX Volume (slider, 0-100%)
- Mute All (toggle)

**Visuals:**
- Reduced Motion (toggle: on/off)
- Colorblind Mode (dropdown: Off | Deuteranopia | Protanopia | Tritanopia)
- Card Animation Quality (dropdown: Full | Reduced | Minimal)
- Screen Shake (toggle: on/off)
- Theme (dropdown: Dark | Light — *future*, MVP is dark-only)

**Gameplay:**
- Turn Timer (dropdown: Standard 60s | Extended 90s — only for Casual/Practice)
- Auto-End Turn (toggle: on/off — auto-ends turn if no actions available)
- Confirm Before End Turn (toggle: on/off — requires long-press on End Turn button)
- Default Play Mode (dropdown: Ranked | Casual | Practice — used when tapping "Play" on home)

**Notifications:**
- Daily Reward Reminder (toggle)
- Evolution Ready Alert (toggle)
- Friend Activity (toggle)
- Season Ending Reminder (toggle)
- Default: Daily rewards ON, everything else OFF

**Privacy:**
- Block Friend Requests (toggle)
- Hide Profile from Non-Friends (toggle)
- Hide Online Status (toggle)

### 14.2 Settings Layout

**Mobile (Portrait):**
- Scrollable vertical list
- Each section is a collapsible accordion
- Tap section header to expand/collapse
- Active section highlighted

**Tablet (Landscape):**
- Two-column layout: Category list (left), settings panel (right)
- Tap category to show settings in right panel
- No accordion (all settings visible in panel)

---

## 15. Post-Match Results Screen

Appears immediately after battle ends (win/loss/surrender).

### 15.1 Layout

**Top Section: Result**
- Large text: "VICTORY" or "DEFEAT" (32pt bold)
- Background: Gold gradient (victory) or dark gray (defeat)
- Small text: Reason (e.g., "Opponent reduced to 0 HP" or "You surrendered")

**Middle Section: Rewards Breakdown**
- **XP Earned:**
  - Player XP: +50 (win) or +25 (loss)
  - Progress bar showing level progress

- **Card XP Earned:**
  - List of cards that gained chaos energy (max 5 shown, "and 15 more" if > 5)
  - Each card: Thumbnail + name + "[+2 Energy]" (green if evolution-ready)
  - If any card is now evolution-ready: Pulsing glow + "READY TO EVOLVE!" badge

- **Chaos Dust Earned:**
  - Icon + number (e.g., "+100 Dust")

- **Quest Progress:**
  - Any completed quests shown (e.g., "Daily Quest: Win 3 games → 2/3")

**Bottom Section: Opponent Profile Card**
- Opponent's avatar (60x60pt)
- Opponent's name, rank badge
- Opponent's showcase (3 cards, small thumbnails)
- Button: "Add Friend" (if not already friends)
- Button: "View Profile" (opens opponent's full profile)

**Action Buttons (bottom):**
- "Play Again" (primary, 180x52pt, gold) — re-queues with same deck
- "Evolve Cards" (secondary, 180x52pt, blue) — if any cards evolution-ready, goes to Collection filtered to ready cards
- "Home" (text button, bottom-left)

### 15.2 Evolution-Ready Flow

If any card reached evolution threshold this game:
- Post-match screen highlights it ("Ready to Evolve!" badge)
- Tap "Evolve Cards" button → Collection screen, filtered to evolution-ready cards
- Tap a ready card → Card Detail → "Evolve" button glowing
- Tap "Evolve" → Evolution flow (see Section 4)

---

## 16. File Naming & Asset Organization

For engineering handoff, all UI assets should follow consistent naming conventions.

### 16.1 Asset Naming Convention

```
[category]_[element]_[variant]_[state]_[size].png
```

**Examples:**
- `icon_chaos_mote_filled_24.png`
- `icon_shard_uncommon_48.png`
- `button_primary_default_large.png`
- `button_primary_pressed_large.png`
- `card_frame_common_default.png`
- `avatar_ironwright_01_portrait_60.png`

### 16.2 Asset Categories

- `icon_` — UI icons (mana, shards, keywords, factions)
- `button_` — Button states (default, pressed, disabled)
- `card_` — Card frames, borders, badges
- `avatar_` — Avatar portraits
- `bg_` — Background images (battle screen, home screen)
- `particle_` — Particle effects (evolution, events, damage)
- `sfx_` — Sound effects (see `08-audio-design.md`)
- `music_` — Music tracks (see `08-audio-design.md`)

### 16.3 Size Variants

All raster assets provided in 1x, 2x, 3x for iOS (and equivalent for Android: mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi).

**Icon Sizes:**
- Small: 16pt, 20pt, 24pt
- Medium: 32pt, 40pt, 48pt
- Large: 60pt, 80pt

**Card Sizes:**
- Thumbnail: 100x140pt
- Hand: 90x130pt
- Board: 60x85pt
- Detail: 300x430pt

---

## 17. Open UI/UX Questions & Future Enhancements

### Resolved for MVP:
- Orientation lock: Portrait-only for MVP
- Card flip interaction: Front-only for MVP, back (lore) deferred
- Spectating/replays: Post-launch

### Deferred to Post-Launch:
- Light theme option
- Advanced battle log filters (e.g., "show only Chaos events")
- Deck import/export (share deck codes with friends)
- Card comparison tool (side-by-side stat comparison)
- Collection stats dashboard (total cards owned by faction/tier)
- Battle history (past 10 games with replay links)

### Open Questions for Playtesting:
- Turn timer: Is 60s too short for new players? Monitor surrender/timeout rates.
- Hand scrolling: Is horizontal swipe sufficient, or do we need pagination?
- Modifier selection: Are 2/3/4 options enough differentiation for tiers? Monitor conversion rates.
- Evolution flow: Is the full flow (9 steps) too long? Monitor skip rates.

---

## Document Complete

This UI/UX specification provides all necessary details for engineering to implement the Chaos Creatures interface. Every screen, interaction pattern, animation, and edge case has been defined.

**Next Steps:**
- Engineering: Use this spec to implement UI components and screens
- Design: Create high-fidelity mockups based on this spec (Figma/Sketch)
- QA: Use this spec as acceptance criteria for UI testing

**Related Documents:**
- `00-game-design-master.md` — Overall game systems and design philosophy
- `01-battle-mechanics.md` — Battle rules, turn structure, keyword interactions
- `02-card-data-model.md` — Data structures for cards, decks, game state
- `08-audio-design.md` — Audio specifications for UI interactions
- `10-prd.md` — Formal PRD for engineering handoff

---

*Document Version: 1.0*
*Last Updated: 2026-02-16*
*Status: Complete — Ready for Engineering Handoff*
