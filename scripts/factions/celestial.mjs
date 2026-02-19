// celestial.mjs — Celestial Crusade faction data module
// Data sourced from supabase/functions/_shared/prompts.ts and faction expansion design

// ==========================================================================
// SUB_FACTIONS — 2 Celestial Crusade sub-factions
// ==========================================================================
export const SUB_FACTIONS = [
  { name: 'Knights of Deliverance', flavor: 'Holy crusaders, hammered gold plate, divine swords, battle hymns, war banners of radiant light' },
  { name: 'Heaven\'s Chosen', flavor: 'Angelic hierarchy, multi-winged seraphim, sacred geometry halos, divine judgment, celestial edicts' },
];

// ==========================================================================
// ENVIRONMENTS — 13 Celestial Crusade environments from prompts.ts FACTION_ENVS
// ==========================================================================
export const ENVIRONMENTS = [
  'in a cathedral of pure light, stained glass windows depicting divine victories, golden dust motes',
  'on the steps of a marble celestial citadel, clouds below, twin suns blazing above',
  'atop a floating temple island connected by bridges of solidified light',
  'in a garden of crystal flowers and golden trees, where gravity lifts petals skyward',
  'inside a war sanctum of hammered gold, battle standards of divine crusades lining the walls',
  'on a battlefield where holy fire has scorched the earth white, angelic silhouettes in the sky',
  'at the gates of divine judgment, massive scales of gold and ivory, petitioners below',
  'in a reliquary vault of sacred weapons and armor, each glowing with inner radiance',
  'on a celestial bridge between realms, stars visible below and above, halo rings orbiting',
  'inside a prayer hall where thousands of candles float in formation, hymns echoing',
  'at the summit of a holy mountain, lightning-struck and wind-scoured, divine mandate in the air',
  'in a scriptorium of prophecy, scrolls floating and writing themselves in golden ink',
  'on the prow of a golden warship sailing through clouds, angelic warriors at stations',
];

// ==========================================================================
// MOODS — 8 Celestial Crusade moods with palettes
// ==========================================================================
export const MOODS = [
  { name: 'divine_radiance', description: 'Blinding golden light from above, halo glow', palette: 'burnished gold, white marble, pale rose, ivory' },
  { name: 'righteous_fury', description: 'Harsh directional white-gold light, stark shadows', palette: 'blood red, hammered gold, steel gray, burning white' },
  { name: 'sacred_serenity', description: 'Soft diffused heavenly glow', palette: 'cream, soft gold, powder blue, pearl white' },
  { name: 'celestial_judgment', description: 'Cold harsh overhead light, courtroom severity', palette: 'cold white, iron gray, tarnished silver, accusatory gold' },
  { name: 'martyrdom_glory', description: 'Dramatic chiaroscuro, suffering and triumph', palette: 'deep crimson, burnished bronze, bone white, shadow purple' },
  { name: 'dawn_crusade', description: 'Pink-gold sunrise breaking over horizon', palette: 'dawn pink, amber gold, sky blue, warm steel' },
  { name: 'holy_war', description: 'Fire and divine light mixing on battlefield', palette: 'flame orange, divine gold, smoke gray, blood crimson' },
  { name: 'eternal_vigil', description: 'Starlit darkness with points of holy light', palette: 'midnight blue, starlight silver, candle gold, deep indigo' },
];

// ==========================================================================
// TEXTURES — Celestial Crusade texture strings
// ==========================================================================
export const TEXTURES = [
  'hammered gold plate',
  'polished white marble',
  'crystal prism facets',
  'gilded filigree scrollwork',
  'sacred parchment with golden ink',
  'luminous alabaster',
  'beaten silver chainmail',
  'ivory carved scripture',
  'stained glass light patterns',
  'burnished bronze fittings',
  'rose quartz inlays',
  'diamond-cut gemstone settings',
  'woven gold thread vestments',
  'sun-bleached white stone',
  'celestial metal with inner radiance',
  'feathered wing surfaces iridescent and downy',
  'halo ring energy solid yet translucent',
  'prayer bead strings of polished amber',
  'sanctified steel mirror-bright',
  'holy water crystallized into ice-like prisms',
  'divine seal wax shimmering with embedded light',
  'consecrated oak polished to amber sheen',
  'angelic script etched into living metal',
];

