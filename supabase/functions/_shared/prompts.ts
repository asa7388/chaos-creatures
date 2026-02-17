// Chaos Creatures -- Centralized Prompt Builder
// Source of truth: docs/design/03-prompt-templates.md Sections 1-4
// All prompt construction for fal.ai (art) and OpenAI (text) lives here.
// Every art prompt starts with STYLE_ANCHOR to ensure visual consistency.

// =============================================================================
// 1. STYLE ANCHOR (Section 1.1) -- Prefixes EVERY image generation request
// =============================================================================

export const STYLE_ANCHOR =
  'fantasy card game art, painterly digital illustration, semi-realistic style, ' +
  'rich saturated colors with deep shadows and bright highlights, dramatic studio lighting, ' +
  'sharp focus on subject, subject centered and filling frame, card-portrait composition ' +
  '3:4 aspect ratio, no text, no borders, no frames, no UI elements, no watermarks, professional quality';

// =============================================================================
// 2. FACTION PREFIXES (Section 1.3) -- Used for base card art generation
// =============================================================================

// Faction ID normalization: DB uses DEMONIC_KINGDOMS, prompt system uses DEMONIC.
// All lookup maps support both forms. Use normalizeFactionId() in prompt builders.
export function normalizeFactionId(factionId: string): string {
  if (factionId === 'DEMONIC_KINGDOMS') return 'DEMONIC';
  return factionId;
}

const DEMONIC_PREFIX =
  'demonic corrupted dark fantasy creature, hellfire and deep shadow, obsidian and bone construction, ' +
  'infernal glyphs and runes, corrupted flesh with visible strain, volcanic ash and floating embers, ' +
  'blood-red and deep purple-black tones, visceral menacing presence';

export const FACTION_PREFIXES: Record<string, string> = {
  IRONWRIGHT:
    'steampunk mechanical creature, brass and copper materials, exposed gears and clockwork mechanisms, ' +
    'riveted metal plating, steam vents, intricate precision engineering, industrial Victorian aesthetic, ' +
    'warm metallic tones with amber and rust highlights, glowing amber lenses',
  FEY_COURTS:
    'ethereal fey fantasy creature, ancient forest setting, bioluminescent flora and glowing fungi, ' +
    'living wood and vine armor, mystical natural magic, soft moonlight and starlight illumination, ' +
    'organic flowing forms, moss and crystal accents, cool nature palette with silver and violet highlights',
  DEMONIC: DEMONIC_PREFIX,
  DEMONIC_KINGDOMS: DEMONIC_PREFIX, // DB alias
};

// =============================================================================
// 3. COMPOSITION INSTRUCTION (Section 1.3) -- Same for all factions
// =============================================================================

export const COMPOSITION_INSTRUCTION =
  'portrait orientation, centered creature filling 70 percent of frame, dramatic three-quarter view or frontal pose, ' +
  'simple contextual background not cluttered, clear distinct silhouette, card game art composition, ' +
  'eyes visible and facing viewer, dramatic directional lighting';

// =============================================================================
// 4. NEGATIVE PROMPTS (Section 1.3)
// =============================================================================

export const NEGATIVE_PROMPT_BASE =
  'text, words, letters, watermarks, signatures, logos, borders, frames, NSFW, explicit content, ' +
  'gore, low quality, blurry, distorted anatomy, multiple heads, deformed limbs, floating objects, ' +
  'extra limbs, fused body parts, speech bubbles, comic panels, grid layout, white background, collage';

export const NEGATIVE_PROMPT_EVOLUTION =
  'text, words, letters, watermarks, signatures, logos, borders, frames, NSFW, explicit content, ' +
  'gore, low quality, blurry, distorted anatomy, multiple heads, deformed limbs, floating objects';

// =============================================================================
// 5. EVOLUTION DIRECTION INSTRUCTIONS (Section 1.4)
// =============================================================================

export const ORDER_INSTRUCTION =
  'Transform this creature with Order energy. Refine and structure the design. ' +
  'Add crystalline geometric patterns growing from the surface, luminous blue-white-gold Order energy ' +
  'emanating from within, refined and polished armor or outer casing, symmetrical ordered enhancements, ' +
  'harmonious growth. Subtle transformation \u2014 the creature should remain clearly recognizable.';

export const CHAOS_INSTRUCTION =
  'Transform this creature with Chaos energy. Dramatically alter the design with wild volatile energy. ' +
  'Add fractured asymmetric elements, red-purple crackling Chaos energy surging through and around the creature, ' +
  'jagged edges and distorted proportions, volatile auras, surging unstable power. ' +
  'Dramatic transformation \u2014 retain core identity but push toward the extreme.';

