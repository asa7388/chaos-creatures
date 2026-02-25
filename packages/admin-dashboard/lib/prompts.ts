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

export function buildCreaturePrompt(factionKey: string, creatureDescription: string): string {
  const faction = FACTION_PROMPTS[factionKey];
  if (!faction) throw new Error(`Unknown faction: ${factionKey}`);

  return `impasto oil painting, ${creatureDescription}, thick paint texture, paint ridges visible, ${faction.materialSuffix}`;
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
