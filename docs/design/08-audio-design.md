# 08 — Audio Design

This document defines the music, SFX, and adaptive audio systems for Chaos Creatures. It is written for a solo non-engineer owner who will build this app using Claude Code with React Native (Expo). Every section is specific enough that Claude Code can generate working code directly from it. No sound designer, audio engineer, or composer needs to be hired — all assets are sourced from AI-generation tools and royalty-free libraries described in Section 8.

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

- **Platform:** iOS mobile (iPhone 11+ target), built with React Native (Expo SDK 51+)
- **Audio library:** `expo-av` (`Audio` class) for SFX and music playback; `expo-audio` (new unified API, available Expo SDK 52+) as upgrade path
- **File format:** MP3 for music (128 kbps) and SFX (96 kbps) — MP3 is the safest cross-platform format for React Native/Expo and avoids OGG codec issues on iOS
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

**Implementation:** Loops seamlessly. Plays on Home screen, Collection screen, Deck Builder, Profile, Shop. Stops when battle matchmaking begins.

**Sourcing:** Generate using Suno AI (see Section 8). Prompt: `"Dark orchestral card game theme, hybrid orchestral and electronic, strings and distorted synths, mysterious and epic, 75 BPM, 2.5 minutes, loopable, D minor, tension and release structure, no vocals"`.

---

### 3.2 Battle Music — Adaptive System

Battle music is **faction-responsive** and **instability-adaptive**. The system uses layered stems that blend based on board state.

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

This is achieved via volume crossfading between "Order mix" and "Chaos mix" versions of the same stems. All mix logic runs in the React Native audio manager (see Section 7).

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

**Sourcing:** See Section 8. Generate each stem separately in Suno AI with matching BPM. Export as MP3 128 kbps. Trim to a clean 32-bar loop in Audacity (free).

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

**Implementation:** Plays over the Evolution Screen. Overrides all other music. Player can skip by tapping (music fades out over 2 seconds via `Audio.setVolumeAsync()` interpolation in a `setTimeout` loop, not a hard cut).

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
intensity_volume = min(1.0, total_creatures / 10)
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
- Two volume-mix presets for battle music stems: "Order Mix" (clean, full volume) and "Chaos Mix" (doubled-down volume on distortion stems).
- In React Native, this is a real-time crossfade: `AudioManager.setChaosWeight(normalizedInstability)` is called every time instability changes. This adjusts the volume of each `Sound` object without stopping or reloading.

**Formula:**
```typescript
const chaosWeight = (playerInstability - 1) / 19; // 0.0 to 1.0
const orderWeight = 1.0 - chaosWeight;
```

| Player Instability | Order Mix | Chaos Mix | Musical Feel |
|---|---|---|---|
| 1-5 | 80-100% | 0-20% | Calm, structured, major harmonies |
| 6-10 | 50-70% | 30-50% | Neutral, balanced |
| 11-15 | 30-50% | 50-70% | Tense, building dissonance |
| 16-20 | 0-20% | 80-100% | Chaotic, distorted, aggressive |

**Feel:** A Chaos player with 18 instability hears music that's distorted, tremolo-heavy, dissonant. When two creatures die and instability drops to 12, the music smooths out slightly — audible feedback that the board state shifted.

**Technical Note:** The "Order Mix" and "Chaos Mix" are separate audio stems for the intensity layer (two versions of the same loop — one clean, one distorted). The `AudioManager` crossfades between them by adjusting their respective volumes. No real-time DSP processing occurs on device.

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
3. **P2 — Music Layers:** Battle music stems, menu music. Volume ducked to 60% when P0 SFX fires.
4. **P3 — UI SFX:** Button taps, tab switches, scrolls. Dropped if SFX channels full.
5. **P4 — Ambient:** Evolution ceremony ambient layers. Stopped if memory pressure.

**Ducking Rules:**
- When a P0 SFX fires (e.g., Chaos Roll result, Upheaval explosion), music ducks to 60% volume for 1 second, then returns.
- When Evolution Ceremony music plays, all other music stops (hard cut via `Sound.stopAsync()`).

---

## 6. Technical Specifications

### 6.1 File Format & Compression

| Audio Type | Format | Bitrate | Rationale |
|---|---|---|---|
| **Music (loops)** | MP3 | 128 kbps | Widest React Native/Expo compatibility. Seamless loop supported by expo-av via `isLooping: true`. |
| **SFX (short)** | MP3 | 96 kbps | Consistent format across the project. Avoids the AAC loading inconsistency on some Android devices. |
| **Ambient (long loops)** | MP3 | 96 kbps | Lower bitrate acceptable for background textures. |

**Total file size budget: ~25 MB** (15 MB music + 8 MB SFX + 2 MB ambient). Fits within the Expo app bundle and allows fast first install.

---

### 6.2 Looping & Seamlessness

