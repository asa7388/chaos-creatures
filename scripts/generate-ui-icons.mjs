#!/usr/bin/env node
// generate-ui-icons.mjs — Generate ~39 missing UI icons for Chaos Creatures
// Generates monochrome template icons for SwiftUI renderingMode(.template)
// All icons drawn as clean vectors using node-canvas, no AI generation needed.

import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const PREVIEW_DIR = join(PROJECT_ROOT, 'scripts/preview/ui-icons');
const ASSETS_DIR = join(PROJECT_ROOT, 'ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets');
const UI_ICONS_DIR = join(ASSETS_DIR, 'UIIcons');

// Create output directories
mkdirSync(PREVIEW_DIR, { recursive: true });
mkdirSync(UI_ICONS_DIR, { recursive: true });

// Ensure UIIcons folder has Contents.json
const uiFolderContents = join(UI_ICONS_DIR, 'Contents.json');
if (!existsSync(uiFolderContents)) {
  writeFileSync(uiFolderContents, JSON.stringify({
    info: { author: 'xcode', version: 1 },
    properties: { 'provides-namespace': true },
  }, null, 2));
}

const SIZE = 128; // Icons drawn at 128x128, installed as @2x (64pt)
const WHITE = '#FFFFFF'; // All icons in white for template tinting

// ==========================================================================
// Helper: Save canvas to preview + Xcode Assets.xcassets
// ==========================================================================
function saveIcon(canvas, name) {
  const buffer = canvas.toBuffer('image/png');

  // Save preview
  const previewPath = join(PREVIEW_DIR, `${name}.png`);
  writeFileSync(previewPath, buffer);

  // Install to Xcode
  const imagesetDir = join(UI_ICONS_DIR, `${name}.imageset`);
  mkdirSync(imagesetDir, { recursive: true });

  const filename = `${name}@2x.png`;
  writeFileSync(join(imagesetDir, filename), buffer);
  writeFileSync(join(imagesetDir, 'Contents.json'), JSON.stringify({
    images: [
      { idiom: 'universal', scale: '2x', filename: filename }
    ],
    info: { author: 'xcode', version: 1 },
    properties: { 'template-rendering-intent': 'template' }
  }, null, 2));

  console.log(`✓ ${name}`);
}

// ==========================================================================
// Icon Drawing Functions
// ==========================================================================

// 1. ui-chaos-mana — Lightning bolt with energy aura
function drawChaosMana() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'miter';

  // Lightning bolt
  ctx.beginPath();
  ctx.moveTo(-8, -48);
  ctx.lineTo(8, -48);
  ctx.lineTo(-4, -8);
  ctx.lineTo(12, -8);
  ctx.lineTo(-12, 48);
  ctx.lineTo(0, 8);
  ctx.lineTo(-16, 8);
  ctx.closePath();
  ctx.fill();

  // Energy aura lines
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-28, -32);
  ctx.lineTo(-20, -28);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-32, -12);
  ctx.lineTo(-24, -10);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(20, -28);
  ctx.lineTo(28, -32);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(24, -10);
  ctx.lineTo(32, -12);
  ctx.stroke();

  ctx.restore();
  return canvas;
}

// 2. ui-chaos-spark — Circular lightning emblem
function drawChaosSpark() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;

  // Outer circle
  ctx.beginPath();
  ctx.arc(0, 0, 42, 0, Math.PI * 2);
  ctx.stroke();

  // Lightning bolt inside
  ctx.beginPath();
  ctx.moveTo(-4, -28);
  ctx.lineTo(4, -28);
  ctx.lineTo(-2, -4);
  ctx.lineTo(8, -4);
  ctx.lineTo(-8, 28);
  ctx.lineTo(0, 4);
  ctx.lineTo(-10, 4);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
  return canvas;
}

// 3. ui-hourglass — Fantasy hourglass/sand timer
function drawHourglass() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';

  // Top bulb
  ctx.beginPath();
  ctx.moveTo(-24, -48);
  ctx.lineTo(24, -48);
  ctx.lineTo(24, -32);
  ctx.lineTo(0, -4);
  ctx.lineTo(-24, -32);
  ctx.closePath();
  ctx.stroke();

  // Bottom bulb
  ctx.beginPath();
  ctx.moveTo(-24, 48);
  ctx.lineTo(24, 48);
  ctx.lineTo(24, 32);
  ctx.lineTo(0, 4);
  ctx.lineTo(-24, 32);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Center pinch
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(6, 0);
  ctx.stroke();

  // Sand in top
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-18, -38);
  ctx.lineTo(18, -38);
  ctx.lineTo(0, -12);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
  return canvas;
}

