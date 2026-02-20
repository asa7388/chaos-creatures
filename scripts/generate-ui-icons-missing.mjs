#!/usr/bin/env node
// generate-ui-icons-missing.mjs
// Generates missing custom template UI glyphs used by ThemedGlyph mappings.

import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const PREVIEW_DIR = join(PROJECT_ROOT, 'scripts/preview/ui-icons-missing');
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

function roundRectPath(ctx, x, y, w, h, r) {
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

function drawHandCards() {
  const { canvas, ctx } = baseCanvas();
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 7;

  roundRectPath(ctx, -30, -24, 52, 72, 8);
  ctx.stroke();

  roundRectPath(ctx, -10, -42, 48, 68, 8);
  ctx.stroke();

  return canvas;
}

function drawAccount() {
  const { canvas, ctx } = baseCanvas();
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 7;

  ctx.beginPath();
  ctx.arc(0, -18, 18, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 24, 28, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();

  return canvas;
}

function drawSignOut() {
  const { canvas, ctx } = baseCanvas();
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 7;

  roundRectPath(ctx, -42, -34, 38, 68, 8);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-2, 0);
  ctx.lineTo(34, 0);
  ctx.moveTo(16, -16);
  ctx.lineTo(34, 0);
  ctx.lineTo(16, 16);
  ctx.stroke();

  return canvas;
}

function drawTrash() {
  const { canvas, ctx } = baseCanvas();
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 7;

  roundRectPath(ctx, -24, -20, 48, 56, 7);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-30, -28);
  ctx.lineTo(30, -28);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-10, -40);
  ctx.lineTo(10, -40);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-10, -8);
  ctx.lineTo(-10, 24);
  ctx.moveTo(0, -8);
  ctx.lineTo(0, 24);
  ctx.moveTo(10, -8);
  ctx.lineTo(10, 24);
  ctx.stroke();

  return canvas;
}

function drawAudio() {
  const { canvas, ctx } = baseCanvas();
  ctx.fillStyle = WHITE;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 7;

  ctx.beginPath();
  ctx.moveTo(-34, -14);
  ctx.lineTo(-18, -14);
  ctx.lineTo(0, -30);
  ctx.lineTo(0, 30);
  ctx.lineTo(-18, 14);
  ctx.lineTo(-34, 14);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(8, 0, 18, -Math.PI * 0.35, Math.PI * 0.35);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(8, 0, 30, -Math.PI * 0.35, Math.PI * 0.35);
  ctx.stroke();

  return canvas;
}

function drawVisuals() {
  const { canvas, ctx } = baseCanvas();
  ctx.strokeStyle = WHITE;
  ctx.fillStyle = WHITE;
  ctx.lineWidth = 7;

  ctx.beginPath();
  ctx.moveTo(-44, 0);
  ctx.quadraticCurveTo(0, -30, 44, 0);
  ctx.quadraticCurveTo(0, 30, -44, 0);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

function drawGameplay() {
  const { canvas, ctx } = baseCanvas();
  ctx.strokeStyle = WHITE;
  ctx.fillStyle = WHITE;
  ctx.lineWidth = 7;

  roundRectPath(ctx, -42, -18, 84, 44, 22);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-24, 2);
  ctx.lineTo(-8, 2);
  ctx.moveTo(-16, -6);
  ctx.lineTo(-16, 10);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(20, -4, 4, 0, Math.PI * 2);
  ctx.arc(30, 6, 4, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

function drawNotifications() {
  const { canvas, ctx } = baseCanvas();
  ctx.strokeStyle = WHITE;
  ctx.fillStyle = WHITE;
  ctx.lineWidth = 7;

  ctx.beginPath();
  ctx.moveTo(-26, 20);
  ctx.lineTo(26, 20);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-24, 16);
  ctx.quadraticCurveTo(-24, -24, 0, -30);
  ctx.quadraticCurveTo(24, -24, 24, 16);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 26, 5, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

function drawPrivacy() {
  const { canvas, ctx } = baseCanvas();
  ctx.strokeStyle = WHITE;
  ctx.fillStyle = WHITE;
  ctx.lineWidth = 7;

  ctx.beginPath();
  ctx.moveTo(0, -46);
  ctx.lineTo(34, -28);
  ctx.lineTo(28, 10);
  ctx.lineTo(0, 44);
  ctx.lineTo(-28, 10);
  ctx.lineTo(-34, -28);
  ctx.closePath();
  ctx.stroke();

  roundRectPath(ctx, -14, -2, 28, 26, 4);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, -4, 9, Math.PI, 0);
  ctx.stroke();

  return canvas;
}

function drawDocument() {
  const { canvas, ctx } = baseCanvas();
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 7;

  roundRectPath(ctx, -28, -42, 56, 84, 8);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(10, -42);
  ctx.lineTo(28, -24);
  ctx.stroke();

  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-16, -10);
  ctx.lineTo(16, -10);
  ctx.moveTo(-16, 4);
  ctx.lineTo(16, 4);
  ctx.moveTo(-16, 18);
  ctx.lineTo(10, 18);
  ctx.stroke();

  return canvas;
}

function drawExport() {
  const { canvas, ctx } = baseCanvas();
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 7;

  roundRectPath(ctx, -36, 8, 72, 34, 7);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.lineTo(0, 12);
  ctx.moveTo(-14, -20);
  ctx.lineTo(0, -34);
  ctx.lineTo(14, -20);
  ctx.stroke();

  return canvas;
}

function drawInfo() {
  const { canvas, ctx } = baseCanvas();
  ctx.strokeStyle = WHITE;
  ctx.fillStyle = WHITE;
  ctx.lineWidth = 7;

  ctx.beginPath();
  ctx.arc(0, 0, 42, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, -18, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.lineTo(0, 24);
  ctx.stroke();

  return canvas;
}

function drawTray() {
  const { canvas, ctx } = baseCanvas();
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 7;

  roundRectPath(ctx, -40, 4, 80, 34, 8);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.lineTo(0, -2);
  ctx.moveTo(-12, -14);
  ctx.lineTo(0, -2);
  ctx.lineTo(12, -14);
  ctx.stroke();

  return canvas;
}

const icons = [
  { name: 'ui-hand-cards', fn: drawHandCards },
  { name: 'ui-account', fn: drawAccount },
  { name: 'ui-sign-out', fn: drawSignOut },
  { name: 'ui-trash', fn: drawTrash },
  { name: 'ui-audio', fn: drawAudio },
  { name: 'ui-visuals', fn: drawVisuals },
  { name: 'ui-gameplay', fn: drawGameplay },
  { name: 'ui-notifications', fn: drawNotifications },
  { name: 'ui-privacy', fn: drawPrivacy },
  { name: 'ui-document', fn: drawDocument },
  { name: 'ui-export', fn: drawExport },
  { name: 'ui-info', fn: drawInfo },
  { name: 'ui-tray', fn: drawTray },
];

console.log(`Generating ${icons.length} missing UI icons...`);
for (const { name, fn } of icons) {
  saveIcon(fn(), name);
}
console.log(`\nDone. Preview: ${PREVIEW_DIR}`);
