// Chaos Creatures -- Fallback Art System
// Source: docs/design/05-content-pipeline.md Section 4
// Source: .claude/agents/ai-pipeline.md Section 3
//
// When art generation fails twice:
//   1. Select faction-colored silhouette from assets/fallback/ (5 images, one per faction)
//   2. Apply rarity border overlay (Common=gray, Uncommon=green, Rare=blue, Epic=purple, Legendary=gold)
//   3. Store in R2 with _fallback suffix
//   4. Flag card for regeneration in generation_jobs table
//
// This is a minimal SVG-based fallback that creates a faction-colored placeholder.
// No external image processing dependencies required (no sharp needed for fallback).

// =============================================================================
// Faction Colors
// =============================================================================

const FACTION_COLORS: Record<string, { primary: string; secondary: string; name: string }> = {
  IRONWRIGHT: {
    primary: '#6B7B8D', // Industrial steel blue-gray
    secondary: '#E07020', // Reactor warning orange
    name: 'Ironwright Collective',
  },
  FEY_COURTS: {
    primary: '#2D5016', // Deep forest green
    secondary: '#7B68EE', // Violet/Silver
    name: 'Fey Courts',
  },
  DEMONIC_KINGDOMS: {
    primary: '#8B0000', // Dark red
    secondary: '#4A0033', // Deep purple-black
    name: 'Demonic Kingdoms',
  },
  CELESTIAL_CRUSADE: {
    primary: '#DAA520', // Holy gold
    secondary: '#F5F0E1', // Divine ivory
    name: 'Celestial Crusade',
  },
  THE_ENDLESS: {
    primary: '#6B3FA0', // Necrotic purple
    secondary: '#E8DCC8', // Bone white
    name: 'The Endless',
  },
};

// =============================================================================
// Rarity Border Colors
// =============================================================================

const RARITY_COLORS: Record<string, string> = {
  COMMON: '#808080',    // Gray
  UNCOMMON: '#228B22',  // Green
  RARE: '#4169E1',      // Blue
  EPIC: '#9932CC',      // Purple
  LEGENDARY: '#FFD700', // Gold
};

// =============================================================================
// Faction Silhouette SVG Paths (simple iconic shapes)
// =============================================================================

const FACTION_SILHOUETTES: Record<string, string> = {
  // Piston/reactor-core silhouette for Ironwright
  IRONWRIGHT: `
    <rect x="354" y="330" width="60" height="200" rx="4" fill="{secondary}" opacity="0.3"/>
    <rect x="364" y="350" width="40" height="80" rx="2" fill="{secondary}" opacity="0.5"/>
    <circle cx="384" cy="480" r="50" fill="{primary}" opacity="0.4"/>
    <circle cx="384" cy="480" r="30" fill="{secondary}" opacity="0.3"/>
    <rect x="340" y="420" width="88" height="8" fill="{secondary}" opacity="0.6"/>
    <rect x="340" y="440" width="88" height="8" fill="{secondary}" opacity="0.6"/>
    <text x="384" y="620" text-anchor="middle" font-family="serif" font-size="48"
          fill="{secondary}" opacity="0.5">IRONWRIGHT</text>
  `,
  // Tree/vine silhouette for Fey Courts
  FEY_COURTS: `
    <ellipse cx="384" cy="460" rx="80" ry="140" fill="{secondary}" opacity="0.2"/>
    <path d="M384 580 L384 380 M384 450 L340 400 M384 420 L430 370 M384 480 L350 440
             M384 380 L370 350 M384 380 L400 340"
          stroke="{secondary}" stroke-width="8" fill="none" opacity="0.5"/>
    <circle cx="384" cy="350" r="60" fill="{secondary}" opacity="0.15"/>
    <text x="384" y="650" text-anchor="middle" font-family="serif" font-size="48"
          fill="{secondary}" opacity="0.5">FEY COURTS</text>
  `,
  // Horned skull silhouette for Demonic Kingdoms
  DEMONIC_KINGDOMS: `
    <ellipse cx="384" cy="430" rx="90" ry="110" fill="{secondary}" opacity="0.2"/>
    <path d="M330 400 Q330 350 360 340 L340 280 L370 340 Q384 330 398 340 L428 280 L408 340
             Q438 350 438 400 Q438 460 384 480 Q330 460 330 400 Z"
          fill="{secondary}" opacity="0.4"/>
    <circle cx="360" cy="400" r="15" fill="{primary}" opacity="0.6"/>
    <circle cx="408" cy="400" r="15" fill="{primary}" opacity="0.6"/>
    <text x="384" y="600" text-anchor="middle" font-family="serif" font-size="48"
          fill="{secondary}" opacity="0.5">DEMONIC</text>
  `,
  // Radiant star/cross silhouette for Celestial Crusade
  CELESTIAL_CRUSADE: `
    <circle cx="384" cy="430" r="100" fill="{secondary}" opacity="0.15"/>
    <path d="M384 330 L394 410 L474 430 L394 450 L384 530 L374 450 L294 430 L374 410 Z"
          fill="{secondary}" opacity="0.5"/>
    <circle cx="384" cy="430" r="35" fill="{primary}" opacity="0.4"/>
    <text x="384" y="620" text-anchor="middle" font-family="serif" font-size="48"
          fill="{secondary}" opacity="0.5">CELESTIAL CRUSADE</text>
  `,
  // Skull/spectral silhouette for The Endless
  THE_ENDLESS: `
    <ellipse cx="384" cy="420" rx="80" ry="100" fill="{secondary}" opacity="0.2"/>
    <path d="M340 400 Q340 350 384 340 Q428 350 428 400 Q428 460 384 470 Q340 460 340 400 Z"
          fill="{secondary}" opacity="0.35"/>
    <circle cx="362" cy="400" r="12" fill="{primary}" opacity="0.6"/>
    <circle cx="406" cy="400" r="12" fill="{primary}" opacity="0.6"/>
    <path d="M360 440 L370 430 L380 440 L390 430 L400 440" stroke="{primary}" stroke-width="3"
          fill="none" opacity="0.5"/>
    <text x="384" y="600" text-anchor="middle" font-family="serif" font-size="48"
          fill="{secondary}" opacity="0.5">THE ENDLESS</text>
  `,
};