// 4. ui-battle-log — Scroll/parchment with lines
function drawBattleLog() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';

  // Scroll body
  ctx.beginPath();
  ctx.moveTo(-32, -40);
  ctx.quadraticCurveTo(-36, -44, -32, -48);
  ctx.lineTo(32, -48);
  ctx.quadraticCurveTo(36, -44, 32, -40);
  ctx.lineTo(32, 40);
  ctx.quadraticCurveTo(36, 44, 32, 48);
  ctx.lineTo(-32, 48);
  ctx.quadraticCurveTo(-36, 44, -32, 40);
  ctx.closePath();
  ctx.stroke();

  // Text lines
  ctx.lineWidth = 3;
  [-28, -12, 4, 20, 36].forEach(y => {
    ctx.beginPath();
    ctx.moveTo(-20, y);
    ctx.lineTo(20, y);
    ctx.stroke();
  });

  ctx.restore();
  return canvas;
}

// 5. ui-victory — Laurel wreath crown
function drawVictory() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';

  // Left laurel
  ctx.beginPath();
  ctx.moveTo(-8, 48);
  ctx.quadraticCurveTo(-28, 32, -36, 8);
  ctx.quadraticCurveTo(-40, -12, -32, -32);
  ctx.stroke();

  // Right laurel
  ctx.beginPath();
  ctx.moveTo(8, 48);
  ctx.quadraticCurveTo(28, 32, 36, 8);
  ctx.quadraticCurveTo(40, -12, 32, -32);
  ctx.stroke();

  // Crown peak
  ctx.beginPath();
  ctx.moveTo(0, -48);
  ctx.lineTo(-12, -24);
  ctx.lineTo(12, -24);
  ctx.closePath();
  ctx.fill();

  // Leaves (simplified as circles)
  [-32, -24, -16].forEach(x => {
    ctx.beginPath();
    ctx.arc(x, -16, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  [16, 24, 32].forEach(x => {
    ctx.beginPath();
    ctx.arc(x, -16, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
  return canvas;
}

// 6. ui-defeat — Broken shield
function drawDefeat() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';

  // Left half of broken shield
  ctx.beginPath();
  ctx.moveTo(-8, -44);
  ctx.lineTo(-36, -44);
  ctx.lineTo(-36, 8);
  ctx.quadraticCurveTo(-36, 32, -18, 48);
  ctx.lineTo(-8, 12);
  ctx.closePath();
  ctx.stroke();

  // Right half of broken shield
  ctx.beginPath();
  ctx.moveTo(8, -44);
  ctx.lineTo(36, -44);
  ctx.lineTo(36, 8);
  ctx.quadraticCurveTo(36, 32, 18, 48);
  ctx.lineTo(8, 12);
  ctx.closePath();
  ctx.stroke();

  // Crack
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(-8, -44);
  ctx.lineTo(-8, 12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(8, -44);
  ctx.lineTo(8, 12);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
  return canvas;
}

// 7. ui-world — Fantasy globe/planet with ring
function drawWorld() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;

  // Planet circle
  ctx.beginPath();
  ctx.arc(0, 0, 36, 0, Math.PI * 2);
  ctx.stroke();

  // Continents (simplified blobs)
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(-12, -12, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(16, 8, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-8, 20, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // Ring around planet
  ctx.beginPath();
  ctx.ellipse(0, 0, 52, 20, 0.3, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
  return canvas;
}

// 8. ui-chaos-rift — Jagged tear/portal
function drawChaosRift() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'miter';

  // Jagged vertical tear
  ctx.beginPath();
  ctx.moveTo(-8, -48);
  ctx.lineTo(-4, -32);
  ctx.lineTo(-12, -16);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-10, 16);
  ctx.lineTo(-4, 32);
  ctx.lineTo(-8, 48);
  ctx.lineTo(8, 48);
  ctx.lineTo(4, 32);
  ctx.lineTo(10, 16);
  ctx.lineTo(6, 0);
  ctx.lineTo(12, -16);
  ctx.lineTo(4, -32);
  ctx.lineTo(8, -48);
  ctx.closePath();
  ctx.fill();

  // Energy spikes radiating out
  ctx.lineWidth = 3;
  [[-32, -24], [-36, 0], [-32, 24], [32, -24], [36, 0], [32, 24]].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.moveTo(x < 0 ? -12 : 12, y);
    ctx.lineTo(x, y);
    ctx.stroke();
  });

  ctx.restore();
  return canvas;
}

// 9. ui-crystal-shard — Faceted crystal/diamond shard
function drawCrystalShard() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'miter';

  // Crystal outline
  ctx.beginPath();
  ctx.moveTo(0, -48);
  ctx.lineTo(20, -28);
  ctx.lineTo(16, 0);
  ctx.lineTo(24, 32);
  ctx.lineTo(0, 48);
  ctx.lineTo(-24, 32);
  ctx.lineTo(-16, 0);
  ctx.lineTo(-20, -28);
  ctx.closePath();
  ctx.stroke();

  // Facet lines
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -48);
  ctx.lineTo(0, 48);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-20, -28);
  ctx.lineTo(16, 0);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(20, -28);
  ctx.lineTo(-16, 0);
  ctx.stroke();

  ctx.restore();
  return canvas;
}