All looping tracks (battle music stems, menu themes, ambient) must:
- **Loop seamlessly** with zero gap or click at the loop point.
- Use **exact sample-aligned loop points** (trim to whole bars, no partial samples).
- Include a **10ms crossfade** at the loop boundary (baked into the file using Audacity's "Export with loop point" feature) to ensure smooth transitions.

**Testing:** Every loop is tested for at least 10 consecutive loops in Audacity before export to catch timing drift or audible clicks.

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

**Mobile speaker optimization:** All audio tested on iPhone 11 internal speaker at 50% volume. High-frequency content (>12 kHz) rolled off to prevent harshness. Use Audacity's "High Roll-off for Speech" EQ preset as a starting point, then tweak by ear.

---

### 6.4 Volume Controls

Players can adjust three independent volume sliders in Settings:

| Slider | Controls | Default |
|---|---|---|
| **Master Volume** | All audio (global multiplier) | 100% |
| **Music Volume** | Battle music, menu music, evolution ceremony music | 60% |
| **SFX Volume** | Gameplay SFX, UI SFX, event SFX | 80% |

**Rationale for defaults:**
- Music at 60%: Provides ambience without overwhelming SFX.
- SFX at 80%: Clear feedback without being jarring.
- Master at 100%: Player has full control.

**Saved preferences:** Volume settings stored in `AsyncStorage` under the key `"audio_prefs"` as a JSON object `{ master: 1.0, music: 0.6, sfx: 0.8 }`. Loaded on app start, applied to the AudioManager before any sound plays.

---

### 6.5 Performance Constraints

| Metric | Target | Rationale |
|---|---|---|
| **Max simultaneous channels** | 12 | Prevents CPU overload on older devices (iPhone 11, iPad 8th gen). |
| **SFX latency (trigger to playback)** | <50ms | Ensures audio feels responsive. Anything >100ms feels laggy. |
| **Music layer crossfade time** | 0.5-1.0 seconds | Smooth transitions between intensity/instability states without jarring cuts. |
| **Memory footprint (all audio loaded)** | <40 MB uncompressed in RAM | iOS memory limits. Older devices (2 GB RAM) need headroom. |

**Streaming vs. preloading:**
- **Music:** Loaded via `Audio.Sound.createAsync()` on screen mount. `isLooping: true` set at load time.
- **SFX:** All SFX preloaded into a global `SoundPool` object at app launch. Total SFX ~1.3 MB compressed → ~3-4 MB uncompressed (acceptable).
- **Evolution Ceremony:** Preloaded when the Evolution screen component mounts (`useEffect` on mount), unloaded in the cleanup function (`sound.unloadAsync()`).

---

## 7. React Native (Expo) Implementation

This section is the blueprint Claude Code will use to implement audio. No manual engineering decisions are needed.

### 7.1 Project File Structure

All audio assets live in the Expo project under `assets/audio/`:

```
assets/
  audio/
    music/
      MUS_MainMenu_PlanesOfChaos.mp3
      MUS_Battle_Foundation.mp3
      MUS_Battle_Ironwright_FactionLayer.mp3
      MUS_Battle_Fey_FactionLayer.mp3
      MUS_Battle_Demonic_FactionLayer.mp3
      MUS_Battle_Intensity_Order.mp3
      MUS_Battle_Intensity_Chaos.mp3
      MUS_Evolution_Transformation.mp3
      MUS_Shop_Ambient.mp3
    sfx/
      SFX_Battle_CardPlay_Ironwright.mp3
      SFX_Battle_CardPlay_Fey.mp3
      SFX_Battle_CardPlay_Demonic.mp3
      SFX_Battle_CardPlay_Spell.mp3
      SFX_Battle_CardDraw.mp3
      SFX_Battle_DeckShuffle.mp3
      SFX_Battle_ManaGain.mp3
      SFX_Battle_ManaSpend.mp3
      SFX_Battle_CreatureAttack_Ironwright.mp3
      SFX_Battle_CreatureAttack_Fey.mp3
      SFX_Battle_CreatureAttack_Demonic.mp3
      SFX_Battle_CreatureHit.mp3
      SFX_Battle_CreatureDeath_Ironwright.mp3
      SFX_Battle_CreatureDeath_Fey.mp3
      SFX_Battle_CreatureDeath_Demonic.mp3
      SFX_Battle_AvatarDamage.mp3
      SFX_Battle_Heal.mp3
      SFX_Battle_TurnTransition.mp3
      SFX_Battle_TimerWarning.mp3
      SFX_Battle_TurnAutoEnd.mp3
      SFX_Battle_Surrender.mp3
      SFX_Keyword_ShieldBreak.mp3
      SFX_Keyword_Lifesteal.mp3
      SFX_Keyword_FlyingSwoop.mp3
      SFX_Keyword_ReachBlock.mp3
      SFX_Keyword_Deathtouch.mp3
      SFX_Keyword_TauntLockOn.mp3
      SFX_Keyword_Piercing.mp3
      SFX_ChaosRoll_D20Tumble.mp3
      SFX_ChaosRoll_OrderResult.mp3
      SFX_ChaosRoll_ChaosResult.mp3
      SFX_ChaosRoll_Nothing.mp3
      SFX_ChaosRoll_InstabilityUpdate.mp3
      SFX_Event_O1_MendingLight.mp3
      SFX_Event_O2_PlanarWard.mp3
      SFX_Event_O3_SteadyGrowth.mp3
      SFX_Event_O4_Clarity.mp3
      SFX_Event_O5_Fortify.mp3
      SFX_Event_O6_Sanctuary.mp3
      SFX_Event_O7_Bulwark.mp3
      SFX_Event_O8_Harmonize.mp3
      SFX_Event_C1_Surge.mp3
      SFX_Event_C2_Wildfire.mp3
      SFX_Event_C3_Upheaval.mp3
      SFX_Event_C4_Frenzy.mp3
      SFX_Event_C5_RiftBolt.mp3
      SFX_Event_C6_ChaosSiphon.mp3
      SFX_Event_C7_Maelstrom.mp3
      SFX_Event_C8_Overcharge.mp3
      SFX_Evolution_EnergyBuildup.mp3
      SFX_Evolution_ShardCrack.mp3
      SFX_Evolution_TransformWhoosh.mp3
      SFX_Evolution_RevealFanfare.mp3
      SFX_Evolution_OrderAccent.mp3
      SFX_Evolution_ChaosAccent.mp3
      SFX_Evolution_ModifierSelect.mp3
      SFX_UI_ButtonTap.mp3
      SFX_UI_ButtonTapPrimary.mp3
      SFX_UI_TabSwitch.mp3
      SFX_UI_CardFlip.mp3
      SFX_UI_Scroll.mp3
      SFX_UI_DeckSelect.mp3
      SFX_UI_MissionComplete.mp3
      SFX_UI_LevelUp.mp3
      SFX_UI_Error.mp3
      SFX_UI_Notification.mp3
```

### 7.2 Installation

```bash
npx expo install expo-av
```

Add to `app.json` plugins array:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-av",
        {
          "microphonePermission": false
        }
      ]
    ]
  }
}
```

### 7.3 AudioManager Module

Create `src/audio/AudioManager.ts`. Claude Code must implement this file with the following exported interface:

```typescript
// src/audio/AudioManager.ts
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Types ---

