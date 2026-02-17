# 08 — Audio Design

This document defines the music, SFX, and adaptive audio systems for Chaos Creatures. It is written for a solo non-engineer owner who will build this app using Claude Code with Swift, SwiftUI, and SpriteKit on iOS. Every section is specific enough that Claude Code can generate working Swift code directly from it. No sound designer, audio engineer, or composer needs to be hired — all assets are sourced from AI-generation tools and royalty-free libraries described in Section 8.

**Platform:** Native iOS only. Swift + SwiftUI + SpriteKit. App Store only. iOS 17+ minimum.

**Depends on:** `00-game-design-master.md` (game overview, faction system, UI structure), `01-battle-mechanics.md` (battle flow, events, keywords)

---

## 1. Audio Pillars

### Design Goals

- **Faction Identity Through Sound:** Each faction has a distinct sonic palette that reinforces its visual and mechanical identity. Players should recognize their opponent's faction by audio alone.
- **Chaos vs. Order as Musical Tension:** The central strategic axis is reflected in musical and SFX design. Order = harmonic, structured, crystalline. Chaos = dissonant, volatile, organic distortion.
- **Mobile-Optimized Audio:** Short loops, compressed file sizes, clear sound design that works through phone speakers and earbuds.
- **Emotional Peaks at Key Moments:** Evolution ceremony, chaos roll, and event triggers are the "wow" moments. Audio must deliver.
- **Non-Intrusive Background:** Music and ambience should enhance focus, not distract. Players will spend hours in battles — the audio must avoid fatigue.

### Technical Constraints

- **Platform:** iOS 17+ (iPhone 12+ target), built with Swift + SwiftUI + SpriteKit
- **Audio APIs:**
  - `AVAudioEngine` with `AVAudioPlayerNode` for adaptive/layered music mixing (battle music stems, instability crossfading)
  - `AVAudioPlayer` for simple non-adaptive playback (menu music, shop ambient, evolution ceremony)
  - `SKAction.playSoundFileNamed(_:waitForCompletion:)` for SFX triggered inside SpriteKit scenes (card play, creature attack, death, chaos roll, event SFX during battle)
- **File format:**
  - Music loops: **CAF** (Core Audio Format) — lossless container, zero-gap looping natively supported on iOS, no MP3 gapless-loop hacks needed
  - SFX (short, in-scene): **CAF** — lowest latency on iOS, preferred by AVAudioEngine and SKAction
  - Long ambient backgrounds: **AAC** at 128 kbps (smaller file size acceptable for background textures that are not latency-critical)
  - All files encoded at **44.1 kHz, stereo** unless noted otherwise
- **File storage:** All audio files stored in the Xcode project's asset catalog (`Assets.xcassets`) under an `Audio` folder group, or in a dedicated `Resources/Audio/` folder group within the Xcode target. SFX used by SpriteKit scenes must be in the main bundle (not in asset catalog subdirectories) so `SKAction.playSoundFileNamed` can locate them by filename.
- **Simultaneous channel limit:** 16 concurrent audio channels maximum (8 SFX + 4 music layers + 2 ambient + 2 reserved for OS interruptions)
- **File size budget:**
  - Total music (CAF): ~18 MB
  - Total SFX (CAF): ~3 MB
  - Total ambient (AAC): ~2 MB
  - **Total audio package: ~23 MB**
- **Latency:** <20ms for gameplay SFX triggers (chaos roll, card play, combat) — AVAudioEngine and SKAction on iOS are both capable of sub-20ms latency when files are pre-loaded
- **Volume control:** Master, Music, SFX independently adjustable. Default: Music 60%, SFX 80%, Master 100%.

---

## 2. Faction Audio Identities

Each faction has a unique sonic signature built from instrument palettes, rhythmic patterns, and timbral choices. These signatures appear in faction-specific battle music, UI accents, and SFX variations.

### The Ironwright Collective (Steampunk)

**Sonic Identity:** Industrial, mechanical, brass-heavy, rhythmic precision.

**Instrument Palette:**
- **Lead:** Brass instruments (trumpet, trombone, French horn), processed through light distortion for a "steam-powered" quality
- **Rhythm:** Mechanical percussion — anvil strikes, steam hisses (rhythmic), clockwork ticking (subtle hi-hat layer), metal-on-metal clangs
- **Harmony:** Low brass pads, factory drones, gear grinding (tonal bass)
- **Accents:** Steam release bursts, pressure valve releases, piston movements (synced to tempo)

**Musical Style:**
- **Tempo:** 90-110 BPM (steady, march-like)
- **Key/Mode:** Minor keys with industrial harmonics (dystopian steampunk, not bright Victorian)
- **Rhythm:** 4/4 time signature, strong downbeat emphasis, syncopated mechanical loops

**SFX Flavor:**
- Card play: Metallic click + gear turn
- Creature attack: Piston thrust + brass stab
- Creature death: Metallic collapse + steam release
- Augment modifier trigger: Clockwork wind-up
- Evolution: Steam buildup → pressure release → brass fanfare

**Reference Vibe:** Dishonored soundtrack (industrial dark fantasy), Machinarium (whimsical mechanical), Frostpunk (grim industrial brass)

---

### The Fey Courts (High Fantasy / Fey & Druidic)

**Sonic Identity:** Ethereal, organic, nature-infused, mystical.

**Instrument Palette:**
- **Lead:** Woodwinds (flute, pan flute, oboe), Celtic harp, bowed strings (cello, violin)
- **Rhythm:** Light hand percussion (frame drum, bodhran), wood blocks, rainstick (ambient layer)
- **Harmony:** String pads (lush, reverb-heavy), choir (whispered/hummed vocals — no lyrics), wind ambience
- **Accents:** Crystal chimes (bioluminescent flora imagery), birdsong (distant), forest rustling, mycelial network pulses (deep sub-bass hum)

**Musical Style:**
- **Tempo:** 70-85 BPM (slower, flowing, dreamlike)
- **Key/Mode:** Dorian and Lydian modes (mystical, neither purely major nor minor)
- **Rhythm:** 6/8 or 3/4 time signature (waltz-like, organic sway)

**SFX Flavor:**
- Card play: Harp glissando + leaf rustle
- Creature attack: Wind gust + crystalline chime
- Creature death: Fading harp chord + nature sigh (wind/leaves)
- Bond modifier trigger: Multi-note harp arpeggio (network connection)
- Evolution: Nature ambience buildup → crystal crack → choir swell

**Reference Vibe:** Ori and the Blind Forest (mystical natural beauty), Hollow Knight (ethereal choir work), Studio Ghibli soundtracks (whimsy + mystery)

---

### The Demonic Kingdoms (Hellfire / Dark Fantasy)

**Sonic Identity:** Visceral, aggressive, dark, ritualistic.

**Instrument Palette:**
- **Lead:** Deep brass (bass trombone, tuba), distorted electric cello, war horns
- **Rhythm:** War drums (taiko, bass drum), bone percussion (rattles, rib cage strikes), chain rattles
- **Harmony:** Throat singing (Mongolian style, guttural), sub-bass drones, choral chants (Latin-esque, dark)
- **Accents:** Crackling fire (constant textural layer), obsidian scrapes, blood drips (subtle percussion), hellfire roars

**Musical Style:**
- **Tempo:** 100-120 BPM (aggressive, relentless)
- **Key/Mode:** Phrygian mode (Middle Eastern darkness), atonal sections during chaos spikes
- **Rhythm:** 4/4 with heavy downbeats, double-bass drum kicks, war march intensity

**SFX Flavor:**
- Card play: Bone crack + low growl
- Creature attack: War drum hit + guttural roar
- Creature death: Obsidian shatter + fading chant
- Corruption modifier trigger: Crackling burn + pained hiss (self-damage)
- Evolution: Fire buildup → ritual chant crescendo → hellfire explosion

**Reference Vibe:** DOOM soundtrack (visceral aggression), God of War (epic war drums + choir), Diablo series (dark ritualistic ambience)

---

## 3. Music Design

### 3.1 Main Menu Theme

**Function:** Sets the tone for the entire game. Faction-neutral. Reflects the "Planes of Chaos" lore — a world torn between Order and Chaos.

**Musical Direction:**
- **Instrumentation:** Hybrid orchestral + electronic. Strings (Order) clash with distorted synths (Chaos). D20 motif (percussive rhythmic element representing the roll).
- **Structure:** ABA form with tension/release. Intro (mystery), A section (Order-leaning, calm strings), B section (Chaos intrusion, dissonance, rising tension), Return to A (balance restored but uneasy).
- **Tempo:** 75 BPM (contemplative, not rushed)
- **Key:** D minor → D major (Order sections) → D Phrygian (Chaos sections)
- **Length:** 2:30 loop

**Emotional Goal:** Mysterious, epic, slightly uneasy. This is a world in conflict. The player is about to step into that conflict.

**Implementation:** Played via `AVAudioPlayer`. File loaded with `prepareToPlay()` on app launch. `numberOfLoops = -1` for infinite looping. Plays on Home screen, Collection screen, Deck Builder, Profile, Shop. Stopped (with 1-second fade-out) when battle matchmaking begins.

**Sourcing:** Generate using Suno AI (see Section 8). Prompt: `"Dark orchestral card game theme, hybrid orchestral and electronic, strings and distorted synths, mysterious and epic, 75 BPM, 2.5 minutes, loopable, D minor, tension and release structure, no vocals"`. Export as WAV from Suno, convert to CAF using `afconvert` in Terminal (free, built into macOS).

---

### 3.2 Battle Music — Adaptive System

Battle music is **faction-responsive** and **instability-adaptive**. The system uses layered stems mixed in real time by `AVAudioEngine`.

#### Base Architecture

Each battle track has **4 stems** that play simultaneously via separate `AVAudioPlayerNode` instances attached to a single `AVAudioEngine`. Stem volumes are adjusted in real time without stopping or reloading audio.

1. **Foundation layer** (always at full volume): Bass + minimal percussion. Faction-neutral.
2. **Player faction layer**: Adds player's faction instrumentation (brass for Ironwright, woodwinds for Fey, war drums for Demonic).
3. **Opponent faction layer**: Adds opponent's faction instrumentation.
4. **Intensity layer**: Percussion + harmonic tension. Volume scales with board complexity.

The intensity layer is split into **two files**: `MUS_Battle_Intensity_Order.caf` (clean, consonant) and `MUS_Battle_Intensity_Chaos.caf` (distorted, dissonant). Both play simultaneously; their volumes are crossfaded based on the player's instability rating.

**Example — Ironwright (player) vs. Fey Courts (opponent):**
- Foundation: Tonal bass drone + soft kick drum
- Ironwright layer: Brass melody + clockwork ticking
- Fey layer: Harp counter-melody + string pads
- Intensity layer: War drums + dissonant strings (fades in as creatures accumulate)

The result is a unique sonic blend for each faction matchup.

#### Adaptive Triggers

**Board State → Intensity Layer Volume:**
- 0-2 total creatures on board: Intensity at 20% (calm)
- 3-5 creatures: Intensity at 50%
- 6-8 creatures: Intensity at 80%
- 9-10 creatures: Intensity at 100% (full battle chaos)

**Instability → Harmonic Treatment:**
- **Player instability 1-6 (Order zone):** Music leans consonant. Major/Dorian harmonies. Sustained notes. Calm.
- **Player instability 7-13 (Hybrid zone):** Neutral. Mix of consonance and dissonance.
- **Player instability 14-20 (Chaos zone):** Music leans dissonant. Tremolo strings, distorted layers, atonal stabs.

This is achieved via volume crossfading between `MUS_Battle_Intensity_Order.caf` and `MUS_Battle_Intensity_Chaos.caf` using `AVAudioPlayerNode.volume`. No real-time DSP processing occurs on device — just volume adjustments on pre-processed pre-mixed stems.