// =============================================================================
// 6. FACTION SHORT DESCRIPTIONS (Section 1.4) -- Used in evolution prompts
// =============================================================================

export const FACTION_SHORT_DESCRIPTIONS: Record<string, string> = {
  IRONWRIGHT: 'steampunk industrial brass-and-gears',
  FEY_COURTS: 'ethereal fey nature bioluminescent',
  DEMONIC: 'dark infernal demonic hellfire',
  DEMONIC_KINGDOMS: 'dark infernal demonic hellfire',
};

// =============================================================================
// 7. EVOLUTION HISTORY CONTEXT (Section 1.4)
// =============================================================================

export interface EvolutionRecord {
  actual_outcome: 'ORDER' | 'CHAOS';
  name_chosen?: string;
}

export function getHistoryContext(history: EvolutionRecord[]): string {
  if (history.length === 0) return '';
  const chaosCount = history.filter((r) => r.actual_outcome === 'CHAOS').length;
  const orderCount = history.filter((r) => r.actual_outcome === 'ORDER').length;

  if (chaosCount === 0)
    return 'This creature has been shaped entirely by Order energy, showing crystalline perfection and structured harmony. This evolution continues that refinement.';
  if (orderCount === 0)
    return 'This creature has been wracked entirely by Chaos energy, showing fractured volatile forms barely held together. This evolution pushes further into dissolution.';
  if (chaosCount >= orderCount + 2)
    return 'This creature carries deep Chaos corruption \u2014 fractured volatile forms \u2014 but now Order energy attempts to crystallize and contain it.';
  if (orderCount >= chaosCount + 2)
    return 'This creature carries strong Order patterning \u2014 structured crystalline elements \u2014 but now Chaos energy breaks through the cracks.';
  return 'This creature carries both Order crystallization and Chaos fracturing in equal measure, a volatile balance of structured and wild energy.';
}

// =============================================================================
// 8. VISUAL MODIFIER PROMPT DESCRIPTIONS (Section 1.6)
// =============================================================================