// ==========================================================================
// FACTION_PREFIX — from prompts.ts FACTION_PREFIXES.CELESTIAL_CRUSADE
// ==========================================================================
export const FACTION_PREFIX =
  'divine crusader entity, hammered gold plate and white marble, radiant halo, wings of light, ' +
  'sacred geometry, celestial armor, burning righteous fury, ' +
  'in the style of Gustave Dore biblical illustrations and William Blake visionary paintings';

// ==========================================================================
// COLORS — Celestial Crusade faction colors
// ==========================================================================
export const COLORS = {
  primary: '#DAA520',   // goldenrod
  secondary: '#F5F0E1', // warm cream
  accent: '#3B5998',    // divine blue
  rose: '#C47A8E',      // rose accent
  bg: '#1A1520',        // dark background
};

// ==========================================================================
// CARD_SPECS — 8 diverse Celestial Crusade creatures across the mana curve
// ==========================================================================
export const CARD_SPECS = {
  'cel-b01': {
    spec_id: 'cel-b01',
    faction_key: 'CELESTIAL_CRUSADE',
    creature_archetype: 'Prayer Lantern',
    creature_description:
      'A tiny floating construct of hammered gold and crystal, shaped like a censer with four delicate wings of stained glass, it drifts through the air trailing golden dust motes, a single flame of divine white light burns within its latticed body casting prismatic patterns on nearby surfaces, chains of fine golden links dangle beneath it swaying with each gentle movement',
    creature_silhouette: 'tiny floating golden censer-construct with four stained glass wings, white flame within, golden chains dangling',
    creature_count: '1',
    cm_cost: 1,
    keywords: [],
    rarity: 'COMMON',
    card_type: 'CREATURE',
  },
  'cel-b02': {
    spec_id: 'cel-b02',
    faction_key: 'CELESTIAL_CRUSADE',
    creature_archetype: 'Blessed Squire',
    creature_description:
      'A young armored crusader in polished white plate with golden trim, a tabard bearing a sun emblem over the chest, kneeling with a short sword planted point-down before them in a gesture of devotion, a faint halo of warm golden light crowns their helmeted head, simple but earnest in bearing, a small round shield strapped to the left arm embossed with sacred geometry',
    creature_silhouette: 'kneeling armored squire in white-and-gold plate, sword planted before them, faint golden halo, sun tabard, round shield',
    creature_count: '1',
    cm_cost: 2,
    keywords: ['Shield'],
    rarity: 'COMMON',
    card_type: 'CREATURE',
  },
  'cel-b03': {
    spec_id: 'cel-b03',
    faction_key: 'CELESTIAL_CRUSADE',
    creature_archetype: 'Sanctified Automaton',
    creature_description:
      'A humanoid construct of white marble and hammered gold, its body carved with scripture and sacred geometry, eyes of pale blue crystal light set in a featureless helm-like head, one arm ends in a massive tower shield of gilded ivory and the other in a mace of solid crystal that hums with resonant energy, golden filigree veins pulse with divine light across its torso, joints connected by arcs of holy energy rather than mechanical parts',
    creature_silhouette: 'humanoid marble-and-gold construct with scripture carvings, crystal eyes, ivory tower shield, crystal mace, golden filigree veins',
    creature_count: '1',
    cm_cost: 3,
    keywords: ['Shield', 'Ward'],
    rarity: 'UNCOMMON',
    card_type: 'CREATURE',
  },
  'cel-b04': {
    spec_id: 'cel-b04',
    faction_key: 'CELESTIAL_CRUSADE',
    creature_archetype: 'Crusade Standard-Bearer',
    creature_description:
      'A tall armored warrior in full plate of burnished gold and white enamel, carrying a massive battle standard that burns with holy fire at its tip, the banner itself a tapestry of divine victories woven in golden thread that moves and shifts showing different scenes, a great two-handed warhammer magnetically clamped to their back, a halo of three concentric golden rings rotates slowly behind their head, heavy boots of sanctified steel crushing the ground beneath',
    creature_silhouette: 'tall gold-and-white armored warrior holding burning battle standard, warhammer on back, three concentric halo rings',
    creature_count: '1',
    cm_cost: 4,
    keywords: ['Haste'],
    rarity: 'UNCOMMON',
    card_type: 'CREATURE',
  },
  'cel-b05': {
    spec_id: 'cel-b05',
    faction_key: 'CELESTIAL_CRUSADE',
    creature_archetype: 'Seraph Guardian',
    creature_description:
      'A towering angel warrior with four wings of pure white feathers tipped with gold, wearing ceremonial battle armor of hammered gold plate over white marble, a longsword of crystallized light held in one gauntleted hand burning with righteous fire, the other hand raised palm-out projecting a hexagonal barrier of golden energy, its face beautiful and terrible with eyes of solid white light, a crown of golden thorns resting on its brow, golden blood dripping from old battle wounds that glow instead of bleed',
    creature_silhouette: 'towering four-winged angel in gold plate over marble, crystal light longsword, golden energy barrier, white-light eyes, thorn crown',
    creature_count: '1',
    cm_cost: 5,
    keywords: ['Flying', 'Shield'],
    rarity: 'RARE',
    card_type: 'CREATURE',
  },
  'cel-b06': {
    spec_id: 'cel-b06',
    faction_key: 'CELESTIAL_CRUSADE',
    creature_archetype: 'Divine Siege Ram',
    creature_description:
      'A massive holy war machine shaped like a charging bull, its body constructed from white marble blocks and gold-plated iron beams, a battering head of solid crystal focuses a beam of concentrated divine light, six thick legs of gilded stone move with surprising speed, sacred banners and chains of prayer beads drape its flanks, its back carries a platform where a golden brazier of holy fire burns, thick golden smoke trails behind it as it charges, the ground beneath its hooves cracks and glows with residual holy energy',
    creature_silhouette: 'massive marble-and-gold bull war machine with crystal battering head, six stone legs, holy fire brazier on back, prayer chains',
    creature_count: '1',
    cm_cost: 6,
    keywords: ['Piercing', 'Haste'],
    rarity: 'RARE',
    card_type: 'CREATURE',
  },
  'cel-b07': {
    spec_id: 'cel-b07',
    faction_key: 'CELESTIAL_CRUSADE',
    creature_archetype: 'Throne of Judgment',
    creature_description:
      'An enormous multi-winged celestial entity that defies normal anatomy, six wings of blinding white light arranged in a ring around a central body of hammered gold and living marble, hundreds of eyes of different sizes cover the wings each burning with individual judgment, at its center floats a figure in ornate judicial robes of gold and white holding massive scales in one hand and a sword of pure light in the other, a choir of smaller angel-constructs orbit it like moons, reality warps around its presence bending light and space',
    creature_silhouette: 'enormous six-winged celestial entity with hundreds of burning eyes, central robed judge with scales and light-sword, orbiting angel-moons',
    creature_count: '1+minions',
    cm_cost: 7,
    keywords: ['Flying', 'Ward', 'Taunt'],
    rarity: 'EPIC',
    card_type: 'CREATURE',
  },
  'cel-b08': {
    spec_id: 'cel-b08',
    faction_key: 'CELESTIAL_CRUSADE',
    creature_archetype: 'The Exalted Primarch',
    creature_description:
      'A being of almost unbearable radiance in the shape of a colossal armored warrior, twelve wings of crystallized light spread in a corona behind it, each wing a different shade from white to gold to rose to pale blue, its armor is a masterwork of hammered gold and white marble carved with the complete history of its crusade in microscopic detail, in one hand it holds a greatsword the length of a city wall blazing with concentrated divine wrath, in the other a shield that shows a perfect reflection of heaven, its face is hidden behind a golden mask of absolute serenity but its eyes are twin suns burning through the mask, lesser angels kneel in formation below it, the sky itself bends around its presence turning golden',
    creature_silhouette: 'colossal twelve-winged warrior of light and gold, greatsword of divine wrath, heaven-reflecting shield, golden mask with twin sun eyes, angels kneeling below',
    creature_count: '1+minions',
    cm_cost: 9,
    keywords: ['Flying', 'Shield', 'Piercing'],
    rarity: 'LEGENDARY',
    card_type: 'CREATURE',
  },
};
