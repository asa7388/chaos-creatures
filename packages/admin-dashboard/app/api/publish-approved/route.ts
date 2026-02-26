// Chaos Creatures Admin Dashboard — Publish Approved Cards to Game
// Creates card_templates from APPROVED generation_jobs that haven't been published yet.
// Uses OpenAI GPT-4o Mini to generate card names and flavor text.
// Stats are derived from creature subtype tier (from CREATURE_SUBTYPES).

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { CREATURE_SUBTYPES, factionNameToKey } from '@/lib/prompts';

// Faction ID -> faction key mapping (hardcoded UUIDs from seed data)
const FACTION_ID_TO_KEY: Record<string, string> = {
  'a0000000-0000-0000-0000-000000000001': 'ironwright',
  'a0000000-0000-0000-0000-000000000002': 'fey',
  'a0000000-0000-0000-0000-000000000003': 'demonic',
  'a0000000-0000-0000-0000-000000000004': 'celestial',
  'a0000000-0000-0000-0000-000000000005': 'endless',
};

// Stat templates per tier (cm, atk, hp ranges)
const TIER_STATS: Record<number, { cmRange: [number, number]; atkRange: [number, number]; hpRange: [number, number]; instability: number }> = {
  1: { cmRange: [1, 2], atkRange: [1, 2], hpRange: [1, 3], instability: 0 },
  2: { cmRange: [3, 4], atkRange: [2, 4], hpRange: [3, 5], instability: 1 },
  3: { cmRange: [5, 6], atkRange: [4, 6], hpRange: [4, 7], instability: 2 },
  4: { cmRange: [7, 9], atkRange: [5, 8], hpRange: [6, 10], instability: 3 },
};