export const MODIFIER_PROMPT_DESCRIPTIONS: Record<string, string> = {
  // Universal Modifiers (U01-U30)
  U01: 'eyes now glow with intense ethereal light in a contrasting color to the faction palette',
  U02: 'visible battle damage across the surface \u2014 dents, cracks, scorch marks, scratches earned through combat',
  U03: 'additional protective plating or natural armor covering more of the body, reinforced and layered',
  U04: 'arcs of crackling energy discharging across the surface in the faction\'s energy color',
  U05: 'deep shadows pooling around the creature, partially obscuring details, wreathed in darkness',
  U06: 'points of soft glowing light emanating from key features, inner light shining through joints or seams',
  U07: 'aged and worn appearance suggesting great age, weathering, and history \u2014 worn edges, faded markings',
  U08: 'immaculate condition with a polished gleaming finish, perfect surfaces, no wear, idealized form',
  U09: 'swirling elemental energy aura surrounding the creature \u2014 fire, ice, or lightning trails in motion',
  U10: 'crystals growing from the creature\'s surface, geometric and ordered, catching and refracting light',
  U11: 'ghostly translucent afterimage trails following motion, as if the creature is partially phasing between planes',
  U12: 'ancient runes and symbols carved or etched into the surface, glowing faintly',
  U13: 'additional eyes appearing across the body \u2014 some open, some half-closed, all aware',
  U14: 'large impressive wings unfurling \u2014 feathered, membranous, or constructed depending on faction',
  U15: 'the creature appears larger and more imposing, taking up more of the frame with increased presence',
  U16: 'parts of the body transform into a different material \u2014 stone, pure crystal, liquid metal',
  U17: 'soft overall ethereal luminescence, the creature partially translucent with inner light',
  U18: 'intricate ornamental decorations added to key features \u2014 filigree, emblems, ceremonial markings',
  U19: 'bold painted or scarified tribal or clan markings across the body in contrasting pigment',
  U20: 'the color palette splits \u2014 one side or element shifts to a contrasting color suggesting internal conflict',
  U21: 'a visible tear in reality behind or around the creature, showing glimpses of another plane through the rift',
  U22: 'two opposing elements fused visually on the creature \u2014 fire and ice simultaneously, light and shadow coexisting',
  U23: 'elements of the design that defy physical logic \u2014 recursive patterns, surfaces that fold into themselves',
  U24: 'visual blur artifacts suggesting motion through time, multiple overlapping ghost positions of the same creature',
  U25: 'rainbow light diffraction patterns spreading from the creature, prismatic halos and refracted spectrum light',
  U26: 'patches of absolute nothingness \u2014 not shadow but true void \u2014 seeping into parts of the form',
  U27: 'cosmic energy and starfield patterns woven into the form, nebula colors deep in the surface',
  U28: 'the creature appears in multiple slightly offset overlapping versions, as if existing in several states at once',
  U29: 'the creature has begun ascending beyond its physical form \u2014 parts dissolving into pure energy while the core remains',
  U30: 'a faint inverted reflection of the creature visible around it, as if its dimension-shadow is showing',

  // Ironwright Collective Faction Modifiers (IF01-IF28)
  IF01: 'additional reinforced gear clusters installed at key joints, oversized and heavy-duty',
  IF02: 'multiple high-pressure steam vents erupting from the chassis in dramatic plumes',
  IF03: 'large visible hydraulic cylinders extending and contracting along the limbs',
  IF04: 'gear assemblies and rings visibly spinning and rotating as if running at high speed',
  IF05: 'electrical arc discharges jumping between exposed metal components and conductors',
  IF06: 'surfaces polished to mirror-chrome perfection, every reflection crisp and metallic',
  IF07: 'gears and components glowing red-hot from extreme overclocking, heat shimmer visible',
  IF08: 'modular weapon systems bolted onto chassis \u2014 barrels, blades, or energy emitters',
  IF09: 'steam pressure vents glowing amber-orange from contained thermal energy about to release',
  IF10: 'concentric gyroscopic stabilizer rings orbiting the main body, spinning counterrotating',
  IF11: 'decorative copper filigree scrollwork added to armor plates in intricate patterns',
  IF12: 'additional heavy riveting over seams and plating, studded reinforcement pattern',
  IF13: 'a section of outer plating removed revealing complex internal clockwork mechanisms inside',
  IF14: 'tall brass antennae or sensory arrays extending from the head or shoulders',
  IF15: 'visible pneumatic tube connections between joint segments, pressurized and pulsing',
  IF16: 'colored indicator lights across the chassis blinking in patterns, amber and red status arrays',
  IF17: 'a secondary outer shell of thick iron plates adding bulk and imposing defensive mass',
  IF18: 'heavy chains connecting major moving components, mechanical drive system visible externally',
  IF19: 'a glowing core visible through the chest \u2014 a mechanism that runs without external power, impossibly',
  IF20: 'gears that phase in and out of visibility, existing in multiple positions simultaneously',
  IF21: 'pistons that extend into a pocket dimension, disappearing and reappearing as they cycle',
  IF22: 'a miniature singularity visible behind a crystal viewport in the chest, bending space slightly',
  IF23: 'gears visibly running in reverse \u2014 counter-time mechanisms with timeline artifact trails',
  IF24: 'a cloud of microscopic mechanical drones swarming around the creature as an extension of itself',
  IF25: 'a reactor core glowing with violent antimatter annihilation light, containment field visible',
  IF26: 'thick bolts of energy anchoring the creature to the physical plane as if it might otherwise transcend',
  IF27: 'the creature\'s internals visible as a four-dimensional hypercube structure folding through itself',
  IF28: 'mechanisms that contain smaller versions of themselves in an infinite regression visible through transparent panels',

  // Fey Courts Faction Modifiers (FF01-FF28)
  FF01: 'small flowers blooming across the vine and bark armor in symmetrical natural patterns',
  FF02: 'the antlers grow larger and more elaborate, branching with additional points and natural curves',
  FF03: 'bioluminescent mycelial threads extending from the body connecting to the ground or air around it',
  FF04: 'portions of the leaf and vine elements shifting to autumn colors \u2014 crimson, orange, gold',
  FF05: 'soft starlight emanating from within the creature, points of light moving slowly around it',
  FF06: 'deep root systems visible extending from the creature\'s feet or lower body into the ground',
  FF07: 'eyes shift to predatory feral glow \u2014 sharp and intense like an apex nocturnal predator mid-hunt',
  FF08: 'moon phase symbols appearing across the armor like natural markings, crescent to full',
  FF09: 'sharp defensive thorns erupting from joints and edges of the natural armor',
  FF10: 'bright bioluminescent veins running through bark and wood like a circulatory system, pulsing softly',
  FF11: 'ice crystals forming on the creature\'s natural elements \u2014 winter encroaching on the fey form',
  FF12: 'a drifting cloud of luminescent pollen or spores surrounding the creature',
  FF13: 'small tree branches growing from the shoulder or head area, leafed out as a natural crown',
  FF14: 'large bioluminescent mushroom caps growing from the back or shoulders as natural protrusions',
  FF15: 'smooth river-worn stones embedded naturally into the bark armor like embedded gems',
  FF16: 'large moth or luna moth wings unfurled behind the creature, patterned with eye markings',
  FF17: 'gossamer spider silk reinforcing the bark armor like natural chainmail, dew-beaded',
  FF18: 'pale ethereal coral formations growing across portions of the figure as natural enchantment',
  FF19: 'a golden thread of light connecting the creature up to the sky where the World Tree exists',
  FF20: 'sections of the creature blurring into dream-reality, fuzzy edges with dream imagery seeping through',
  FF21: 'all four seasons visible simultaneously across the creature \u2014 winter frost, spring bloom, summer green, autumn red',
  FF22: 'the creature reverts toward its oldest primal shape \u2014 older, rawer, more powerful and less refined',
  FF23: 'the creature\'s surface becomes a star map, constellations visible like glowing freckles',
  FF24: 'tiny animals and insects living on the creature as part of its form \u2014 symbiotic organisms visible',
  FF25: 'flowers rapidly blooming and dying in fast-forward cycle, life and death simultaneous on the form',
  FF26: 'a crown of living light and antler materializing above the creature\'s head, a mark of fey royalty',
  FF27: 'storm energy conducting through the natural elements \u2014 lightning following the root and vine paths',
  FF28: 'a concentrated point of green-gold life energy at the chest, from which all natural energy radiates',

  // Demonic Kingdoms Faction Modifiers (DF01-DF28)
  DF01: 'the creature engulfed in a hellfire corona, active flames licking across corrupted flesh and armor',
  DF02: 'jagged bone spurs erupting from joints and edges of the corrupted flesh',
  DF03: 'glowing molten lava cracks running through the flesh and armor like veins of liquid fire',
  DF04: 'infernal runes etched across the body glowing with intense crimson power',
  DF05: 'writhing shadow tendrils extending from the creature, partially corporeal and reaching',
  DF06: 'blood ritual markings across the body \u2014 ancient symbols painted in dark ichor',
  DF07: 'corrupted flesh pulsing with dark energy, visible distortion waves emanating outward',
  DF08: 'thick sulfurous yellow-gray smoke rising from the creature, the smell of brimstone implied',
  DF09: 'large leathery demon wings unfurled fully, membranes stretched, imposing span',
  DF10: 'an intense crown of hellfire above the head, brighter and more aggressive than standard flame',
  DF11: 'obsidian crystal spikes growing from the armor and flesh, black volcanic glass sharp-edged',
  DF12: 'dark supernatural ichor dripping from wounds or edges, pooling slightly below',
  DF13: 'patches of necrotic energy decay visible in the flesh, dark purple-black corruption spreading',
  DF14: 'skull imagery carved into or growing from the armor, demonic heraldry of death',
  DF15: 'heavy cursed chains wrapped around parts of the creature, glowing with infernal sigils',
  DF16: 'additional demonic eyes opening across the body \u2014 multi-pupiled and glowing',
  DF17: 'a visible sphere of consuming void darkness at the chest, pulling light inward',
  DF18: 'ash and cinders constantly falling from the creature as it moves, leaving a trail',
  DF19: 'a visible portal to the demon plane at the creature\'s chest \u2014 a window into the abyss',
  DF20: 'the creature exists across multiple planes simultaneously, translucent demon-plane versions visible overlapping',
  DF21: 'a massive divine sigil of a chaos god hovering above or behind the creature, crackling',
  DF22: 'an aura of consuming hunger, visible as wisps of light being drawn into the creature from around it',
  DF23: 'the volcanic hellscape terrain literally merging with the creature \u2014 rock and lava becoming part of its form',
  DF24: 'wings that transform into something beyond demonic \u2014 larger, stranger, partly cosmic',
  DF25: 'a blood-red moon visible as a halo behind the creature\'s head, infernal light source',
  DF26: 'a fragment of obsidian infernal throne materialized behind the creature, marking it as a ruler',
  DF27: 'the creature radiates an apocalyptic aura \u2014 cracks in reality spreading behind it, worlds ending at its back',
  DF28: 'one of the cardinal sins made visually manifest on the form \u2014 wrath, pride, or hunger given shape',
};

