// Chaos Creatures Admin Dashboard — AI Prompt Generation API
// POST: Uses GPT-4o Mini to generate creature descriptions for art generation.
// Accepts faction, subtype, count, tier, and composition modifiers.
// Enforces character-first description format and tier-based power scaling.

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
Generate unique, vivid creature descriptions that serve as mini art briefs for AI image generation.

CRITICAL RULES — follow these exactly:

1. CHARACTER-FIRST FORMAT: Start with a 2-3 word creature identifier (type + key trait), THEN the scene/environment/composition.
   The model needs to know WHAT it's drawing before WHERE. The creature identifier anchors the subject immediately,
   then the scene and details flesh it out.
   Format: "[creature type] [key trait], [scene/environment], [action/pose], [details]"
   WRONG: "inside a burning forge with molten rivers, a massive automaton with iron fists raises its hammer"
   RIGHT: "iron colossus, inside a collapsing munitions foundry with molten slag rivers, raising a riveted siege hammer overhead, boiler chest venting superheated steam through corroded exhaust pipes"
   WRONG: "beneath a canopy of glowing mushrooms in a moonlit glade, a tiny sprite with dragonfly wings darts between the caps"
   RIGHT: "moss-covered stag, in a moonlit birch grove with bioluminescent mushroom rings, rearing up on hind legs, antlers tangled with spider silk and glowing foxfire orbs"

2. TIER-BASED POWER SCALING: The tier determines how powerful, large, and visually imposing the creature looks.
   - T1 (CM 1-2): Small, young, or diminished creatures. Simple forms, limited detail. Should look like minor threats — scouts, pests, runts. The creature is dwarfed by its environment. It should feel expendable, weak, and small.
   - T2 (CM 3-4): Standard-sized creatures. Competent and dangerous but not awe-inspiring. Working warriors, established predators. The creature fits naturally into its environment at normal scale.
   - T3 (CM 5-6): Large, imposing creatures radiating power. Complex forms, elaborate details, scars of battle. Elite warriors, ancient beings. The creature dominates its immediate surroundings and commands attention.
   - T4 (CM 7+): Colossal, terrifying, awe-inspiring. The creature dominates the ENTIRE scene. Reality-warping presence. World-enders, siege-breakers, mythic terrors. Buildings, trees, and mountains should look small next to it. It should feel like the most powerful thing in the image.

3. DESCRIPTION LENGTH AND DETAIL: Each description must be 30-50 words — a proper mini art brief, NOT a vague tagline.
   Every description MUST include ALL FIVE of these elements:
   a) ENVIRONMENT/SETTING — where the creature is, what surrounds it, lighting, atmosphere, weather
   b) PHYSICAL FORM — body shape, number of limbs, proportions, size relative to surroundings
   c) MATERIALS/TEXTURES — what the creature's body is made of or covered in (corroded iron, crystalline scales, rotting bark, cracked obsidian, fraying cloth, etc.)
   d) ACTION/POSE — what the creature is doing RIGHT NOW (lunging, coiled, crouching, ascending, devouring, dragging, erupting from, etc.)
   e) ONE UNIQUE DISTINGUISHING FEATURE — a single memorable visual detail that makes this creature different from every other (a furnace-glow core visible through cracked ribs, chains fused into forearms, a crown of living antlers, a third eye weeping molten gold, etc.)

4. BANNED VAGUE LANGUAGE: Do NOT use these words unless they are paired with a concrete visual detail:
   "mystical", "magical", "ethereal", "powerful", "ancient", "dark", "mighty", "fearsome", "terrifying", "ominous", "sinister", "glowing", "shadowy"
   Instead of "a powerful demon", write what MAKES it look powerful — its size relative to surroundings, the specific damage on its body, the way the ground cracks under it.
   Instead of "a mystical forest creature", describe the exact bark texture of its skin, the specific fungi growing from its joints, the particular insects swarming its hollow eye sockets.

5. FACTION-SPECIFIC MATERIAL VOCABULARY — use these textures and materials for each faction:
   - Ironwright: riveted iron plate, brass pistons, furnace glow, slag heaps, industrial smoke, welded seams, gear teeth, boiler pipes, corroded steel, copper wiring, exhaust vents, coal dust, forged bolts
   - Fey: birch bark skin, living moss, bioluminescent fungi, dewdrops, tangled roots, moth wings, spider silk, lichen patches, luminous sap, thorn growths, seed pods, pollen clouds, foxfire
   - Demonic: cracked obsidian, molten magma veins, sulfur smoke, bone spurs, charred flesh, exposed sinew, volcanic glass, cinder, ash-crusted skin, lava seams, brimstone, tar-slick surfaces
   - Celestial: prismatic crystal, starlight fractures, geometric halos, void-glass armor, cosmic dust trails, refracted light, tessellated plates, aurora shimmer, nebula veins, opalescent membrane
   - Endless: corroded bone, fraying burial cloth, cold fog, crumbling stone, hollow eye sockets, dust motes, tarnished silver, cobweb-wrapped limbs, peeling parchment skin, grave dirt, rusted chain

6. Do NOT include art style instructions — only describe the scene and creature.
7. Do NOT include the faction name or subtype name literally — describe what the creature LOOKS like.
8. Make each creature DISTINCT — vary environment, action, scale cues, pose, materials, and the unique feature. No two creatures should share the same setting or pose.

QUALITY EXAMPLES — this is the level of detail and specificity expected:

WEAK (too vague, too short — NEVER produce this):
"a powerful demon warrior in a dark landscape"

STRONG (character-first identifier, specific materials, clear action, unique detail):
"obsidian brute, amid shattered volcanic pillars leaking sulfur gas, charging forward with jaw unhinged, cracked basalt skin revealing molten magma veins beneath, dragging a serrated bone cleaver that gouges the volcanic ground"

WEAK: "a small mechanical creature in a factory"
STRONG: "tin-plate drone, on a grease-stained conveyor belt between stamping presses, scurrying through pools of black coolant, rat-sized with a single cracked lens eye, one bent propeller blade spinning uselessly on its back"

WEAK: "a forest spirit standing among trees"
STRONG: "moss-covered stag, in a moonlit birch grove with bioluminescent mushroom rings, rearing up on hind legs, antlers tangled with spider silk and glowing foxfire orbs, hollow chest cavity filled with a living bee colony"

Return a JSON array of strings. No markdown, no code fences — only the raw JSON array.`;

    const userPrompt = `Generate ${count} unique creature description${count !== 1 ? 's' : ''} for the "${faction}" faction.

Faction aesthetic/material: ${factionMaterial}

Available subtypes for this faction:
${factionSubtypeList}

${subtypeHint}

${tierHint}

${modifierHint}

MANDATORY CHECKLIST — every single description must include ALL of these:
1. CHARACTER IDENTIFIER FIRST (2-3 word creature type + key trait) — THEN scene/environment/composition
2. PHYSICAL FORM (body shape, limb count, size relative to surroundings)
3. MATERIALS/TEXTURES specific to this faction (use the faction material vocabulary from the system prompt)
4. A SPECIFIC ACTION OR POSE (not "standing" — use lunging, coiling, dragging, erupting, crouching, etc.)
5. ONE UNIQUE DISTINGUISHING FEATURE that no other creature in this batch shares
6. Scale the creature's visual power and size strictly to match its tier
   - T1: creature is dwarfed by environment, simple body, looks expendable
   - T4: creature dominates the ENTIRE scene, environment is tiny by comparison
7. Each description must be 30-50 words — a mini art brief, not a tagline
8. No vague words without concrete visual backup

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
        max_tokens: 4000,
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
