#!/usr/bin/env node
// generate-visual-textures.mjs — Generate ALL visual textures for the card/UI polish pipeline
// Generates ~38 textures via fal.ai FLUX Dev, post-processes with sharp, installs to Xcode Assets.xcassets
// Budget: ~$8 hard cap (~$0.04 per generation)
// Usage: node scripts/generate-visual-textures.mjs [--install] [--only <category>]

import { readFileSync, mkdirSync, writeFileSync, existsSync, copyFileSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

// ── Load environment ────────────────────────────────────────────────
const envPath = resolve(__dirname, '../packages/game-server/.env');
const envText = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envText.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
}
const FAL_KEY = env.FAL_KEY;
if (!FAL_KEY) { console.error('Missing FAL_KEY in packages/game-server/.env'); process.exit(1); }

// ── Paths ───────────────────────────────────────────────────────────
const PREVIEW_DIR = join(PROJECT_ROOT, 'scripts/preview/visual-textures');
const ASSETS_DIR = join(PROJECT_ROOT, 'ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets');
mkdirSync(PREVIEW_DIR, { recursive: true });

// ── Budget tracking ─────────────────────────────────────────────────
const COST_PER_GEN = 0.04; // FLUX Dev ~$0.04 per image
const BUDGET_LIMIT = 10.0;
let totalCost = 0;
let totalGenerated = 0;
let totalSkipped = 0;
let failures = [];

// ── Standard negative prompt (from design guide 17.1/17.2) ──────────
const STD_NEGATIVE = 'text, watermark, objects, items on surface, hands, tools, strong directional light, vignette, border, frame, uneven lighting, color cast, gradient';
const FULL_NEGATIVE = 'text, letters, words, watermark, signature, logo, UI elements, flat vector, clipart, cartoon, 3D render, glossy, plastic, smooth digital, gradient, lens flare, bokeh, photograph, photorealistic';

// ── Texture Definitions ─────────────────────────────────────────────