// =============================================================================
// 9. TECHNICAL PARAMETERS BY SHARD QUALITY (Section 1.5)
// =============================================================================

export type ShardQuality = 'PLANAR' | 'REFINED' | 'PRISMATIC';
export type EvolutionOutcome = 'ORDER' | 'CHAOS';
export type Tier = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export const ENDPOINT_MAP: Record<ShardQuality, string> = {
  PLANAR: 'fal-ai/flux-kontext/dev',
  REFINED: 'fal-ai/flux-kontext/pro',
  PRISMATIC: 'fal-ai/flux-kontext/pro',
};

export const IMAGE_SIZE_MAP: Record<ShardQuality, string> = {
  PLANAR: 'portrait_4_3',
  REFINED: 'square_hd',
  PRISMATIC: 'square_hd',
};

export const STEPS_MAP: Record<ShardQuality, number> = {
  PLANAR: 28,
  REFINED: 32,
  PRISMATIC: 40,
};

export const GUIDANCE_MAP: Record<ShardQuality, number> = {
  PLANAR: 7.0,
  REFINED: 7.5,
  PRISMATIC: 8.0,
};

/** Denoising strength by evolution outcome and FROM tier (Section 1.5) */
export const STRENGTH_TABLE: Record<EvolutionOutcome, Record<string, number>> = {
  ORDER: { COMMON: 0.35, UNCOMMON: 0.40, RARE: 0.45, EPIC: 0.50 },
  CHAOS: { COMMON: 0.65, UNCOMMON: 0.70, RARE: 0.75, EPIC: 0.80 },
};

