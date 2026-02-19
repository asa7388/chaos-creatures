# PHASE1D — UI/UX Design: 5-Faction Expansion + Planar Ruins

**Chaos Creatures — Faction Expansion UI/UX Specification**
**Version: 1.0 — Native iOS: Swift + SwiftUI + SpriteKit**
**Agent: ui-ux-designer (Phase 1D)**

This document specifies all UI/UX changes required to expand the game from 3 to 5 factions, integrate the Planar Ruins card type, redesign the user journey, and update every screen for the new content. All specs target the native iOS app (Swift + SwiftUI + SpriteKit). The admin dashboard (Next.js on Vercel) is out of scope for this document.

**Depends on:** `PLAN-faction-expansion.md`, `07-ui-ux-specs.md`, `00-game-design-master.md`, `01-battle-mechanics.md`, `02-card-data-model.md`

---

## Revision Log

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-02-18 | ui-ux-designer agent | Initial document: all 8 sections |

---

## Table of Contents

1. [Card Visual Design for 5 Factions + Planar Ruins](#1-card-visual-design)
2. [User Journey: Download to First Purchase](#2-user-journey)
3. [5-Faction Picker Redesign](#3-faction-picker)
4. [Ruin Collection, Evolution, and Battlefield UI](#4-ruin-ui)
5. [Collection & Deck Builder for Creatures + Ruins](#5-collection-deck-builder)
6. [Shop/IAP Layout for 5 Factions](#6-shop-iap)
7. [Screen-by-Screen Audit](#7-screen-audit)
8. [Accessibility](#8-accessibility)

---

## 1. Card Visual Design for 5 Factions + Planar Ruins {#1-card-visual-design}

### 1.1 Full-Art Creature Card Layout (All 5 Factions)

Every creature card uses the same full-art layout. Art fills the entire card face (5:7 aspect ratio). No bordered frame. Faction identity is expressed through color accents, not structural frame differences.

```
┌─────────────────────────────────────┐
│                                     │  Full-bleed AI-generated art
│                                     │  fills entire card face
│              [CARD ART]             │
│            (full bleed)             │
│                                     │
│                                     │
│  [Faction Icon]          [Rarity]   │  Top corners: faction emblem
│   16x16pt, top-left      glow      │  (semi-transparent) + rarity
│                                     │  edge treatment
│                                     │
│                                     │
├─────────────────────────────────────┤
│ ░░░░░░ Translucent Panel ░░░░░░░░░ │  Bottom 30%: translucent
│                                     │  black panel (opacity 0.75)
│  CARD NAME           [Keyword Icons]│  with gaussian blur backdrop
│  (Cinzel, 14pt bold)  (16x16 each) │
│                                     │
│  "Flavor text in Alegreya italic"   │  Faction accent color as
│                                     │  1pt line at panel top edge
│  [CM cost]    [ATK ⚔]    [HP ❤]   │
│  chaos mote    sword      heart     │  Stat icons: faction-tinted
│  icon, left    center     right     │
└─────────────────────────────────────┘
  ↑ Rarity edge glow wraps entire card border
```

**Translucent Text Panel Spec:**

```swift
// Bottom overlay panel on each card
ZStack(alignment: .bottom) {
    // Card art fills entire space
    AsyncImage(url: card.artURL) { image in
        image.resizable().aspectRatio(5.0/7.0, contentMode: .fill)
    }

    // Translucent panel
    VStack(alignment: .leading, spacing: 4) {
        // Faction accent line at top of panel
        Rectangle()
            .fill(factionAccentColor(card.faction))
            .frame(height: 1)

        HStack {
            Text(card.name)
                .font(.custom("Cinzel-Bold", size: 14))
                .foregroundColor(.white)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Spacer()
            HStack(spacing: 4) {
                ForEach(card.keywords.prefix(3), id: \.self) { kw in
                    Image(keywordIconName(kw))
                        .resizable().frame(width: 16, height: 16)
                }
            }
        }

        Text(card.flavorText)
            .font(.custom("Alegreya-Italic", size: 10))
            .foregroundColor(Color.white.opacity(0.7))
            .lineLimit(2)

        HStack {
            StatIconView(icon: "chaos_mote", value: card.manaCost, tint: .white)
            Spacer()
            StatIconView(icon: "sword_atk", value: card.atk, tint: factionAccentColor(card.faction))
            Spacer()
            StatIconView(icon: "heart_hp", value: card.hp, tint: factionAccentColor(card.faction))
        }
    }
    .padding(.horizontal, 8)
    .padding(.vertical, 6)
    .background(.ultraThinMaterial.opacity(0.85))
    .background(Color.black.opacity(0.5))
}
.cornerRadius(8)
```

### 1.2 Faction Color Accents

Each faction applies its accent color to: the 1pt line at the top of the translucent panel, the stat icon tints, the card border on selection, and the rarity glow hue shift.

| Faction | Primary Accent | Secondary Accent | Panel Line Color | Background Tint |
|---|---|---|---|---|
| Ironwright Collective | `#E07020` (warning orange) | `#3B82C4` (reactor blue) | `#E07020` | `#1A1D23` |
| Fey Courts | `#7ED321` (forest green) | `#00BCD4` (bioluminescent teal) | `#7ED321` | `#0D1A0D` |
| Demonic Kingdoms | `#D0021B` (blood red) | `#FF6B35` (hellfire orange) | `#D0021B` | `#1A0D0D` |
| Celestial Crusade | `#DAA520` (holy gold) | `#3B5998` (righteous blue) | `#DAA520` | `#1A1520` |
| The Endless | `#6B3FA0` (necrotic purple) | `#5F9EA0` (ghostly teal) | `#6B3FA0` | `#0D0D1A` |

```swift
enum FactionColor {
    // Primary accents (used for UI highlights, panel lines, stat tints)
    static func accent(_ faction: Faction) -> Color {
        switch faction {
        case .ironwright: return Color(hex: "#E07020")
        case .feyCourts:  return Color(hex: "#7ED321")
        case .demonic:    return Color(hex: "#D0021B")
        case .celestial:  return Color(hex: "#DAA520")
        case .endless:    return Color(hex: "#6B3FA0")
        }
    }

    // Secondary accents (used for gradients, secondary UI elements)
    static func secondary(_ faction: Faction) -> Color {
        switch faction {
        case .ironwright: return Color(hex: "#3B82C4")
        case .feyCourts:  return Color(hex: "#00BCD4")
        case .demonic:    return Color(hex: "#FF6B35")
        case .celestial:  return Color(hex: "#3B5998")
        case .endless:    return Color(hex: "#5F9EA0")
        }
    }

    // Battlefield background tint
    static func background(_ faction: Faction) -> Color {
        switch faction {
        case .ironwright: return Color(hex: "#1A1D23")
        case .feyCourts:  return Color(hex: "#0D1A0D")
        case .demonic:    return Color(hex: "#1A0D0D")
        case .celestial:  return Color(hex: "#1A1520")
        case .endless:    return Color(hex: "#0D0D1A")
        }
    }
}
```

### 1.3 Faction Icon Placement

Each card displays its faction emblem at 16x16pt in the top-left corner of the card, semi-transparent (opacity 0.4) so it does not compete with the art. The icon uses a subtle drop shadow for legibility against varied art backgrounds.

Faction emblems (512x512 source, rendered at 16x16):
- **Ironwright**: Gear-flower with rebar accents (cold iron gray)
- **Fey Courts**: Crescent moon entwined with tree roots (forest green)
- **Demonic**: Horned skull wreathed in flame (blood red)
- **Celestial**: Radiant sun with wings (holy gold)
- **Endless**: Cracked skull with spectral wisps (necrotic purple)

### 1.4 Rarity Treatments

Rarity is expressed exclusively through the card's border edge treatment. No badges or text labels for rarity on the card face itself.

| Rarity | Visual Treatment | Implementation |
|---|---|---|
| **Common** | No visible border. Matte card surface. | `.overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.clear))` |
| **Uncommon** | Thin metallic silver border (1.5pt). Subtle sheen. | `.overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "#C0C0C0"), lineWidth: 1.5))` |
| **Rare** | Glowing blue border (2pt). Slow pulse animation. | `SKAction.repeatForever` glow cycle on border `SKShapeNode`, `#2196F3` |
| **Epic** | Purple shimmer border (2.5pt). `SKShader` for iridescent effect. | Custom `SKShader` fragment producing shifting purple-to-magenta gradient along border path |
| **Legendary** | Gold prismatic border (3pt). Particle emitter along edge. | `SKEmitterNode` emitting small gold sparks that travel the card perimeter. Border `#FFD700` with animated gradient via `SKShader`. |

SpriteKit rarity implementations for `BoardCardNode`:

```swift
extension BoardCardNode {
    func applyRarityTreatment(_ rarity: CardRarity) {
        // Remove previous rarity nodes
        childNode(withName: "rarityBorder")?.removeFromParent()
        childNode(withName: "rarityEmitter")?.removeFromParent()

        switch rarity {
        case .common:
            break // No treatment

        case .uncommon:
            let border = SKShapeNode(rectOf: self.size, cornerRadius: 6)
            border.name = "rarityBorder"
            border.strokeColor = UIColor(hex: "#C0C0C0")
            border.lineWidth = 1.5
            border.fillColor = .clear
            addChild(border)

        case .rare:
            let border = SKShapeNode(rectOf: self.size, cornerRadius: 6)
            border.name = "rarityBorder"
            border.strokeColor = UIColor(hex: "#2196F3")
            border.lineWidth = 2.0
            border.fillColor = .clear
            let pulse = SKAction.sequence([
                SKAction.run { border.alpha = 1.0 },
                SKAction.fadeAlpha(to: 0.5, duration: 1.0),
                SKAction.fadeAlpha(to: 1.0, duration: 1.0)
            ])
            border.run(SKAction.repeatForever(pulse))
            addChild(border)

        case .epic:
            let border = SKShapeNode(rectOf: self.size, cornerRadius: 6)
            border.name = "rarityBorder"
            border.strokeColor = UIColor(hex: "#9C27B0")
            border.lineWidth = 2.5
            border.fillColor = .clear
            // Shimmer via color cycle
            let shimmer = SKAction.sequence([
                SKAction.customAction(withDuration: 2.0) { node, elapsed in
                    let hue = 0.75 + 0.08 * sin(Double(elapsed) * .pi)
                    (node as? SKShapeNode)?.strokeColor = UIColor(
                        hue: CGFloat(hue), saturation: 0.8, brightness: 0.8, alpha: 1.0
                    )
                }
            ])
            border.run(SKAction.repeatForever(shimmer))
            addChild(border)

        case .legendary:
            let border = SKShapeNode(rectOf: self.size, cornerRadius: 6)
            border.name = "rarityBorder"
            border.strokeColor = UIColor(hex: "#FFD700")
            border.lineWidth = 3.0
            border.fillColor = .clear
            // Prismatic color shift
            let prismatic = SKAction.customAction(withDuration: 3.0) { node, elapsed in
                let hue = (Double(elapsed) / 3.0).truncatingRemainder(dividingBy: 1.0)
                (node as? SKShapeNode)?.strokeColor = UIColor(
                    hue: CGFloat(hue), saturation: 0.6, brightness: 1.0, alpha: 1.0
                )
            }
            border.run(SKAction.repeatForever(prismatic))
            addChild(border)

            // Particle emitter along edges
            if let emitter = SKEmitterNode(fileNamed: "LegendaryBorderParticles") {
                emitter.name = "rarityEmitter"
                emitter.zPosition = self.zPosition + 1
                addChild(emitter)
            }
        }
    }
}
```

### 1.5 Planar Ruins Card Layout

Planar Ruins use the same full-art approach but are visually distinct from creature cards in three ways:

1. **Aspect ratio**: Same 5:7 card dimensions, but the translucent panel uses a **stone texture** overlay instead of the plain dark blur used for creatures.
2. **No ATK stat**: The ATK position shows an effect description icon instead.
3. **Ruin type badge**: A small stone pillar icon (12x12pt) replaces the creature silhouette indicator in the top-right corner.

```
┌─────────────────────────────────────┐
│                                     │
│         [RUIN ART]                  │  Art depicts ancient structure
│       (full bleed)                  │  — stone, crystal, planar
│                                     │  energy. NOT a creature.
│  [Faction Icon     [Stone Pillar    │
│   or Neutral       Badge 12x12]    │
│   Emblem 16x16]                     │
│                                     │
│                                     │
├═════════════════════════════════════┤  ← Double-line separator
│ ▓▓▓▓▓ Stone-textured Panel ▓▓▓▓▓▓ │  (instead of single faction
│                                     │  accent line)
│  RUIN NAME           [Status Badge] │
│  (Cinzel, 14pt)      Neutral/Evolved│
│                                     │
│  Effect: "+1 HP to all friendly     │  Effect text: Alegreya 11pt,
│  creatures"                         │  up to 3 lines
│                                     │
│  [CM cost]   [Effect Icon]  [HP ❤] │  No ATK — replaced by
│  chaos mote   scroll icon   heart   │  effect scroll icon
└─────────────────────────────────────┘
```

**Neutral vs Evolved Ruin Visual Differences:**

| Property | Neutral Ruin | Evolved Ruin |
|---|---|---|
| Faction icon | Generic planar icon (blue-white crystal) | Faction emblem |
| Panel accent | `#8E99A4` (pale stone gray) | Faction primary accent color |
| Status badge | "NEUTRAL" pill, gray | "[FACTION]" pill, faction color |
| Art aesthetic | Ancient, pale, crystalline, otherworldly | Faction-themed transformation (see art direction) |
| Card border | None (matte, like Common creature) | Faction accent glow, 2pt |
| Effect text color | White | Faction accent tint |
| Stone texture tint | Warm sandstone `#D4C5A9` at 10% opacity | Faction background tint at 15% opacity |

```swift
struct RuinCardView: View {
    let ruin: RuinInstance

    var isEvolved: Bool { ruin.factionId != nil }

    var panelAccentColor: Color {
        if let faction = ruin.faction {
            return FactionColor.accent(faction)
        }
        return Color(hex: "#8E99A4") // neutral stone gray
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            // Full-bleed ruin art
            AsyncImage(url: ruin.artURL) { image in
                image.resizable().aspectRatio(5.0/7.0, contentMode: .fill)
            } placeholder: { RuinArtPlaceholder() }

            // Top-left faction/neutral icon
            VStack {
                HStack {
                    Image(isEvolved ? factionIconName(ruin.faction!) : "icon_planar_neutral")
                        .resizable().frame(width: 16, height: 16)
                        .opacity(0.5)
                        .shadow(radius: 2)
                    Spacer()
                    Image("icon_ruin_pillar")
                        .resizable().frame(width: 12, height: 12)
                        .opacity(0.5)
                }
                .padding(6)
                Spacer()
            }

            // Stone-textured translucent panel
            VStack(alignment: .leading, spacing: 4) {
                // Double-line separator
                VStack(spacing: 2) {
                    Rectangle().fill(panelAccentColor).frame(height: 1)
                    Rectangle().fill(panelAccentColor.opacity(0.5)).frame(height: 1)
                }

                HStack {
                    Text(ruin.name)
                        .font(.custom("Cinzel-Bold", size: 14))
                        .foregroundColor(.white)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                    Spacer()
                    // Status badge
                    Text(isEvolved ? ruin.faction!.displayName : "NEUTRAL")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(isEvolved ? .black : .white)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(isEvolved ? panelAccentColor : Color(hex: "#666666"))
                        .cornerRadius(4)
                }

                // Effect text
                Text(ruin.effectDescription)
                    .font(.custom("Alegreya", size: 11))
                    .foregroundColor(isEvolved ? panelAccentColor : .white)
                    .lineLimit(3)

                HStack {
                    StatIconView(icon: "chaos_mote", value: ruin.manaCost, tint: .white)
                    Spacer()
                    Image("icon_scroll_effect")
                        .resizable().frame(width: 16, height: 16)
                        .opacity(0.6)
                    Spacer()
                    StatIconView(icon: "heart_hp", value: ruin.hp, tint: panelAccentColor)
                }
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 6)
            .background(
                ZStack {
                    Color.black.opacity(0.6)
                    // Stone texture overlay
                    Image("texture_stone_panel")
                        .resizable()
                        .opacity(0.1)
                        .blendMode(.overlay)
                }
            )
            .background(.ultraThinMaterial.opacity(0.7))
        }
        .cornerRadius(8)
        .overlay(
            // Evolved ruin border glow
            RoundedRectangle(cornerRadius: 8)
                .stroke(isEvolved ? panelAccentColor : Color.clear, lineWidth: 2)
        )
    }
}
```

### 1.6 Card Type Differentiators at a Glance

Players must instantly distinguish creatures from ruins on the battlefield, in the hand, and in the collection. The visual cues are:

| Visual Cue | Creature | Planar Ruin |
|---|---|---|
| Bottom panel texture | Plain dark blur | Stone texture overlay |
| Panel top separator | Single 1pt faction accent line | Double-line (2 lines, 2pt apart) |
| Stats row | CM / ATK / HP | CM / Effect Icon / HP |
| Top-right badge | None (or keyword icons) | Stone pillar icon |
| Card silhouette feel | Organic, living subjects | Architectural, structural subjects |
| Battlefield slot marker | None | Small stone pillar icon below the slot |

---

## 2. User Journey: Download to First Purchase {#2-user-journey}

### 2.1 Complete Journey Map

The updated user journey for 5 factions with Planar Ruins:

```
[App Store Discovery]
    |
    v
[1] DOWNLOAD & LAUNCH
    First launch → splash screen with game logo + loading
    |
    v
[2] ACCOUNT CREATION
    Apple Sign-In (single tap) → username picker
    |
    v
[3] INTRO CINEMATIC (skippable)
    5 static illustration panels — lore setup
    Panel 6 (NEW): "Ancient ruins from a lost civilization
    dot the landscape..." (introduces Planar Ruins concept)
    |
    v
[4] FIVE-FACTION TRIAL (NEW — replaces 3-faction trial)
    Swipeable faction showcase → pick first trial faction →
    play 1 trial match (vs AI) → shown "Try another?" prompt →
    minimum 2 factions tried, maximum all 5 →
    each trial uses loaner deck (creatures only, no ruins)
    |
    v
[5] FACTION COMMITMENT
    Pick your starting faction. Trial deck becomes real collection.
    Other loaner decks returned.
    Receive: 20 owned Commons + starter avatar + 50 Chaos Dust +
    2 Planar Shards (Uncommon)
    |
    v
[6] TUTORIAL MATCH (guided)
    Full guided match vs AI with tutorial overlay.
    Fixed scripted outcome (player wins). All turn phases taught.
    |
    v
[7] FIRST EVOLUTION (guided)
    Server pre-awards 15 energy to one creature. Player walks
    through evolution flow with tutorial tooltips.
    |
    v
[8] DECK BUILDER TOUR
    5-tooltip guided tour of deck builder.
    |
    v
[9] RELEASE TO HOME SCREEN
    "You're ready!" → Home tab. 3 starter daily quests seeded.
    |
    v
[10] DAILY LOOP (ongoing)
    Complete daily quests (play matches, evolve cards, win with
    faction) → earn Chaos Dust + XP → buy packs → evolve cards →
    build decks → climb ranked
    |
    v
[11] DISCOVER PLANAR RUINS (organic, ~session 3-5)
    Quest: "Play 5 matches" → reward: 1 Neutral Ruin card.
    Toast notification: "You discovered a Planar Ruin!"
    Guided tooltip on ruin in collection: "Ruins are ancient
    structures that provide benefits on the battlefield."
    Player adds ruin to deck via deck builder.
    |
    v
[12] FIRST RUIN IN BATTLE
    Player plays ruin to a battlefield slot. Tooltip appears:
    "Your ruin provides [effect] to nearby creatures. Protect it!"
    |
    v
[13] FIRST RUIN EVOLUTION (~session 8-12)
    Ruin accumulates familiarity energy. Evolution-ready badge
    appears. Player evolves neutral ruin into faction variant.
    Single-step evolution (not 4-tier like creatures).
    |
    v
[14] UNLOCK SECOND FACTION (organic, ~session 10-20)
    Player accumulates 150 Chaos Dust. Shop prompt or quest
    reward triggers interest. Player buys second faction pack.
    New creatures + new deck building options.
    |
    v
[15] FIRST PURCHASE TRIGGER (~session 15-30)
    Triggers (one or more):
    a. Evolution choice frustration: "2 options not enough" →
       Subscription upsell: "Refined Shard: 3 options"
    b. Art quality desire: Player sees a friend's Prismatic
       evolution → wants higher-res, more dramatic transforms
    c. Collection desire: Wants more cards per faction, hits
       50-card cap → Mid tier unlocks 100
    d. Convenience: Wants priority queue for evolution generation
    |
    v
[CONVERSION]
    Player visits Shop → views subscription comparison →
    upgrades to Refined Shard ($6.99/mo) or Prismatic Shard
    ($12.99/mo) via StoreKit 2
```

### 2.2 Trial Phase Detail (Step 4 — New 5-Faction Design)

The old 3-faction trial had players try all 3 factions. With 5 factions, requiring all 5 trials would be too long. The new design:

**Flow:**
1. Player sees the 5-faction showcase (Section 3 below).
2. Player picks their first trial faction.
3. Player plays 1 match with that faction's loaner deck (vs AI bot, easy difficulty).
4. Post-match: "Try another faction?" screen.
   - "Try Another" button (primary, prominent) → returns to faction picker with tried faction grayed out.
   - "I'm ready to choose" button (secondary) → requires minimum 2 factions tried.
5. After trying 2+ factions, "Choose My Faction" button becomes active.
6. After trying all 5, auto-advance to faction commitment.

**Loaner Deck Rules:**
- 20-card all-Common creature decks. No ruins (ruins are discovered later).
- Cards are NOT owned — cannot be evolved, traded, or kept (except the chosen faction's deck).
- Each loaner deck showcases the faction's mechanic clearly (e.g., Celestial loaner has 3-4 Exalt creatures that demonstrate the aura effect).

**UX Principle:** Respect the player's time. 2 trials (3-5 minutes each) is the minimum before committing. Players who want to try all 5 can, but are never forced to.

### 2.3 Planar Ruins Discovery (Step 11 — Organic Introduction)

Ruins are NOT introduced during onboarding. They appear as a mid-session discovery to avoid overwhelming new players.

**Trigger:** Completing the quest "Play 5 Matches" (typically session 3-5). This quest is seeded during onboarding.

**Reward Presentation:**

```
┌────────────────────────────────────────────────┐
│                                                │
│  ✦ NEW DISCOVERY ✦                             │
│                                                │
│  [Large ruin art, 200x280pt]                   │
│                                                │
│  "Stabilization Aura"                          │
│  PLANAR RUIN — NEUTRAL                         │
│                                                │
│  "An ancient structure from a civilization      │
│   that predates all known factions. Its walls   │
│   hum with stabilizing energy."                │
│                                                │
│  Effect: +1 HP to all friendly creatures       │
│  HP: 6  |  CM: 3                               │
│                                                │
│  [Add to Deck]     [View in Collection]        │
│                                                │
│  (i) Ruins are structures you can play on the  │
│  battlefield. They help your creatures but can  │
│  be attacked and destroyed.                    │
│                                                │
└────────────────────────────────────────────────┘
```

This screen uses the same `.fullScreenCover` treatment as evolution reveals, creating a sense of importance.

### 2.4 Session-by-Session Pacing

| Session | Player Action | New Feature Introduced | Reward |
|---|---|---|---|
| 1 | Download, onboard, trial (2+ factions), commit, tutorial, first evolve | Core gameplay, evolution | 20 Commons, starter avatar, 50 Dust |
| 2-3 | Daily quests, casual/practice matches | Quest system, daily loop | Chaos Dust, XP |
| 3-5 | Complete "Play 5 Matches" quest | Planar Ruins discovery | 1 neutral ruin |
| 5-8 | Experiment with ruin in deck, more matches | Ruin battlefield placement | Evolution energy |
| 8-12 | Ruin reaches familiarity threshold | Ruin evolution | Faction-evolved ruin |
| 10-15 | Save 150 Dust, unlock second faction | Multi-faction play | 20 new faction Commons |
| 15-30 | Hit evolution choice frustration | Subscription value proposition | Conversion opportunity |

---

## 3. 5-Faction Picker Redesign {#3-faction-picker}

### 3.1 Problem

The current faction picker uses a `TabView(.page)` pager with 3 full-screen cards. This works for 3 but becomes cumbersome for 5 — players may not realize there are factions beyond what they see, and swiping through 5 full-screen pages is slow.

### 3.2 Solution: Carousel with Preview Peek

A horizontal carousel where the selected faction card is centered and prominent (80% of screen width), with the edges of adjacent factions peeking from both sides. This communicates that more options exist and enables quick swiping.

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  CHOOSE YOUR FACTION                             │
│  "Each faction fights differently"               │
│                                                  │
│  ┌──┐ ┌──────────────────────────────────┐ ┌──┐ │
│  │  │ │                                  │ │  │ │
│  │ P│ │     [Faction Showcase Card]      │ │ P│ │
│  │ E│ │                                  │ │ E│ │
│  │ E│ │  [Faction Emblem 64x64]          │ │ E│ │
│  │ K│ │                                  │ │ K│ │
│  │  │ │  THE CELESTIAL CRUSADE           │ │  │ │
│  │  │ │                                  │ │  │ │
│  │ L│ │  "Divine crusaders who fight for │ │ R│ │
│  │ E│ │   holy dominion over reality"    │ │ I│ │
│  │ F│ │                                  │ │ G│ │
│  │ T│ │  Mechanic: EXALT                 │ │ H│ │
│  │  │ │  "Aura effects that benefit all  │ │ T│ │
│  │  │ │   creatures when conditions met" │ │  │ │
│  │  │ │                                  │ │  │ │
│  │  │ │  [Sample Card Art 120x168]       │ │  │ │
│  │  │ │  [Sample Card Art 120x168]       │ │  │ │
│  │  │ │  (2 sample cards side by side)   │ │  │ │
│  │  │ │                                  │ │  │ │
│  │  │ │  [  TRY THIS FACTION  ]          │ │  │ │
│  │  │ │  (Button, faction accent color)  │ │  │ │
│  │  │ │                                  │ │  │ │
│  └──┘ └──────────────────────────────────┘ └──┘ │
│                                                  │
│        ○  ○  ●  ○  ○                             │
│     (Page indicator dots, 5 dots)                │
│                                                  │
│  [Skip trials — Choose now]                      │
│  (text button for returning players)             │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 3.3 Implementation

```swift
struct FactionPickerView: View {
    @State private var selectedIndex: Int = 2 // Start on middle faction (Demonic)
    @State private var triedFactions: Set<Faction> = []
    let factions: [Faction] = [.ironwright, .feyCourts, .demonic, .celestial, .endless]

    var body: some View {
        VStack(spacing: 16) {
            // Header
            VStack(spacing: 4) {
                Text("CHOOSE YOUR FACTION")
                    .font(.custom("Cinzel-Bold", size: 22))
                    .foregroundColor(.white)
                Text("Each faction fights differently")
                    .font(.custom("Alegreya", size: 15))
                    .foregroundColor(Color(hex: "#B0B0B0"))
            }
            .padding(.top, 20)

            // Carousel
            TabView(selection: $selectedIndex) {
                ForEach(Array(factions.enumerated()), id: \.offset) { index, faction in
                    FactionShowcaseCard(
                        faction: faction,
                        isTried: triedFactions.contains(faction),
                        onTry: { startTrial(faction) }
                    )
                    .padding(.horizontal, 20)
                    .tag(index)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .always))
            .frame(maxHeight: .infinity)

            // Bottom: commitment button (appears after 2+ trials)
            if triedFactions.count >= 2 {
                Button("Choose My Faction") {
                    commitToFaction(factions[selectedIndex])
                }
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(.black)
                .frame(width: 220, height: 52)
                .background(FactionColor.accent(factions[selectedIndex]))
                .cornerRadius(12)
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }

            // Skip option (for returning/experienced players)
            Button("Skip trials - Choose now") {
                commitToFaction(factions[selectedIndex])
            }
            .font(.system(size: 13))
            .foregroundColor(Color(hex: "#666666"))
            .padding(.bottom, 20)
        }
        .background(Color(hex: "#0D0D0D"))
        .animation(.spring(response: 0.4, dampingFraction: 0.8), value: triedFactions.count)
    }
}
```

### 3.4 Faction Showcase Card

Each card in the carousel is a `FactionShowcaseCard`:

```swift
struct FactionShowcaseCard: View {
    let faction: Faction
    let isTried: Bool
    let onTry: () -> Void

    var body: some View {
        VStack(spacing: 16) {
            // Faction emblem with glow
            Image(factionEmblemName(faction))
                .resizable()
                .frame(width: 64, height: 64)
                .shadow(color: FactionColor.accent(faction).opacity(0.6), radius: 12)

            // Faction name
            Text(faction.displayName.uppercased())
                .font(.custom("Cinzel-Bold", size: 20))
                .foregroundColor(.white)

            // Tagline
            Text(faction.tagline)
                .font(.custom("Alegreya-Italic", size: 14))
                .foregroundColor(Color(hex: "#B0B0B0"))
                .multilineTextAlignment(.center)
                .frame(maxWidth: 280)

            // Mechanic preview
            VStack(spacing: 4) {
                Text("MECHANIC: \(faction.mechanicName.uppercased())")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(FactionColor.accent(faction))
                Text(faction.mechanicDescription)
                    .font(.system(size: 12))
                    .foregroundColor(Color(hex: "#888888"))
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: 260)
            }
            .padding(12)
            .background(Color(hex: "#1A1A1A"))
            .cornerRadius(10)

            // Sample cards (2 side-by-side)
            HStack(spacing: 8) {
                ForEach(faction.sampleCardURLs.prefix(2), id: \.self) { url in
                    AsyncImage(url: url) { image in
                        image.resizable().aspectRatio(5.0/7.0, contentMode: .fit)
                    } placeholder: { CardArtPlaceholder() }
                    .frame(width: 100)
                    .cornerRadius(6)
                }
            }

            Spacer()

            // Action button
            Button(action: onTry) {
                Text(isTried ? "TRIED" : "TRY THIS FACTION")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(isTried ? Color(hex: "#666666") : .black)
                    .frame(width: 220, height: 48)
                    .background(isTried ? Color(hex: "#2A2A2A") : FactionColor.accent(faction))
                    .cornerRadius(10)
            }
            .disabled(isTried)
        }
        .padding(.vertical, 20)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(
                    LinearGradient(
                        colors: [
                            FactionColor.background(faction),
                            Color(hex: "#0D0D0D")
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(FactionColor.accent(faction).opacity(0.3), lineWidth: 1)
        )
    }
}
```

### 3.5 Faction Commitment Confirmation

After selecting a faction (post-trial or via skip), show a confirmation screen:

```swift
struct FactionCommitmentView: View {
    let faction: Faction
    let onConfirm: () -> Void
    let onBack: () -> Void

    var body: some View {
        VStack(spacing: 24) {
            // Large faction emblem with dramatic glow
            Image(factionEmblemName(faction))
                .resizable()
                .frame(width: 96, height: 96)
                .shadow(color: FactionColor.accent(faction), radius: 20)

            Text("JOIN THE \(faction.displayName.uppercased())?")
                .font(.custom("Cinzel-Bold", size: 22))
                .foregroundColor(.white)

            Text("You'll receive 20 \(faction.displayName) cards to keep, evolve, and build with. You can unlock other factions later with Chaos Dust.")
                .font(.custom("Alegreya", size: 15))
                .foregroundColor(Color(hex: "#B0B0B0"))
                .multilineTextAlignment(.center)
                .frame(maxWidth: 300)

            // What you get
            VStack(alignment: .leading, spacing: 8) {
                RewardRow(icon: "rectangle.stack.fill", text: "20 Common creature cards")
                RewardRow(icon: "person.fill", text: "Starter avatar")
                RewardRow(icon: "diamond.fill", text: "50 Chaos Dust")
                RewardRow(icon: "sparkles", text: "2 Uncommon Planar Shards")
            }
            .padding()
            .background(Color(hex: "#1A1A1A"))
            .cornerRadius(12)

            Spacer()

            Button("COMMIT TO \(faction.displayName.uppercased())") {
                onConfirm()
            }
            .font(.system(size: 16, weight: .bold))
            .foregroundColor(.black)
            .frame(width: 280, height: 56)
            .background(FactionColor.accent(faction))
            .cornerRadius(12)

            Button("Go Back") { onBack() }
                .font(.system(size: 14))
                .foregroundColor(Color(hex: "#666666"))
        }
        .padding()
        .background(
            LinearGradient(
                colors: [FactionColor.background(faction), Color(hex: "#0D0D0D")],
                startPoint: .top,
                endPoint: .center
            )
        )
    }
}
```

### 3.6 Faction Order in Carousel

Default order left-to-right: Ironwright, Fey Courts, Demonic, Celestial, Endless. Starting selection: index 2 (Demonic, center). This ensures the player sees parts of all 5 factions on first glance.

---

## 4. Ruin Collection, Evolution, and Battlefield UI {#4-ruin-ui}

### 4.1 Ruin in Collection

Ruins appear alongside creature cards in the collection view. They are NOT in a separate tab — they are filtered via the existing `FilterPanelView` under "Card Type."

**Filter Bar Update:**

```swift
Section("Card Type") {
    MultiToggleRow(
        options: [.creature, .spell, .planarRuin, .stabilizer],
        selected: $vm.filterCardTypes
    )
}
```

When the "Planar Ruin" filter is active, the collection grid shows ruin cards rendered with the `RuinCardView` layout (Section 1.5). When "All" types are shown, ruins are interspersed with creatures sorted by the selected sort order (CM cost, rarity, name, etc.).

**Visual Distinction in Grid:**

Ruin cards in the grid use the `RuinCardView` with its stone-textured panel. At the small grid size (100x140pt), the double-line separator and stone pillar badge are the primary differentiators. The absence of an ATK value is also noticeable.

**Evolution-Ready Badge for Ruins:**

Same pulsing shard badge as creatures, positioned bottom-right of the grid cell. The shard icon for ruins is a unique "ruin shard" variant (a planar crystal with stone fragments).

### 4.2 Ruin Detail View

The ruin detail view follows the same pattern as `CardDetailView` but adapted for ruin-specific data.

```swift
struct RuinDetailView: View {
    let ruin: RuinInstance
    @ObservedObject var vm: RuinDetailViewModel
    @State private var showEvolution: Bool = false

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Hero art (same as creature detail)
                AsyncImage(url: ruin.artURL) { image in
                    image.resizable().aspectRatio(5/7, contentMode: .fit)
                } placeholder: { RuinArtPlaceholder() }
                .frame(maxWidth: .infinity)
                .overlay(
                    LinearGradient(
                        colors: [.clear, .black],
                        startPoint: .init(x: 0.5, y: 0.5),
                        endPoint: .bottom
                    )
                )
                .overlay(
                    VStack(alignment: .leading, spacing: 2) {
                        Text(ruin.name)
                            .font(.custom("Cinzel-Bold", size: 22))
                            .foregroundColor(.white)
                        Text(ruin.isEvolved ? ruin.faction!.displayName : "Neutral Ruin")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(ruin.isEvolved ?
                                FactionColor.accent(ruin.faction!) :
                                Color(hex: "#8E99A4"))
                    }
                    .shadow(radius: 4)
                    .padding()
                    , alignment: .bottomLeading
                )

                // Stats row (HP + CM only, no ATK)
                HStack(spacing: 0) {
                    StatView(label: "HP", value: "\(ruin.hp)")
                    Divider()
                    StatView(label: "CM", value: "\(ruin.manaCost)")
                }
                .frame(height: 56)
                .background(Color(hex: "#141414"))

                // Current effect
                RuinSectionView(title: "Effect") {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(ruin.effectDescription)
                            .font(.custom("Alegreya", size: 15))
                            .foregroundColor(.white)
                        if ruin.isEvolved {
                            HStack {
                                Image("icon_warning")
                                    .resizable().frame(width: 16, height: 16)
                                Text("On Destruction: \(ruin.destructionPenalty)")
                                    .font(.system(size: 13))
                                    .foregroundColor(Color(hex: "#F44336"))
                            }
                        }
                    }
                }

                // Evolution state
                if !ruin.isEvolved {
                    RuinSectionView(title: "Evolution") {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("This ruin is neutral. Evolve it to unlock a powerful faction-specific effect.")
                                .font(.system(size: 13))
                                .foregroundColor(Color(hex: "#888888"))
                            EnergyProgressView(
                                current: ruin.familiarityEnergy,
                                required: ruin.evolutionThreshold
                            )
                            Text("\(ruin.battlesSurvived) battles survived")
                                .font(.system(size: 13))
                                .foregroundColor(Color(hex: "#888888"))
                        }
                    }
                } else {
                    RuinSectionView(title: "Evolved State") {
                        HStack(spacing: 8) {
                            Image(factionEmblemName(ruin.faction!))
                                .resizable().frame(width: 24, height: 24)
                            Text("Evolved for \(ruin.faction!.displayName)")
                                .font(.system(size: 15, weight: .medium))
                                .foregroundColor(FactionColor.accent(ruin.faction!))
                        }
                    }
                }

                // Discovery lore
                RuinSectionView(title: "Lore") {
                    Text("\"\(ruin.flavorText)\"")
                        .font(.custom("Alegreya-Italic", size: 14))
                        .foregroundColor(Color(hex: "#888888"))
                        .multilineTextAlignment(.leading)
                }

                Spacer().frame(height: 80)
            }
        }
        .background(Color(hex: "#0D0D0D"))
        .overlay(stickyButtons, alignment: .bottom)
        .fullScreenCover(isPresented: $showEvolution) {
            RuinEvolutionFlowView(ruin: ruin)
        }
    }

    @ViewBuilder
    var stickyButtons: some View {
        HStack(spacing: 12) {
            if ruin.isEvolutionReady && !ruin.isEvolved {
                Button("Evolve") { showEvolution = true }
                    .frame(width: 160, height: 52)
                    .background(Color(hex: "#FFD700"))
                    .foregroundColor(.black)
                    .cornerRadius(10)
                    .font(.system(size: 16, weight: .bold))
            }
            Button("Add to Deck") { vm.addToDeck() }
                .frame(width: 160, height: 52)
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(.white, lineWidth: 2))
                .foregroundColor(.white)
        }
        .padding()
        .background(.ultraThinMaterial)
    }
}
```

### 4.3 Ruin Evolution UI

Ruin evolution is simpler than creature evolution because it is a single step (neutral to faction-evolved) rather than 4 tiers.

**Flow:**

```
[Ruin Detail → "Evolve" tapped]
    |
    v
Step 1: Ruin Presentation
    Show current neutral ruin art + effect + lore.
    "This ancient ruin is ready to be claimed by a faction."
    |
    v
Step 2: Faction Selection
    Player DOES NOT choose Order/Chaos. Instead, player chooses
    which faction to evolve the ruin into. The ruin becomes
    locked to that faction.

    Shows 2/3/4 faction evolution options (subscription tier):
    Free: 2 faction options
    Mid: 3 faction options
    Top: 4 faction options

    Each option shows:
    - Faction emblem + name
    - New evolved effect text
    - New destruction penalty
    - Preview of art transformation (thumbnail)
    |
    v
Step 3: Evolution Animation
    Similar to creature evolution but themed as
    "faction claiming" rather than "chaos transformation."
    Faction-colored energy flows into the ruin.
    |
    v
Step 4: Evolved Ruin Reveal
    New art reveal (iris wipe).
    New effect text.
    New destruction penalty shown.
    "This ruin now serves the [Faction]."
    |
    v
Step 5: Confirm
    Save & add to collection. Ruin is now faction-locked.
```

**Faction Evolution Option Cards:**

```swift
struct RuinEvolutionOptionView: View {
    let option: RuinEvolutionOption
    let isSelected: Bool
    let onSelect: () -> Void

    var body: some View {
        Button(action: onSelect) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(factionEmblemName(option.faction))
                        .resizable().frame(width: 28, height: 28)
                    Text(option.faction.displayName)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.white)
                }

                Text(option.evolvedEffect)
                    .font(.custom("Alegreya", size: 13))
                    .foregroundColor(.white)
                    .lineLimit(3)

                HStack {
                    Image("icon_warning")
                        .resizable().frame(width: 12, height: 12)
                    Text(option.destructionPenalty)
                        .font(.system(size: 11))
                        .foregroundColor(Color(hex: "#F44336"))
                        .lineLimit(2)
                }

                // Thumbnail preview of evolved art
                AsyncImage(url: option.previewArtURL) { image in
                    image.resizable()
                        .aspectRatio(5.0/7.0, contentMode: .fill)
                        .frame(height: 80)
                        .cornerRadius(6)
                } placeholder: { Color(hex: "#2A2A2A").frame(height: 80).cornerRadius(6) }
            }
            .padding(12)
            .frame(width: 200)
            .background(
                LinearGradient(
                    colors: [FactionColor.background(option.faction), Color(hex: "#1A1A1A")],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(
                        isSelected ? FactionColor.accent(option.faction) : Color(hex: "#3A3A3A"),
                        lineWidth: isSelected ? 2 : 1
                    )
            )
            .opacity(isSelected ? 1.0 : 0.7)
        }
    }
}
```

### 4.4 Ruin on the Battlefield

A Planar Ruin occupies one of the 5 creature slots on the battlefield. It must be visually distinct from creatures at the small `BoardCardNode` size (64x90pt).

**Battlefield Ruin Node (SpriteKit):**

```swift
class BoardRuinNode: SKSpriteNode {
    var ruinArtNode: SKSpriteNode      // CDN art texture, top 60%
    var effectBarNode: SKSpriteNode    // Stone-textured bar, bottom 30%
    var hpLabel: SKLabelNode           // HP value, right-aligned
    var effectIconNode: SKSpriteNode   // Small scroll icon, left-aligned
    var glowNode: SKEffectNode         // Selection/targeting state
    var ruinMarkerNode: SKSpriteNode   // Stone pillar icon below card (6x8pt)
    var factionBadgeNode: SKSpriteNode? // Faction emblem if evolved

    // Distinct from BoardCardNode:
    // 1. Stone texture on stats bar (not plain dark)
    // 2. No ATK label — replaced by effect icon
    // 3. Stone pillar marker below card
    // 4. Border is always stone-gray for neutral, faction color for evolved
}
```

**Battlefield Layout with Ruin:**

```
Opponent Board (5 slots):
[Creature][Creature][  Empty ][Creature][Creature]

Center Zone:
[D20] [Phase Indicator]

Player Board (5 slots):
[Creature][Creature][  RUIN  ][Creature][Creature]
                       ▲
                    Stone pillar
                    marker below
                    the card
```

**Slot Selection for Ruin Placement:**

When the player drags a ruin from hand toward the board:
1. All empty slots highlight with a stone-gray border pulse (not green like creatures).
2. The ruin snaps to whichever empty slot the player drops it on.
3. If the player already has a ruin on the board (max 1), the slot highlights turn red and a toast says "Only 1 ruin allowed on the battlefield."

```swift
// In BattleScene.touchesMoved for ruin placement
func highlightRuinSlots() {
    for slot in playerBoardSlots where slot.isEmpty {
        let highlight = SKShapeNode(rectOf: slot.size, cornerRadius: 4)
        highlight.name = "ruinHighlight"
        highlight.strokeColor = UIColor(hex: "#8E99A4") // stone gray
        highlight.lineWidth = 2
        highlight.fillColor = UIColor(hex: "#8E99A4").withAlphaComponent(0.1)
        let pulse = SKAction.sequence([
            SKAction.fadeAlpha(to: 0.4, duration: 0.5),
            SKAction.fadeAlpha(to: 1.0, duration: 0.5)
        ])
        highlight.run(SKAction.repeatForever(pulse))
        slot.addChild(highlight)
    }
}
```

### 4.5 Ruin Destruction Animation

When a ruin's HP reaches 0, the destruction animation differs from creature death to convey structural collapse rather than creature defeat:

```swift
func animateRuinDestruction(_ ruinNode: BoardRuinNode) {
    // 1. Screen rumble (not flash) — the ground shakes
    let rumble = SKAction.sequence([
        SKAction.moveBy(x: -4, y: 2, duration: 0.05),
        SKAction.moveBy(x: 8, y: -4, duration: 0.05),
        SKAction.moveBy(x: -6, y: 3, duration: 0.05),
        SKAction.moveBy(x: 4, y: -2, duration: 0.05),
        SKAction.moveBy(x: -2, y: 1, duration: 0.05),
        SKAction.moveTo(x: 0, y: 0, duration: 0.05)  // Reset
    ])
    self.run(rumble) // Shake entire scene

    // 2. Ruin crumbles — pieces fall downward (not shatter outward)
    let crumble = SKAction.sequence([
        SKAction.group([
            SKAction.moveBy(x: 0, y: -30, duration: 0.6),
            SKAction.fadeOut(withDuration: 0.6),
            SKAction.scale(to: 0.8, duration: 0.6)
        ]),
        SKAction.removeFromParent()
    ])
    crumble.timingMode = .easeIn // Accelerate downward
    ruinNode.run(crumble)

    // 3. Dust/debris particle burst
    if let emitter = SKEmitterNode(fileNamed: "RuinDestructionDust") {
        emitter.position = ruinNode.position
        emitter.zPosition = 99
        addChild(emitter)
        emitter.run(SKAction.sequence([
            SKAction.wait(forDuration: 1.5),
            SKAction.removeFromParent()
        ]))
    }

    // 4. Penalty activation flash
    // After 800ms: show penalty banner
    run(SKAction.sequence([
        SKAction.wait(forDuration: 0.8),
        SKAction.run { [weak self] in
            self?.showRuinPenaltyBanner(ruinNode.destructionPenalty)
        }
    ]))

    HapticManager.shared.heavyImpact()
}

func showRuinPenaltyBanner(_ penalty: String) {
    let banner = SKNode()

    let bg = SKShapeNode(rectOf: CGSize(width: 300, height: 60), cornerRadius: 8)
    bg.fillColor = UIColor(hex: "#1A0000")
    bg.strokeColor = UIColor(hex: "#F44336")
    bg.lineWidth = 1.5
    banner.addChild(bg)

    let warningIcon = SKSpriteNode(imageNamed: "icon_warning")
    warningIcon.size = CGSize(width: 20, height: 20)
    warningIcon.position = CGPoint(x: -130, y: 0)
    banner.addChild(warningIcon)

    let label = SKLabelNode(text: penalty)
    label.fontName = "Alegreya-Bold"
    label.fontSize = 13
    label.fontColor = UIColor(hex: "#F44336")
    label.position = CGPoint(x: 10, y: -5)
    label.preferredMaxLayoutWidth = 240
    label.numberOfLines = 2
    banner.addChild(label)

    banner.position = CGPoint(x: size.width / 2, y: size.height / 2)
    banner.alpha = 0
    banner.setScale(0.8)
    addChild(banner)

    banner.run(SKAction.sequence([
        SKAction.group([
            SKAction.fadeIn(withDuration: 0.2),
            SKAction.scale(to: 1.0, duration: 0.2)
        ]),
        SKAction.wait(forDuration: 2.5),
        SKAction.group([
            SKAction.fadeOut(withDuration: 0.3),
            SKAction.scale(to: 0.9, duration: 0.3)
        ]),
        SKAction.removeFromParent()
    ]))
}
```

### 4.6 Ruin Passive Effect Indicator

While a ruin is on the battlefield, its passive effect should be visible to both players. A small aura pulse emanates from the ruin node every 3 seconds:

```swift
func addRuinAuraEffect(_ ruinNode: BoardRuinNode) {
    let auraColor = ruinNode.isEvolved ?
        UIColor(FactionColor.accent(ruinNode.faction!)) :
        UIColor(hex: "#8E99A4")

    let aura = SKShapeNode(circleOfRadius: 40)
    aura.strokeColor = auraColor.withAlphaComponent(0.6)
    aura.fillColor = .clear
    aura.lineWidth = 1
    aura.position = .zero
    aura.zPosition = -1
    ruinNode.addChild(aura)

    let pulse = SKAction.sequence([
        SKAction.group([
            SKAction.scale(to: 2.0, duration: 1.5),
            SKAction.fadeAlpha(to: 0.0, duration: 1.5)
        ]),
        SKAction.scale(to: 1.0, duration: 0),
        SKAction.fadeAlpha(to: 0.4, duration: 0),
        SKAction.wait(forDuration: 1.5)
    ])
    aura.run(SKAction.repeatForever(pulse))
}
```

---

## 5. Collection & Deck Builder for Creatures + Ruins {#5-collection-deck-builder}

### 5.1 Updated Collection View

The existing `CollectionView` needs these changes:

1. **FactionTabBar**: Expand from 4 items (All + 3 factions) to 6 items (All + 5 factions). Use `ScrollView(.horizontal)` since 6 items will not fit on screen without scrolling.

```swift
struct FactionTabBar: View {
    @Binding var selected: FactionFilter
    let factions: [FactionFilter] = [
        .all, .ironwright, .feyCourts, .demonic, .celestial, .endless
    ]

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 0) {
                ForEach(factions, id: \.self) { faction in
                    Button(action: {
                        withAnimation(.easeInOut(duration: 0.2)) { selected = faction }
                    }) {
                        VStack(spacing: 4) {
                            HStack(spacing: 4) {
                                if faction != .all {
                                    Image(factionIconName(faction))
                                        .resizable().frame(width: 16, height: 16)
                                }
                                Text(factionShortLabel(faction))
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundColor(selected == faction ? .white : Color(hex: "#888888"))
                            }
                            Rectangle()
                                .fill(selected == faction ? factionAccentColor(faction) : Color.clear)
                                .frame(height: 3)
                                .cornerRadius(1.5)
                        }
                        .frame(minWidth: 70) // Narrower to fit 6
                    }
                }
            }
            .padding(.horizontal, 8)
        }
        .background(Color(hex: "#141414"))
    }
}
```

Short labels for compact display:
- "All", "Iron", "Fey", "Demon", "Celest", "Endless"

2. **FilterPanelView Updates:**

```swift
// Card Type section adds PLANAR_RUIN
Section("Card Type") {
    MultiToggleRow(
        options: [.creature, .spell, .planarRuin, .stabilizer],
        selected: $vm.filterCardTypes
    )
}

// Keywords section adds Haste and Ward
Section("Keywords") {
    KeywordToggleGrid(
        keywords: [.shield, .lifesteal, .flying, .reach, .deathtouch,
                   .taunt, .piercing, .haste, .ward],
        selected: $vm.filterKeywords
    )
}

// NEW: Evolution Status section
Section("Evolution Status") {
    Toggle("Evolution Ready (Creatures)", isOn: $vm.filterCreatureEvolutionReady)
    Toggle("Evolution Ready (Ruins)", isOn: $vm.filterRuinEvolutionReady)
    Toggle("Evolved Ruins Only", isOn: $vm.filterEvolvedRuinsOnly)
    Toggle("Neutral Ruins Only", isOn: $vm.filterNeutralRuinsOnly)
}
```

3. **Card Grid Item Updates:**

The `CardGridItemView` now checks card type and renders accordingly:

```swift
struct CardGridItemView: View {
    let card: any CardDisplayable // Protocol implemented by both CardInstance and RuinInstance

    var body: some View {
        Group {
            if let ruin = card as? RuinInstance {
                RuinGridItemView(ruin: ruin)
            } else if let creature = card as? CardInstance {
                CreatureGridItemView(card: creature)
            }
        }
    }
}

struct RuinGridItemView: View {
    let ruin: RuinInstance

    var body: some View {
        ZStack(alignment: .topTrailing) {
            AsyncImage(url: ruin.artURL) { image in
                image.resizable().aspectRatio(5.0/7.0, contentMode: .fill)
            } placeholder: { RuinArtPlaceholder() }
            .cornerRadius(8)
            .overlay(
                // Stone pillar badge top-right
                Image("icon_ruin_pillar")
                    .resizable().frame(width: 14, height: 14)
                    .padding(4)
                    .background(Color.black.opacity(0.6))
                    .cornerRadius(4)
                    .padding(4)
                , alignment: .topTrailing
            )
            .overlay(
                // HP badge bottom-right
                HStack(spacing: 2) {
                    Image("icon_heart_hp")
                        .resizable().frame(width: 10, height: 10)
                    Text("\(ruin.hp)")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.white)
                }
                .padding(.horizontal, 4)
                .padding(.vertical, 2)
                .background(Color.black.opacity(0.7))
                .cornerRadius(4)
                .padding(4)
                , alignment: .bottomRight
            )

            // Evolution-ready badge (same as creatures, different icon)
            if ruin.isEvolutionReady && !ruin.isEvolved {
                Image("icon_ruin_shard")
                    .resizable().frame(width: 20, height: 20)
                    .scaleEffect(pulseScale)
                    .onAppear {
                        withAnimation(.easeInOut(duration: 0.8).repeatForever(autoreverses: true)) {
                            pulseScale = 1.15
                        }
                    }
                    .padding(4)
                    .offset(x: 0, y: 20) // Below top-right badge
            }
        }
    }
    @State private var pulseScale: CGFloat = 1.0
}
```

### 5.2 Updated Deck Builder

The deck builder needs changes for ruins and 5 factions.

**Key Changes:**

1. **FactionSelectorRow**: Expand to 5 factions.

```swift
struct FactionSelectorRow: View {
    @Binding var selected: Faction
    let locked: Bool

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(Faction.allCases) { faction in
                    Button(action: {
                        guard !locked else { return }
                        withAnimation(.easeInOut(duration: 0.2)) { selected = faction }
                    }) {
                        VStack(spacing: 4) {
                            Image(factionEmblemName(faction))
                                .resizable().frame(width: 32, height: 32)
                                .opacity(selected == faction ? 1.0 : 0.4)
                            Text(faction.shortName)
                                .font(.system(size: 10, weight: .medium))
                                .foregroundColor(selected == faction ? .white : Color(hex: "#666666"))
                        }
                        .padding(.horizontal, 4)
                    }
                    .disabled(locked)
                }
            }
            .padding(.horizontal)
        }
    }
}
```

2. **Deck Contents Panel**: Show ruins separately from creatures.

```swift
struct DeckContentsPanel: View {
    @ObservedObject var vm: DeckBuilderViewModel

    var body: some View {
        List {
            // Ruins section (if any in deck)
            if !vm.ruinsInDeck.isEmpty {
                Section("Planar Ruins (\(vm.ruinsInDeck.count)/\(vm.maxRuinsInDeck))") {
                    ForEach(vm.ruinsInDeck) { ruin in
                        RuinDeckRow(ruin: ruin)
                            .swipeActions(edge: .trailing) {
                                Button("Remove", role: .destructive) {
                                    vm.removeRuin(ruin)
                                }
                            }
                    }
                }
            }

            // Creatures section
            Section("Creatures (\(vm.creaturesInDeck.count))") {
                ForEach(vm.creaturesInDeck) { card in
                    DeckCardRow(card: card)
                        .swipeActions(edge: .trailing) {
                            Button("Remove", role: .destructive) {
                                vm.removeCard(card)
                            }
                        }
                }
            }
        }
    }
}
```

3. **Card Pool Panel**: Add type tabs for creatures/ruins.

```swift
struct CardPoolPanel: View {
    @ObservedObject var vm: DeckBuilderViewModel
    @State private var poolFilter: PoolFilter = .all

    var body: some View {
        VStack(spacing: 0) {
            // Type filter
            Picker("", selection: $poolFilter) {
                Text("All").tag(PoolFilter.all)
                Text("Creatures").tag(PoolFilter.creatures)
                Text("Ruins").tag(PoolFilter.ruins)
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)
            .padding(.vertical, 6)

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 100))], spacing: 8) {
                ForEach(vm.filteredPool(type: poolFilter)) { item in
                    CardGridItemView(card: item)
                        .frame(height: 140)
                        .onTapGesture { vm.addToDecK(item) }
                        .opacity(vm.canAdd(item) ? 1.0 : 0.4)
                        .allowsHitTesting(vm.canAdd(item))
                }
            }
            .padding(.horizontal, 8)
        }
    }
}
```

4. **Deck Validation Rules (Updated):**

```swift
struct DeckValidation {
    static let totalCards = 20
    static let maxRuins = 2  // Max ruins in a deck
    static let maxOnField = 1 // Max ruins on battlefield simultaneously
    static let maxCopiesPerCard = 2
    static let maxLegendaries = 2

    static func validate(_ deck: Deck) -> [DeckError] {
        var errors: [DeckError] = []

        let totalCount = deck.creatures.count + deck.ruins.count
        if totalCount < totalCards {
            errors.append(.tooFewCards(current: totalCount, required: totalCards))
        }
        if totalCount > totalCards {
            errors.append(.tooManyCards(current: totalCount, max: totalCards))
        }
        if deck.ruins.count > maxRuins {
            errors.append(.tooManyRuins(current: deck.ruins.count, max: maxRuins))
        }

        // Faction locking: evolved ruins must match deck faction
        for ruin in deck.ruins {
            if ruin.isEvolved, ruin.faction != deck.faction {
                errors.append(.ruinFactionMismatch(ruin: ruin.name, ruinFaction: ruin.faction!))
            }
        }
        // Neutral ruins can go in any deck — no error

        // Legendary limit
        let legendaryCount = deck.creatures.filter { $0.rarity == .legendary }.count
        if legendaryCount > maxLegendaries {
            errors.append(.tooManyLegendaries(current: legendaryCount, max: maxLegendaries))
        }

        return errors
    }
}
```

5. **DeckStatsSummaryBar Update**: Add ruin count indicator.

```swift
// Add to DeckStatsSummaryBar
HStack(spacing: 4) {
    Image("icon_ruin_pillar")
        .resizable().frame(width: 14, height: 14)
    Text("\(vm.ruinsInDeck.count)/\(DeckValidation.maxRuins)")
        .font(.system(size: 12, weight: .medium))
        .foregroundColor(vm.ruinsInDeck.count > DeckValidation.maxRuins ?
            Color(hex: "#F44336") : Color(hex: "#888888"))
}
```

### 5.3 Sorting/Filtering Unified

Both creatures and ruins sort together when viewing "All" types. Sort options:

| Sort Option | Behavior |
|---|---|
| CM Cost (Low → High) | Creatures and ruins interleaved by cost |
| CM Cost (High → Low) | Same, reversed |
| Name (A-Z) | Alphabetical |
| Rarity (Highest first) | Legendary → Common. Ruins sorted by evolved/neutral. |
| Type | Creatures first, then ruins |
| Evolution Ready | Evolution-ready items first |
| Recently Acquired | Newest first |

---

## 6. Shop/IAP Layout for 5 Factions {#6-shop-iap}

### 6.1 Subscription Tiers (Unchanged Structure, Updated Names)

The subscription section layout remains a horizontal scroll of 3 `SubscriptionCardView` items. No change needed for 5 factions — subscriptions are faction-agnostic.

| Tier | Name | Price | Evolution Options |
|---|---|---|---|
| Free | Planar Shard | $0 | 2 creature modifier options, 2 ruin faction options |
| Mid | Refined Shard | $6.99/mo | 3 creature modifier options, 3 ruin faction options |
| High | Prismatic Shard | $12.99/mo | 4 creature modifier options, 4 ruin faction options |

### 6.2 Card Packs Section (Updated for 5 Factions)

The card packs section needs to display packs for 5 factions. With the existing vertical list layout (`VStack` of `PackRowView`), 5 factions produces 5+ rows that scroll naturally.

```swift
var cardPacksSection: some View {
    VStack(alignment: .leading, spacing: 8) {
        Text("Card Packs")
            .font(.system(size: 16, weight: .bold))
            .foregroundColor(.white)
            .padding(.horizontal, 16)

        // Owned faction packs (cheaper)
        ForEach(vm.ownedFactionPacks) { pack in
            PackRowView(pack: pack, accentColor: FactionColor.accent(pack.faction)) {
                vm.confirmPackPurchase(pack)
            }
        }

        // Separator
        if !vm.lockedFactionPacks.isEmpty {
            Divider().padding(.horizontal)
            Text("Unlock New Factions")
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(Color(hex: "#888888"))
                .padding(.horizontal, 16)

            // Locked faction packs (costs more, unlocks faction)
            ForEach(vm.lockedFactionPacks) { pack in
                PackRowView(pack: pack, accentColor: FactionColor.accent(pack.faction)) {
                    vm.confirmPackPurchase(pack)
                }
                .overlay(
                    // Lock badge
                    Image(systemName: "lock.fill")
                        .foregroundColor(Color(hex: "#FFD700"))
                        .font(.system(size: 12))
                        .padding(4)
                        .background(Color.black.opacity(0.7))
                        .cornerRadius(4)
                    , alignment: .topLeading
                )
            }
        }
    }
    .padding(.vertical, 12)
}
```

**Pack Row**: Each row now shows the faction emblem and uses the faction accent color for the "Buy" button.

```swift
struct PackRowView: View {
    let pack: CardPack
    let accentColor: Color
    let onBuy: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Image(factionEmblemName(pack.faction))
                .resizable().frame(width: 40, height: 40)

            VStack(alignment: .leading, spacing: 2) {
                Text(pack.faction.displayName)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.white)
                Text("\(pack.cardCount) random Commons")
                    .font(.system(size: 12))
                    .foregroundColor(Color(hex: "#888888"))
            }

            Spacer()

            Button(action: onBuy) {
                HStack(spacing: 4) {
                    Image("icon_chaos_mote_filled")
                        .resizable().frame(width: 14, height: 14)
                    Text("\(pack.cost)")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.white)
                }
                .frame(width: 80, height: 36)
                .background(accentColor)
                .cornerRadius(8)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
    }
}
```

### 6.3 Ruin Packs (New)

Ruins are NOT sold as separate packs. They are acquired through:
1. Quest rewards (first ruin from "Play 5 Matches" quest)
2. Card pack bonus drops (5% chance of a neutral ruin in any card pack)
3. Seasonal event rewards
4. Achievement rewards (e.g., "Evolve 10 creatures" → reward: 1 neutral ruin)

This keeps ruins feeling like discoveries, not purchases. No "Ruin Pack" in the shop.

### 6.4 Shop Layout Structure (5 Factions)

```
┌─────────────────────────────────────────────────────┐
│  [Chaos Dust: 450]              [Shards: U:2 R:1]  │  Currency header
├─────────────────────────────────────────────────────┤
│                                                     │
│  SUBSCRIPTION                                       │
│  [Free]  [Refined $6.99/mo]  [Prismatic $12.99/mo] │  Horizontal scroll
│  ← scroll →                                        │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  CARD PACKS                                         │
│  [Iron 🟠 100 Dust]  [Buy]                         │  Vertical list
│  [Fey   🟢 100 Dust]  [Buy]                         │  (owned factions)
│  [Demon 🔴 100 Dust]  [Buy]                         │
│                                                     │
│  UNLOCK NEW FACTIONS                                │
│  [🔒 Celestial 🟡 150 Dust]  [Buy]                 │  Vertical list
│  [🔒 Endless   🟣 150 Dust]  [Buy]                 │  (locked factions)
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  PLANAR SHARDS                                      │
│  [Uncommon 30]  [Rare 60]  [Epic 120]  [Leg 240]  │  2-column grid
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  COSMETICS (Future)                                 │
│  Premium ruin skins, card backs, avatars            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 7. Screen-by-Screen Audit {#7-screen-audit}

Every screen in the app and what changes are needed for the faction expansion:

### 7.1 Home Screen

| Element | Change Needed | Priority |
|---|---|---|
| Play button | No change | - |
| Daily quests panel | Add ruin-specific quests ("Play a ruin in 3 matches", "Evolve a ruin") | Medium |
| News/announcements | Add faction expansion news items | Low |
| Featured card showcase | Support showing ruin cards alongside creatures | Low |
| Background art | Update to include all 5 faction themes, possibly rotating | Low |

**New Home Elements:**
- "Faction Progress" widget showing XP/level for each unlocked faction (compact horizontal bar for each)
- Ruin discovery notification badge when a new ruin quest is available

### 7.2 Collection

| Element | Change Needed | Priority |
|---|---|---|
| FactionTabBar | 4 items → 6 items (All + 5 factions). Horizontal scroll. | **High** |
| FilterPanelView | Add Planar Ruin to Card Type. Add Haste + Ward to Keywords. Add evolution-ready filters for ruins. | **High** |
| CardGridItemView | Support `RuinGridItemView` rendering for ruin cards | **High** |
| CardDetailView | Route to `RuinDetailView` when ruin tapped | **High** |
| CollectionEmptyState | Update per-faction empty states for 5 factions | Medium |
| FactionTabBar labels | Shorten labels to fit 6 items: "All", "Iron", "Fey", "Demon", "Celest", "Endless" | **High** |

### 7.3 Deck Builder

| Element | Change Needed | Priority |
|---|---|---|
| FactionSelectorRow | 3 factions → 5 factions | **High** |
| DeckContentsPanel | Add ruins section above creatures. Show ruin count. | **High** |
| CardPoolPanel | Add type filter (All / Creatures / Ruins) | **High** |
| DeckStatsSummaryBar | Add ruin count indicator | **High** |
| Deck validation | Add ruin limit (max 2), faction-lock for evolved ruins, max 1 on field | **High** |
| AvatarSelectorRow | 6 avatars → 10 avatars (2 per faction). Horizontal scroll. | **High** |
| Mana curve | Include ruin CM costs in mana curve visualization | Medium |

### 7.4 Matchmaking

| Element | Change Needed | Priority |
|---|---|---|
| Deck picker | Support 5-faction decks in the deck list | **High** |
| Opponent found screen | Show opponent faction (5 options now) with correct emblem/color | **High** |
| Queue animation | No change | - |
| Mode selection | No change | - |

### 7.5 Battle (SpriteKit)

| Element | Change Needed | Priority |
|---|---|---|
| backgroundNode | 5 faction-themed battlefield backgrounds (+ neutral for practice) | **High** |
| BoardCardNode | No structural change, but faction accent colors must include Celestial + Endless | **High** |
| **BoardRuinNode** | **NEW**: SpriteKit node for ruins on battlefield (Section 4.4) | **High** |
| Death animation | Add Celestial (`divine_radiance` particle) and Endless (`spectral_mist` particle) death emitters | **High** |
| **Ruin destruction anim** | **NEW**: Crumble + rumble + penalty banner (Section 4.5) | **High** |
| **Ruin aura effect** | **NEW**: Passive aura pulse from ruin node (Section 4.6) | Medium |
| **Ruin placement** | **NEW**: Drag ruin from hand, slot highlighting (Section 4.4) | **High** |
| PhaseIndicatorNode | No change | - |
| D20Node | No change | - |
| EventOverlayNode | No change (events are faction-agnostic) | - |
| Taunt indicators | No change (but Celestial/Endless may have taunt creatures) | - |
| Keyword icons | Add Haste icon (lightning bolt) and Ward icon (magic shield) | **High** |
| **Haste visual** | **NEW**: Creature with Haste gets a speed-line effect on play animation (streaks behind card) | Medium |
| **Ward visual** | **NEW**: Creature with Ward gets a shimmering shield overlay for 1 turn | Medium |
| Exalt aura visual | **NEW**: When Exalt conditions met, all benefiting creatures get a brief golden pulse | **High** |
| Persist trigger visual | **NEW**: When Persist creature dies, ghostly afterimage lingers for 500ms before death trigger effect | **High** |

### 7.6 Post-Match Results

| Element | Change Needed | Priority |
|---|---|---|
| ResultHeaderView | No structural change | - |
| RewardsSection | Support ruin rewards (e.g., ruin drop from quest completion) | Medium |
| EnergyEarnedSection | Show ruin familiarity energy earned alongside creature energy | Medium |
| Evolution-ready badges | Include ruin evolution-ready badges | Medium |
| Bottom buttons | "Evolve Cards" button should navigate to collection with ruin filter if ruin is ready | Low |

### 7.7 Evolution Flow (Creatures)

| Element | Change Needed | Priority |
|---|---|---|
| EvolutionStep1View | No change | - |
| EvolutionStep2View (Channel selection) | No change | - |
| EvolutionStep3 (Animation) | Add Celestial and Endless channel color themes | **High** |
| EvolutionStep4 (Art reveal) | No change | - |
| EvolutionStep5 (Name selection) | No change | - |
| EvolutionStep6 (Ability reveal) | No change | - |
| EvolutionStep7 (Modifier selection) | Modifiers now include Exalt/Persist faction-exclusive modifiers | **High** |
| EvolutionStep8 (Flavor reveal) | No change | - |
| EvolutionStep9 (Confirm) | No change | - |

### 7.8 Ruin Evolution Flow (NEW)

| Element | Status | Priority |
|---|---|---|
| RuinEvolutionFlowView | **NEW**: Full `.fullScreenCover` flow (Section 4.3) | **High** |
| Ruin presentation step | **NEW** | **High** |
| Faction selection step | **NEW**: Choose which faction to evolve into | **High** |
| Evolution animation | **NEW**: Faction-colored energy claims the ruin | **High** |
| Evolved ruin reveal | **NEW**: Iris wipe reveal of transformed art | **High** |
| Confirm step | **NEW** | **High** |

### 7.9 Shop

| Element | Change Needed | Priority |
|---|---|---|
| SubscriptionCardView | No structural change | - |
| cardPacksSection | 3 faction packs → 5 faction packs. Add "Unlock New Factions" separator. | **High** |
| PackRowView | Add faction emblem, use faction accent color | **High** |
| Pack opening | No structural change (packs still contain 3 cards) | - |
| Shards section | No change | - |
| Cosmetics section | Future: premium ruin skins | Low |

### 7.10 Quests

| Element | Change Needed | Priority |
|---|---|---|
| Quest list | Add ruin-specific quests | Medium |
| Quest reward display | Support ruin card as quest reward | Medium |
| Faction-specific quests | 5 factions worth of faction quests | Medium |

New quest templates needed:
- "Play a Planar Ruin in 3 matches"
- "Evolve a Planar Ruin"
- "Win a match with a ruin on your field"
- "Destroy an opponent's ruin"
- "Win 3 matches with Celestial Crusade"
- "Win 3 matches with The Endless"

### 7.11 Achievements

| Element | Change Needed | Priority |
|---|---|---|
| Achievement list | Add new faction + ruin achievements | Medium |
| Achievement detail | No structural change | - |

New achievements:
- "Ruin Discoverer" — Own your first Planar Ruin
- "Archaeologist" — Own 5 different ruins
- "Ruin Claimer" — Evolve your first ruin
- "Ruin Master" — Evolve ruins for all 5 factions
- "Celestial Devotee" — Win 50 matches with Celestial Crusade
- "Endless Servant" — Win 50 matches with The Endless
- "Five Factions" — Unlock all 5 factions
- "Structural Integrity" — Win a match with a ruin surviving to the end

### 7.12 Profile

| Element | Change Needed | Priority |
|---|---|---|
| Faction badge display | Show all unlocked faction badges (up to 5) | Medium |
| Showcase cards | Support ruins in showcase slots | Low |
| Stats summary | Add ruin stats (owned, evolved, destroyed in battle) | Low |
| Avatar display | Support 10 avatars (2 per faction) | Medium |

### 7.13 Settings

| Element | Change Needed | Priority |
|---|---|---|
| Colorblind mode | Must handle 5 faction palettes (see Section 8) | **High** |
| All other settings | No change | - |

### 7.14 Onboarding

| Element | Change Needed | Priority |
|---|---|---|
| Intro cinematic | Add panel 6 introducing Planar Ruins concept | Medium |
| Faction selection | Full redesign: 3-faction pager → 5-faction carousel (Section 3) | **High** |
| Trial match flow | Support 5 loaner decks. Min 2 trials before commit. | **High** |
| Tutorial match | No structural change (ruins not in tutorial) | - |
| First evolution | No change | - |
| Deck builder tour | Add tooltip about ruins when player gets their first ruin | Low |
| Faction commitment | Updated confirmation screen (Section 3.5) | **High** |

### 7.15 Loading Screens

| Element | Change Needed | Priority |
|---|---|---|
| App launch splash | No change (game logo) | - |
| Match loading | Show both players' faction emblems during load | Medium |
| Faction-themed loading tips | Add tips for Celestial, Endless, and ruins | Low |

### 7.16 New Screens Required

| Screen | Purpose | Priority |
|---|---|---|
| `RuinDetailView` | Full ruin stats, effect, lore, evolution state | **High** |
| `RuinEvolutionFlowView` | Multi-step ruin evolution `.fullScreenCover` | **High** |
| `RuinDiscoveryView` | First-ruin-acquired dramatic reveal | Medium |
| `FactionPickerView` (redesign) | 5-faction carousel for onboarding | **High** |

---

## 8. Accessibility {#8-accessibility}

### 8.1 Five-Faction Color Distinctiveness

The 5 faction palettes must be instantly distinguishable from each other. Here are the primary accent colors plotted by hue:

| Faction | Primary Accent | Hue (approx.) | Brightness |
|---|---|---|---|
| Ironwright | `#E07020` (orange) | 25 | High |
| Fey Courts | `#7ED321` (green) | 95 | High |
| Demonic | `#D0021B` (red) | 355 | Medium-High |
| Celestial | `#DAA520` (gold) | 43 | High |
| Endless | `#6B3FA0` (purple) | 270 | Medium |

**Hue separation analysis:** Orange (25) to Gold (43) = 18 degrees. This is the closest pair and may cause confusion for some users. Mitigation: Ironwright uses orange on dark blue-gray backgrounds, Celestial uses gold on ivory/cream backgrounds. The secondary context (emblem shape, background tint) disambiguates.

All other pairs have 45+ degrees of hue separation, which is adequate.

### 8.2 Color-Blind Analysis

**Deuteranopia (red-green, most common, ~8% of males):**

| Pair | Risk | Mitigation |
|---|---|---|
| Ironwright (orange) vs Demonic (red) | **Medium** — both shift toward yellow-brown | Ironwright icon = gear-flower, Demonic icon = horned skull. Shape differentiates. |
| Fey (green) vs Celestial (gold) | **Low-Medium** — green shifts toward yellow-brown, gold stays yellow | Fey icon = moon-tree, Celestial icon = sun-wings. Different shapes. |
| Endless (purple) vs others | **Low** — purple appears blue, distinct from all others | No issue. |

**Protanopia (red-blind, ~1% of males):**

| Pair | Risk | Mitigation |
|---|---|---|
| Ironwright (orange) vs Fey (green) | **Medium** — both appear yellow-green | Shape + icon differentiation. |
| Demonic (red) vs all | **Medium** — red appears dark, low-contrast | Demonic uses hellfire orange as secondary, which helps. |

**Tritanopia (blue-yellow, rare, ~0.001%):**

| Pair | Risk | Mitigation |
|---|---|---|
| Celestial (gold) vs Ironwright (orange) | **Medium** — both shift pinkish | Shape + icon differentiation. |
| Endless (purple) vs Demonic (red) | **Low** — both appear reddish but different saturation | Shape differentiates. |

### 8.3 Design Rule: Never Color Alone

Every place faction identity is communicated MUST use at minimum TWO channels:

1. **Color** (faction accent)
2. **Icon/Shape** (faction emblem)

Optional third channel:
3. **Text label** (faction name)

This means:
- `FactionTabBar` shows icon + short text + accent underline (3 channels)
- `BoardCardNode` on battlefield shows faction icon in corner + accent-tinted stats (2 channels)
- `BoardRuinNode` shows stone pillar badge + faction emblem if evolved + accent border (3 channels)
- Battle HUD shows faction emblem next to avatar (1 channel minimum, but avatar art is also faction-themed)
- Pack rows show faction emblem + faction name text + accent button color (3 channels)

### 8.4 Colorblind Mode Enhancements

The existing colorblind mode (Settings > Visuals > Colorblind Mode) needs expansion for 5 factions:

```swift
enum FactionPattern {
    case ironwright  // Diagonal hatching (////)
    case feyCourts   // Dots (...)
    case demonic     // Cross-hatching (XXXX)
    case celestial   // Horizontal lines (====)
    case endless     // Vertical lines (||||)
}

// Applied as subtle pattern overlay on faction-colored elements
// when colorblind mode is active
func factionPatternOverlay(_ faction: Faction) -> some View {
    Canvas { context, size in
        switch faction.pattern {
        case .ironwright:
            drawDiagonalHatch(context: context, size: size, spacing: 6)
        case .feyCourts:
            drawDotPattern(context: context, size: size, spacing: 8)
        case .demonic:
            drawCrossHatch(context: context, size: size, spacing: 6)
        case .celestial:
            drawHorizontalLines(context: context, size: size, spacing: 6)
        case .endless:
            drawVerticalLines(context: context, size: size, spacing: 6)
        }
    }
    .opacity(0.15) // Subtle, doesn't overwhelm
}
```

When colorblind mode is active:
- Faction tab underlines gain the pattern overlay
- Card borders in collection gain the pattern as a subtle texture
- Battlefield card slots show a faint pattern in the slot background
- Event overlay border shows Order = triangle icons, Chaos = circle icons (existing behavior, unchanged)

### 8.5 Font Accessibility

**Card Names**: `Cinzel-Bold` at 14pt on cards. At small sizes (board card, 64pt wide), card names are NOT displayed — only stat numbers are shown. Card names appear on tap (detail view) and in hand (88pt wide cards). Minimum readable size for Cinzel: 12pt.

**Effect Text on Ruins**: `Alegreya` at 11pt. This is the smallest text on any card. In the collection grid (100pt wide), effect text is not shown — only the ruin name and HP. Effect text appears in detail view and hand view.

**Dynamic Type**: All SwiftUI text outside of SpriteKit respects Dynamic Type via `.font(.system(size:))` (relative sizing). The `Cinzel` and `Alegreya` custom fonts use fixed sizes on cards but use `.font(.custom("Cinzel-Bold", size: 14, relativeTo: .headline))` in non-card contexts to support Dynamic Type.

**Maximum supported Dynamic Type**: XXL. Beyond XXL, layouts may clip. Acceptable tradeoff for a game UI.

### 8.6 VoiceOver Updates

New accessibility labels needed:

```swift
// Ruin on battlefield
ruinNode.accessibilityLabel = "\(ruin.name), Planar Ruin, \(ruin.hp) HP, " +
    "Effect: \(ruin.effectDescription). " +
    (ruin.isEvolved ? "\(ruin.faction!.displayName) evolved ruin." : "Neutral ruin.")

// Ruin in collection
ruinGridItem.accessibilityLabel = "\(ruin.name), Planar Ruin, \(ruin.hp) HP, " +
    "\(ruin.manaCost) mana cost. " +
    (ruin.isEvolutionReady ? "Ready to evolve." : "")

// Faction picker card
factionCard.accessibilityLabel = "\(faction.displayName). " +
    "\(faction.tagline). " +
    "Mechanic: \(faction.mechanicName). \(faction.mechanicDescription). " +
    (isTried ? "Already tried." : "Tap to try this faction.")

// Ruin destruction penalty banner
penaltyBanner.accessibilityLabel = "Ruin destroyed. Penalty: \(penalty)"
```

### 8.7 Ruin Status for Screen Readers

During battle, a hidden accessibility element announces ruin state changes:

```swift
// Announce ruin placement
AccessibilityNotification.Announcement(
    "Planar Ruin \(ruin.name) placed. Effect: \(ruin.effectDescription)."
).post()

// Announce ruin taking damage
AccessibilityNotification.Announcement(
    "\(ruin.name) takes \(damage) damage. \(ruin.currentHP) HP remaining."
).post()

// Announce ruin destruction
AccessibilityNotification.Announcement(
    "\(ruin.name) destroyed. Penalty activates: \(ruin.destructionPenalty)."
).post()
```

### 8.8 Reduced Motion for New Animations

All new animations added in this expansion follow the existing reduced-motion protocol:

| Animation | Normal | Reduced Motion |
|---|---|---|
| Ruin destruction crumble | 600ms crumble + rumble + particles | Instant fade-out, no rumble, no particles |
| Ruin aura pulse | Expanding circle loop | Static faint circle, no animation |
| Ruin penalty banner | Scale + fade entrance | Instant appear |
| Haste speed lines | Streak effect behind card | No streaks |
| Ward shimmer | Animated shield overlay | Static semi-transparent overlay |
| Exalt golden pulse | Ripple across all benefiting creatures | Static golden tint for 500ms |
| Persist ghostly afterimage | 500ms lingering ghost | No afterimage |
| Faction carousel swipe | Physics-based page scroll | Instant page change |

---

## Summary of High-Priority Changes

All changes marked **High** in the screen audit, organized by implementation order:

### Phase 1 — Data + Types (Prerequisite)
1. Add `Faction.celestial` and `Faction.endless` to Swift enums
2. Add `CardType.planarRuin` to Swift enums
3. Add `Keyword.haste` and `Keyword.ward` to Swift enums
4. Add `FactionColor` extensions for 5 factions
5. Add `FactionPattern` for colorblind mode

### Phase 2 — Card Rendering
6. Implement `RuinCardView` (SwiftUI) for collection/hand
7. Implement `BoardRuinNode` (SpriteKit) for battlefield
8. Implement `RuinGridItemView` for collection grid
9. Add Celestial + Endless death emitter particle files
10. Add rarity treatment implementations

### Phase 3 — Collection + Deck Builder
11. Update `FactionTabBar` (6 items, horizontal scroll)
12. Update `FilterPanelView` (ruin type, new keywords, ruin evolution filters)
13. Update `FactionSelectorRow` in deck builder (5 factions)
14. Update `DeckContentsPanel` (ruins section)
15. Update `CardPoolPanel` (type filter)
16. Update deck validation (ruin limits, faction locking)

### Phase 4 — New Screens
17. Implement `RuinDetailView`
18. Implement `RuinEvolutionFlowView` (5 steps)
19. Redesign `FactionPickerView` (5-faction carousel)
20. Update `FactionCommitmentView`

### Phase 5 — Battle Integration
21. Implement ruin placement in `BattleScene`
22. Implement ruin destruction animation
23. Implement ruin aura effect
24. Implement ruin penalty banner
25. Add battlefield backgrounds for Celestial + Endless
26. Add Haste/Ward visual effects
27. Add Exalt/Persist visual effects

### Phase 6 — Shop + Onboarding
28. Update card packs section (5 factions)
29. Update onboarding flow (5-faction trial)
30. Add ruin discovery presentation view
