// endless.mjs — The Endless faction data module
// Data sourced from supabase/functions/_shared/prompts.ts and faction expansion design

// ==========================================================================
// SUB_FACTIONS — 2 Endless sub-factions
// ==========================================================================
export const SUB_FACTIONS = [
  { name: 'Necromantic Cabals', flavor: 'Lich councils, phylactery vaults, bone-rune circles, death magic research, spectral servitors' },
  { name: 'The Lost Spectres', flavor: 'Ghostly warbands, tattered banners, wailing charge, memory fragments, hollow armor' },
];

// ==========================================================================
// ENVIRONMENTS — 13 Endless environments from prompts.ts FACTION_ENVS
// ==========================================================================
export const ENVIRONMENTS = [
  'in a necropolis of crumbling mausoleums, spectral light seeping from cracks in sealed tombs',
  'on a bridge of bones spanning an abyss of whispering souls, ghostly luminescence below',
  'inside a lich-king throne room, phylacteries in alcoves, tattered banners of forgotten kingdoms',
  'in a graveyard where tombstones grow like trees, roots of bone piercing the surface',
  'at the shore of a dead sea, still black water reflecting no light, ghost ships anchored',
  'inside a collapsed library of the dead, spectral librarians shelving books of memory',
  'on a frozen battlefield where the fallen still stand, ice-locked in their final poses',
  'in a crypt beneath the world where time does not pass, cobwebs of pure darkness',
  'at the boundary between life and death, one side green and warm, the other grey and still',
  'inside a spiraling tower of skulls, each eye socket glowing with a fading memory',
  'in a fungal forest of pale mushrooms and phosphorescent mold, growing from ancient remains',
  'on the deck of a ghost galleon, tattered sails moving without wind, crew of shadows',
  'in a cathedral of silence where sound itself has died, only the whisper of entropy remains',
];

// ==========================================================================
// MOODS — 8 Endless moods with palettes
// ==========================================================================
export const MOODS = [
  { name: 'deathly_calm', description: 'Still cold light, no warmth, no movement', palette: 'bone white, ash gray, faded lavender, cold silver' },
  { name: 'spectral_fury', description: 'Ghostly green-purple light surging outward', palette: 'spectral green, void purple, bone white, shadow black' },
  { name: 'necromantic_ritual', description: 'Sickly green glow from below, dark above', palette: 'necrotic green, deep purple, tarnished gold, charcoal' },
  { name: 'hollow_grief', description: 'Overcast flat gray light, draining color', palette: 'slate gray, washed blue, faded ivory, dried blood brown' },
  { name: 'entropy_creep', description: 'Slow decay of all light and color', palette: 'dust brown, corroded copper, moth-wing gray, void black' },
  { name: 'ghost_light', description: 'Phosphorescent blue-white, underwater feel', palette: 'ghost blue, phosphor white, dark teal, deep navy' },
  { name: 'bone_harvest', description: 'Pale moonlight on white surfaces', palette: 'ivory, moonlight silver, shadow purple, dried moss green' },
  { name: 'void_whisper', description: 'Near-total darkness with pinpoints of light', palette: 'absolute black, single violet point, faint gray edge, distant white' },
];

// ==========================================================================
// TEXTURES — Endless texture strings
// ==========================================================================
export const TEXTURES = [
  'ancient crumbling bone',
  'tattered burial cloth',
  'spectral ectoplasm translucent and cold',
  'corroded tombstone granite',
  'phylactery crystal dark and pulsing',
  'cobweb silk thick and ancient',
  'rusted funeral armor',
  'petrified wood ancient and gray',
  'dried and cracked leather bindings',
  'faded gilt on rotting wood',
  'ghost-light luminescence pale blue',
  'bone dust powder fine and pale',
  'necromantic rune-carved stone',
  'hollow armor with nothing inside',
  'ice-locked flesh preserved and blue',
  'fungal growth on remains pale and phosphorescent',
  'spectral chains translucent and glowing',
  'moth-eaten velvet once-rich now faded',
  'obsidian grave markers polished and dark',
  'memory crystal clouded and flickering',
  'death mask porcelain cracked at the edges',
  'shroud fabric impossibly light and drifting',
  'worm-eaten parchment with fading script',
];

