#!/usr/bin/env node
// generate-placeholder-audio.mjs
// Generates silent placeholder .wav files for every SFX the Chaos Creatures app needs.
// Each file is a valid 16-bit PCM WAV so the app can load them without crashing.
// The owner replaces these with real SFX downloaded from freesound.org (CC0).

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

// All SFX files needed by BattleAudioManager.SFX enum
// Names must match the rawValue with .wav extension
const SFX_FILES = [
  { name: "sfx_card_play", description: "Card play whoosh" },
  { name: "sfx_attack", description: "Attack impact" },
  { name: "sfx_damage", description: "Damage crunch" },
  { name: "sfx_death", description: "Creature death shatter" },
  { name: "sfx_heal", description: "Heal chime" },
  { name: "sfx_shield_break", description: "Shield break glass" },
  { name: "sfx_chaos_roll_start", description: "D20 roll begin" },
  { name: "sfx_chaos_roll_order", description: "Order result sound" },
  { name: "sfx_chaos_roll_chaos", description: "Chaos result sound" },
  { name: "sfx_chaos_roll_nothing", description: "Neutral result" },
  { name: "sfx_event_order", description: "Order event trigger" },
  { name: "sfx_event_chaos", description: "Chaos event trigger" },
  { name: "sfx_turn_start", description: "Turn start ping" },
  { name: "sfx_mana_gain", description: "Mana crystal clink" },
  { name: "sfx_button_tap", description: "UI button tap" },
  { name: "sfx_victory", description: "Victory fanfare (3s)", durationSec: 3.0 },
  { name: "sfx_defeat", description: "Defeat sound (3s)", durationSec: 3.0 },
  { name: "sfx_chaos_spark", description: "Chaos energy crackle" },
  { name: "sfx_evolution_reveal", description: "Evolution reveal sound", durationSec: 2.5 },
];

/**
 * Generate a valid WAV file buffer containing silence.
 * Format: 16-bit PCM, mono, 44100 Hz.
 * @param {number} durationSec Duration in seconds (default 0.1)
 * @returns {Buffer} Complete WAV file
 */
function generateSilentWav(durationSec = 0.1) {
  const sampleRate = 44100;
  const bitsPerSample = 16;
  const numChannels = 1;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const numSamples = Math.ceil(sampleRate * durationSec);
  const dataSize = numSamples * blockAlign;
  const fileSize = 36 + dataSize; // 36 = header size minus 8 for RIFF+size

  const buffer = Buffer.alloc(44 + dataSize); // 44-byte header + data (all zeros = silence)
  let offset = 0;

  // RIFF header
  buffer.write("RIFF", offset);
  offset += 4;
  buffer.writeUInt32LE(fileSize, offset);
  offset += 4;
  buffer.write("WAVE", offset);
  offset += 4;

  // fmt subchunk
  buffer.write("fmt ", offset);
  offset += 4;
  buffer.writeUInt32LE(16, offset); // Subchunk1Size (16 for PCM)
  offset += 4;
  buffer.writeUInt16LE(1, offset); // AudioFormat (1 = PCM)
  offset += 2;
  buffer.writeUInt16LE(numChannels, offset);
  offset += 2;
  buffer.writeUInt32LE(sampleRate, offset);
  offset += 4;
  buffer.writeUInt32LE(byteRate, offset);
  offset += 4;
  buffer.writeUInt16LE(blockAlign, offset);
  offset += 2;
  buffer.writeUInt16LE(bitsPerSample, offset);
  offset += 2;

  // data subchunk
  buffer.write("data", offset);
  offset += 4;
  buffer.writeUInt32LE(dataSize, offset);
  offset += 4;

  // Data is already zeroed (silence) from Buffer.alloc

  return buffer;
}

// --- Main ---

const sfxDir = join(
  import.meta.dirname,
  "..",
  "ChaosCreatures",
  "ChaosCreatures",
  "Resources",
  "Sounds",
  "SFX"
);

const musicDir = join(
  import.meta.dirname,
  "..",
  "ChaosCreatures",
  "ChaosCreatures",
  "Resources",
  "Sounds",
  "Music"
);

// Create directories
mkdirSync(sfxDir, { recursive: true });
mkdirSync(musicDir, { recursive: true });

console.log(`SFX directory: ${sfxDir}`);
console.log(`Music directory: ${musicDir}`);
console.log("");

let created = 0;
let skipped = 0;

for (const sfx of SFX_FILES) {
  const filePath = join(sfxDir, `${sfx.name}.wav`);
  if (existsSync(filePath)) {
    console.log(`  SKIP  ${sfx.name}.wav (already exists)`);
    skipped++;
    continue;
  }
  const duration = sfx.durationSec || 0.1;
  const wav = generateSilentWav(duration);
  writeFileSync(filePath, wav);
  const sizeKb = (wav.length / 1024).toFixed(1);
  console.log(`  CREATE  ${sfx.name}.wav  (${duration}s silence, ${sizeKb} KB)`);
  created++;
}

console.log("");
console.log(`Done. Created ${created} files, skipped ${skipped}.`);
console.log("Replace these with real SFX from freesound.org — see scripts/AUDIO-SOURCING-GUIDE.md");
