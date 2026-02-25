// Chaos Creatures Admin Dashboard — Faction Prompt Templates
// Encodes production art generation settings and per-faction material prompts.
// Model: asa7388/chscrt-sdxl-lora-v2-sdxl (SDXL LoRA v2, no trigger token needed).
// Settings derived from smoke testing: 1024x1432, lora_scale 0.6.

export const REPLICATE_MODEL = 'asa7388/chscrt-sdxl-lora-v2-sdxl';

export const GENERATION_SETTINGS = {
  width: 1024,
  height: 1432,
  lora_scale: 0.6,
  apply_watermark: false,
  disable_safety_checker: true,
};

export const BASE_NEGATIVE_PROMPT =
  'signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo, stamp, copyright, initials';

interface FactionPromptConfig {
  materialSuffix: string;
  negativePrompt: string;
  factionId?: string; // populated at runtime from Supabase
}

export const FACTION_PROMPTS: Record<string, FactionPromptConfig> = {
  ironwright: {
    materialSuffix:
      'painted directly onto cold iron plate, brushstrokes catching on rivets and hammer marks, metallic grey ground showing through thin paint, oil paint on iron',
    negativePrompt: BASE_NEGATIVE_PROMPT,
  },
  fey: {
    materialSuffix:
      'painted directly onto pale birch bark, paint pooling in the natural grooves of the bark, warm white ground showing through, oil paint on birch bark',
    negativePrompt: BASE_NEGATIVE_PROMPT,
  },
  demonic: {
    materialSuffix:
      'painted directly onto cured dark leather hide, paint cracking along the leather grain, deep brown ground tone showing through, oil paint on leather',
    negativePrompt: `${BASE_NEGATIVE_PROMPT}, stamp, copyright, initials`,
  },
  celestial: {
    materialSuffix:
      'painted directly onto fine vellum, paint sitting on the membrane surface, vellum slightly luminous and translucent at the thinner areas, warm cream ground showing through thin paint, oil paint on vellum',
    negativePrompt: `${BASE_NEGATIVE_PROMPT}, biblical, religious, Renaissance, classical, Christian`,
  },
  endless: {
    materialSuffix:
      'painted directly onto ancient bone-dark parchment, dark pigments soaking into the fibrous surface, parchment grain visible through thin washes, oil paint on parchment',
    negativePrompt: BASE_NEGATIVE_PROMPT,
  },
};

