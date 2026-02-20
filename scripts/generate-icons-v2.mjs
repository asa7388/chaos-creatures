#!/usr/bin/env node
// generate-icons-v2.mjs — Programmatic icon generation using node-canvas + ImageMagick
// All icons drawn as clean vectors, no AI generation needed. $0 cost.
// Produces 75+ icons across 11 categories.

import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync, copyFileSync, existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const PREVIEW_DIR = join(PROJECT_ROOT, 'scripts/preview/icons-v2');
const ASSETS_DIR = join(PROJECT_ROOT, 'ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets');

mkdirSync(PREVIEW_DIR, { recursive: true });

// ==========================================================================
// Faction Color Map
// ==========================================================================
const FACTION_COLORS = {
  ironwright:          { primary: '#6B7B8D', accent: '#E07020', metal: '#6B7B8D' },
  feyVerdant:          { primary: '#2E8B57', accent: '#D4AF37', metal: '#2E8B57' },
  feyHollow:           { primary: '#A0C4E8', accent: '#93C5FD', metal: '#D1D5DB' },
  demonicFurnace:      { primary: '#FF4500', accent: '#DC2626', metal: '#1F1F1F' },
  demonicBureaucracy:  { primary: '#991B1B', accent: '#991B1B', metal: '#1C1917' },
  celestialKnights:    { primary: '#3B5998', accent: '#3B82F6', metal: '#D4AF37' },
  celestialChosen:     { primary: '#F59E0B', accent: '#FFF1F2', metal: '#F59E0B' },
  endlessCabals:       { primary: '#2DD4BF', accent: '#2DD4BF', metal: '#D6D3D1' },
  endlessSpectres:     { primary: '#4ADE80', accent: '#4ADE80', metal: '#9CA3AF' },
  neutral:             { primary: '#CD7F32', accent: '#CD7F32', metal: '#CD7F32' },
};

const FACTION_KEYS = Object.keys(FACTION_COLORS);

// ==========================================================================
// Color Helpers
// ==========================================================================
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function darken(hex, amount = 0.3) {
  const { r, g, b } = hexToRgb(hex);
  const f = 1 - amount;
  return `rgb(${Math.round(r * f)}, ${Math.round(g * f)}, ${Math.round(b * f)})`;
}

function lighten(hex, amount = 0.3) {
  const { r, g, b } = hexToRgb(hex);
  const f = amount;
  return `rgb(${Math.round(r + (255 - r) * f)}, ${Math.round(g + (255 - g) * f)}, ${Math.round(b + (255 - b) * f)})`;
}

function withAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ==========================================================================
// ImageMagick Emboss Post-Process
// ==========================================================================
function applyEmboss(inputPath, outputPath, strength = 'normal') {
  try {
    if (strength === 'strong') {
      // Stronger emboss for stat containers (256x256)
      execSync(`magick "${inputPath}" \\( +clone -shade 130x50 -normalize \\) -compose soft-light -composite "${outputPath}"`, { stdio: 'pipe' });
    } else {
      // Subtle emboss for icons
      execSync(`magick "${inputPath}" \\( +clone -shade 120x45 -normalize \\) -compose overlay -composite -level 10%,90% "${outputPath}"`, { stdio: 'pipe' });
    }
    return true;
  } catch (err) {
    console.warn(`    WARN: ImageMagick emboss failed for ${inputPath}: ${err.message}`);
    // Copy input as output if emboss fails
    if (inputPath !== outputPath) {
      copyFileSync(inputPath, outputPath);
    }
    return false;
  }
}

// ==========================================================================
// Xcode Asset Catalog Install
// ==========================================================================
function installToXcode(name, sourceFile, subfolder) {
  const categoryDir = join(ASSETS_DIR, subfolder);
  const imagesetDir = join(categoryDir, `${name}.imageset`);
  mkdirSync(imagesetDir, { recursive: true });

  // Ensure category Contents.json exists (provides-namespace)
  const catContents = join(categoryDir, 'Contents.json');
  if (!existsSync(catContents)) {
    writeFileSync(catContents, JSON.stringify({
      info: { author: 'xcode', version: 1 },
      properties: { 'provides-namespace': true },
    }, null, 2));
  }

  // Copy image
  const destFile = join(imagesetDir, `${name}.png`);
  copyFileSync(sourceFile, destFile);

  // Write Contents.json
  writeFileSync(join(imagesetDir, 'Contents.json'), JSON.stringify({
    images: [{ filename: `${name}.png`, idiom: 'universal' }],
    info: { author: 'xcode', version: 1 },
  }, null, 2));
}

// ==========================================================================
// Canvas Save + Emboss + Install pipeline
// ==========================================================================
function saveAndInstall(canvas, name, subfolder, embossStrength = 'normal') {
  const rawPath = join(PREVIEW_DIR, `${name}-raw.png`);
  const finalPath = join(PREVIEW_DIR, `${name}.png`);

  // Save raw from canvas
  const buffer = canvas.toBuffer('image/png');
  writeFileSync(rawPath, buffer);

  // Apply emboss
  applyEmboss(rawPath, finalPath, embossStrength);

  // Install to Xcode
  installToXcode(name, finalPath, subfolder);

  const finalSize = existsSync(finalPath) ? readFileSync(finalPath).length : buffer.length;
  return finalSize;
}

// ==========================================================================
// 1. ATK Icons (10 faction variants, 128x128)
// Fractured blade / serrated shard silhouette
// ==========================================================================
function drawATKIcon(factionKey) {
  const size = 128;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const colors = FACTION_COLORS[factionKey];

  ctx.clearRect(0, 0, size, size);

  // Draw fractured blade shard
  ctx.save();
  ctx.translate(size / 2, size / 2);

  // Main blade shape - a serrated, fractured shard
  ctx.beginPath();
  ctx.moveTo(0, -52);       // tip
  ctx.lineTo(12, -38);      // right notch top
  ctx.lineTo(8, -30);       // right notch inner
  ctx.lineTo(16, -18);      // right serration
  ctx.lineTo(10, -8);       // right inner
  ctx.lineTo(18, 5);        // right lower serration
  ctx.lineTo(12, 15);       // right taper
  ctx.lineTo(16, 28);       // right base serration
  ctx.lineTo(8, 38);        // right base
  ctx.lineTo(4, 52);        // bottom right
  ctx.lineTo(-4, 52);       // bottom left
  ctx.lineTo(-8, 38);       // left base
  ctx.lineTo(-16, 28);      // left base serration
  ctx.lineTo(-12, 15);      // left taper
  ctx.lineTo(-18, 5);       // left lower serration
  ctx.lineTo(-10, -8);      // left inner
  ctx.lineTo(-16, -18);     // left serration
  ctx.lineTo(-8, -30);      // left notch inner
  ctx.lineTo(-12, -38);     // left notch top
  ctx.closePath();

  // Fill with metal color
  const grad = ctx.createLinearGradient(-18, -52, 18, 52);
  grad.addColorStop(0, lighten(colors.metal, 0.3));
  grad.addColorStop(0.5, colors.metal);
  grad.addColorStop(1, darken(colors.metal, 0.3));
  ctx.fillStyle = grad;
  ctx.fill();

  // Fracture line down the center
  ctx.beginPath();
  ctx.moveTo(-1, -48);
  ctx.lineTo(2, -30);
  ctx.lineTo(-2, -15);
  ctx.lineTo(3, 0);
  ctx.lineTo(-1, 20);
  ctx.lineTo(1, 45);
  ctx.strokeStyle = darken(colors.metal, 0.5);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Stroke outline
  ctx.beginPath();
  ctx.moveTo(0, -52);
  ctx.lineTo(12, -38);
  ctx.lineTo(8, -30);
  ctx.lineTo(16, -18);
  ctx.lineTo(10, -8);
  ctx.lineTo(18, 5);
  ctx.lineTo(12, 15);
  ctx.lineTo(16, 28);
  ctx.lineTo(8, 38);
  ctx.lineTo(4, 52);
  ctx.lineTo(-4, 52);
  ctx.lineTo(-8, 38);
  ctx.lineTo(-16, 28);
  ctx.lineTo(-12, 15);
  ctx.lineTo(-18, 5);
  ctx.lineTo(-10, -8);
  ctx.lineTo(-16, -18);
  ctx.lineTo(-8, -30);
  ctx.lineTo(-12, -38);
  ctx.closePath();
  ctx.strokeStyle = darken(colors.metal, 0.4);
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
  return canvas;
}

