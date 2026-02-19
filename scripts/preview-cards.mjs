#!/usr/bin/env node
// preview-cards.mjs — Local card preview server
// Renders full-art cards with unified text panel in the browser for review.
// Usage: node scripts/preview-cards.mjs
// Opens http://localhost:3333 with all cards from scripts/preview/cards.json

import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, join, extname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const PREVIEW_DIR = join(__dirname, 'preview');
const ASSETS_DIR = join(PROJECT_ROOT, 'ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets');
const CARDS_JSON = join(PREVIEW_DIR, 'cards.json');

const PORT = 3333;

const MIME_TYPES = {
  '.html': 'text/html',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
};

// Serve static files from project root
function serveFile(res, filePath) {
  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = extname(filePath);
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  res.end(readFileSync(filePath));
}

// Map faction enum to display name and CSS class
function getFactionDisplay(faction) {
  if (!faction) return { name: '?', cssClass: 'unknown' };
  const upper = faction.toUpperCase();
  if (upper === 'IRONWRIGHT' || upper === 'IRONWRIGHT_COLLECTIVE') {
    return { name: 'Ironwright', cssClass: 'ironwright' };
  }
  if (upper === 'FEY_COURTS' || upper === 'FEY') {
    return { name: 'Fey Courts', cssClass: 'fey' };
  }
  if (upper === 'DEMONIC' || upper === 'DEMONIC_KINGDOMS') {
    return { name: 'Demonic', cssClass: 'demonic' };
  }
  return { name: faction, cssClass: faction.toLowerCase().replace(/_/g, '-') };
}

// Map rarity to CSS class for glow effect
function getRarityClass(rarity) {
  const r = (rarity || 'common').toLowerCase();
  if (['common', 'uncommon', 'rare', 'epic', 'legendary'].includes(r)) return r;
  return 'common';
}