const TEXTURES = [
  // ═══ A. Screen Backgrounds (6 textures, 1024x1024, tileable) ═══
  {
    name: 'bg-dark-leather',
    category: 'backgrounds',
    width: 1024, height: 1024,
    xcodeFolder: 'UIBackgrounds',
    prompt: `Dark brown full-grain leather surface, seamless tileable texture, top-down flat view, even studio lighting, visible natural pore texture, subtle grain variation, rich deep brown, matte finish, aged but maintained, bookbinding leather quality, high detail macro photography style, neutral color palette, 1:1 aspect ratio`,
    negative: `stitching, seams, edges, buttons, hardware, scratches, cracks, peeling, glossy, patent leather, ${STD_NEGATIVE}`,
  },
  {
    name: 'bg-aged-wood',
    category: 'backgrounds',
    width: 1024, height: 1024,
    xcodeFolder: 'UIBackgrounds',
    prompt: `Dark finished hardwood grain table surface, seamless tileable texture, top-down flat view, even studio lighting, no perspective distortion, rich deep walnut brown, visible fine wood grain, polished dark stain finish, premium furniture quality, high detail macro photography style, neutral warm color palette, 1:1 aspect ratio`,
    negative: `knots, nails, screws, scratches, water damage, paint, ${STD_NEGATIVE}`,
  },
  {
    name: 'bg-dark-parchment',
    category: 'backgrounds',
    width: 1024, height: 1024,
    xcodeFolder: 'UIBackgrounds',
    prompt: `Aged vellum parchment paper surface, seamless tileable texture, top-down flat view, even studio lighting, warm cream color with faint foxing age spots, slight color variation, handmade paper quality, soft vellum-like surface, very subtle fiber texture, high detail macro photography style, 1:1 aspect ratio`,
    negative: `text, writing, printed, calligraphy, torn edges, holes, dark stains, heavy damage, burned, ${STD_NEGATIVE}`,
  },
  {
    name: 'bg-polished-stone',
    category: 'backgrounds',
    width: 1024, height: 1024,
    xcodeFolder: 'UIBackgrounds',
    prompt: `Dark obsidian slate polished stone surface, seamless tileable texture, top-down flat view, even studio lighting, deep charcoal black with subtle gray veining, polished smooth surface, natural stone grain, matte dark finish, premium stone countertop quality, high detail macro photography style, 1:1 aspect ratio`,
    negative: `cracks, chips, rough texture, crystals, sparkle, ${STD_NEGATIVE}`,
  },
  {
    name: 'bg-play-mat-felt',
    category: 'backgrounds',
    width: 1024, height: 1024,
    xcodeFolder: 'UIBackgrounds',
    prompt: `Dark woven nylon felt game mat surface, seamless tileable texture, top-down flat view, even studio lighting, dark navy-black with very subtle cosmic nebula pattern woven into fabric, textile weave texture visible, nylon or felt material, faint abstract swirling pattern suggesting deep space, muted purple and dark teal undertones, high detail macro photography style, 1:1 aspect ratio`,
    negative: `cards, miniatures, dice, hands, bright colors, stars, planets, literal space scene, glossy, plastic, ${STD_NEGATIVE}`,
  },
  {
    name: 'bg-metallic-foil',
    category: 'backgrounds',
    width: 1024, height: 1024,
    xcodeFolder: 'UIBackgrounds',
    prompt: `Reflective metallic foil wrapper surface, seamless tileable texture, top-down flat view, even studio lighting, silver metallic sheen, crinkled foil packaging material, holographic rainbow subtle sheen, studio lighting showing metallic reflections, packaging material close-up, shiny but tactile, high detail macro photography style, 1:1 aspect ratio`,
    negative: `text, branding, logo, product, contents, open package, torn, flat, matte, ${STD_NEGATIVE}`,
  },

  // ═══ B. Faction Border Textures (9 textures, 512x512, tileable) ═══
  {
    name: 'border-ironwright',
    category: 'borders',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    prompt: `Brushed stainless steel metal surface, seamless tileable texture, top-down flat view, even studio lighting, fine linear brush marks, cool gray industrial metal, subtle directional grain, matte industrial finish, high detail macro photography style, neutral color palette, 1:1 aspect ratio`,
    negative: `rust, corrosion, scratches, dents, reflections, mirror finish, polished, fingerprints, ${STD_NEGATIVE}`,
  },
  {
    name: 'border-fey-verdant',
    category: 'borders',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    prompt: `Living wood grain surface with tiny green moss veins threading through, seamless tileable texture, top-down flat view, even studio lighting, deep warm brown wood with emerald green moss growing in grain lines, organic natural surface, bioluminescent golden-green hints, high detail macro photography style, 1:1 aspect ratio`,
    negative: `bark, leaves, branches, whole tree, forest scene, ${STD_NEGATIVE}`,
  },
  {
    name: 'border-fey-hollow',
    category: 'borders',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    prompt: `Bone-white birch bark surface, frosted, with hairline cracks, seamless tileable texture, top-down flat view, even studio lighting, pale white with very subtle ice blue tint, smooth cold surface, delicate natural crack patterns, winter frost quality, high detail macro photography style, 1:1 aspect ratio`,
    negative: `tree trunk, round shape, peeling bark, dirt, ${STD_NEGATIVE}`,
  },
  {
    name: 'border-demonic-furnace',
    category: 'borders',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    prompt: `Black obsidian volcanic glass surface with thin glowing orange-red veins in cracks, seamless tileable texture, top-down flat view, dark glossy black stone, natural fracture patterns with molten light visible through thin crack lines, volcanic rock texture, high detail macro photography style, 1:1 aspect ratio`,
    negative: `lava flow, large cracks, bright fire, flames, smoke, too much orange, uniform pattern, ${STD_NEGATIVE}`,
  },
  {
    name: 'border-demonic-bureaucracy',
    category: 'borders',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    prompt: `Polished smooth obsidian surface, seamless tileable texture, top-down flat view, even studio lighting, reflective cold black stone, perfectly smooth volcanic glass, very subtle gray depth variations, no cracks, clinical and cold, high detail macro photography style, 1:1 aspect ratio`,
    negative: `cracks, veins, rough, matte, chips, ${STD_NEGATIVE}`,
  },
  {
    name: 'border-celestial-knights',
    category: 'borders',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    prompt: `Polished gold and ivory surface, hammered gold plate, seamless tileable texture, top-down flat view, even studio lighting, warm golden metal with subtle hammer texture marks, rich divine gold color, premium metallic surface quality, cathedral-inspired material, high detail macro photography style, 1:1 aspect ratio`,
    negative: `jewelry, coins, objects, bright yellow, cheap gold, ${STD_NEGATIVE}`,
  },
  {
    name: 'border-celestial-chosen',
    category: 'borders',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    prompt: `Burning gold surface radiating soft warm light, seamless tileable texture, top-down flat view, even studio lighting, brilliant gold metal emitting subtle divine glow, slightly blurred luminous edges, radiant cream-gold color, ethereal metallic quality, high detail macro photography style, 1:1 aspect ratio`,
    negative: `fire, flames, sun, too bright, white out, ${STD_NEGATIVE}`,
  },
  {
    name: 'border-endless-cabals',
    category: 'borders',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    prompt: `Aged bone ossuary surface, seamless tileable texture, top-down flat view, even studio lighting, yellowed aged bone material with visible suture lines where bones are fused, cracked ancient bone texture, necrotic cold feel, museum ossuary quality, high detail macro photography style, 1:1 aspect ratio`,
    negative: `skull, whole bones, skeleton, flesh, blood, ${STD_NEGATIVE}`,
  },
  {
    name: 'border-endless-spectres',
    category: 'borders',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    prompt: `Wisps of white and gray spectral fog on solid black background, ethereal smoke tendrils, ghostly translucent mist, soft diffused fog wisps floating in void, spectral haunting atmosphere, cold sickly green-tinted edges on fog, dark paranormal aesthetic, high detail, 1:1 aspect ratio`,
    negative: `face, skull, ghost figure, person, bright, solid white, ${STD_NEGATIVE}`,
    transparent: true, // Will convert black background to transparency
  },

  // ═══ C. Faction Text Panel Textures (9 textures, 512x256) ═══
  {
    name: 'tp-ironwright',
    category: 'textpanels',
    width: 512, height: 256,
    xcodeFolder: 'TextPanels',
    prompt: `Dark matte gunmetal metal surface, seamless tileable texture, top-down flat view, even studio lighting, very dark steel gray almost black, fine industrial grain, matte finish, no reflections, cold industrial metal, high detail macro photography style`,
    negative: `shiny, reflective, bright, scratches, ${STD_NEGATIVE}`,
  },
  {
    name: 'tp-fey-verdant',
    category: 'textpanels',
    width: 512, height: 256,
    xcodeFolder: 'TextPanels',
    prompt: `Dark parchment paper surface with subtle moss green tint, seamless tileable texture, top-down flat view, even studio lighting, aged dark cream paper with faint green-brown moss staining, organic paper quality, high detail macro photography style`,
    negative: `bright green, leaves, plants, ${STD_NEGATIVE}`,
  },
  {
    name: 'tp-fey-hollow',
    category: 'textpanels',
    width: 512, height: 256,
    xcodeFolder: 'TextPanels',
    prompt: `Pale frost surface, cold blue-tinted white, seamless tileable texture, top-down flat view, even studio lighting, very pale icy white with subtle blue undertone, delicate frost crystal patterns, frozen surface quality, high detail macro photography style`,
    negative: `ice cubes, snow, snowflakes, bright blue, ${STD_NEGATIVE}`,
  },
  {
    name: 'tp-demonic-furnace',
    category: 'textpanels',
    width: 512, height: 256,
    xcodeFolder: 'TextPanels',
    prompt: `Charred dark parchment surface nearly black, seamless tileable texture, top-down flat view, even studio lighting, burned darkened paper, deep charcoal brown almost black, subtle scorched fiber texture, ash-stained edges, high detail macro photography style`,
    negative: `fire, flames, smoke, bright orange, glowing, ${STD_NEGATIVE}`,
  },
  {
    name: 'tp-demonic-bureaucracy',
    category: 'textpanels',
    width: 512, height: 256,
    xcodeFolder: 'TextPanels',
    prompt: `Dusty sepia parchment surface with dim lighting, seamless tileable texture, top-down flat view, even studio lighting, aged yellowish-brown paper with sepia tone, dusty muted quality, old document paper, subdued oppressive atmosphere, high detail macro photography style`,
    negative: `text, writing, stamps, bright, clean white, ${STD_NEGATIVE}`,
  },
  {
    name: 'tp-celestial-knights',
    category: 'textpanels',
    width: 512, height: 256,
    xcodeFolder: 'TextPanels',
    prompt: `Illuminated warm parchment surface with golden tint, seamless tileable texture, top-down flat view, even studio lighting, warm cream paper with subtle golden illumination, manuscript quality parchment, divine warm glow, high detail macro photography style`,
    negative: `text, calligraphy, illustrations, too bright, ${STD_NEGATIVE}`,
  },
  {
    name: 'tp-celestial-chosen',
    category: 'textpanels',
    width: 512, height: 256,
    xcodeFolder: 'TextPanels',
    prompt: `Light-warped radiant cream parchment surface, seamless tileable texture, top-down flat view, even studio lighting, pale cream paper with subtle light distortion effect, divine radiance quality, warm ethereal glow permeating the surface, high detail macro photography style`,
    negative: `text, rays of light, beams, too bright, white out, ${STD_NEGATIVE}`,
  },
  {
    name: 'tp-endless-cabals',
    category: 'textpanels',
    width: 512, height: 256,
    xcodeFolder: 'TextPanels',
    prompt: `Yellowed aged parchment surface with subterranean cold feel, seamless tileable texture, top-down flat view, even studio lighting, old yellowed paper with cold blue-gray undertone, crypt-like atmosphere, faded worn surface, necrotic document quality, high detail macro photography style`,
    negative: `text, writing, skulls, bones, ${STD_NEGATIVE}`,
  },
  {
    name: 'tp-endless-spectres',
    category: 'textpanels',
    width: 512, height: 256,
    xcodeFolder: 'TextPanels',
    prompt: `Translucent dark smoke wisps on solid black background, ethereal spectral fog panel, ghostly gray-green translucent mist, thin horizontal wispy smoke, dark paranormal aesthetic, sickly green tint in the fog, high detail, 512x256 aspect ratio`,
    negative: `face, skull, ghost figure, person, bright, solid white, ${STD_NEGATIVE}`,
    transparent: true,
  },

  // ═══ D. Metal Surface Variations (5 textures, 512x512, tileable) ═══
  {
    name: 'metal-gold',
    category: 'metals',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    prompt: `Polished gold metal surface, seamless tileable texture, top-down flat view, even studio lighting, rich warm gold color, subtle surface variation, premium jewelry-grade gold, soft metallic sheen, high detail macro photography style, 1:1 aspect ratio`,
    negative: `coins, jewelry, objects, bright yellow, cheap, ${STD_NEGATIVE}`,
  },
  {
    name: 'metal-silver',
    category: 'metals',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    prompt: `Brushed silver metal surface, seamless tileable texture, top-down flat view, even studio lighting, cool gray silver with fine directional brush marks, premium sterling quality, subtle metallic luster, high detail macro photography style, 1:1 aspect ratio`,
    negative: `tarnish, scratches, dents, mirror reflection, ${STD_NEGATIVE}`,
  },
  {
    name: 'metal-bronze',
    category: 'metals',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    prompt: `Aged bronze metal surface with subtle green patina, seamless tileable texture, top-down flat view, even studio lighting, warm brown-gold bronze with hints of verdigris patina in recesses, hammered ancient quality, high detail macro photography style, 1:1 aspect ratio`,
    negative: `statue, sculpture, coins, heavy corrosion, bright green, ${STD_NEGATIVE}`,
  },
  {
    name: 'metal-iron',
    category: 'metals',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    prompt: `Dark wrought iron metal surface, seamless tileable texture, top-down flat view, even studio lighting, deep dark gray-black iron, subtle forge hammer marks, matte dark finish, industrial medieval quality, high detail macro photography style, 1:1 aspect ratio`,
    negative: `rust, heavy corrosion, chains, fence, gate, ${STD_NEGATIVE}`,
  },
  {
    name: 'metal-obsidian',
    category: 'metals',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    prompt: `Polished volcanic obsidian glass surface, seamless tileable texture, top-down flat view, even studio lighting, deep pure black with subtle glossy depth, natural conchoidal fracture patterns very faintly visible, premium polished stone, high detail macro photography style, 1:1 aspect ratio`,
    negative: `cracks, rough, matte, chips, gray, ${STD_NEGATIVE}`,
  },

  // ═══ E. Universal Card Textures (3 textures, 512x512, tileable) ═══
  {
    name: 'tex-cardstock-grain',
    category: 'cardtextures',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    prompt: `Premium heavyweight matte card stock paper surface, seamless tileable texture, top-down flat view, even studio lighting, subtle fiber grain visible, 300gsm thick paper, very fine uniform grain, neutral warm gray, micro-texture detail, no gloss, no sheen, high detail macro photography style, 1:1 aspect ratio`,
    negative: `glossy, shiny, text, wrinkles, folds, creases, stains, printed pattern, colored, ${STD_NEGATIVE}`,
  },
  {
    name: 'tex-canvas-weave',
    category: 'cardtextures',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    prompt: `Artist canvas linen weave surface, seamless tileable texture, top-down flat view, even studio lighting, visible warp and weft threads, natural off-white linen, unprimed canvas texture, fine weave pattern, subtle thread variation, high detail macro photography style, 1:1 aspect ratio`,
    negative: `paint, color, stains, painted surface, gesso, primed, frame, stretcher bars, ${STD_NEGATIVE}`,
  },
  {
    name: 'tex-parchment',
    category: 'cardtextures',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    prompt: `Aged parchment paper surface, seamless tileable texture, top-down flat view, even studio lighting, warm cream color, very subtle foxing age spots, slight color variation, handmade paper quality, soft vellum-like surface, high detail macro photography style, 1:1 aspect ratio`,
    negative: `text, writing, printed, calligraphy, torn edges, holes, dark stains, heavy damage, burned, ${STD_NEGATIVE}`,
  },

  // ═══ F. UI Component Textures (4 textures, various sizes) ═══
  {
    name: 'ui-button-cardstock',
    category: 'ui',
    width: 512, height: 128,
    xcodeFolder: 'UIComponents',
    prompt: `Rectangular embossed cardstock button surface, pressed intaglio effect, warm cream paper with visible fiber texture, raised edges casting soft inner shadow at bottom edge, subtle highlight on top edge, top-down view, even lighting, tactile paper craft quality, aged printing press finish, premium matte paper, high detail macro photography style`,
    negative: `text, words, rounded corners, digital, glossy, plastic, 3D button, web button, gradient, ${STD_NEGATIVE}`,
  },
  {
    name: 'ui-button-cardstock-pressed',
    category: 'ui',
    width: 512, height: 128,
    xcodeFolder: 'UIComponents',
    prompt: `Rectangular depressed cardstock button surface, pressed down intaglio effect, warm cream paper with visible fiber texture, shadow on top edge, subtle highlight on bottom edge, depressed concave impression in surface, top-down view, even lighting, tactile paper craft quality, slightly darker than normal, high detail macro photography style`,
    negative: `text, words, rounded corners, digital, glossy, plastic, 3D button, web button, gradient, ${STD_NEGATIVE}`,
  },
  {
    name: 'ui-panel-leather',
    category: 'ui',
    width: 512, height: 512,
    xcodeFolder: 'UIComponents',
    prompt: `Dark tooled leather panel surface, book cover quality, seamless tileable texture, top-down flat view, even studio lighting, deep rich dark brown, fine leather grain with subtle decorative tooling marks along edges, aged patina, premium bookbinding leather, high detail macro photography style, 1:1 aspect ratio`,
    negative: `text, symbols, stitching visible, buckles, hardware, ${STD_NEGATIVE}`,
  },
  {
    name: 'ui-wax-seal',
    category: 'ui',
    width: 512, height: 512,
    xcodeFolder: 'UIComponents',
    prompt: `Red wax seal impression on dark leather surface, circular stamp, traditional correspondence wax seal, deep crimson red wax with subtle melted wax drips, embossed abstract heraldic pattern in center, warm candlelight, painterly oil painting style, fantasy game notification element, centered composition, high detail, 1:1 aspect ratio`,
    negative: `envelope, letter, paper, text, letters, modern, plastic, clean edges, digital, ${FULL_NEGATIVE}`,
  },

  // ═══ G. Card Back (1 illustration, 750x1050) ═══
  {
    name: 'card-back-chaos',
    category: 'cardback',
    width: 768, height: 1024,
    xcodeFolder: 'CardBacks',
    prompt: `Abstract swirling vortex of planar energy, oil painting on canvas, palette knife impasto technique, heavy visible brushstrokes, rich deep color layers, central glowing chaos mote orb surrounded by fractured reality shards floating in void, cosmic dark background with warm energy tendrils, muted steel blue and emerald green and volcanic red and divine gold and bone white colors swirling together, luminous depth, museum quality oil painting, vertical composition, dark cosmic atmosphere with colorful energy center`,
    negative: `creature, character, person, face, text, logo, border, frame, digital art, smooth, clean lines, 3D render, photograph, ${FULL_NEGATIVE}`,
  },

  // ═══ H. Spectral Fog Overlay (1 texture, 512x512, transparent) ═══
  {
    name: 'fx-spectral-fog',
    category: 'fx',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    prompt: `Wisps of white and gray spectral fog on solid black background, ethereal smoke tendrils, ghostly translucent swirling mist, soft diffused fog overlay effect, spectral haunting atmosphere, cold sickly green-white tinted fog, paranormal aesthetic, high detail, 1:1 aspect ratio`,
    negative: `face, skull, ghost figure, person, bright, solid white, ${STD_NEGATIVE}`,
    transparent: true,
  },
];