// 10. ui-hero — Fantasy hero silhouette (cloaked figure)
function drawHero() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;

  // Head
  ctx.beginPath();
  ctx.arc(0, -24, 12, 0, Math.PI * 2);
  ctx.fill();

  // Cloak/body
  ctx.beginPath();
  ctx.moveTo(-28, -8);
  ctx.quadraticCurveTo(-32, 0, -28, 12);
  ctx.lineTo(-12, 48);
  ctx.lineTo(12, 48);
  ctx.lineTo(28, 12);
  ctx.quadraticCurveTo(32, 0, 28, -8);
  ctx.lineTo(16, -12);
  ctx.quadraticCurveTo(16, -20, 8, -24);
  ctx.lineTo(-8, -24);
  ctx.quadraticCurveTo(-16, -20, -16, -12);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
  return canvas;
}

// 11. ui-chaos-motes-large — Multiple floating orbs
function drawChaosMotesLarge() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;

  // Floating orbs at various positions
  const orbs = [
    [0, -32, 10],
    [-24, -12, 8],
    [24, -12, 8],
    [-16, 16, 7],
    [16, 16, 7],
    [0, 36, 9],
    [-32, 28, 6],
    [32, 28, 6],
  ];

  orbs.forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
  return canvas;
}

// 12. ui-chest-basic — Simple wooden chest
function drawChestBasic() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';

  // Chest body
  ctx.beginPath();
  ctx.rect(-32, -8, 64, 40);
  ctx.stroke();

  // Lid
  ctx.beginPath();
  ctx.moveTo(-32, -8);
  ctx.quadraticCurveTo(0, -36, 32, -8);
  ctx.stroke();

  // Lock
  ctx.beginPath();
  ctx.arc(0, 8, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  return canvas;
}

// 13. ui-chest-rare — Silver chest with gem
function drawChestRare() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';

  // Chest body
  ctx.beginPath();
  ctx.rect(-32, -8, 64, 40);
  ctx.fill();
  ctx.stroke();

  // Lid
  ctx.beginPath();
  ctx.moveTo(-32, -8);
  ctx.quadraticCurveTo(0, -40, 32, -8);
  ctx.fill();
  ctx.stroke();

  // Gem on lid
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.moveTo(0, -32);
  ctx.lineTo(-8, -20);
  ctx.lineTo(-6, -12);
  ctx.lineTo(6, -12);
  ctx.lineTo(8, -20);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -32);
  ctx.lineTo(-8, -20);
  ctx.lineTo(-6, -12);
  ctx.lineTo(6, -12);
  ctx.lineTo(8, -20);
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
  return canvas;
}

// 14. ui-chest-epic — Ornate gold chest with glow lines
function drawChestEpic() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';

  // Chest body with ornate corners
  ctx.beginPath();
  ctx.moveTo(-32, -6);
  ctx.lineTo(-32, 28);
  ctx.lineTo(-28, 32);
  ctx.lineTo(28, 32);
  ctx.lineTo(32, 28);
  ctx.lineTo(32, -6);
  ctx.stroke();

  // Ornate lid
  ctx.beginPath();
  ctx.moveTo(-32, -6);
  ctx.quadraticCurveTo(-16, -44, 0, -44);
  ctx.quadraticCurveTo(16, -44, 32, -6);
  ctx.stroke();

  // Glow lines
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-24, -4);
  ctx.quadraticCurveTo(-12, -32, 0, -32);
  ctx.quadraticCurveTo(12, -32, 24, -4);
  ctx.stroke();

  // Central gem
  ctx.beginPath();
  ctx.moveTo(0, -36);
  ctx.lineTo(-6, -26);
  ctx.lineTo(6, -26);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
  return canvas;
}

