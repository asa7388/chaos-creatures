#!/usr/bin/env node
// generate-ui-icons-extras.mjs
// Generate missing generic monochrome UI glyphs as template assets.

import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const PREVIEW_DIR = join(PROJECT_ROOT, 'scripts/preview/ui-icons-extras');
const ASSETS_DIR = join(PROJECT_ROOT, 'ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets');
const UI_ICONS_DIR = join(ASSETS_DIR, 'UIIcons');

mkdirSync(PREVIEW_DIR, { recursive: true });
mkdirSync(UI_ICONS_DIR, { recursive: true });

const uiFolderContents = join(UI_ICONS_DIR, 'Contents.json');
if (!existsSync(uiFolderContents)) {
  writeFileSync(uiFolderContents, JSON.stringify({
    info: { author: 'xcode', version: 1 },
    properties: { 'provides-namespace': true },
  }, null, 2));
}

const SIZE = 128;
const WHITE = '#FFFFFF';

function baseCanvas() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.translate(SIZE / 2, SIZE / 2);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  return { canvas, ctx };
}

function saveIcon(canvas, name) {
  const buffer = canvas.toBuffer('image/png');

  writeFileSync(join(PREVIEW_DIR, `${name}.png`), buffer);

  const imagesetDir = join(UI_ICONS_DIR, `${name}.imageset`);
  mkdirSync(imagesetDir, { recursive: true });
  const filename = `${name}@2x.png`;
  writeFileSync(join(imagesetDir, filename), buffer);
  writeFileSync(join(imagesetDir, 'Contents.json'), JSON.stringify({
    images: [{ idiom: 'universal', scale: '2x', filename }],
    info: { author: 'xcode', version: 1 },
    properties: { 'template-rendering-intent': 'template' },
  }, null, 2));

  console.log(`✓ ${name}`);
}

function drawSettings() {
  const { canvas, ctx } = baseCanvas();
  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;

  // gear teeth
  for (let i = 0; i < 8; i++) {
    ctx.save();
    ctx.rotate((Math.PI * 2 * i) / 8);
    ctx.fillRect(-6, -50, 12, 16);
    ctx.restore();
  }

  // gear body
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

function drawSearch() {
  const { canvas, ctx } = baseCanvas();
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(-8, -8, 26, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(12, 12);
  ctx.lineTo(38, 38);
  ctx.stroke();
  return canvas;
}

function drawClose() {
  const { canvas, ctx } = baseCanvas();
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-30, -30);
  ctx.lineTo(30, 30);
  ctx.moveTo(30, -30);
  ctx.lineTo(-30, 30);
  ctx.stroke();
  return canvas;
}

function drawPlus() {
  const { canvas, ctx } = baseCanvas();
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(-34, 0);
  ctx.lineTo(34, 0);
  ctx.moveTo(0, -34);
  ctx.lineTo(0, 34);
  ctx.stroke();
  return canvas;
}

function drawMinus() {
  const { canvas, ctx } = baseCanvas();
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(-34, 0);
  ctx.lineTo(34, 0);
  ctx.stroke();
  return canvas;
}

function drawCheck() {
  const { canvas, ctx } = baseCanvas();
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 9;

  ctx.beginPath();
  ctx.arc(0, 0, 44, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-24, 2);
  ctx.lineTo(-6, 22);
  ctx.lineTo(24, -16);
  ctx.stroke();

  return canvas;
}

function drawWarning() {
  const { canvas, ctx } = baseCanvas();
  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;

  ctx.beginPath();
  ctx.moveTo(0, -46);
  ctx.lineTo(44, 38);
  ctx.lineTo(-44, 38);
  ctx.closePath();
  ctx.stroke();
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(0, 14);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 28, 4, 0, Math.PI * 2);
  ctx.fill();
  return canvas;
}