// =============================================================================
// 10. FAL.AI REQUEST/RESPONSE TYPES
// =============================================================================

export interface FalAiBaseCardRequest {
  prompt: string;
  negative_prompt: string;
  image_size: string;
  num_inference_steps: number;
  guidance_scale: number;
  num_images: 1;
  enable_safety_checker: true;
  output_format: 'webp';
}

export interface FalAiEvolutionRequest extends FalAiBaseCardRequest {
  image_url: string;
  strength: number;
}

export interface FalAiResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  timings: { inference: number };
  seed: number;
  has_nsfw_concepts: boolean[];
}

// =============================================================================
// 11. PROMPT BUILDER FUNCTIONS
// =============================================================================

/**
 * Build a base card art prompt for fal.ai FLUX Dev (txt2img).
 * Used during batch generation pipeline.
 */
export function buildArtPrompt(
  factionId: string,
  creatureDescription: string,
  compositionOverride?: string
): FalAiBaseCardRequest {
  const factionPrefix = FACTION_PREFIXES[factionId];
  if (!factionPrefix) {
    throw new Error(`Unknown faction: ${factionId}. Expected IRONWRIGHT, FEY_COURTS, or DEMONIC.`);
  }

  const composition = compositionOverride || COMPOSITION_INSTRUCTION;

  const prompt = [STYLE_ANCHOR, factionPrefix, creatureDescription, composition].join(', ');

  return {
    prompt,
    negative_prompt: NEGATIVE_PROMPT_BASE,
    image_size: 'portrait_4_3',
    num_inference_steps: 35,
    guidance_scale: 7.5,
    num_images: 1,
    enable_safety_checker: true,
    output_format: 'webp',
  };
}

export interface EvolutionPromptInput {
  factionId: string;
  artUrl: string;
  evolutionOutcome: EvolutionOutcome;
  selectedModifierId: string;
  fromTier: Tier;
  shardQuality: ShardQuality;
  evolutionHistory: EvolutionRecord[];
}

export interface EvolutionPromptResult {
  endpoint: string;
  body: FalAiEvolutionRequest;
  needsSecondPass: boolean;
}

/**
 * Build an evolution art prompt for fal.ai FLUX Kontext (img2img).
 * Used during player evolution flow.
 */