export type FactionId = 'ironwright' | 'fey' | 'demonic';

export type AudioPrefs = {
  master: number;   // 0.0 – 1.0
  music: number;    // 0.0 – 1.0
  sfx: number;      // 0.0 – 1.0
};

// --- Public API (all methods are async-safe to call from any component) ---

// Call once on app startup, before any screen renders.
export async function initAudio(): Promise<void>;

// Load and persist volume preferences from AsyncStorage.
export async function loadAudioPrefs(): Promise<AudioPrefs>;

// Save updated prefs to AsyncStorage and apply to all active sounds immediately.
export async function saveAudioPrefs(prefs: AudioPrefs): Promise<void>;

// --- Music ---

// Smoothly transition to the main menu theme. Fades out current music first.
export async function playMainMenuMusic(): Promise<void>;

// Start battle music for the given matchup. Loads all 4 stems and begins crossfade logic.
export async function startBattleMusic(playerFaction: FactionId, opponentFaction: FactionId): Promise<void>;

// Update the intensity layer volume based on total creature count (0–10).
export function setBoardIntensity(totalCreatures: number): void;

// Update the Order/Chaos crossfade based on player instability (1–20).
export function setInstabilityWeight(instability: number): void;

// Fire the combat kick SFX and briefly spike intensity layer.
export async function fireCombatKick(attackerFaction: FactionId): Promise<void>;

// Stop all battle music stems. Call when match ends.
export async function stopBattleMusic(): Promise<void>;

// Play shop/collection ambient. Loops indefinitely.
export async function playShopMusic(): Promise<void>;

// Stop shop music.
export async function stopShopMusic(): Promise<void>;

// --- Evolution Ceremony ---

// Preload evolution audio assets. Call when Evolution screen mounts.
export async function preloadEvolutionAudio(): Promise<void>;

// Play the three-phase evolution ceremony.
// onPhaseChange(phase: 1 | 2 | 3) is called at each phase transition.
export async function playEvolutionCeremony(
  faction: FactionId,
  outcomeIsOrder: boolean,
  onPhaseChange: (phase: 1 | 2 | 3) => void
): Promise<void>;

// Allow the player to skip by tapping. Fades out over 2 seconds.
export async function skipEvolutionCeremony(): Promise<void>;

// Unload evolution audio. Call when Evolution screen unmounts.
export async function unloadEvolutionAudio(): Promise<void>;

// --- SFX ---

// Play any SFX by its filename key (without extension).
// Respects priority: P0 always plays. P3/P4 drop if channels full.
export async function playSFX(
  key: string,
  priority?: 0 | 1 | 2 | 3 | 4
): Promise<void>;