// 15. ui-tier-free — Simple shield/adventurer badge
function drawTierFree() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;

  // Simple shield
  ctx.beginPath();
  ctx.moveTo(-32, -40);
  ctx.lineTo(32, -40);
  ctx.lineTo(32, 8);
  ctx.quadraticCurveTo(32, 32, 0, 48);
  ctx.quadraticCurveTo(-32, 32, -32, 8);
  ctx.closePath();
  ctx.stroke();

  // Chevron
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-20, -12);
  ctx.lineTo(0, 8);
  ctx.lineTo(20, -12);
  ctx.stroke();

  ctx.restore();
  return canvas;
}

// 16. ui-tier-adept — Chaos symbol with energy
function drawTierAdept() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;

  // Central chaos symbol (8-pointed star)
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const x = Math.cos(angle) * (i % 2 === 0 ? 32 : 16);
    const y = Math.sin(angle) * (i % 2 === 0 ? 32 : 16);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Energy ring
  ctx.beginPath();
  ctx.arc(0, 0, 42, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
  return canvas;
}

// 17. ui-tier-master — Ornate fantasy crown
function drawTierMaster() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';

  // Crown base
  ctx.beginPath();
  ctx.moveTo(-40, 16);
  ctx.lineTo(-40, 32);
  ctx.lineTo(40, 32);
  ctx.lineTo(40, 16);
  ctx.stroke();

  // Crown peaks
  ctx.beginPath();
  ctx.moveTo(-40, 16);
  ctx.lineTo(-32, -32);
  ctx.lineTo(-24, 8);
  ctx.lineTo(-16, -40);
  ctx.lineTo(-8, 8);
  ctx.lineTo(0, -48);
  ctx.lineTo(8, 8);
  ctx.lineTo(16, -40);
  ctx.lineTo(24, 8);
  ctx.lineTo(32, -32);
  ctx.lineTo(40, 16);
  ctx.stroke();

  // Jewels on peaks
  [-16, 0, 16].forEach(x => {
    ctx.beginPath();
    ctx.arc(x, x === 0 ? -48 : -40, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
  return canvas;
}

// 18. ui-mission-trophy — Fantasy trophy/chalice
function drawMissionTrophy() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';

  // Cup
  ctx.beginPath();
  ctx.moveTo(-20, -32);
  ctx.lineTo(-24, 0);
  ctx.quadraticCurveTo(-24, 12, -12, 16);
  ctx.lineTo(12, 16);
  ctx.quadraticCurveTo(24, 12, 24, 0);
  ctx.lineTo(20, -32);
  ctx.closePath();
  ctx.stroke();

  // Handles
  ctx.beginPath();
  ctx.moveTo(-20, -24);
  ctx.quadraticCurveTo(-36, -20, -36, -8);
  ctx.quadraticCurveTo(-36, 0, -24, 0);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(20, -24);
  ctx.quadraticCurveTo(36, -20, 36, -8);
  ctx.quadraticCurveTo(36, 0, 24, 0);
  ctx.stroke();

  // Base
  ctx.beginPath();
  ctx.rect(-8, 16, 16, 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.rect(-16, 24, 32, 8);
  ctx.fill();

  ctx.restore();
  return canvas;
}

// 19. ui-mission-cards — Stack of cards
function drawMissionCards() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';

  // Back card
  ctx.beginPath();
  ctx.rect(-20, -40, 40, 56);
  ctx.stroke();

  // Middle card (offset)
  ctx.save();
  ctx.translate(8, -4);
  ctx.beginPath();
  ctx.rect(-20, -40, 40, 56);
  ctx.stroke();
  ctx.restore();

  // Front card (offset more)
  ctx.save();
  ctx.translate(16, -8);
  ctx.beginPath();
  ctx.rect(-20, -40, 40, 56);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.restore();
  return canvas;
}

// 20. ui-mission-creatures — Creature head silhouette
function drawMissionCreatures() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;

  // Dragon-like head
  ctx.beginPath();
  ctx.moveTo(0, -48);
  ctx.quadraticCurveTo(-32, -40, -32, -12);
  ctx.lineTo(-28, 16);
  ctx.lineTo(-12, 32);
  ctx.lineTo(12, 32);
  ctx.lineTo(28, 16);
  ctx.lineTo(32, -12);
  ctx.quadraticCurveTo(32, -40, 0, -48);
  ctx.closePath();
  ctx.fill();

  // Eyes
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(-12, -16, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(12, -16, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // Horns
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-24, -32);
  ctx.lineTo(-36, -48);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(24, -32);
  ctx.lineTo(36, -48);
  ctx.stroke();

  ctx.restore();
  return canvas;
}

// 21. ui-mission-spells — Magic staff with sparkle
function drawMissionSpells() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  // Staff
  ctx.beginPath();
  ctx.moveTo(0, -48);
  ctx.lineTo(0, 48);
  ctx.stroke();

  // Orb at top
  ctx.beginPath();
  ctx.arc(0, -40, 12, 0, Math.PI * 2);
  ctx.fill();

  // Sparkles
  ctx.lineWidth = 3;
  [[-20, -48], [20, -48], [-24, -32], [24, -32]].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.moveTo(x - 4, y);
    ctx.lineTo(x + 4, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x, y + 4);
    ctx.stroke();
  });

  ctx.restore();
  return canvas;
}

