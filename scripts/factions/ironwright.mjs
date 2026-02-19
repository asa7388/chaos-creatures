// ironwright.mjs — Ironwright Collective faction data module
// Rethemed: brutalist space-industrial empire (NOT steampunk)
// Data sourced from supabase/functions/_shared/prompts.ts and faction expansion design

// ============================================================================
// SUB_FACTIONS — 2 Ironwright sub-factions
// ============================================================================
export const SUB_FACTIONS = [
  { name: 'The Foundry Directorate', flavor: 'Orbital shipyards, void-forge command, reactor oversight, cold-rolled policy, production quotas' },
  { name: 'The Scrap Legions', flavor: 'Planetary strip-mines, rebar infantry, slag-field combat, salvage operations, concrete siege engines' },
];

// ============================================================================
// ENVIRONMENTS — 13 environments matching prompts.ts FACTION_ENVS.IRONWRIGHT
// (brutalist space-industrial, NOT steampunk)
// ============================================================================
export const ENVIRONMENTS = [
  'inside a vast orbital shipyard, skeletal warship hulls under construction, welding arcs in vacuum, gantry cranes swinging reactor cores',
  'on a planetary strip-mine surface, terraced excavation descending into darkness, massive bucket-wheel excavators, exposed geological strata',
  'in a void-dock hangar, pressurized atmosphere behind mag-sealed bay doors, half-assembled fighters suspended on hydraulic arms',
  'inside a star-forge control room, banks of analog instruments, reactor readouts redlining, reinforced concrete blast walls',
  'on the exterior hull of a dreadnought under construction, workers in pressure suits welding rebar-reinforced plating, stars behind',
  'in a foundry command center, poured concrete walls lined with pipe conduits, holographic production manifests, iron blast doors',
  'inside a collapsing reactor chamber, emergency lighting, containment field failing, superheated coolant venting through ruptured pipes',
  'on a slag-field battlefield, twisted rebar and shattered concrete, wrecked war machines half-buried in industrial waste',
  'in a subterranean ore processing facility, conveyor belts carrying raw material through crushing and smelting stages, brutal scale',
  'atop a void-dock observation tower overlooking an armada of iron warships, engine exhaust trails visible against deep space',
  'inside an abandoned automaton graveyard, defunct mechanical bodies piled high in concrete silos, one sensor still flickering',
  'in a pressurized reactor hall, containment cylinders humming with barely-controlled energy, cold-rolled iron walkways, warning strobes',
  'on an elevated transit bridge spanning a canyon-scale factory complex, freight haulers rumbling past, industrial exhaust rising',
];

// ============================================================================
// MOODS — 10 moods with palettes (brutalist space-industrial)
// ============================================================================
export const MOODS = [
  { name: 'industrial_pride', description: 'Reactor glow through reinforced viewports', palette: 'reactor orange, cold iron gray, concrete white, warning amber' },
  { name: 'grim_labor', description: 'Harsh overhead strip lighting, deep shadows', palette: 'soot black, ash gray, dull orange, bruise purple' },
  { name: 'discovery_eureka', description: 'Bright arc-flash radiating outward', palette: 'white-hot core, electric blue, chrome silver, spark yellow' },
  { name: 'quiet_precision', description: 'Focused task lamp, deep void shadows', palette: 'warm cream, gunmetal, ink black, copper' },
  { name: 'catastrophic_failure', description: 'Red emergency strobes, venting atmosphere', palette: 'alarm red, exhaust white, smoke gray, reactor yellow' },
  { name: 'frontier_void', description: 'Star-field light, cold and vast', palette: 'void black, star white, reactor orange, cold steel blue' },
  { name: 'sacred_industry', description: 'Reactor light through concrete cathedral', palette: 'reactor amber, deep gunmetal, burnished iron, concrete gray' },
  { name: 'pressure_depths', description: 'Emergency lighting through pressurized atmosphere', palette: 'teal, corroded iron, dark navy, phosphorescent green' },
  { name: 'brutalist_grandeur', description: 'Harsh angular lighting on raw concrete', palette: 'concrete gray, cold-rolled iron, molten orange, shadow black' },
  { name: 'high_orbit_cold', description: 'Thin starlight, frost on hull plating', palette: 'ice-steel blue, frost white, reactor-glow orange, void black' },
];