// Convenience wrappers (internally call playSFX with correct priority):
export async function playCardPlay(faction: FactionId, isSpell?: boolean): Promise<void>;
export async function playCreatureAttack(faction: FactionId): Promise<void>;
export async function playCreatureDeath(faction: FactionId): Promise<void>;
export async function playChaosRoll(): Promise<void>;
export async function playRollResult(result: 'order' | 'chaos' | 'nothing'): Promise<void>;
export async function playEventSFX(eventId: string): Promise<void>; // e.g. 'O1', 'C3'
export async function playKeywordSFX(keyword: string): Promise<void>; // e.g. 'ShieldBreak'
export async function playUITap(isPrimary?: boolean): Promise<void>;
```

### 7.4 AudioManager Internal Logic Notes for Claude Code

When implementing `AudioManager.ts`:

1. **Audio mode:** Call `Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false })` inside `initAudio()`.

2. **SFX preloading:** On `initAudio()`, call `Audio.Sound.createAsync(require(...))` for all 59 SFX files and store the resulting `Sound` objects in a `Map<string, Audio.Sound>`. Use `require()` with a static path — React Native bundler does not support dynamic `require()` with variables. Build a manual lookup object:
   ```typescript
   const SFX_ASSETS: Record<string, ReturnType<typeof require>> = {
     'SFX_UI_ButtonTap': require('../../assets/audio/sfx/SFX_UI_ButtonTap.mp3'),
     // ... one entry per file
   };
   ```

3. **Music stems:** Load on demand (when `startBattleMusic` is called), not at app startup. Unload on `stopBattleMusic`.

4. **Volume calculation for any sound:**
   ```typescript
   const effectiveVolume = prefs.master * (isMusic ? prefs.music : prefs.sfx) * soundBaseVolume;
   await sound.setVolumeAsync(effectiveVolume);
   ```

5. **Crossfade between Order and Chaos intensity stems:** Keep both `MUS_Battle_Intensity_Order` and `MUS_Battle_Intensity_Chaos` playing simultaneously. Use `setInstabilityWeight` to set complementary volumes:
   ```typescript
   const chaos = (instability - 1) / 19;
   await intensityOrderSound.setVolumeAsync(effectiveMusicVolume * (1 - chaos) * baseIntensityVolume);
   await intensityChaoSound.setVolumeAsync(effectiveMusicVolume * chaos * baseIntensityVolume);
   ```

6. **Channel limit enforcement:** Keep a `Set<string>` of currently-playing SFX keys. If the set size reaches 6 and the incoming sound is P3 or P4, skip it. Remove keys from the set when `Sound` finishes playing (`onPlaybackStatusUpdate` where `status.didJustFinish === true`).

7. **Ducking:** When a P0 SFX fires, use a `setTimeout` sequence to duck music to 60% over 100ms, hold for 1000ms, then return to normal over 200ms:
   ```typescript
   await musicSound.setVolumeAsync(effectiveMusicVolume * 0.6);
   setTimeout(async () => {
     await musicSound.setVolumeAsync(effectiveMusicVolume);
   }, 1200);
   ```

### 7.5 Usage in Components

**Main menu screen (`src/screens/HomeScreen.tsx`):**
```typescript
import { playMainMenuMusic } from '../audio/AudioManager';

useEffect(() => {
  playMainMenuMusic();
  return () => { /* music continues across menu screens, don't stop here */ };
}, []);
```

**Battle screen (`src/screens/BattleScreen.tsx`):**
```typescript
import { startBattleMusic, stopBattleMusic, setBoardIntensity, setInstabilityWeight } from '../audio/AudioManager';

// On mount:
useEffect(() => {
  startBattleMusic(playerFaction, opponentFaction);
  return () => { stopBattleMusic(); };
}, []);

// When board state changes:
useEffect(() => {
  setBoardIntensity(totalCreatures);
}, [totalCreatures]);

useEffect(() => {
  setInstabilityWeight(playerInstability);
}, [playerInstability]);
```

**Evolution screen (`src/screens/EvolutionScreen.tsx`):**
```typescript
import { preloadEvolutionAudio, playEvolutionCeremony, skipEvolutionCeremony, unloadEvolutionAudio } from '../audio/AudioManager';

useEffect(() => {
  preloadEvolutionAudio();
  return () => { unloadEvolutionAudio(); };
}, []);

const handleStartEvolution = () => {
  playEvolutionCeremony(cardFaction, evolutionIsOrder, (phase) => {
    setCurrentPhase(phase); // update animation state
  });
};
```

**Settings screen (`src/screens/SettingsScreen.tsx`):**
```typescript
import { loadAudioPrefs, saveAudioPrefs } from '../audio/AudioManager';

const [prefs, setPrefs] = useState({ master: 1.0, music: 0.6, sfx: 0.8 });

