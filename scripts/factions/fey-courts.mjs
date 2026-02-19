// fey-courts.mjs — Fey Courts faction data module
// All data sourced from docs/design/faction-art-bible.md

// ==========================================================================
// SUB_FACTIONS — 2 Fey Courts sub-factions
// ==========================================================================
export const SUB_FACTIONS = [
  { name: 'The Verdant Throne', flavor: 'Growth, exploding flowers, pollen storms, vines cracking stone' },
  { name: 'The Hollow Court', flavor: 'Silence, bare branches like bones, frozen ponds with faces, moth-eaten elegance' },
];

// ==========================================================================
// ENVIRONMENTS — all 12 Fey Courts environments as prompt-ready scene descriptions
// ==========================================================================
export const ENVIRONMENTS = [
  'in the Endless Feast Hall, a table stretching to the horizon with centuries-old food, dancing guests who cannot stop',
  'at a Fairy Ring Crossroads, a mushroom circle at midnight where the space inside is brighter and darker than it should be',
  'in the Thorn Maze, thirty-foot living briar walls with shifting passages and bones tangled in the hedge',
  'inside a Hollow Tree Palace, an impossibly vast tree interior with spiral staircases of living wood and windows showing different seasons',
  'in the Drowning Garden, a flooded meadow of underwater flowers with filtered sunlight and fish swimming through rose bushes',
  'at an Autumn Market, stalls selling bottled memories and years of life and names, paid with intangibles',
  'on the Petrified Dance Floor, stone figures frozen mid-dance with expressions of ecstasy and terror, moss creeping over them',
  'in a Spider-Silk Observatory, a web structure strung between ancient trees with dewdrop lenses for stargazing',
  'in the Whispering Bog, a mist-choked marshland with will-o-wisps and half-submerged standing stones and bubbling mud',
  'inside a Cocoon Cathedral, a vast space draped in silk cocoons of various sizes, some glowing from within, moth-winged attendants drifting',
  'at the Mirror Lake, perfectly still water reflecting a different time or place, a shore of silver sand',
  'in a Bone Orchard, trees made of interlocking bones and antlers and ribs and skulls, all blooming with real flowers',
];

// ==========================================================================
// MOODS — all 8 Fey Courts moods with palettes
// ==========================================================================
export const MOODS = [
  { name: 'enchanted_allure', description: 'Soft dappled light, golden hour', palette: 'emerald, gold, warm amber, cream, honey' },
  { name: 'creeping_dread', description: 'Dim blue twilight, bioluminescence', palette: 'deep teal, bruise purple, sickly yellow-green, black' },
  { name: 'manic_revelry', description: 'Oversaturated firelight and moonlight', palette: 'hot pink, electric violet, marigold, midnight blue' },
  { name: 'melancholy_decay', description: 'Overcast flat light', palette: 'rust orange, dried-blood red, mushroom brown, fog gray' },
  { name: 'predatory_pursuit', description: 'Moonlight through branches, motion blur', palette: 'silver, cobalt blue, hunter green, blood red' },
  { name: 'frozen_stillness', description: 'Blue-white winter light', palette: 'ice blue, bone white, bare wood gray, black berries' },
  { name: 'overwhelming_growth', description: 'Noon light through dense canopy', palette: 'chlorophyll greens, soil brown, pollen yellow' },
  { name: 'dream_logic', description: 'Light without proper shadows', palette: 'opal, mother-of-pearl, shifting rainbow, cotton candy pastels' },
];

// ==========================================================================
// TEXTURES — individual texture strings parsed from the art bible
// ==========================================================================
export const TEXTURES = [
  'iridescent beetle shells',
  'spider silk wet and glistening',
  'spider silk dry and powdery',
  'birch bark paper-thin and peeling',
  'oak bark rough and deeply furrowed',
  'rotting bark soft and crumbling',
  'mushroom gills fanning delicately',
  'lichen crust in mottled patches',
  'flower petals fresh and dewy',
  'flower petals dried and translucent',
  'antler velvet soft and fuzzy',
  'fox fur dense and ruddy',
  'moth wing dust shimmering with scales',
  'dragonfly wing venation gossamer-thin',
  'honeycomb wax golden and hexagonal',
  'amber resin warm and glowing',
  'river stones smooth and water-polished',
  'frog skin slick and mottled',
  'snail shell nacre with rainbow sheen',
  'cobweb lace intricate and silvery',
  'frozen dew drops crystalline and prismatic',
  'autumn leaf translucency backlit with veins',
  'mycelial threads branching and web-like',
  'bioluminescent fungus glow pale teal',
  'thistledown soft and drifting',
  'dandelion seed heads airy and radiant',
  'bird eggshell speckle fragile and patterned',
  'owl feather softness silent and layered',
  'fish scale iridescence overlapping and bright',
  'rose thorn hooks sharp and curved',
  'ivy grip-pads clinging and tenacious',
  'pinecone spirals tight and geometric',
  'acorn caps textured and woody',
];