export function buildEvolutionPrompt(input: EvolutionPromptInput): EvolutionPromptResult {
  const {
    factionId,
    artUrl,
    evolutionOutcome,
    selectedModifierId,
    fromTier,
    shardQuality,
    evolutionHistory,
  } = input;

  const directionInstruction =
    evolutionOutcome === 'ORDER' ? ORDER_INSTRUCTION : CHAOS_INSTRUCTION;

  const historyContext = getHistoryContext(evolutionHistory);

  const modifierDescription = MODIFIER_PROMPT_DESCRIPTIONS[selectedModifierId];
  if (!modifierDescription) {
    throw new Error(`Unknown modifier ID: ${selectedModifierId}`);
  }

  const factionShort = FACTION_SHORT_DESCRIPTIONS[factionId];
  if (!factionShort) {
    throw new Error(`Unknown faction: ${factionId}`);
  }

  const prompt = [
    STYLE_ANCHOR,
    directionInstruction,
    historyContext,
    `Apply these specific visual changes: ${modifierDescription}.`,
    `Maintain the ${factionShort} aesthetic throughout.`,
    'Portrait orientation, centered composition, no text, no watermarks.',
  ]
    .filter(Boolean)
    .join(' ');

  const strength = STRENGTH_TABLE[evolutionOutcome][fromTier];
  if (strength === undefined) {
    throw new Error(`No strength value for outcome=${evolutionOutcome}, tier=${fromTier}`);
  }

  return {
    endpoint: ENDPOINT_MAP[shardQuality],
    body: {
      image_url: artUrl,
      prompt,
      negative_prompt: NEGATIVE_PROMPT_EVOLUTION,
      image_size: IMAGE_SIZE_MAP[shardQuality],
      num_inference_steps: STEPS_MAP[shardQuality],
      guidance_scale: GUIDANCE_MAP[shardQuality],
      strength,
      num_images: 1,
      enable_safety_checker: true,
      output_format: 'webp',
    },
    needsSecondPass: shardQuality === 'PRISMATIC',
  };
}

/**
 * Build the Prismatic second-pass refinement request.
 * Only called when shardQuality === 'PRISMATIC'.
 */
export function buildPrismaticRefinementRequest(
  firstPassOutputUrl: string,
  originalPrompt: string
): FalAiEvolutionRequest {
  return {
    image_url: firstPassOutputUrl,
    prompt: `Enhance lighting quality, sharpen details, improve overall fidelity without changing the composition or design. ${originalPrompt}`,
    negative_prompt: NEGATIVE_PROMPT_EVOLUTION,
    image_size: 'square_hd',
    num_inference_steps: 20,
    guidance_scale: 8.0,
    strength: 0.20,
    num_images: 1,
    enable_safety_checker: true,
    output_format: 'webp',
  };
}

// =============================================================================
// 12. TEXT GENERATION PROMPTS (Section 2)
// =============================================================================

const DEMONIC_NAME_VOICE = 'Visceral and direct. Use dark materials: Ash, Bone, Blood, Shadow, Flame, Cinder, Ruin, Void. Use violent action: Reaver, Ripper, Render, Scar, Breaker. Use infernal titles: Tyrant, Lord, Unbound, Forsaken, Damned, Herald. Direct hard sounds preferred.';

export const FACTION_NAME_VOICES: Record<string, string> = {
  IRONWRIGHT:
    'Industrial and precise. Use engineering terminology: Cogwork, Piston, Valve, Forged, Tempered, Wrought, Clockwork. Use functional titles: Warden, Sentinel, Overseer, Architect. Reference places of craft: Forge, Foundry, Crucible, Anvil. Compound nouns preferred.',
  FEY_COURTS:
    'Lyrical and ancient. Use nature terms: Thorn, Root, Bloom, Vine, Grove, Glade, Moss. Use fey titles: Lord, Lady, Warden, Huntress, Speaker, Court. Use seasons and celestial: Spring, Autumn, Moon, Star, Dawn. Use mythic descriptors: Verdant, Eternal, Wild, Ancient. Poetic structures preferred.',
  DEMONIC: DEMONIC_NAME_VOICE,
  DEMONIC_KINGDOMS: DEMONIC_NAME_VOICE,
};

const DEMONIC_FLAVOR_TONE = 'Visceral and direct. Emphasizes power, sacrifice, consumption, and hunger. Order = controlled fury, pacts honored in blood, restrained corruption. Chaos = unbound carnage, self-immolation for power, apocalyptic hunger. Tone is declarative and ominous \u2014 short sentences like dark scripture.';

export const FACTION_FLAVOR_TONES: Record<string, string> = {
  IRONWRIGHT:
    'Technical reverence for craftsmanship. Emphasizes function, precision, and engineering. Order = perfected systems, harmonious mechanisms. Chaos = overloaded, screaming gears, design pushed beyond limits. Tone is clipped and declarative \u2014 short sentences that sound like engineer\'s notes.',
  FEY_COURTS:
    'Ancient and lyrical. Emphasizes cycles, memory, wildness, and time. Order = harmony with nature, patient growth, eternal memory. Chaos = the wild hunt, primal fury, untamed power that predates civilization. Tone is poetic but not flowery \u2014 spare and weighted with age.',
  DEMONIC: DEMONIC_FLAVOR_TONE,
  DEMONIC_KINGDOMS: DEMONIC_FLAVOR_TONE,
};