// ==========================================================================
// 2. HP Icons (10 faction variants, 128x128)
// Cracked shield / planar shard
// ==========================================================================
function drawHPIcon(factionKey) {
  const size = 128;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const colors = FACTION_COLORS[factionKey];

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);

  // Shield shape
  ctx.beginPath();
  ctx.moveTo(0, -48);        // top center
  ctx.lineTo(38, -36);       // top right
  ctx.lineTo(42, -10);       // right upper
  ctx.lineTo(38, 10);        // right mid
  ctx.lineTo(28, 30);        // right lower
  ctx.lineTo(0, 50);         // bottom point
  ctx.lineTo(-28, 30);       // left lower
  ctx.lineTo(-38, 10);       // left mid
  ctx.lineTo(-42, -10);      // left upper
  ctx.lineTo(-38, -36);      // top left
  ctx.closePath();

  // Fill with gradient
  const grad = ctx.createLinearGradient(-42, -48, 42, 50);
  grad.addColorStop(0, lighten(colors.metal, 0.25));
  grad.addColorStop(0.4, colors.metal);
  grad.addColorStop(1, darken(colors.metal, 0.25));
  ctx.fillStyle = grad;
  ctx.fill();

  // Crack lines
  ctx.strokeStyle = darken(colors.metal, 0.5);
  ctx.lineWidth = 1.5;

  // Main crack
  ctx.beginPath();
  ctx.moveTo(-5, -44);
  ctx.lineTo(3, -25);
  ctx.lineTo(-4, -10);
  ctx.lineTo(5, 5);
  ctx.lineTo(-2, 20);
  ctx.lineTo(4, 40);
  ctx.stroke();

  // Branch crack
  ctx.beginPath();
  ctx.moveTo(3, -25);
  ctx.lineTo(18, -15);
  ctx.lineTo(25, -5);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-4, -10);
  ctx.lineTo(-18, -2);
  ctx.lineTo(-25, 8);
  ctx.stroke();

  // Outline
  ctx.beginPath();
  ctx.moveTo(0, -48);
  ctx.lineTo(38, -36);
  ctx.lineTo(42, -10);
  ctx.lineTo(38, 10);
  ctx.lineTo(28, 30);
  ctx.lineTo(0, 50);
  ctx.lineTo(-28, 30);
  ctx.lineTo(-38, 10);
  ctx.lineTo(-42, -10);
  ctx.lineTo(-38, -36);
  ctx.closePath();
  ctx.strokeStyle = darken(colors.metal, 0.4);
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
  return canvas;
}

// ==========================================================================
// 3. Chaos Mote Orbs (10 faction variants, 64x64)
// Glowing orb with radial gradient
// ==========================================================================
function drawChaosMoteOrb(factionKey) {
  const size = 64;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const colors = FACTION_COLORS[factionKey];

  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const radius = 22;

  // Outer glow/halo
  const haloGrad = ctx.createRadialGradient(cx, cy, radius, cx, cy, radius + 10);
  haloGrad.addColorStop(0, withAlpha(colors.accent, 0.4));
  haloGrad.addColorStop(1, withAlpha(colors.accent, 0));
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 10, 0, Math.PI * 2);
  ctx.fill();

  // Main orb body
  const orbGrad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, radius);
  orbGrad.addColorStop(0, lighten(colors.primary, 0.5));
  orbGrad.addColorStop(0.4, colors.primary);
  orbGrad.addColorStop(0.8, darken(colors.primary, 0.3));
  orbGrad.addColorStop(1, darken(colors.primary, 0.5));
  ctx.fillStyle = orbGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Inner bright core highlight
  const coreGrad = ctx.createRadialGradient(cx - 5, cy - 5, 0, cx - 3, cy - 3, 10);
  coreGrad.addColorStop(0, withAlpha('#FFFFFF', 0.7));
  coreGrad.addColorStop(1, withAlpha('#FFFFFF', 0));
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 3, 10, 0, Math.PI * 2);
  ctx.fill();

  // Subtle outline
  ctx.strokeStyle = darken(colors.primary, 0.4);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  return canvas;
}

// ==========================================================================
// 4. Instability Indicator (1 icon, 64x64)
// Diamond/crystalline shard
// ==========================================================================
function drawInstabilityIndicator() {
  const size = 64;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const color = '#D4AF37'; // warm amber

  ctx.clearRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;

  // Diamond shape (rotated square)
  ctx.save();
  ctx.translate(cx, cy);

  // Outer diamond
  ctx.beginPath();
  ctx.moveTo(0, -26);
  ctx.lineTo(22, 0);
  ctx.lineTo(0, 26);
  ctx.lineTo(-22, 0);
  ctx.closePath();

  const grad = ctx.createLinearGradient(-22, -26, 22, 26);
  grad.addColorStop(0, lighten(color, 0.4));
  grad.addColorStop(0.5, color);
  grad.addColorStop(1, darken(color, 0.3));
  ctx.fillStyle = grad;
  ctx.fill();

  // Inner facet lines
  ctx.strokeStyle = darken(color, 0.3);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -26);
  ctx.lineTo(5, 0);
  ctx.lineTo(0, 26);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -26);
  ctx.lineTo(-5, 0);
  ctx.lineTo(0, 26);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-22, 0);
  ctx.lineTo(0, -5);
  ctx.lineTo(22, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-22, 0);
  ctx.lineTo(0, 5);
  ctx.lineTo(22, 0);
  ctx.stroke();

  // Outline
  ctx.beginPath();
  ctx.moveTo(0, -26);
  ctx.lineTo(22, 0);
  ctx.lineTo(0, 26);
  ctx.lineTo(-22, 0);
  ctx.closePath();
  ctx.strokeStyle = darken(color, 0.4);
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
  return canvas;
}

// ==========================================================================
// 5. Stat Container Shapes (5, 256x256)
// ==========================================================================
function drawStatContainer_Hexagonal() {
  // Ironwright - Industrial hexagon
  const size = 256;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const color = '#6B7B8D';
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);

  const r = 105;
  // Hexagon
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  const grad = ctx.createLinearGradient(-r, -r, r, r);
  grad.addColorStop(0, lighten(color, 0.15));
  grad.addColorStop(0.5, withAlpha(color, 0.85));
  grad.addColorStop(1, darken(color, 0.2));
  ctx.fillStyle = grad;
  ctx.fill();

  // Inner shadow gradient for depth
  const innerGrad = ctx.createRadialGradient(0, 0, 20, 0, 0, r);
  innerGrad.addColorStop(0, 'rgba(255,255,255,0.08)');
  innerGrad.addColorStop(1, 'rgba(0,0,0,0.15)');
  ctx.fillStyle = innerGrad;
  ctx.fill();

  // Bolt detail at top
  ctx.fillStyle = darken(color, 0.3);
  ctx.beginPath();
  ctx.arc(0, -r + 12, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = lighten(color, 0.2);
  ctx.beginPath();
  ctx.arc(0, -r + 11, 3, 0, Math.PI * 2);
  ctx.fill();

  // Border
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = darken(color, 0.4);
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.restore();
  return canvas;
}

function drawStatContainer_Leaf() {
  // Fey - Organic leaf/seed-pod shape
  const size = 256;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const color = '#2E8B57';
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);

  // Leaf shape using bezier curves
  ctx.beginPath();
  ctx.moveTo(0, -100);
  ctx.bezierCurveTo(60, -85, 95, -40, 90, 10);
  ctx.bezierCurveTo(85, 55, 50, 90, 0, 105);
  ctx.bezierCurveTo(-50, 90, -85, 55, -90, 10);
  ctx.bezierCurveTo(-95, -40, -60, -85, 0, -100);
  ctx.closePath();

  const grad = ctx.createLinearGradient(-90, -100, 90, 105);
  grad.addColorStop(0, lighten(color, 0.2));
  grad.addColorStop(0.5, withAlpha(color, 0.85));
  grad.addColorStop(1, darken(color, 0.2));
  ctx.fillStyle = grad;
  ctx.fill();

  // Inner shadow
  const innerGrad = ctx.createRadialGradient(0, 0, 15, 0, 0, 95);
  innerGrad.addColorStop(0, 'rgba(255,255,255,0.08)');
  innerGrad.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = innerGrad;
  ctx.fill();

  // Central vein
  ctx.strokeStyle = darken(color, 0.25);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -90);
  ctx.quadraticCurveTo(3, 0, 0, 95);
  ctx.stroke();

  // Side veins
  for (const yy of [-50, -20, 15, 45]) {
    ctx.beginPath();
    ctx.moveTo(0, yy);
    ctx.quadraticCurveTo(35, yy - 10, 55, yy - 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, yy);
    ctx.quadraticCurveTo(-35, yy - 10, -55, yy - 20);
    ctx.stroke();
  }

  // Border
  ctx.beginPath();
  ctx.moveTo(0, -100);
  ctx.bezierCurveTo(60, -85, 95, -40, 90, 10);
  ctx.bezierCurveTo(85, 55, 50, 90, 0, 105);
  ctx.bezierCurveTo(-50, 90, -85, 55, -90, 10);
  ctx.bezierCurveTo(-95, -40, -60, -85, 0, -100);
  ctx.closePath();
  ctx.strokeStyle = darken(color, 0.4);
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.restore();
  return canvas;
}

function drawStatContainer_JaggedShard() {
  // Demonic - Volcanic glass / broken obsidian
  const size = 256;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const color = '#1F1F1F';
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);

  // Jagged irregular shard shape
  ctx.beginPath();
  ctx.moveTo(0, -105);
  ctx.lineTo(25, -80);
  ctx.lineTo(55, -75);
  ctx.lineTo(80, -45);
  ctx.lineTo(95, -15);
  ctx.lineTo(85, 25);
  ctx.lineTo(70, 50);
  ctx.lineTo(45, 80);
  ctx.lineTo(15, 95);
  ctx.lineTo(-20, 90);
  ctx.lineTo(-55, 70);
  ctx.lineTo(-80, 40);
  ctx.lineTo(-95, 5);
  ctx.lineTo(-85, -35);
  ctx.lineTo(-60, -65);
  ctx.lineTo(-30, -90);
  ctx.closePath();

  const grad = ctx.createLinearGradient(-95, -105, 95, 95);
  grad.addColorStop(0, lighten(color, 0.25));
  grad.addColorStop(0.3, withAlpha(color, 0.85));
  grad.addColorStop(0.7, darken(color, 0.1));
  grad.addColorStop(1, '#0A0A0A');
  ctx.fillStyle = grad;
  ctx.fill();

  // Glassy reflection line
  ctx.strokeStyle = 'rgba(255,80,20,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-30, -85);
  ctx.lineTo(10, -20);
  ctx.lineTo(-15, 50);
  ctx.lineTo(15, 90);
  ctx.stroke();

  // Inner glow (red/orange for demonic)
  const innerGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 90);
  innerGrad.addColorStop(0, 'rgba(255,69,0,0.08)');
  innerGrad.addColorStop(1, 'rgba(0,0,0,0.1)');
  ctx.fillStyle = innerGrad;
  ctx.fill();

  // Border
  ctx.beginPath();
  ctx.moveTo(0, -105);
  ctx.lineTo(25, -80);
  ctx.lineTo(55, -75);
  ctx.lineTo(80, -45);
  ctx.lineTo(95, -15);
  ctx.lineTo(85, 25);
  ctx.lineTo(70, 50);
  ctx.lineTo(45, 80);
  ctx.lineTo(15, 95);
  ctx.lineTo(-20, 90);
  ctx.lineTo(-55, 70);
  ctx.lineTo(-80, 40);
  ctx.lineTo(-95, 5);
  ctx.lineTo(-85, -35);
  ctx.lineTo(-60, -65);
  ctx.lineTo(-30, -90);
  ctx.closePath();
  ctx.strokeStyle = 'rgba(255,69,0,0.5)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.restore();
  return canvas;
}

