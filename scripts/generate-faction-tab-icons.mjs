#!/usr/bin/env node
// generate-faction-tab-icons.mjs
// Handcrafted tab icon refresh for FactionIcons using:
// - node-canvas: vector masters
// - ImageMagick: alpha distress + multi-scale export
// - Puppeteer: QA contact sheet

import { createCanvas } from 'canvas';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { execSync } from 'child_process';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const PREVIEW_DIR = join(PROJECT_ROOT, 'scripts/preview/faction-tab-icons');
const RAW_DIR = join(PREVIEW_DIR, 'raw');
const QA_DIR = join(PREVIEW_DIR, 'qa');
const ASSETS_DIR = join(PROJECT_ROOT, 'ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets');
const FACTION_ICONS_DIR = join(ASSETS_DIR, 'FactionIcons');
const LEATHER_BG = join(ASSETS_DIR, 'UIBackgrounds/bg-dark-leather.imageset/bg-dark-leather.png');

const SIZE_1X = 40;
const SIZE_2X = 80;
const SIZE_3X = 120;
const MASTER_SIZE = SIZE_3X;
const WHITE = '#FFFFFF';

mkdirSync(PREVIEW_DIR, { recursive: true });
mkdirSync(RAW_DIR, { recursive: true });
mkdirSync(QA_DIR, { recursive: true });
mkdirSync(FACTION_ICONS_DIR, { recursive: true });

const factionFolderContents = join(FACTION_ICONS_DIR, 'Contents.json');
if (!existsSync(factionFolderContents)) {
  writeFileSync(
    factionFolderContents,
    JSON.stringify(
      {
        info: { author: 'xcode', version: 1 },
        properties: { 'provides-namespace': true },
      },
      null,
      2
    )
  );
}

