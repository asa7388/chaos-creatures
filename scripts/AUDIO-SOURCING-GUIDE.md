# Audio Sourcing Guide -- Chaos Creatures

All 19 SFX placeholders have been generated as silent WAV files in:
`ChaosCreatures/ChaosCreatures/Resources/Sounds/SFX/`

Replace each placeholder with a real sound effect downloaded from **freesound.org** (CC0 license only) or another free source.

---

## How to Replace a Placeholder

1. Find a sound on freesound.org using the search terms below
2. Filter by **License: Creative Commons 0** (CC0 = public domain, no attribution required)
3. Download the WAV (or convert to WAV if only MP3/FLAC available)
4. Rename the downloaded file to match the exact filename listed below
5. Drop it into `ChaosCreatures/ChaosCreatures/Resources/Sounds/SFX/`, replacing the placeholder
6. Build and run in Xcode Simulator to hear it in-game

**Format requirements**: WAV, 16-bit or 24-bit, 44100 Hz. Mono preferred for SFX (smaller file size). Keep each file under 500 KB for fast loading.

---

## SFX List

### Battle Actions

| Filename | Description | Duration | Search Terms |
|----------|-------------|----------|-------------|
| `sfx_card_play.wav` | Whoosh when a card is played from hand to board | < 0.5s | `whoosh card`, `swoosh paper`, `card play` |
| `sfx_attack.wav` | Impact sound when creature attacks | < 0.5s | `sword hit`, `attack impact`, `melee hit` |
| `sfx_damage.wav` | Crunch/thud when damage is dealt | < 0.3s | `damage crunch`, `hit impact`, `punch impact` |
| `sfx_death.wav` | Creature death -- shatter/dissolve | < 0.8s | `glass shatter`, `crystal break`, `death dissolve` |
| `sfx_heal.wav` | Healing chime/sparkle | < 0.5s | `heal chime`, `magic sparkle`, `restore health` |
| `sfx_shield_break.wav` | Glass/energy shield breaking | < 0.5s | `shield break`, `glass crack`, `energy barrier break` |

### Chaos Roll

| Filename | Description | Duration | Search Terms |
|----------|-------------|----------|-------------|
| `sfx_chaos_roll_start.wav` | D20 dice starts rolling | < 0.3s | `dice roll`, `dice shake`, `D20 roll` |
| `sfx_chaos_roll_order.wav` | Order result -- bright, positive chime | < 0.5s | `positive chime`, `success bell`, `order sound` |
| `sfx_chaos_roll_chaos.wav` | Chaos result -- ominous, dark hit | < 0.5s | `dark impact`, `ominous hit`, `chaos sound`, `evil reveal` |
| `sfx_chaos_roll_nothing.wav` | Neutral result -- subtle click/thud | < 0.3s | `neutral click`, `dull thud`, `nothing happened` |

### Events

| Filename | Description | Duration | Search Terms |
|----------|-------------|----------|-------------|
| `sfx_event_order.wav` | Order event activates -- mystical/angelic | < 0.8s | `magic positive`, `angelic sound`, `order spell` |
| `sfx_event_chaos.wav` | Chaos event activates -- dark/demonic | < 0.8s | `dark magic`, `demonic sound`, `chaos spell`, `evil magic` |

### UI / Turn Flow

| Filename | Description | Duration | Search Terms |
|----------|-------------|----------|-------------|
| `sfx_turn_start.wav` | Your turn begins -- clean notification ping | < 0.3s | `notification ping`, `turn start`, `bell ding` |
| `sfx_mana_gain.wav` | Mana crystal filled -- crystal clink | < 0.3s | `crystal clink`, `gem chime`, `mana gain` |
| `sfx_button_tap.wav` | UI button press -- soft click | < 0.1s | `button click`, `UI tap`, `soft click` |

### Match End

| Filename | Description | Duration | Search Terms |
|----------|-------------|----------|-------------|
| `sfx_victory.wav` | Victory fanfare -- triumphant brass/strings | 2-3s | `victory fanfare`, `win jingle`, `triumph` |
| `sfx_defeat.wav` | Defeat sound -- somber, falling | 2-3s | `defeat sound`, `game over`, `loss sad` |

### Special Effects

| Filename | Description | Duration | Search Terms |
|----------|-------------|----------|-------------|
| `sfx_chaos_spark.wav` | Chaos energy crackle/spark | < 0.5s | `electric spark`, `energy crackle`, `chaos spark` |
| `sfx_evolution_reveal.wav` | Evolution reveal -- dramatic unveil/ascend | 2-3s | `reveal sound`, `power up`, `level up`, `evolution` |

---

## Music (Faction Battle Tracks)

Music is NOT included as placeholders. The game expects 4 stems per faction (`.caf` format) for adaptive music mixing:

| Filename Pattern | Description |
|-----------------|-------------|
| `{faction}_base.caf` | Base loop -- plays throughout the battle |
| `{faction}_tension.caf` | Tension stem -- fades in when HP is low |
| `{faction}_chaos.caf` | Chaos stem -- fades in during chaos roll/events |
| `{faction}_victory.caf` | Victory stem -- plays on match win |

Faction names: `ironwright`, `fey_courts`, `demonic_kingdoms`

Total: 12 music stems (3 factions x 4 stems).

### Sourcing Music

**Option 1: Suno.ai (Recommended, Free Tier)**
- Generate faction-themed battle loops using Suno.ai's free tier
- Ironwright: Industrial/steampunk orchestral, heavy brass, clanking gears
- Fey Courts: Ethereal/Celtic, woodwinds, harps, nature sounds
- Demonic Kingdoms: Dark orchestral, heavy drums, distorted strings, choral
- Export each as WAV, then convert to CAF: `afconvert input.wav output.caf -d LEI16 -f caff`

**Option 2: Free Music Archives**
- freemusicarchive.org (CC0 or CC-BY)
- incompetech.com (Kevin MacLeod, CC-BY)
- opengameart.org (various licenses, check each)

**Option 3: itch.io Packs ($15-30 each)**
- Search for "fantasy battle music loop pack" on itch.io
- Many include stems or variations suitable for adaptive mixing
- Budget allows $15-30 for a quality music pack if free options are insufficient

### Music File Location

Place all `.caf` music files in:
`ChaosCreatures/ChaosCreatures/Resources/Sounds/Music/`

---

## Budget Impact

- SFX from freesound.org: **$0** (all CC0)
- Music from Suno.ai free tier: **$0**
- Optional itch.io music pack: **$15-30** (within polish budget)

Total audio cost: **$0-30**