function drawStatContainer_Shield() {
  // Celestial - Heraldic shield
  const size = 256;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const color = '#D4AF37';
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);

  // Classic heraldic shield shape
  ctx.beginPath();
  ctx.moveTo(-85, -90);
  ctx.lineTo(85, -90);
  ctx.lineTo(85, -10);
  ctx.quadraticCurveTo(85, 50, 0, 105);
  ctx.quadraticCurveTo(-85, 50, -85, -10);
  ctx.closePath();

  const grad = ctx.createLinearGradient(-85, -90, 85, 105);
  grad.addColorStop(0, lighten(color, 0.3));
  grad.addColorStop(0.4, withAlpha(color, 0.85));
  grad.addColorStop(1, darken(color, 0.25));
  ctx.fillStyle = grad;
  ctx.fill();

  // Inner shadow for enamel depth
  const innerGrad = ctx.createRadialGradient(0, -10, 15, 0, 0, 100);
  innerGrad.addColorStop(0, 'rgba(255,255,255,0.1)');
  innerGrad.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = innerGrad;
  ctx.fill();

  // Cross detail (subtle)
  ctx.strokeStyle = lighten(color, 0.15);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -80);
  ctx.lineTo(0, 80);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-70, -20);
  ctx.lineTo(70, -20);
  ctx.stroke();

  // Border
  ctx.beginPath();
  ctx.moveTo(-85, -90);
  ctx.lineTo(85, -90);
  ctx.lineTo(85, -10);
  ctx.quadraticCurveTo(85, 50, 0, 105);
  ctx.quadraticCurveTo(-85, 50, -85, -10);
  ctx.closePath();
  ctx.strokeStyle = darken(color, 0.4);
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.restore();
  return canvas;
}

function drawStatContainer_Skull() {
  // Endless - Stylized angular skull
  const size = 256;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const color = '#D6D3D1';
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);

  // Angular skull shape
  ctx.beginPath();
  ctx.moveTo(0, -100);        // top of cranium
  ctx.bezierCurveTo(55, -100, 90, -65, 90, -25);  // right cranium
  ctx.lineTo(85, 10);         // right cheek
  ctx.lineTo(60, 30);         // right jaw
  ctx.lineTo(45, 55);         // right jaw point
  ctx.lineTo(20, 70);         // right chin
  ctx.lineTo(8, 90);          // right tooth
  ctx.lineTo(0, 80);          // center chin
  ctx.lineTo(-8, 90);         // left tooth
  ctx.lineTo(-20, 70);        // left chin
  ctx.lineTo(-45, 55);        // left jaw point
  ctx.lineTo(-60, 30);        // left jaw
  ctx.lineTo(-85, 10);        // left cheek
  ctx.lineTo(-90, -25);       // left cranium
  ctx.bezierCurveTo(-90, -65, -55, -100, 0, -100);
  ctx.closePath();

  const grad = ctx.createLinearGradient(-90, -100, 90, 90);
  grad.addColorStop(0, lighten(color, 0.2));
  grad.addColorStop(0.5, withAlpha(color, 0.85));
  grad.addColorStop(1, darken(color, 0.25));
  ctx.fillStyle = grad;
  ctx.fill();

  // Inner shadow
  const innerGrad = ctx.createRadialGradient(0, -15, 10, 0, 0, 90);
  innerGrad.addColorStop(0, 'rgba(255,255,255,0.06)');
  innerGrad.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = innerGrad;
  ctx.fill();

  // Eye sockets (dark voids)
  ctx.fillStyle = darken(color, 0.6);
  // Left eye
  ctx.beginPath();
  ctx.moveTo(-35, -30);
  ctx.lineTo(-15, -40);
  ctx.lineTo(-10, -20);
  ctx.lineTo(-25, -10);
  ctx.closePath();
  ctx.fill();
  // Right eye
  ctx.beginPath();
  ctx.moveTo(35, -30);
  ctx.lineTo(15, -40);
  ctx.lineTo(10, -20);
  ctx.lineTo(25, -10);
  ctx.closePath();
  ctx.fill();

  // Nose hole
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(8, 15);
  ctx.lineTo(-8, 15);
  ctx.closePath();
  ctx.fillStyle = darken(color, 0.5);
  ctx.fill();

  // Border
  ctx.beginPath();
  ctx.moveTo(0, -100);
  ctx.bezierCurveTo(55, -100, 90, -65, 90, -25);
  ctx.lineTo(85, 10);
  ctx.lineTo(60, 30);
  ctx.lineTo(45, 55);
  ctx.lineTo(20, 70);
  ctx.lineTo(8, 90);
  ctx.lineTo(0, 80);
  ctx.lineTo(-8, 90);
  ctx.lineTo(-20, 70);
  ctx.lineTo(-45, 55);
  ctx.lineTo(-60, 30);
  ctx.lineTo(-85, 10);
  ctx.lineTo(-90, -25);
  ctx.bezierCurveTo(-90, -65, -55, -100, 0, -100);
  ctx.closePath();
  ctx.strokeStyle = darken(color, 0.4);
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.restore();
  return canvas;
}

// ==========================================================================
// 6. Effect Modifier Keyword Icons (20 icons, 64x64, monochrome bronze)
// ==========================================================================
const BRONZE = '#CD7F32';