export const CREATURE_SUBTYPES: Record<string, { name: string; tier: number; cmRange: string; description: string }[]> = {
  ironwright: [
    { name: 'Drone', tier: 1, cmRange: '1-2', description: 'small mechanical scout' },
    { name: 'Automaton', tier: 2, cmRange: '3-4', description: 'standard infantry construct' },
    { name: 'Mech', tier: 2, cmRange: '3-4', description: 'armored bipedal walker' },
    { name: 'Tank', tier: 3, cmRange: '5-6', description: 'heavy armored siege engine' },
    { name: 'Artillery', tier: 3, cmRange: '5-6', description: 'long-range bombardment platform' },
    { name: 'Titan', tier: 4, cmRange: '7+', description: 'massive towering war machine' },
    { name: 'Colossus', tier: 4, cmRange: '7+', description: 'faction-defining mega construct of impossible scale' },
  ],
  fey: [
    { name: 'Sprite', tier: 1, cmRange: '1-2', description: 'tiny winged trickster' },
    { name: 'Trickster', tier: 2, cmRange: '3-4', description: 'shapeshifting prankster and illusionist' },
    { name: 'Beast', tier: 2, cmRange: '3-4', description: 'enchanted woodland animal or mythic fauna' },
    { name: 'Dryad', tier: 3, cmRange: '5-6', description: 'ancient nature spirit bound to a sacred grove' },
    { name: 'Shapeshifter', tier: 3, cmRange: '5-6', description: 'powerful mimic assuming terrifying forms' },
    { name: 'Treant', tier: 4, cmRange: '7+', description: 'towering centuries-old tree guardian' },
    { name: 'Archfey', tier: 4, cmRange: '7+', description: 'ruler of the fey courts, reality-bending sovereign' },
  ],
  demonic: [
    { name: 'Imp', tier: 1, cmRange: '1-2', description: 'small cunning lesser demon' },
    { name: 'Fiend', tier: 2, cmRange: '3-4', description: 'mid-rank demon foot soldier' },
    { name: 'Hellhound', tier: 2, cmRange: '3-4', description: 'infernal beast bred for war' },
    { name: 'Brute', tier: 3, cmRange: '5-6', description: 'massive muscled demon of raw destruction' },
    { name: 'Succubus', tier: 3, cmRange: '5-6', description: 'seductive corruptor wielding dark influence' },
    { name: 'Pit Lord', tier: 4, cmRange: '7+', description: 'general of the infernal legions' },
    { name: 'Archfiend', tier: 4, cmRange: '7+', description: 'supreme demon lord and kingdom ruler' },
  ],
  celestial: [
    { name: 'Elemental', tier: 1, cmRange: '1-2', description: 'pure energy and light manifestation' },
    { name: 'Golem', tier: 2, cmRange: '3-4', description: 'crystalline construct forged from cosmic light' },
    { name: 'Oracle', tier: 2, cmRange: '3-4', description: 'cosmic seer with eye-covered form' },
    { name: 'Sentinel', tier: 3, cmRange: '5-6', description: 'geometric guardian construct' },
    { name: 'Archon', tier: 3, cmRange: '5-6', description: 'armored cosmic authority figure' },
    { name: 'Seraph', tier: 4, cmRange: '7+', description: 'multi-winged cosmic entity of immense power' },
    { name: 'Wyrm', tier: 4, cmRange: '7+', description: 'cosmic dragon and void serpent' },
  ],
  endless: [
    { name: 'Wraith', tier: 1, cmRange: '1-2', description: 'spectral ethereal haunter' },
    { name: 'Vampire', tier: 2, cmRange: '3-4', description: 'pale predatory corporeal undead' },
    { name: 'Shade', tier: 2, cmRange: '3-4', description: 'shadow-dwelling stalker' },
    { name: 'Revenant', tier: 3, cmRange: '5-6', description: 'armored undead warrior risen with purpose' },
    { name: 'Lich', tier: 3, cmRange: '5-6', description: 'undead sorcerer sustained by dark knowledge' },
    { name: 'Abomination', tier: 4, cmRange: '7+', description: 'fused mass of corpses and dark energy' },
    { name: 'Leviathan', tier: 4, cmRange: '7+', description: 'ancient void-dwelling titan of entropy' },
  ],
};

export function buildCreaturePrompt(factionKey: string, creatureDescription: string, subtype?: string, compositionModifiers?: string[]): string {
  const faction = FACTION_PROMPTS[factionKey];
  if (!faction) {
    const modifierStr = compositionModifiers?.length ? `, ${compositionModifiers.join(', ')}` : '';
    return `impasto oil painting, ${creatureDescription}${modifierStr}, thick paint texture, paint ridges visible`;
  }

  // If subtype provided, prepend its description to the creature description
  let fullDescription = creatureDescription;
  if (subtype) {
    const subtypeData = CREATURE_SUBTYPES[factionKey]?.find(s => s.name === subtype);
    if (subtypeData) {
      fullDescription = `${subtypeData.description}, ${creatureDescription}`;
    }
  }

  const modifierStr = compositionModifiers?.length ? `, ${compositionModifiers.join(', ')}` : '';
  return `impasto oil painting, ${fullDescription}${modifierStr}, thick paint texture, paint ridges visible, ${faction.materialSuffix}`;
}

export function getSubtypesForFaction(factionKey: string): typeof CREATURE_SUBTYPES[string] {
  return CREATURE_SUBTYPES[factionKey] || [];
}

export function getFactionNegativePrompt(factionKey: string): string {
  const faction = FACTION_PROMPTS[factionKey];
  if (!faction) return BASE_NEGATIVE_PROMPT;
  return faction.negativePrompt;
}

// Map faction names from Supabase to our prompt keys
export function factionNameToKey(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('ironwright')) return 'ironwright';
  if (lower.includes('fey')) return 'fey';
  if (lower.includes('demonic')) return 'demonic';
  if (lower.includes('celestial')) return 'celestial';
  if (lower.includes('endless')) return 'endless';
  return 'ironwright'; // fallback
}
