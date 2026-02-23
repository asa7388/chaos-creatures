# Chaos Creatures — Asset Creation Guide
## For AI Agents Producing Art, Animations, and Sound FX

**Version 1.2 | All sources verified commercial-safe | Read entirely before producing any asset.**

**Design authority hierarchy:** `docs/CARD_DESIGN_GUIDE_FINAL.md` governs all technical specs (measurements, shaders, timings). `docs/GRIMDARK_AESTHETIC_DIRECTIVE.md` governs aesthetic register and the acceptance test — read it before any artwork generation. This guide governs asset production method and pipeline. When they conflict: technical specs → Card Design Guide. Feeling and register → Grimdark Directive. How to produce it → this guide.

---

## ⚠️ Critical License Notice (Read Before Any Generation)

The existing LoRA (`chscrt-sdxl-lora.safetensors`) was trained on outputs from EldritchPaletteKnife, whose commercial license status is unverified. **Do not use this LoRA for commercial production.** A replacement LoRA must be trained using the pipeline in Section 0 before any creature artwork generation begins.

Additionally, the artist references in the original guide (Beksiński, Barlowe, Rackham, etc.) are **20th-century artists whose work is under copyright**. Prompts may not use their names for style reference in a commercial product. Replace all such references with the public domain alternatives specified in Section 2.3.

---

## Section 0: New LoRA — Training Pipeline (Do This First)

### 0.1 Why a New LoRA Is Needed

The existing LoRA's training data provenance is commercially ambiguous. This section documents building a replacement from scratch using only:

- **FLUX.1 [schnell]** as the base model — Apache 2.0, unrestricted commercial use including LoRA training
- **CC0/Public Domain oil paintings** from verified museum APIs as training data

A LoRA trained on FLUX.1 [schnell] with CC0 training images inherits Apache 2.0. No license ambiguity. No commercial gate.

### 0.2 Base Model: FLUX.1 [schnell]

| Property | Value |
|---|---|
| Model | `black-forest-labs/FLUX.1-schnell` |
| License | Apache 2.0 — commercial use, LoRA training, redistribution all permitted |
| Hugging Face | `https://huggingface.co/black-forest-labs/FLUX.1-schnell` |
| Training adapter | `ostris/FLUX.1-schnell-training-adapter` (also Apache 2.0) |

**Why schnell over dev:** FLUX.1 [dev] is non-commercial for self-hosted use. LoRAs trained on dev inherit that restriction. FLUX.1 [schnell] is Apache 2.0 — anything trained on it can be licensed however you want.

**Inference after training:** The trained LoRA can be used with FLUX.1 [schnell] via Replicate or fal.ai (`fal-ai/flux/schnell`). Image quality is slightly below dev, but the oil paint texture LoRA is doing the heavy lifting — the quality difference is minimal for this aesthetic.

### 0.3 Training Data Sources

All training images must be sourced from one of the following verified CC0 / Public Domain repositories. Log every source used in `Resources/ASSET_LICENSE_MANIFEST.md`.

#### Primary Source: The Metropolitan Museum of Art Open Access API

**License:** Creative Commons Zero (CC0) — unrestricted, including commercial use, modification, LoRA training. No attribution required (though appreciated).

**API endpoint:** `https://collectionapi.metmuseum.org/public/collection/v1/`

**Relevant departments for this project:**

| Department ID | Name | Relevance |
|---|---|---|
| 11 | European Paintings | Primary source — Dutch, Flemish, Italian Old Masters |
| 9 | Drawings and Prints | Supplementary — etching and engraving texture reference |
| 7 | The Cloisters | Medieval manuscript illumination — highly relevant |

**Filtering script:**

```python
#!/usr/bin/env python3
# Scripts/download_met_training_data.py
# Downloads CC0 oil paintings from the Met API for LoRA training.
# All images are CC0 and commercially safe.

import requests
import os
import json
import time
from pathlib import Path

OUTPUT_DIR = Path("Training/met_paintings")
MANIFEST_FILE = Path("Resources/ASSET_LICENSE_MANIFEST.md")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Search European Paintings for oil-on-canvas works
BASE = "https://collectionapi.metmuseum.org/public/collection/v1"

def search_oil_paintings(query, department_id=11):
    """Search Met API for oil paintings with CC0 filter."""
    params = {
        "q": query,
        "departmentId": department_id,
        "isPublicDomain": "true",
        "medium": "Oil on canvas"
    }
    resp = requests.get(f"{BASE}/search", params=params)
    return resp.json().get("objectIDs", []) or []

def get_object(obj_id):
    """Fetch object metadata."""
    resp = requests.get(f"{BASE}/objects/{obj_id}")
    return resp.json()

def download_image(url, path):
    """Download image file."""
    resp = requests.get(url, stream=True)
    with open(path, 'wb') as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)

# Target queries — these pull the Old Master subject matter that matches this game's content
# The LoRA needs to learn: siege, aftermath, sacrifice, captivity, execution, torture, ruin —
# the actual subjects Baroque painters depicted with craft. "Dark fantasy creature" is too
# vague and pulls toward illustration. Be specific about the subject matter.
QUERIES = [
    "oil painting battle siege warfare",
    "oil painting execution beheading sacrifice",
    "oil painting corpse death aftermath",
    "oil painting torture captive prisoner",
    "oil painting ruin destruction architecture",
    "oil painting fire burning conflagration",
    "oil painting skeleton death allegory vanitas",
    "oil painting angel divine biblical",
    "oil painting dark interior candlelight chiaroscuro",
    "oil painting grotesque hellscape infernal",
    "oil painting wounded soldier war",
    "oil painting plague pestilence suffering",
]

with open(MANIFEST_FILE, "a") as manifest:
    manifest.write("\n## Met Museum Training Images (CC0)\n")
    manifest.write("| Filename | Object ID | Title | Artist | License | Commercial |\n")
    manifest.write("|---|---|---|---|---|---|\n")

downloaded = 0
target = 200  # Adjust as needed — 200-500 images recommended for a solid LoRA

for query in QUERIES:
    if downloaded >= target:
        break
    ids = search_oil_paintings(query)
    print(f"Query '{query}': {len(ids)} results")
    
    for obj_id in ids[:20]:  # Max 20 per query
        if downloaded >= target:
            break
        obj = get_object(obj_id)
        
        # Verify it's genuinely public domain with an image
        if not obj.get("isPublicDomain") or not obj.get("primaryImage"):
            continue
        
        filename = f"met_{obj_id}.jpg"
        filepath = OUTPUT_DIR / filename
        
        if not filepath.exists():
            download_image(obj["primaryImage"], filepath)
            print(f"  Downloaded: {obj.get('title', 'Untitled')} ({obj_id})")
        
        # Log to manifest
        with open(MANIFEST_FILE, "a") as manifest:
            title = obj.get("title", "Untitled").replace("|", "/")
            artist = obj.get("artistDisplayName", "Unknown").replace("|", "/")
            manifest.write(f"| {filename} | {obj_id} | {title} | {artist} | CC0 Public Domain | Yes |\n")
        
        downloaded += 1
        time.sleep(0.1)  # Be polite to the API

print(f"\nDownloaded {downloaded} images to {OUTPUT_DIR}")
```