function drawKeywordIcon(keyword) {
  const size = 64;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);

  ctx.fillStyle = BRONZE;
  ctx.strokeStyle = darken(BRONZE, 0.3);
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (keyword) {
    case 'shield':
      // Small shield/buckler
      ctx.beginPath();
      ctx.moveTo(-18, -22);
      ctx.lineTo(18, -22);
      ctx.lineTo(18, 0);
      ctx.quadraticCurveTo(18, 18, 0, 26);
      ctx.quadraticCurveTo(-18, 18, -18, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Cross detail
      ctx.strokeStyle = darken(BRONZE, 0.2);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(0, 20);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-14, -2);
      ctx.lineTo(14, -2);
      ctx.stroke();
      break;

    case 'lifesteal':
      // Droplet with fang
      ctx.beginPath();
      ctx.moveTo(0, -24);
      ctx.quadraticCurveTo(20, 0, 16, 12);
      ctx.quadraticCurveTo(12, 24, 0, 26);
      ctx.quadraticCurveTo(-12, 24, -16, 12);
      ctx.quadraticCurveTo(-20, 0, 0, -24);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Fang hook inside
      ctx.strokeStyle = darken(BRONZE, 0.4);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(-4, 12);
      ctx.lineTo(0, 16);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(4, 12);
      ctx.lineTo(0, 16);
      ctx.stroke();
      break;

    case 'flying':
      // Single stylized wing
      ctx.beginPath();
      ctx.moveTo(-22, 18);
      ctx.quadraticCurveTo(-10, 2, 0, -8);
      ctx.quadraticCurveTo(10, -20, 24, -24);
      ctx.quadraticCurveTo(16, -14, 14, -6);
      ctx.quadraticCurveTo(20, -12, 26, -18);
      ctx.quadraticCurveTo(18, -4, 12, 2);
      ctx.quadraticCurveTo(6, 8, -4, 12);
      ctx.quadraticCurveTo(-12, 16, -22, 18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;

    case 'reach':
      // Spear reaching upward
      ctx.strokeStyle = BRONZE;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 26);
      ctx.lineTo(0, -16);
      ctx.stroke();
      // Spearhead
      ctx.fillStyle = BRONZE;
      ctx.beginPath();
      ctx.moveTo(0, -28);
      ctx.lineTo(8, -12);
      ctx.lineTo(-8, -12);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = darken(BRONZE, 0.3);
      ctx.lineWidth = 2;
      ctx.stroke();
      // Cross bar
      ctx.beginPath();
      ctx.moveTo(-10, -10);
      ctx.lineTo(10, -10);
      ctx.stroke();
      break;

    case 'deathtouch':
      // Skull with dripping
      ctx.beginPath();
      ctx.arc(0, -6, 14, Math.PI, 0);
      ctx.lineTo(14, 4);
      ctx.lineTo(8, 10);
      ctx.lineTo(4, 8);
      ctx.lineTo(0, 12);
      ctx.lineTo(-4, 8);
      ctx.lineTo(-8, 10);
      ctx.lineTo(-14, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Eyes
      ctx.fillStyle = darken(BRONZE, 0.6);
      ctx.beginPath();
      ctx.arc(-5, -6, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(5, -6, 3, 0, Math.PI * 2);
      ctx.fill();
      // Drip
      ctx.fillStyle = BRONZE;
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.quadraticCurveTo(2, 20, 0, 26);
      ctx.quadraticCurveTo(-2, 20, 0, 12);
      ctx.fill();
      break;

    case 'taunt':
      // Clenched fist
      ctx.beginPath();
      ctx.moveTo(-10, -20);
      ctx.lineTo(-14, -8);
      ctx.lineTo(-14, 10);
      ctx.lineTo(-10, 18);
      ctx.lineTo(10, 18);
      ctx.lineTo(14, 10);
      ctx.lineTo(14, -8);
      ctx.lineTo(10, -20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Finger lines
      ctx.strokeStyle = darken(BRONZE, 0.3);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-6, -18);
      ctx.lineTo(-6, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(0, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(6, -18);
      ctx.lineTo(6, 0);
      ctx.stroke();
      // Thumb
      ctx.beginPath();
      ctx.moveTo(-14, -2);
      ctx.lineTo(-20, -8);
      ctx.lineTo(-18, -14);
      ctx.lineTo(-14, -8);
      ctx.strokeStyle = BRONZE;
      ctx.lineWidth = 3;
      ctx.stroke();
      break;

    case 'piercing':
      // Arrow point penetrating
      ctx.beginPath();
      ctx.moveTo(0, -26);
      ctx.lineTo(8, -10);
      ctx.lineTo(4, -10);
      ctx.lineTo(4, 20);
      ctx.lineTo(-4, 20);
      ctx.lineTo(-4, -10);
      ctx.lineTo(-8, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Barrier line being pierced
      ctx.strokeStyle = darken(BRONZE, 0.3);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-20, 4);
      ctx.lineTo(-6, 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(6, 4);
      ctx.lineTo(20, 4);
      ctx.stroke();
      // Crack marks at penetration
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(-10, -4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(10, -4);
      ctx.stroke();
      break;

    case 'haste':
      // Lightning bolt
      ctx.beginPath();
      ctx.moveTo(4, -26);
      ctx.lineTo(-8, -4);
      ctx.lineTo(0, -4);
      ctx.lineTo(-6, 26);
      ctx.lineTo(10, 2);
      ctx.lineTo(2, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;

    case 'regenerate':
      // Circular arrows / ouroboros
      ctx.lineWidth = 3;
      ctx.strokeStyle = BRONZE;
      ctx.beginPath();
      ctx.arc(0, 0, 16, -0.5, Math.PI * 1.3);
      ctx.stroke();
      // Arrow head
      ctx.fillStyle = BRONZE;
      ctx.beginPath();
      const aAngle = Math.PI * 1.3;
      const ax = 16 * Math.cos(aAngle);
      const ay = 16 * Math.sin(aAngle);
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - 8, ay + 2);
      ctx.lineTo(ax - 2, ay - 7);
      ctx.closePath();
      ctx.fill();
      // Second arc
      ctx.strokeStyle = BRONZE;
      ctx.beginPath();
      ctx.arc(0, 0, 16, Math.PI * 1.5 - 0.5, Math.PI * 0.3 + Math.PI);
      ctx.stroke();
      // Second arrow
      const bAngle = Math.PI * 0.3 + Math.PI;
      const bx = 16 * Math.cos(bAngle);
      const by = 16 * Math.sin(bAngle);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + 8, by - 2);
      ctx.lineTo(bx + 2, by + 7);
      ctx.closePath();
      ctx.fill();
      break;

    case 'poison':
      // Dripping vial
      ctx.beginPath();
      ctx.moveTo(-6, -22);
      ctx.lineTo(6, -22);
      ctx.lineTo(6, -14);
      ctx.lineTo(14, -4);
      ctx.lineTo(14, 14);
      ctx.quadraticCurveTo(14, 22, 0, 22);
      ctx.quadraticCurveTo(-14, 22, -14, 14);
      ctx.lineTo(-14, -4);
      ctx.lineTo(-6, -14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Drops
      ctx.beginPath();
      ctx.arc(18, 18, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(20, 26, 2, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'stun':
      // Stars/impact marks
      for (const [sx, sy, sr] of [[0, -8, 10], [-14, 10, 7], [14, 10, 7]]) {
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI / 4) * i - Math.PI / 2;
          const rad = i % 2 === 0 ? sr : sr * 0.4;
          const px = sx + rad * Math.cos(angle);
          const py = sy + rad * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      break;

    case 'burn':
      // Small flame
      ctx.beginPath();
      ctx.moveTo(0, -24);
      ctx.quadraticCurveTo(14, -12, 14, 4);
      ctx.quadraticCurveTo(14, 20, 0, 24);
      ctx.quadraticCurveTo(-14, 20, -14, 4);
      ctx.quadraticCurveTo(-14, -12, 0, -24);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Inner flame
      ctx.fillStyle = lighten(BRONZE, 0.3);
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.quadraticCurveTo(7, -4, 6, 6);
      ctx.quadraticCurveTo(4, 14, 0, 16);
      ctx.quadraticCurveTo(-4, 14, -6, 6);
      ctx.quadraticCurveTo(-7, -4, 0, -12);
      ctx.closePath();
      ctx.fill();
      break;

    case 'freeze':
      // Snowflake/ice crystal
      ctx.strokeStyle = BRONZE;
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const ex = 20 * Math.cos(angle);
        const ey = 20 * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        // Branch
        const mx = 12 * Math.cos(angle);
        const my = 12 * Math.sin(angle);
        const branchAngle1 = angle + Math.PI / 6;
        const branchAngle2 = angle - Math.PI / 6;
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx + 6 * Math.cos(branchAngle1), my + 6 * Math.sin(branchAngle1));
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx + 6 * Math.cos(branchAngle2), my + 6 * Math.sin(branchAngle2));
        ctx.stroke();
      }
      // Center dot
      ctx.fillStyle = BRONZE;
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'drain':
      // Swirling vortex downward
      ctx.strokeStyle = BRONZE;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -6, 18, 0, Math.PI * 1.7);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 12, Math.PI * 0.3, Math.PI * 1.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 6, 6, Math.PI * 0.5, Math.PI * 2);
      ctx.stroke();
      // Center point
      ctx.fillStyle = BRONZE;
      ctx.beginPath();
      ctx.arc(0, 10, 3, 0, Math.PI * 2);
      ctx.fill();
      // Downward arrow
      ctx.beginPath();
      ctx.moveTo(0, 14);
      ctx.lineTo(0, 24);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-5, 20);
      ctx.lineTo(0, 26);
      ctx.lineTo(5, 20);
      ctx.fill();
      break;

    case 'buff':
      // Upward arrow with radiance
      ctx.beginPath();
      ctx.moveTo(0, -26);
      ctx.lineTo(14, -6);
      ctx.lineTo(6, -6);
      ctx.lineTo(6, 20);
      ctx.lineTo(-6, 20);
      ctx.lineTo(-6, -6);
      ctx.lineTo(-14, -6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Radiance lines
      ctx.strokeStyle = BRONZE;
      ctx.lineWidth = 1.5;
      for (const dx of [-18, 18]) {
        ctx.beginPath();
        ctx.moveTo(dx, -20);
        ctx.lineTo(dx * 0.6, -12);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(-22, -8);
      ctx.lineTo(-12, -4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(22, -8);
      ctx.lineTo(12, -4);
      ctx.stroke();
      break;

    case 'debuff':
      // Downward arrow with crack
      ctx.beginPath();
      ctx.moveTo(0, 26);
      ctx.lineTo(14, 6);
      ctx.lineTo(6, 6);
      ctx.lineTo(6, -20);
      ctx.lineTo(-6, -20);
      ctx.lineTo(-6, 6);
      ctx.lineTo(-14, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Crack lines
      ctx.strokeStyle = darken(BRONZE, 0.4);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-2, -16);
      ctx.lineTo(3, -6);
      ctx.lineTo(-1, 4);
      ctx.lineTo(2, 14);
      ctx.stroke();
      break;

    case 'summon':
      // Hand emerging upward
      ctx.beginPath();
      // Palm
      ctx.moveTo(-12, 24);
      ctx.lineTo(-12, 4);
      // Fingers
      ctx.lineTo(-14, -8);
      ctx.lineTo(-10, -12);
      ctx.lineTo(-8, -4);
      ctx.lineTo(-6, -16);
      ctx.lineTo(-2, -20);
      ctx.lineTo(0, -8);
      ctx.lineTo(2, -22);
      ctx.lineTo(6, -24);
      ctx.lineTo(6, -8);
      ctx.lineTo(8, -18);
      ctx.lineTo(12, -16);
      ctx.lineTo(10, -4);
      ctx.lineTo(12, 4);
      ctx.lineTo(12, 24);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;

    case 'transform':
      // Morphing shape/spiral
      ctx.strokeStyle = BRONZE;
      ctx.lineWidth = 2.5;
      // Spiral
      ctx.beginPath();
      for (let t = 0; t < Math.PI * 4; t += 0.1) {
        const r = 3 + t * 3.2;
        const x = r * Math.cos(t);
        const y = r * Math.sin(t);
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        if (r > 22) break;
      }
      ctx.stroke();
      // Arrow at end
      ctx.fillStyle = BRONZE;
      const endT = Math.PI * 3.5;
      const endR = 3 + endT * 3.2;
      const endX = Math.min(endR, 22) * Math.cos(endT);
      const endY = Math.min(endR, 22) * Math.sin(endT);
      ctx.beginPath();
      ctx.arc(endX, endY, 3, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'exile':
      // Dimensional rift/portal
      ctx.strokeStyle = BRONZE;
      ctx.lineWidth = 2.5;
      // Outer ellipse
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 14, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Inner void
      ctx.fillStyle = darken(BRONZE, 0.5);
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Crack lines radiating out
      ctx.strokeStyle = BRONZE;
      ctx.lineWidth = 1.5;
      for (const angle of [0.3, 1.2, 2.5, 3.8, 5.0, 5.8]) {
        ctx.beginPath();
        ctx.moveTo(22 * Math.cos(angle), 14 * Math.sin(angle));
        ctx.lineTo((22 + 6) * Math.cos(angle), (14 + 6) * Math.sin(angle));
        ctx.stroke();
      }
      break;

    case 'sacrifice':
      // Broken chain link
      ctx.strokeStyle = BRONZE;
      ctx.lineWidth = 3;
      // Left chain link (closed)
      ctx.beginPath();
      ctx.ellipse(-12, 0, 10, 16, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Right chain link (broken)
      ctx.beginPath();
      ctx.ellipse(12, 0, 10, 16, 0, Math.PI * 0.15, Math.PI * 1.85);
      ctx.stroke();
      // Break marks
      ctx.fillStyle = BRONZE;
      const breakAngle1 = Math.PI * 0.15;
      const breakAngle2 = Math.PI * 1.85;
      ctx.beginPath();
      ctx.arc(12 + 10 * Math.cos(breakAngle1), 16 * Math.sin(breakAngle1), 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(12 + 10 * Math.cos(breakAngle2), 16 * Math.sin(breakAngle2), 2, 0, Math.PI * 2);
      ctx.fill();
      break;
  }

  ctx.restore();
  return canvas;
}

// ==========================================================================
// 7. Faction Emblems (5 primary, 256x256)
// ==========================================================================
function drawFactionEmblem_Ironwright() {
  const size = 256;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const color = '#6B7B8D';
  const accent = '#E07020';
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);

  // Gear-flower mandala: 8 gear teeth forming a flower
  const numTeeth = 8;
  const outerR = 95;
  const innerR = 65;
  const toothDepth = 18;

  // Draw gear
  ctx.beginPath();
  for (let i = 0; i < numTeeth; i++) {
    const a1 = (Math.PI * 2 / numTeeth) * i;
    const a2 = a1 + Math.PI / numTeeth * 0.3;
    const a3 = a1 + Math.PI / numTeeth * 0.7;
    const a4 = a1 + Math.PI / numTeeth;

    if (i === 0) {
      ctx.moveTo(outerR * Math.cos(a1), outerR * Math.sin(a1));
    }
    ctx.lineTo((outerR + toothDepth) * Math.cos(a2), (outerR + toothDepth) * Math.sin(a2));
    ctx.lineTo((outerR + toothDepth) * Math.cos(a3), (outerR + toothDepth) * Math.sin(a3));
    ctx.lineTo(outerR * Math.cos(a4), outerR * Math.sin(a4));
  }
  ctx.closePath();

  const grad = ctx.createRadialGradient(0, 0, 20, 0, 0, outerR + toothDepth);
  grad.addColorStop(0, lighten(color, 0.3));
  grad.addColorStop(0.6, color);
  grad.addColorStop(1, darken(color, 0.25));
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = darken(color, 0.4);
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Inner ring
  ctx.beginPath();
  ctx.arc(0, 0, innerR, 0, Math.PI * 2);
  ctx.strokeStyle = darken(color, 0.3);
  ctx.lineWidth = 3;
  ctx.stroke();

  // Center hole
  ctx.beginPath();
  ctx.arc(0, 0, 25, 0, Math.PI * 2);
  ctx.fillStyle = darken(color, 0.5);
  ctx.fill();
  ctx.strokeStyle = darken(color, 0.3);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Flower petals inside (between inner ring and center)
  ctx.fillStyle = withAlpha(accent, 0.6);
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    ctx.beginPath();
    ctx.ellipse(
      42 * Math.cos(angle), 42 * Math.sin(angle),
      14, 8, angle, 0, Math.PI * 2
    );
    ctx.fill();
  }

  // Center dot (accent)
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  return canvas;
}

function drawFactionEmblem_Fey() {
  const size = 256;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const color = '#2E8B57';
  const accent = '#D4AF37';
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);

  // Crescent moon cradling a tree
  // Moon (crescent)
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(-20, -20, 70, 0, Math.PI * 2);
  ctx.fill();
  // Cut out inner circle for crescent
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(5, -30, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // Tree silhouette
  ctx.fillStyle = color;
  // Trunk
  ctx.fillRect(-4, 10, 8, 60);
  // Canopy layers
  ctx.beginPath();
  ctx.moveTo(0, -55);
  ctx.lineTo(30, -10);
  ctx.lineTo(20, -10);
  ctx.lineTo(40, 20);
  ctx.lineTo(-40, 20);
  ctx.lineTo(-20, -10);
  ctx.lineTo(-30, -10);
  ctx.closePath();
  ctx.fill();

  // Roots
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-4, 70);
  ctx.quadraticCurveTo(-20, 80, -35, 85);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4, 70);
  ctx.quadraticCurveTo(20, 80, 35, 85);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 70);
  ctx.lineTo(0, 85);
  ctx.stroke();

  // Outline ring
  ctx.strokeStyle = darken(color, 0.3);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, 110, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
  return canvas;
}

function drawFactionEmblem_Demonic() {
  const size = 256;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const color = '#1F1F1F';
  const accent = '#FF4500';
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);

  // Horned skull with flame crown
  // Skull
  ctx.fillStyle = darken('#E8E0D0', 0.2);
  ctx.beginPath();
  ctx.arc(0, 5, 55, Math.PI, 0);
  ctx.lineTo(55, 20);
  ctx.lineTo(40, 50);
  ctx.lineTo(20, 55);
  ctx.lineTo(8, 50);
  ctx.lineTo(0, 60);
  ctx.lineTo(-8, 50);
  ctx.lineTo(-20, 55);
  ctx.lineTo(-40, 50);
  ctx.lineTo(-55, 20);
  ctx.closePath();
  ctx.fill();

  // Eye sockets
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.ellipse(-20, 10, 12, 10, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(20, 10, 12, 10, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 25);
  ctx.lineTo(6, 38);
  ctx.lineTo(-6, 38);
  ctx.closePath();
  ctx.fill();

  // Horns
  ctx.fillStyle = darken('#E8E0D0', 0.35);
  // Left horn
  ctx.beginPath();
  ctx.moveTo(-35, -30);
  ctx.quadraticCurveTo(-60, -55, -55, -90);
  ctx.quadraticCurveTo(-48, -85, -42, -70);
  ctx.quadraticCurveTo(-38, -50, -25, -35);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = darken('#E8E0D0', 0.4);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Right horn
  ctx.beginPath();
  ctx.moveTo(35, -30);
  ctx.quadraticCurveTo(60, -55, 55, -90);
  ctx.quadraticCurveTo(48, -85, 42, -70);
  ctx.quadraticCurveTo(38, -50, 25, -35);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Flame crown
  ctx.fillStyle = accent;
  for (const [fx, fy, fh] of [[-25, -48, 25], [-10, -50, 35], [5, -52, 30], [20, -48, 28], [35, -45, 20]]) {
    ctx.beginPath();
    ctx.moveTo(fx - 6, fy);
    ctx.quadraticCurveTo(fx, fy - fh, fx + 2, fy - fh + 5);
    ctx.quadraticCurveTo(fx + 4, fy - fh * 0.6, fx + 6, fy);
    ctx.closePath();
    ctx.fill();
  }

  // Skull outline
  ctx.strokeStyle = darken(color, 0.5);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 5, 55, Math.PI, 0);
  ctx.lineTo(55, 20);
  ctx.lineTo(40, 50);
  ctx.lineTo(20, 55);
  ctx.lineTo(8, 50);
  ctx.lineTo(0, 60);
  ctx.lineTo(-8, 50);
  ctx.lineTo(-20, 55);
  ctx.lineTo(-40, 50);
  ctx.lineTo(-55, 20);
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
  return canvas;
}

function drawFactionEmblem_Celestial() {
  const size = 256;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const color = '#3B5998';
  const accent = '#D4AF37';
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);

  // Radiant shield with starburst
  // Shield shape
  ctx.beginPath();
  ctx.moveTo(-70, -75);
  ctx.lineTo(70, -75);
  ctx.lineTo(70, 10);
  ctx.quadraticCurveTo(70, 60, 0, 95);
  ctx.quadraticCurveTo(-70, 60, -70, 10);
  ctx.closePath();

  const grad = ctx.createLinearGradient(-70, -75, 70, 95);
  grad.addColorStop(0, lighten(color, 0.3));
  grad.addColorStop(0.5, color);
  grad.addColorStop(1, darken(color, 0.2));
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Starburst/halo in center
  ctx.fillStyle = accent;
  const numRays = 12;
  for (let i = 0; i < numRays; i++) {
    const angle = (Math.PI * 2 / numRays) * i;
    const longR = i % 2 === 0 ? 35 : 20;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(
      longR * Math.cos(angle - 0.08),
      longR * Math.sin(angle - 0.08)
    );
    ctx.lineTo(
      longR * Math.cos(angle + 0.08),
      longR * Math.sin(angle + 0.08)
    );
    ctx.closePath();
    ctx.fill();
  }

  // Center circle
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = lighten(accent, 0.3);
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  return canvas;
}