useEffect(() => {
  loadAudioPrefs().then(setPrefs);
}, []);

const handleSliderChange = async (key: keyof AudioPrefs, value: number) => {
  const updated = { ...prefs, [key]: value };
  setPrefs(updated);
  await saveAudioPrefs(updated); // applies immediately to all active sounds
};
```

---

## 8. Audio Asset Sourcing (No Sound Designer Required)

This section tells the owner exactly where to get every audio asset for launch. Total estimated cost: $0–$30/month (most tools have free tiers sufficient for a launch package).

### 8.1 Music — Suno AI

**What it is:** AI music generation. Type a text prompt, get a full MP3 track back in seconds.

**URL:** https://suno.com

**Pricing:** Free tier gives 50 credits/day (~10 tracks/day). Pro plan is $10/month for 2,500 credits/month (sufficient to generate all 16+ tracks needed at launch). Commercial use is included in the paid plan — required for publishing to App Store.

**How to use:**
1. Sign up at suno.com.
2. Upgrade to Pro ($10/month) before generating any music you intend to publish.
3. For each track, use the "Custom Mode" option. Set the style tags to describe the faction palette and paste in the descriptive brief from Section 3.
4. Generate 3-5 variations per track and pick the best one.
5. Download as MP3.
6. Open in Audacity (free, https://www.audacityteam.org) to:
   - Trim to the correct loop length (count bars at the given BPM)
   - Apply "High Roll-off for Speech" EQ to reduce harshness above 12 kHz
   - Export as MP3 128 kbps (music) or 96 kbps (ambient/SFX)

**Example Suno prompts per track:**

| Track | Suno Style Tags | Description |
|---|---|---|
| Main Menu | `dark orchestral, electronic, epic, mysterious, cinematic` | `Planes of Chaos theme, 75 BPM, D minor, hybrid orchestral and electronic, strings and distorted synths, 2.5 minutes, loopable, no vocals, tension and release` |
| Battle Foundation | `minimal, cinematic, bass, percussion, dark ambient` | `Battle foundation layer, 95 BPM, bass drone and minimal kick drum, faction neutral, 2 minutes, loopable` |
| Ironwright Faction Layer | `steampunk, brass, industrial, mechanical, dark fantasy` | `Steampunk battle music, 95 BPM, brass melody with clockwork ticking, anvil accents, industrial percussion, 2 minutes, loopable, no vocals` |
| Fey Faction Layer | `celtic, harp, mystical, orchestral, nature, ethereal` | `Fey Courts battle music, 95 BPM but in 6/8 feel, harp counter-melody, string pads, whispered choir, 2 minutes, loopable` |
| Demonic Faction Layer | `dark, war drums, choral, brutal, epic, Phrygian` | `Demonic Kingdoms battle music, 95 BPM, war drums and taiko, guttural throat singing, low brass, 2 minutes, loopable` |
| Intensity Order | `orchestral, tense, percussion, cinematic, rising` | `Battle intensity layer Order version, 95 BPM, clean percussion and consonant strings, building but structured, 2 minutes, loopable` |
| Intensity Chaos | `distorted, aggressive, atonal, industrial, chaotic` | `Battle intensity layer Chaos version, 95 BPM, distorted percussion, tremolo strings, atonal stabs, dissonant, 2 minutes, loopable` |
| Evolution Ceremony | `orchestral, epic, transformation, choir, fantasy, dramatic` | `Evolution ritual music, slow build 0-20 seconds then dramatic 20-40 seconds then triumphant 40-70 seconds, no loop, 70 seconds total, choir swell, orchestral hit at end` |
| Shop Ambient | `piano, ambient, calm, melancholic, soft, loopable` | `Shop/collection background music, 60 BPM, solo piano with soft strings, calm and contemplative, 3 minutes, loopable, no drums` |

---

### 8.2 SFX — ElevenLabs Sound Effects + Freesound.org

**Option A: ElevenLabs Sound Effects (AI-generated)**

**URL:** https://elevenlabs.io/sound-effects

**Pricing:** Free tier includes 10,000 characters/month of text-to-speech (sound effects generation uses a separate quota; check current pricing). Sound effects free tier is generous for a one-time batch creation. Pro plan is $22/month if more volume is needed.

**Commercial use:** Yes, included.

**How to use:**
1. Go to elevenlabs.io/sound-effects.
2. Type a description of the sound (e.g., `"glass shattering into crystalline shards with a cascading high-pitched resonance, sharp impact"`).
3. Click Generate. Download the MP3.
4. Import into Audacity to trim to correct length and normalize to -3 dB peak.

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

**Pricing:** Free. Requires attribution for CC-BY licensed sounds. Filter to "CC0" (public domain) to avoid attribution requirements — there are thousands of CC0 SFX available.

**Best categories to search for Chaos Creatures SFX:**
- `dice rolling` — D20 tumble
- `metal impact` — Ironwright attacks and deaths
- `glass breaking` — Shield break, shard crack
- `wood hit`, `forest ambience` — Fey SFX
- `explosion`, `thunder` — Chaos events
- `fire crackling` — Demonic ambient texture
- `UI click`, `button tap`, `notification chime` — UI SFX

**Workflow:** Download WAV files, import into Audacity, normalize, trim, export as MP3 96 kbps.

---

### 8.3 Audacity (Free Audio Editor)

**URL:** https://www.audacityteam.org

**Pricing:** Free, open source.

**Required uses:**
- Trim downloaded tracks to exact loop points
- Normalize loudness (Effect > Normalize > -3 dB peak for SFX, -6 dB for music)
- Apply gentle high-frequency roll-off (Effect > EQ and Filters > Low Pass Filter, set to 12 kHz, roll-off 48 dB/octave) for mobile speaker friendliness
- Export as MP3 at the correct bitrate (File > Export > Export as MP3, set bitrate in quality settings)
- Test loops: select the region, enable Transport > Loop Play, listen for at least 10 cycles

---

### 8.4 Total Sourcing Cost Estimate

| Tool | Plan | Monthly Cost | Usage |
|---|---|---|---|
| Suno AI | Pro | $10/month | Generate all 16 music tracks (cancel after launch) |
| ElevenLabs | Free or Starter | $0–$5/month | Generate all 59 SFX (one-time batch) |
| Freesound.org | Free | $0 | Supplement any SFX not well served by ElevenLabs |
| Audacity | Free | $0 | Edit, trim, normalize, export all audio |
| **Total** | | **$10–$15 one-time month** | Cancel subscriptions after generating launch assets |

**Expected time to source all audio:** 4-6 hours total (30 mins to generate all music tracks in Suno, 2 hours to generate and trim SFX, 1-2 hours to organize files and rename to the convention in Section 9).

---

## 9. Implementation Priority

Audio implementation is phased across development milestones to ensure core gameplay is functional first.

### P0 — Minimum Viable Audio (Alpha)

**Must-have for playable alpha. Claude Code builds this first.**

- `AudioManager.ts` skeleton with `initAudio()`, `playSFX()`, `loadAudioPrefs()`, `saveAudioPrefs()`
- **Battle SFX:** Card play (universal), creature attack (universal), creature death (universal), damage to avatar, mana gain/spend, turn transition
- **Chaos Roll SFX:** D20 tumble, Order result, Chaos result, Nothing result
- **Basic Battle Music:** Single universal battle track (`MUS_Battle_Foundation.mp3`) looping. No adaptive system yet — just plays.
- **UI SFX:** Button tap (generic), tab switch, error tone
- **Settings screen:** Master/Music/SFX sliders wired to `saveAudioPrefs()`

**File count:** ~20 SFX + 1 music track

**Goal:** Game is playable with functional audio feedback. No silence during core loops.

---

### P1 — Faction Identity & Event Audio (Beta)

**Adds emotional depth and faction differentiation.**

- **Faction-Specific Battle Music:** All 13 stems loaded. `startBattleMusic(playerFaction, opponentFaction)` working with 4-layer stem blending.
- **`setBoardIntensity()`** and **`setInstabilityWeight()`** implemented.
- **Event SFX:** All 16 events wired (`playEventSFX('O1')` through `playEventSFX('C8')`).
- **Keyword SFX:** All 7 keyword triggers wired.
- **Evolution SFX:** All 7 evolution sounds wired to evolution screen phases.
- **Faction SFX Variations:** `playCardPlay(faction)`, `playCreatureAttack(faction)`, `playCreatureDeath(faction)` dispatching to the correct faction file.
- **Main Menu Music:** `playMainMenuMusic()` implemented.
- **`playEvolutionCeremony()`** implemented with phase callbacks.

**File count:** ~50 additional SFX + all music stems

**Goal:** Game has full audio identity. Factions sound distinct. Events are recognizable.

---

### P2 — Adaptive Music & Polish (1.0 Launch)

**Final layer of dynamic responsiveness and immersion.**

- **`fireCombatKick()`** implemented with faction-specific percussion SFX and intensity spike.
- **Evolution Ceremony:** `skipEvolutionCeremony()` with 2-second fade-out.
- **Shop/Collection Music:** `playShopMusic()` wired to Collection and Shop screens.
- **Additional UI SFX:** Mission complete, level up, rank up, notification pop, deck selection.
- **Audio Ducking:** P0 SFX fires music duck logic in `playSFX()`.
- **Channel limit enforcement:** `Set<string>` active channels checked before P3/P4 SFX play.
- **Mobile Optimization:** Test on physical iPhone 11 via Expo Go. Fix any crackling or latency issues.

**File count:** ~10 additional SFX + 2 music tracks

**Goal:** Audio is fully dynamic, emotionally impactful, and polished.

---

## 10. Audio Testing & QA Checklist

### Functional Testing

- [ ] All SFX trigger at correct moments (no missing audio, no double-triggers)
- [ ] Music loops seamlessly (no clicks, no gaps) — test by listening for 5+ minutes
- [ ] Volume sliders work independently (Master, Music, SFX)
- [ ] Audio preferences persist across app restarts (check AsyncStorage)
- [ ] Audio priority system drops P3/P4 sounds correctly when channels full
- [ ] Music ducking fires on P0 SFX (chaos roll, events, avatar damage)
- [ ] Faction SFX variations play for correct factions
- [ ] `setInstabilityWeight()` crossfades audibly between Order and Chaos intensity stems
- [ ] `setBoardIntensity()` scales intensity layer volume correctly
- [ ] Combat percussion kick fires when attackers declared
- [ ] Evolution ceremony plays full sequence, phase callbacks fire at correct times
- [ ] Evolution ceremony can be skipped with 2-second fade (not a hard cut)
- [ ] `playsInSilentModeIOS: true` works — audio plays even when the iPhone mute switch is on

### Performance Testing

- [ ] No audio crackling or popping on iPhone 11 (physical device test via Expo Go or TestFlight)
- [ ] SFX latency <50ms for gameplay SFX (chaos roll, card play, combat) — test by tapping and listening
- [ ] No memory crash when all SFX preloaded at launch
- [ ] No dropped SFX during heavy combat (10 creatures, multiple keyword triggers in one turn)
- [ ] Music streaming does not cause frame drops or animation stutter during battle

### Quality Testing

- [ ] All audio sounds clear on iPhone internal speaker (no harshness, no mud)
- [ ] All audio sounds clear on AirPods
- [ ] Faction music is clearly distinguishable (compare Ironwright vs. Fey vs. Demonic battle music back-to-back)
- [ ] Event SFX are recognizable after 2-3 listens
- [ ] Music does not cause fatigue after 30-minute play session
- [ ] No unintentional harsh frequencies (except intentional Chaos SFX)

---

## 11. Future Expansion: New Factions

When a new faction is added (post-launch), the following audio must be produced:

**Per New Faction:**
- 4 battle music stems (foundation shared, 1 new faction layer) — generate in Suno AI
- 3 SFX variations (creature attack, creature death, card play) — generate in ElevenLabs
- ~8-12 faction-specific modifier trigger SFX
- Evolution accent SFX (1 new variant for the faction's evolution flavor)

**Estimated effort per faction:** 2-3 hours (sourcing + editing in Audacity)

**File size per faction:** ~1-2 MB (4 stems + SFX variations)

**Code changes:** Add the new faction's files to `SFX_ASSETS` and `MUSIC_ASSETS` lookup objects in `AudioManager.ts`. No structural changes needed.

---

## 12. Accessibility Considerations

### Audio Cues for Visually Impaired Players

- **Distinct SFX for every game state change:** Card played, creature died, event fired, turn passed. No silent state changes.
- **Event announcements:** Optional iOS VoiceOver integration — when an event fires, call `AccessibilityInfo.announceForAccessibility(eventName)` from React Native's built-in `AccessibilityInfo` API.
- **Audio indicators for targeting:** When a spell requires a target, valid targets play `SFX_UI_Notification.mp3` when highlighted.

**Not in P0-P2 scope, but design allows for future enhancement.**

### Reduced Audio Mode

For players sensitive to audio intensity:

- **"Minimal Audio" toggle in Settings:** When enabled, stops all music and reduces SFX to critical gameplay feedback only (chaos roll result, damage, death, turn end). This is a boolean in `AudioPrefs` stored in AsyncStorage.
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
MUS_[Context]_[FactionOrType].mp3
```
- Examples:
  - `MUS_Battle_Foundation.mp3`
  - `MUS_Battle_Ironwright_FactionLayer.mp3`
  - `MUS_Battle_Intensity_Order.mp3`
  - `MUS_Battle_Intensity_Chaos.mp3`
  - `MUS_MainMenu_PlanesOfChaos.mp3`
  - `MUS_Evolution_Transformation.mp3`
  - `MUS_Shop_Ambient.mp3`

