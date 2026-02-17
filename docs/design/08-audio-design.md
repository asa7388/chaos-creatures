# 08 — Audio Design

This document defines the music, SFX, and adaptive audio systems for Chaos Creatures. Audio is a critical component of player experience, faction identity, and the emotional impact of the Chaos Roll and evolution moments.

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

- **Platform:** iOS mobile (iPhone 11+ target)
- **File format:** OGG Vorbis for music (128 kbps), AAC for SFX (96 kbps)
- **Simultaneous channel limit:** 12 concurrent audio channels maximum (6 SFX + 4 music layers + 2 ambient)
- **File size budget:**
  - Total music: ~15 MB compressed
  - Total SFX: ~8 MB compressed
  - Total ambient: ~2 MB compressed
  - **Total audio package: ~25 MB**
- **Latency:** <50ms for gameplay SFX triggers (chaos roll, card play, combat)
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
- **Key/Mode:** Minor keys with industrial harmonics (think: dystopian steampunk, not bright Victorian)
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

**Implementation:** Loops seamlessly. Plays on Home screen, Collection screen, Deck Builder, Profile, Shop. Stops when battle matchmaking begins.

---

### 3.2 Battle Music — Adaptive System

Battle music is **faction-responsive** and **instability-adaptive**. The system uses layered stems that blend based on the board state.

#### Base Architecture

Each battle track has **4 stems** that play simultaneously, mixed dynamically:

1. **Foundation layer** (always playing): Bass + minimal percussion. Faction-neutral.
2. **Player faction layer**: Adds player's faction instrumentation (brass for Ironwright, woodwinds for Fey, war drums for Demonic).
3. **Opponent faction layer**: Adds opponent's faction instrumentation.
4. **Intensity layer**: Percussion + harmonic tension. Volume scales with board complexity.

**Example — Ironwright (you) vs. Fey Courts (opponent):**
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

This is achieved via real-time EQ and reverb adjustments + crossfading between "Order mix" and "Chaos mix" versions of the same stems.

**Combat Phase Kick:**
- When attackers are declared, a **percussion hit** fires (faction-specific: anvil for Ironwright, war drum for Demonic, frame drum for Fey).
- Intensity layer briefly spikes +20% during combat resolution, returns to baseline after.

#### Track Count

**Launch Content:**
- 3 faction-specific stems (Ironwright, Fey, Demonic) × 4 layers each = 12 stems
- 1 foundation layer (universal) = 1 stem
- **Total: 13 battle music stems** (~8-10 MB compressed)

Each match dynamically combines 4 stems from this pool based on matchup.

**Tempo:** 95 BPM (battle-ready but not frantic). All stems locked to the same BPM for seamless layering.

**Length:** Each stem is a 32-bar loop (~2:00 at 95 BPM). Loops indefinitely.

---

### 3.3 Evolution Ceremony Music

**Function:** The most emotionally impactful moment in the game. This is the player's payoff for 10-100 games of investment. Audio must deliver weight, magic, and triumph.

**Structure (3 phases):**

1. **Energy Buildup (0:00–0:20)**
   - Current card appears. Chaos energy particles gather.
   - **Audio:** Ambient drone (low sub-bass hum), rising synth pad, crackling energy (granular texture), heartbeat-like percussion (slow, building).
   - Player selects prompt modifiers and channeling direction.

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

**Implementation:** Plays over the Evolution Screen. Overrides all other music. Player can skip by tapping (music fades out over 2 seconds, not a hard cut).

---

### 3.4 Shop & Collection Ambient Music

**Function:** Calm background music for browsing cards, building decks, managing collection. Non-intrusive, loops indefinitely.

**Musical Direction:**
- **Instrumentation:** Minimal. Solo piano or harp + soft string pads + subtle ambient texture (wind, distant chimes).
- **Tempo:** 60 BPM (slow, contemplative)
- **Key:** A minor (calm, introspective)
- **Structure:** Simple ABA loop, no dramatic peaks. This is furniture music — it should not demand attention.
- **Length:** 3:00 loop

**Shares the same track for Shop and Collection screens.** The main menu theme is already playing on Home, so this is used for screens where the player is spending longer periods browsing/building.