function drawFactionEmblem_Endless() {
  const size = 256;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const color = '#D6D3D1';
  const accent = '#2DD4BF';
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);

  // Phylactery (ornate vessel) with spectral glow

  // Spectral glow behind
  const glowGrad = ctx.createRadialGradient(0, 0, 20, 0, 0, 100);
  glowGrad.addColorStop(0, withAlpha(accent, 0.25));
  glowGrad.addColorStop(1, withAlpha(accent, 0));
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 100, 0, Math.PI * 2);
  ctx.fill();

  // Vessel body (elongated octagon)
  ctx.beginPath();
  ctx.moveTo(-25, -70);
  ctx.lineTo(25, -70);
  ctx.lineTo(40, -50);
  ctx.lineTo(40, 50);
  ctx.lineTo(25, 70);
  ctx.lineTo(-25, 70);
  ctx.lineTo(-40, 50);
  ctx.lineTo(-40, -50);
  ctx.closePath();

  const grad = ctx.createLinearGradient(-40, -70, 40, 70);
  grad.addColorStop(0, lighten(color, 0.2));
  grad.addColorStop(0.5, color);
  grad.addColorStop(1, darken(color, 0.25));
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = darken(color, 0.4);
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Ornate bands
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-38, -35);
  ctx.lineTo(38, -35);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-38, 35);
  ctx.lineTo(38, 35);
  ctx.stroke();

  // Central eye/gem
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.ellipse(0, 0, 18, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = darken(accent, 0.3);
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();

  // Lid/cap detail
  ctx.fillStyle = darken(color, 0.15);
  ctx.beginPath();
  ctx.moveTo(-20, -70);
  ctx.lineTo(20, -70);
  ctx.lineTo(15, -82);
  ctx.lineTo(-15, -82);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = darken(color, 0.4);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Top finial
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(0, -88, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  return canvas;
}

// ==========================================================================
// 8. Sub-Faction Emblems (10, 128x128) — simplified variants
// ==========================================================================
function drawSubFactionEmblem(subFaction) {
  const size = 128;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);

  switch (subFaction) {
    case 'foundry-directorate': {
      // Gear-flower with anvil center
      const color = '#6B7B8D';
      const accent = '#E07020';
      drawMiniGear(ctx, color, 48, 6);
      // Anvil in center
      ctx.fillStyle = darken(color, 0.3);
      ctx.beginPath();
      ctx.moveTo(-12, -6);
      ctx.lineTo(12, -6);
      ctx.lineTo(15, 2);
      ctx.lineTo(18, 2);
      ctx.lineTo(18, 8);
      ctx.lineTo(-18, 8);
      ctx.lineTo(-18, 2);
      ctx.lineTo(-15, 2);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'scrap-legions': {
      // Gear-flower with jagged broken teeth
      const color = '#6B7B8D';
      drawMiniGear(ctx, color, 48, 6, true); // broken=true
      ctx.fillStyle = darken(color, 0.4);
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'verdant-throne': {
      // Moon-tree with leaf crown
      const color = '#2E8B57';
      const accent = '#D4AF37';
      // Small crescent
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(-10, -15, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(2, -22, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      // Tree with leafy top
      ctx.fillStyle = color;
      ctx.fillRect(-2, 5, 4, 35);
      ctx.beginPath();
      ctx.arc(0, -5, 22, 0, Math.PI * 2);
      ctx.fill();
      // Leaf details
      ctx.fillStyle = lighten(color, 0.2);
      for (const [lx, ly] of [[-8, -12], [6, -8], [-3, -18], [10, -14]]) {
        ctx.beginPath();
        ctx.ellipse(lx, ly, 5, 3, lx * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'hollow-court': {
      // Moon-tree with bare thorny branches
      const color = '#A0C4E8';
      const accent = '#93C5FD';
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(-10, -15, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(2, -22, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      // Bare tree
      ctx.strokeStyle = darken(color, 0.3);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 40);
      ctx.lineTo(0, -5);
      ctx.stroke();
      // Bare branches
      ctx.lineWidth = 2;
      for (const [bx, by, ex, ey] of [
        [0, -5, -20, -25], [0, -5, 18, -22],
        [0, 5, -15, -8], [0, 5, 14, -5],
        [-20, -25, -28, -35], [18, -22, 26, -32],
      ]) {
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }
      // Thorns
      ctx.lineWidth = 1;
      for (const [tx, ty] of [[-10, -15], [8, -13], [-22, -30], [22, -27]]) {
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + 3, ty - 5);
        ctx.stroke();
      }
      break;
    }
    case 'furnace-lords': {
      // Horned skull wreathed in lava
      const accent = '#FF4500';
      drawMiniSkull(ctx, '#E8E0D0', accent);
      // Lava wreath
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 48, 0, Math.PI * 2);
      ctx.stroke();
      // Flame wisps
      for (const angle of [0.5, 1.5, 2.8, 4.0, 5.2]) {
        const fx = 48 * Math.cos(angle);
        const fy = 48 * Math.sin(angle);
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.moveTo(fx - 3, fy);
        ctx.quadraticCurveTo(fx, fy - 10, fx + 3, fy);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 'obsidian-bureaucracy': {
      // Horned skull with formal collar
      const color = '#1C1917';
      drawMiniSkull(ctx, '#E8E0D0', '#991B1B');
      // Formal collar/ruff
      ctx.strokeStyle = '#991B1B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-30, 25);
      ctx.quadraticCurveTo(-25, 35, -15, 38);
      ctx.quadraticCurveTo(-8, 42, 0, 38);
      ctx.quadraticCurveTo(8, 42, 15, 38);
      ctx.quadraticCurveTo(25, 35, 30, 25);
      ctx.stroke();
      // Second collar line
      ctx.beginPath();
      ctx.moveTo(-28, 30);
      ctx.quadraticCurveTo(-20, 42, -10, 44);
      ctx.quadraticCurveTo(0, 48, 10, 44);
      ctx.quadraticCurveTo(20, 42, 28, 30);
      ctx.stroke();
      break;
    }
    case 'knights-deliverance': {
      // Shield with sword cross
      const color = '#3B5998';
      const accent = '#D4AF37';
      // Shield
      ctx.beginPath();
      ctx.moveTo(-35, -40);
      ctx.lineTo(35, -40);
      ctx.lineTo(35, 5);
      ctx.quadraticCurveTo(35, 35, 0, 50);
      ctx.quadraticCurveTo(-35, 35, -35, 5);
      ctx.closePath();
      const sg = ctx.createLinearGradient(-35, -40, 35, 50);
      sg.addColorStop(0, lighten(color, 0.2));
      sg.addColorStop(1, darken(color, 0.2));
      ctx.fillStyle = sg;
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.stroke();
      // Sword cross
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -35);
      ctx.lineTo(0, 40);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-22, -8);
      ctx.lineTo(22, -8);
      ctx.stroke();
      break;
    }
    case 'heavens-chosen': {
      // Shield with radiant eye
      const color = '#F59E0B';
      const accent = '#FFF1F2';
      ctx.beginPath();
      ctx.moveTo(-35, -40);
      ctx.lineTo(35, -40);
      ctx.lineTo(35, 5);
      ctx.quadraticCurveTo(35, 35, 0, 50);
      ctx.quadraticCurveTo(-35, 35, -35, 5);
      ctx.closePath();
      const sg = ctx.createLinearGradient(-35, -40, 35, 50);
      sg.addColorStop(0, lighten(color, 0.3));
      sg.addColorStop(1, color);
      ctx.fillStyle = sg;
      ctx.fill();
      ctx.strokeStyle = darken(color, 0.3);
      ctx.lineWidth = 2;
      ctx.stroke();
      // Radiant eye
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.quadraticCurveTo(0, -16, 18, 0);
      ctx.quadraticCurveTo(0, 16, -18, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      // Rays
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 4) * i;
        ctx.beginPath();
        ctx.moveTo(22 * Math.cos(angle), 22 * Math.sin(angle));
        ctx.lineTo(30 * Math.cos(angle), 30 * Math.sin(angle));
        ctx.stroke();
      }
      break;
    }
    case 'necromantic-cabals': {
      // Phylactery with bone frame
      const color = '#D6D3D1';
      const accent = '#2DD4BF';
      // Vessel
      ctx.beginPath();
      ctx.moveTo(-14, -38);
      ctx.lineTo(14, -38);
      ctx.lineTo(22, -25);
      ctx.lineTo(22, 25);
      ctx.lineTo(14, 38);
      ctx.lineTo(-14, 38);
      ctx.lineTo(-22, 25);
      ctx.lineTo(-22, -25);
      ctx.closePath();
      const vg = ctx.createLinearGradient(-22, -38, 22, 38);
      vg.addColorStop(0, lighten(color, 0.15));
      vg.addColorStop(1, darken(color, 0.2));
      ctx.fillStyle = vg;
      ctx.fill();
      ctx.strokeStyle = darken(color, 0.4);
      ctx.lineWidth = 2;
      ctx.stroke();
      // Bone frame accents
      ctx.strokeStyle = darken(color, 0.3);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-20, -18);
      ctx.lineTo(20, -18);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-20, 18);
      ctx.lineTo(20, 18);
      ctx.stroke();
      // Gem
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'lost-spectres': {
      // Phylactery dissolving into fog
      const color = '#9CA3AF';
      const accent = '#4ADE80';
      // Vessel (fading)
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(-14, -38);
      ctx.lineTo(14, -38);
      ctx.lineTo(22, -25);
      ctx.lineTo(22, 25);
      ctx.lineTo(14, 38);
      ctx.lineTo(-14, 38);
      ctx.lineTo(-22, 25);
      ctx.lineTo(-22, -25);
      ctx.closePath();
      const vg = ctx.createLinearGradient(-22, -38, 22, 38);
      vg.addColorStop(0, lighten(color, 0.15));
      vg.addColorStop(1, darken(color, 0.2));
      ctx.fillStyle = vg;
      ctx.fill();
      ctx.strokeStyle = darken(color, 0.4);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;
      // Fog wisps dissolving outward
      ctx.strokeStyle = withAlpha(accent, 0.5);
      ctx.lineWidth = 2;
      for (const [sx, sy, ex, ey] of [
        [22, -10, 40, -18], [22, 10, 42, 15],
        [-22, -5, -38, -12], [-22, 15, -40, 20],
        [14, -38, 20, -50], [-14, -38, -22, -48],
      ]) {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo((sx + ex) / 2 + 5, (sy + ey) / 2, ex, ey);
        ctx.stroke();
      }
      // Gem (dim)
      ctx.fillStyle = withAlpha(accent, 0.6);
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  ctx.restore();
  return canvas;
}

// Helper: draw a mini gear shape
function drawMiniGear(ctx, color, outerR, numTeeth, broken = false) {
  const toothDepth = 10;
  ctx.beginPath();
  for (let i = 0; i < numTeeth; i++) {
    const a1 = (Math.PI * 2 / numTeeth) * i;
    const a2 = a1 + Math.PI / numTeeth * 0.3;
    const a3 = a1 + Math.PI / numTeeth * 0.7;
    const a4 = a1 + Math.PI / numTeeth;

    const depth = broken && (i === 1 || i === 4) ? toothDepth * 0.3 : toothDepth;
    if (i === 0) {
      ctx.moveTo(outerR * Math.cos(a1), outerR * Math.sin(a1));
    }
    ctx.lineTo((outerR + depth) * Math.cos(a2), (outerR + depth) * Math.sin(a2));
    ctx.lineTo((outerR + depth) * Math.cos(a3), (outerR + depth) * Math.sin(a3));
    ctx.lineTo(outerR * Math.cos(a4), outerR * Math.sin(a4));
  }
  ctx.closePath();
  const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, outerR + toothDepth);
  grad.addColorStop(0, lighten(color, 0.25));
  grad.addColorStop(1, darken(color, 0.2));
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = darken(color, 0.4);
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Helper: draw a mini skull
function drawMiniSkull(ctx, skullColor, eyeColor) {
  ctx.fillStyle = darken(skullColor, 0.15);
  ctx.beginPath();
  ctx.arc(0, 0, 28, Math.PI, 0);
  ctx.lineTo(28, 10);
  ctx.lineTo(18, 25);
  ctx.lineTo(8, 22);
  ctx.lineTo(0, 28);
  ctx.lineTo(-8, 22);
  ctx.lineTo(-18, 25);
  ctx.lineTo(-28, 10);
  ctx.closePath();
  ctx.fill();
  // Eyes
  ctx.fillStyle = eyeColor;
  ctx.beginPath();
  ctx.ellipse(-10, 2, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(10, 2, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Horns
  ctx.fillStyle = darken(skullColor, 0.25);
  ctx.beginPath();
  ctx.moveTo(-18, -18);
  ctx.quadraticCurveTo(-30, -35, -28, -48);
  ctx.quadraticCurveTo(-24, -42, -20, -32);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(18, -18);
  ctx.quadraticCurveTo(30, -35, 28, -48);
  ctx.quadraticCurveTo(24, -42, 20, -32);
  ctx.closePath();
  ctx.fill();
}

// ==========================================================================
// 9. Rarity Indicators (5, 32x32)
// ==========================================================================
function drawRarityIndicator(rarity) {
  const size = 32;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;
  const r = 12;

  switch (rarity) {
    case 'common':
      ctx.fillStyle = '#9E9E9E';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = darken('#9E9E9E', 0.3);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;

    case 'uncommon': {
      const g = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, r);
      g.addColorStop(0, '#E8E8E8');
      g.addColorStop(0.5, '#C0C0C0');
      g.addColorStop(1, '#909090');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#707070';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    }
    case 'rare': {
      const g = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, r);
      g.addColorStop(0, '#FFF3B0');
      g.addColorStop(0.5, '#FFD700');
      g.addColorStop(1, '#B8860B');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8B6914';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    }
    case 'epic': {
      const g = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, r);
      g.addColorStop(0, '#CE93D8');
      g.addColorStop(0.5, '#9C27B0');
      g.addColorStop(1, '#6A1B9A');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#4A148C';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    }
    case 'legendary': {
      const g = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
      g.addColorStop(0, '#FFD700');
      g.addColorStop(0.3, '#FF8C00');
      g.addColorStop(0.5, '#FFD700');
      g.addColorStop(0.7, '#FF8C00');
      g.addColorStop(1, '#FFD700');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#B8860B';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Inner bright dot
      ctx.fillStyle = '#FFF8DC';
      ctx.beginPath();
      ctx.arc(cx - 3, cy - 3, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
  return canvas;
}

// ==========================================================================
// 10. UI Navigation Icons (6, 48x48, monochrome off-white)
// ==========================================================================
const UI_COLOR = '#F0EAD6';

function drawUINavIcon(iconName) {
  const size = 48;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.fillStyle = UI_COLOR;
  ctx.strokeStyle = UI_COLOR;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (iconName) {
    case 'home':
      // House silhouette
      ctx.beginPath();
      ctx.moveTo(0, -18);     // roof peak
      ctx.lineTo(18, -4);     // right roof
      ctx.lineTo(18, 16);     // right wall bottom
      ctx.lineTo(-18, 16);    // left wall bottom
      ctx.lineTo(-18, -4);    // left roof
      ctx.closePath();
      ctx.fill();
      // Door
      ctx.fillStyle = darken(UI_COLOR, 0.6);
      ctx.fillRect(-4, 4, 8, 12);
      break;

    case 'collection':
      // Open book
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.quadraticCurveTo(-12, -10, -20, -12);
      ctx.lineTo(-20, 14);
      ctx.quadraticCurveTo(-12, 12, 0, 14);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.quadraticCurveTo(12, -10, 20, -12);
      ctx.lineTo(20, 14);
      ctx.quadraticCurveTo(12, 12, 0, 14);
      ctx.closePath();
      ctx.fill();
      // Spine line
      ctx.strokeStyle = darken(UI_COLOR, 0.3);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(0, 14);
      ctx.stroke();
      break;

    case 'battle':
      // Crossed swords
      ctx.strokeStyle = UI_COLOR;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-16, -16);
      ctx.lineTo(16, 16);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(16, -16);
      ctx.lineTo(-16, 16);
      ctx.stroke();
      // Handles
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-16, 16);
      ctx.lineTo(-18, 20);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(16, 16);
      ctx.lineTo(18, 20);
      ctx.stroke();
      break;

    case 'shop':
      // Coin/pouch
      ctx.beginPath();
      ctx.arc(0, 2, 14, 0, Math.PI * 2);
      ctx.fill();
      // Inner ring
      ctx.strokeStyle = darken(UI_COLOR, 0.3);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 2, 10, 0, Math.PI * 2);
      ctx.stroke();
      // $ symbol
      ctx.fillStyle = darken(UI_COLOR, 0.4);
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 3);
      break;

    case 'deck':
      // Stack of cards
      // Back cards (offset)
      ctx.fillStyle = darken(UI_COLOR, 0.15);
      ctx.beginPath();
      roundedRect(ctx, -10, -16, 18, 26, 2);
      ctx.fill();
      ctx.fillStyle = darken(UI_COLOR, 0.08);
      ctx.beginPath();
      roundedRect(ctx, -8, -14, 18, 26, 2);
      ctx.fill();
      // Front card
      ctx.fillStyle = UI_COLOR;
      ctx.beginPath();
      roundedRect(ctx, -6, -12, 18, 26, 2);
      ctx.fill();
      break;

    case 'profile':
      // Person silhouette
      ctx.beginPath();
      ctx.arc(0, -8, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-14, 18);
      ctx.quadraticCurveTo(-14, 4, 0, 4);
      ctx.quadraticCurveTo(14, 4, 14, 18);
      ctx.closePath();
      ctx.fill();
      break;
  }

  ctx.restore();
  return canvas;
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ==========================================================================
// 11. Card State Indicators (4, 48x48)
// ==========================================================================
function drawCardStateIcon(state) {
  const size = 48;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (state) {
    case 'tapped': {
      // Curved/rotated arrow
      const color = '#AAAAAA';
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 14, -Math.PI * 0.7, Math.PI * 0.7);
      ctx.stroke();
      // Arrow head
      ctx.fillStyle = color;
      const ea = Math.PI * 0.7;
      const ex = 14 * Math.cos(ea);
      const ey = 14 * Math.sin(ea);
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - 6, ey - 4);
      ctx.lineTo(ex - 2, ey + 5);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'buffed': {
      // Upward arrow with glow
      const color = '#FFD700';
      // Glow
      const glow = ctx.createRadialGradient(0, 0, 5, 0, 0, 20);
      glow.addColorStop(0, withAlpha(color, 0.3));
      glow.addColorStop(1, withAlpha(color, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      // Arrow
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(10, -4);
      ctx.lineTo(4, -4);
      ctx.lineTo(4, 16);
      ctx.lineTo(-4, 16);
      ctx.lineTo(-4, -4);
      ctx.lineTo(-10, -4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = darken(color, 0.3);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    }
    case 'damaged': {
      // Crack/fracture line
      const color = '#E63946';
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-4, -20);
      ctx.lineTo(2, -10);
      ctx.lineTo(-5, -2);
      ctx.lineTo(4, 8);
      ctx.lineTo(-2, 18);
      ctx.stroke();
      // Small debris
      ctx.fillStyle = color;
      ctx.fillRect(6, -6, 3, 3);
      ctx.fillRect(-8, 4, 2, 2);
      ctx.fillRect(8, 10, 2, 2);
      break;
    }
    case 'shielded': {
      // Shield outline with pulse
      const color = '#4A90E2';
      // Pulse glow
      const glow = ctx.createRadialGradient(0, 0, 10, 0, 0, 22);
      glow.addColorStop(0, withAlpha(color, 0.2));
      glow.addColorStop(1, withAlpha(color, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      // Shield outline
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-14, -16);
      ctx.lineTo(14, -16);
      ctx.lineTo(14, 2);
      ctx.quadraticCurveTo(14, 14, 0, 20);
      ctx.quadraticCurveTo(-14, 14, -14, 2);
      ctx.closePath();
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
  return canvas;
}

// ==========================================================================
// MAIN — Generate all 75+ icons
// ==========================================================================
async function main() {
  console.log('=== Chaos Creatures Icon Generation v2 ===');
  console.log('Programmatic generation via node-canvas + ImageMagick emboss');
  console.log('$0 cost — no AI generation\n');

  let totalGenerated = 0;
  let totalFailed = 0;
  const results = {};

  // ---- 1. ATK Icons (10) ----
  console.log('--- ATK Icons (10 faction variants, 128x128) ---');
  results.atk = [];
  for (const fk of FACTION_KEYS) {
    const name = `atk-${fk}`;
    try {
      const canvas = drawATKIcon(fk);
      const sz = saveAndInstall(canvas, name, 'StatIcons');
      console.log(`  [OK] ${name} (${(sz / 1024).toFixed(1)}KB)`);
      results.atk.push(name);
      totalGenerated++;
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      totalFailed++;
    }
  }

  // ---- 2. HP Icons (10) ----
  console.log('\n--- HP Icons (10 faction variants, 128x128) ---');
  results.hp = [];
  for (const fk of FACTION_KEYS) {
    const name = `hp-${fk}`;
    try {
      const canvas = drawHPIcon(fk);
      const sz = saveAndInstall(canvas, name, 'StatIcons');
      console.log(`  [OK] ${name} (${(sz / 1024).toFixed(1)}KB)`);
      results.hp.push(name);
      totalGenerated++;
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      totalFailed++;
    }
  }

  // ---- 3. Chaos Mote Orbs (10) ----
  console.log('\n--- Chaos Mote Orbs (10 faction variants, 64x64) ---');
  results.chaosMotes = [];
  for (const fk of FACTION_KEYS) {
    const name = `chaos-mote-${fk}`;
    try {
      const canvas = drawChaosMoteOrb(fk);
      const sz = saveAndInstall(canvas, name, 'StatIcons');
      console.log(`  [OK] ${name} (${(sz / 1024).toFixed(1)}KB)`);
      results.chaosMotes.push(name);
      totalGenerated++;
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      totalFailed++;
    }
  }

  // ---- 4. Instability Indicator (1) ----
  console.log('\n--- Instability Indicator (1 icon, 64x64) ---');
  results.instability = [];
  try {
    const canvas = drawInstabilityIndicator();
    const sz = saveAndInstall(canvas, 'instability-indicator', 'StatIcons');
    console.log(`  [OK] instability-indicator (${(sz / 1024).toFixed(1)}KB)`);
    results.instability.push('instability-indicator');
    totalGenerated++;
  } catch (err) {
    console.error(`  [FAIL] instability-indicator: ${err.message}`);
    totalFailed++;
  }

  // ---- 5. Stat Container Shapes (5) ----
  console.log('\n--- Stat Container Shapes (5, 256x256) ---');
  results.statContainers = [];
  const containerDrawers = [
    ['stat-container-hexagonal', drawStatContainer_Hexagonal],
    ['stat-container-leaf', drawStatContainer_Leaf],
    ['stat-container-jagged-shard', drawStatContainer_JaggedShard],
    ['stat-container-shield', drawStatContainer_Shield],
    ['stat-container-skull', drawStatContainer_Skull],
  ];
  for (const [name, drawFn] of containerDrawers) {
    try {
      const canvas = drawFn();
      const sz = saveAndInstall(canvas, name, 'StatIcons', 'strong');
      console.log(`  [OK] ${name} (${(sz / 1024).toFixed(1)}KB)`);
      results.statContainers.push(name);
      totalGenerated++;
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      totalFailed++;
    }
  }

  // ---- 6. Keyword Icons (20) ----
  console.log('\n--- Keyword Icons (20 icons, 64x64, monochrome bronze) ---');
  results.keywords = [];
  const keywords = [
    'shield', 'lifesteal', 'flying', 'reach', 'deathtouch',
    'taunt', 'piercing', 'haste', 'regenerate', 'poison',
    'stun', 'burn', 'freeze', 'drain', 'buff',
    'debuff', 'summon', 'transform', 'exile', 'sacrifice',
  ];
  for (const kw of keywords) {
    const name = `kw-${kw}`;
    try {
      const canvas = drawKeywordIcon(kw);
      const sz = saveAndInstall(canvas, name, 'KeywordIcons');
      console.log(`  [OK] ${name} (${(sz / 1024).toFixed(1)}KB)`);
      results.keywords.push(name);
      totalGenerated++;
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      totalFailed++;
    }
  }

  // ---- 7. Faction Emblems (5) ----
  console.log('\n--- Faction Emblems (5 primary, 256x256) ---');
  results.factionEmblems = [];
  const emblemDrawers = [
    ['emblem-ironwright', drawFactionEmblem_Ironwright],
    ['emblem-fey', drawFactionEmblem_Fey],
    ['emblem-demonic', drawFactionEmblem_Demonic],
    ['emblem-celestial', drawFactionEmblem_Celestial],
    ['emblem-endless', drawFactionEmblem_Endless],
  ];
  for (const [name, drawFn] of emblemDrawers) {
    try {
      const canvas = drawFn();
      const sz = saveAndInstall(canvas, name, 'FactionEmblems', 'strong');
      console.log(`  [OK] ${name} (${(sz / 1024).toFixed(1)}KB)`);
      results.factionEmblems.push(name);
      totalGenerated++;
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      totalFailed++;
    }
  }

  // ---- 8. Sub-Faction Emblems (10) ----
  console.log('\n--- Sub-Faction Emblems (10, 128x128) ---');
  results.subFactionEmblems = [];
  const subFactions = [
    'foundry-directorate', 'scrap-legions',
    'verdant-throne', 'hollow-court',
    'furnace-lords', 'obsidian-bureaucracy',
    'knights-deliverance', 'heavens-chosen',
    'necromantic-cabals', 'lost-spectres',
  ];
  for (const sf of subFactions) {
    const name = `sub-${sf}`;
    try {
      const canvas = drawSubFactionEmblem(sf);
      const sz = saveAndInstall(canvas, name, 'FactionEmblems');
      console.log(`  [OK] ${name} (${(sz / 1024).toFixed(1)}KB)`);
      results.subFactionEmblems.push(name);
      totalGenerated++;
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      totalFailed++;
    }
  }

  // ---- 9. Rarity Indicators (5) ----
  console.log('\n--- Rarity Indicators (5, 32x32) ---');
  results.rarity = [];
  const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  for (const r of rarities) {
    const name = `rarity-${r}`;
    try {
      const canvas = drawRarityIndicator(r);
      const sz = saveAndInstall(canvas, name, 'StatIcons');
      console.log(`  [OK] ${name} (${(sz / 1024).toFixed(1)}KB)`);
      results.rarity.push(name);
      totalGenerated++;
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      totalFailed++;
    }
  }

  // ---- 10. UI Navigation Icons (6) ----
  console.log('\n--- UI Navigation Icons (6, 48x48) ---');
  results.uiNav = [];
  const uiIcons = ['home', 'collection', 'battle', 'shop', 'deck', 'profile'];
  for (const ui of uiIcons) {
    const name = `ui-${ui}`;
    try {
      const canvas = drawUINavIcon(ui);
      const sz = saveAndInstall(canvas, name, 'FactionIcons');
      console.log(`  [OK] ${name} (${(sz / 1024).toFixed(1)}KB)`);
      results.uiNav.push(name);
      totalGenerated++;
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      totalFailed++;
    }
  }

  // ---- 11. Card State Indicators (4) ----
  console.log('\n--- Card State Indicators (4, 48x48) ---');
  results.cardState = [];
  const states = ['tapped', 'buffed', 'damaged', 'shielded'];
  for (const st of states) {
    const name = `state-${st}`;
    try {
      const canvas = drawCardStateIcon(st);
      const sz = saveAndInstall(canvas, name, 'StatIcons');
      console.log(`  [OK] ${name} (${(sz / 1024).toFixed(1)}KB)`);
      results.cardState.push(name);
      totalGenerated++;
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      totalFailed++;
    }
  }

  // ---- Summary ----
  console.log('\n' + '='.repeat(60));
  console.log('=== GENERATION COMPLETE ===');
  console.log('='.repeat(60));
  console.log(`Total Generated: ${totalGenerated}`);
  console.log(`Total Failed:    ${totalFailed}`);
  console.log(`Cost:            $0.00 (all programmatic)\n`);

  console.log('Installed assets by category:');
  for (const [cat, items] of Object.entries(results)) {
    console.log(`  ${cat} (${items.length}): ${items.join(', ')}`);
  }

  if (totalFailed > 0) {
    console.log(`\nWARNING: ${totalFailed} icon(s) failed. Check errors above.`);
    process.exit(1);
  }

  console.log('\nAll icons generated and installed to Xcode asset catalog.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