export const FACTION_DISPLAY_NAMES: Record<string, string> = {
  IRONWRIGHT: 'The Ironwright Collective',
  FEY_COURTS: 'The Fey Courts',
  DEMONIC: 'The Demonic Kingdoms',
  DEMONIC_KINGDOMS: 'The Demonic Kingdoms',
};

export interface NamingPromptInput {
  factionId: string;
  templateBaseName: string;
  toTier: string;
  evolutionOutcome: EvolutionOutcome;
  evolutionHistory: EvolutionRecord[];
  previousNames: string[];
}

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIRequestBody {
  model: string;
  temperature: number;
  max_tokens: number;
  messages: OpenAIMessage[];
  response_format?: { type: string };
}

/**
 * Build the naming prompt for GPT-4o Mini (evolution name generation).
 * Returns 3 candidates; the client presents them for player selection.
 */
export function buildNamingPrompt(input: NamingPromptInput): OpenAIRequestBody {
  const {
    factionId,
    templateBaseName,
    toTier,
    evolutionOutcome,
    evolutionHistory,
    previousNames,
  } = input;

  const factionVoice = FACTION_NAME_VOICES[factionId];
  if (!factionVoice) throw new Error(`Unknown faction: ${factionId}`);

  const factionDisplayName = FACTION_DISPLAY_NAMES[factionId];
  const chaosCount = evolutionHistory.filter((r) => r.actual_outcome === 'CHAOS').length;
  const orderCount = evolutionHistory.filter((r) => r.actual_outcome === 'ORDER').length;
  const mostRecentName = previousNames[previousNames.length - 1] || templateBaseName;

  const userPrompt = `FACTION: ${factionDisplayName}
FACTION VOICE: ${factionVoice}
BASE NAME: ${templateBaseName}
EVOLUTION TIER: ${toTier}
EVOLUTION DIRECTION: ${evolutionOutcome}
EVOLUTION HISTORY: ${chaosCount} Chaos evolutions, ${orderCount} Order evolutions before this one
PREVIOUS NAMES: ${JSON.stringify(previousNames)}

Generate exactly 3 card name candidates. Rules:
- 2 to 4 words maximum per name
- Must match the faction voice exactly
- Must reflect evolution toward ${evolutionOutcome}
- Must show progression from the most recent name: "${mostRecentName}"
- Order evolution names: suggest refinement, structure, titles, crystallization, mastery
- Chaos evolution names: suggest power, wildness, corruption, rage, transformation
- Do not reuse any name from PREVIOUS NAMES

Return ONLY this JSON array, nothing else:
["Name One", "Name Two", "Name Three"]`;

  return {
    model: 'gpt-4o-mini',
    temperature: 0.8,
    max_tokens: 100,
    messages: [
      {
        role: 'system',
        content:
          'You are a card name generator for a fantasy card game called Chaos Creatures. You output only valid JSON. Never include explanations, preambles, or any text outside the JSON array.',
      },
      { role: 'user', content: userPrompt },
    ],
  };
}

export interface FlavorTextPromptInput {
  factionId: string;
  chosenName: string;
  toTier: string;
  evolutionOutcome: EvolutionOutcome;
  previousFlavorText: string;
}

/**
 * Build the flavor text prompt for GPT-4o Mini.
 * Returns a single flavor text string, max 120 characters.
 */