**Emotional Goal:** Calm, focus-friendly, slightly melancholic (the world is in chaos, but here you're safe to plan).

---

### Music Summary Table

| Context | Track | Tempo | Length | Adaptive? | File Size (est.) |
|---|---|---|---|---|---|
| Main Menu / Home | Planes of Chaos Theme | 75 BPM | 2:30 loop | No | ~2 MB |
| Battle | Faction Stem Layers (×13) | 95 BPM | 2:00 loop each | Yes (dynamic mix) | ~10 MB |
| Evolution Ceremony | Transformation Ritual | Variable | 1:10 (one-shot) | Faction + outcome coloring | ~1.5 MB |
| Shop / Collection | Calm Ambient | 60 BPM | 3:00 loop | No | ~1.5 MB |
| **TOTAL** | | | | | **~15 MB** |

---

## 4. SFX Inventory

All SFX are designed to be **clear, punchy, mobile-friendly** (work on small speakers), and **under 1 second in length** (except ambient loops).

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
| **Name Selection** | UI confirm beep (same as modifier) | — (shared) |

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

**Note:** Faction variations (creature attack, death, card play) are counted as separate files in the total count but share similar design templates.

---

## 5. Adaptive Audio System

The game uses a **dynamic mixing system** that responds to game state in real time. This keeps audio fresh across hundreds of battles and creates a tighter connection between player decisions and audio feedback.

### 5.1 Music Intensity Scaling (Battle)

**Trigger:** Total creature count on both boards (your creatures + opponent's creatures).

**Implementation:**
- Foundation layer: Always at 100% volume (bass + minimal percussion)
- Player faction layer: Always at 100% volume
- Opponent faction layer: Always at 100% volume
- **Intensity layer: Scales 0-100% based on creature count**

**Formula:**
```
intensity_volume = min(100%, (total_creatures / 10) × 100%)
```

| Creatures on Board | Intensity Volume |
|---|---|
| 0-1 | 0-10% (barely audible) |
| 2 | 20% |
| 3 | 30% |
| 5 | 50% (midpoint) |
| 8 | 80% |
| 10 | 100% (full chaos) |

**Feel:** Early turns are calm, strategic. As boards fill, tension builds. A board wipe (Upheaval, combat, etc.) drops intensity instantly — audible release.

---

### 5.2 Instability → Harmonic Tension

**Trigger:** Active player's instability value (recalculated each time creatures enter/leave board).

**Implementation:**
- Two mix presets for all battle music stems: "Order Mix" (clean, consonant, warm reverb) and "Chaos Mix" (dissonant overtones, distortion, tremolo).
- Real-time crossfade between the two based on instability.

**Formula:**
```
chaos_mix_weight = (player_instability - 1) / 19  // Normalized 0.0 to 1.0
order_mix_weight = 1.0 - chaos_mix_weight
```

| Player Instability | Order Mix | Chaos Mix | Musical Feel |
|---|---|---|---|
| 1-5 | 80-100% | 0-20% | Calm, structured, major harmonies |
| 6-10 | 50-70% | 30-50% | Neutral, balanced |
| 11-15 | 30-50% | 50-70% | Tense, building dissonance |
| 16-20 | 0-20% | 80-100% | Chaotic, distorted, aggressive |

**Feel:** A Chaos player with 18 instability hears music that's distorted, tremolo-heavy, dissonant. When two creatures die and instability drops to 12, the music smooths out slightly — audible feedback that the board state shifted.

**Technical:** Achieved via real-time EQ (cut highs for Order, boost harsh mids for Chaos), reverb mix (long tail for Order, short gated for Chaos), and distortion send (0% for Order, up to 30% for Chaos).

---

### 5.3 Combat Phase Percussion Kick

**Trigger:** Attackers are declared (transition from Main Phase to Declare Attackers).

**Implementation:**
- A single **percussion hit** fires, faction-specific to the attacking player's faction:
  - **Ironwright:** Anvil strike (metallic clang)
  - **Fey Courts:** Frame drum hit (organic thud)
  - **Demonic Kingdoms:** War drum (deep bass boom)
- Intensity layer volume spikes +20% for the duration of combat resolution (Phases 6-8), then returns to baseline at End of Turn.

**Feel:** Combat feels punctuated, weighty. The percussion hit is a "now we fight" moment. Music surges during combat, recedes during planning.

---

### 5.4 Audio Priority System

Mobile devices have limited simultaneous audio channels. The game uses a **priority queue** to ensure critical SFX are never dropped.

**Channel Allocation:**
- 6 channels: SFX (gameplay + UI)
- 4 channels: Music layers (battle stems)
- 2 channels: Ambient (evolution ceremony, background loops)

**Priority Tiers (highest to lowest):**

1. **P0 — Critical Gameplay SFX:** Chaos roll result, event SFX, creature death, damage to avatar. Never dropped.
2. **P1 — Important Gameplay SFX:** Card play, creature attack, keyword triggers, mana gain/spend. Dropped only if 6 SFX channels full.
3. **P2 — Music Layers:** Battle music stems, menu music. Volume ducked by 40% when P0 SFX fires.
4. **P3 — UI SFX:** Button taps, tab switches, scrolls. Dropped if SFX channels full.
5. **P4 — Ambient:** Evolution ceremony ambient layers. Stopped if memory pressure.

**Ducking Rules:**
- When a P0 SFX fires (e.g., Chaos Roll result, Upheaval explosion), music ducks to 60% volume for 1 second, then returns.
- When Evolution Ceremony music plays, all other music stops (hard cut, not a duck).

---

## 6. Technical Specifications

### 6.1 File Format & Compression

| Audio Type | Format | Bitrate | Rationale |
|---|---|---|---|
| **Music (loops)** | OGG Vorbis | 128 kbps | Best size/quality balance for looping music on mobile. Seamless loop support. |
| **SFX (short)** | AAC | 96 kbps | Efficient for sub-1-second sounds. iOS native decoding. |
| **Ambient (long loops)** | OGG Vorbis | 96 kbps | Lower bitrate acceptable for background textures. |

**Total file size budget: ~25 MB** (15 MB music + 8 MB SFX + 2 MB ambient). Fits comfortably within mobile storage constraints and allows for fast download/install.

---

### 6.2 Looping & Seamlessness

All looping tracks (battle music stems, menu themes, ambient) must:
- **Loop seamlessly** with zero gap or click at the loop point.
- Use **exact sample-aligned loop points** (trim to whole bars, no partial samples).
- Include a **10ms crossfade** at the loop boundary (baked into the file) to ensure smooth transitions.

**Testing:** Every loop is tested for at least 10 consecutive loops to catch timing drift or audible clicks.

---

### 6.3 Mixing & Mastering

All audio is **pre-mixed and mastered** before integration. No raw stems or unprocessed SFX.

**Mastering targets:**
- **Music:** Peak at -6 dB (headroom for dynamic layering), RMS -18 dB (consistent loudness)
- **SFX:** Peak at -3 dB (punchy, audible over music), RMS varies by SFX type
- **Ambient:** Peak at -12 dB (background layer, never foreground)

**Frequency balance:**
- **Low end (20-200 Hz):** Reserved for bass music layers, war drums, sub-bass drones. SFX use sparingly (only impacts, explosions).
- **Mids (200-4000 Hz):** Primary SFX range. Keep music mids scooped (dip at 800 Hz) to prevent masking SFX.
- **Highs (4000-16000 Hz):** Chimes, crystalline SFX, hi-hats. Music uses sparingly to avoid fatigue.

**Mobile speaker optimization:** All audio tested on iPhone 11 internal speaker at 50% volume. High-frequency content (>12 kHz) rolled off to prevent harshness.

---

### 6.4 Volume Controls

Players can adjust three independent volume sliders in Settings:

| Slider | Controls | Default |
|---|---|---|
| **Master Volume** | All audio (global multiplier) | 100% |
| **Music Volume** | Battle music, menu music, evolution ceremony music | 60% |
| **SFX Volume** | Gameplay SFX, UI SFX, event SFX | 80% |

**Rationale for defaults:**
- Music at 60%: Provides ambience without overwhelming SFX. Players focus on gameplay sounds.
- SFX at 80%: Clear feedback without being jarring.
- Master at 100%: Player has full control.

**Saved preferences:** Volume settings persist across sessions (stored in player profile).

---

### 6.5 Performance Constraints

| Metric | Target | Rationale |
|---|---|---|
| **Max simultaneous channels** | 12 | Prevents CPU overload on older devices (iPhone 11, iPad 8th gen). |
| **SFX latency (trigger to playback)** | <50ms | Ensures audio feels responsive (chaos roll, card play, combat). Anything >100ms feels laggy. |
| **Music layer crossfade time** | 0.5-1.0 seconds | Smooth transitions between intensity/instability states without jarring cuts. |
| **Memory footprint (all audio loaded)** | <40 MB uncompressed in RAM | iOS memory limits. Older devices (2 GB RAM) need headroom. |

**Streaming vs. preloading:**
- **Music:** Streamed from disk (OGG Vorbis supports efficient streaming). Not preloaded to RAM.
- **SFX:** Preloaded to RAM at app launch. Total SFX ~1.3 MB compressed → ~3-4 MB uncompressed (acceptable).
- **Evolution Ceremony:** Preloaded when evolution screen opens, unloaded after.

---

## 7. Implementation Priority

Audio implementation is phased across development milestones to ensure core gameplay is functional first, with polish layers added incrementally.

### P0 — Minimum Viable Audio (Alpha Launch)

**Must-have for playable alpha.**

- **Battle SFX:** Card play, creature attack, creature death, damage to avatar, mana gain/spend, turn transition
- **Chaos Roll SFX:** D20 tumble, Order result, Chaos result, Nothing result
- **Basic Battle Music:** Single universal battle track (no faction layers yet, no adaptive system). Tempo-locked, looping.
- **UI SFX:** Button tap (generic), tab switch, error tone

**Estimated effort:** 2-3 weeks (composer + sound designer)

**File count:** ~20 SFX + 1 music track

**Goal:** Game is playable with functional audio feedback. No silence during core loops.

---

### P1 — Faction Identity & Event Audio (Beta Launch)

**Adds emotional depth and faction differentiation.**

- **Faction-Specific Battle Music:** 3 faction stem sets (Ironwright, Fey, Demonic) × 4 layers = 12 stems. Adaptive layering system (foundation + player faction + opponent faction + intensity).
- **Event SFX:** All 16 events (8 Order + 8 Chaos). Unique SFX per event.
- **Keyword SFX:** Shield break, Lifesteal, Deathtouch, Piercing, Flying, Taunt, Reach.
- **Evolution SFX:** Energy buildup, shard crack, transformation whoosh, reveal fanfare, Order/Chaos accents.
- **Faction SFX Variations:** Creature attack, creature death, card play (3 variations each for Ironwright/Fey/Demonic).
- **Main Menu Music:** Planes of Chaos theme.

**Estimated effort:** 4-5 weeks (composer + sound designer)

**File count:** ~50 additional SFX + 13 music stems + main menu theme

**Goal:** Game has full audio identity. Factions sound distinct. Events are memorable.

---

### P2 — Adaptive Music & Polish (1.0 Launch)

**Final layer of dynamic responsiveness and immersion.**

- **Adaptive Music System:** Instability → harmonic tension crossfading (Order Mix vs. Chaos Mix). Combat phase percussion kick. Intensity scaling tied to creature count.
- **Evolution Ceremony Music:** Full 1:10 transformation ritual track with Order/Chaos outcome variations.
- **Shop/Collection Ambient Music:** Calm background track for browsing.
- **Additional UI SFX:** Mission complete, level up, rank up, notification pop, deck selection.
- **Audio Ducking & Priority System:** P0-P4 priority queue, music ducking on critical SFX.
- **Mobile Optimization:** Final mixing pass for phone speakers, loop point refinement, performance testing on iPhone 11.

**Estimated effort:** 3-4 weeks (composer + sound designer + audio engineer)

**File count:** ~10 additional SFX + evolution ceremony track + shop/collection track

**Goal:** Audio is fully dynamic, emotionally impactful, and polished to premium mobile game standards.

---

### Total Estimated Audio Production Time

- **P0:** 2-3 weeks
- **P1:** 4-5 weeks
- **P2:** 3-4 weeks
- **Total:** 9-12 weeks (2-3 months) for full audio package

**Team composition:**
- 1 composer (music + some ambient SFX)
- 1 sound designer (gameplay SFX, keyword SFX, UI SFX)
- 1 audio engineer (mixing, mastering, implementation, performance testing)

---

## 8. Audio Testing & QA Checklist

### Functional Testing

- [ ] All SFX trigger at correct moments (no missing audio, no double-triggers)
- [ ] Music loops seamlessly (no clicks, no gaps)
- [ ] Volume sliders work independently (Master, Music, SFX)
- [ ] Audio priority system drops low-priority sounds correctly when channels full
- [ ] Music ducking fires on P0 SFX (chaos roll, events, avatar damage)
- [ ] Faction SFX variations play for correct factions (Ironwright hears brass, Fey hears woodwinds, etc.)
- [ ] Adaptive music responds to instability changes (Order Mix ↔ Chaos Mix crossfade)
- [ ] Adaptive music responds to creature count (intensity layer scales)
- [ ] Combat percussion kick fires when attackers declared
- [ ] Evolution ceremony music plays full sequence, can be skipped

### Performance Testing

- [ ] No audio crackling/popping on iPhone 11 (base model)
- [ ] No audio latency >50ms for gameplay SFX (chaos roll, card play, combat)
- [ ] No memory overflow when all audio loaded (target: <40 MB RAM)
- [ ] No dropped SFX during heavy combat (10 creatures, multiple keyword triggers)
- [ ] Music streaming does not cause frame drops during battle

### Quality Testing

- [ ] All audio sounds clear on iPhone internal speaker (no harshness, no mud)
- [ ] All audio sounds clear on AirPods (consumer earbuds test)
- [ ] Faction music is clearly distinguishable (blind test: can player identify faction by audio alone?)
- [ ] Event SFX are recognizable after 2-3 listens (player can anticipate event by sound)
- [ ] Music does not cause fatigue after 30-minute play session
- [ ] No unintentional dissonance or harsh frequencies (except intentional Chaos SFX)

---

## 9. Future Expansion: New Factions

When a new faction is added (post-launch), the following audio must be produced:

**Per New Faction:**
- 4 battle music stems (foundation shared, 1 new faction layer)
- 3 SFX variations (creature attack, creature death, card play)
- ~8-12 faction-specific modifier trigger SFX (if modifiers have unique audio)
- Evolution accent SFX (1 new variant for the faction's evolution flavor)

**Estimated effort per faction:** 1-2 weeks (composer + sound designer)

**File size per faction:** ~1-2 MB (4 stems + SFX variations)

This keeps the audio production pipeline scalable as the game grows.

---

## 10. Accessibility Considerations

### Audio Cues for Visually Impaired Players

While full accessibility is a larger UX effort, audio can support visually impaired players:

- **Distinct SFX for every game state change:** Card played, creature died, event fired, turn passed. No silent state changes.
- **Event announcements:** Optional screen reader integration (iOS VoiceOver) to announce event names when they fire.
- **Audio indicators for targeting:** When a spell requires a target, valid targets play a soft "ping" SFX when highlighted.

**Not in P0-P2 scope, but design allows for future enhancement.**

---

### Reduced Audio Mode (Photosensitivity Parallel)

For players sensitive to audio intensity (misophonia, sensory processing disorders):

- **"Minimal Audio" toggle in Settings:** Disables all music, reduces SFX to critical gameplay feedback only (chaos roll result, damage, death, turn end).
- **Reduced volume on chaos/explosion SFX:** Caps Upheaval, Maelstrom, Rift Bolt, and other loud SFX at 50% max volume.

**Not in P0-P2 scope, but design allows for future enhancement.**

---

## Appendix A: Reference Soundtracks

**Study these for tone, instrumentation, and emotional pacing:**

### For Ironwright Collective:
- *Dishonored* (Daniel Licht) — Industrial dark fantasy, mechanical ambience
- *Frostpunk* (Piotr Musiał) — Grim industrial brass, emotional weight
- *Machinarium* (Tomáš Dvořák) — Whimsical mechanical, quirky clockwork

### For Fey Courts:
- *Ori and the Blind Forest* (Gareth Coker) — Mystical, emotional, natural beauty
- *Hollow Knight* (Christopher Larkin) — Ethereal choir work, haunting atmosphere
- *Studio Ghibli soundtracks* (Joe Hisaishi) — Whimsy + mystery, organic instrumentation

### For Demonic Kingdoms:
- *DOOM (2016)* (Mick Gordon) — Visceral aggression, distorted brutality
- *God of War (2018)* (Bear McCreary) — Epic war drums + choir, dark mythology
- *Diablo II* (Matt Uelmen) — Dark ritualistic ambience, oppressive atmosphere

### For Chaos vs. Order Dynamics:
- *Slay the Spire* (Clark Aboud) — Adaptive music per act, tension/release
- *Balatro* (Joyride Fury) — Minimal, focus-friendly, non-intrusive loops
- *Marvel Snap* (Stephanie Economou) — Fast-paced, mobile-optimized, short loops

---

## Appendix B: Audio Asset Naming Convention

All audio files follow this naming structure for organization and programmatic loading:

### Music:
```
MUS_[Context]_[FactionOrType]_[Layer].ogg
```
- Examples:
  - `MUS_Battle_Foundation.ogg`
  - `MUS_Battle_Ironwright_FactionLayer.ogg`
  - `MUS_Battle_Intensity.ogg`
  - `MUS_MainMenu_PlanesOfChaos.ogg`
  - `MUS_Evolution_Transformation.ogg`
  - `MUS_Shop_Ambient.ogg`

### SFX:
```
SFX_[Category]_[Action]_[Variation].aac
```
- Examples:
  - `SFX_Battle_CardPlay_Ironwright.aac`
  - `SFX_Battle_CreatureDeath_Fey.aac`
  - `SFX_Keyword_ShieldBreak.aac`
  - `SFX_ChaosRoll_D20Tumble.aac`
  - `SFX_Event_O1_MendingLight.aac`
  - `SFX_Event_C3_Upheaval.aac`
  - `SFX_Evolution_ShardCrack.aac`
  - `SFX_UI_ButtonTap_Primary.aac`

### Ambience:
```
AMB_[Context]_[Type].ogg
```
- Examples:
  - `AMB_Evolution_EnergyBuildup.ogg`

**Total file count at 1.0 launch:** ~80-90 audio files (13 music stems + 3 music tracks + 60+ SFX + ambience).

---

## Conclusion

Audio is a core pillar of Chaos Creatures' identity. The Chaos Roll, faction aesthetics, and evolution moments all depend on audio to deliver emotional impact. This design prioritizes:

1. **Faction differentiation** through distinct sonic palettes (brass vs. woodwinds vs. war drums)
2. **Adaptive music** that responds to board state (instability, creature count, combat phase)
3. **Memorable event SFX** that players learn to anticipate and recognize
4. **Mobile optimization** with compressed file sizes, low latency, and clear mixing for phone speakers
5. **Scalable production** that allows new factions to be added efficiently

By the 1.0 launch, Chaos Creatures will have a complete, polished, and emotionally resonant audio package that matches the quality of its AI-generated art and strategic gameplay.

---

**Document Status:** Ready for composer/sound designer handoff and implementation planning.

**Dependencies for Implementation:**
- Battle flow finalized (turn structure, event triggers) → feeds SFX timing
- UI wireframes finalized → feeds UI SFX triggers
- Faction art direction locked → feeds music palette decisions
- Evolution screen flow finalized → feeds evolution ceremony music structure

**Next Steps:**
1. Share this doc with composer and sound designer for feasibility review and cost estimate.
2. Produce P0 audio package (2-3 weeks) for alpha build.
3. Iterate based on playtester feedback (music fatigue, SFX clarity, volume balance).
4. Produce P1 and P2 packages leading into beta and 1.0 launch.
