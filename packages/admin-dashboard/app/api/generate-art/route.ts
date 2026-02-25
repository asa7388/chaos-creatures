// Chaos Creatures Admin Dashboard — Single Art Generation API
// POST: Processes one generation job via Replicate API.
// Fetches PENDING job, submits to Replicate LoRA model, polls for result,
// uploads to R2, and updates the job record.

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { buildCreaturePrompt, getFactionNegativePrompt, factionNameToKey, GENERATION_SETTINGS } from '@/lib/prompts';
import { uploadToR2 } from '@/lib/r2';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const R2_CDN_URL = process.env.R2_CDN_URL || 'https://pub-ab96c6d0742748d19e4ad5502f3fea09.r2.dev';
const REPLICATE_MODEL = 'asa7388/chscrt-sdxl-lora-v2-sdxl';
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_DURATION_MS = 55000; // Stay within Vercel's 60s timeout

interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string[];
  error?: string;
  urls?: { get: string };
}

async function markJobFailed(jobId: string, errorMessage: string): Promise<void> {
  await supabase
    .from('generation_jobs')
    .update({
      status: 'FAILED',
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { job_id } = body;

    if (!job_id) {
      return NextResponse.json(
        { error: 'job_id is required' },
        { status: 400 }
      );
    }

    if (!REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'REPLICATE_API_TOKEN not configured' },
        { status: 500 }
      );
    }

    // 1. Fetch the generation job
    const { data: job, error: fetchError } = await supabase
      .from('generation_jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (fetchError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 400 }
      );
    }

    if (job.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Job is not PENDING (current status: ${job.status})` },
        { status: 400 }
      );
    }

    // 2. Update status to PROCESSING
    const { error: updateError } = await supabase
      .from('generation_jobs')
      .update({
        status: 'PROCESSING',
        started_at: new Date().toISOString(),
      })
      .eq('id', job_id);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update job status: ${updateError.message}` },
        { status: 500 }
      );
    }

    const inputData = job.input_data || {};

    // 3. Look up faction info from Supabase
    let factionKey: string;
    if (inputData.faction_id) {
      const { data: faction, error: factionError } = await supabase
        .from('factions')
        .select('name')
        .eq('id', inputData.faction_id)
        .single();

      if (factionError || !faction) {
        await markJobFailed(job_id, `Faction not found for id: ${inputData.faction_id}`);
        return NextResponse.json(
          { error: `Faction not found for id: ${inputData.faction_id}` },
          { status: 400 }
        );
      }

      factionKey = factionNameToKey(faction.name);
    } else {
      await markJobFailed(job_id, 'No faction_id in input_data');
      return NextResponse.json(
        { error: 'No faction_id in input_data' },
        { status: 400 }
      );
    }

    // 4. Build prompt
    const creatureDescription = inputData.creature_type_hint || 'a powerful creature';
    const prompt = buildCreaturePrompt(factionKey, creatureDescription);
    const negativePrompt = getFactionNegativePrompt(factionKey);

    // 5. Get the latest model version from Replicate
    let versionHash: string;
    try {
      const modelResponse = await fetch(
        `https://api.replicate.com/v1/models/${REPLICATE_MODEL}`,
        {
          headers: {
            'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!modelResponse.ok) {
        const errorText = await modelResponse.text();
        await markJobFailed(job_id, `Failed to fetch Replicate model: ${modelResponse.status} ${errorText}`);
        return NextResponse.json(
          { error: `Failed to fetch Replicate model: ${modelResponse.status}` },
          { status: 502 }
        );
      }

      const modelData = await modelResponse.json();
      versionHash = modelData.latest_version?.id;

      if (!versionHash) {
        await markJobFailed(job_id, 'No latest_version found for Replicate model');
        return NextResponse.json(
          { error: 'No latest_version found for Replicate model' },
          { status: 502 }
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error fetching model';
      await markJobFailed(job_id, `Replicate model fetch error: ${message}`);
      return NextResponse.json(
        { error: `Replicate model fetch error: ${message}` },
        { status: 502 }
      );
    }

    // 6. Submit prediction to Replicate
    let prediction: ReplicatePrediction;
    try {
      const predictionResponse = await fetch(
        'https://api.replicate.com/v1/predictions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            version: versionHash,
            input: {
              prompt,
              negative_prompt: negativePrompt,
              width: GENERATION_SETTINGS.width,
              height: GENERATION_SETTINGS.height,
              lora_scale: GENERATION_SETTINGS.lora_scale,
              apply_watermark: false,
              disable_safety_checker: true,
            },
          }),
        }
      );

      if (!predictionResponse.ok) {
        const errorText = await predictionResponse.text();
        await markJobFailed(job_id, `Replicate prediction failed: ${predictionResponse.status} ${errorText}`);
        return NextResponse.json(
          { error: `Replicate prediction failed: ${predictionResponse.status}` },
          { status: 502 }
        );
      }

      prediction = await predictionResponse.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error submitting prediction';
      await markJobFailed(job_id, `Replicate submit error: ${message}`);
      return NextResponse.json(
        { error: `Replicate submit error: ${message}` },
        { status: 502 }
      );
    }

    // 7. Poll for completion (max 55 seconds)
    const pollStartTime = Date.now();
    let result: ReplicatePrediction = prediction;

    while (
      result.status !== 'succeeded' &&
      result.status !== 'failed' &&
      result.status !== 'canceled'
    ) {
      if (Date.now() - pollStartTime > MAX_POLL_DURATION_MS) {
        await markJobFailed(job_id, `Replicate prediction timed out after ${MAX_POLL_DURATION_MS / 1000}s (prediction id: ${prediction.id})`);
        return NextResponse.json(
          { error: 'Prediction timed out', prediction_id: prediction.id },
          { status: 504 }
        );
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

      const pollUrl = prediction.urls?.get || `https://api.replicate.com/v1/predictions/${prediction.id}`;
      const pollResponse = await fetch(pollUrl, {
        headers: {
          'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!pollResponse.ok) {
        const errorText = await pollResponse.text();
        await markJobFailed(job_id, `Replicate poll failed: ${pollResponse.status} ${errorText}`);
        return NextResponse.json(
          { error: `Replicate poll failed: ${pollResponse.status}` },
          { status: 502 }
        );
      }

      result = await pollResponse.json();
    }

    if (result.status === 'failed' || result.status === 'canceled') {
      const errorMsg = result.error || `Prediction ${result.status}`;
      await markJobFailed(job_id, errorMsg);
      return NextResponse.json(
        { error: errorMsg, prediction_id: prediction.id },
        { status: 502 }
      );
    }

    // 8. Download the output image
    const outputUrl = result.output?.[0];
    if (!outputUrl) {
      await markJobFailed(job_id, 'Replicate returned no output image');
      return NextResponse.json(
        { error: 'Replicate returned no output image' },
        { status: 502 }
      );
    }

    let imageBuffer: Buffer;
    try {
      const imageResponse = await fetch(outputUrl);
      if (!imageResponse.ok) {
        throw new Error(`Image download failed: ${imageResponse.status}`);
      }
      const arrayBuffer = await imageResponse.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error downloading image';
      await markJobFailed(job_id, `Image download error: ${message}`);
      return NextResponse.json(
        { error: `Image download error: ${message}` },
        { status: 502 }
      );
    }

    // 9. Upload to R2
    const r2Key = `cards/generated/${factionKey}/${job_id}.png`;
    try {
      await uploadToR2(imageBuffer, r2Key, 'image/png');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error uploading to R2';
      await markJobFailed(job_id, `R2 upload error: ${message}`);
      return NextResponse.json(
        { error: `R2 upload error: ${message}` },
        { status: 502 }
      );
    }

    const artUrl = `${R2_CDN_URL}/${r2Key}`;

    // 10. Update generation job as COMPLETED
    const { error: completeError } = await supabase
      .from('generation_jobs')
      .update({
        status: 'COMPLETED',
        art_url: artUrl,
        output_data: {
          ...(job.output_data || {}),
          art_prompt: prompt,
          negative_prompt: negativePrompt,
          replicate_prediction_id: prediction.id,
          replicate_model: REPLICATE_MODEL,
          r2_key: r2Key,
        },
        completed_at: new Date().toISOString(),
      })
      .eq('id', job_id);

    if (completeError) {
      // Image is uploaded but DB update failed — log but still return success
      console.error(`Failed to update job ${job_id} to COMPLETED:`, completeError.message);
    }

    // 11. Return success
    return NextResponse.json({
      success: true,
      art_url: artUrl,
      job_id,
      prediction_id: prediction.id,
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