// ── fal.ai API caller with retry logic ──────────────────────────────

async function callFal(body, endpoint = 'fal-ai/flux/dev') {
  const maxRetries = 3;
  let delay = 3000;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(`https://fal.run/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (response.ok) return await response.json();
    const errText = await response.text();
    if (response.status === 422) throw new Error(`fal.ai 422: ${errText}`);
    if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
      console.log(`  fal.ai ${response.status}, retrying in ${delay / 1000}s...`);
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
      continue;
    }
    throw new Error(`fal.ai HTTP ${response.status}: ${errText}`);
  }
}

// ── Download image from URL ─────────────────────────────────────────

async function downloadImage(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

// ── Post-processing with sharp ──────────────────────────────────────

async function postProcess(inputBuffer, texture) {
  let pipeline = sharp(inputBuffer);

  // Resize to exact target dimensions if needed
  pipeline = pipeline.resize(texture.width, texture.height, { fit: 'cover' });

  // For textures that need transparency (fog/spectral), convert black bg to transparent
  if (texture.transparent) {
    // Convert to raw pixels, map black to transparent
    const { data, info } = await pipeline.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const pixels = Buffer.from(data);
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
      // Compute luminance — use it as alpha, making dark areas transparent
      const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      // Set alpha to luminance (dark = transparent, bright = opaque)
      pixels[i + 3] = lum;
      // Make the RGB white where there's fog (so it overlays cleanly)
      pixels[i] = 255;
      pixels[i + 1] = 255;
      pixels[i + 2] = 255;
    }
    return sharp(pixels, { raw: { width: info.width, height: info.height, channels: 4 } })
      .png()
      .toBuffer();
  }

  // Normalize contrast slightly: apply mild contrast curve
  pipeline = pipeline.modulate({ brightness: 1.0, saturation: 1.0 });
  // Subtle sharpening for texture detail
  pipeline = pipeline.sharpen({ sigma: 0.5 });

  return pipeline.png({ quality: 90 }).toBuffer();
}

// ── Install to Xcode Assets.xcassets ────────────────────────────────

function installToXcode(imageName, sourceBuffer, targetSubfolder) {
  const groupDir = join(ASSETS_DIR, targetSubfolder);
  mkdirSync(groupDir, { recursive: true });

  // Create group Contents.json if needed
  const groupContents = join(groupDir, 'Contents.json');
  if (!existsSync(groupContents)) {
    writeFileSync(groupContents, JSON.stringify({
      info: { author: 'xcode', version: 1 }
    }, null, 2));
  }

  // Create imageset directory
  const imagesetDir = join(groupDir, `${imageName}.imageset`);
  mkdirSync(imagesetDir, { recursive: true });

  // Write image file
  const destFilename = `${imageName}.png`;
  writeFileSync(join(imagesetDir, destFilename), sourceBuffer);

  // Write Contents.json for the imageset — universal, single scale
  writeFileSync(join(imagesetDir, 'Contents.json'), JSON.stringify({
    images: [
      { filename: destFilename, idiom: 'universal', scale: '1x' },
      { idiom: 'universal', scale: '2x' },
      { idiom: 'universal', scale: '3x' },
    ],
    info: { author: 'xcode', version: 1 },
  }, null, 2));

  console.log(`    Installed: ${imageName} -> Assets.xcassets/${targetSubfolder}/`);
}

// ── Generate a single texture ───────────────────────────────────────

async function generateTexture(texture) {
  const previewPath = join(PREVIEW_DIR, `${texture.name}.png`);

  // Skip if already generated
  if (existsSync(previewPath)) {
    console.log(`  SKIP: ${texture.name}.png already exists`);
    totalSkipped++;
    return { buffer: readFileSync(previewPath), skipped: true };
  }

  // Budget check
  if (totalCost + COST_PER_GEN > BUDGET_LIMIT) {
    console.log(`  ABORT: Budget limit ($${BUDGET_LIMIT}) would be exceeded`);
    failures.push({ name: texture.name, error: 'Budget limit reached' });
    return null;
  }

  console.log(`  Generating: ${texture.name} (${texture.width}x${texture.height})...`);

  const body = {
    prompt: texture.prompt,
    image_size: { width: texture.width, height: texture.height },
    num_inference_steps: 40,
    guidance_scale: 7.5,
    num_images: 1,
    enable_safety_checker: true,
    output_format: 'png',
  };

  // Add negative prompt (FLUX Dev supports it differently; include in prompt)
  // FLUX Dev doesn't have a native negative_prompt field — we prepend guidance
  // Actually, for FLUX Dev the guidance is all in the prompt. Let's append negative direction.
  body.prompt = texture.prompt + `. Avoid: ${texture.negative || STD_NEGATIVE}`;

  try {
    const result = await callFal(body);
    if (!result.images?.[0]?.url) throw new Error('No image URL in response');

    const url = result.images[0].url;
    console.log(`    Generated (seed: ${result.seed || 'unknown'})`);

    // Download
    const rawBuffer = await downloadImage(url);

    // Post-process
    console.log(`    Post-processing...`);
    const processedBuffer = await postProcess(rawBuffer, texture);

    // Save preview
    writeFileSync(previewPath, processedBuffer);
    console.log(`    Preview saved: ${(processedBuffer.length / 1024).toFixed(0)}KB`);

    totalCost += COST_PER_GEN;
    totalGenerated++;

    return { buffer: processedBuffer, skipped: false };
  } catch (err) {
    console.error(`    ERROR: ${err.message}`);
    failures.push({ name: texture.name, error: err.message });
    return null;
  }
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const doInstall = args.includes('--install');
  const onlyIdx = args.indexOf('--only');
  const onlyCategory = onlyIdx !== -1 ? args[onlyIdx + 1] : null;

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   Chaos Creatures — Visual Texture Generator             ║');
  console.log('║   38 textures via fal.ai FLUX Dev                        ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\nPreview dir: ${PREVIEW_DIR}`);
  console.log(`Budget: $${BUDGET_LIMIT} ($${COST_PER_GEN}/gen)`);
  if (onlyCategory) console.log(`Category filter: ${onlyCategory}`);
  if (doInstall) console.log('Mode: Generate + Install to Xcode Assets');
  console.log('');

  // Filter textures by category if requested
  const toGenerate = onlyCategory
    ? TEXTURES.filter(t => t.category === onlyCategory)
    : TEXTURES;

  console.log(`Textures to generate: ${toGenerate.length}`);
  console.log(`Estimated cost: $${(toGenerate.length * COST_PER_GEN).toFixed(2)}\n`);

  // Group by category for organized output
  const categories = {};
  for (const tex of toGenerate) {
    if (!categories[tex.category]) categories[tex.category] = [];
    categories[tex.category].push(tex);
  }

  const categoryLabels = {
    backgrounds: 'A. Screen Backgrounds',
    borders: 'B. Faction Border Textures',
    textpanels: 'C. Faction Text Panel Textures',
    metals: 'D. Metal Surface Variations',
    cardtextures: 'E. Universal Card Textures',
    ui: 'F. UI Component Textures',
    cardback: 'G. Card Back',
    fx: 'H. Spectral Fog Overlay',
  };

  for (const [cat, textures] of Object.entries(categories)) {
    console.log(`\n═══ ${categoryLabels[cat] || cat} (${textures.length}) ═══`);

    for (const texture of textures) {
      const result = await generateTexture(texture);

      if (result && doInstall) {
        const buf = result.skipped ? readFileSync(join(PREVIEW_DIR, `${texture.name}.png`)) : result.buffer;
        installToXcode(texture.name, buf, texture.xcodeFolder);
      }

      // Small delay between generations to avoid rate limiting
      if (result && !result.skipped) {
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }

  // ── Summary ─────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   GENERATION COMPLETE                                    ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`  Generated: ${totalGenerated} textures`);
  console.log(`  Skipped:   ${totalSkipped} (already existed)`);
  console.log(`  Failed:    ${failures.length}`);
  console.log(`  Total cost: $${totalCost.toFixed(2)}`);
  console.log(`  Budget remaining: $${(BUDGET_LIMIT - totalCost).toFixed(2)}`);

  if (failures.length > 0) {
    console.log('\n  Failures:');
    for (const f of failures) {
      console.log(`    - ${f.name}: ${f.error}`);
    }
  }

  if (doInstall) {
    console.log(`\n  Assets installed to: ${ASSETS_DIR}`);
    console.log('  Xcode asset catalog folders updated:');
    const folders = new Set(toGenerate.map(t => t.xcodeFolder));
    for (const f of folders) console.log(`    - ${f}/`);
  } else {
    console.log(`\n  Previews saved to: ${PREVIEW_DIR}`);
    console.log('  Run with --install to install to Xcode Assets.xcassets');
  }

  // Write manifest
  const manifest = {
    generated_at: new Date().toISOString(),
    total_generated: totalGenerated,
    total_skipped: totalSkipped,
    total_failed: failures.length,
    total_cost: totalCost,
    textures: toGenerate.map(t => ({
      name: t.name,
      category: t.category,
      size: `${t.width}x${t.height}`,
      xcodeFolder: t.xcodeFolder,
      transparent: t.transparent || false,
      status: failures.find(f => f.name === t.name)
        ? 'failed'
        : existsSync(join(PREVIEW_DIR, `${t.name}.png`)) ? 'success' : 'unknown',
    })),
    failures,
  };
  const manifestPath = join(PREVIEW_DIR, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n  Manifest: ${manifestPath}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