// ============================================================================
// TEXTURES — brutalist space-industrial texture strings
// ============================================================================
export const TEXTURES = [
  'poured concrete rough and aggregate-flecked',
  'cold-rolled iron plate',
  'exposed rebar rusted and bent',
  'hydraulic piston rods with oil sheen',
  'riveted hull plating',
  'welded seam lines rough and raised',
  'corrugated iron sheeting',
  'reinforced blast glass cracked at edges',
  'industrial rubber gaskets',
  'carbon-scored exhaust nozzles',
  'reactor shielding lead-lined',
  'conduit pipe bundles clamped to walls',
  'mag-lock bolt heads in rows',
  'pressure-sealed hatch wheels',
  'stripped wire bundles copper and aluminum',
  'slag-cooled iron pitted and rough',
  'concrete aggregate with embedded gravel',
  'diamond-plate floor grating',
  'thermal insulation foam charred at edges',
  'vacuum-rated hull composite',
  'iron oxide rust in streaks and blooms',
  'coolant residue crystallized and blue-green',
  'warning paint stripes yellow and black',
  'weld-spatter patterns across flat surfaces',
  'crushed concrete dust',
  'heavy chain links industrial grade',
  'reactor coolant tubes translucent and glowing',
  'pressure gauge glass cracked and fogged',
];

// ============================================================================
// FACTION_PREFIX — from prompts.ts FACTION_PREFIXES.IRONWRIGHT
// ============================================================================
export const FACTION_PREFIX =
  'brutalist space-industrial construct, poured concrete and cold-rolled iron, exposed rebar, ' +
  'hydraulic pistons, orbital shipyard machinery, reactor glow, void-forge exhaust, ' +
  'in the style of Piranesi impossible architecture and John Martin apocalyptic industrial scale';

// ============================================================================
// COLORS — Ironwright Collective faction colors
// ============================================================================
export const COLORS = {
  primary: '#6B7B8D',   // industrial steel
  secondary: '#4A5568', // concrete gray
  accent: '#E07020',    // reactor orange
  reactor: '#3B82C4',   // coolant blue
  bg: '#1A1D23',        // void dark
};