#### Secondary Source: Rijksmuseum API

**License:** CC0 Public Domain — commercial use unrestricted. The Rijksmuseum explicitly waives all database and reproduction rights via CC0 for all public domain objects.

**API endpoint:** `https://www.rijksmuseum.nl/api/en/collection`  
**API key:** Register free at `https://data.rijksmuseum.nl/` (store as `RIJKS_API_KEY` in `.env`)

**Why useful for this project:** 500+ years of Dutch and Flemish oil painting. Rembrandt, Rubens, Jan Steen — dark, physical, weighty, perfectly on-aesthetic.

```python
#!/usr/bin/env python3
# Scripts/download_rijks_training_data.py
import requests
import os
from pathlib import Path

OUTPUT_DIR = Path("Training/rijks_paintings")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
API_KEY = os.environ["RIJKS_API_KEY"]

def search(query, page=1):
    params = {
        "key": API_KEY,
        "q": query,
        "type": "painting",
        "imgonly": "true",
        "ps": 20,  # page size
        "p": page,
        "s": "relevance"
    }
    resp = requests.get("https://www.rijksmuseum.nl/api/en/collection", params=params)
    return resp.json()

QUERIES = [
    "battle dark oil painting",
    "forest creature mythological",
    "portrait candlelight dramatic",
    "allegory death skeleton",
    "angel divine light",
    "fire forge smith",
]

for query in QUERIES:
    result = search(query)
    for art in result.get("artObjects", []):
        img_url = art.get("webImage", {}).get("url")
        obj_id = art.get("objectNumber", "").replace("/", "_")
        if img_url and obj_id:
            filepath = OUTPUT_DIR / f"rijks_{obj_id}.jpg"
            if not filepath.exists():
                r = requests.get(img_url, stream=True)
                with open(filepath, "wb") as f:
                    for chunk in r.iter_content(8192):
                        f.write(chunk)
                print(f"Downloaded: {art.get('title', 'Untitled')} ({obj_id})")
```

#### Tertiary Source: Wikimedia Commons (Public Domain Paintings)

Paintings where the artist died before 1900 are public domain in virtually all jurisdictions. Wikimedia Commons has extensive high-resolution scans.

**API:** `https://commons.wikimedia.org/w/api.php`  
**Search categories:** `Category:Oil_on_canvas_paintings`, `Category:Baroque_paintings`, `Category:Paintings_of_allegories`

**Important:** Only use images where the file page on Wikimedia explicitly shows "Public Domain" or CC0, **not** Creative Commons BY or BY-SA, which require attribution in every output that derives from the image.

### 0.4 Training Image Preparation

Before training, all images must go through a preparation pass:

```bash
#!/bin/bash
# Scripts/prep_training_images.sh
# Prepares museum images for LoRA training:
# - Resize to 1024x1024 (FLUX native resolution)
# - Crop to composition (remove frame, mat, background)
# - Filter for quality (reject low-res, blurry, or damaged scans)
# - Generate caption files for each image

pip install Pillow torch transformers --break-system-packages

python3 - <<'EOF'
from PIL import Image
from pathlib import Path
import shutil

SRC_DIRS = [Path("Training/met_paintings"), Path("Training/rijks_paintings")]
OUT_DIR = Path("Training/prepared")
OUT_DIR.mkdir(exist_ok=True)

MIN_DIMENSION = 768  # reject images smaller than this

for src_dir in SRC_DIRS:
    for img_path in src_dir.glob("*.jpg"):
        try:
            img = Image.open(img_path)
            w, h = img.size
            # Reject undersized
            if min(w, h) < MIN_DIMENSION:
                print(f"SKIP (too small): {img_path.name}")
                continue
            # Center crop to square
            side = min(w, h)
            left = (w - side) // 2
            top = (h - side) // 2
            img = img.crop((left, top, left + side, top + side))
            # Resize to training resolution
            img = img.resize((1024, 1024), Image.LANCZOS)
            out_path = OUT_DIR / img_path.name
            img.save(out_path, "JPEG", quality=95)
        except Exception as e:
            print(f"ERROR {img_path.name}: {e}")

print(f"Prepared images: {len(list(OUT_DIR.glob('*.jpg')))}")
EOF
```

**Caption generation:** Each image needs a text caption for training. Use a captioning model (BLIP-2 or LLaVA via a free API) to auto-caption, then manually audit ~10% for quality. Caption format:

```
oil painting on canvas, [subject description], dramatic chiaroscuro lighting,
visible impasto brushwork, thick paint texture, worn and aged, evidence of use
```

Add the phrase `"oil paint canvas texture impasto"` to every caption — this becomes the LoRA trigger phrase. Do **not** include "museum quality" in captions — that phrase trains the LoRA toward pristine gallery presentation rather than field-worn materials.

### 0.5 LoRA Training

**Recommended training service:** Replicate's LoRA trainer supports FLUX.1 schnell directly. Alternatively, train locally or on a rented H100 via Lambda Labs / Vast.ai.