// 22. ui-mission-evolve — Upward spiral/transformation
function drawMissionEvolve() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  // Spiral
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const angle = (i / 40) * Math.PI * 4;
    const radius = (i / 40) * 32;
    const x = Math.cos(angle - Math.PI / 2) * radius;
    const y = Math.sin(angle - Math.PI / 2) * radius - 16;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Arrow at top
  ctx.beginPath();
  ctx.moveTo(0, -48);
  ctx.lineTo(-12, -32);
  ctx.moveTo(0, -48);
  ctx.lineTo(12, -32);
  ctx.stroke();

  ctx.restore();
  return canvas;
}

// 23. ui-mission-games — Two crossed swords
function drawMissionGames() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';

  // Left sword
  ctx.save();
  ctx.rotate(-Math.PI / 4);
  ctx.beginPath();
  ctx.moveTo(0, -44);
  ctx.lineTo(0, 44);
  ctx.stroke();
  // Crossguard
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-12, -36);
  ctx.lineTo(12, -36);
  ctx.stroke();
  ctx.restore();

  // Right sword
  ctx.save();
  ctx.rotate(Math.PI / 4);
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, -44);
  ctx.lineTo(0, 44);
  ctx.stroke();
  // Crossguard
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-12, -36);
  ctx.lineTo(12, -36);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
  return canvas;
}

// 24. ui-achieve-evolution — DNA helix/transformation spiral
function drawAchieveEvolution() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.strokeStyle = WHITE;
  ctx.fillStyle = WHITE;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  // DNA helix strands
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const y = -40 + (i / 40) * 80;
    const x = Math.sin((i / 40) * Math.PI * 4) * 16;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const y = -40 + (i / 40) * 80;
    const x = Math.sin((i / 40) * Math.PI * 4 + Math.PI) * 16;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Connecting bars
  ctx.lineWidth = 2;
  for (let i = 0; i <= 8; i++) {
    const y = -40 + (i / 8) * 80;
    const x1 = Math.sin((i / 8) * Math.PI * 4) * 16;
    const x2 = Math.sin((i / 8) * Math.PI * 4 + Math.PI) * 16;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
  }

  ctx.restore();
  return canvas;
}

// 25. ui-achieve-battle — Crossed swords shield
function drawAchieveBattle() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;

  // Shield
  ctx.beginPath();
  ctx.moveTo(-28, -36);
  ctx.lineTo(28, -36);
  ctx.lineTo(28, 4);
  ctx.quadraticCurveTo(28, 24, 0, 40);
  ctx.quadraticCurveTo(-28, 24, -28, 4);
  ctx.closePath();
  ctx.stroke();

  // Crossed swords
  ctx.lineWidth = 3;
  ctx.save();
  ctx.rotate(-Math.PI / 6);
  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.lineTo(0, 24);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.rotate(Math.PI / 6);
  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.lineTo(0, 24);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
  return canvas;
}

// 26. ui-achieve-collection — Open book/card album
function drawAchieveCollection() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';

  // Open book
  ctx.beginPath();
  ctx.moveTo(-40, -24);
  ctx.lineTo(-40, 32);
  ctx.lineTo(-4, 36);
  ctx.lineTo(-4, -20);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(40, -24);
  ctx.lineTo(40, 32);
  ctx.lineTo(4, 36);
  ctx.lineTo(4, -20);
  ctx.closePath();
  ctx.stroke();

  // Binding
  ctx.beginPath();
  ctx.moveTo(-4, -20);
  ctx.quadraticCurveTo(0, -28, 4, -20);
  ctx.stroke();

  // Page lines
  ctx.lineWidth = 2;
  [-32, -24, -16].forEach(x => {
    ctx.beginPath();
    ctx.moveTo(x, -8);
    ctx.lineTo(x, 20);
    ctx.stroke();
  });

  [16, 24, 32].forEach(x => {
    ctx.beginPath();
    ctx.moveTo(x, -8);
    ctx.lineTo(x, 20);
    ctx.stroke();
  });

  ctx.restore();
  return canvas;
}

