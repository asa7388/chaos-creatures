// demonic.mjs — Demonic Kingdoms faction data module
// All data sourced from docs/design/faction-art-bible.md

// ==========================================================================
// Sub-Factions — 2 Demonic Kingdoms sub-factions
// ==========================================================================
export const SUB_FACTIONS = [
  { name: 'The Furnace Lords', flavor: 'Wrath, volcanic forges, magma rivers, jagged obsidian armor, war banners of flame' },
  { name: 'The Obsidian Bureaucracy', flavor: 'Contracts, loopholes, towering filing cabinets, stamp seals that brand skin' },
];

// ==========================================================================
// Environments (all 12 from the art bible)
// ==========================================================================
export const ENVIRONMENTS = [
  'on the Soul Exchange trading floor, boards showing soul prices, frantic demonic brokers, soul-jars in pneumatic tubes',
  'in a volcanic court throne room inside a caldera, obsidian pillars rising from lava channels, heat haze shimmering',
  'in the Library of Sins, an archive of transgressions with self-shelving books and too-many-eyed librarians',
  'at a Flesh Market bazaar, body modifications displayed on mannequin-like living displays, clinical horror',
  'on the Penitent\'s Staircase, infinite stone stairs descending into darkness, each step carved with a different sin',
  'in an Infernal Shipyard, ships of bone and black iron docked along rivers of fire, skeletal crews loading cargo',
  'in the Garden of Earthly Delights, Bosch-inspired surreal landscape with giant fruit and impossible creatures',
  'inside a Corruption Nursery, demonic creatures grown in translucent pods, half-formed beings twitching, clinical green light',
  'inside the Broken Clocktower, a massive damaged lifespan mechanism, stolen time leaking as golden mist through cracked gears',
  'at a Border Checkpoint where hell meets the mortal world, mundane bureaucratic desks, flickering fluorescents revealing demonic truth',
  'in the Screaming Colosseum, a vast amphitheater for combat disputes, tiered demonic spectators and bookmakers in the stands',
  'on a Frozen Lake of Treachery, Dante\'s lowest circle with traitors frozen in ice, eerily silent and bitterly cold',
];

// ==========================================================================
// Moods (all 8 from the art bible)
// ==========================================================================
export const MOODS = [
  { name: 'seductive_luxury', description: 'Warm candlelight, gold reflections', palette: 'burgundy, gold, black velvet, plum, dark honey' },
  { name: 'bureaucratic_dread', description: 'Harsh fluorescent, clinical', palette: 'sickly yellow-green, institutional gray, manila, red stamp ink' },
  { name: 'volcanic_fury', description: 'Underlit by magma, deep shadow above', palette: 'magma orange, obsidian black, sulfur yellow, blood red' },
  { name: 'existential_void', description: 'Absence of light, negative space', palette: 'pure black, void blue, faint gray, single white point' },
  { name: 'grotesque_beauty', description: 'Chiaroscuro Renaissance light', palette: 'flesh tones, bone white, organ red, bruise spectrum' },
  { name: 'frozen_betrayal', description: 'Cold blue-white, ice reflections', palette: 'ice blue, corpse gray, frozen tear silver, frostbite purple' },
  { name: 'corporate_hell', description: 'Office lighting, screen glow', palette: 'beige, charcoal suit gray, red power tie, fluorescent white' },
  { name: 'carnival_of_the_damned', description: 'Garish multicolored circus lights', palette: 'candy red, neon pink, toxic green, bruise yellow' },
];

// ==========================================================================
// Textures (25+ individual strings split from the art bible paragraph)
// ==========================================================================
export const TEXTURES = [
  'cracked obsidian',
  'cooled lava, ropy and jagged',
  'sulfur crystals',
  'black iron, pitted and ancient',
  'skin stretched as parchment',
  'polished bone',
  'raw exposed bone',
  'fossilized bone',
  'horn and chitin',
  'demonic scales',
  'velvet and silk in decay',
  'molten gold',
  'congealed blood',
  'crystallized tears',
  'rusted chains',
  'gilded chains',
  'ethereal chains',
  'smoke and ash',
  'brimstone powder',
  'melting dripping wax',
  'cracked marble',
  'tarnished silver',
  'burnt parchment',
  'ink that moves',
  'cracked mirror glass',
  'fungal growth',
  'coral-like demonic growths',
];