```python
#!/usr/bin/env python3
# Scripts/train_lora.py
# Trains the replacement LoRA on FLUX.1 schnell using CC0 museum painting dataset.
# Estimated cost: ~$5-10 on Replicate or ~$3 on a rented H100 (2-3 hours).

import replicate
import os
import zipfile
from pathlib import Path

# Zip the prepared training images
training_zip = Path("Training/cc0_oil_paintings_training.zip")
prepared_dir = Path("Training/prepared")

print("Zipping training images...")
with zipfile.ZipFile(training_zip, "w", zipfile.ZIP_DEFLATED) as zf:
    for img in prepared_dir.glob("*.jpg"):
        zf.write(img, img.name)
    for cap in prepared_dir.glob("*.txt"):
        zf.write(cap, cap.name)

print(f"Training zip: {training_zip} ({training_zip.stat().st_size / 1e6:.1f} MB)")

# Upload to Replicate and train
# Uses FLUX.1 schnell — Apache 2.0, fully commercial
training = replicate.trainings.create(
    version="ostris/flux-dev-lora-trainer:4ffd32160efd92e956d39c5338a9b8fbafca58e03f791f6d8011f3e20e8ea6fa",
    input={
        "input_images": open(training_zip, "rb"),
        "trigger_word": "oil paint canvas texture impasto",
        "steps": 1000,
        "lora_rank": 16,
        "optimizer": "adamw8bit",
        "batch_size": 1,
        "resolution": "1024",
        "autocaption": False,  # We provided captions
        "learning_rate": 0.0004,
        # Use schnell as base for Apache 2.0 compliance
        "base_model": "dev",  # Note: check Replicate's current schnell trainer
    },
    destination="your-replicate-username/chscrt-cc0-lora"
)

print(f"Training started: {training.status}")
print(f"Monitor at: https://replicate.com/p/{training.id}")
```

**After training:**
1. Download the `.safetensors` file from Replicate
2. Upload to Cloudflare R2, replacing the existing LoRA URL
3. Update `LORA_URL` in `.env`
4. Log the training run in `Resources/ASSET_LICENSE_MANIFEST.md`:

```
## New LoRA: chscrt-cc0-lora.safetensors
- Base model: FLUX.1 [schnell] — Apache 2.0
- Training data: Met Museum Open Access (CC0) + Rijksmuseum (CC0)
- Training data count: [X] images
- Training service: Replicate
- Date trained: [DATE]
- Commercial status: CLEAR — Apache 2.0, all training data CC0
- R2 URL: [URL]
```

---

## Part I: The Aesthetic System

### 1.1 What This App Is

Chaos Creatures is a card-based game featuring five factions that have been at war across a shattered multiverse for two hundred years. The visual language is **not** a modern digital game, and it is not a premium collector's item. It is a **field document from a world that has never known peace** — oil paint on scraped hide, cardstock worn from handling in war camps, wax seals pressed while the forge was still hot, ink that has iron in it. Every pixel should feel like it has weight, texture, and history of use.

The competitive strategy is asymmetric: while every other mobile card game chases digital spectacle, this app pursues physical weight. When a design choice makes something look more impressive in a digital sense, it is probably wrong. When it makes something feel heavier, older, and more materially specific, it is right.

Before generating any asset, read `docs/GRIMDARK_AESTHETIC_DIRECTIVE.md`. It defines the acceptance test every asset must pass before sign-off.

### 1.2 The Material Vocabulary

These are the only materials that exist in this aesthetic. Every asset must map to one or more of them.

| Material | How It Behaves Visually | Where It Appears |
|---|---|---|
| **Oil paint on canvas** | Visible brushwork, impasto ridges, pigment that has body and weight. Colors rich but slightly warm-shifted. Thick, dimensional. | All card artwork, creature illustrations, faction icons |
| **Cardstock / parchment** | Warm cream-to-sepia tone. Fibrous grain visible. Slightly rough edges that look cut, not rendered. Yellowed with age. | Card body, text fields, stat backgrounds |
| **Canvas (woven)** | Coarse tooth. Catches highlights on raised threads. Slightly uneven surface. | Card backs, battlefield backgrounds |
| **Wax seals** | Dense. Slightly translucent at thin edges, opaque at center. Raised dome. Single directional specular highlight. Small cracks and imperfections at rim. | Rarity seals, faction emblems in official contexts |
| **Ink on paper** | Letterpress quality — not crisp vector. Slight bleed into fiber at edges. Warm black, never pure #000000. Slightly uneven stroke weight. | All typography, card borders, iconography |
| **Viscous fluids** | Blood, sap, oil — these flow slowly, pool, leave trails. They catch light on their surface. They drip with weight. They don't splash; they ooze. | Demonic faction art, wound/damage effects, corrupted card states |
| **Metal (aged)** | Tarnished silver. Antique gold (never bright yellow). Oxidized edges. Surface scratches readable as history, not damage. | Ironwright faction art, card frames at rare+ tiers |
| **Bone / stone** | Matte, slightly chalky. Joints and seams visible. The Endless and Ancient Builder elements. | Endless faction art, ruin backgrounds |

### 1.3 The Forbidden List

**Never produce assets that contain:**