function hashString(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function baseCanvas() {
  const canvas = createCanvas(MASTER_SIZE, MASTER_SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, MASTER_SIZE, MASTER_SIZE);
  ctx.translate(MASTER_SIZE / 2, MASTER_SIZE / 2);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  return { canvas, ctx };
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function finishWithImageMagick(rawPath, outputPath, seed) {
  const maskA = join(RAW_DIR, `mask-a-${seed}.png`);
  const maskB = join(RAW_DIR, `mask-b-${seed}.png`);
  const maskM = join(RAW_DIR, `mask-m-${seed}.png`);

  try {
    execSync(
      `magick "${rawPath}" -alpha extract -blur 0x0.55 -seed ${seed} +noise Multiplicative -level 28%,100% "${maskA}"`,
      { stdio: 'pipe' }
    );
    execSync(
      `magick "${rawPath}" -alpha extract -morphology Erode Disk:1 -blur 0x0.30 "${maskB}"`,
      { stdio: 'pipe' }
    );
    execSync(`magick "${maskA}" "${maskB}" -compose multiply -composite "${maskM}"`, { stdio: 'pipe' });
    execSync(
      `magick "${rawPath}" "${maskM}" -alpha off -compose CopyOpacity -composite -define png:color-type=6 "${outputPath}"`,
      { stdio: 'pipe' }
    );
  } catch (err) {
    console.warn(`WARN: ImageMagick finish failed for ${rawPath}: ${err.message}`);
    copyFileSync(rawPath, outputPath);
  } finally {
    for (const p of [maskA, maskB, maskM]) {
      try {
        unlinkSync(p);
      } catch {
        // no-op
      }
    }
  }
}

function installToAssets(name, sourcePath) {
  const imagesetDir = join(FACTION_ICONS_DIR, `${name}.imageset`);
  mkdirSync(imagesetDir, { recursive: true });

  // Remove stale files from older one-file assets.
  for (const existing of readdirSync(imagesetDir)) {
    if (existing.toLowerCase().endsWith('.png')) {
      unlinkSync(join(imagesetDir, existing));
    }
  }

  const files = [
    { scale: '1x', size: SIZE_1X, filename: `${name}.png` },
    { scale: '2x', size: SIZE_2X, filename: `${name}@2x.png` },
    { scale: '3x', size: SIZE_3X, filename: `${name}@3x.png` },
  ];

  for (const entry of files) {
    const out = join(imagesetDir, entry.filename);
    if (entry.size === MASTER_SIZE) {
      copyFileSync(sourcePath, out);
    } else {
      execSync(`magick "${sourcePath}" -filter Lanczos -resize ${entry.size}x${entry.size} "${out}"`, {
        stdio: 'pipe',
      });
    }
  }

  writeFileSync(
    join(imagesetDir, 'Contents.json'),
    JSON.stringify(
      {
        images: files.map(({ scale, filename }) => ({ idiom: 'universal', scale, filename })),
        info: { author: 'xcode', version: 1 },
        properties: { 'template-rendering-intent': 'template' },
      },
      null,
      2
    )
  );
}

function saveAndInstall(name, canvas) {
  const seed = hashString(name);
  const rawPath = join(RAW_DIR, `${name}-raw.png`);
  const polishedPath = join(PREVIEW_DIR, `${name}.png`);

  writeFileSync(rawPath, canvas.toBuffer('image/png'));
  finishWithImageMagick(rawPath, polishedPath, seed);
  installToAssets(name, polishedPath);

  console.log(`✓ ${name}`);
}

function drawBattle() {
  const { canvas, ctx } = baseCanvas();
  ctx.lineWidth = 10;

  const sword = (angle) => {
    ctx.save();
    ctx.rotate(angle);
    roundRectPath(ctx, -4, -42, 8, 52, 4);
    ctx.fill();
    roundRectPath(ctx, -18, 6, 36, 7, 3.5);
    ctx.fill();
    roundRectPath(ctx, -3, 10, 6, 24, 3);
    ctx.fill();
    ctx.restore();
  };

  sword(Math.PI / 4.2);
  sword(-Math.PI / 4.2);
  return canvas;
}

function drawHome() {
  const { canvas, ctx } = baseCanvas();
  // Roof
  ctx.beginPath();
  ctx.moveTo(0, -44);
  ctx.lineTo(44, -8);
  ctx.lineTo(30, -8);
  ctx.lineTo(0, -31);
  ctx.lineTo(-30, -8);
  ctx.lineTo(-44, -8);
  ctx.closePath();
  ctx.fill();

  // Body
  roundRectPath(ctx, -30, -8, 60, 44, 8);
  ctx.fill();

  // Door cutout
  ctx.globalCompositeOperation = 'destination-out';
  roundRectPath(ctx, -8, 8, 16, 28, 4);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  return canvas;
}

function drawCollection() {
  const { canvas, ctx } = baseCanvas();
  // Left page
  ctx.beginPath();
  ctx.moveTo(-4, -32);
  ctx.quadraticCurveTo(-25, -24, -42, -28);
  ctx.lineTo(-42, 27);
  ctx.quadraticCurveTo(-25, 22, -4, 31);
  ctx.closePath();
  ctx.fill();

  // Right page
  ctx.beginPath();
  ctx.moveTo(4, -32);
  ctx.quadraticCurveTo(25, -24, 42, -28);
  ctx.lineTo(42, 27);
  ctx.quadraticCurveTo(25, 22, 4, 31);
  ctx.closePath();
  ctx.fill();

  // Spine crease
  ctx.globalCompositeOperation = 'destination-out';
  roundRectPath(ctx, -2, -34, 4, 68, 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  return canvas;
}

function drawDeck() {
  const { canvas, ctx } = baseCanvas();
  const drawCard = (x, y, w, h) => {
    roundRectPath(ctx, x, y, w, h, 5);
    ctx.fill();
  };

  drawCard(-29, -33, 40, 56);
  drawCard(-23, -27, 40, 56);
  drawCard(-17, -21, 40, 56);

  // Punch detail window in front card
  ctx.globalCompositeOperation = 'destination-out';
  roundRectPath(ctx, -7, -9, 20, 24, 3);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  return canvas;
}

function drawProfile() {
  const { canvas, ctx } = baseCanvas();
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(0, 2, 41, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, -14, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-26, 31);
  ctx.quadraticCurveTo(-24, 6, 0, 6);
  ctx.quadraticCurveTo(24, 6, 26, 31);
  ctx.closePath();
  ctx.fill();
  return canvas;
}

function drawShop() {
  const { canvas, ctx } = baseCanvas();
  ctx.beginPath();
  ctx.arc(0, 4, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(0, 4, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // Spark stamp
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.lineTo(5, -24);
  ctx.lineTo(16, -24);
  ctx.lineTo(7, -16);
  ctx.lineTo(10, -6);
  ctx.lineTo(0, -12);
  ctx.lineTo(-10, -6);
  ctx.lineTo(-7, -16);
  ctx.lineTo(-16, -24);
  ctx.lineTo(-5, -24);
  ctx.closePath();
  ctx.fill();
  return canvas;
}

const ICONS = [
  { name: 'ui-home', draw: drawHome },
  { name: 'ui-collection', draw: drawCollection },
  { name: 'ui-deck', draw: drawDeck },
  { name: 'ui-profile', draw: drawProfile },
  { name: 'ui-shop', draw: drawShop },
  { name: 'ui-battle', draw: drawBattle },
];

async function renderContactSheet(names) {
  const cols = 3;
  const rows = Math.ceil(names.length / cols);
  const cellW = 320;
  const cellH = 220;
  const width = cols * cellW + 80;
  const height = rows * cellH + 140;

  const items = names
    .map((name) => {
      const src = `data:image/png;base64,${readFileSync(join(PREVIEW_DIR, `${name}.png`)).toString('base64')}`;
      return `<div class="cell"><div class="chip"><img src="${src}" alt="${name}"/></div><div class="label">${name}</div></div>`;
    })
    .join('');

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    :root { color-scheme: dark; }
    body {
      margin: 0;
      width: ${width}px;
      height: ${height}px;
      color: #f0ead6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #13100d;
      background-image: url("file://${LEATHER_BG}");
      background-size: cover;
      background-position: center;
    }
    .veil {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 50% 20%, rgba(212,175,55,0.13), rgba(0,0,0,0.60));
    }
    .title {
      position: relative;
      padding: 20px 40px 6px;
      font-size: 42px;
      font-weight: 700;
      color: #d4af37;
      letter-spacing: 0.3px;
    }
    .grid {
      position: relative;
      display: grid;
      grid-template-columns: repeat(${cols}, ${cellW - 24}px);
      gap: 18px;
      padding: 14px 40px 20px;
    }
    .cell {
      border: 1px solid rgba(201,168,76,0.18);
      border-radius: 14px;
      background: linear-gradient(180deg, rgba(34,29,22,0.83), rgba(18,15,11,0.92));
      height: ${cellH - 20}px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .chip {
      width: 104px;
      height: 104px;
      border-radius: 18px;
      display: grid;
      place-items: center;
      background: linear-gradient(180deg, rgba(106,82,24,0.56), rgba(72,54,16,0.58));
      box-shadow: inset 0 1px 0 rgba(255,232,163,0.15), 0 8px 18px rgba(0,0,0,0.35);
      border: 1px solid rgba(221,187,95,0.24);
    }
    .chip img {
      width: 72px;
      height: 72px;
      object-fit: contain;
      filter: drop-shadow(0 1px 0 rgba(0,0,0,0.42));
    }
    .label {
      font-size: 22px;
      color: rgba(236,224,196,0.95);
      letter-spacing: 0.2px;
    }
  </style>
</head>
<body>
  <div class="veil"></div>
  <div class="title">Faction Tab Icon QA</div>
  <div class="grid">${items}</div>
</body>
</html>`;

  const htmlPath = join(QA_DIR, 'contact-sheet.html');
  const pngPath = join(QA_DIR, 'contact-sheet.png');
  writeFileSync(htmlPath, html);

  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: pngPath, fullPage: true });
  } finally {
    await browser.close();
  }

  console.log(`QA sheet: ${pngPath}`);
}

async function main() {
  console.log('Generating polished Faction tab icons...');
  for (const icon of ICONS) {
    saveAndInstall(icon.name, icon.draw());
  }
  await renderContactSheet(ICONS.map((i) => i.name));
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