// ==========================================================================
// FACTION_PREFIX — from prompts.ts FACTION_PREFIXES.DEMONIC
// ==========================================================================
export const FACTION_PREFIX =
  'grotesque infernal creature, fused bone and volcanic rock and dried gore, ' +
  'lit from below by hellfire glow, deep shadow obscuring details, ' +
  'burnt crimson and charcoal black palette, oppressive and heavy, ' +
  'in the style of Gustave Dore Dante Inferno engravings and Hieronymus Bosch hellscape paintings';

// ==========================================================================
// COLORS — Demonic Kingdoms faction colors
// ==========================================================================
export const COLORS = {
  primary: '#8B0000',   // dark red
  secondary: '#FF6B35', // hellfire orange
  accent: '#2D1B2E',    // deep shadow purple
  obsidian: '#1A1A2E',  // obsidian blue-black
  bg: '#1A0A0A',        // blood dark
};

// ==========================================================================
// Card Specs (8 diverse creatures across the full mana curve and sub-factions)
// ==========================================================================
export const CARD_SPECS = {
  'demon-b01': {
    spec_id: 'demon-b01',
    faction_key: 'DEMONIC',
    creature_archetype: 'Ink Imp',
    creature_description:
      'A tiny hunched imp no larger than a house cat with ink-black skin and bulging yellow eyes, its body is emaciated with every rib visible, two stubby vestigial wings sprout from its bony shoulder blades, long spindly fingers end in quill-like claws perpetually dripping fresh red ink, a forked tongue flicks out tasting the air, it clutches a crumpled soul contract in one fist, its tail curls into a crude stamp seal',
    creature_silhouette: 'tiny emaciated ink-black imp with bulging yellow eyes, quill-claw fingers dripping red ink, clutching a crumpled contract',
    creature_count: '1',
    cm_cost: 1,
    keywords: [],
    rarity: 'COMMON',
    card_type: 'CREATURE',
  },

  'demon-b02': {
    spec_id: 'demon-b02',
    faction_key: 'DEMONIC',
    creature_archetype: 'Magma Whelp',
    creature_description:
      'A small squat reptilian demon the size of a large dog formed from cooling volcanic rock, cracks across its hide pulse with molten orange light, a blunt snout exhales thin threads of sulfurous smoke, two stubby horns of black obsidian jut from its skull, its claws leave scorched prints on the ground, a short thick tail drags a trail of glowing embers, patches of hardened slag form crude armor plates across its hunched back',
    creature_silhouette: 'small squat reptilian demon of volcanic rock with molten cracks glowing orange, obsidian horns, smoking snout, ember-trailing tail',
    creature_count: '1',
    cm_cost: 2,
    keywords: ['Piercing'],
    rarity: 'COMMON',
    card_type: 'CREATURE',
  },

  'demon-b03': {
    spec_id: 'demon-b03',
    faction_key: 'DEMONIC',
    creature_archetype: 'Plague Blossom Crawler',
    creature_description:
      'A hunched insectoid demon with a carapace of iridescent rot in greens and purples, six segmented legs end in barbed hooks, its thorax splits open to reveal a cavity packed with jewel-toned fungal growths and poisonous flower buds that pulse with sickly bioluminescence, mandibles drip a viscous amber toxin, compound eyes shimmer like oil slicks, tendrils of spore-laden mist trail from vents along its spine',
    creature_silhouette: 'hunched insectoid demon with iridescent rot carapace, split thorax full of toxic flowers and fungi, oil-slick compound eyes',
    creature_count: '1',
    cm_cost: 3,
    keywords: ['Deathtouch'],
    rarity: 'UNCOMMON',
    card_type: 'CREATURE',
  },

  'demon-b04': {
    spec_id: 'demon-b04',
    faction_key: 'DEMONIC',
    creature_archetype: 'Mirror Stalker',
    creature_description:
      'A tall lean humanoid demon whose skin is a mosaic of cracked mirror shards reflecting distorted images of its surroundings, its face shifts between stolen identities — a young woman, an old man, a snarling beast — never settling, long arms end in fingers of jagged broken glass, where it steps the ground briefly shows reflections of other places, its silhouette flickers and doubles as if seen through a fractured lens, a faint silver light bleeds from the cracks between the mirror fragments',
    creature_silhouette: 'tall lean demon covered in cracked mirror shards, face shifting between stolen identities, jagged glass fingers, flickering double silhouette',
    creature_count: '1',
    cm_cost: 4,
    keywords: ['Lifesteal'],
    rarity: 'UNCOMMON',
    card_type: 'CREATURE',
  },

  'demon-b05': {
    spec_id: 'demon-b05',
    faction_key: 'DEMONIC',
    creature_archetype: 'Chain Inquisitor',
    creature_description:
      'A massive armored demon draped in black-and-gold vestments over plates of spiked dark iron, a heavy spiked censer swings from one gauntleted fist trailing acrid incense smoke, the other hand grips a branding iron glowing white-hot with a sigil of judgment, its face is hidden behind a featureless iron mask with only two narrow eye slits burning hellfire orange, thick chains wrap its torso and arms serving as both armor and weapons, a tattered cape of charred crimson cloth billows behind it',
    creature_silhouette: 'massive armored demon in black-and-gold vestments, featureless iron mask with hellfire eyes, spiked censer in one fist, glowing brand in the other',
    creature_count: '1',
    cm_cost: 5,
    keywords: ['Taunt', 'Shield'],
    rarity: 'RARE',
    card_type: 'CREATURE',
  },

  'demon-b06': {
    spec_id: 'demon-b06',
    faction_key: 'DEMONIC',
    creature_archetype: 'Flesh-Stitched Abomination',
    creature_description:
      'A towering grotesque creature assembled from dozens of mismatched body parts sewn together with black surgical thread and iron staples, three arms of different sizes sprout from its left side while one massive clawed arm dominates the right, its torso is a patchwork of different skin tones and textures with visible suture lines, two heads sit on thick necks — one screaming and one whispering — both with milky dead eyes, its legs are thick pillars of fused muscle and bone, surgical instruments still jut from its back where the Fleshweavers left their tools embedded',
    creature_silhouette: 'towering patchwork creature of stitched body parts, three arms on one side, two heads screaming and whispering, surgical tools embedded in its back',
    creature_count: '1',
    cm_cost: 6,
    keywords: ['Piercing', 'Reach'],
    rarity: 'RARE',
    card_type: 'CREATURE',
  },

  'demon-b07': {
    spec_id: 'demon-b07',
    faction_key: 'DEMONIC',
    creature_archetype: 'Chrono-Fiend Devourer',
    creature_description:
      'An enormous hunched demon whose body is fused with broken clock mechanisms, its ribcage is an exposed clockwork of massive gears grinding in contradictory directions, one arm ends in an hourglass-shaped claw filled with swirling golden sand, the other is a pendulum blade that swings with hypnotic rhythm, its face is a shattered clock dial with hands spinning wildly where eyes should be, the skin around the mechanisms is aged differently — youthful on one side and ancient and withered on the other, temporal distortion ripples the air around it making nearby objects appear at multiple ages simultaneously',
    creature_silhouette: 'enormous hunched demon fused with grinding clock mechanisms, hourglass claw, pendulum blade arm, shattered clock-face head with spinning hands',
    creature_count: '1',
    cm_cost: 7,
    keywords: ['Lifesteal', 'Deathtouch'],
    rarity: 'EPIC',
    card_type: 'CREATURE',
  },

  'demon-b08': {
    spec_id: 'demon-b08',
    faction_key: 'DEMONIC',
    creature_archetype: 'The Hollow King',
    creature_description:
      'A regal aristocratic demon of normal human proportions seated cross-legged floating three feet above the ground, wearing an immaculate black suit with a red silk cravat, his skin is smooth obsidian-black with hairline cracks of molten gold running through it like kintsugi, two elegant swept-back horns curve from his temples, his eyes are solid burning gold with no pupils, he holds a wine glass filled with liquid starlight in one clawed hand while the other rests palm-up radiating a sphere of absolute darkness that devours all light around it, the air within ten feet of him is visibly distorted and wrong, objects near him age and decay in real time, flowers wilt and stone crumbles, his expression is one of perfect calm and absolute contempt',
    creature_silhouette: 'elegant suited demon floating cross-legged, obsidian skin cracked with gold, burning gold eyes, wine glass in one hand, sphere of devouring darkness in the other',
    creature_count: '1',
    cm_cost: 9,
    keywords: ['Taunt', 'Piercing', 'Deathtouch'],
    rarity: 'LEGENDARY',
    card_type: 'CREATURE',
  },
};