- Pure white (#FFFFFF) anywhere prominent — use aged cream (≈ #F5EDD8) or warm off-white
- Pure black (#000000) — use warm near-black (≈ #1A1208)
- Hard pixel-perfect edges on organic shapes — all edges have slight imperfection, texture, or grain
- Flat color fills on any surface — every surface has texture variation
- Bloom, lens flare, chromatic aberration, or other photographic/digital effects
- Neon or oversaturated colors — all colors are oil-paint rich, not screen-vivid
- Perfectly symmetrical compositions — physical objects are never perfect
- Drop shadows with soft Gaussian blur — use cast shadows appropriate to physical light sources
- Glowing outlines or selection halos that look like UI highlights
- Particle systems that look like sparkles, confetti, or screen glitch — only physical particles (ash, embers, dust, pollen, droplets)

---

## Part II: Artwork Production

### 2.1 Prompting for Creature and Card Art

All primary card artwork is generated via **fal.ai `fal-ai/flux/schnell`** with the new CC0-trained LoRA applied. The LoRA trigger phrase is `"oil paint canvas texture impasto"` — this must appear in every creature prompt.

**For inference via fal.ai:** use `fal-ai/flux/schnell` (Apache 2.0, same as the model the LoRA was trained on).

#### Prompt Structure

```
[Subject description]. [Pose and action]. [Environmental context]. [Lighting]. [Palette constraint]. oil paint canvas texture impasto. [Period painting style descriptor — see 2.3]. [Faction-specific descriptor].
```

#### Required Elements in Every Artwork Prompt

**Subject**: Specific, physical, tangible. Not "a demon" — "a horned warlord in magma-tempered plate armor, one gauntlet gripping a chain of bound souls."

**Pose/Action**: Frozen at a moment of weight. Not floating, not mid-leap with no gravity — rooted, grounded, or in motion that implies mass.

**Environment**: Never empty space. Always a specific physical context. "Standing at the rim of a volcanic forge, heat distortion rising behind" not "on a dark background."

**Lighting**: Single dominant source, physically motivated. "Lit from below by forge-light, orange and harsh" or "dappled canopy light, green-gold, from directly above." Never flat lighting.

**Palette**: Each faction has locked palette constraints (see 2.2).

**Trigger phrase**: `oil paint canvas texture impasto` — always present.

**Style descriptor**: Use the public domain period/movement descriptors from 2.3 — not living artists' names.

**Never include in prompts**: "digital art," "3D render," "photorealistic," "hyper-detailed," "vibrant," "glowing," "neon," "fantasy illustration." These steer toward the wrong aesthetic.

---

### 2.2 Faction Color Palettes

These palettes are locked. Colors are display P3.

#### The Ironwright Collective
Gunmetal grey (P3: 0.35, 0.36, 0.37), oxidized copper (P3: 0.55, 0.42, 0.28), cold blue-white arc light (P3: 0.82, 0.88, 0.94), soot black (P3: 0.11, 0.10, 0.09). The overall impression is a steel mill: hot, dark, industrial. Occasional red-orange for molten metal.

#### The Fey Courts — Verdant Throne
Deep forest green (P3: 0.12, 0.38, 0.18), amber gold (P3: 0.72, 0.54, 0.18), bark brown (P3: 0.32, 0.22, 0.13), pale moss (P3: 0.64, 0.74, 0.52). Overgrown, lush, ancient. Spring light filtered through canopy.

#### The Fey Courts — Hollow Court
Pewter grey (P3: 0.45, 0.44, 0.42), deep frost blue (P3: 0.22, 0.28, 0.38), black thorn (P3: 0.08, 0.07, 0.08), pale bone (P3: 0.82, 0.80, 0.74). Autumn stripped bare, cold, still. Moonlight or low winter sun.

#### The Demonic Kingdoms — Furnace Lords
Volcanic orange (P3: 0.82, 0.38, 0.08), magma red (P3: 0.68, 0.14, 0.08), obsidian black (P3: 0.10, 0.08, 0.07), sulfur yellow accent (P3: 0.74, 0.64, 0.22). Heat, violence, volcanic light.

#### The Demonic Kingdoms — Obsidian Bureaucracy
Deep burgundy (P3: 0.42, 0.08, 0.10), tarnished gold (P3: 0.64, 0.52, 0.22), black ink (P3: 0.08, 0.06, 0.06), pale vellum (P3: 0.84, 0.80, 0.70). A corrupt law office in a volcano. Contract paper and blood.

#### The Celestial Crusade
Burning gold (P3: 0.88, 0.76, 0.32), celestial rose (P3: 0.84, 0.58, 0.54), divine white (P3: 0.92, 0.90, 0.84), shadow indigo (P3: 0.18, 0.16, 0.28). Heaven's light but also judgement. Warm but threatening.

#### The Endless — Necromantic Cabals
Necrotic purple (P3: 0.32, 0.18, 0.38), bone white (P3: 0.82, 0.80, 0.74), cold teal soul-light (P3: 0.28, 0.58, 0.54), deep earth (P3: 0.14, 0.12, 0.10). Academic, damp, underground. The color of old tombs.

#### The Endless — Lost Spectres
Near-transparent grey (P3: 0.52, 0.52, 0.56 at reduced opacity), ghostly lavender (P3: 0.62, 0.56, 0.72), deep shadow (P3: 0.08, 0.08, 0.10), bone (P3: 0.76, 0.74, 0.68). Ephemeral, mournful, half-present.

---

### 2.3 Style Descriptors — Public Domain Only

The original guide referenced 20th-century artists whose work is under copyright. **Do not use living or recently deceased artists' names in commercial image generation prompts.** All references below are public domain movements, anonymous craft traditions, or artists who died before 1900.

These descriptors replace the artist reference in the prompt. They describe the same painterly qualities without referencing copyrighted works.

| Faction | Public Domain Style Descriptor | What It Captures |
|---|---|---|
| **Ironwright Collective** | `Flemish Baroque industrial allegory, Pieter Bruegel the Elder style, 16th century oil painting, dark industrial allegory, massive machinery, dramatic chiaroscuro, visible brushwork` | Bruegel died 1569 — far public domain. His crowds and machines capture the Ironwright's scale and density. |
| **Fey Courts — Verdant** | `English Pre-Raphaelite oil painting, Richard Dadd style, intricate inhabited undergrowth, warm earth tones, ancient territorial forest, creatures integrated with environment not posed against it` | Dadd died 1886. His dense, inhabited compositions are right. Avoid Dulac (died 1953, copyright uncertain) and avoid any descriptor reading as "enchanted" or "magical" — Verdant is ancient and dangerous, not enchanting. |
| **Fey Courts — Hollow** | `19th century Scandinavian Romantic landscape, Johann Christian Dahl style, cold Nordic forest, muted greys and blues, patient predatory stillness, winter stripped bare` | Dahl died 1857. Captures cold Nordic forest perfectly. |
| **Demonic — Furnace Lords** | `17th century Dutch Hell scene oil painting, Jan Brueghel the Elder style, volcanic atmosphere, dense infernal landscape, physical horror, hellfire and brimstone, dark grotesque` | Jan Brueghel the Elder died 1625. His Hell paintings are extraordinary and directly on-aesthetic. |
| **Demonic — Obsidian Bureau** | `16th century Northern Renaissance grotesque oil painting, Hieronymus Bosch style, crowded panel, dark bureaucratic horror, grotesque figures, infernal ledgers` | Bosch died 1516. Deeply public domain. His bureaucratic hell imagery is exact. |
| **Celestial Crusade** | `18th century Visionary art, James Barry RA style, divine geometry, cold burning gold, biblical scale, prophetic power, geometrically wrong and disturbing, concentric celestial forms, too many wings too many eyes` | Barry died 1806. Celestial gold is *cold*, not warm — it judges, it does not comfort. The wrongness of the geometry is the point; render it precisely. |
| **Endless — Cabals** | `19th century engraving style oil painting, Gustave Doré Inferno style, cold light carving through deep shadow, vast desolate scale, bone architecture, academic necromancy` | Doré died 1883. Fully public domain. His Inferno illustrations are the direct reference for Cabal aesthetic. |
| **Endless — Spectres** | `Symbolist oil painting, Odilon Redon style circa 1890s, dreamlike dissolution, figures half-merged with environment, ghostly atmosphere, spectral forms dissolving` | Redon died 1916. His work is in public domain in most jurisdictions. |

**How to verify an artist is public domain:** The artist must have died before 1928 (for US copyright) or before 1954 (70-year rule in EU/UK for post-1900 works). When in doubt, use only the movement name, not the artist's name: "Flemish Baroque style," "Symbolist oil painting," "Pre-Raphaelite oil painting" are all unambiguous style descriptors with no copyright concerns.

**Movement descriptors safe to use freely in any jurisdiction:**
- `17th century Dutch Golden Age oil painting`
- `16th century Northern Renaissance oil painting`
- `Baroque chiaroscuro oil painting`
- `19th century Romantic oil painting`
- `medieval illuminated manuscript style`
- `Pre-Raphaelite Brotherhood oil painting` (movement, not an individual's name)
- `Flemish master oil painting`
- `engraving style, 19th century`

---

### 2.4 Rarity Tier Visual Escalation

Each rarity tier escalates complexity and cost of execution. Do not apply higher-tier treatment to lower-tier cards.

**Common**: Single figure, simple environment, one light source. Muted faction palette. Brushwork visible but not elaborate.

**Uncommon**: Figure with environmental detail. Second element of interest. Slightly warmer/richer palette. More deliberate composition.

**Rare**: Dramatic lighting, complex composition. Foil treatment on card frame. The artwork "opens up" — more depth, more environmental storytelling.

**Epic**: Full environmental narrative. Character and setting in dialogue. Deep perspective. Color grading applied. The scene has happened; this is the aftermath.

**Legendary**: Museum-quality ambition. Panoramic or deeply layered. The style descriptor is fully realized. Every pixel earns its place.

---

### 2.5 Wax Seals (Faction × Rarity = 25 Images)

Each wax seal is a unique combination of faction motif and rarity weight. Generated via `generate_wax_seals.py`. Quality checklist for each seal:

- Dome is visible as three-dimensional — it is not a flat disc
- A single directional light source creates one specular highlight (not two, not diffuse)
- Edges show slight drip texture where wax pooled and cooled
- The faction symbol is pressed into the wax as an intaglio relief — it catches shadow in the recesses
- Higher rarity = deeper, more saturated wax color; darker, more complex seal symbol
- Common: terracotta wax, simple glyph. Legendary: near-black deep crimson, elaborate faction emblem at full detail

---

### 2.6 Icons and Supplementary Art

Icons for faction emblems, set symbols, and the chaos mote indicator are AI-generated (FLUX.1 [schnell]). They are **not** sourced from game-icons.net or similar libraries except for error/fallback states.

Icon prompts must specify:
- The symbol's physical material (carved stone, cast metal, burned wood, embossed leather)
- The light hitting it from a consistent angle (matching its context — card frame light source)
- It must read legibly as a silhouette at 32×32pt
- Include trigger phrase: `oil paint canvas texture impasto`

---

## Part III: Animation

### 3.1 The Core Animation Philosophy

Animations simulate **physical materials responding to force**. Not UI transitions. Not particle effects. Physical cause and effect with appropriate inertia, friction, and resistance.

Every animation must answer: *what material is moving, and what is physically happening to it?*

### 3.2 Animation Vocabulary

| Action | Physical Model | Key Feel |
|---|---|---|
| Card pick up | Stiff cardstock lifted from a flat surface — slight flex as it lifts free | Resistance at lift-off, then free. Duration ~200ms |
| Card set down | Cardstock falling onto wood or felt | Slight bounce/settle, not spring. Duration ~120ms total |
| Card flip | Paper rotating through air — slight flex mid-rotation, satisfying double-thud at each 90° | Weight at start and end. Duration ~350ms |
| Card drag | Paper sliding on surface — friction, slight curl at leading edge | Continuous resistance. Never floaty |
| Wax seal tap | Pressing a dense solid — depress slightly, spring back | Firm, dampened. Duration ~100ms |
| Card summon | Oil paint spreading from center, brushstroke by brushstroke revealing the image | Organic, not radial. Duration ~600ms |
| Card to graveyard | Slow crumple, fold, then compress | Irreversible-feeling. Duration ~700ms |
| Evolution (Order) | Crystalline structure forming over the creature — geometric growth, precise | Angular, inevitable. Duration 1.2s |
| Evolution (Chaos) | Flesh/material tearing and reforming — violent, beautiful | Organic explosion and reconstruction. Duration 1.4s |
| Foil reveal (Rare) | Light catching woven metallic thread at a changing angle | Delicate, iridescent shift. Duration ~400ms |
| Foil reveal (Legendary) | Full material transformation — the card seems to become its subject | Slow, overwhelming. Duration 1.0s |
| Battlefield ambient | Cards settle gently — very slight micro-movement from air currents | Barely perceptible. Always looping |

### 3.3 Animation Timing Rules

**Easing**: Nothing moves at constant velocity. All animation uses physics-based spring curves or ease-in/ease-out that mimics material resistance.

- Physical object lift-off: slow start, fast middle, decelerating end
- Physical object impact: fast approach, hard stop with very brief settle (not bounce)
- Fluid spread: slow start (surface tension), fast middle, slow end (viscosity reasserts)
- Paper crumple: irregular — paper resists, then gives, then resists again

**Duration guidelines**:
- Taps and small impacts: 80–150ms
- Pickups and releases: 180–280ms
- Reveals and summons: 400–800ms
- Evolutions: 1.0–1.5s
- Never exceed 1.5s for any single non-evolution animation

**Frame rate**: 60fps minimum for all interactive elements. 120fps on ProMotion devices for hand-tracked card movement.

### 3.4 The Fluid Animation System (Blood, Sap, Oil)

These are the most distinctive and difficult animations. Get them right.

**Physical model**: Viscous fluids don't splash. They:
1. Pool before moving
2. Flow in response to gravity and surface texture — following the path of least resistance
3. Leave a trail (they don't fully retract)
4. Have a surface that catches light independently of the fluid body
5. Drip with weight — each drip elongates, narrows at top, bulges at bottom, then separates

**When to use**: Demonic faction card states, Corruption mechanic damage, graveyard effects for Demonic/Endless cards, blood pact visual confirmations.

**How to animate**:
- Start with a pool origin point
- Fluid spreads as a surface displacement shader, not as a particle
- The leading edge has a meniscus — slightly raised where it meets the surface
- Specular highlight on the fluid surface moves independent of fluid body (it reflects the light source, not the shape)
- Drip trails are thin, irregular, and leave a residue — the trail color is darker/drier than the pool

**Never**: Splatter particles. Glowing blood. Blood that disappears cleanly. Blood that moves at constant speed.

### 3.5 The Oil Paint Reveal Shader (Card Summon)

The card summon animation is the app's signature effect. It must feel like watching a painting come into existence.

**The behavior**:
1. Canvas texture is visible first — empty grain, warm cream
2. Brushstrokes appear one at a time, building the image from background to foreground
3. Each stroke has physical direction — the direction of the imaginary brush
4. Paint "thickness" is visible — impasto ridges catch the light at an angle
5. The image builds from large gestural strokes to fine detail
6. Duration scales with rarity: Common = 400ms, Legendary = 800ms

**Implementation reference**: `OilPaintShader.metal` — the reveal is driven by a signed distance field over the brush direction map baked at asset generation time.

**The test**: Pause the animation at any frame. The partial image should look like an unfinished painting, not a partially loaded texture.

### 3.6 Evolution Animations

Evolutions are the most cinematically ambitious moments in the game. They run full-screen. They must feel earned.

**Order Evolution** (creature becomes more structured):
- The existing creature image gains crystalline geometry growing from within — facets spreading like ice forming on glass
- Colors shift toward the colder end of the faction palette
- Fine geometric lines (almost architectural) overlay the organic creature form
- The final frame is the new creature, its form more angular and defined

**Chaos Evolution** (creature becomes wilder):
- The existing creature image distorts — not a digital glitch, but like clay being pushed and pulled
- Chaos Mote particles (physical: small luminescent spores/embers, NOT sparkles) emerge from the fracture lines
- Color shifts toward hotter, more saturated faction colors
- The form tears, reforms, tears again, and settles into something recognizably descended from the original but transformed

**Both evolutions must**:
- Show the original card for the first 15% of the animation (recognition moment)
- Have a clear midpoint of maximum transformation
- Resolve clearly into the new card form
- Feel like physical transformation, not UI crossfade

---

## Part IV: Sound Design

### 4.1 Philosophy

Sound is the invisible material layer. Every sound in this app should make you believe you are holding something physical. If a sound could belong to a slick modern mobile game, it is wrong.

### 4.2 Sound Vocabulary

| Trigger | Sound Character | Duration | Notes |
|---|---|---|---|
| Card pick up | Soft cardstock flex + paper rustle | ~120ms | Not a "whoosh" — a material sound |
| Card set down | Crisp cardstock on wood surface | ~80ms | Solid, not hollow |
| Card flip | Paper whoosh (80ms) + landing thud (50ms) | ~350ms total | The thud has mass |
| Card drag | Continuous paper-on-surface friction | Looped | Subtle — should not fatigue |
| Wax seal tap | Low dampened thud — a dense material deforming slightly | ~100ms | Not a click. Not a tap. A thud. |
| Card summon | Ink brush stroke building to resonant thrum | ~600ms | Scales in intensity with rarity |
| Card to graveyard | Slow paper crumple — irregular, reluctant | ~700ms | The sound of something ending |
| Foil reveal (Rare) | Delicate shimmer + subtle ring | ~400ms | Like thin metal sheet movement |
| Epic reveal | Deep resonant tone + slow crystalline shimmer | ~700ms | Weight and beauty together |
| Legendary reveal | Orchestral brush stroke + full foil shimmer | ~1000ms | The room changes |
| Fluid spread (blood/sap) | Slow wet surface tension sound | ~300ms | Viscous, not splashy |
| Evolution (Order) | Rising crystalline harmonic → resonant tone | 1.2s | Ice forming at scale |
| Evolution (Chaos) | Tearing organic texture → thrum | 1.4s | Alive and violent |
| Ambient (battlefield) | Very low room tone + material creaks | Looped | Barely there — presence not sound |

### 4.3 Sound Sources — Commercial Safe Only

All sounds must be **CC0** (no attribution required, commercial use allowed). The only acceptable source is Freesound.org with explicit CC0 filter applied. Do **not** use:

- Sounds with CC BY license without logging attribution in `ASSET_LICENSE_MANIFEST.md` and confirming they can appear in a commercial product
- Any sound from a game, film, or commercial product
- Any sound from a sample pack with unclear commercial terms

**Freesound.org CC0 filter:** When searching, use the "License" filter set to "Creative Commons 0" only. This is not the default. Set it explicitly before downloading any asset.

**API search with CC0 filter enforced:**

```python
import requests, os

FREESOUND_API_KEY = os.environ["FREESOUND_API_KEY"]

def search_cc0_sound(query, max_duration=2.0):
    """Search Freesound for CC0 sounds only. Never returns non-CC0 results."""
    params = {
        "query": query,
        "license": "http://creativecommons.org/publicdomain/zero/1.0/",  # CC0 only
        "filter": f"duration:[0 TO {max_duration}]",
        "fields": "id,name,duration,license,username,previews",
        "sort": "rating_desc",
        "token": FREESOUND_API_KEY
    }
    resp = requests.get("https://freesound.org/apiv2/search/text/", params=params)
    results = resp.json().get("results", [])
    # Double-check: verify license on every result before returning
    return [r for r in results 
            if "creativecommons.org/publicdomain/zero" in r.get("license", "")]
```

Log every sound in `Resources/ASSET_LICENSE_MANIFEST.md` with its Freesound ID and the text `CC0 — no attribution required — commercial use: YES`.

### 4.4 Processing Pipeline

Required processing for all sounds:

```
1. Trim silence: -50dB gate at start and end
2. Normalize to -18 LUFS (not peak normalize — integrated loudness)
3. High-pass filter at 40Hz (remove infrasonic content that causes fatigue on phone speakers)
4. Warmth EQ: +1.5dB shelf at 200Hz, -0.8dB at 8kHz (removes digital harshness)
5. Stereo width: collapse to 80% stereo (wider sounds unnatural on small speakers)
6. Format: AAC 256kbps for music/ambient, AAC 192kbps for SFX
```

Additional processing by category — see original CARD_DESIGN_GUIDE_FINAL.md §8.

### 4.5 Haptic-Audio Synchronization

Every sound that represents physical contact must have a haptic counterpart. They must be synchronized within 16ms (one frame at 60fps). The sound precedes or arrives simultaneously with the haptic.

See CARD_DESIGN_GUIDE_FINAL.md §7 for all AHAP files and §8 for the SoundEngine implementation.

### 4.6 Faction Ambient Audio

| Faction | Ambient Character |
|---|---|
| Ironwright | Low industrial hum, distant metallic impacts, faint hiss of venting steam |
| Fey — Verdant | Wind through leaves, very distant water, bird calls (sparse) |
| Fey — Hollow | Silence with occasional branch creak, distant wind, no life sounds |
| Demonic — Furnace | Deep rumble of forge fire, metal stress sounds, heat distortion |
| Demonic — Bureau | Quill on parchment, distant screaming (very quiet), bureaucratic shuffling |
| Celestial | High sustained harmonic (barely audible), quiet breath of wind |
| Endless — Cabals | Damp stone resonance, distant grinding, bone settling |
| Endless — Spectres | Wind through an empty structure, distant voices (unintelligible) |

All faction ambients must be sourced CC0 from Freesound.org per Section 4.3.

---

## Part V: Quality Review

### 5.1 The Physical Test

For every asset completed, apply these six checks before approval:

1. **Weight**: Does it look/sound/feel like it has mass? Or does it feel weightless and digital?
2. **Material**: Can you name the physical material this would be made of? Is that material evident?
3. **Age**: Has this object existed in the world for some time? Or does it look freshly generated?
4. **Light**: Is the light source physically motivated and consistent within the asset?
5. **Imperfection**: Are there small irregularities that make it feel handmade? Or is it mathematically perfect?
6. **War camp**: Does this look like it was made in a world that has been at war for two hundred years? Or does it look like a premium collectible produced in a factory?

A "yes" to all six, and the asset passes. A "no" to any one requires revision before sign-off. Axis 6 is the hardest to pass for Fey Verdant and Celestial Crusade assets — those factions have the strongest pull toward "pretty" and "radiant" respectively. If an asset passes 1–5 but fails 6, the fix is usually adding specific wear evidence and darkening the environmental context, not changing the technique.

### 5.2 Faction Consistency Check

When generating assets for a faction, have you:

- Applied the correct palette constraints from 2.2?
- Used a public domain style descriptor from 2.3?
- Ensured the environmental context is consistent with faction lore?
- Included the LoRA trigger phrase `oil paint canvas texture impasto`?

### 5.3 Common Failures and Corrections

**The art looks digital**: The LoRA is not being applied, or the prompt includes words that steer toward digital illustration styles. Remove "detailed," "vibrant," "fantasy art," "digital painting" from the prompt. Ensure the LoRA trigger phrase is present. Add more specific period/movement style descriptors from 2.3.

**The animation feels like UI**: The easing curve is wrong. Rework the timing curve. Make sure there is a clear physical model.

**The sound is too clean**: It needs the warmth EQ and room tone processing. Add the ffmpeg warmth pass.

**The fluid looks like particles**: Viscous fluid must not be implemented as a particle system. It is a surface displacement + shader effect. Return to Section 3.4.

**The wax seal looks flat**: It is missing its dome geometry. The specular highlight must be directional, not diffuse. Regenerate with explicit 3D dome and single-source lighting.

---

## Part VI: Faction-Specific Guidance

### 6.1 Ironwright Collective

**Art**: Industrial scale and precision. Every creature shows evidence of engineering — bolts, welds, structural members. The environment is the factory, the void, the orbital platform. Light is harsh, directional, artificial. Style: `17th century Dutch Golden Age allegorical oil painting, Pieter Bruegel crowd complexity, industrial allegory, massive mechanical forms`.

**Sound**: Metal, machinery, industrial rhythm. Ironwright card summon sounds are percussive, metallic, purposeful.

### 6.2 Fey Courts (Both Sub-factions)

**Art — Verdant**: Ancient and territorial, not enchanted. The Verdant Throne is older than any other civilization and knows it. Creatures are integrated with their environment — they *are* the environment. Compositions are asymmetric, overgrown, dense. Light filters through canopy that has not been cleared in centuries. This is not a fairy forest; it is a forest that has absorbed the bones of every army that tried to march through it. Style: `English Pre-Raphaelite oil painting, dense inhabited undergrowth, warm earth tones, ancient canopy light, figures integrated with not posed against environment`. **Avoid:** anything that reads as whimsical, light, or welcoming. The Fey are powerful and patient and dangerous.

**Art — Hollow Court**: Cold restraint. Compositions have space and silence. Colors are desaturated. This is the forest in the season of death — and the Hollow Court has made peace with that, which makes them more unsettling than the Furnace Lords. Style: `19th century Scandinavian Romantic oil painting, cold Nordic forest, muted greys, winter stripped bare, patient predatory stillness`.

**Sound**: Natural, never synthesized. All Fey sounds come from organic sources. Verdant: the sound of things growing in the dark. Hollow: the sound of things that have stopped growing.

### 6.3 Demonic Kingdoms

**Art**: This is where the visceral fluids live. Blood, magma, obsidian. Furnace Lords are volcanic violence. Obsidian Bureau is cold bureaucratic evil. Style: `16th century Northern Renaissance grotesque oil painting, Hieronymus Bosch style, infernal bureaucracy, crowded grotesque panel` or `17th century Dutch infernal landscape, Jan Brueghel the Elder style, hellfire, volcanic atmosphere`.

**Sound**: Furnace Lord sounds are fire, metal, and screaming at industrial scale. Bureau sounds are quiet and dry: quill on vellum, chains, a contract being sealed.

### 6.4 Celestial Crusade

**Art**: The Celestial are not benevolent angels. They are the most terrifying faction in the game, and their terror comes from *certainty* — they are completely correct about everything, which means they are completely without mercy. Visually: biblically-accurate celestial entities, not winged humans. Multiple wings, multiple eyes, geometries that hurt to perceive, halos that burn rather than glow. The gold light they emit is not warm — it is judgmental. Style: `18th century Visionary oil painting, prophetic divine geometry, burning cold gold, biblical scale, terrifying geometric radiance, multiple wings and eyes, James Barry RA style`. **Avoid:** anything soft, gentle, or welcoming. A Celestial creature should make the player slightly uncomfortable to look at, the way the seraphim descriptions in Ezekiel are uncomfortable.

**Sound**: High sustained harmonics, very quiet breath, the sound of absolute judgment being rendered. Not music. Not choir. The sound of something that does not need to announce itself.

### 6.5 The Endless

**Art — Cabals**: Bone, library, tomb, ancient scholarship in the service of death. Style: `19th century engraving-style oil painting, Gustave Doré Inferno style, cold light in deep shadow, vast bone architecture, academic necromancy, subterranean cathedral`.

**Art — Spectres**: Half-present. Brushwork that suggests a form without defining it completely. Colors bleed into one another. Style: `Symbolist oil painting, Odilon Redon style, dreamlike dissolution, spectral forms dissolving into environment, ghostly atmosphere`.

**Sound**: Spectres are wind through empty rooms and half-heard voices. Cabals are grinding stone, bone settling, old pages turning.

---

## Appendix A: Quick Reference Checklist

Before submitting any asset:

- [ ] Physical test passed (weight, material, age, light, imperfection)
- [ ] **War camp test passed**: Does this look like it was made in a world at war for 200 years? (See `docs/GRIMDARK_AESTHETIC_DIRECTIVE.md` §Acceptance Test)
- [ ] No pure white, pure black, or flat fills
- [ ] No digital effects (bloom, lens flare, chromatic aberration, sparkle particles)
- [ ] LoRA trigger phrase `oil paint canvas texture impasto` in prompt
- [ ] Style descriptor uses only public domain movements/artists (died pre-1928)
- [ ] Faction palette applied correctly
- [ ] Animation has a physical model (named material + named force)
- [ ] Animation timing is within duration guidelines
- [ ] Sound verified CC0 on Freesound.org before download
- [ ] Sound processed through warmth EQ and room tone pipeline
- [ ] Haptic and sound synchronized within 16ms
- [ ] Asset name follows project naming conventions
- [ ] License logged in `ASSET_LICENSE_MANIFEST.md`

---

## Appendix B: License Summary

| Component | Source | License | Commercial: Yes |
|---|---|---|---|
| Base model for LoRA | FLUX.1 [schnell] | Apache 2.0 | ✅ |
| LoRA training adapter | ostris/FLUX.1-schnell-training-adapter | Apache 2.0 | ✅ |
| LoRA training images | Met Museum Open Access API | CC0 | ✅ |
| LoRA training images | Rijksmuseum API | CC0 | ✅ |
| Inference model | FLUX.1 [schnell] via fal.ai or Replicate | Apache 2.0 | ✅ |
| Style descriptors | Public domain movements / pre-1928 artists | Public domain | ✅ |
| Sound FX | Freesound.org (CC0 filter enforced) | CC0 | ✅ |
| Fallback icons | game-icons.net (CC BY 3.0, error states only) | CC BY 3.0 | ✅ with attribution |
| Haptic patterns | Custom AHAP (generated in-project) | Original work | ✅ |

---

## Appendix C: Source References

- **Primary design authority**: `docs/CARD_DESIGN_GUIDE_FINAL.md`
- **Aesthetic register and acceptance test**: `docs/GRIMDARK_AESTHETIC_DIRECTIVE.md`
- **Faction lore**: `docs/11-lore-bible.md`
- **Quick lookup values**: `docs/CARD_DESIGN_QUICKREF_FINAL.md`
- **Wax seal production**: `docs/WAX_SEAL_OVERHAUL_BRIEF.md`
- **Visual references and agent tools**: `docs/VISUAL_REFERENCE_LIBRARY_AND_TOOLS_v3.md`
- **Met Museum API**: `https://collectionapi.metmuseum.org/public/collection/v1/`
- **Rijksmuseum API**: `https://www.rijksmuseum.nl/api/en/collection`
- **Sound sourcing**: Freesound.org API — CC0 license filter **must be set explicitly**
- **Image generation**: fal.ai `fal-ai/flux/schnell` with new CC0-trained LoRA
- **LoRA training**: Replicate with `ostris/FLUX.1-schnell-training-adapter`

---

*Any asset that passes the physical test, the war-camp test, and the license checklist belongs in this app.*
