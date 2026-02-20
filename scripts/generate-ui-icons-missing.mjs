#!/usr/bin/env node
// generate-ui-icons-missing.mjs
// Handcrafted UI icon pass using:
// - node-canvas: vector glyph masters
// - ImageMagick: alpha distress + stamped-edge finish
// - Puppeteer: contact-sheet QA preview on textured backdrop

import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync, existsSync, copyFileSync, unlinkSync, readFileSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import puppeteer from 'puppeteer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const PREVIEW_DIR = join(PROJECT_ROOT, 'scripts/preview/ui-icons-missing');
const RAW_DIR = join(PREVIEW_DIR, 'raw');
const QA_DIR = join(PREVIEW_DIR, 'qa');
const ASSETS_DIR = join(PROJECT_ROOT, 'ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets');
const UI_ICONS_DIR = join(ASSETS_DIR, 'UIIcons');
const LEATHER_BG = join(ASSETS_DIR, 'UIBackgrounds/bg-dark-leather.imageset/bg-dark-leather.png');

mkdirSync(PREVIEW_DIR, { recursive: true });
mkdirSync(RAW_DIR, { recursive: true });
mkdirSync(QA_DIR, { recursive: true });
mkdirSync(UI_ICONS_DIR, { recursive: true });

const uiFolderContents = join(UI_ICONS_DIR, 'Contents.json');
if (!existsSync(uiFolderContents)) {
  writeFileSync(
    uiFolderContents,
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

const SIZE = 256;
const WHITE = '#FFFFFF';

function hashString(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function rand() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function baseCanvas() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.translate(SIZE / 2, SIZE / 2);
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

function drawRivet(ctx, x, y, r = 4) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function distressCanvas(canvas, seed) {
  const ctx = canvas.getContext('2d');
  const rnd = mulberry32(seed);
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';

  // Fine paper-grain bite
  for (let i = 0; i < 450; i++) {
    const x = rnd() * SIZE;
    const y = rnd() * SIZE;
    const r = 0.4 + rnd() * 1.2;
    ctx.globalAlpha = 0.08 + rnd() * 0.14;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Edge chips / print wear
  for (let i = 0; i < 120; i++) {
    const t = rnd();
    let x;
    let y;
    if (t < 0.25) {
      x = rnd() * SIZE;
      y = rnd() * 38;
    } else if (t < 0.5) {
      x = rnd() * SIZE;
      y = SIZE - rnd() * 38;
    } else if (t < 0.75) {
      x = rnd() * 38;
      y = rnd() * SIZE;
    } else {
      x = SIZE - rnd() * 38;
      y = rnd() * SIZE;
    }
    const r = 0.9 + rnd() * 2.4;
    ctx.globalAlpha = 0.18 + rnd() * 0.28;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function finishWithImageMagick(rawPath, outputPath, seed) {
  const maskA = join(RAW_DIR, `mask-a-${seed}.png`);
  const maskB = join(RAW_DIR, `mask-b-${seed}.png`);
  const maskM = join(RAW_DIR, `mask-m-${seed}.png`);

  try {
    execSync(
      `magick "${rawPath}" -alpha extract -blur 0x0.7 -seed ${seed} +noise Multiplicative -level 22%,98% "${maskA}"`,
      { stdio: 'pipe' }
    );
    execSync(
      `magick "${rawPath}" -alpha extract -morphology Erode Disk:1 -blur 0x0.45 "${maskB}"`,
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
  const imagesetDir = join(UI_ICONS_DIR, `${name}.imageset`);
  mkdirSync(imagesetDir, { recursive: true });

  const filename = `${name}@2x.png`;
  const destPath = join(imagesetDir, filename);
  copyFileSync(sourcePath, destPath);

  writeFileSync(
    join(imagesetDir, 'Contents.json'),
    JSON.stringify(
      {
        images: [{ idiom: 'universal', scale: '2x', filename }],
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
  distressCanvas(canvas, seed);

  const rawPath = join(RAW_DIR, `${name}-raw.png`);
  const previewPath = join(PREVIEW_DIR, `${name}.png`);

  writeFileSync(rawPath, canvas.toBuffer('image/png'));
  finishWithImageMagick(rawPath, previewPath, seed);
  installToAssets(name, previewPath);

  console.log(`✓ ${name}`);
}

function drawSettings() {
  const { canvas, ctx } = baseCanvas();
  for (let i = 0; i < 8; i++) {
    ctx.save();
    ctx.rotate((Math.PI * 2 * i) / 8);
    roundRectPath(ctx, -11, -102, 22, 36, 7);
    ctx.fill();
    roundRectPath(ctx, -5, -114, 10, 18, 4);
    ctx.fill();
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0, 0, 68, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(0, 0, 35, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 8; i++) {
    ctx.save();
    ctx.rotate((Math.PI * 2 * i) / 8);
    roundRectPath(ctx, -3, -56, 6, 14, 2.5);
    ctx.fill();
    ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';

  drawRivet(ctx, 0, -50, 4);
  drawRivet(ctx, 43, -22, 3.5);
  drawRivet(ctx, 43, 22, 3.5);
  drawRivet(ctx, 0, 50, 4);
  drawRivet(ctx, -43, 22, 3.5);
  drawRivet(ctx, -43, -22, 3.5);
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  return canvas;
}

function drawSearch() {
  const { canvas, ctx } = baseCanvas();
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.arc(-24, -22, 58, 0, Math.PI * 2);
  ctx.stroke();

  roundRectPath(ctx, 20, 12, 74, 22, 11);
  ctx.save();
  ctx.rotate(Math.PI / 4.7);
  ctx.fill();
  ctx.restore();
  return canvas;
}

function drawClose() {
  const { canvas, ctx } = baseCanvas();
  const blade = (angle) => {
    ctx.save();
    ctx.rotate(angle);
    roundRectPath(ctx, -10, -98, 20, 162, 8);
    ctx.fill();

    ctx.globalCompositeOperation = 'destination-out';
    roundRectPath(ctx, -3, -80, 6, 84, 3);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    roundRectPath(ctx, -24, 52, 48, 20, 8);
    ctx.fill();
    ctx.restore();
  };

  blade(Math.PI / 4);
  blade(-Math.PI / 4);
  return canvas;
}

function drawPlus() {
  const { canvas, ctx } = baseCanvas();
  ctx.beginPath();
  ctx.arc(0, 0, 78, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  roundRectPath(ctx, -16, -56, 32, 112, 10);
  ctx.fill();
  roundRectPath(ctx, -56, -16, 112, 32, 10);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  return canvas;
}

function drawMinus() {
  const { canvas, ctx } = baseCanvas();
  ctx.beginPath();
  ctx.arc(0, 0, 78, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  roundRectPath(ctx, -56, -16, 112, 32, 10);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  return canvas;
}

function drawCheck() {
  const { canvas, ctx } = baseCanvas();
  ctx.beginPath();
  ctx.moveTo(0, -94);
  ctx.lineTo(70, -52);
  ctx.lineTo(56, 50);
  ctx.lineTo(0, 98);
  ctx.lineTo(-56, 50);
  ctx.lineTo(-70, -52);
  ctx.closePath();
  ctx.fill();

  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.moveTo(-46, 2);
  ctx.lineTo(-14, 34);
  ctx.lineTo(46, -30);
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
  return canvas;
}

function drawWarning() {
  const { canvas, ctx } = baseCanvas();
  ctx.beginPath();
  ctx.moveTo(0, -102);
  ctx.lineTo(96, 78);
  ctx.lineTo(-96, 78);
  ctx.closePath();
  ctx.fill();

  ctx.globalCompositeOperation = 'destination-out';
  roundRectPath(ctx, -10, -38, 20, 68, 8);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 56, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  return canvas;
}

function drawRefresh() {
  const { canvas, ctx } = baseCanvas();
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.arc(0, 0, 74, -Math.PI * 0.15, Math.PI * 1.2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(64, -70);
  ctx.lineTo(98, -62);
  ctx.lineTo(76, -34);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-64, 70);
  ctx.lineTo(-98, 62);
  ctx.lineTo(-76, 34);
  ctx.closePath();
  ctx.fill();
  return canvas;
}

function drawChevronRight() {
  const { canvas, ctx } = baseCanvas();
  ctx.beginPath();
  ctx.moveTo(-46, -84);
  ctx.lineTo(48, 0);
  ctx.lineTo(-46, 84);
  ctx.lineTo(-20, 84);
  ctx.lineTo(74, 0);
  ctx.lineTo(-20, -84);
  ctx.closePath();
  ctx.fill();
  return canvas;
}

function drawArrowRight() {
  const { canvas, ctx } = baseCanvas();
  roundRectPath(ctx, -96, -16, 132, 32, 12);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(20, -62);
  ctx.lineTo(102, 0);
  ctx.lineTo(20, 62);
  ctx.closePath();
  ctx.fill();
  return canvas;
}

function drawSort() {
  const { canvas, ctx } = baseCanvas();

  // left/up
  roundRectPath(ctx, -86, 18, 56, 18, 8);
  ctx.fill();
  roundRectPath(ctx, -64, -56, 18, 70, 8);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-55, -92);
  ctx.lineTo(-78, -60);
  ctx.lineTo(-32, -60);
  ctx.closePath();
  ctx.fill();

  // right/down
  roundRectPath(ctx, 30, -36, 56, 18, 8);
  ctx.fill();
  roundRectPath(ctx, 46, -16, 18, 70, 8);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(55, 92);
  ctx.lineTo(32, 60);
  ctx.lineTo(78, 60);
  ctx.closePath();
  ctx.fill();

  return canvas;
}

function drawCardsStack() {
  const { canvas, ctx } = baseCanvas();
  const card = (x, y, w, h, r) => {
    roundRectPath(ctx, x, y, w, h, r);
    ctx.fill();
  };

  card(-84, -58, 126, 156, 16);
  card(-52, -84, 126, 156, 16);
  card(-20, -110, 126, 156, 16);

  ctx.globalCompositeOperation = 'destination-out';
  roundRectPath(ctx, 16, -78, 36, 36, 8);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  return canvas;
}

function drawArchive() {
  const { canvas, ctx } = baseCanvas();
  roundRectPath(ctx, -96, -42, 192, 124, 18);
  ctx.fill();
  roundRectPath(ctx, -74, -86, 148, 44, 14);
  ctx.fill();

  ctx.globalCompositeOperation = 'destination-out';
  roundRectPath(ctx, -44, 2, 88, 22, 9);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  return canvas;
}

function drawFlag() {
  const { canvas, ctx } = baseCanvas();
  roundRectPath(ctx, -92, -106, 18, 212, 9);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-74, -86);
  ctx.bezierCurveTo(-6, -72, 44, -100, 90, -84);
  ctx.lineTo(90, -20);
  ctx.bezierCurveTo(42, -34, -8, -10, -74, -24);
  ctx.closePath();
  ctx.fill();
  return canvas;
}

function drawHandCards() {
  const { canvas, ctx } = baseCanvas();
  const card = (x, y, rot) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    roundRectPath(ctx, -34, -56, 68, 112, 11);
    ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    roundRectPath(ctx, 14, -46, 14, 14, 4);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  };

  card(-42, 14, -0.18);
  card(0, 2, 0);
  card(42, 14, 0.18);

  roundRectPath(ctx, -84, 62, 168, 26, 13);
  ctx.fill();
  return canvas;
}

function drawAccount() {
  const { canvas, ctx } = baseCanvas();
  // Outer medallion + inner coin for a stamped profile glyph.
  ctx.beginPath();
  ctx.arc(0, 0, 94, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(0, 0, 74, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.beginPath();
  ctx.arc(0, 0, 68, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(0, -19, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-44, 52);
  ctx.quadraticCurveTo(-38, 5, 0, 5);
  ctx.quadraticCurveTo(38, 5, 44, 52);
  ctx.closePath();
  ctx.fill();

  ctx.globalCompositeOperation = 'source-over';
  drawRivet(ctx, 0, -58, 4);
  drawRivet(ctx, 58, 0, 4);
  drawRivet(ctx, 0, 58, 4);
  drawRivet(ctx, -58, 0, 4);
  return canvas;
}

function drawSignOut() {
  const { canvas, ctx } = baseCanvas();
  roundRectPath(ctx, -92, -94, 98, 188, 16);
  ctx.fill();

  ctx.globalCompositeOperation = 'destination-out';
  roundRectPath(ctx, -70, -72, 54, 144, 8);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  roundRectPath(ctx, -6, -14, 104, 28, 14);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(58, -48);
  ctx.lineTo(110, 0);
  ctx.lineTo(58, 48);
  ctx.closePath();
  ctx.fill();

  return canvas;
}

function drawTrash() {
  const { canvas, ctx } = baseCanvas();
  roundRectPath(ctx, -70, -32, 140, 132, 18);
  ctx.fill();
  roundRectPath(ctx, -92, -72, 184, 24, 12);
  ctx.fill();
  roundRectPath(ctx, -34, -98, 68, 18, 9);
  ctx.fill();

  ctx.globalCompositeOperation = 'destination-out';
  roundRectPath(ctx, -42, -10, 16, 78, 7);
  ctx.fill();
  roundRectPath(ctx, -8, -10, 16, 78, 7);
  ctx.fill();
  roundRectPath(ctx, 26, -10, 16, 78, 7);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  return canvas;
}

function drawAudio() {
  const { canvas, ctx } = baseCanvas();
  ctx.beginPath();
  ctx.moveTo(-96, -30);
  ctx.lineTo(-60, -30);
  ctx.lineTo(-14, -74);
  ctx.lineTo(-14, 74);
  ctx.lineTo(-60, 30);
  ctx.lineTo(-96, 30);
  ctx.closePath();
  ctx.fill();

  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.arc(24, 0, 40, -Math.PI * 0.34, Math.PI * 0.34);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(22, 0, 66, -Math.PI * 0.34, Math.PI * 0.34);
  ctx.stroke();
  return canvas;
}

function drawVisuals() {
  const { canvas, ctx } = baseCanvas();
  ctx.beginPath();
  ctx.moveTo(-108, 0);
  ctx.quadraticCurveTo(0, -72, 108, 0);
  ctx.quadraticCurveTo(0, 72, -108, 0);
  ctx.closePath();
  ctx.fill();

  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // star sparkle
  roundRectPath(ctx, 62, -88, 8, 34, 4);
  ctx.fill();
  roundRectPath(ctx, 49, -75, 34, 8, 4);
  ctx.fill();

  return canvas;
}

function drawGameplay() {
  const { canvas, ctx } = baseCanvas();
  // shield
  ctx.beginPath();
  ctx.moveTo(12, -90);
  ctx.lineTo(86, -54);
  ctx.lineTo(72, 52);
  ctx.lineTo(12, 96);
  ctx.lineTo(-48, 52);
  ctx.lineTo(-62, -54);
  ctx.closePath();
  ctx.fill();

  // sword overlay
  ctx.save();
  ctx.rotate(-Math.PI / 4.2);
  roundRectPath(ctx, -12, -96, 24, 150, 8);
  ctx.fill();
  roundRectPath(ctx, -34, 46, 68, 20, 8);
  ctx.fill();
  ctx.restore();

  return canvas;
}

function drawNotifications() {
  const { canvas, ctx } = baseCanvas();
  ctx.beginPath();
  ctx.moveTo(-68, 68);
  ctx.lineTo(68, 68);
  ctx.lineTo(54, -30);
  ctx.quadraticCurveTo(54, -88, 0, -96);
  ctx.quadraticCurveTo(-54, -88, -54, -30);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 88, 16, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

function drawPrivacy() {
  const { canvas, ctx } = baseCanvas();
  ctx.beginPath();
  ctx.moveTo(0, -104);
  ctx.lineTo(84, -54);
  ctx.lineTo(70, 36);
  ctx.lineTo(0, 104);
  ctx.lineTo(-70, 36);
  ctx.lineTo(-84, -54);
  ctx.closePath();
  ctx.fill();

  ctx.globalCompositeOperation = 'destination-out';
  roundRectPath(ctx, -28, -6, 56, 52, 10);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -10, 20, Math.PI, 0);
  ctx.strokeStyle = 'rgba(0,0,0,1)';
  ctx.lineWidth = 12;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 16, 7, 0, Math.PI * 2);
  ctx.fill();
  roundRectPath(ctx, -4, 18, 8, 18, 4);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  return canvas;
}

function drawDocument() {
  const { canvas, ctx } = baseCanvas();
  roundRectPath(ctx, -70, -100, 140, 200, 18);
  ctx.fill();

  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.moveTo(24, -100);
  ctx.lineTo(70, -56);
  ctx.lineTo(24, -56);
  ctx.closePath();
  ctx.fill();

  roundRectPath(ctx, -44, -26, 88, 12, 6);
  ctx.fill();
  roundRectPath(ctx, -44, 4, 88, 12, 6);
  ctx.fill();
  roundRectPath(ctx, -44, 34, 64, 12, 6);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  return canvas;
}

function drawExport() {
  const { canvas, ctx } = baseCanvas();
  roundRectPath(ctx, -98, 20, 196, 84, 16);
  ctx.fill();

  roundRectPath(ctx, -14, -92, 28, 96, 10);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -114);
  ctx.lineTo(46, -58);
  ctx.lineTo(20, -58);
  ctx.lineTo(20, -30);
  ctx.lineTo(-20, -30);
  ctx.lineTo(-20, -58);
  ctx.lineTo(-46, -58);
  ctx.closePath();
  ctx.fill();

  return canvas;
}

function drawInfo() {
  const { canvas, ctx } = baseCanvas();
  ctx.beginPath();
  ctx.arc(0, 0, 90, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(0, -46, 10, 0, Math.PI * 2);
  ctx.fill();
  roundRectPath(ctx, -8, -20, 16, 82, 8);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  return canvas;
}

function drawTray() {
  const { canvas, ctx } = baseCanvas();
  roundRectPath(ctx, -104, 10, 208, 86, 18);
  ctx.fill();

  roundRectPath(ctx, -16, -92, 32, 90, 10);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 22);
  ctx.lineTo(42, -22);
  ctx.lineTo(18, -22);
  ctx.lineTo(18, -46);
  ctx.lineTo(-18, -46);
  ctx.lineTo(-18, -22);
  ctx.lineTo(-42, -22);
  ctx.closePath();
  ctx.fill();

  return canvas;
}

const ICONS = [
  { name: 'ui-settings', draw: drawSettings },
  { name: 'ui-search', draw: drawSearch },
  { name: 'ui-close', draw: drawClose },
  { name: 'ui-plus', draw: drawPlus },
  { name: 'ui-minus', draw: drawMinus },
  { name: 'ui-check', draw: drawCheck },
  { name: 'ui-warning', draw: drawWarning },
  { name: 'ui-refresh', draw: drawRefresh },
  { name: 'ui-chevron-right', draw: drawChevronRight },
  { name: 'ui-arrow-right', draw: drawArrowRight },
  { name: 'ui-sort', draw: drawSort },
  { name: 'ui-cards-stack', draw: drawCardsStack },
  { name: 'ui-archive', draw: drawArchive },
  { name: 'ui-flag', draw: drawFlag },
  { name: 'ui-hand-cards', draw: drawHandCards },
  { name: 'ui-account', draw: drawAccount },
  { name: 'ui-sign-out', draw: drawSignOut },
  { name: 'ui-trash', draw: drawTrash },
  { name: 'ui-audio', draw: drawAudio },
  { name: 'ui-visuals', draw: drawVisuals },
  { name: 'ui-gameplay', draw: drawGameplay },
  { name: 'ui-notifications', draw: drawNotifications },
  { name: 'ui-privacy', draw: drawPrivacy },
  { name: 'ui-document', draw: drawDocument },
  { name: 'ui-export', draw: drawExport },
  { name: 'ui-info', draw: drawInfo },
  { name: 'ui-tray', draw: drawTray },
];

async function renderContactSheet(names) {
  const cols = 6;
  const rows = Math.ceil(names.length / cols);
  const cellW = 260;
  const cellH = 190;
  const width = cols * cellW + 80;
  const height = rows * cellH + 120;

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
      background: radial-gradient(circle at 50% 22%, rgba(212,175,55,0.12), rgba(0,0,0,0.55));
    }
    .title {
      position: relative;
      padding: 22px 40px 8px;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #d4af37;
      text-shadow: 0 1px 0 rgba(0,0,0,0.8);
    }
    .grid {
      position: relative;
      display: grid;
      grid-template-columns: repeat(${cols}, ${cellW - 20}px);
      gap: 18px;
      padding: 18px 40px 32px;
    }
    .cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      border: 1px solid rgba(201,168,76,0.18);
      border-radius: 14px;
      background: linear-gradient(180deg, rgba(34,29,22,0.82), rgba(18,15,11,0.9));
      box-shadow: 0 2px 12px rgba(0,0,0,0.45);
      height: ${cellH - 20}px;
    }
    .chip {
      width: 90px;
      height: 90px;
      border-radius: 18px;
      background: linear-gradient(180deg, rgba(212,175,55,0.2), rgba(94,70,22,0.2));
      border: 1px solid rgba(212,175,55,0.22);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    img {
      width: 70px;
      height: 70px;
      object-fit: contain;
      image-rendering: auto;
      filter: drop-shadow(0 1px 0 rgba(0,0,0,0.45));
    }
    .label {
      font-size: 13px;
      line-height: 1.2;
      color: #d6d0c1;
      text-align: center;
      max-width: 92%;
      word-break: break-word;
    }
  </style>
</head>
<body>
  <div class="veil"></div>
  <div class="title">UI Icon QA — Handcrafted Stamp Pass</div>
  <div class="grid">${items}</div>
</body>
</html>`;

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: join(QA_DIR, 'contact-sheet.png') });
  await browser.close();
}

async function main() {
  const requested = process.argv.slice(2);
  const selectedIcons =
    requested.length > 0
      ? ICONS.filter((icon) => requested.includes(icon.name))
      : ICONS;

  if (requested.length > 0 && selectedIcons.length === 0) {
    console.error('No matching icon names provided.');
    process.exit(1);
  }

  console.log(`Generating ${selectedIcons.length} handcrafted UI icons...`);
  for (const icon of selectedIcons) {
    const canvas = icon.draw();
    saveAndInstall(icon.name, canvas);
  }

  await renderContactSheet(selectedIcons.map((i) => i.name));

  console.log(`\nDone.`);
  console.log(`Preview icons: ${PREVIEW_DIR}`);
  console.log(`QA sheet: ${join(QA_DIR, 'contact-sheet.png')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