function drawRefresh() {
  const { canvas, ctx } = baseCanvas();
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 9;

  ctx.beginPath();
  ctx.arc(0, 0, 34, Math.PI * 0.2, Math.PI * 1.7);
  ctx.stroke();

  ctx.fillStyle = WHITE;
  ctx.beginPath();
  ctx.moveTo(18, -40);
  ctx.lineTo(42, -40);
  ctx.lineTo(31, -18);
  ctx.closePath();
  ctx.fill();

  return canvas;
}

function drawChevronRight() {
  const { canvas, ctx } = baseCanvas();
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-14, -28);
  ctx.lineTo(16, 0);
  ctx.lineTo(-14, 28);
  ctx.stroke();
  return canvas;
}

function drawArrowRight() {
  const { canvas, ctx } = baseCanvas();
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(-34, 0);
  ctx.lineTo(28, 0);
  ctx.moveTo(8, -20);
  ctx.lineTo(28, 0);
  ctx.lineTo(8, 20);
  ctx.stroke();
  return canvas;
}

function drawSort() {
  const { canvas, ctx } = baseCanvas();
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 8;

  // up arrow
  ctx.beginPath();
  ctx.moveTo(-18, 16);
  ctx.lineTo(-18, -22);
  ctx.moveTo(-30, -10);
  ctx.lineTo(-18, -24);
  ctx.lineTo(-6, -10);
  ctx.stroke();

  // down arrow
  ctx.beginPath();
  ctx.moveTo(18, -16);
  ctx.lineTo(18, 22);
  ctx.moveTo(6, 10);
  ctx.lineTo(18, 24);
  ctx.lineTo(30, 10);
  ctx.stroke();

  return canvas;
}

function drawCardsStack() {
  const { canvas, ctx } = baseCanvas();
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 7;

  const r = 8;
  const roundedRect = (x, y, w, h) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  roundedRect(-36, -24, 50, 64);
  ctx.stroke();
  roundedRect(-14, -40, 50, 64);
  ctx.stroke();
  return canvas;
}

function drawArchive() {
  const { canvas, ctx } = baseCanvas();
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 7;

  // box
  ctx.strokeRect(-34, -8, 68, 42);
  // lid
  ctx.strokeRect(-40, -24, 80, 16);
  // slot
  ctx.beginPath();
  ctx.moveTo(-10, 8);
  ctx.lineTo(10, 8);
  ctx.stroke();

  return canvas;
}

function drawFlag() {
  const { canvas, ctx } = baseCanvas();
  ctx.strokeStyle = WHITE;
  ctx.fillStyle = WHITE;
  ctx.lineWidth = 7;

  // pole
  ctx.beginPath();
  ctx.moveTo(-24, -40);
  ctx.lineTo(-24, 40);
  ctx.stroke();

  // flag
  ctx.beginPath();
  ctx.moveTo(-24, -36);
  ctx.quadraticCurveTo(2, -30, 24, -38);
  ctx.lineTo(24, -10);
  ctx.quadraticCurveTo(0, -2, -24, -10);
  ctx.closePath();
  ctx.fill();

  return canvas;
}

const icons = [
  { name: 'ui-settings', fn: drawSettings },
  { name: 'ui-search', fn: drawSearch },
  { name: 'ui-close', fn: drawClose },
  { name: 'ui-plus', fn: drawPlus },
  { name: 'ui-minus', fn: drawMinus },
  { name: 'ui-check', fn: drawCheck },
  { name: 'ui-warning', fn: drawWarning },
  { name: 'ui-refresh', fn: drawRefresh },
  { name: 'ui-chevron-right', fn: drawChevronRight },
  { name: 'ui-arrow-right', fn: drawArrowRight },
  { name: 'ui-sort', fn: drawSort },
  { name: 'ui-cards-stack', fn: drawCardsStack },
  { name: 'ui-archive', fn: drawArchive },
  { name: 'ui-flag', fn: drawFlag },
];

console.log(`Generating ${icons.length} extra UI icons...`);
for (const { name, fn } of icons) {
  saveIcon(fn(), name);
}
console.log(`\nDone. Preview: ${PREVIEW_DIR}`);