**Combat Phase Kick:**
- When attackers are declared, a **percussion hit** fires as a `SKAction.playSoundFileNamed` call (faction-specific: anvil for Ironwright, war drum for Demonic, frame drum for Fey).
- The intensity layer volume briefly spikes +20% for the duration of combat resolution (Phases 6-8), then returns to baseline after End of Turn.

#### Track Count

**Launch Content:**
- 3 faction-specific stems (Ironwright, Fey, Demonic) × 1 layer each = 3 stems
- 1 foundation layer (universal) = 1 stem
- 2 intensity layer stems (Order and Chaos versions) = 2 stems
- **Total: 6 battle music stems** (~10-12 MB as CAF)

Each match dynamically combines 4 of these 6 stems based on matchup (foundation + player faction + opponent faction + one of the two intensity stems, with the other intensity stem running in parallel for crossfading).

**Tempo:** 95 BPM (battle-ready but not frantic). All stems locked to the same BPM for seamless layering.

**Length:** Each stem is a 32-bar loop (~2:00 at 95 BPM). CAF format supports exact sample-aligned loop points, guaranteeing seamless looping.

**Sourcing:** See Section 8. Generate each stem separately in Suno AI with matching BPM. Export as WAV, convert to CAF using `afconvert -f caff -d LEI16 input.wav output.caf` in Terminal (built-in macOS tool, free). Trim to a clean 32-bar loop in Audacity (free) before conversion.

---

### 3.3 Evolution Ceremony Music

**Function:** The most emotionally impactful moment in the game. This is the player's payoff for 10-100 games of investment. Audio must deliver weight, magic, and triumph.

**Structure (3 phases):**

1. **Energy Buildup (0:00–0:20)**
   - Current card appears. Chaos energy particles gather.
   - **Audio:** Ambient drone (low sub-bass hum), rising synth pad, crackling energy (granular texture), heartbeat-like percussion (slow, building).

2. **Transformation (0:20–0:40)**
   - Planar Shard cracks. Particles flow through. AI generation happening.
   - **Audio:** Shard crack SFX (crystalline explosion), massive energy whoosh (sweeping filter), rhythmic pulses (synced to particle flow), choir swell (no lyrics, just "ahh" vocal), rising pitch bend (tension).
   - **Faction flavor injection:** Brass stabs (Ironwright), harp glissando (Fey), war drum roll (Demonic) layer in faintly based on card's faction.