// ============================================================================
// CARD_SPECS — 8 diverse Ironwright creatures across the full mana curve
// (brutalist space-industrial, NO steampunk references)
// ============================================================================
export const CARD_SPECS = {
  'iron-b01': {
    spec_id: 'iron-b01',
    faction_key: 'IRONWRIGHT',
    creature_archetype: 'Slag-Rat Scavenger',
    creature_description:
      'A small burrowing rodent-like construct with a body of welded scrap iron plates and exposed rebar ribs, its snout is a rotating diamond-tipped drill bit that spins lazily, beady sensor-lens eyes glow a dim amber through cracked glass housings, stubby legs end in shovel-shaped iron claws caked with ore dust, a segmented tail of interlocking hull washers drags behind it through the strip-mine rubble',
    creature_silhouette: 'small burrowing scrap-iron rodent with drill-bit snout, sensor-lens eyes, shovel claws, segmented hull-washer tail dragging through mine rubble',
    creature_count: '1',
    cm_cost: 1,
    keywords: [],
    rarity: 'COMMON',
    card_type: 'CREATURE',
  },
  'iron-b02': {
    spec_id: 'iron-b02',
    faction_key: 'IRONWRIGHT',
    creature_archetype: 'Rebar Drone',
    creature_description:
      'A compact hovering automaton no taller than a child, its body a crude cube of poured concrete reinforced with exposed rebar, four stubby thruster nozzles on its underside glow with reactor exhaust keeping it aloft, a single large sensor eye of cracked industrial glass dominates its front face, two articulated manipulator arms of cold-rolled iron extend from its sides ending in welding-torch fingers that spark intermittently, its surface is covered in warning stencils and production serial numbers',
    creature_silhouette: 'compact hovering concrete-and-rebar cube drone, single cracked sensor eye, two welding-torch manipulator arms, thruster exhaust below',
    creature_count: '1',
    cm_cost: 2,
    keywords: [],
    rarity: 'COMMON',
    card_type: 'CREATURE',
  },
  'iron-b03': {
    spec_id: 'iron-b03',
    faction_key: 'IRONWRIGHT',
    creature_archetype: 'Void-Forge Hound',
    creature_description:
      'A sleek predatory quadruped built from cold-rolled iron plates and hydraulic joints, reactor-charged capacitor spines run along its back crackling with arcs of pale blue energy, its jaw is a hinged mag-lock trap lined with serrated iron teeth, eyes are two spinning sensor arrays that throw off sparks, muscular haunches are hydraulic pistons that coil and flex, a whip-like antenna tail crackles with electromagnetic discharge as it stalks forward in a low predatory stance',
    creature_silhouette: 'sleek iron hunting hound with capacitor spines arcing blue energy, mag-lock trap jaw, sensor array eyes, hydraulic haunches',
    creature_count: '1',
    cm_cost: 3,
    keywords: ['Piercing'],
    rarity: 'UNCOMMON',
    card_type: 'CREATURE',
  },
  'iron-b04': {
    spec_id: 'iron-b04',
    faction_key: 'IRONWRIGHT',
    creature_archetype: 'Foundry Overseer',
    creature_description:
      'A tall gaunt humanoid in a long reactor-shielded greatcoat of reinforced canvas over a vest of interlocking iron scales, its face is a featureless iron plate with a single narrow sensor slit glowing amber, one hand is a data-slate interface covered in flickering readouts and the other grips a heavy containment lockbox chained to its wrist, conduit cables run from its collar down its spine like a mechanical nervous system, exhaust vents at elbow and knee joints',
    creature_silhouette: 'tall gaunt humanoid in reactor-shielded greatcoat, featureless iron plate face with amber sensor slit, data-slate hand, chained lockbox',
    creature_count: '1',
    cm_cost: 3,
    keywords: ['Shield'],
    rarity: 'UNCOMMON',
    card_type: 'CREATURE',
  },
  'iron-b05': {
    spec_id: 'iron-b05',
    faction_key: 'IRONWRIGHT',
    creature_archetype: 'Siege Breaker',
    creature_description:
      'A large four-legged walking siege engine armored in blast plates of poured concrete over an iron endoskeleton, its broad flat head is a battering ram with twin exhaust vents that belch acrid reactor waste, a row of pressure-triggered warhead nodules runs along its spine like dorsal fins glowing a warning cherry red, thick legs end in splayed iron claws designed for crushing fortifications, its long heavy tail is a segmented demolition flail tipped with a concrete wrecking ball reinforced with rebar',
    creature_silhouette: 'large armored siege-beast with battering-ram head venting exhaust, glowing warhead spines, demolition flail tail with concrete wrecking ball',
    creature_count: '1',
    cm_cost: 5,
    keywords: ['Piercing', 'Taunt'],
    rarity: 'RARE',
    card_type: 'CREATURE',
  },
  'iron-b06': {
    spec_id: 'iron-b06',
    faction_key: 'IRONWRIGHT',
    creature_archetype: 'Reactor Confessor',
    creature_description:
      'A towering robed figure in vestments of riveted iron plate and chain-link liturgical stoles, its head is a reactor containment vessel inverted as a helm with a single slit glowing reactor-orange, one massive hand swings a demolition hammer trailing ionized exhaust from pipe vents and the other clutches a manual of operations bound in hull plate with pages of stamped iron foil, its legs are reinforced concrete pylons bolted to iron sabatons, a halo of interlocking industrial gears and conduit rings rotates slowly behind its head',
    creature_silhouette: 'towering robed figure in riveted iron vestments, reactor-vessel helm glowing orange, swinging demolition hammer, industrial halo',
    creature_count: '1',
    cm_cost: 5,
    keywords: ['Shield', 'Lifesteal'],
    rarity: 'RARE',
    card_type: 'CREATURE',
  },
  'iron-b07': {
    spec_id: 'iron-b07',
    faction_key: 'IRONWRIGHT',
    creature_archetype: 'Void-Dock Leviathan',
    creature_description:
      'An enormous mechanical serpent assembled from riveted warship hull sections and reactor segments, its body surfaces from the debris field of an orbital shipyard in three massive coils, each segment bristling with point-defense turrets and anchor chains, the head is the armored prow of a dreadnought with a reinforced ram for a snout and viewport eyes glowing sickly reactor green, a command tower rises from its neck like a dorsal fin, exhaust vents along its spine send jets of pressurized reactor waste into the void, lesser maintenance drones swarm around it',
    creature_silhouette: 'enormous mechanical serpent of warship hulls and reactor segments, dreadnought-prow head with viewport eyes, command-tower dorsal fin, exhaust jets',
    creature_count: '1+minions',
    cm_cost: 7,
    keywords: ['Reach', 'Shield'],
    rarity: 'EPIC',
    card_type: 'CREATURE',
  },
  'iron-b08': {
    spec_id: 'iron-b08',
    faction_key: 'IRONWRIGHT',
    creature_archetype: 'The Iron Wyrm',
    creature_description:
      'A serpentine mechanical dragon that coils and slithers rather than stands, its body is an impossibly long chain of interlocking reactor segments connected by flexible armored joints, each segment has its own set of stumpy articulated legs like a centipede, the head is a reinforced concrete-and-iron jaw lined with hydraulic-driven teeth that snap open and shut rhythmically, six small red sensor-lens eyes cluster on each side of the wedge-shaped skull, a forest of exhaust stacks runs the length of its spine belching black reactor waste and orange embers, its coils wrap around and crush whatever is nearby, the tail ends in a massive flywheel turbine spinning at lethal speed',
    creature_silhouette: 'serpentine mechanical centipede-dragon of interlocking reactor segments, concrete-iron jaw, six red sensor eyes per side, exhaust stack spine, flywheel tail',
    creature_count: '1',
    cm_cost: 9,
    keywords: ['Taunt', 'Shield', 'Piercing'],
    rarity: 'LEGENDARY',
    card_type: 'CREATURE',
  },
};