// ==========================================================================
// FACTION_PREFIX — from prompts.ts FACTION_PREFIXES.FEY_COURTS
// ==========================================================================
export const FACTION_PREFIX =
  'dark fey forest creature, twisted ancient wood and thorns, unsettling and wild, ' +
  'dappled green-gold light filtering through dense canopy, muted forest palette, ' +
  'overgrown with moss and lichen, more Brothers Grimm than Disney, ' +
  'in the style of Arthur Rackham twisted ink drawings and Edmund Dulac muted watercolors';

// ==========================================================================
// COLORS — Fey Courts faction colors
// ==========================================================================
export const COLORS = {
  primary: '#228B22',   // forest green
  secondary: '#90EE90', // light green
  accent: '#C0C0C0',    // silver
  twilight: '#483D8B',   // dark slate blue
  bg: '#0A1A0A',        // deep forest dark
};

// ==========================================================================
// CARD_SPECS — 8 diverse Fey Courts creature cards across the mana curve
// ==========================================================================
export const CARD_SPECS = {
  'fey-b01': {
    spec_id: 'fey-b01',
    faction_key: 'FEY_COURTS',
    creature_archetype: 'Thorn Sprite',
    creature_description:
      'A tiny malicious fey creature no taller than a hand, with a body woven from living rose stems and thorns, its face a clenched rosebud that opens to reveal needle-like teeth, wings of dried oak leaves veined with sap, it grips a thorn-spike javelin in one barbed hand and crouches on a mossy stone, trailing a faint emerald glow from between its thorny ribs',
    creature_silhouette:
      'tiny thorn-woven fey sprite with rosebud face, dried oak-leaf wings, thorn javelin, crouching on mossy stone',
    creature_count: '1',
    cm_cost: 1,
    keywords: [],
    rarity: 'COMMON',
    card_type: 'CREATURE',
  },

  'fey-b02': {
    spec_id: 'fey-b02',
    faction_key: 'FEY_COURTS',
    creature_archetype: 'Bog Troll Lurker',
    creature_description:
      'A squat muscular troll rising from black swamp water, skin like waterlogged bark covered in green algae and leeches, a wide flat head with a jutting jaw full of mossy teeth, small sunken eyes burning dim amber beneath a heavy brow, thick arms ending in webbed clawed hands dragging through the mud, cattails and pond scum clinging to its hunched shoulders, its belly distended and mottled like a rotting log',
    creature_silhouette:
      'squat swamp troll with waterlogged bark skin, mossy teeth, webbed claws, rising from black water with pond scum on its shoulders',
    creature_count: '1',
    cm_cost: 2,
    keywords: ['Shield'],
    rarity: 'COMMON',
    card_type: 'CREATURE',
  },

  'fey-b03': {
    spec_id: 'fey-b03',
    faction_key: 'FEY_COURTS',
    creature_archetype: 'Briar Court Sentinel',
    creature_description:
      'A tall humanoid figure armored in plates of living briar and woven thorn-vine, its body a lattice of green and brown thorned wood with sap bleeding from every joint, a narrow face with hollow bark eye sockets glowing faint gold, antlers of twisted blackthorn rise from its temples, one arm ends in a shield-wall of interlocked bramble and the other in a serrated thorn-blade, its legs rooted into the ground with tendrils that rip free as it steps forward',
    creature_silhouette:
      'tall briar-armored sentinel with blackthorn antlers, golden knothole eyes, bramble shield arm, thorn-blade arm, rooted legs tearing free',
    creature_count: '1',
    cm_cost: 3,
    keywords: ['Taunt'],
    rarity: 'UNCOMMON',
    card_type: 'CREATURE',
  },

  'fey-b04': {
    spec_id: 'fey-b04',
    faction_key: 'FEY_COURTS',
    creature_archetype: 'Gilded Moth Dancer',
    creature_description:
      'A lithe moth-fey creature of the Gilded Canopy court with four iridescent wings patterned in gold and deep crimson like stained glass, a slender torso wrapped in living ivy and threads of spun sunlight, its face eerily beautiful and humanoid with enormous compound eyes reflecting amber light, long antennae trailing sparkling pollen dust, delicate clawed feet barely touching the ground as it hovers, its wingspan casting prismatic shadows across the forest floor',
    creature_silhouette:
      'lithe moth-fey with four gold-and-crimson stained-glass wings, ivy-wrapped body, humanoid face with compound eyes, trailing pollen dust',
    creature_count: '1',
    cm_cost: 4,
    keywords: ['Flying'],
    rarity: 'UNCOMMON',
    card_type: 'CREATURE',
  },

  'fey-b05': {
    spec_id: 'fey-b05',
    faction_key: 'FEY_COURTS',
    creature_archetype: 'Sporemound Elder',
    creature_description:
      'A massive hunched treant-like creature of the Mushroom Ring, its body a rotting log given shambling life, every surface colonized by shelf fungi in vivid orange and toxic green and deep violet, a weathered face of cracked bark peers out from within layers of mushroom growth with glowing amber eyes, enormous root-arms plunge into the mossy earth, around it a fairy ring of luminous teal mushrooms emits rising clouds of golden spores, branching networks of bioluminescent blue fungal threads pulse across the forest floor beneath it',
    creature_silhouette:
      'massive hunched treant covered in vivid shelf fungi, cracked-bark face with amber eyes, root-arms in earth, ringed by luminous mushrooms',
    creature_count: '1',
    cm_cost: 5,
    keywords: ['Lifesteal', 'Reach'],
    rarity: 'RARE',
    card_type: 'CREATURE',
  },

  'fey-b06': {
    spec_id: 'fey-b06',
    faction_key: 'FEY_COURTS',
    creature_archetype: 'Spider-Silk Weaver',
    creature_description:
      'A tall arachnid-fey hybrid with the upper body of an elongated pale-skinned fey and the lower body of a massive orb-weaver spider, eight jointed legs of chitin banded in silver and black supporting a bulbous silk-producing abdomen, four arms ending in delicate multi-jointed fingers that spin threads of luminous silk, its face sharp and angular with eight tiny pearl-white eyes arranged in a crown across its brow, wearing a mantle of its own woven web draped like royal vestments, strands of silk connecting it to the surrounding trees like a living puppet-master',
    creature_silhouette:
      'tall arachnid-fey hybrid with pale upper body, eight silver-banded spider legs, four silk-spinning arms, eight pearl eyes, web mantle',
    creature_count: '1',
    cm_cost: 6,
    keywords: ['Deathtouch', 'Reach'],
    rarity: 'RARE',
    card_type: 'CREATURE',
  },

  'fey-b07': {
    spec_id: 'fey-b07',
    faction_key: 'FEY_COURTS',
    creature_archetype: 'Hollow Court Stag',
    creature_description:
      'An enormous spectral stag of the Hollow Court standing in frozen winter forest, its skeletal frame visible through translucent ice-blue hide stretched drum-tight over massive bones, a crown of bone-white antlers spreads twelve points wide with frozen cobwebs strung between each tine, hooves of black ice crack the frozen ground, its ribcage is partially exposed and filled with drifting pale moths that flutter in and out between the bones, hollow eye sockets burn with cold blue foxfire, frost crystals form in the air with each breath from its fleshless muzzle, smaller spectral hounds with similar ice-blue hides circle at its hooves',
    creature_silhouette:
      'enormous spectral stag with translucent ice-blue hide over visible skeleton, twelve-point bone antlers with frozen cobwebs, moths in ribcage, foxfire eyes',
    creature_count: '1+minions',
    cm_cost: 7,
    keywords: ['Piercing', 'Taunt'],
    rarity: 'EPIC',
    card_type: 'CREATURE',
  },

  'fey-b08': {
    spec_id: 'fey-b08',
    faction_key: 'FEY_COURTS',
    creature_archetype: 'The Queen of Moths',
    creature_description:
      'A hauntingly beautiful insectoid fey queen with six enormous translucent moth wings that shimmer with hypnotic swirling patterns in purple and silver and pale gold, her body is elongated and willowy wrapped in layers of living spider silk that billow like robes, her face is alien and serene with enormous compound eyes reflecting hundreds of tiny moons, long segmented antennae trail bioluminescent pollen that falls like snow, she hovers just above the ground surrounded by a spiraling vortex of thousands of moths of every size from tiny to enormous, her presence drains all color from the surrounding landscape turning it to silver and gray while she alone radiates light, her six arms are folded in an eerie prayer gesture',
    creature_silhouette:
      'alien moth queen with six shimmering translucent wings, compound moon-reflecting eyes, six folded arms, surrounded by spiraling vortex of thousands of moths',
    creature_count: '1+minions',
    cm_cost: 9,
    keywords: ['Reach', 'Shield', 'Taunt'],
    rarity: 'LEGENDARY',
    card_type: 'CREATURE',
  },
};