3. **Reveal (0:40–1:10)**
   - New card art appears. New name, stats, modifiers revealed step by step.
   - **Audio:** Triumphant fanfare (orchestral hit + faction-specific lead instrument), reverb-drenched harmonic resolution (major chord, lush strings), fading ambience (particles settle).
   - **Order vs. Chaos coloring:**
     - If evolution outcome was **Order**: Bright major chord, crystalline chimes, clean reverb.
     - If evolution outcome was **Chaos**: Dissonant resolution (major chord with #4), distorted undertone, crackling fire ambience.

**Total length:** 1:10 (non-looping, plays once per evolution)

**Emotional Goal:** Goosebumps. This is your card's transformation. It should feel like a ritual, a birth, a triumph.

**Implementation:** Played via `AVAudioPlayer` (non-adaptive, single file). Loaded in `viewDidAppear` of the evolution SwiftUI view. `prepareToPlay()` called on load. Player can skip by tapping — fade-out implemented by calling `setVolume(0, fadeDuration: 2.0)` on the `AVAudioPlayer` instance, then `stop()` after 2 seconds using `DispatchQueue.main.asyncAfter`.

---

### 3.4 Shop & Collection Ambient Music

**Function:** Calm background music for browsing cards, building decks, managing collection. Non-intrusive, loops indefinitely.

**Musical Direction:**
- **Instrumentation:** Minimal. Solo piano or harp + soft string pads + subtle ambient texture (wind, distant chimes).
- **Tempo:** 60 BPM (slow, contemplative)
- **Key:** A minor (calm, introspective)
- **Structure:** Simple ABA loop, no dramatic peaks. This is furniture music — it should not demand attention.
- **Length:** 3:00 loop
- **Format:** AAC 128 kbps (background use, file size more important than latency here)

**Shares the same track for Shop and Collection screens.** The main menu theme is already playing on Home, so this is used for screens where the player is spending longer periods browsing/building.

**Implementation:** Played via `AVAudioPlayer`, `numberOfLoops = -1`. Crossfade from main menu theme: fade out main menu over 1 second, then start shop ambient.

**Emotional Goal:** Calm, focus-friendly, slightly melancholic (the world is in chaos, but here you're safe to plan).

---

### Music Summary Table

| Context | Track | Tempo | Length | Adaptive? | Format | File Size (est.) |
|---|---|---|---|---|---|---|
| Main Menu / Home | Planes of Chaos Theme | 75 BPM | 2:30 loop | No | CAF | ~2.5 MB |
| Battle | Faction Stem Layers (6 stems) | 95 BPM | 2:00 loop each | Yes (AVAudioEngine mix) | CAF | ~12 MB |
| Evolution Ceremony | Transformation Ritual | Variable | 1:10 (one-shot) | Faction + outcome coloring | CAF | ~1.5 MB |
| Shop / Collection | Calm Ambient | 60 BPM | 3:00 loop | No | AAC 128 kbps | ~2 MB |
| **TOTAL** | | | | | | **~18 MB** |

---

## 4. SFX Inventory

All SFX are designed to be **clear, punchy, mobile-friendly** (work on small speakers), and **under 1 second in length** (except ambient loops). All SFX stored as CAF files for lowest possible latency when played via `SKAction.playSoundFileNamed` or `AVAudioEngine`.

### 4.1 Battle Gameplay SFX

| Event | SFX Description | Faction Variation? | Estimated File Size |
|---|---|---|---|
| **Card Play (Creature)** | Card whoosh + thud (card hitting board) + faction accent | Yes (Ironwright: gear click, Fey: leaf rustle, Demonic: bone crack) | 3 × 20 KB = 60 KB |
| **Card Play (Spell)** | Magical hum + casting whoosh | No (universal) | 15 KB |
| **Card Draw** | Soft card flip + paper slide | No | 10 KB |
| **Deck Shuffle** | Rapid card fluttering (startup only) | No | 20 KB |
| **Mana Gain** | Crystalline chime (ascending pitch) | No | 10 KB |
| **Mana Spend** | Soft glass clink (descending pitch) | No | 10 KB |
| **Creature Attack (Declare)** | War cry + movement whoosh | Yes (Ironwright: piston thrust, Fey: wind gust, Demonic: guttural roar) | 3 × 25 KB = 75 KB |
| **Creature Hit (Damage Dealt)** | Impact thud + damage number pop | No | 15 KB |
| **Creature Death** | Destruction sound + fading echo | Yes (Ironwright: metal collapse, Fey: nature sigh, Demonic: bone shatter) | 3 × 30 KB = 90 KB |
| **Damage to Avatar (Face)** | Heavy thud + screen shake rumble | No | 20 KB |
| **Heal (Creature or Avatar)** | Soft sparkle + uplifting chime | No | 15 KB |
| **Turn Transition** | Gentle "whoosh" + subtle UI transition sound | No | 10 KB |
| **Timer Warning (15s left)** | Tense ticking + rising pitch hum | No | 25 KB |
| **Turn Auto-End (Timer Expire)** | Abrupt stop + error tone | No | 15 KB |
| **Surrender Confirmation** | Somber low tone + fade | No | 20 KB |

**Subtotal: ~400 KB**

---

### 4.2 Keyword SFX

Triggered when keyword abilities activate during combat.

| Keyword | SFX Description | File Size (est.) |
|---|---|---|
| **Shield Break** | Glass shatter + crystalline cascade | 20 KB |
| **Lifesteal Heal** | Blood-rush whoosh + healing chime | 15 KB |
| **Flying Swoop** | Wing flap + air rush | 20 KB |
| **Reach Block (vs. Flying)** | Net/chain catch + pull-down thud | 20 KB |
| **Deathtouch Kill** | Venom hiss + instant collapse | 20 KB |
| **Taunt Lock-On** | Aggro roar + forced movement sound | 20 KB |
| **Piercing Through** | Impact + secondary pierce whoosh + splash | 20 KB |

**Subtotal: ~135 KB**

---

### 4.3 Chaos Roll SFX

The **centerpiece audio moment** of every turn. The D20 roll is both a visual and audio spectacle.

| Element | SFX Description | File Size (est.) |
|---|---|---|
| **D20 Tumble** | Dice tumbling sound (plastic/bone hybrid), 1-2 seconds, builds anticipation | 40 KB |
| **Roll Result — Order Event** | Harmonious chime (major chord), crystalline resonance, uplifting | 25 KB |
| **Roll Result — Chaos Event** | Dissonant crash (tritone), distorted percussion hit, tense | 25 KB |
| **Roll Result — Nothing (exact match)** | Neutral tone (single note, no harmony), "pause" effect, anticlimactic | 15 KB |
| **Instability Indicator Update** | Subtle UI bleep (updates instability number on screen) | 5 KB |

**Subtotal: ~110 KB**

---

### 4.4 Event SFX (16 Total: 8 Order + 8 Chaos)

Each event has a unique SFX that plays when the event resolves. These must be **instantly recognizable** after a few plays so players can anticipate effects by sound alone.

#### Order Events

| Event | SFX Description | File Size (est.) |
|---|---|---|
| **O1: Mending Light** | Gentle healing chime + soft sparkle | 15 KB |
| **O2: Planar Ward** | Shield materializing (glass forming) + protective hum | 20 KB |
| **O3: Steady Growth** | Multiple small "growth" pops (like plants sprouting) | 20 KB |
| **O4: Clarity** | Card draw sound + enlightenment chime | 15 KB |
| **O5: Fortify** | Stone settling + reinforcement clang | 20 KB |
| **O6: Sanctuary** | Warm healing tone + reverb-heavy pad | 20 KB |
| **O7: Bulwark** | Heavy shield placement + low metallic ring | 20 KB |
| **O8: Harmonize** | Multi-note harmonic chord (healing) + gentle wave | 25 KB |

**Order Subtotal: ~155 KB**

#### Chaos Events

| Event | SFX Description | File Size (est.) |
|---|---|---|
| **C1: Surge** | Power-up whoosh + electric crackle | 20 KB |
| **C2: Wildfire** | Fireball impact + sizzle | 20 KB |
| **C3: Upheaval** | Explosion (board-wide) + rumble + debris scatter | 30 KB |
| **C4: Frenzy** | War horn blast + multiple creature roars | 25 KB |
| **C5: Rift Bolt** | Lightning strike + thunder crack | 25 KB |
| **C6: Chaos Siphon** | Drain sound (sucking) + power surge | 25 KB |
| **C7: Maelstrom** | Chaotic swirl + violent impact + distortion | 30 KB |
| **C8: Overcharge** | Electric buildup + massive energy discharge | 25 KB |

**Chaos Subtotal: ~200 KB**

**Events Total: ~355 KB**

---

### 4.5 Evolution SFX

These layer into the Evolution Ceremony Music (Section 3.3) but are separate SFX files for timing flexibility.

| Element | SFX Description | File Size (est.) |
|---|---|---|
| **Energy Buildup** | Granular crackling + rising hum (loopable, fades in/out) | 30 KB |
| **Planar Shard Crack** | Crystalline explosion (multiple glass layers) | 40 KB |
| **Transformation Whoosh** | Massive energy sweep (filter sweep + wind rush) | 35 KB |
| **Reveal Fanfare** | Orchestral hit + reverb tail | 40 KB |
| **Order Evolution Accent** | Crystalline chime cascade | 20 KB |
| **Chaos Evolution Accent** | Distorted crackle + fire burst | 20 KB |
| **Modifier Selection** | UI confirm beep + subtle magic sparkle | 10 KB |

**Subtotal: ~195 KB**

---

### 4.6 UI SFX

| Action | SFX Description | File Size (est.) |
|---|---|---|
| **Button Tap (Generic)** | Soft click + subtle feedback tone | 8 KB |
| **Button Tap (Primary Action — Play, Confirm)** | Heavier click + confirmation chime | 10 KB |
| **Tab Switch** | Soft whoosh + UI transition | 10 KB |
| **Card Flip (in Collection)** | Paper flip + soft thud | 12 KB |
| **Scroll (Card Hand)** | Subtle swipe rustle | 8 KB |
| **Deck Selection** | Card stack shuffle + confirm tone | 15 KB |
| **Mission Complete** | Success chime + short fanfare | 20 KB |
| **Level Up / Rank Up** | Triumphant fanfare + UI flourish | 30 KB |
| **Error / Invalid Action** | Soft "bonk" + descending tone | 10 KB |
| **Notification Pop** | Gentle alert chime | 8 KB |

**Subtotal: ~131 KB**

---

### SFX Summary

| Category | File Count | Total Size (est.) |
|---|---|---|
| Battle Gameplay SFX | 14 | ~400 KB |
| Keyword SFX | 7 | ~135 KB |
| Chaos Roll SFX | 5 | ~110 KB |
| Event SFX (16 total) | 16 | ~355 KB |
| Evolution SFX | 7 | ~195 KB |
| UI SFX | 10 | ~131 KB |
| **TOTAL** | **59** | **~1.3 MB** |

**Note:** Faction variations (creature attack, death, card play) are counted as separate files in the total count but share similar design templates. As CAF files, 1.3 MB compressed is approximately 2-3 MB uncompressed in RAM — well within iOS memory limits.

---

## 5. Adaptive Audio System

The game uses a **dynamic mixing system** built on `AVAudioEngine` that responds to game state in real time. This keeps audio fresh across hundreds of battles and creates a tighter connection between player decisions and audio feedback.

### 5.1 Music Intensity Scaling (Battle)

**Trigger:** Total creature count on both boards (player's creatures + opponent's creatures).

**Implementation using AVAudioEngine:**
- All 4-6 active stems loaded into separate `AVAudioPlayerNode` instances attached to one `AVAudioEngine`
- Foundation layer: Always at 100% (`node.volume = 1.0`)
- Player faction layer: Always at 100%
- Opponent faction layer: Always at 100%
- **Intensity layer nodes: Volume scales 0.0–1.0 based on creature count**

**Formula:**
```swift
let intensityVolume = min(1.0, Float(totalCreatures) / 10.0)
```

| Creatures on Board | Intensity Volume |
|---|---|
| 0-1 | 0.0-0.1 (barely audible) |
| 2 | 0.2 |
| 3 | 0.3 |
| 5 | 0.5 (midpoint) |
| 8 | 0.8 |
| 10 | 1.0 (full chaos) |

**Feel:** Early turns are calm, strategic. As boards fill, tension builds. A board wipe (Upheaval, combat, etc.) drops intensity instantly — audible release.

---

### 5.2 Instability → Harmonic Tension

**Trigger:** Active player's instability value (recalculated each time creatures enter/leave board).

**Implementation using AVAudioEngine:**
- Both `MUS_Battle_Intensity_Order.caf` and `MUS_Battle_Intensity_Chaos.caf` play simultaneously via separate `AVAudioPlayerNode` instances
- `AudioManager.setInstabilityWeight(_:)` adjusts their volumes in complementary fashion

**Formula:**
```swift
func setInstabilityWeight(_ instability: Int) {
    let chaosWeight = Float(instability - 1) / 19.0 // 0.0 to 1.0
    let orderWeight = 1.0 - chaosWeight
    let base = intensityBaseVolume * musicVolume * masterVolume
    intensityOrderNode.volume = base * orderWeight
    intensityChaoNode.volume  = base * chaosWeight
}
```

| Player Instability | Order Node Volume | Chaos Node Volume | Musical Feel |
|---|---|---|---|
| 1-5 | 80-100% | 0-20% | Calm, structured, major harmonies |
| 6-10 | 50-70% | 30-50% | Neutral, balanced |
| 11-15 | 30-50% | 50-70% | Tense, building dissonance |
| 16-20 | 0-20% | 80-100% | Chaotic, distorted, aggressive |

**Technical Note:** The "Order Mix" and "Chaos Mix" are separate pre-processed audio files (two versions of the same loop — one clean, one distorted). `AVAudioEngine` adjusts their volume in real time. No real-time DSP processing occurs on device.

---

### 5.3 Combat Phase Percussion Kick

**Trigger:** Attackers are declared (transition from Main Phase to Declare Attackers).

**Implementation:**
- A single **percussion hit** SFX is fired via `SKAction.playSoundFileNamed(_:waitForCompletion:)` inside the SpriteKit battlefield scene, faction-specific to the attacking player's faction:
  - **Ironwright:** `SFX_CombatKick_Ironwright.caf` (anvil strike — metallic clang)
  - **Fey Courts:** `SFX_CombatKick_Fey.caf` (frame drum hit — organic thud)
  - **Demonic Kingdoms:** `SFX_CombatKick_Demonic.caf` (war drum — deep bass boom)
- The intensity layer volume on the `AVAudioPlayerNode` briefly spikes +20% during combat resolution phases, then returns to baseline at End of Turn.

**Feel:** Combat feels punctuated, weighty. The percussion hit is a "now we fight" moment. Music surges during combat, recedes during planning.

---

### 5.4 Audio Priority System

iOS has no hard channel count limit, but the game imposes a software limit to ensure critical SFX are never dropped and CPU usage stays predictable.

**Channel Allocation:**
- 8 channels: SFX (gameplay + UI)
- 4 channels: Music layers (battle stems via AVAudioEngine)
- 2 channels: Ambient (evolution ceremony, background loops via AVAudioPlayer)
- 2 channels: OS reserved (phone calls, Siri, interruptions)

**Priority Tiers (highest to lowest):**

1. **P0 — Critical Gameplay SFX:** Chaos roll result, event SFX, creature death, damage to avatar. Never dropped. Always played via `AVAudioEngine` auxiliary mixer node for lowest latency.
2. **P1 — Important Gameplay SFX:** Card play, creature attack, keyword triggers, mana gain/spend. Dropped only if 8 SFX channels full.
3. **P2 — Music Layers:** Battle music stems, menu music. Volume ducked to 60% when P0 SFX fires.
4. **P3 — UI SFX:** Button taps, tab switches, scrolls. Dropped if SFX channels full.
5. **P4 — Ambient:** Evolution ceremony ambient layers. Stopped if memory pressure event received.

**Ducking Rules:**
- When a P0 SFX fires (e.g., Chaos Roll result, Upheaval explosion), music ducks to 60% volume for 1 second, then returns. Implemented by adjusting `AVAudioPlayerNode.volume` directly.
- When Evolution Ceremony music plays, all other music stops (`AVAudioPlayer.stop()` on menu/battle music players).

**iOS Audio Session Interruptions:**
- `AVAudioSession` notifications for interruptions (phone calls, Siri) must be handled: pause all audio on `.began`, resume on `.ended` if `shouldResume` is true.
- Register for `AVAudioSession.interruptionNotification` in `AudioManager.init()`.

---

## 6. Technical Specifications

### 6.1 File Format & Compression

| Audio Type | Format | Encoding | Rationale |
|---|---|---|---|
| **Music loops (battle stems, menu theme, evolution)** | CAF | PCM LEI16 or Apple Lossless (ALAC) | CAF supports exact sample-aligned loop points, zero-gap looping on iOS without file header manipulation. Used with AVAudioEngine. |
| **SFX (short, in-scene)** | CAF | PCM LEI16 | Lowest latency for SKAction.playSoundFileNamed and AVAudioEngine. Files are small enough that lossless is practical. |
| **Ambient (long background loops)** | AAC | 128 kbps | File size more important than latency for background music. AVAudioPlayer handles AAC streaming natively. |

**macOS conversion command (built-in `afconvert`, no download needed):**
```bash
# WAV/AIFF to CAF (lossless PCM, for SFX and music stems)
afconvert -f caff -d LEI16 input.wav output.caf

# WAV to AAC (for ambient loops only)
afconvert -f m4af -d aac -b 128000 input.wav output.m4a
```

**Total file size budget: ~23 MB** (18 MB music + 3 MB SFX + 2 MB ambient). Fits within App Store app bundle without requiring on-demand resources.

---

### 6.2 Xcode Asset Catalog and Bundle Structure

All audio files are added to the **Xcode project target** (not an asset catalog subdirectory that would alter bundle paths). They must be present in the app's **main bundle** so `SKAction.playSoundFileNamed`, `AVAudioPlayer(contentsOf:)`, and `Bundle.main.url(forResource:withExtension:)` can locate them by filename.

**Recommended Xcode folder group structure:**
```
ChaosCreatures (Xcode Project)
└── Resources/
    └── Audio/
        ├── Music/
        │   ├── MUS_MainMenu_PlanesOfChaos.caf
        │   ├── MUS_Battle_Foundation.caf
        │   ├── MUS_Battle_Ironwright_FactionLayer.caf
        │   ├── MUS_Battle_Fey_FactionLayer.caf
        │   ├── MUS_Battle_Demonic_FactionLayer.caf
        │   ├── MUS_Battle_Intensity_Order.caf
        │   ├── MUS_Battle_Intensity_Chaos.caf
        │   ├── MUS_Evolution_Transformation.caf
        │   └── MUS_Shop_Ambient.m4a
        └── SFX/
            ├── SFX_Battle_CardPlay_Ironwright.caf
            ├── SFX_Battle_CardPlay_Fey.caf
            ├── SFX_Battle_CardPlay_Demonic.caf
            ├── SFX_Battle_CardPlay_Spell.caf
            ├── SFX_Battle_CardDraw.caf
            ├── SFX_Battle_DeckShuffle.caf
            ├── SFX_Battle_ManaGain.caf
            ├── SFX_Battle_ManaSpend.caf
            ├── SFX_Battle_CreatureAttack_Ironwright.caf
            ├── SFX_Battle_CreatureAttack_Fey.caf
            ├── SFX_Battle_CreatureAttack_Demonic.caf
            ├── SFX_Battle_CreatureHit.caf
            ├── SFX_Battle_CreatureDeath_Ironwright.caf
            ├── SFX_Battle_CreatureDeath_Fey.caf
            ├── SFX_Battle_CreatureDeath_Demonic.caf
            ├── SFX_Battle_AvatarDamage.caf
            ├── SFX_Battle_Heal.caf
            ├── SFX_Battle_TurnTransition.caf
            ├── SFX_Battle_TimerWarning.caf
            ├── SFX_Battle_TurnAutoEnd.caf
            ├── SFX_Battle_Surrender.caf
            ├── SFX_Keyword_ShieldBreak.caf
            ├── SFX_Keyword_Lifesteal.caf
            ├── SFX_Keyword_FlyingSwoop.caf
            ├── SFX_Keyword_ReachBlock.caf
            ├── SFX_Keyword_Deathtouch.caf
            ├── SFX_Keyword_TauntLockOn.caf
            ├── SFX_Keyword_Piercing.caf
            ├── SFX_ChaosRoll_D20Tumble.caf
            ├── SFX_ChaosRoll_OrderResult.caf
            ├── SFX_ChaosRoll_ChaosResult.caf
            ├── SFX_ChaosRoll_Nothing.caf
            ├── SFX_ChaosRoll_InstabilityUpdate.caf
            ├── SFX_Event_O1_MendingLight.caf
            ├── SFX_Event_O2_PlanarWard.caf
            ├── SFX_Event_O3_SteadyGrowth.caf
            ├── SFX_Event_O4_Clarity.caf
            ├── SFX_Event_O5_Fortify.caf
            ├── SFX_Event_O6_Sanctuary.caf
            ├── SFX_Event_O7_Bulwark.caf
            ├── SFX_Event_O8_Harmonize.caf
            ├── SFX_Event_C1_Surge.caf
            ├── SFX_Event_C2_Wildfire.caf
            ├── SFX_Event_C3_Upheaval.caf
            ├── SFX_Event_C4_Frenzy.caf
            ├── SFX_Event_C5_RiftBolt.caf
            ├── SFX_Event_C6_ChaosSiphon.caf
            ├── SFX_Event_C7_Maelstrom.caf
            ├── SFX_Event_C8_Overcharge.caf
            ├── SFX_Evolution_EnergyBuildup.caf
            ├── SFX_Evolution_ShardCrack.caf
            ├── SFX_Evolution_TransformWhoosh.caf
            ├── SFX_Evolution_RevealFanfare.caf
            ├── SFX_Evolution_OrderAccent.caf
            ├── SFX_Evolution_ChaosAccent.caf
            ├── SFX_Evolution_ModifierSelect.caf
            ├── SFX_CombatKick_Ironwright.caf
            ├── SFX_CombatKick_Fey.caf
            ├── SFX_CombatKick_Demonic.caf
            ├── SFX_UI_ButtonTap.caf
            ├── SFX_UI_ButtonTapPrimary.caf
            ├── SFX_UI_TabSwitch.caf
            ├── SFX_UI_CardFlip.caf
            ├── SFX_UI_Scroll.caf
            ├── SFX_UI_DeckSelect.caf
            ├── SFX_UI_MissionComplete.caf
            ├── SFX_UI_LevelUp.caf
            ├── SFX_UI_Error.caf
            └── SFX_UI_Notification.caf
```

**How to add to Xcode:** In Xcode's Project Navigator, right-click `Resources/` → "Add Files to ChaosCreatures". Select the audio files. Ensure "Copy items if needed" is checked and the target `ChaosCreatures` is ticked. The files must appear in the target's "Copy Bundle Resources" build phase.

---

### 6.3 Looping & Seamlessness

All looping tracks (battle music stems, menu themes, ambient) must:
- **Loop seamlessly** with zero gap or click at the loop point.
- Use **exact sample-aligned loop points** (trim to whole bars, no partial samples).
- Include a **10ms crossfade** at the loop boundary (baked into the file using Audacity's crossfade loop export) to ensure smooth transitions.

**CAF advantage:** Unlike MP3, CAF (with PCM encoding) has no encoder delay, making loop points exact. For `AVAudioPlayerNode` looping, use:
```swift
audioPlayerNode.scheduleBuffer(buffer, at: nil, options: .loops, completionHandler: nil)
```

**Testing:** Every loop is tested for at least 10 consecutive loops in Audacity before export to catch timing drift or audible clicks.

---

### 6.4 Mixing & Mastering

All audio is **pre-mixed and mastered** before integration. No raw stems or unprocessed SFX.

**Mastering targets:**
- **Music:** Peak at -6 dBFS (headroom for dynamic layering), integrated loudness -18 LUFS (consistent loudness)
- **SFX:** Peak at -3 dBFS (punchy, audible over music), loudness varies by SFX type
- **Ambient:** Peak at -12 dBFS (background layer, never foreground)

**Frequency balance:**
- **Low end (20-200 Hz):** Reserved for bass music layers, war drums, sub-bass drones. SFX use sparingly (only impacts, explosions).
- **Mids (200-4000 Hz):** Primary SFX range. Keep music mids scooped (dip at 800 Hz) to prevent masking SFX.
- **Highs (4000-16000 Hz):** Chimes, crystalline SFX, hi-hats. Music uses sparingly to avoid fatigue.

**Mobile speaker optimization:** All audio tested on iPhone internal speaker at 50% volume. High-frequency content (>12 kHz) rolled off to prevent harshness. Use Audacity's "High Roll-off for Speech" EQ preset as a starting point, then tweak by ear.

---

### 6.5 Volume Controls

Players can adjust three independent volume sliders in the SwiftUI Settings screen:

| Slider | Controls | Default |
|---|---|---|
| **Master Volume** | All audio (global multiplier) | 100% |
| **Music Volume** | Battle music, menu music, evolution ceremony music | 60% |
| **SFX Volume** | Gameplay SFX, UI SFX, event SFX | 80% |

**Rationale for defaults:**
- Music at 60%: Provides ambience without overwhelming SFX.
- SFX at 80%: Clear feedback without being jarring.
- Master at 100%: Player has full control.

**Saved preferences:** Volume settings stored in `UserDefaults` under the keys `"audioPrefMaster"`, `"audioPrefMusic"`, `"audioPrefSFX"` as `Float` values. Loaded in `AudioManager.shared.loadPreferences()` on app launch (called from `AppDelegate.application(_:didFinishLaunchingWithOptions:)`), applied to all active `AVAudioPlayerNode` and `AVAudioPlayer` instances before any sound plays.

---

### 6.6 Performance Constraints

| Metric | Target | Rationale |
|---|---|---|
| **Max simultaneous channels** | 16 (software limit) | Prevents CPU overload on iPhone 12 and older devices. |
| **SFX latency (trigger to playback)** | <20ms | AVAudioEngine with preloaded CAF buffers achieves <5ms; SKAction.playSoundFileNamed achieves <20ms. |
| **Music layer crossfade time** | 0.5-1.0 seconds | Smooth transitions between intensity/instability states. Implemented by linear ramp on AVAudioPlayerNode.volume. |
| **Memory footprint (all SFX loaded)** | <8 MB uncompressed in RAM | 1.3 MB of CAF SFX expands to ~3 MB uncompressed. Well within iOS 17 limits on all targets. |

**Streaming vs. preloading:**
- **SFX:** All 59 SFX files preloaded into `AVAudioPCMBuffer` objects on app launch. Stored in a `[String: AVAudioPCMBuffer]` dictionary keyed by filename (without extension). Total ~3 MB in RAM.
- **Music stems (battle):** Loaded as `AVAudioPCMBuffer` when `BattleScene` is first presented (`sceneDidLoad()`), freed when the battle ends (`sceneDidUnload()`).
- **Menu music and shop ambient:** Loaded via `AVAudioPlayer(contentsOf:)` on screen appear, set `numberOfLoops = -1`, call `prepareToPlay()` immediately.
- **Evolution Ceremony:** Loaded via `AVAudioPlayer` when the evolution view appears, unloaded (set to `nil`) in `onDisappear`.

---

## 7. Swift / iOS Implementation

This section is the blueprint Claude Code will use to implement audio. No manual engineering decisions are needed.

### 7.1 AVAudioSession Configuration

Configure the audio session once at app launch in `AppDelegate.swift` before any audio plays:

```swift
import AVFoundation

func configureAudioSession() {
    do {
        let session = AVAudioSession.sharedInstance()
        // mixWithOthers allows music app audio to continue in background;
        // for a game, we want exclusive audio, so we use .ambient or .soloAmbient.
        // .playback ensures audio plays even when the iOS silent switch is engaged.
        try session.setCategory(.playback, mode: .default, options: [])
        try session.setActive(true)
    } catch {
        print("AudioSession configuration failed: \(error)")
    }
}
```

Call `configureAudioSession()` in `application(_:didFinishLaunchingWithOptions:)`.

The `.playback` category ensures audio plays when the device's silent/mute switch is engaged — critical for a game where all gameplay feedback is audio-driven.

---

### 7.2 AudioManager Class

Create `Sources/Audio/AudioManager.swift`. Claude Code implements this file using the interface below.

```swift
// Sources/Audio/AudioManager.swift
import AVFoundation
import SpriteKit

// MARK: - Types

enum FactionId: String {
    case ironwright, fey, demonic
}

struct AudioPrefs {
    var master: Float = 1.0
    var music: Float  = 0.6
    var sfx: Float    = 0.8
}

// MARK: - AudioManager

final class AudioManager {

    static let shared = AudioManager()
    private init() {}

    // MARK: - Properties

    private var prefs = AudioPrefs()

    // AVAudioEngine for adaptive battle music
    private let engine = AVAudioEngine()
    private var battleNodes: [String: AVAudioPlayerNode] = [:]
    private var battleBuffers: [String: AVAudioPCMBuffer] = [:]
    private var intensityBaseVolume: Float = 1.0
    private var currentIntensityVolume: Float = 0.2
    private var currentInstabilityWeight: Float = 0.0

    // AVAudioPlayer for simple non-adaptive music
    private var menuMusicPlayer: AVAudioPlayer?
    private var shopMusicPlayer: AVAudioPlayer?
    private var evolutionPlayer: AVAudioPlayer?

    // SFX preloaded buffers
    private var sfxBuffers: [String: AVAudioPCMBuffer] = [:]
    private var sfxNodes: [AVAudioPlayerNode] = [] // pool of 8 reusable nodes
    private var activeChannels: Set<String> = []

    // MARK: - Initialization

    /// Call once on app launch, before any screen renders.
    func initialize() {
        loadPreferences()
        preloadAllSFX()
        setupSFXNodePool()
        setupEngineForMenu()
        registerForInterruptions()
    }

    // MARK: - Preferences

    func loadPreferences() {
        let defaults = UserDefaults.standard
        prefs.master = defaults.float(forKey: "audioPrefMaster").ifZero(1.0)
        prefs.music  = defaults.float(forKey: "audioPrefMusic").ifZero(0.6)
        prefs.sfx    = defaults.float(forKey: "audioPrefSFX").ifZero(0.8)
    }

    func savePreferences(_ newPrefs: AudioPrefs) {
        prefs = newPrefs
        UserDefaults.standard.set(prefs.master, forKey: "audioPrefMaster")
        UserDefaults.standard.set(prefs.music,  forKey: "audioPrefMusic")
        UserDefaults.standard.set(prefs.sfx,    forKey: "audioPrefSFX")
        applyVolumesToAllActivePlayers()
    }

    // MARK: - Menu Music (AVAudioPlayer)

    func playMainMenuMusic() {
        guard let url = Bundle.main.url(forResource: "MUS_MainMenu_PlanesOfChaos", withExtension: "caf") else { return }
        menuMusicPlayer = try? AVAudioPlayer(contentsOf: url)
        menuMusicPlayer?.numberOfLoops = -1
        menuMusicPlayer?.volume = prefs.master * prefs.music
        menuMusicPlayer?.prepareToPlay()
        menuMusicPlayer?.play()
    }

    func stopMainMenuMusic(fadeDuration: TimeInterval = 1.0) {
        menuMusicPlayer?.setVolume(0, fadeDuration: fadeDuration)
        DispatchQueue.main.asyncAfter(deadline: .now() + fadeDuration) { [weak self] in
            self?.menuMusicPlayer?.stop()
            self?.menuMusicPlayer = nil
        }
    }

    // MARK: - Shop Music (AVAudioPlayer)

    func playShopMusic() {
        guard let url = Bundle.main.url(forResource: "MUS_Shop_Ambient", withExtension: "m4a") else { return }
        shopMusicPlayer = try? AVAudioPlayer(contentsOf: url)
        shopMusicPlayer?.numberOfLoops = -1
        shopMusicPlayer?.volume = prefs.master * prefs.music
        shopMusicPlayer?.prepareToPlay()
        shopMusicPlayer?.play()
    }

    func stopShopMusic() {
        shopMusicPlayer?.stop()
        shopMusicPlayer = nil
    }

    // MARK: - Battle Music (AVAudioEngine)

    /// Load 4 active stems for the given matchup into AVAudioEngine nodes.
    /// Call when BattleScene loads.
    func startBattleMusic(playerFaction: FactionId, opponentFaction: FactionId) {
        stopMainMenuMusic()
        let stemNames = [
            "MUS_Battle_Foundation",
            "MUS_Battle_\(playerFaction.rawValue.capitalized)_FactionLayer",
            "MUS_Battle_\(opponentFaction.rawValue.capitalized)_FactionLayer",
            "MUS_Battle_Intensity_Order",
            "MUS_Battle_Intensity_Chaos"
        ]
        engine.stop()
        battleNodes.removeAll()
        battleBuffers.removeAll()

        for name in stemNames {
            guard let url = Bundle.main.url(forResource: name, withExtension: "caf"),
                  let file = try? AVAudioFile(forReading: url),
                  let buffer = AVAudioPCMBuffer(pcmFormat: file.processingFormat,
                                                frameCapacity: AVAudioFrameCount(file.length)),
                  (try? file.read(into: buffer)) != nil
            else { continue }

            let node = AVAudioPlayerNode()
            engine.attach(node)
            engine.connect(node, to: engine.mainMixerNode, format: buffer.format)
            battleNodes[name] = node
            battleBuffers[name] = buffer
        }

        do { try engine.start() } catch { print("AVAudioEngine start failed: \(error)") }

        for (name, node) in battleNodes {
            guard let buffer = battleBuffers[name] else { continue }
            node.scheduleBuffer(buffer, at: nil, options: .loops, completionHandler: nil)
            node.volume = defaultVolume(for: name)
            node.play()
        }
    }

    func stopBattleMusic() {
        for (_, node) in battleNodes { node.stop() }
        engine.stop()
        battleNodes.removeAll()
        battleBuffers.removeAll()
    }

    // MARK: - Adaptive Music Controls

    /// Call whenever total creature count changes (0–10+).
    func setBoardIntensity(_ totalCreatures: Int) {
        currentIntensityVolume = min(1.0, Float(totalCreatures) / 10.0)
        updateIntensityNodeVolumes()
    }

    /// Call whenever player instability changes (1–20).
    func setInstabilityWeight(_ instability: Int) {
        currentInstabilityWeight = Float(instability - 1) / 19.0
        updateIntensityNodeVolumes()
    }

    private func updateIntensityNodeVolumes() {
        let base = intensityBaseVolume * currentIntensityVolume * prefs.music * prefs.master
        let orderKey = "MUS_Battle_Intensity_Order"
        let chaosKey = "MUS_Battle_Intensity_Chaos"
        battleNodes[orderKey]?.volume = base * (1.0 - currentInstabilityWeight)
        battleNodes[chaosKey]?.volume = base * currentInstabilityWeight
    }

    // MARK: - Combat Kick

    /// Fire the faction-specific percussion hit when attackers are declared.
    /// Called from BattleScene via SKAction, not directly from this manager.
    func combatKickFilename(for faction: FactionId) -> String {
        switch faction {
        case .ironwright: return "SFX_CombatKick_Ironwright"
        case .fey:        return "SFX_CombatKick_Fey"
        case .demonic:    return "SFX_CombatKick_Demonic"
        }
    }

    /// Temporarily spike the intensity layer volume +20% during combat resolution.
    func spikeCombatIntensity() {
        let spike: Float = 0.2
        let orderKey = "MUS_Battle_Intensity_Order"
        let chaosKey = "MUS_Battle_Intensity_Chaos"
        battleNodes[orderKey]?.volume += spike
        battleNodes[chaosKey]?.volume += spike
        DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) { [weak self] in
            self?.updateIntensityNodeVolumes() // restore to baseline
        }
    }

    // MARK: - Evolution Ceremony (AVAudioPlayer)

    func preloadEvolutionAudio() {
        guard let url = Bundle.main.url(forResource: "MUS_Evolution_Transformation", withExtension: "caf") else { return }
        evolutionPlayer = try? AVAudioPlayer(contentsOf: url)
        evolutionPlayer?.prepareToPlay()
    }

    func playEvolutionCeremony(faction: FactionId, outcomeIsOrder: Bool, onPhaseChange: @escaping (Int) -> Void) {
        stopMainMenuMusic()
        stopBattleMusic()
        evolutionPlayer?.volume = prefs.master * prefs.music
        evolutionPlayer?.play()
        onPhaseChange(1)
        DispatchQueue.main.asyncAfter(deadline: .now() + 20) { onPhaseChange(2) }
        DispatchQueue.main.asyncAfter(deadline: .now() + 40) { onPhaseChange(3) }

        // Play faction accent SFX at phase 2 (shard crack)
        DispatchQueue.main.asyncAfter(deadline: .now() + 20) { [weak self] in
            self?.playSFX("SFX_Evolution_ShardCrack", priority: 0)
        }
        // Play order or chaos accent at reveal
        let accentKey = outcomeIsOrder ? "SFX_Evolution_OrderAccent" : "SFX_Evolution_ChaosAccent"
        DispatchQueue.main.asyncAfter(deadline: .now() + 40) { [weak self] in
            self?.playSFX(accentKey, priority: 0)
        }
    }

    func skipEvolutionCeremony() {
        evolutionPlayer?.setVolume(0, fadeDuration: 2.0)
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { [weak self] in
            self?.evolutionPlayer?.stop()
        }
    }

    func unloadEvolutionAudio() {
        evolutionPlayer?.stop()
        evolutionPlayer = nil
    }

    // MARK: - SFX

    /// Play any SFX by filename key (without extension).
    /// Priority: 0 = always plays (P0 critical), 3/4 = dropped if channels full.
    func playSFX(_ key: String, priority: Int = 1) {
        guard priority == 0 || activeChannels.count < 8 else { return }
        guard let buffer = sfxBuffers[key] else { return }

        // Duck music on P0 SFX
        if priority == 0 { duckMusic() }

        let node = availableSFXNode()
        activeChannels.insert(key)
        node.volume = prefs.master * prefs.sfx
        node.scheduleBuffer(buffer, at: nil, options: [], completionHandler: { [weak self] in
            DispatchQueue.main.async { self?.activeChannels.remove(key) }
        })
        node.play()
    }

    // Convenience wrappers
    func playCardPlay(faction: FactionId, isSpell: Bool = false) {
        let key = isSpell ? "SFX_Battle_CardPlay_Spell" : "SFX_Battle_CardPlay_\(faction.rawValue.capitalized)"
        playSFX(key, priority: 1)
    }
    func playCreatureAttack(faction: FactionId) { playSFX("SFX_Battle_CreatureAttack_\(faction.rawValue.capitalized)", priority: 1) }
    func playCreatureDeath(faction: FactionId)  { playSFX("SFX_Battle_CreatureDeath_\(faction.rawValue.capitalized)", priority: 0) }
    func playChaosRollTumble()                  { playSFX("SFX_ChaosRoll_D20Tumble", priority: 0) }
    func playRollResult(_ result: String)        { playSFX("SFX_ChaosRoll_\(result)", priority: 0) } // "OrderResult", "ChaosResult", "Nothing"
    func playEventSFX(_ eventId: String)         { playSFX("SFX_Event_\(eventId)", priority: 0) }    // e.g. "O1_MendingLight"
    func playKeywordSFX(_ keyword: String)       { playSFX("SFX_Keyword_\(keyword)", priority: 1) }  // e.g. "ShieldBreak"
    func playUITap(isPrimary: Bool = false)      { playSFX(isPrimary ? "SFX_UI_ButtonTapPrimary" : "SFX_UI_ButtonTap", priority: 3) }

    // MARK: - Private Helpers

    private func preloadAllSFX() {
        // All 59 SFX files: load each into an AVAudioPCMBuffer for zero-latency playback.
        // This is a static list — Swift bundler requires static filenames here.
        let sfxFilenames: [String] = [
            "SFX_Battle_CardPlay_Ironwright", "SFX_Battle_CardPlay_Fey", "SFX_Battle_CardPlay_Demonic",
            "SFX_Battle_CardPlay_Spell", "SFX_Battle_CardDraw", "SFX_Battle_DeckShuffle",
            "SFX_Battle_ManaGain", "SFX_Battle_ManaSpend",
            "SFX_Battle_CreatureAttack_Ironwright", "SFX_Battle_CreatureAttack_Fey", "SFX_Battle_CreatureAttack_Demonic",
            "SFX_Battle_CreatureHit",
            "SFX_Battle_CreatureDeath_Ironwright", "SFX_Battle_CreatureDeath_Fey", "SFX_Battle_CreatureDeath_Demonic",
            "SFX_Battle_AvatarDamage", "SFX_Battle_Heal", "SFX_Battle_TurnTransition",
            "SFX_Battle_TimerWarning", "SFX_Battle_TurnAutoEnd", "SFX_Battle_Surrender",
            "SFX_Keyword_ShieldBreak", "SFX_Keyword_Lifesteal", "SFX_Keyword_FlyingSwoop",
            "SFX_Keyword_ReachBlock", "SFX_Keyword_Deathtouch", "SFX_Keyword_TauntLockOn", "SFX_Keyword_Piercing",
            "SFX_ChaosRoll_D20Tumble", "SFX_ChaosRoll_OrderResult", "SFX_ChaosRoll_ChaosResult",
            "SFX_ChaosRoll_Nothing", "SFX_ChaosRoll_InstabilityUpdate",
            "SFX_Event_O1_MendingLight", "SFX_Event_O2_PlanarWard", "SFX_Event_O3_SteadyGrowth",
            "SFX_Event_O4_Clarity", "SFX_Event_O5_Fortify", "SFX_Event_O6_Sanctuary",
            "SFX_Event_O7_Bulwark", "SFX_Event_O8_Harmonize",
            "SFX_Event_C1_Surge", "SFX_Event_C2_Wildfire", "SFX_Event_C3_Upheaval",
            "SFX_Event_C4_Frenzy", "SFX_Event_C5_RiftBolt", "SFX_Event_C6_ChaosSiphon",
            "SFX_Event_C7_Maelstrom", "SFX_Event_C8_Overcharge",
            "SFX_Evolution_EnergyBuildup", "SFX_Evolution_ShardCrack", "SFX_Evolution_TransformWhoosh",
            "SFX_Evolution_RevealFanfare", "SFX_Evolution_OrderAccent", "SFX_Evolution_ChaosAccent",
            "SFX_Evolution_ModifierSelect",
            "SFX_CombatKick_Ironwright", "SFX_CombatKick_Fey", "SFX_CombatKick_Demonic",
            "SFX_UI_ButtonTap", "SFX_UI_ButtonTapPrimary", "SFX_UI_TabSwitch",
            "SFX_UI_CardFlip", "SFX_UI_Scroll", "SFX_UI_DeckSelect",
            "SFX_UI_MissionComplete", "SFX_UI_LevelUp", "SFX_UI_Error", "SFX_UI_Notification"
        ]
        for name in sfxFilenames {
            guard let url = Bundle.main.url(forResource: name, withExtension: "caf"),
                  let file = try? AVAudioFile(forReading: url),
                  let buffer = AVAudioPCMBuffer(pcmFormat: file.processingFormat,
                                                frameCapacity: AVAudioFrameCount(file.length)),
                  (try? file.read(into: buffer)) != nil
            else { continue }
            sfxBuffers[name] = buffer
        }
    }

    private func setupSFXNodePool() {
        for _ in 0..<8 {
            let node = AVAudioPlayerNode()
            engine.attach(node)
            engine.connect(node, to: engine.mainMixerNode, format: nil)
            sfxNodes.append(node)
        }
        do { try engine.start() } catch { print("AVAudioEngine SFX pool start failed: \(error)") }
    }

    private func setupEngineForMenu() {
        // Engine starts once in setupSFXNodePool; no additional setup needed for menu.
    }

    private func availableSFXNode() -> AVAudioPlayerNode {
        // Return first non-playing node, or the last one (evict lowest priority)
        return sfxNodes.first(where: { !$0.isPlaying }) ?? sfxNodes.last!
    }

    private func duckMusic(duration: TimeInterval = 1.2) {
        let targetVolume = prefs.master * prefs.music * 0.6
        menuMusicPlayer?.setVolume(targetVolume, fadeDuration: 0.1)
        shopMusicPlayer?.setVolume(targetVolume, fadeDuration: 0.1)
        for (_, node) in battleNodes { node.volume *= 0.6 }
        DispatchQueue.main.asyncAfter(deadline: .now() + duration) { [weak self] in
            self?.applyVolumesToAllActivePlayers()
        }
    }

    private func applyVolumesToAllActivePlayers() {
        let musicVol = prefs.master * prefs.music
        menuMusicPlayer?.volume = musicVol
        shopMusicPlayer?.volume = musicVol
        evolutionPlayer?.volume = musicVol
        updateIntensityNodeVolumes()
        for node in sfxNodes { node.volume = prefs.master * prefs.sfx }
    }

    private func defaultVolume(for stemName: String) -> Float {
        // Intensity stems start at 0 volume; they are controlled by setBoardIntensity/setInstabilityWeight
        if stemName.contains("Intensity") { return 0.0 }
        return prefs.master * prefs.music
    }

    private func registerForInterruptions() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleInterruption(_:)),
            name: AVAudioSession.interruptionNotification,
            object: AVAudioSession.sharedInstance()
        )
    }

    @objc private func handleInterruption(_ notification: Notification) {
        guard let info = notification.userInfo,
              let typeValue = info[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeValue) else { return }
        switch type {
        case .began:
            menuMusicPlayer?.pause()
            shopMusicPlayer?.pause()
            evolutionPlayer?.pause()
            engine.pause()
        case .ended:
            guard let optionsValue = info[AVAudioSessionInterruptionOptionKey] as? UInt else { return }
            let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
            if options.contains(.shouldResume) {
                menuMusicPlayer?.play()
                shopMusicPlayer?.play()
                evolutionPlayer?.play()
                try? engine.start()
            }
        @unknown default: break
        }
    }
}

// MARK: - Float helper
private extension Float {
    func ifZero(_ fallback: Float) -> Float { self == 0 ? fallback : self }
}
```

---

### 7.3 SpriteKit Integration (BattleScene)

SFX that fire during battle are triggered directly from `BattleScene` (a `SKScene` subclass) using `SKAction.playSoundFileNamed`. This is the lowest-latency path for in-scene SFX on iOS.

```swift
// Inside BattleScene.swift

// Card played by player
func playCardPlaySFX(faction: FactionId) {
    let filename: String
    switch faction {
    case .ironwright: filename = "SFX_Battle_CardPlay_Ironwright.caf"
    case .fey:        filename = "SFX_Battle_CardPlay_Fey.caf"
    case .demonic:    filename = "SFX_Battle_CardPlay_Demonic.caf"
    }
    run(SKAction.playSoundFileNamed(filename, waitForCompletion: false))
}

// Chaos roll sequence: tumble sound, then result sound
func playChaosRollSequence(result: ChaosRollResult) {
    let tumble = SKAction.playSoundFileNamed("SFX_ChaosRoll_D20Tumble.caf", waitForCompletion: true)
    let resultFilename: String
    switch result {
    case .order:   resultFilename = "SFX_ChaosRoll_OrderResult.caf"
    case .chaos:   resultFilename = "SFX_ChaosRoll_ChaosResult.caf"
    case .nothing: resultFilename = "SFX_ChaosRoll_Nothing.caf"
    }
    let resultSound = SKAction.playSoundFileNamed(resultFilename, waitForCompletion: false)
    run(SKAction.sequence([tumble, resultSound]))
}

// Combat kick when attackers declared
func playAttackersDeclaredSFX(attackerFaction: FactionId) {
    let filename = AudioManager.shared.combatKickFilename(for: attackerFaction) + ".caf"
    run(SKAction.playSoundFileNamed(filename, waitForCompletion: false))
    AudioManager.shared.spikeCombatIntensity()
}

// Event SFX (e.g., O1_MendingLight)
func playEventSFX(eventId: String) {
    let filename = "SFX_Event_\(eventId).caf"
    run(SKAction.playSoundFileNamed(filename, waitForCompletion: false))
}
```

**Note:** `SKAction.playSoundFileNamed` requires the file to be in the main bundle root (not nested in a folder group that alters the bundle path). Verify by calling `Bundle.main.url(forResource: "SFX_Battle_CardPlay_Ironwright", withExtension: "caf")` — if it returns `nil`, the file is not in the bundle correctly.

---

### 7.4 SwiftUI View Integration

**HomeView.swift (main menu):**
```swift
.onAppear { AudioManager.shared.playMainMenuMusic() }
```

**BattleView.swift (wraps BattleScene):**
```swift
.onAppear {
    AudioManager.shared.startBattleMusic(playerFaction: playerFaction, opponentFaction: opponentFaction)
}
.onDisappear {
    AudioManager.shared.stopBattleMusic()
}
.onChange(of: viewModel.totalCreatures) { count in
    AudioManager.shared.setBoardIntensity(count)
}
.onChange(of: viewModel.playerInstability) { instability in
    AudioManager.shared.setInstabilityWeight(instability)
}
```

**EvolutionView.swift:**
```swift
.onAppear { AudioManager.shared.preloadEvolutionAudio() }
.onDisappear { AudioManager.shared.unloadEvolutionAudio() }

Button("Begin Evolution") {
    AudioManager.shared.playEvolutionCeremony(
        faction: card.faction,
        outcomeIsOrder: evolutionResult.isOrder,
        onPhaseChange: { phase in viewModel.currentPhase = phase }
    )
}

Button("Skip") {
    AudioManager.shared.skipEvolutionCeremony()
}
```

**SettingsView.swift:**
```swift
@State private var prefs = AudioManager.shared.prefs

Slider(value: $prefs.master, in: 0...1)
    .onChange(of: prefs.master) { _ in AudioManager.shared.savePreferences(prefs) }

Slider(value: $prefs.music, in: 0...1)
    .onChange(of: prefs.music) { _ in AudioManager.shared.savePreferences(prefs) }

Slider(value: $prefs.sfx, in: 0...1)
    .onChange(of: prefs.sfx) { _ in AudioManager.shared.savePreferences(prefs) }
```

**CollectionView.swift / ShopView.swift:**
```swift
.onAppear { AudioManager.shared.stopMainMenuMusic(); AudioManager.shared.playShopMusic() }
.onDisappear { AudioManager.shared.stopShopMusic(); AudioManager.shared.playMainMenuMusic() }
```

---

## 8. Audio Asset Sourcing (No Sound Designer Required)

This section tells the owner exactly where to get every audio asset for launch. Total estimated cost: **$0** (using free tools and free tiers). The owner's time investment is approximately 4-6 hours to generate, trim, and convert all assets.

The $300 total project budget is not consumed by audio — all tools listed here are free or have free tiers sufficient for a one-time launch generation. No subscriptions are required after launch.

### 8.1 Music — Suno AI

**What it is:** AI music generation. Type a text prompt, get a full audio track back in seconds.

**URL:** https://suno.com

**Pricing:**
- **Free tier:** 50 credits/day (~10 tracks/day). Sufficient to generate all 9 music tracks needed at launch if done over 2-3 days.
- **Pro plan:** $10/month for 2,500 credits/month. Required for commercial use (App Store publishing).
- **Commercial license:** Included only in paid plans. The owner must upgrade to Pro before generating any music intended for the published app. Cancel after generating all launch assets (one month, $10 total).

**How to use:**
1. Sign up at suno.com.
2. Upgrade to Pro ($10/month) before generating publishable music.
3. Use "Custom Mode" for each track. Set the style tags and description from the table below.
4. Generate 3-5 variations per track and pick the best one.
5. Download as MP3 (Suno exports MP3).
6. Convert to CAF using Terminal (free, built into macOS):
   ```bash
   afconvert -f caff -d LEI16 MUS_MainMenu_PlanesOfChaos.mp3 MUS_MainMenu_PlanesOfChaos.caf
   ```
7. Open in Audacity to trim to a clean loop length (count bars at the given BPM).

**Example Suno prompts per track:**

| Track | Suno Style Tags | Description |
|---|---|---|
| Main Menu | `dark orchestral, electronic, epic, mysterious, cinematic` | `Planes of Chaos theme, 75 BPM, D minor, hybrid orchestral and electronic, strings and distorted synths, 2.5 minutes, loopable, no vocals, tension and release` |
| Battle Foundation | `minimal, cinematic, bass, percussion, dark ambient` | `Battle foundation layer, 95 BPM, bass drone and minimal kick drum, faction neutral, 2 minutes, loopable` |
| Ironwright Faction Layer | `steampunk, brass, industrial, mechanical, dark fantasy` | `Steampunk battle music, 95 BPM, brass melody with clockwork ticking, anvil accents, industrial percussion, 2 minutes, loopable, no vocals` |
| Fey Faction Layer | `celtic, harp, mystical, orchestral, nature, ethereal` | `Fey Courts battle music, 95 BPM feel in 6/8, harp counter-melody, string pads, whispered choir, 2 minutes, loopable` |
| Demonic Faction Layer | `dark, war drums, choral, brutal, epic, Phrygian` | `Demonic Kingdoms battle music, 95 BPM, war drums and taiko, guttural throat singing, low brass, 2 minutes, loopable` |
| Intensity Order | `orchestral, tense, percussion, cinematic, rising` | `Battle intensity layer Order version, 95 BPM, clean percussion and consonant strings, building but structured, 2 minutes, loopable` |
| Intensity Chaos | `distorted, aggressive, atonal, industrial, chaotic` | `Battle intensity layer Chaos version, 95 BPM, distorted percussion, tremolo strings, atonal stabs, dissonant, 2 minutes, loopable` |
| Evolution Ceremony | `orchestral, epic, transformation, choir, fantasy, dramatic` | `Evolution ritual music, slow build 0-20 seconds then dramatic 20-40 seconds then triumphant 40-70 seconds, no loop, 70 seconds total, choir swell, orchestral hit at end` |
| Shop Ambient | `piano, ambient, calm, melancholic, soft, loopable` | `Shop/collection background music, 60 BPM, solo piano with soft strings, calm and contemplative, 3 minutes, loopable, no drums` |

---

### 8.2 SFX — ElevenLabs Sound Effects + Freesound.org

**Option A: ElevenLabs Sound Effects (AI-generated)**

**URL:** https://elevenlabs.io/sound-effects

**Pricing:**
- **Free tier:** Sufficient for generating all 62 SFX files in a single session. No subscription needed for one-time batch generation.
- **Starter plan:** $5/month if free tier quota is exhausted.
- **Commercial use:** Included in all tiers for sound effects.

**How to use:**
1. Go to elevenlabs.io/sound-effects.
2. Type a text description of the sound.
3. Click Generate. Download as MP3.
4. Convert to CAF: `afconvert -f caff -d LEI16 input.mp3 output.caf`

**Example descriptions for key SFX:**

| SFX | ElevenLabs Description |
|---|---|
| D20 Tumble | `"Large polyhedral dice tumbling on a hard surface, plastic and bone texture, 1.5 seconds, building anticipation"` |
| Order Roll Result | `"Harmonious major chord chime, crystalline and resonant, uplifting, single strike with long reverb tail"` |
| Chaos Roll Result | `"Dissonant crash, tritone interval, distorted percussion hit, tense and unsettling"` |
| Shield Break | `"Glass shield shattering, crystalline cascade of high-pitched fragments, sharp impact at start"` |
| Shard Crack | `"Large crystal shard cracking and exploding, multiple glass layers, magical energy release"` |
| Upheaval | `"Board-wide explosion, deep bass rumble, debris scatter, dust and stone impact, 1 second"` |
| Creature Death (Ironwright) | `"Metal armor collapsing, steam venting, gear grinding to a stop, industrial machine shutdown"` |
| Creature Death (Fey) | `"Harp chord fading, wind sigh, leaves rustling and dissipating, gentle organic death"` |
| Creature Death (Demonic) | `"Bone shattering, obsidian breaking, dark chant fading, hellfire extinguishing"` |

**Option B: Freesound.org (Human-recorded, royalty-free)**

**URL:** https://freesound.org

**Pricing:** Free. Filter to "CC0" (public domain) to avoid attribution requirements — thousands of CC0 SFX available.

**Best categories to search:**
- `dice rolling` — D20 tumble
- `metal impact` — Ironwright attacks and deaths
- `glass breaking` — Shield break, shard crack
- `wood hit`, `forest ambience` — Fey SFX
- `explosion`, `thunder` — Chaos events
- `fire crackling` — Demonic ambient texture
- `UI click`, `button tap`, `notification chime` — UI SFX

**Workflow:** Download WAV files, import into Audacity, normalize to -3 dBFS peak, trim to correct length, export as WAV, then convert to CAF using `afconvert`.

---

### 8.3 Audacity (Free Audio Editor)

**URL:** https://www.audacityteam.org

**Pricing:** Free, open source. Available for macOS.

**Required uses:**
- Trim downloaded tracks to exact loop points (zoom in, snap to zero crossings)
- Normalize loudness: Effect > Normalize > -3 dBFS peak for SFX, -6 dBFS for music
- Apply gentle high-frequency roll-off: Effect > EQ and Filters > Low Pass Filter, 12 kHz cutoff, 48 dB/octave roll-off for mobile speaker friendliness
- Test loops: select the region, enable Transport > Loop Play, listen for at least 10 cycles
- Export as WAV (not MP3 from Audacity — convert to CAF separately using `afconvert`)

---

### 8.4 afconvert (Free, Built into macOS)

**What it is:** Apple's command-line audio format converter. Ships with macOS — no download needed.

**Path:** `/usr/bin/afconvert` (already on every Mac)

**Common conversions:**
```bash
# MP3 or WAV to CAF lossless (for SFX and music stems)
afconvert -f caff -d LEI16 input.wav output.caf

# WAV to AAC M4A (for shop ambient only)
afconvert -f m4af -d aac -b 128000 input.wav output.m4a

# Batch convert a whole folder of WAV files to CAF
for f in *.wav; do afconvert -f caff -d LEI16 "$f" "${f%.wav}.caf"; done
```

---

### 8.5 Total Sourcing Cost Estimate

| Tool | Plan | Cost | Usage |
|---|---|---|---|
| Suno AI | Pro (1 month, then cancel) | $10 one-time | Generate all 9 music tracks for App Store publishing |
| ElevenLabs | Free tier | $0 | Generate all 62 SFX (one-time batch) |
| Freesound.org | Free (CC0 filter) | $0 | Supplement any SFX not well served by ElevenLabs |
| Audacity | Free | $0 | Edit, trim, normalize all audio |
| afconvert | Free (built into macOS) | $0 | Convert all audio to CAF/AAC |
| **Total** | | **$10 one-time** | Cancel Suno Pro after generating launch assets |

**Expected time to source all audio:** 4-6 hours total (30 minutes to generate all music tracks in Suno, 2 hours to generate and trim SFX, 1-2 hours to convert files with `afconvert` and organize into the Xcode folder structure).

---

## 9. Implementation Priority

Audio implementation is phased across development milestones to ensure core gameplay is functional first.

### P0 — Minimum Viable Audio (Alpha)

**Must-have for playable alpha. Claude Code builds this first.**

- `AudioManager.swift` skeleton with `initialize()`, `playSFX(_:priority:)`, `loadPreferences()`, `savePreferences(_:)`
- **AVAudioSession** configuration in `AppDelegate`
- **Battle SFX via SKAction:** Card play (universal), creature attack (universal), creature death (universal), damage to avatar, mana gain/spend, turn transition
- **Chaos Roll SFX via SKAction:** D20 tumble (sequential with result), Order result, Chaos result, Nothing result
- **Basic Battle Music:** Single universal battle track (`MUS_Battle_Foundation.caf`) looping via `AVAudioPlayer`. No adaptive system yet.
- **UI SFX:** Button tap (generic), tab switch, error tone
- **Settings screen:** Master/Music/SFX sliders wired to `savePreferences(_:)`

**File count:** ~20 SFX + 1 music track

**Goal:** Game is playable with functional audio feedback. No silence during core loops.

---

### P1 — Faction Identity & Event Audio (Beta)

**Adds emotional depth and faction differentiation.**

- **Full `AVAudioEngine` battle music system:** All 6 stems loaded. `startBattleMusic(playerFaction:opponentFaction:)` working with 4-node stem mixing.
- **`setBoardIntensity(_:)`** and **`setInstabilityWeight(_:)`** implemented.
- **Event SFX:** All 16 events wired via SKAction in `BattleScene`.
- **Keyword SFX:** All 7 keyword triggers wired.
- **Evolution SFX:** All 7 evolution sounds wired to evolution view phases.
- **Faction SFX Variations:** `playCardPlay(faction:)`, `playCreatureAttack(faction:)`, `playCreatureDeath(faction:)` dispatching to the correct faction CAF file.
- **Main Menu Music:** `playMainMenuMusic()` working with `AVAudioPlayer`.
- **`playEvolutionCeremony(faction:outcomeIsOrder:onPhaseChange:)`** implemented.

**File count:** ~50 additional SFX + all music stems

**Goal:** Game has full audio identity. Factions sound distinct. Events are recognizable by sound.

---

### P2 — Adaptive Music & Polish (1.0 Launch)

**Final layer of dynamic responsiveness and immersion.**

- **`spikeCombatIntensity()`** implemented with faction-specific combat kick SFX.
- **Evolution Ceremony:** `skipEvolutionCeremony()` with 2-second `AVAudioPlayer.setVolume(0, fadeDuration: 2.0)` fade.
- **Shop/Collection Music:** `playShopMusic()` wired to Collection and Shop SwiftUI views.
- **Additional UI SFX:** Mission complete, level up, rank up, notification pop, deck selection.
- **Audio Ducking:** `duckMusic()` called from P0 `playSFX` path.
- **Channel limit enforcement:** Active channel count checked before P3/P4 SFX play.
- **Physical device testing:** Test on physical iPhone via TestFlight. Fix any crackling or latency issues.
- **AVAudioSession interruption handling:** Phone calls and Siri pause/resume audio correctly.

**File count:** ~10 additional SFX + 2 music tracks

**Goal:** Audio is fully dynamic, emotionally impactful, and polished.

---

## 10. Audio Testing & QA Checklist

### Functional Testing

- [ ] All SFX trigger at correct moments (no missing audio, no double-triggers)
- [ ] Music loops seamlessly via CAF (no clicks, no gaps) — test by listening for 5+ minutes
- [ ] Volume sliders work independently (Master, Music, SFX) and apply immediately
- [ ] Audio preferences persist across app restarts (`UserDefaults`)
- [ ] Audio priority system drops P3/P4 sounds correctly when 8 SFX channels are full
- [ ] Music ducking fires on P0 SFX (chaos roll result, events, avatar damage)
- [ ] Faction SFX variations play for correct factions
- [ ] `setInstabilityWeight(_:)` crossfades audibly between Order and Chaos intensity stems
- [ ] `setBoardIntensity(_:)` scales intensity layer volume correctly
- [ ] Combat percussion kick fires from SKAction when attackers declared
- [ ] `spikeCombatIntensity()` briefly increases intensity, returns to baseline after 3 seconds
- [ ] Evolution ceremony plays full sequence, phase callbacks fire at correct times (0s, 20s, 40s)
- [ ] Evolution ceremony can be skipped with `setVolume(0, fadeDuration: 2.0)` (not a hard cut)
- [ ] Audio plays when the iOS silent/mute switch is engaged (AVAudioSession `.playback` category)
- [ ] Phone call interruption pauses all audio; audio resumes correctly after call ends
- [ ] `Bundle.main.url(forResource:withExtension:)` resolves correctly for all audio files

### Performance Testing

- [ ] No audio crackling or popping on physical iPhone (test via TestFlight)
- [ ] SFX latency <20ms for gameplay SFX (chaos roll, card play, combat) — test by listening
- [ ] No memory warning when all SFX preloaded at launch (~3 MB uncompressed)
- [ ] No dropped SFX during heavy combat (10 creatures, multiple keyword triggers in one turn)
- [ ] AVAudioEngine battle music does not cause frame rate drops in SpriteKit during battle

### Quality Testing

- [ ] All audio sounds clear on iPhone internal speaker (no harshness, no mud)
- [ ] All audio sounds clear on AirPods
- [ ] Faction music is clearly distinguishable (compare Ironwright vs. Fey vs. Demonic battle music back-to-back)
- [ ] Event SFX are recognizable after 2-3 listens
- [ ] Music does not cause fatigue after 30-minute play session
- [ ] No unintentional harsh frequencies (except intentional Chaos SFX)
- [ ] CAF loop points are glitch-free (verified with 10-cycle loop test in Audacity before conversion)

---

## 11. Future Expansion: New Factions

When a new faction is added (post-launch), the following audio must be produced:

**Per New Faction:**
- 1 battle music faction stem (foundation shared, intensity layers shared) — generate in Suno AI
- 3 SFX variations (creature attack, creature death, card play) — generate in ElevenLabs
- 1 combat kick SFX — generate in ElevenLabs
- ~8-12 faction-specific modifier trigger SFX (if new mechanic has unique triggers)
- 1 evolution accent SFX (faction's evolution flavor) — generate in ElevenLabs

**Estimated effort per faction:** 2-3 hours (sourcing + editing in Audacity + converting with `afconvert`)

**File size per faction:** ~1-2 MB (1 stem + SFX variations as CAF)

**Code changes:** Add the new faction's filenames to the `sfxFilenames` array in `preloadAllSFX()` and add a new `case` to the `FactionId` enum. No structural changes to `AudioManager.swift` needed.

---

## 12. Accessibility Considerations

### Audio Cues for Visually Impaired Players

- **Distinct SFX for every game state change:** Card played, creature died, event fired, turn passed. No silent state changes.
- **Event announcements:** Optional iOS VoiceOver integration — when an event fires, call `UIAccessibility.post(notification: .announcement, argument: eventName)` in Swift.
- **Audio indicators for targeting:** When a spell requires a target, valid targets play `SFX_UI_Notification.caf` when highlighted.

**Not in P0-P2 scope, but design allows for future enhancement.**

### Reduced Audio Mode

For players sensitive to audio intensity:

- **"Minimal Audio" toggle in Settings:** When enabled, stops all music and reduces SFX to critical gameplay feedback only (chaos roll result, damage, death, turn end). This is a `Bool` value stored in `UserDefaults` under the key `"audioMinimalMode"`.
- **Reduced volume on chaos/explosion SFX:** Caps Upheaval, Maelstrom, Rift Bolt, and other loud SFX at 50% of the user's SFX volume setting when Minimal Audio is on.

**Not in P0-P2 scope, but design allows for future enhancement.**

---

## Appendix A: Reference Soundtracks

**Study these for tone, instrumentation, and emotional pacing when writing Suno prompts:**

### For Ironwright Collective:
- Dishonored (Daniel Licht) — Industrial dark fantasy, mechanical ambience
- Frostpunk (Piotr Musiał) — Grim industrial brass, emotional weight
- Machinarium (Tomáš Dvořák) — Whimsical mechanical, quirky clockwork

### For Fey Courts:
- Ori and the Blind Forest (Gareth Coker) — Mystical, emotional, natural beauty
- Hollow Knight (Christopher Larkin) — Ethereal choir work, haunting atmosphere
- Studio Ghibli soundtracks (Joe Hisaishi) — Whimsy + mystery, organic instrumentation

### For Demonic Kingdoms:
- DOOM (2016) (Mick Gordon) — Visceral aggression, distorted brutality
- God of War (2018) (Bear McCreary) — Epic war drums + choir, dark mythology
- Diablo II (Matt Uelmen) — Dark ritualistic ambience, oppressive atmosphere

### For Chaos vs. Order Dynamics:
- Slay the Spire (Clark Aboud) — Adaptive music per act, tension/release
- Balatro (Joyride Fury) — Minimal, focus-friendly, non-intrusive loops
- Marvel Snap (Stephanie Economou) — Fast-paced, mobile-optimized, short loops

---

## Appendix B: Audio Asset Naming Convention

All audio files follow this naming structure for organization and programmatic loading:

### Music:
```
MUS_[Context]_[FactionOrType].[caf|m4a]
```
- Examples:
  - `MUS_Battle_Foundation.caf`
  - `MUS_Battle_Ironwright_FactionLayer.caf`
  - `MUS_Battle_Intensity_Order.caf`
  - `MUS_Battle_Intensity_Chaos.caf`
  - `MUS_MainMenu_PlanesOfChaos.caf`
  - `MUS_Evolution_Transformation.caf`
  - `MUS_Shop_Ambient.m4a`

### SFX:
```
SFX_[Category]_[Action]_[Variation].caf
```
- Examples:
  - `SFX_Battle_CardPlay_Ironwright.caf`
  - `SFX_Battle_CreatureDeath_Fey.caf`
  - `SFX_Keyword_ShieldBreak.caf`
  - `SFX_ChaosRoll_D20Tumble.caf`
  - `SFX_Event_O1_MendingLight.caf`
  - `SFX_Event_C3_Upheaval.caf`
  - `SFX_Evolution_ShardCrack.caf`
  - `SFX_UI_ButtonTap.caf`
  - `SFX_CombatKick_Ironwright.caf`

**Total file count at 1.0 launch:** ~82 audio files (9 music files + 62 SFX + 3 combat kick SFX variants, all as CAF except `MUS_Shop_Ambient.m4a`).

---

## Conclusion

Audio is a core pillar of Chaos Creatures' identity. The Chaos Roll, faction aesthetics, and evolution moments all depend on audio to deliver emotional impact. This design prioritizes:

1. **Faction differentiation** through distinct sonic palettes (brass vs. woodwinds vs. war drums)
2. **Adaptive music** that responds to board state (instability, creature count, combat phase) via `AVAudioEngine`
3. **Memorable event SFX** that players learn to anticipate and recognize
4. **iOS-native audio** using CAF format, `AVAudioEngine` for adaptive mixing, `AVAudioPlayer` for simple playback, and `SKAction.playSoundFileNamed` for in-scene SFX
5. **Scalable production** that allows new factions to be added efficiently
6. **Zero cost for audio assets** — all assets sourced from Suno AI (free tier or $10 for one month of commercial-license Pro), ElevenLabs (free tier), Freesound.org (CC0), Audacity (free), and `afconvert` (built into macOS)

By the 1.0 launch, Chaos Creatures will have a complete, polished, and emotionally resonant audio package generated entirely without a professional audio team and without spending any of the $300 project budget on audio tooling beyond Suno Pro ($10 one-time).

---

**Document Status:** Ready for Claude Code implementation and asset sourcing.

**Implementation Entry Point:** Start with `Sources/Audio/AudioManager.swift` using the interface defined in Section 7.2. Configure `AVAudioSession` in `AppDelegate`. All other integration is wiring calls from SwiftUI views and `BattleScene`.

---

## Revision Log

### Revision 1 (2026-02-16) — Initial production pass

1. Removed "engineer will fill in" assumptions throughout. Every section now has explicit, actionable decisions. The original document deferred implementation details with phrases like "real-time EQ and reverb adjustments" which required an audio engineer to interpret. These have been replaced with concrete React Native/expo-av strategies.

2. Replaced Unity/C# AudioSource references with React Native/Expo (`expo-av`). Section 7 provides a complete `AudioManager.ts` TypeScript interface, installation instructions, `app.json` plugin config, and usage examples for every screen type.

3. Added Section 8: Audio Asset Sourcing with specific AI and royalty-free tools: Suno AI (music), ElevenLabs Sound Effects (SFX), Freesound.org (supplemental SFX), and Audacity (editing).

4. Added Section 7.1: Exact Expo project file structure and Section 7.2: Installation command and `app.json` config.

5. Added Section 7.3: Complete `AudioManager.ts` public interface and Section 7.4: Internal implementation notes for Claude Code.

6. Added Section 7.5: Component-level usage examples for HomeScreen, BattleScreen, EvolutionScreen, and SettingsScreen.

7. Changed file format from OGG/AAC to MP3 throughout (safest universal format for React Native/Expo on iOS).

8. Made volume persistence explicit: `AsyncStorage` with key `"audio_prefs"` and JSON shape `{ master, music, sfx }`.

9. Made evolution skip mechanism concrete: `Sound.setVolumeAsync()` in a `setTimeout` loop.

10. Removed "team composition" estimates. Replaced with sourcing section and $10-15 one-time cost table.

11. Made streaming vs. preloading decision explicit for Expo: SFX preloaded at app launch, music loaded on screen mount.

12. Added `playsInSilentModeIOS: true` requirement to the QA checklist.

---

### Revision 2 (2026-02-16) — iOS native platform rewrite

**Trigger:** Project changed from React Native/Expo to native iOS (Swift + SwiftUI + SpriteKit). All React Native, Expo, and expo-av references replaced with iOS-native equivalents. REVIEW.md issues applicable to this document addressed.

1. **Removed all React Native / Expo / expo-av references.** The entire document previously targeted React Native with the `expo-av` library. All implementation code, file structure, installation instructions, and API references have been replaced with native iOS equivalents. There are zero remaining references to `expo-av`, `AsyncStorage`, TypeScript, `require()`, `app.json`, `useEffect`, or any React Native concept.

2. **Changed file format from MP3 to CAF/AAC throughout.** Music loops and SFX now use CAF (Core Audio Format) — the iOS-native lossless audio container. CAF provides exact sample-aligned loop points without encoder delay, eliminating the gapless-loop hacks required with MP3 on iOS. Long ambient background tracks use AAC at 128 kbps where file size matters more than latency. All filenames in the asset inventory and Appendix B updated from `.mp3` to `.caf` / `.m4a`.

3. **Replaced `expo-av` with `AVAudioEngine` + `AVAudioPlayer` + `SKAction`.** The adaptive battle music system now uses `AVAudioEngine` with separate `AVAudioPlayerNode` instances for each stem — the correct iOS API for real-time multi-track mixing. Simple non-adaptive playback (menu music, shop ambient, evolution ceremony) uses `AVAudioPlayer`. In-scene SFX triggered from `BattleScene` (a `SKScene` subclass) use `SKAction.playSoundFileNamed(_:waitForCompletion:)` for lowest possible latency.

4. **Added `AVAudioSession` configuration section (Section 7.1).** The `.playback` category ensures audio plays when the iOS silent/mute switch is engaged — equivalent to the old `playsInSilentModeIOS: true` expo-av setting. Interruption handling (phone calls, Siri) now uses `AVAudioSession.interruptionNotification`.

5. **Replaced Expo file structure with Xcode project folder group structure (Section 6.2).** The old `assets/audio/` Expo folder has been replaced with a `Resources/Audio/Music/` and `Resources/Audio/SFX/` folder group structure in the Xcode project navigator. Includes instructions on how to add files to the Xcode target and verify they appear in "Copy Bundle Resources".

6. **Added `afconvert` documentation (Section 8.4).** `afconvert` is macOS's built-in command-line audio converter (free, ships with every Mac). The owner uses it to convert WAV/MP3 downloads from Suno and ElevenLabs into CAF format. Exact shell commands provided for single-file and batch conversion.

7. **Replaced `AsyncStorage` with `UserDefaults`.** Volume preferences now stored in `UserDefaults` as `Float` values under keys `"audioPrefMaster"`, `"audioPrefMusic"`, `"audioPrefSFX"`. Equivalent to the old AsyncStorage JSON blob but uses the native iOS persistence API.

8. **Replaced TypeScript `AudioManager.ts` with Swift `AudioManager.swift` (Section 7.2).** The complete Swift class is provided with all public methods matching the original TypeScript interface: `initialize()`, `loadPreferences()`, `savePreferences(_:)`, `playMainMenuMusic()`, `startBattleMusic(playerFaction:opponentFaction:)`, `setBoardIntensity(_:)`, `setInstabilityWeight(_:)`, `fireCombatKick` / `spikeCombatIntensity()`, `playEvolutionCeremony(faction:outcomeIsOrder:onPhaseChange:)`, `skipEvolutionCeremony()`, `playSFX(_:priority:)`, and faction convenience wrappers.

9. **Added SpriteKit integration section (Section 7.3).** Shows `BattleScene` calling `SKAction.playSoundFileNamed` for card play, chaos roll sequence, attackers declared, and event SFX. Includes the important note that files must be in the main bundle root for `SKAction.playSoundFileNamed` to locate them.

10. **Replaced React component usage examples with SwiftUI view integration (Section 7.4).** `useEffect` hooks replaced with `.onAppear` / `.onDisappear` view modifiers and `.onChange(of:)` for reactive board state updates.

11. **Updated sourcing section (Section 8) to reflect $0 budget target.** Total audio sourcing cost is now $10 one-time (Suno Pro for 1 month, then cancel). Revised total summary to state that audio does not consume the $300 project budget. All tools (ElevenLabs free tier, Freesound.org CC0, Audacity, `afconvert`) are free.

12. **Updated battle stem count from 13 to 6.** The previous design had 13 stems (3 factions × 4 layers + 1 foundation). Revised to 6 stems (1 foundation + 3 faction layers + 2 intensity variants — Order and Chaos). This is simpler to implement with `AVAudioEngine`, reduces memory footprint, and is sufficient for all faction matchup combinations.

13. **Increased simultaneous channel limit from 12 to 16.** iOS 17 on iPhone 12+ handles more concurrent audio channels than the previous 12-channel limit set for older React Native targets. Added 2 reserved channels for OS interruptions.

14. **Updated SFX latency target from <50ms to <20ms.** `AVAudioEngine` with preloaded `AVAudioPCMBuffer` objects achieves sub-5ms latency on iOS. `SKAction.playSoundFileNamed` achieves <20ms. The previous <50ms target was the React Native/expo-av limit, not the iOS native limit.

15. **Added combat kick SFX as 3 separate files** (`SFX_CombatKick_Ironwright.caf`, `SFX_CombatKick_Fey.caf`, `SFX_CombatKick_Demonic.caf`) which were previously described in prose but not listed in the file inventory. Total file count updated to 82.

16. **Addressed REVIEW.md WARN-1** (wrong infrastructure stack): Removed all references to "React Native / Flutter / PWA" and "Phaser.js / PixiJS" from the technical constraints section. The document now consistently references Swift + SwiftUI + SpriteKit throughout.

17. **Addressed REVIEW.md WARN-2** (RevenueCat): This document contains no payment references. Payments belong to the monetization doc. No change needed in this doc.

18. **Updated accessibility section** to use `UIAccessibility.post(notification: .announcement, argument:)` instead of the React Native `AccessibilityInfo.announceForAccessibility()` API.