### SFX:
```
SFX_[Category]_[Action]_[Variation].mp3
```
- Examples:
  - `SFX_Battle_CardPlay_Ironwright.mp3`
  - `SFX_Battle_CreatureDeath_Fey.mp3`
  - `SFX_Keyword_ShieldBreak.mp3`
  - `SFX_ChaosRoll_D20Tumble.mp3`
  - `SFX_Event_O1_MendingLight.mp3`
  - `SFX_Event_C3_Upheaval.mp3`
  - `SFX_Evolution_ShardCrack.mp3`
  - `SFX_UI_ButtonTap.mp3`

**Total file count at 1.0 launch:** ~80-90 audio files (13 music stems + 3 music tracks + 60+ SFX).

---

## Conclusion

Audio is a core pillar of Chaos Creatures' identity. The Chaos Roll, faction aesthetics, and evolution moments all depend on audio to deliver emotional impact. This design prioritizes:

1. **Faction differentiation** through distinct sonic palettes (brass vs. woodwinds vs. war drums)
2. **Adaptive music** that responds to board state (instability, creature count, combat phase)
3. **Memorable event SFX** that players learn to anticipate and recognize
4. **Mobile optimization** with compressed file sizes, low latency, and clear mixing for phone speakers
5. **Scalable production** that allows new factions to be added efficiently
6. **Zero hiring required** — all assets sourced from Suno AI, ElevenLabs, and Freesound.org using prompts derived directly from this document