// 27. ui-achieve-chaos — D20 die face
function drawAchieveChaos() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'miter';

  // D20 as icosahedron outline
  const points = [
    [0, -40],
    [-28, -16],
    [-20, 16],
    [0, 36],
    [20, 16],
    [28, -16],
  ];

  // Draw faces
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  ctx.lineTo(points[1][0], points[1][1]);
  ctx.lineTo(points[2][0], points[2][1]);
  ctx.lineTo(points[3][0], points[3][1]);
  ctx.lineTo(points[4][0], points[4][1]);
  ctx.lineTo(points[5][0], points[5][1]);
  ctx.closePath();
  ctx.stroke();

  // Internal edges
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  ctx.lineTo(points[2][0], points[2][1]);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  ctx.lineTo(points[4][0], points[4][1]);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(points[3][0], points[3][1]);
  ctx.lineTo(points[1][0], points[1][1]);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(points[3][0], points[3][1]);
  ctx.lineTo(points[5][0], points[5][1]);
  ctx.stroke();

  // "20" text
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('20', 0, 0);

  ctx.restore();
  return canvas;
}

// 28. ui-achieve-social — Two figures/guild emblem
function drawAchieveSocial() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;

  // Left figure
  ctx.beginPath();
  ctx.arc(-16, -20, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-28, 0);
  ctx.lineTo(-28, 32);
  ctx.lineTo(-4, 32);
  ctx.lineTo(-4, 0);
  ctx.closePath();
  ctx.fill();

  // Right figure
  ctx.beginPath();
  ctx.arc(16, -20, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.lineTo(4, 32);
  ctx.lineTo(28, 32);
  ctx.lineTo(28, 0);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
  return canvas;
}

// 29. ui-trigger-order — Radiant sun/light burst
function drawTriggerOrder() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  // Central sun
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();

  // Rays
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const x1 = Math.cos(angle) * 20;
    const y1 = Math.sin(angle) * 20;
    const x2 = Math.cos(angle) * 44;
    const y2 = Math.sin(angle) * 44;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.restore();
  return canvas;
}

// 30. ui-trigger-chaos — Wild flame/chaos swirl
function drawTriggerChaos() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';

  // Flame shape
  ctx.beginPath();
  ctx.moveTo(0, -48);
  ctx.quadraticCurveTo(-24, -32, -20, -8);
  ctx.quadraticCurveTo(-16, 8, -8, 20);
  ctx.quadraticCurveTo(-4, 32, 0, 40);
  ctx.quadraticCurveTo(4, 32, 8, 20);
  ctx.quadraticCurveTo(16, 8, 20, -8);
  ctx.quadraticCurveTo(24, -32, 0, -48);
  ctx.closePath();
  ctx.fill();

  // Inner flame detail
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.moveTo(0, -32);
  ctx.quadraticCurveTo(-12, -20, -8, -4);
  ctx.quadraticCurveTo(-4, 8, 0, 16);
  ctx.quadraticCurveTo(4, 8, 8, -4);
  ctx.quadraticCurveTo(12, -20, 0, -32);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  ctx.restore();
  return canvas;
}

// 31. ui-trigger-play — Card with arrow entering field
function drawTriggerPlay() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';

  // Card
  ctx.beginPath();
  ctx.rect(-20, -32, 40, 56);
  ctx.stroke();

  // Arrow
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(32, -24);
  ctx.lineTo(32, 32);
  ctx.stroke();

  // Arrowhead
  ctx.beginPath();
  ctx.moveTo(32, 32);
  ctx.lineTo(24, 20);
  ctx.moveTo(32, 32);
  ctx.lineTo(40, 20);
  ctx.stroke();

  ctx.restore();
  return canvas;
}