// =============================================================================
// Fallback Art Generator
// =============================================================================

/**
 * Generate a fallback art SVG for a card whose art generation failed.
 * Returns SVG string that can be converted to WebP or used directly.
 *
 * @param factionId - IRONWRIGHT, FEY_COURTS, DEMONIC_KINGDOMS, CELESTIAL_CRUSADE, or THE_ENDLESS
 * @param rarity - COMMON, UNCOMMON, RARE, EPIC, or LEGENDARY
 * @param cardName - Optional card name to display
 * @returns SVG string (768x1024 portrait)
 */
export function generateFallbackSvg(
  factionId: string,
  rarity: string,
  cardName?: string
): string {
  const factionColor = FACTION_COLORS[factionId];
  if (!factionColor) {
    throw new Error(`Unknown faction for fallback: ${factionId}`);
  }

  const rarityColor = RARITY_COLORS[rarity] || RARITY_COLORS.COMMON;
  const borderWidth = rarity === 'LEGENDARY' ? 8 : rarity === 'EPIC' ? 6 : 4;

  let silhouette = FACTION_SILHOUETTES[factionId] || '';
  silhouette = silhouette.replace(/\{primary\}/g, factionColor.primary);
  silhouette = silhouette.replace(/\{secondary\}/g, factionColor.secondary);

  const nameText = cardName
    ? `<text x="384" y="750" text-anchor="middle" font-family="serif" font-size="36"
            fill="white" opacity="0.7">${escapeXml(cardName)}</text>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 768 1024" width="768" height="1024">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${factionColor.primary};stop-opacity:0.8"/>
      <stop offset="100%" style="stop-color:${factionColor.secondary};stop-opacity:0.9"/>
    </linearGradient>
    <linearGradient id="border" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${rarityColor};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${rarityColor};stop-opacity:0.6"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="768" height="1024" fill="url(#bg)"/>

  <!-- Rarity border -->
  <rect x="${borderWidth / 2}" y="${borderWidth / 2}"
        width="${768 - borderWidth}" height="${1024 - borderWidth}"
        fill="none" stroke="url(#border)" stroke-width="${borderWidth}" rx="12"/>

  <!-- Faction silhouette -->
  ${silhouette}

  <!-- Card name -->
  ${nameText}

  <!-- Regeneration notice -->
  <text x="384" y="920" text-anchor="middle" font-family="sans-serif" font-size="24"
        fill="white" opacity="0.4">Art generation pending</text>
  <text x="384" y="960" text-anchor="middle" font-family="sans-serif" font-size="18"
        fill="white" opacity="0.3">${rarity}</text>
</svg>`;
}

/**
 * Convert fallback SVG to a minimal PNG/WebP placeholder buffer.
 * Since we may not have sharp available, this returns the SVG as a UTF-8 buffer
 * that can be stored in R2 as image/svg+xml.
 *
 * If sharp is available, callers should convert this to WebP before upload.
 */
export function getFallbackImageBuffer(
  factionId: string,
  rarity: string,
  cardName?: string
): { buffer: Buffer; contentType: string } {
  const svg = generateFallbackSvg(factionId, rarity, cardName);
  return {
    buffer: Buffer.from(svg, 'utf-8'),
    contentType: 'image/svg+xml',
  };
}

// =============================================================================
// Helpers
// =============================================================================

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