By the 1.0 launch, Chaos Creatures will have a complete, polished, and emotionally resonant audio package generated entirely without a professional audio team.

---

**Document Status:** Ready for Claude Code implementation and asset sourcing.

**Implementation Entry Point:** Start with `src/audio/AudioManager.ts` using the interface defined in Section 7.3. All other integration is wiring calls from screen components.

---

## Revision Log

Changes made in the revision pass (2026-02-16):

1. **Removed "engineer will fill in" assumptions throughout.** Every section now has explicit, actionable decisions. The original document deferred implementation details with phrases like "real-time EQ and reverb adjustments" which required an audio engineer to interpret. These have been replaced with concrete React Native/expo-av strategies (e.g., two separate pre-processed stems crossfaded by volume, not real-time DSP).

2. **Replaced Unity/C# AudioSource references with React Native/Expo (`expo-av`).** The original doc contained no explicit Unity references, but all implementation concepts were framed in engine-agnostic terms that a solo developer could not act on. Section 7 now provides a complete `AudioManager.ts` TypeScript interface, installation instructions (`npx expo install expo-av`), `app.json` plugin config, and usage examples for every screen type.

3. **Added Section 8: Audio Asset Sourcing.** The original doc ended with "Share this doc with a composer and sound designer for feasibility review." The revision replaces this with specific AI and royalty-free tools: Suno AI (music, $10/month Pro, commercial license), ElevenLabs Sound Effects (SFX, free tier), Freesound.org (supplemental SFX, free CC0), and Audacity (editing, free). Exact product URLs, pricing, commercial use policies, and step-by-step instructions are included. Example Suno prompts are provided for every track in the game.