// 32. ui-trigger-death — Tombstone/grave marker
function drawTriggerDeath() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';

  // Tombstone
  ctx.beginPath();
  ctx.moveTo(-24, -16);
  ctx.lineTo(-24, 40);
  ctx.lineTo(24, 40);
  ctx.lineTo(24, -16);
  ctx.quadraticCurveTo(24, -40, 0, -40);
  ctx.quadraticCurveTo(-24, -40, -24, -16);
  ctx.closePath();
  ctx.fill();

  // Cross
  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(0, 12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-12, -4);
  ctx.lineTo(12, -4);
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';

  ctx.restore();
  return canvas;
}

// 33. ui-trigger-damage — Cracked heart/wound mark
function drawTriggerDamage() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;

  // Heart shape
  ctx.beginPath();
  ctx.moveTo(0, 12);
  ctx.quadraticCurveTo(-40, -24, -20, -36);
  ctx.quadraticCurveTo(0, -28, 0, -20);
  ctx.quadraticCurveTo(0, -28, 20, -36);
  ctx.quadraticCurveTo(40, -24, 0, 12);
  ctx.closePath();
  ctx.fill();

  // Crack
  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineWidth = 5;
  ctx.setLineDash([8, 4]);
  ctx.beginPath();
  ctx.moveTo(-8, -28);
  ctx.lineTo(-4, -8);
  ctx.lineTo(8, 8);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalCompositeOperation = 'source-over';

  ctx.restore();
  return canvas;
}

// 34. ui-trigger-attack — Forward-striking sword
function drawTriggerAttack() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);
  ctx.rotate(Math.PI / 4);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';

  // Blade
  ctx.beginPath();
  ctx.moveTo(0, -44);
  ctx.lineTo(0, 36);
  ctx.stroke();

  // Crossguard
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-16, -36);
  ctx.lineTo(16, -36);
  ctx.stroke();

  // Pommel
  ctx.beginPath();
  ctx.arc(0, 42, 6, 0, Math.PI * 2);
  ctx.fill();

  // Motion lines
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-24, -20);
  ctx.lineTo(-16, -16);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-28, -8);
  ctx.lineTo(-20, -4);
  ctx.stroke();

  ctx.restore();
  return canvas;
}

// 35. ui-evolution-sparkle — Magical transformation particle burst
function drawEvolutionSparkle() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  // Large central sparkle
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-16, 0);
  ctx.lineTo(16, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(0, 16);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-12, -12);
  ctx.lineTo(12, 12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-12, 12);
  ctx.lineTo(12, -12);
  ctx.stroke();

  // Small sparkles around
  ctx.lineWidth = 3;
  const sparkles = [
    [-32, -32], [32, -32], [-32, 32], [32, 32],
  ];
  sparkles.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.moveTo(x - 6, y);
    ctx.lineTo(x + 6, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - 6);
    ctx.lineTo(x, y + 6);
    ctx.stroke();
  });

  ctx.restore();
  return canvas;
}

// 36. ui-attune-order — Geometric harmony symbol
function drawAttuneOrder() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;

  // Perfect circle
  ctx.beginPath();
  ctx.arc(0, 0, 32, 0, Math.PI * 2);
  ctx.stroke();

  // Square inside
  ctx.beginPath();
  ctx.rect(-22, -22, 44, 44);
  ctx.stroke();

  // Triangle inside
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(-14, 8);
  ctx.lineTo(14, 8);
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
  return canvas;
}

// 37. ui-attune-chaos — Wild asymmetric flame symbol
function drawAttuneChaos() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';

  // Asymmetric chaos swirl
  ctx.beginPath();
  ctx.moveTo(0, -40);
  ctx.quadraticCurveTo(32, -20, 24, 8);
  ctx.quadraticCurveTo(16, 32, 0, 40);
  ctx.quadraticCurveTo(-24, 24, -32, 0);
  ctx.quadraticCurveTo(-28, -24, 0, -40);
  ctx.closePath();
  ctx.fill();

  // Wild tendrils
  ctx.strokeStyle = WHITE;
  ctx.beginPath();
  ctx.moveTo(24, -16);
  ctx.quadraticCurveTo(40, -12, 44, -4);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-28, 8);
  ctx.quadraticCurveTo(-40, 16, -44, 24);
  ctx.stroke();

  ctx.restore();
  return canvas;
}

// 38. ui-sort-rarity — Crystal star
function drawSortRarity() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;

  // 5-pointed star
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
    const x = Math.cos(angle) * 40;
    const y = Math.sin(angle) * 40;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);

    // Inner point
    const innerAngle = angle + Math.PI / 5;
    const ix = Math.cos(innerAngle) * 16;
    const iy = Math.sin(innerAngle) * 16;
    ctx.lineTo(ix, iy);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
  return canvas;
}