export function buildFlavorTextPrompt(input: FlavorTextPromptInput): OpenAIRequestBody {
  const { factionId, chosenName, toTier, evolutionOutcome, previousFlavorText } = input;

  const factionTone = FACTION_FLAVOR_TONES[factionId];
  if (!factionTone) throw new Error(`Unknown faction: ${factionId}`);

  const factionDisplayName = FACTION_DISPLAY_NAMES[factionId];

  const userPrompt = `FACTION: ${factionDisplayName}
FACTION TONE: ${factionTone}
CARD NAME: ${chosenName}
EVOLUTION TIER: ${toTier}
EVOLUTION DIRECTION: ${evolutionOutcome}
PREVIOUS FLAVOR TEXT: "${previousFlavorText}"

Write exactly one flavor text entry. Rules:
- 1 to 2 sentences maximum
- Maximum 120 characters total
- Matches the faction tone
- Reflects evolution toward ${evolutionOutcome}
- Does NOT reference game mechanics or stats
- Stands alone without needing context
- Order tone: reverent, structured, protective, patient, wise
- Chaos tone: fierce, ominous, powerful, unstable, consuming

Output only the flavor text, nothing else.`;

  return {
    model: 'gpt-4o-mini',
    temperature: 0.8,
    max_tokens: 80,
    messages: [
      {
        role: 'system',
        content:
          'You are a flavor text writer for a fantasy card game called Chaos Creatures. You write short evocative lore snippets. You output only the flavor text string \u2014 no quotes, no labels, no other text.',
      },
      { role: 'user', content: userPrompt },
    ],
  };
}

export interface NarrativePromptInput {
  factionId: string;
  previousName: string;
  chosenName: string;
  evolutionOutcome: EvolutionOutcome;
  modifierDisplayName: string;
}

/**
 * Build the evolution narrative prompt for GPT-4o Mini.
 * Only generated for Epic and Legendary evolutions.
 * Returns 2-3 sentence narrative for the evolution ceremony.
 */
export function buildNarrativePrompt(input: NarrativePromptInput): OpenAIRequestBody {
  const { factionId, previousName, chosenName, evolutionOutcome, modifierDisplayName } = input;

  const factionDisplayName = FACTION_DISPLAY_NAMES[factionId];

  const userPrompt = `FACTION: ${factionDisplayName}
CREATURE NAME BEFORE: ${previousName}
CREATURE NAME AFTER: ${chosenName}
EVOLUTION DIRECTION: ${evolutionOutcome}
VISUAL CHANGES: ${modifierDisplayName}

Write a 2 to 3 sentence narrative describing the moment the Planar Shard channels chaos energy and transforms this creature. Match the faction voice exactly. Order evolutions: tone is reverent, structured, a controlled transformation. Chaos evolutions: tone is violent, explosive, transcendent through destruction. Reference the visual change described in VISUAL CHANGES.

Output only the narrative, nothing else.`;

  return {
    model: 'gpt-4o-mini',
    temperature: 0.8,
    max_tokens: 200,
    messages: [
      {
        role: 'system',
        content:
          'You are writing evolution narrative text for a fantasy card game called Chaos Creatures. You output only the narrative text \u2014 no labels, no formatting, no other text.',
      },
      { role: 'user', content: userPrompt },
    ],
  };
}

/**
 * Build the base card text prompt for batch generation.
 * Generates name + flavor_text for initial card template creation.
 */
export function buildBaseCardTextPrompt(
  factionId: string,
  creatureArchetype: string,
  stats: { attack: number; health: number; cmCost: number; instability: number },
  keywords: string[],
  visualDescription: string
): OpenAIRequestBody {
  const factionVoice = FACTION_NAME_VOICES[factionId];
  if (!factionVoice) throw new Error(`Unknown faction: ${factionId}`);

  const factionDisplayName = FACTION_DISPLAY_NAMES[factionId];
  const factionTone = FACTION_FLAVOR_TONES[factionId];

  const instabilityDesc =
    stats.instability <= 1
      ? 'stable and composed'
      : stats.instability <= 3
        ? 'balanced'
        : 'volatile and aggressive';

  const userPrompt = `Generate a card name and flavor text for this card.

FACTION: ${factionDisplayName}
FACTION VOICE: ${factionVoice}
FACTION TONE: ${factionTone}
CREATURE ARCHETYPE: ${creatureArchetype}
STATS: ${stats.attack} ATK / ${stats.health} HP, ${stats.cmCost} chaos mote cost
INSTABILITY: ${stats.instability} (${instabilityDesc})
KEYWORDS: ${keywords.length > 0 ? keywords.join(', ') : 'none'}
VISUAL DESCRIPTION: ${visualDescription}

Generate:
1. Card name: 2-4 words, faction-appropriate, memorable
2. Flavor text: 1-2 sentences, under 120 characters, faction voice

Respond ONLY with this JSON:
{"name": "...", "flavor_text": "..."}`;

  return {
    model: 'gpt-4o-mini',
    temperature: 0.8,
    max_tokens: 150,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are a card name and flavor text generator for Chaos Creatures, a fantasy card game. Always respond with valid JSON only.',
      },
      { role: 'user', content: userPrompt },
    ],
  };
}