4. **Added Section 7.1: Exact Expo project file structure.** The original doc named files without placing them in any directory structure. The revision specifies the exact path `assets/audio/music/` and `assets/audio/sfx/` and lists every filename that must exist before P0 audio can work.

5. **Added Section 7.2: Installation command and `app.json` config.** No developer decision needed.

6. **Added Section 7.3: Complete `AudioManager.ts` public interface.** Every method the rest of the app needs is defined with TypeScript signatures. Claude Code can implement this file from scratch using the interface as a contract.

7. **Added Section 7.4: Internal implementation notes for Claude Code.** Specifies how to handle: audio mode initialization, the static `require()` lookup pattern (React Native bundler constraint), volume calculation formula, Order/Chaos intensity crossfade logic, channel limit enforcement via a `Set`, and music ducking via `setTimeout` sequence.

8. **Added Section 7.5: Component-level usage examples.** Shows exactly how `HomeScreen`, `BattleScreen`, `EvolutionScreen`, and `SettingsScreen` call into the AudioManager.

9. **Changed file format from OGG/AAC to MP3 throughout.** The original doc specified OGG Vorbis for music and AAC for SFX. OGG has codec inconsistencies on iOS in React Native/Expo. MP3 is the safest universal format across both iOS and Android in expo-av. The naming convention appendix was updated to reflect `.mp3` extensions.

10. **Made volume persistence explicit.** The original doc said "stored in player profile" without specifying the mechanism. The revision specifies `AsyncStorage` with the key `"audio_prefs"` and the exact JSON shape `{ master, music, sfx }`.

11. **Made evolution skip mechanism concrete.** The original said "music fades out over 2 seconds." The revision specifies this is implemented via `Sound.setVolumeAsync()` in a `setTimeout` loop, not a built-in feature.

12. **Removed "team composition" estimates (1 composer + 1 sound designer + 1 audio engineer).** These are irrelevant for a solo owner using AI tools. Replaced with the sourcing section and cost table showing $10-15 one-time spend.

13. **Made streaming vs. preloading decision explicit for Expo.** The original described a generic streaming model. The revision specifies: SFX preloaded at app launch via `Audio.Sound.createAsync()` into a `Map`, music loaded on screen mount, evolution audio loaded on Evolution screen mount and unloaded in cleanup.

14. **Updated the `app.json` plugin config for expo-av.** Added `microphonePermission: false` to prevent unnecessary permission requests.

15. **Added `playsInSilentModeIOS: true` to the QA checklist.** This is a critical iOS-specific requirement that the original doc did not mention. Without it, all audio is silenced when the hardware mute switch is engaged — a common player complaint in mobile games.