// 39. ui-achievement-medal — Medal/ribbon badge
function drawAchievementMedal() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);

  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';

  // Medal circle
  ctx.beginPath();
  ctx.arc(0, 12, 28, 0, Math.PI * 2);
  ctx.fill();

  // Star inside
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
    const x = Math.cos(angle) * 16;
    const y = Math.sin(angle) * 16 + 12;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);

    const innerAngle = angle + Math.PI / 5;
    const ix = Math.cos(innerAngle) * 8;
    const iy = Math.sin(innerAngle) * 8 + 12;
    ctx.lineTo(ix, iy);
  }
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // Ribbon
  ctx.fillStyle = WHITE;
  ctx.beginPath();
  ctx.moveTo(-16, -40);
  ctx.lineTo(-8, -40);
  ctx.lineTo(-8, 0);
  ctx.lineTo(-16, 8);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(16, -40);
  ctx.lineTo(8, -40);
  ctx.lineTo(8, 0);
  ctx.lineTo(16, 8);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
  return canvas;
}

// ==========================================================================
// Main Execution
// ==========================================================================
console.log('🎨 Generating UI Icons...\n');

const icons = [
  // Battle UI
  { name: 'ui-chaos-mana', fn: drawChaosMana },
  { name: 'ui-chaos-spark', fn: drawChaosSpark },
  { name: 'ui-hourglass', fn: drawHourglass },
  { name: 'ui-battle-log', fn: drawBattleLog },

  // Post-Match
  { name: 'ui-victory', fn: drawVictory },
  { name: 'ui-defeat', fn: drawDefeat },

  // Onboarding
  { name: 'ui-world', fn: drawWorld },
  { name: 'ui-chaos-rift', fn: drawChaosRift },
  { name: 'ui-crystal-shard', fn: drawCrystalShard },
  { name: 'ui-hero', fn: drawHero },
  { name: 'ui-chaos-motes-large', fn: drawChaosMotesLarge },

  // Pack Types
  { name: 'ui-chest-basic', fn: drawChestBasic },
  { name: 'ui-chest-rare', fn: drawChestRare },
  { name: 'ui-chest-epic', fn: drawChestEpic },

  // Subscription Tiers
  { name: 'ui-tier-free', fn: drawTierFree },
  { name: 'ui-tier-adept', fn: drawTierAdept },
  { name: 'ui-tier-master', fn: drawTierMaster },

  // Mission Types
  { name: 'ui-mission-trophy', fn: drawMissionTrophy },
  { name: 'ui-mission-cards', fn: drawMissionCards },
  { name: 'ui-mission-creatures', fn: drawMissionCreatures },
  { name: 'ui-mission-spells', fn: drawMissionSpells },
  { name: 'ui-mission-evolve', fn: drawMissionEvolve },
  { name: 'ui-mission-games', fn: drawMissionGames },

  // Achievement Categories
  { name: 'ui-achieve-evolution', fn: drawAchieveEvolution },
  { name: 'ui-achieve-battle', fn: drawAchieveBattle },
  { name: 'ui-achieve-collection', fn: drawAchieveCollection },
  { name: 'ui-achieve-chaos', fn: drawAchieveChaos },
  { name: 'ui-achieve-social', fn: drawAchieveSocial },

  // Trigger Types
  { name: 'ui-trigger-order', fn: drawTriggerOrder },
  { name: 'ui-trigger-chaos', fn: drawTriggerChaos },
  { name: 'ui-trigger-play', fn: drawTriggerPlay },
  { name: 'ui-trigger-death', fn: drawTriggerDeath },
  { name: 'ui-trigger-damage', fn: drawTriggerDamage },
  { name: 'ui-trigger-attack', fn: drawTriggerAttack },

  // Evolution UI
  { name: 'ui-evolution-sparkle', fn: drawEvolutionSparkle },
  { name: 'ui-attune-order', fn: drawAttuneOrder },
  { name: 'ui-attune-chaos', fn: drawAttuneChaos },

  // Misc
  { name: 'ui-sort-rarity', fn: drawSortRarity },
  { name: 'ui-achievement-medal', fn: drawAchievementMedal },
];

icons.forEach(({ name, fn }) => {
  const canvas = fn();
  saveIcon(canvas, name);
});

console.log(`\n✅ Generated ${icons.length} UI icons`);
console.log(`📁 Previews: ${PREVIEW_DIR}`);
console.log(`📦 Installed to: ${UI_ICONS_DIR}`);