// ==========================================================================
// FACTION_PREFIX — from prompts.ts FACTION_PREFIXES.THE_ENDLESS
// ==========================================================================
export const FACTION_PREFIX =
  'undead spectral entity, bone and tattered cloth, ghostly luminescence, ' +
  'necromantic symbols, phylacteries, spectral chains, ' +
  'in the style of Gustave Dore Inferno etchings and Francisco Goya Black Paintings';

// ==========================================================================
// COLORS — The Endless faction colors
// ==========================================================================
export const COLORS = {
  primary: '#6B3FA0',   // spectral purple
  secondary: '#E8DCC8', // bone/parchment
  accent: '#5F9EA0',    // ghost teal
  sickly: '#7B9E5F',    // necrotic green
  bg: '#0D0D1A',        // void dark
};

// ==========================================================================
// CARD_SPECS — 8 diverse Endless creatures across the mana curve
// ==========================================================================
export const CARD_SPECS = {
  'end-b01': {
    spec_id: 'end-b01',
    faction_key: 'THE_ENDLESS',
    creature_archetype: 'Grave Wisp',
    creature_description:
      'A tiny floating orb of pale green-purple light no larger than a fist, within the glow a miniature skull face flickers in and out of visibility, trailing a thin wisp of spectral mist behind it as it drifts, occasionally small bone fragments orbit it like electrons around a nucleus, it leaves a faint trail of phosphorescent residue in the air that fades after moments',
    creature_silhouette: 'tiny floating orb of spectral light with flickering skull face within, orbiting bone fragments, trailing ghostly mist',
    creature_count: '1',
    cm_cost: 1,
    keywords: [],
    rarity: 'COMMON',
    card_type: 'CREATURE',
  },
  'end-b02': {
    spec_id: 'end-b02',
    faction_key: 'THE_ENDLESS',
    creature_archetype: 'Bone Crawler',
    creature_description:
      'A low skeletal construct assembled from the bones of multiple creatures, moving on six mismatched limbs — two human arms, two animal legs, and two spinal column tentacles, its body is a fused ribcage housing a pulsing necrotic green crystal at its core, a skull with too many eye sockets sits atop the assembly clicking its jaw rhythmically, bone-dust trails behind it and small fungal growths sprout from the joints',
    creature_silhouette: 'low skeletal construct on six mismatched bone limbs, fused ribcage with green crystal core, multi-eyed skull, fungal joints',
    creature_count: '1',
    cm_cost: 2,
    keywords: ['Piercing'],
    rarity: 'COMMON',
    card_type: 'CREATURE',
  },
  'end-b03': {
    spec_id: 'end-b03',
    faction_key: 'THE_ENDLESS',
    creature_archetype: 'Spectral Knight',
    creature_description:
      'A translucent ghostly warrior in corroded plate armor that floats six inches above the ground, the armor is real and solid but the body within is pure spectral energy visible as a pale blue-white luminescence through the gaps and visor, it carries a notched longsword covered in frost and a battered kite shield bearing a forgotten heraldry half-worn away by time, tatters of a once-proud surcoat hang from the pauldrons, its movements are eerily smooth as if underwater',
    creature_silhouette: 'translucent ghostly knight in corroded plate armor floating above ground, frost-covered longsword, battered heraldic shield, tattered surcoat',
    creature_count: '1',
    cm_cost: 3,
    keywords: ['Shield'],
    rarity: 'UNCOMMON',
    card_type: 'CREATURE',
  },
  'end-b04': {
    spec_id: 'end-b04',
    faction_key: 'THE_ENDLESS',
    creature_archetype: 'Phylactery Guardian',
    creature_description:
      'A hunched skeletal figure draped in layers of moth-eaten robes of deep purple and faded gold, its skull face is cracked and repaired with bands of tarnished silver, four skeletal arms clutch and protect a collection of phylactery jars — glowing vessels of dark crystal containing swirling soul energy in violet and green, chains of bone link the phylacteries to the guardian who would shatter before releasing them, necromantic runes carved into every bone surface glow faintly',
    creature_silhouette: 'hunched four-armed skeletal figure in moth-eaten robes clutching phylactery jars of swirling soul energy, silver-banded skull, bone chains',
    creature_count: '1',
    cm_cost: 4,
    keywords: ['Ward', 'Shield'],
    rarity: 'UNCOMMON',
    card_type: 'CREATURE',
  },
  'end-b05': {
    spec_id: 'end-b05',
    faction_key: 'THE_ENDLESS',
    creature_archetype: 'Death Knight Commander',
    creature_description:
      'A massive undead warrior in heavy blackened plate armor etched with death-runes that pulse with cold blue light, a tattered command cloak of midnight black streams behind it seemingly moved by an unfelt wind, it wields a two-handed greatsword of dark iron with a blade edge of crystallized necrotic energy, its skull helm has two burning violet eyes that leave trails when it turns its head, a regiment of smaller skeletal soldiers stands at attention behind it barely visible in the mist',
    creature_silhouette: 'massive death knight in rune-etched black plate, tattered command cloak, dark greatsword with necrotic edge, violet skull eyes, skeleton regiment behind',
    creature_count: '1+minions',
    cm_cost: 5,
    keywords: ['Taunt', 'Haste'],
    rarity: 'RARE',
    card_type: 'CREATURE',
  },
  'end-b06': {
    spec_id: 'end-b06',
    faction_key: 'THE_ENDLESS',
    creature_archetype: 'Wraith Harvester',
    creature_description:
      'A tall spectral entity that appears as a column of swirling dark mist given vaguely humanoid form, its only solid features are two enormous skeletal hands with elongated finger bones that reach outward draining the color and warmth from everything they near, a face of shifting shadows with hollow eye sockets burning cold white peers from within the mist column, it carries a massive scythe of bone and spectral iron whose blade passes through solid matter but severs the soul, the ground beneath it dies and turns to ash in a spreading circle',
    creature_silhouette: 'tall wraith column of dark mist with enormous skeletal draining hands, shadow face with white-burning eyes, bone-and-spectral scythe, ash circle below',
    creature_count: '1',
    cm_cost: 6,
    keywords: ['Lifesteal', 'Deathtouch'],
    rarity: 'RARE',
    card_type: 'CREATURE',
  },
  'end-b07': {
    spec_id: 'end-b07',
    faction_key: 'THE_ENDLESS',
    creature_archetype: 'Lich Sovereign',
    creature_description:
      'An ancient skeletal mage seated on a floating throne of fused skulls and petrified wood, wearing grand robes of tattered purple silk and corroded gold thread that billow despite no wind, its skull is crowned with a circlet of dark crystal set with soul-gems that each contain a trapped screaming face, one bony hand grips a staff topped with a massive phylactery orb swirling with captured souls, the other hand conducts arcs of necrotic lightning between its fingertips, dozens of spectral chains extend from its throne anchoring it to the mortal plane, reality visibly darkens and decays in its presence',
    creature_silhouette: 'skeletal mage on floating skull-throne, tattered gold-purple robes, dark crystal soul-gem crown, phylactery staff, necrotic lightning fingers',
    creature_count: '1',
    cm_cost: 7,
    keywords: ['Ward', 'Lifesteal'],
    rarity: 'EPIC',
    card_type: 'CREATURE',
  },
  'end-b08': {
    spec_id: 'end-b08',
    faction_key: 'THE_ENDLESS',
    creature_archetype: 'The Undying Colossus',
    creature_description:
      'A titanic skeletal construct assembled from the bones of thousands, standing taller than castle walls, its torso is a cathedral of fused ribcages and spinal columns with a massive phylactery heart visible glowing sickly green through the bone lattice, four arms of different sizes wield weapons forged from compressed bone — a sword, a mace, a spear, and a shield each the size of a building, its skull is a composite of hundreds of smaller skulls fused together with burning void-purple eyes the size of wagon wheels, an army of lesser undead clings to its body like parasites repairing and reinforcing the structure as it moves, every step leaves a crater of dead earth, spectral energy streams upward from its form like an inverted waterfall connecting it to the realm of the dead above',
    creature_silhouette: 'titanic bone colossus of thousands of fused skeletons, cathedral ribcage with green phylactery heart, four weapon-arms, composite skull with void eyes, undead army clinging to body',
    creature_count: '1+minions',
    cm_cost: 9,
    keywords: ['Taunt', 'Shield', 'Lifesteal'],
    rarity: 'LEGENDARY',
    card_type: 'CREATURE',
  },
};
