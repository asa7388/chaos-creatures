// Chaos Creatures Admin Dashboard — AI Prompt Generation API
// POST: Uses GPT-4o Mini to generate creature descriptions for art generation.
// Accepts faction, subtype, count, tier, and composition modifiers.
// Enforces scene-first description format and tier-based power scaling.

import { NextRequest, NextResponse } from 'next/server';
import { FACTION_PROMPTS, CREATURE_SUBTYPES } from '@/lib/prompts';

interface GeneratePromptsRequest {
  faction: string;
  subtype?: string;
  count: number;
  tier?: number;
  composition_modifiers?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: GeneratePromptsRequest = await request.json();
    const { faction, subtype, count, tier, composition_modifiers } = body;

    if (!faction || !count) {
      return NextResponse.json(
        { error: 'faction and count are required' },
        { status: 400 }
      );
    }

    if (count < 1 || count > 20) {
      return NextResponse.json(
        { error: 'count must be between 1 and 20' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // Build context for GPT-4o Mini
    const factionConfig = FACTION_PROMPTS[faction];
    const factionMaterial = factionConfig?.materialSuffix ?? 'unknown faction';
    const subtypes = CREATURE_SUBTYPES[faction] ?? [];
    const subtypeData = subtype ? subtypes.find(s => s.name === subtype) : null;

    // Resolve effective tier: explicit tier param > subtype tier > undefined
    const effectiveTier = tier ?? subtypeData?.tier;

    const modifierHint = composition_modifiers && composition_modifiers.length > 0
      ? `Incorporate these visual/compositional elements where appropriate: ${composition_modifiers.join(', ')}.`
      : '';

    const subtypeHint = subtypeData
      ? `The creature subtype is "${subtypeData.name}" — ${subtypeData.description} (Tier ${subtypeData.tier}, CM cost ${subtypeData.cmRange}).`
      : 'No specific subtype — generate a variety of creature types appropriate for this faction.';

    const tierHint = effectiveTier
      ? `These creatures are TIER ${effectiveTier}. Follow the tier power scaling rules strictly for T${effectiveTier}.`
      : 'Generate a mix of tiers across the batch, scaling visual power accordingly.';

    const factionSubtypeList = subtypes.map(s => `${s.name} (T${s.tier}): ${s.description}`).join('\n');

    const systemPrompt = `You are a creature designer for a dark fantasy card game called Chaos Creatures.
Generate unique, visually descriptive creature descriptions for AI art generation.

CRITICAL RULES — follow these exactly:

1. SCENE-FIRST FORMAT: Always describe the environment, setting, or action FIRST, then the creature.
   Image generation models weight the beginning of the prompt more heavily, so establishing the scene
   first produces better compositions. The creature emerges FROM the scene, not the other way around.
   WRONG: "a massive automaton with iron fists standing in a forge"
   RIGHT: "inside a burning forge with molten rivers, a massive automaton with iron fists raises its hammer"
   WRONG: "a tiny sprite with dragonfly wings hovering near a mushroom"
   RIGHT: "beneath a canopy of glowing mushrooms in a moonlit glade, a tiny sprite with dragonfly wings darts between the caps"

2. TIER-BASED POWER SCALING: The tier determines how powerful, large, and visually imposing the creature looks.
   - T1 (CM 1-2): Small, young, or diminished creatures. Simple forms, limited detail. Should look like minor threats — scouts, pests, runts. The creature is dwarfed by its environment. It should feel expendable, weak, and small.
   - T2 (CM 3-4): Standard-sized creatures. Competent and dangerous but not awe-inspiring. Working warriors, established predators. The creature fits naturally into its environment at normal scale.
   - T3 (CM 5-6): Large, imposing creatures radiating power. Complex forms, elaborate details, scars of battle. Elite warriors, ancient beings. The creature dominates its immediate surroundings and commands attention.
   - T4 (CM 7+): Colossal, terrifying, awe-inspiring. The creature dominates the ENTIRE scene. Reality-warping presence. World-enders, siege-breakers, mythic terrors. Buildings, trees, and mountains should look small next to it. It should feel like the most powerful thing in the image.

3. Each description should be 15-30 words, focusing on visual details (environment, action, form, pose, materials).
4. Do NOT include art style instructions — only describe the scene and creature.
5. Do NOT include the faction name or subtype name literally — describe what the creature LOOKS like.
6. Make each creature distinct — vary the environment, action, scale cues, pose, and distinguishing features.

Return a JSON array of strings. No markdown, no code fences — only the raw JSON array.`;

    const userPrompt = `Generate ${count} unique creature description${count !== 1 ? 's' : ''} for the "${faction}" faction.

Faction aesthetic/material: ${factionMaterial}

Available subtypes for this faction:
${factionSubtypeList}

${subtypeHint}

${tierHint}

${modifierHint}

Remember:
- SCENE/ENVIRONMENT/ACTION first, THEN the creature — this is mandatory for every single description
- Scale the creature's visual power and size strictly to match its tier
- T1 creatures must look small and expendable — never impressive
- T4 creatures must feel like the most powerful, terrifying thing in the image — nothing in the scene rivals them
- Each description should be a single sentence of 15-30 words

Return ONLY a JSON array of strings, like: ["description one", "description two", ...]`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.9,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('OpenAI API error:', response.status, errBody);
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json(
        { error: 'Empty response from OpenAI' },
        { status: 502 }
      );
    }

    // Parse the JSON array from the response
    let descriptions: string[];
    try {
      // Handle potential markdown code fences
      let cleaned = content;
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      descriptions = JSON.parse(cleaned);

      if (!Array.isArray(descriptions) || !descriptions.every((d: unknown) => typeof d === 'string')) {
        throw new Error('Response is not an array of strings');
      }
    } catch (parseErr) {
      console.error('Failed to parse OpenAI response:', content, parseErr);
      return NextResponse.json(
        { error: 'Failed to parse AI response as JSON array', raw: content },
        { status: 502 }
      );
    }

    return NextResponse.json({
      descriptions,
      count: descriptions.length,
      model: 'gpt-4o-mini',
      tier: effectiveTier ?? null,
    });
  } catch (err) {
    console.error('generate-prompts error:', err);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