// Keywords available per faction
const FACTION_KEYWORDS: Record<string, string[]> = {
  ironwright: ['Shield', 'Haste', 'Piercing'],
  fey: ['Lifesteal', 'Taunt', 'Ward', 'Flying'],
  demonic: ['Deathtouch', 'Haste', 'Piercing', 'Lifesteal'],
  celestial: ['Flying', 'Ward', 'Shield'],
  endless: ['Lifesteal', 'Taunt', 'Reach', 'Deathtouch'],
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Derive subtype tier from creature_subtype or creature_type_hint
function getSubtypeTier(factionKey: string, subtypeName?: string, hint?: string): number {
  if (subtypeName) {
    const subtypes = CREATURE_SUBTYPES[factionKey] || [];
    const match = subtypes.find(s => s.name.toLowerCase() === subtypeName.toLowerCase());
    if (match) return match.tier;
  }
  // Try to match from hint
  if (hint) {
    const hintLower = hint.toLowerCase();
    const subtypes = CREATURE_SUBTYPES[factionKey] || [];
    for (const s of subtypes) {
      if (hintLower.includes(s.name.toLowerCase())) return s.tier;
    }
  }
  // Default to tier 2
  return 2;
}

// Generate a card name from the creature hint using OpenAI
async function generateCardName(creatureHint: string, factionKey: string): Promise<{ name: string; flavorText: string }> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    // Fallback: derive from hint
    return {
      name: creatureHint.split(',')[0].trim().split(' ').slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      flavorText: 'Born from the chaos between worlds.',
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a fantasy card game naming specialist for Chaos Creatures. Generate a card name (2-4 words, evocative fantasy style) and flavor text (1-2 sentences, atmospheric and mysterious). The faction is "${factionKey}". Respond in JSON format: {"name": "...", "flavor_text": "..."}`,
          },
          {
            role: 'user',
            content: `Generate a card name and flavor text for this creature: ${creatureHint}`,
          },
        ],
        temperature: 0.8,
        max_tokens: 150,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      // Parse JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          name: parsed.name || 'Unnamed Creature',
          flavorText: parsed.flavor_text || 'Born from the chaos between worlds.',
        };
      }
    }
  } catch (err) {
    console.error('OpenAI name generation failed:', err);
  }

  // Fallback
  const words = creatureHint.split(/[,.]/).map(s => s.trim()).filter(Boolean);
  const firstPhrase = words[0] || 'Unknown';
  const nameWords = firstPhrase.split(' ').slice(0, 3);
  return {
    name: nameWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    flavorText: 'Born from the chaos between worlds.',
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { job_ids, dry_run } = body as {
      job_ids?: string[];  // Optional: publish specific jobs. If omitted, publish ALL approved.
      dry_run?: boolean;   // If true, return what would be created without writing.
    };

    // Fetch APPROVED generation_jobs
    let query = supabase
      .from('generation_jobs')
      .select('*')
      .eq('status', 'COMPLETED')
      .not('art_url', 'is', null);

    if (job_ids && job_ids.length > 0) {
      query = query.in('id', job_ids);
    }

    const { data: jobs, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Filter to APPROVED only (review_status is in output_data JSONB)
    const approvedJobs = (jobs || []).filter(
      (j) => (j.output_data as Record<string, unknown>)?.review_status === 'APPROVED'
    );

    if (approvedJobs.length === 0) {
      return NextResponse.json({
        message: 'No approved jobs to publish',
        published: 0,
      });
    }

    // Check which jobs already have a card_template (by checking if art_url already exists)
    const artUrls = approvedJobs.map(j => j.art_url).filter(Boolean);
    const { data: existingTemplates } = await supabase
      .from('card_templates')
      .select('art_url')
      .in('art_url', artUrls);

    const existingArtUrls = new Set((existingTemplates || []).map(t => t.art_url));
    const unpublishedJobs = approvedJobs.filter(j => !existingArtUrls.has(j.art_url));

    if (unpublishedJobs.length === 0) {
      return NextResponse.json({
        message: 'All approved jobs are already published as card_templates',
        published: 0,
        alreadyPublished: approvedJobs.length,
      });
    }

    // Fetch factions for name resolution
    const { data: factions } = await supabase.from('factions').select('id, name');
    const factionMap = new Map((factions || []).map(f => [f.id, f.name]));

    // Build card_templates from unpublished approved jobs
    const templates = [];
    const errors = [];

    for (const job of unpublishedJobs) {
      try {
        const inputData = (job.input_data || {}) as Record<string, unknown>;
        const outputData = (job.output_data || {}) as Record<string, unknown>;
        const factionId = inputData.faction_id as string;
        const factionName = factionMap.get(factionId) || '';
        const factionKey = FACTION_ID_TO_KEY[factionId] || factionNameToKey(factionName);
        const creatureHint = (inputData.creature_type_hint as string) || '';
        const creatureSubtype = (inputData.creature_subtype as string) || undefined;
        const cardType = (inputData.card_type as string) || 'CREATURE';

        // Determine tier from subtype
        const tier = getSubtypeTier(factionKey, creatureSubtype, creatureHint);
        const stats = TIER_STATS[tier] || TIER_STATS[2];

        // Generate stats
        const cm = randomInt(stats.cmRange[0], stats.cmRange[1]);
        const atk = cardType === 'CREATURE' ? randomInt(stats.atkRange[0], stats.atkRange[1]) : null;
        const hp = cardType === 'CREATURE' ? randomInt(stats.hpRange[0], stats.hpRange[1]) : null;
        const instability = stats.instability;

        // Assign 0-1 random keywords from the faction pool
        const factionKeywordPool = FACTION_KEYWORDS[factionKey] || ['Shield'];
        const keyword = tier >= 2 ? pickRandom(factionKeywordPool) : null;

        // Get name + flavor text
        const existingName = outputData.name as string | undefined;
        let cardName: string;
        let flavorText: string;

        if (existingName && !existingName.startsWith('Smoke Test') && !existingName.match(/^\d+$/)) {
          cardName = existingName;
          flavorText = (outputData.flavor_text as string) || 'Born from the chaos between worlds.';
        } else {
          const generated = await generateCardName(creatureHint, factionKey);
          cardName = generated.name;
          flavorText = generated.flavorText;
        }

        const artPrompt = (outputData.art_prompt as string) || creatureHint;

        templates.push({
          name: cardName,
          card_type: cardType,
          faction_id: factionId,
          base_attack: atk,
          base_health: hp,
          base_instability: instability,
          mana_cost: cm,
          base_keywords: keyword ? [keyword] : [],
          spell_effect: null,
          stabilizer_type: null,
          art_prompt: artPrompt,
          art_url: job.art_url,
          flavor_text: flavorText,
          batch_id: (inputData.batch_id as string) || null,
          approved_at: new Date().toISOString(),
          approved_by: 'admin',
          is_legendary_eligible: tier >= 3,
        });
      } catch (err) {
        errors.push({ jobId: job.id, error: String(err) });
      }
    }

    if (dry_run) {
      return NextResponse.json({
        message: `Dry run: would publish ${templates.length} card templates`,
        templates,
        errors,
      });
    }

    // Insert all card_templates
    if (templates.length > 0) {
      const { error: insertError, data: insertedData } = await supabase
        .from('card_templates')
        .insert(templates)
        .select('id, name, art_url');

      if (insertError) {
        return NextResponse.json({
          error: `Failed to insert card_templates: ${insertError.message}`,
          partialTemplates: templates,
        }, { status: 500 });
      }

      // Mark generation_jobs as published in output_data
      for (const job of unpublishedJobs) {
        const outputData = (job.output_data || {}) as Record<string, unknown>;
        await supabase
          .from('generation_jobs')
          .update({
            output_data: {
              ...outputData,
              published_to_game: true,
              published_at: new Date().toISOString(),
            },
          })
          .eq('id', job.id);
      }

      // Audit log
      await supabase.from('admin_audit_log').insert({
        admin_user: 'admin',
        action: 'cards_published_to_game',
        target_type: 'card_templates',
        target_id: null,
        details: {
          count: templates.length,
          names: templates.map(t => t.name),
        },
      }).then(() => {}, () => {});

      return NextResponse.json({
        message: `Published ${templates.length} approved cards to game`,
        published: templates.length,
        cards: insertedData,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    return NextResponse.json({
      message: 'No cards to publish',
      published: 0,
      errors,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${String(err)}` },
      { status: 500 }
    );
  }
}
