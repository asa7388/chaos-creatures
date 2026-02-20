#!/usr/bin/env node
// install-regen-textures.mjs — Install all passing regen textures to Xcode Assets.xcassets
// Copies final PNGs from regen/ to main preview dir, then installs to Xcode asset catalog

import { readFileSync, mkdirSync, writeFileSync, existsSync, copyFileSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const PREVIEW_DIR = join(PROJECT_ROOT, 'scripts/preview/visual-textures');
const REGEN_DIR = join(PREVIEW_DIR, 'regen');
const ASSETS_DIR = join(PROJECT_ROOT, 'ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets');

// All 13 textures that passed visual inspection, with their source iteration
const PASSING_TEXTURES = [
  // From iteration 1 (pass on first try)
  { name: 'tp-fey-verdant', xcodeFolder: 'TextPanels', source: 'iter1' },
  { name: 'metal-iron', xcodeFolder: 'CardTextures', source: 'iter1' },
  { name: 'border-ironwright', xcodeFolder: 'CardTextures', source: 'iter1' },
  { name: 'border-celestial-knights', xcodeFolder: 'CardTextures', source: 'iter1' },
  { name: 'border-fey-verdant', xcodeFolder: 'CardTextures', source: 'iter1' },
  { name: 'bg-dark-parchment', xcodeFolder: 'UIBackgrounds', source: 'iter1' },

  // From iteration 2
  { name: 'border-endless-spectres', xcodeFolder: 'CardTextures', source: 'iter2' },
  { name: 'tp-endless-spectres', xcodeFolder: 'TextPanels', source: 'iter2' },
  { name: 'fx-spectral-fog', xcodeFolder: 'CardTextures', source: 'iter2' },
  { name: 'metal-obsidian', xcodeFolder: 'CardTextures', source: 'iter2' },
  { name: 'ui-button-cardstock-pressed', xcodeFolder: 'UIComponents', source: 'iter2' },
  { name: 'tex-cardstock-grain', xcodeFolder: 'CardTextures', source: 'iter2' },

  // From iteration 3
  { name: 'border-endless-cabals', xcodeFolder: 'CardTextures', source: 'iter3' },
];

function installToXcode(imageName, sourceBuffer, targetSubfolder) {
  const groupDir = join(ASSETS_DIR, targetSubfolder);
  mkdirSync(groupDir, { recursive: true });

  const groupContents = join(groupDir, 'Contents.json');
  if (!existsSync(groupContents)) {
    writeFileSync(groupContents, JSON.stringify({
      info: { author: 'xcode', version: 1 }
    }, null, 2));
  }

  const imagesetDir = join(groupDir, `${imageName}.imageset`);
  mkdirSync(imagesetDir, { recursive: true });

  const destFilename = `${imageName}.png`;
  writeFileSync(join(imagesetDir, destFilename), sourceBuffer);

  writeFileSync(join(imagesetDir, 'Contents.json'), JSON.stringify({
    images: [
      { filename: destFilename, idiom: 'universal', scale: '1x' },
      { idiom: 'universal', scale: '2x' },
      { idiom: 'universal', scale: '3x' },
    ],
    info: { author: 'xcode', version: 1 },
  }, null, 2));
}

function main() {
  console.log('====================================================================');
  console.log('  Installing 13 Regen Textures to Xcode Assets');
  console.log('====================================================================\n');

  let installed = 0;
  let failed = 0;

  for (const tex of PASSING_TEXTURES) {
    // The final file is always at regen/<name>-final.png
    const finalPath = join(REGEN_DIR, `${tex.name}-final.png`);

    if (!existsSync(finalPath)) {
      console.log(`  MISSING: ${tex.name}-final.png (source: ${tex.source})`);
      failed++;
      continue;
    }

    const buf = readFileSync(finalPath);

    // 1. Copy to main preview dir (overwrite original)
    const mainPreviewPath = join(PREVIEW_DIR, `${tex.name}.png`);
    writeFileSync(mainPreviewPath, buf);

    // 2. Install to Xcode asset catalog
    installToXcode(tex.name, buf, tex.xcodeFolder);

    console.log(`  OK: ${tex.name} -> ${tex.xcodeFolder}/ (${(buf.length / 1024).toFixed(0)}KB, ${tex.source})`);
    installed++;
  }

  console.log('\n====================================================================');
  console.log(`  Installed: ${installed} / ${PASSING_TEXTURES.length}`);
  if (failed > 0) console.log(`  Failed:    ${failed}`);
  console.log(`  Assets dir: ${ASSETS_DIR}`);
  console.log('====================================================================');
}

main();