// Build the HTML page
function buildHTML() {
  // Load card data
  let cards = [];
  if (existsSync(CARDS_JSON)) {
    cards = JSON.parse(readFileSync(CARDS_JSON, 'utf-8'));
  }

  // Build card HTML
  const cardElements = cards.map((card, i) => {
    const artSrc = card.artFile ? `/preview-art/${card.artFile}` : '';
    const faction = getFactionDisplay(card.faction);
    const rarityClass = getRarityClass(card.rarity);

    const keywordBadges = (card.keywords || []).map(kw => {
      return `<span class="keyword-badge">${kw}</span>`;
    }).join('');

    const hasStats = card.attack != null && card.health != null;
    const isSpell = (card.cardType || '').toLowerCase() === 'spell';

    return `
    <div class="card-container">
      <div class="card rarity-glow-${rarityClass}" style="--card-index: ${i}">
        <!-- Full-bleed art layer -->
        ${artSrc ? `<img src="${artSrc}" class="card-art" alt="${card.name || 'Card art'}">` : '<div class="card-art placeholder">No art</div>'}

        <!-- Name bar at top -->
        <div class="name-bar">
          <div class="card-name">${card.name || 'Unnamed'}</div>
          <div class="mana-cost">
            <img src="/preview-icon/chaos-motes" class="mana-icon" alt="Mana">
            <span class="mana-value">${card.manaCost ?? '?'}</span>
          </div>
        </div>

        <!-- Faction badge (bottom-left, over art) -->
        <div class="faction-badge faction-${faction.cssClass}">${faction.name}</div>
        ${card.label ? `<div class="lora-badge">${card.label}</div>` : ''}

        <!-- Unified text panel at bottom -->
        <div class="text-panel">
          <div class="panel-content">
            <!-- Type line -->
            <div class="type-row">
              <span class="card-type">${card.typeLine || card.cardType || 'Creature'}</span>
            </div>

            <!-- Keywords -->
            ${(card.keywords || []).length > 0 ? `
            <div class="card-keywords">
              ${keywordBadges}
            </div>` : ''}

            <!-- Flavor text -->
            ${card.flavorText ? `<div class="card-flavor">"${card.flavorText}"</div>` : ''}

            <!-- Stats row -->
            ${hasStats ? `
            <div class="card-stats">
              <div class="stat stat-attack">
                <img src="/preview-icon/sword-atk" class="stat-icon" alt="ATK">
                <span class="stat-value">${card.attack}</span>
              </div>
              <div class="stat stat-health">
                <img src="/preview-icon/heart-hp" class="stat-icon" alt="HP">
                <span class="stat-value">${card.health}</span>
              </div>
            </div>` : ''}
          </div>
        </div>
      </div>
      <div class="card-meta">
        <span class="meta-name">${card.name || 'Unnamed'}</span>
        <span class="meta-faction faction-meta-${faction.cssClass}">${faction.name}</span>
        <span class="meta-rarity rarity-${rarityClass}">${card.rarity || 'common'}</span>
        ${card.composition ? `<span class="meta-comp">${card.composition}</span>` : ''}
        ${card.lora ? `<span class="meta-lora">${card.lora}</span>` : ''}
        ${card.label ? `<span class="meta-label">${card.label}</span>` : ''}
      </div>
    </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chaos Creatures - Card Preview</title>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Alegreya:ital,wght@0,400;0,500;0,700;1,400;1,500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: #1a1a2e;
      color: #e0e0e0;
      font-family: 'Alegreya', Georgia, serif;
      padding: 40px 20px;
      min-height: 100vh;
    }

    h1 {
      font-family: 'Cinzel', serif;
      font-size: 2em;
      text-align: center;
      margin-bottom: 8px;
      color: #c9a84c;
    }

    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 40px;
      font-size: 0.95em;
    }

    .grid {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 32px;
    }

    .card-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    /* ── Card ── */
    .card {
      position: relative;
      width: 368px;
      height: 512px;
      border-radius: 16px;
      overflow: hidden;
      background: #111;
      border: 2px solid rgba(255,255,255,0.08);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .card:hover {
      transform: translateY(-4px);
    }

    /* ── Rarity Glow Effects ── */
    .rarity-glow-common {
      /* No glow - default subtle border */
      box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    }

    .rarity-glow-uncommon {
      border-color: rgba(192, 192, 210, 0.25);
      box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 12px rgba(192,192,210,0.2), 0 0 24px rgba(192,192,210,0.1);
    }
    .rarity-glow-uncommon:hover {
      box-shadow: 0 12px 40px rgba(0,0,0,0.7), 0 0 18px rgba(192,192,210,0.3), 0 0 36px rgba(192,192,210,0.15);
    }

    .rarity-glow-rare {
      border-color: rgba(70, 130, 230, 0.3);
      box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 14px rgba(70,130,230,0.25), 0 0 28px rgba(70,130,230,0.12);
    }
    .rarity-glow-rare:hover {
      box-shadow: 0 12px 40px rgba(0,0,0,0.7), 0 0 22px rgba(70,130,230,0.4), 0 0 44px rgba(70,130,230,0.2);
    }

    .rarity-glow-epic {
      border-color: rgba(160, 70, 220, 0.3);
      box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 16px rgba(160,70,220,0.3), 0 0 32px rgba(160,70,220,0.15);
    }
    .rarity-glow-epic:hover {
      box-shadow: 0 12px 40px rgba(0,0,0,0.7), 0 0 24px rgba(160,70,220,0.45), 0 0 48px rgba(160,70,220,0.22);
    }

    .rarity-glow-legendary {
      border-color: rgba(255, 180, 40, 0.35);
      box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 18px rgba(255,180,40,0.35), 0 0 36px rgba(255,180,40,0.18);
    }
    .rarity-glow-legendary:hover {
      box-shadow: 0 12px 40px rgba(0,0,0,0.7), 0 0 28px rgba(255,180,40,0.5), 0 0 56px rgba(255,180,40,0.25);
    }

    /* ── Full-Bleed Art ── */
    .card-art {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 1;
    }

    .card-art.placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #444;
      font-size: 1.2em;
      background: #111;
    }

    /* ── Paper Texture Overlay ── */
    .card::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 8;
      pointer-events: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
      mix-blend-mode: overlay;
      opacity: 0.5;
    }

    /* ── Name Bar (top, over art) ── */
    .name-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px 18px 14px;
      background: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0.72) 0%,
        rgba(0, 0, 0, 0.45) 55%,
        rgba(0, 0, 0, 0) 100%
      );
    }

    .name-bar .card-name {
      flex: 1;
      min-width: 0;
    }

    /* ── Mana Cost (inside name bar, right side) ── */
    .mana-cost {
      display: flex;
      align-items: center;
      gap: 2px;
      background: rgba(0, 0, 0, 0.45);
      border-radius: 20px;
      padding: 3px 8px 3px 5px;
      border: 1px solid rgba(255,255,255,0.1);
      flex-shrink: 0;
      margin-left: 8px;
    }

    .mana-icon {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      object-fit: cover;
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.6));
    }

    .mana-value {
      font-family: 'Cinzel', serif;
      font-weight: 700;
      font-size: 1.15em;
      color: #b8d4ff;
      text-shadow: 0 1px 3px rgba(0,0,0,0.8);
    }

    /* ── Unified Text Panel (bottom ~28%) ── */
    .text-panel {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 32%;
      z-index: 5;
      /* Gradient: transparent at top, solid dark at bottom */
      background: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0) 0%,
        rgba(0, 0, 0, 0.55) 15%,
        rgba(0, 0, 0, 0.78) 30%,
        rgba(0, 0, 0, 0.78) 100%
      );
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }

    .panel-content {
      padding: 0 14px 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    /* ── Card Name ── */
    .card-name {
      font-family: 'Cinzel', serif;
      font-weight: 700;
      font-size: 1.1em;
      color: #ffffff;
      text-shadow: 0 1px 4px rgba(0,0,0,0.9);
      line-height: 1.2;
    }

    /* ── Type Row (type line + faction badge) ── */
    .type-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: nowrap;
    }

    .card-type {
      font-family: 'Alegreya', serif;
      font-size: 0.72em;
      color: #aaa;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }

    .faction-badge {
      position: absolute;
      bottom: 10px;
      left: 10px;
      z-index: 10;
      font-family: 'Alegreya', serif;
      font-size: 0.58em;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }

    .lora-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 10;
      font-family: 'Alegreya', serif;
      font-size: 0.52em;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.7);
      color: #e0c080;
      border: 1px solid rgba(200, 160, 80, 0.4);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .faction-ironwright {
      background: rgba(60, 50, 35, 0.7);
      color: #b8a478;
      border: 1px solid rgba(120, 100, 60, 0.35);
    }

    .faction-fey {
      background: rgba(35, 55, 40, 0.7);
      color: #8aab8a;
      border: 1px solid rgba(70, 100, 70, 0.35);
    }

    .faction-demonic {
      background: rgba(55, 30, 30, 0.7);
      color: #b08080;
      border: 1px solid rgba(100, 55, 55, 0.35);
    }

    .faction-unknown {
      background: rgba(50, 50, 50, 0.7);
      color: #888;
      border: 1px solid rgba(80, 80, 80, 0.35);
    }

    /* ── Keywords ── */
    .card-keywords {
      display: flex;
      flex-wrap: nowrap;
      gap: 4px;
      overflow: hidden;
    }

    .keyword-badge {
      font-family: 'Alegreya', serif;
      font-size: 0.6em;
      font-weight: 500;
      color: #d4c090;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(212, 192, 144, 0.25);
      padding: 0px 6px;
      border-radius: 8px;
      letter-spacing: 0.03em;
    }

    /* ── Flavor Text ── */
    .card-flavor {
      font-family: 'Alegreya', serif;
      font-style: italic;
      font-size: 0.65em;
      color: #b0a080;
      line-height: 1.35;
      max-height: 4em;
      overflow: hidden;
    }

    /* ── Stats (ATK / HP) ── */
    .card-stats {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 1px;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 3px;
    }

    .stat-icon {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      object-fit: cover;
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.6));
    }

    .stat-value {
      font-family: 'Cinzel', serif;
      font-weight: 700;
      font-size: 1.05em;
      text-shadow: 0 1px 3px rgba(0,0,0,0.8);
    }

    .stat-attack .stat-value {
      color: #ff8a80;
    }

    .stat-health .stat-value {
      color: #80e880;
    }

    /* ── Card Meta (below card) ── */
    .card-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: center;
      max-width: 368px;
    }

    .card-meta span {
      font-size: 0.75em;
      padding: 2px 8px;
      border-radius: 4px;
      background: rgba(255,255,255,0.04);
      border: 1px solid #333;
    }

    .meta-name { font-family: 'Cinzel', serif; color: #c9a84c; font-weight: 600; }

    .faction-meta-ironwright { color: #d4a45a; border-color: #6b5020; }
    .faction-meta-fey { color: #5ad48a; border-color: #206b3a; }
    .faction-meta-demonic { color: #d45a5a; border-color: #6b2020; }

    .rarity-common { color: #999; }
    .rarity-uncommon { color: #c0c0d2; }
    .rarity-rare { color: #5b9bd5; }
    .rarity-epic { color: #b55ad4; }
    .rarity-legendary { color: #ff9800; text-shadow: 0 0 6px rgba(255,152,0,0.4); }

    .meta-comp { color: #888; font-style: italic; }
    .meta-lora { color: #e0c080; border-color: #5a4a20; }
    .meta-label { color: #80c0e0; border-color: #204a5a; font-family: monospace; }

    .empty-state {
      text-align: center;
      padding: 80px 20px;
      color: #555;
    }

    .empty-state code {
      background: #12121f;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 0.9em;
      color: #c9a84c;
    }

    .controls {
      text-align: center;
      margin-bottom: 24px;
      color: #555;
      font-size: 0.85em;
    }

    .controls kbd {
      background: #222;
      border: 1px solid #444;
      border-radius: 3px;
      padding: 1px 6px;
      font-family: monospace;
      font-size: 0.9em;
    }

    /* ── Condensed View at Small Sizes ── */
    @media (max-width: 900px) {
      .grid {
        gap: 16px;
      }
      .card {
        width: 260px;
        height: 362px;
      }
      .card-meta {
        max-width: 260px;
      }

      /* Hide detail text at small size */
      .card-type,
      .faction-badge,
      .card-keywords,
      .card-flavor {
        display: none;
      }

      /* Smaller panels */
      .name-bar {
        padding: 6px 8px 12px 10px;
      }

      .text-panel {
        height: 18%;
      }

      .card-name {
        font-size: 0.9em;
      }

      .panel-content {
        padding: 0 10px 8px 10px;
      }
    }

    @media (max-width: 600px) {
      body {
        padding: 20px 10px;
      }
      .grid {
        gap: 12px;
      }
      .card {
        width: 170px;
        height: 237px;
      }
      .card-meta {
        max-width: 170px;
        display: none;
      }

      .card-name {
        font-size: 0.75em;
      }

      .name-bar {
        padding: 4px 6px 10px 8px;
      }

      .text-panel {
        height: 16%;
      }

      .mana-cost {
        padding: 2px 6px 2px 4px;
      }

      .mana-icon {
        width: 14px;
        height: 14px;
      }

      .mana-value {
        font-size: 0.85em;
      }

      .stat-icon {
        width: 12px;
        height: 12px;
      }

      .stat-value {
        font-size: 0.8em;
      }

      .card-stats {
        gap: 6px;
      }

      .panel-content {
        padding: 0 6px 6px 6px;
        gap: 2px;
      }
    }
  </style>
</head>
<body>
  <h1>Chaos Creatures Card Preview</h1>
  <p class="subtitle">${cards.length} card${cards.length !== 1 ? 's' : ''} loaded from scripts/preview/cards.json</p>
  <p class="controls">Refresh browser to reload after regeneration | Edit <kbd>scripts/preview/cards.json</kbd> to change card data</p>

  <div class="grid">
    ${cards.length > 0 ? cardElements : `
    <div class="empty-state">
      <p>No cards found.</p>
      <p style="margin-top: 12px">Create <code>scripts/preview/cards.json</code> with card data, or run:</p>
      <p style="margin-top: 8px"><code>node scripts/generate-test-cards.mjs</code></p>
    </div>`}
  </div>
</body>
</html>`;
}

// HTTP server
const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  // Main page
  if (path === '/' || path === '/index.html') {
    const html = buildHTML();
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  // Card art images
  if (path.startsWith('/preview-art/')) {
    const filename = path.replace('/preview-art/', '');
    const filePath = join(PREVIEW_DIR, filename);
    serveFile(res, filePath);
    return;
  }

  // Frame route — kept as no-op (frames removed, full-art design)
  if (path.startsWith('/preview-frame/')) {
    res.writeHead(204);
    res.end();
    return;
  }

  // Stat icons + keyword icons from xcassets
  if (path.startsWith('/preview-icon/')) {
    const iconName = path.replace('/preview-icon/', '');

    // Check StatIcons first (chaos-motes, sword-atk, heart-hp)
    const statIconPath = join(ASSETS_DIR, 'StatIcons', `${iconName}.imageset`, `${iconName}@2x.png`);
    if (existsSync(statIconPath)) {
      serveFile(res, statIconPath);
      return;
    }

    // Fallback to KeywordIcons
    const kwIconPath = join(ASSETS_DIR, 'KeywordIcons', `${iconName}.imageset`, `${iconName}@2x.png`);
    if (existsSync(kwIconPath)) {
      serveFile(res, kwIconPath);
      return;
    }

    // Try without @2x suffix
    const kwAlt = join(ASSETS_DIR, 'KeywordIcons', `${iconName}.imageset`, `${iconName}.png`);
    if (existsSync(kwAlt)) {
      serveFile(res, kwAlt);
      return;
    }

    res.writeHead(404);
    res.end('Icon not found');
    return;
  }

  // Faction emblems
  if (path.startsWith('/preview-emblem/')) {
    const emblemName = path.replace('/preview-emblem/', '');
    const filePath = join(ASSETS_DIR, 'FactionEmblems', `${emblemName}.imageset`, `${emblemName}@2x.png`);
    serveFile(res, filePath);
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Card preview server running at http://localhost:${PORT}`);
  console.log(`Serving cards from: ${CARDS_JSON}`);
  console.log(`Serving stat icons from: ${ASSETS_DIR}/StatIcons/`);
  console.log(`\nPress Ctrl+C to stop.\n`);

  // Auto-open browser
  try {
    execSync(`open http://localhost:${PORT}`);
  } catch {
    // Silently fail if open command doesn't work
  }
});
