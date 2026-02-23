# Chaos Creatures — Critique Scoring Guide
## Calibration reference for Section 12.3 structured critiques

**Purpose:** The Section 12.3 critique template requires scoring 8 axes on a 1–5 scale before a component can be marked complete (threshold: 4+ on all axes). Without calibration, scores are arbitrary and drift across sessions. This document defines what each score means on each axis, in terms specific to this project's shaders, materials, and failure modes.

**How to use:** Before scoring any axis, read the descriptions for scores 3, 4, and 5 on that axis. Score 3 is the most important calibration point — it describes output that *looks plausible* but has a specific identifiable problem. Most first iterations land at 3. Score 4 is the minimum acceptable. Score 5 is rare and should only be awarded when the output genuinely matches or exceeds the reference painting quality.

**Cross-reference:** The failure modes in `docs/VISUAL_REFERENCE_LIBRARY_AND_TOOLS_v3.md` §1.5 map directly to low scores on specific axes. FAIL-1 → Axis 1 score 1–2. FAIL-2 → Axis 2 score 1–2. FAIL-3 → Axis 1 score 2–3 (for the wax seal component). Knowing the failure mode tells you which axis to target in the next iteration.

---

## Axis 1 — Material Believability

**The question:** Does this element read as the physical material it is supposed to be — parchment, oil paint on canvas, wax, aged gold, worn cardstock?

**What this axis covers:** ParchmentShader output, OilPaintShader output, WaxSealView rendering, WarmFoilShader gold frames. Any element that is supposed to be a physical material rather than a flat color or digital element.

---

**Score 1 — Wrong material entirely**

The element reads as the wrong material or as no material at all. Examples:
- The card body looks like flat white or grey paper, not warm scraped hide
- The artwork looks like a vector illustration or 3D render, not oil paint on canvas
- The wax seal looks like a colored circle with text in it
- The gold frame looks like a yellow stroke or a CSS gradient
- The parchment texture is either invisible (flat cream fill) or so aggressive it reads as noise

The ParchmentShader or OilPaintShader either hasn't been applied, compiled with errors and fell back to the flat fill, or the texture assets aren't loading.

---

**Score 2 — Material suggested but unconvincing**

The right material is being attempted but doesn't hold up. Examples:
- Parchment: the warm cream color is there but the fiber grain texture is either tiling visibly (seam lines) or applying at the wrong scale — grain is too coarse (reads as sandpaper) or too fine (invisible at card scale)
- Oil paint: brushwork texture is present but mechanical — all strokes the same direction and weight, like a Photoshop filter rather than actual painting. Colors may still be too saturated (FAIL-1 territory)
- Wax seal: dome shape is present but specular is either absent, white instead of warm-tinted, or ambient across the whole surface rather than a single directional catch
- Gold frame: color and roughness are approximately right but the frame glows uniformly — no directional variation, reads as a backlit UI element

---

**Score 3 — Material reads correctly at a glance, breaks on inspection**

This is the most common first-iteration result. The material is convincing at thumbnail size or in a screenshot but reveals problems when examined:
- Parchment: warm tone and grain are working but the edge vignette is either too strong (edges go to near-black instead of `parchment-mid`) or too weak (card looks like a uniformly lit digital rectangle with no handling evidence). The `smoothstep(0.65, 1.0, edgeDist) * 0.45` darkening should produce visible but subtle edge compression — not a hard vignette
- Oil paint: impasto texture is present and brushwork direction varies, but the warm shadow behavior isn't working — shadows are neutral grey rather than having the warm amber ambient that the `warmReflect = float3(0.15, 0.08, 0.02)` mixing should produce. Highlights may be white rather than the warm `float3(1.0, 0.95, 0.80)` varnish specular
- Wax seal: dome and single specular are both present but the intaglio relief on the symbol is missing — the symbol reads as printed on the wax surface rather than pressed into it. The recessed areas of the symbol should be darker than the wax surface
- Gold frame: directional variation is present but too subtle — the frame reads as uniformly bright aged gold rather than having near-black in the deepest recesses with a single warm catch on raised elements

---

**Score 4 — Material is convincing and holds up to inspection**

The material reads correctly at all examination distances and the specific physical behaviors are working:
- Parchment: warm cream base with visible fiber grain at card scale (grain is perceptible but not distracting), edge vignette darkens naturally toward `parchment-mid` at corners and edges, the overall impression is scraped hide not bleached paper
- Oil paint: impasto texture creates visible but not aggressive surface relief in lit areas, shadows have the warm amber undertone from the shader's `warmReflect` mixing, varnish specular is warm-tinted and falls consistently from the same upper-left direction, canvas grain is faintly visible in darker areas where paint is thin
- Wax seal: dome is clearly three-dimensional, single offset specular highlight is warm-tinted and at upper-left (matching the card's dominant light direction), symbol relief is intaglio (recessed areas are shadowed, raised wax rim catches light), edge drip texture is present
- Gold frame: clear directional variation with near-black in recesses and a single warm catch on raised elements, overall reads as aged looted gold not shiny chrome or uniform yellow

---

**Score 5 — Indistinguishable from the reference material at card display scale**

Rare. Award only when the material output would not look out of place alongside the actual reference paintings in the Visual Reference Library. Specific benchmarks:
- Parchment: the fiber structure has the micro-variation of real prepared hide — the grain is irregular, not tiled. Edge darkening is physically motivated (heavier at corners than midpoints, as if the card has been gripped many times)
- Oil paint: the impasto/glaze relationship is working — highlights are physically thick, shadows are thin and warm, the brushwork has directionality that follows the subject's form. Compare directly against OIL-1 (Anatomy Lesson) at card scale
- Wax seal: looks like a photograph of a real wax seal. The dome catches light realistically, the symbol relief creates genuine depth, the drip edges at the rim have the irregular pooling of real wax
- Gold frame: the tonal variation is as extreme as reference COMP-3 — very bright on raised elements, very dark in recesses, with the overall read of looted Baroque framing rather than digital decoration

---

## Axis 2 — Color Temperature

**The question:** Are the warm tones correct? Is everything sepia-shifted as specified? Does the dark mode read as candlelit rather than inverted?

**What this axis covers:** All color values — card body base (`parchment-light`: P3 0.953, 0.898, 0.780), typography (`ink-black`: P3 0.098, 0.071, 0.027), the warm shadow behavior in OilPaintShader, the dark mode palette (candlelit, not inverted).

---

**Score 1 — Cold or neutral throughout**

Colors have no warmth. The card reads as a grey-white digital product. Blue-cast shadows in artwork, neutral grey for what should be warm parchment, white for what should be warm cream. The `verify_asset.py --warm-tone-check` script would fail. This is FAIL-2 in its most severe form.

---

**Score 2 — Warm in some areas, cold in others**

The base parchment color may be approximately right but artwork shadows are cold (grey or blue-grey rather than warm amber-brown), OR the parchment is too yellow/saturated (reads as old newspaper rather than scraped hide), OR dark mode is just the light mode with brightness reduced — cold brown instead of warm candlelit darkness.

---

**Score 3 — Warm overall but one area is off**

The parchment base and typography are the right temperature but a specific area breaks:
- Artwork: shadows hit neutral grey before the warm amber mixing kicks in — happens when `parchmentAge` is 0 and `warmReflect` mixing isn't being applied at low luminance values
- Dark mode: the shift to `parchment-dark-mode` is happening but it's too cool — reads as grey-brown rather than the deep warm brown of aged leather by candlelight. The dark mode `warm * float3(0.25, 0.18, 0.10)` multiplication should produce a distinctly warm dark, not a neutral dark
- Rarity colors: the rarity color bar is the correct hue but it reads as a flat digital color rather than a warm dyed-pigment color — this happens when rarity colors are applied without the parchment warm shift

---

**Score 4 — All areas warm, temperatures are consistent across components**

The card reads as a single warm-toned object rather than a collection of independently colored elements. Specific checks:
- `parchment-light` base is the warm cream specified (P3 0.953, 0.898, 0.780) — visibly warmer than pure white or standard off-white
- `ink-black` typography is warm near-black (P3 0.098, 0.071, 0.027) — reads as iron-particle ink, not printer black
- Artwork shadows have the warm amber ambient from `warmReflect` mixing — no neutral or cool shadow areas except in Hollow Court faction (which is intentionally cold)
- Dark mode: the card reads as candlelit — the deep warm brown body against which gold frames and warm cream typography glow. A user switching between light and dark mode should feel like going from daylight to candlelight, not from one color scheme to another

---

**Score 5 — Temperature relationships match the reference paintings**

The warm-to-cool ratios in the artwork match what is visible in OIL-1 through OIL-4 — specifically, the shadow-to-light temperature relationship: darks have the warm amber ambient that Rembrandt used in The Night Watch backgrounds, while highlights shift toward the cooler warm-white of direct illumination. The parchment and ink temperatures read as a unified document, not two separately designed elements placed together.

---

## Axis 3 — Texture Grain

**The question:** Is physical surface texture visible and appropriate — present enough to feel real, absent enough to not distract from the content?

**What this axis covers:** Parchment fiber grain (ParchmentShader `fiberNormal` texture), canvas tooth (card backs, battlefield backgrounds), oil paint surface from OilPaintShader `brushNormal`, the micro-roughness at typography letterform edges (InkSpreadKernel or manual letterpress implementation).

---

**Score 1 — No grain; everything is smooth and digital**

Card body is a flat fill. Artwork has no surface quality. Text sits on top of the parchment like a label on a bottle. The card looks like a UI mockup, not a physical object.

---

**Score 2 — Grain present but wrong scale or wrong character**

- Parchment grain is tiling visibly — you can see the repeat seam of the `fiberNormal` texture. This happens when the `cardSize / 256.0` UV scaling produces a tile frequency that's too low for the display resolution, making individual tiles visible
- Canvas grain is applied at too high contrast — reads as woven fabric or burlap, not the subtle tooth of a proper canvas ground
- Oil paint `brushNormal` is tiling at exactly 4x as specified but the brush normal texture itself has too much relief — the surface reads as heavily textured impasto everywhere rather than thick where lit, thin where shadowed

---

**Score 3 — Grain is working but too uniform**

The grain is present at the right scale and character but it's applied uniformly across the surface. Real parchment grain varies — finer where it was stretched tighter, more pronounced at the edges. Real oil paint grain is selective — thick (impasto) in lit areas, nearly smooth (glazed) in shadow. At score 3, the grain is doing its job aesthetically but it's mechanical rather than physically motivated.

---

**Score 4 — Grain is present, appropriate, and physically motivated**

- Parchment: fiber grain is visible at normal viewing distance but not distracting when reading text. Grain density and character vary slightly across the card surface — not a perfectly uniform repeat
- Oil paint: canvas grain is visible in the darker, thinner-paint areas of the artwork; in bright impasto highlights, the grain disappears as thick paint would fill and cover the weave. This is the `brushNormal` tiling frequency behavior described in VISUAL_REFERENCE_LIBRARY §COMP-4 — `~4x in shadow areas, ~1.5x in highlights`
- Card text zones: the parchment grain reads through lightly in the text box and name bar, giving the impression that the ink is in the paper rather than printed on it

---

**Score 5 — Grain matches the micro-surface behavior of the reference materials**

Compare against COMP-4 (Jan Brueghel the Elder background areas) for oil paint grain behavior: canvas tooth visible in thin-paint areas, invisible under thick impasto. Compare against COMP-1 (Book of Kells) for parchment grain: warm fiber texture that gives the surface character without competing with the content.

---

## Axis 4 — Typography Letterpress

**The question:** Does the text read as iron-particle ink pressed into parchment fiber, or does it read as digital text printed on a surface?

**What this axis covers:** The letterpress effect implementation (Section 1.5 of the design guide: shadow offset x=0, y=0.5pt, blur 0.5pt, `parchment-dark` at 60% opacity), correct font loading (Cinzel for headings/names, EB Garamond for body, Oswald for stats), font sizes per the specification table, the overall ink-into-paper character of all text.

---

**Score 1 — System font fallback or no letterpress effect**

The most common critical failure. If Cinzel, EB Garamond, or Oswald aren't registered in Info.plist under `UIAppFonts`, iOS silently falls back to San Francisco (for Cinzel/Oswald) or Times New Roman (for EB Garamond). The card immediately reads as a generic digital product. There is no letterpress effect — text is floating on the surface with a standard system drop shadow or no shadow at all.

Check for this first: `grep -r "UIAppFonts" *.plist` — if the fonts aren't listed, this is why.

---

**Score 2 — Correct fonts loaded, no letterpress effect or wrong effect**

Cinzel, EB Garamond, and Oswald are rendering. The type immediately reads better — these are the right fonts for the aesthetic. But the letterpress effect is missing or implemented as a standard iOS drop shadow (blur radius too large, shadow goes in all directions rather than just down 0.5pt). Text appears to float above the parchment surface rather than being embedded in it.

---

**Score 3 — Letterpress effect present but parameters wrong**

The shadow offset of (0, +0.5pt) and 0.5pt blur are there but one parameter is off:
- Shadow color is `parchment-dark` at full opacity rather than 60% — effect is too heavy, text looks embossed rather than pressed
- Shadow color is the wrong warm tone — using black instead of `parchment-dark` produces a cold shadow that undermines the warm-ink-on-parchment read
- The effect is implemented correctly at some font sizes but not others — common at very small sizes (collector number at 7pt, set code at 7pt) where the shadow gets lost and text appears to float
- Font sizes are off spec — ability text at 12pt instead of 11pt, card name at 14pt instead of 13pt. The size table in §1.5 is exact and must be followed

---

**Score 4 — Letterpress effect working, all fonts at spec**

Text reads as ink in paper. Specific checks:
- Cinzel-Bold card name at 13pt with letterpress shadow — reads as inscribed rather than printed
- EBGaramond-Regular ability text at 11pt with 1.3× line height — reads as handwritten manuscript body text, not a UI label
- EBGaramond-Italic flavor text at 10pt — slightly different character from body text, appropriate for flavor distinction
- Oswald-Bold ATK/HP at 13pt — the condensed weight reads as a carved or stamped number, not a digital counter
- At all sizes, the 0.5pt shadow creates the impression of ink slightly compressing the parchment fiber beneath it

---

**Score 5 — Typography is indistinguishable from hand-lettered manuscript text at card scale**

The letterpress effect at score 4 is working correctly. Score 5 requires that the overall text impression matches COMP-1 (Book of Kells) — specifically, that the ink characters have micro-variation at their edges as if the ink has flowed slightly into the fiber. This is difficult to achieve purely through the standard letterpress shadow; it may require InkSpreadKernel.metal for the card name and ability text. Award score 5 only when individual letterforms show the micro-roughness at their edges that distinguishes letterpress from digital printing.

---

## Axis 5 — Lighting Consistency

**The question:** Are all elements on the card lit from the same source, in the same direction, with the same quality of light?

**What this axis covers:** The dominant light direction (upper-left, as specified throughout the guide), consistency between the parchment surface lighting, the artwork lighting, the wax seal specular position, the gold frame directional catch, and the letterpress shadow direction.

---

**Score 1 — No consistent light source**

Different elements appear to be lit from different directions or not lit at all. The artwork has a bottom-left light source while the wax seal specular is at top-right. The parchment vignette darkens uniformly (no directional component). The gold frame catches from an arbitrary direction. The letterpress shadow goes downward but other shadows go left. The card looks like a collage of independently designed elements.

---

**Score 2 — Light direction is approximately consistent but not carefully set**

Most elements are lit from somewhere in the upper-left quadrant but the exact direction varies enough to be noticeable. The most common manifestation: the artwork was generated with a specific light source that happens to be upper-left, but the wax seal was rendered with its specular at top-center, and the letterpress shadow is straight down (y offset only, no x offset). Nothing looks wrong individually, but together they don't cohere as a single physical object under a single light source.

---

**Score 3 — Consistent direction but wrong quality of light**

All elements are lit from upper-left but the character of the light doesn't match across components:
- Artwork has the warm `float3(1.0, 0.95, 0.80)` varnish specular from OilPaintShader
- But the wax seal specular is white or cool-tinted, making it feel lit by a different (colder) source
- Or the parchment vignette is a pure circular gradient rather than physically motivated edge darkening — the card looks like it's in a spotlight rather than on a rough table under natural light
- Or the artwork has beautiful upper-left directional lighting but the card frame and text elements have no directional lighting at all — they read as flat while the artwork reads as three-dimensional

---

**Score 4 — Consistent light source and quality across all elements**

Every element responds to the same upper-left warm light:
- Parchment edge vignette: heavier at bottom-right (shadow side), lighter at top-left (lit side), consistent with the described light direction
- Artwork: main light source at upper-left, warm varnish specular at upper-left
- Wax seal: single specular highlight at upper-left, warm-tinted (matching OilPaintShader specular color)
- Gold frame: directional catch at upper-left on raised relief elements, near-black at lower-right in recesses
- Letterpress shadows: offset slightly down and to the right (y=+0.5pt, x=+0.5pt would be more consistent than pure y offset for upper-left lighting — consider updating the §1.5 shadow parameters if this matters)
- The card reads as a single physical object sitting on a surface under consistent ambient + directional light

---

**Score 5 — Lighting creates genuine three-dimensionality**

Score 4 describes consistency. Score 5 requires that the consistent lighting actually creates the impression of a physical object with depth — the parchment surface has the slight translucency of scraped hide with light passing through thin areas, the wax seal dome has a convincing three-dimensional presence, and the artwork figures emerge from their environments rather than being lit differently from their backgrounds. Compare against OIL-2 (The Night Watch): the entire painting is under the same light source and this unified lighting is what creates the impression that the figures and background inhabit the same physical space.

---

## Axis 6 — Tactile Impression

**The question:** Does the card make you want to pick it up? Does it feel like it has weight, texture, and physical presence?

**What this axis covers:** The combined effect of all the above axes, plus the animation feel (does the card move like it has mass?), the sound design (does the tap/place/drag sound like cardstock?), and the overall impression of physical reality. This is a synthesis axis — it can't score higher than the lowest of the contributing axes, but it also captures gestalt qualities that no individual axis measures.

---

**Score 1 — Feels like a digital product**

The card could be a screenshot of any mobile game. There is no physical presence. It feels weightless, frictionless, and screen-native. You would not reach for it.

---

**Score 2 — Physical qualities are present but add up to less than their sum**

Individual elements are working (some texture, some correct colors, some animation weight) but they don't cohere into a single physical object. The texture is on the parchment but not the text. The animation has some weight but the sounds are wrong. The visual elements are warm but the interactions feel gamified. The physical qualities exist as a list of features rather than as a unified experience.

---

**Score 3 — Physical presence in isolation, not in context**

The card feels physical when viewed as a static image. But when animated (pick up, put down, drag, tap), the physical illusion is broken:
- Card pickup animation doesn't have the slight resistance and flex of stiff cardstock lifting from a surface
- Card placement doesn't have the heavy settle of a physical object coming to rest
- Card drag feels frictionless — the card glides rather than slides
- Sound design: the tap sound is too bright and plastic (FAIL-6)
At score 3, the visual is working but the interactive dimension hasn't caught up.

---

**Score 4 — Physical presence holds across static and interactive states**

The card feels like a physical object to look at and to interact with:
- Static: warm parchment surface with fiber texture, ink that sits in the paper, wax seal with physical dome, aged gold frame with earned tonal variation
- Pickup (`default` → `focused`): 0.18s easeOut lift with shadow expansion — the card lifts off the surface slightly, creating a separation shadow
- Placement (`focused` → `default`): spring(0.4, 0.7) settle — not a bounce, a heavy settle, like a thick card landing on felt
- Drag: the `PhysicalSpringDrag` implementation (Section 6.7) creates appropriate friction — the card doesn't snap to the finger, it follows with slight resistance
- Sounds: cardstock weight and body (200–600Hz range), not plastic or paper

---

**Score 5 — The physical illusion is complete**

A user unfamiliar with the project who sees and handles the app remarks on the physicality without being prompted. The card feels like an artifact from another world. This is the acceptance test described in the Grimdark Directive: you imagine picking this up in a war camp and it doesn't break the illusion.

---

## Axis 7 — iPad vs iPhone

**The question:** Are there layout differences or visual degradations on iPad that weren't visible on iPhone?

**What this axis covers:** Layout scaling behavior (all zones are proportional, not fixed-point), font size scaling, texture grain appropriateness at larger physical display sizes, shader uniform values that may need iPad-specific adjustment.

---

**Score 1 — Layout breaks on iPad**

Zones overflow, text truncates when it shouldn't, zones use fixed-point values instead of proportional (the card is larger on iPad, so zones sized in absolute points rather than as card-height percentages will be wrong). The card looks like an iPhone card letterboxed into a larger screen.

---

**Score 2 — Layout holds but textures or effects look wrong at iPad scale**

The proportional layout is working — zones scale correctly. But shader effects that looked right on iPhone now read differently on iPad:
- Parchment grain tiles more visibly on iPad because the card is physically larger (more tile repeats visible at the same tiling frequency)
- Letterpress shadow at 0.5pt is invisible on iPad (below the effective resolution threshold for the shadow to have visual impact at card scale)
- Wax seal appears too small relative to the larger card — this is correct behavior per spec (the seal is 34pt at all sizes), but visually it may need review

---

**Score 3 — Layout and effects are functionally correct but not optimized for iPad**

Everything works on iPad and nothing looks broken, but the card doesn't feel as premium at iPad scale as it does on iPhone. The grain may be slightly too fine, the letterpress effect may be slightly too subtle, or the card proportions may feel slightly off against the iPad's display characteristics. These are perceptual rather than technical problems and require judgment.

---

**Score 4 — Card looks as good on iPad as on iPhone**

The proportional layout is pixel-perfect on both devices. Shader uniforms are either device-independent (as they should be, given proportional design) or have appropriate conditional adjustments for iPad's larger physical display size. Text is legible and well-spaced on both. Grain and texture effects read at the same quality at both scale points.

---

**Score 5 — iPad version takes advantage of the larger canvas**

The card at iPad scale has additional visual presence — the larger physical surface makes the texture, grain, and material qualities more apparent and more impressive rather than just being a scaled version of the iPhone card. This isn't a requirement (4 is the gate), but it's what score 5 looks like.

---

## Axis 8 — Dark Mode

**The question:** Does the dark mode card read as a candlelit manuscript, or does it read as an inverted/darkened version of the light mode card?

**What this axis covers:** The `parchment-dark-mode` card body (deep warm brown), `ink-dark-mode` typography (warm cream on dark background), the dark mode ParchmentShader path (`warm * float3(0.25, 0.18, 0.10)` multiplication), rarity colors in dark mode (slightly warmer and more saturated per §1.3), the OilPaintShader behavior when `colorScheme > 0.5`.

---

**Score 1 — Dark mode is just brightness-reduced light mode**

The card goes dark but stays on the same warm-to-neutral spectrum — it looks like the light mode card photographed in dim light. No character change, no candlelit quality. Often happens when `@Environment(\.colorScheme)` conditionals are scattered throughout the code (warned against in §1.3) and the switch isn't being applied consistently.

---

**Score 2 — Dark mode palette is applied but wrong**

The `CardTheme` switch is happening but the dark mode colors aren't the specified values:
- Card body is too cold (grey-brown instead of warm deep brown)
- Typography is white instead of warm cream `ink-dark-mode`
- Gold frames in dark mode may look washed out rather than glowing warmly against the dark background
- The dark mode parchment shader path is applying but the `float3(0.25, 0.18, 0.10)` multiplication is producing the wrong deep tone (too light, too grey, or with too much color noise)

---

**Score 3 — Dark mode colors are right but light mode feels are wrong**

The palette is correct for dark mode — deep warm brown body, warm cream text, warm gold frames. But the physical material qualities don't carry over:
- The parchment grain is too subtle in dark mode (the dark ground color is closer to the grain texture color, reducing contrast)
- The OilPaintShader dark mode path hasn't been calibrated — artwork looks flat or over-dark in the dark background context
- The letterpress shadow direction (y=+0.5pt downward) creates a slightly different visual effect on the dark background — the shadow reads as an emboss rather than a press into the surface

---

**Score 4 — Dark mode reads as candlelit manuscript**

A user switching to dark mode feels like the card moved from daylight to candlelight — not from "light mode" to "dark mode." Specific qualities:
- Card body: the deep warm brown `parchment-dark-mode` reads as aged leather by firelight, not as a dark grey UI background
- Typography: warm cream `ink-dark-mode` reads as lettering on dark vellum — the contrast is softer than light mode (not white-on-black crisp)
- Gold frames: the `aged-gold` color glows against the dark body in a way it doesn't on the light parchment — this is physically correct (gold is more visible against a dark ground) and should be embraced
- Artwork: the OilPaintShader dark mode path should produce deeper shadows with slightly warmer ambient — the paintings feel more Rembrandt-esque (candlelit from the side) in dark mode than in light mode

---

**Score 5 — Dark mode is a meaningfully different and equally premium experience**

A user who only ever uses dark mode experiences the app as a candlelit-manuscript aesthetic from the ground up, not as a paper aesthetic adapted for dark conditions. The color relationships, contrast ratios, and material qualities are as deliberate and refined in dark mode as they are in light mode. The card feels like two different printing editions of the same physical artifact — parchment in daylight vs. vellum by candlelight.

---

## Quick Reference: Score Meanings

| Score | Meaning | Typical cause |
|-------|---------|---------------|
| 1 | Completely wrong — fundamental failure | Shader not applied, font not loaded, effect not implemented |
| 2 | Attempted but unconvincing | Wrong parameters, wrong texture scale, wrong implementation approach |
| 3 | Works at a glance, breaks on inspection | One specific parameter or behavior is off; FAIL-1 through FAIL-7 typically land here |
| 4 | **Minimum acceptable.** Correct and consistent | Implementation matches spec; physical qualities are working as designed |
| 5 | Matches or exceeds reference quality | Rare; requires comparison against reference paintings and judgment that the output is genuinely at that level |

**Scoring discipline:**
- Score the component as it is, not as you intend it to be. If a parameter is wrong, score the current state.
- A score of 3 is not a failure — it is information. It tells you exactly which axis to address in the next iteration.
- Never give a score of 4 to something you're unsure about. Score 3 + specific observation is more useful than score 4 + vague reassurance.
- Score 5 requires explicit justification against a named reference: "Score 5 — matches OIL-1 Anatomy Lesson impasto behavior at card scale."

---

## Scoring the War Camp Test (Axis 9)

Axis 9 is binary (YES/NO), not 1–5. It is a synthesis check that runs after the 8 scored axes. It is not a replacement for the scored axes — it's a final gestalt check that catches cases where all 8 axes score 4 but the overall result still reads as "premium digital collectible" rather than "field document from a world at war."

**Return YES when:**
- The card reads as an artifact that has existed in a physical world — it has weight, history, and evidence of use
- The faction-specific material register is present (Demonic cards have the blood-ink quality; Fey cards have the organic-hide quality; Ironwright cards have the industrial-surface quality)
- The creature or spell subject is *doing something*, not posing. It exists in an environment that existed before it arrived
- You would not be surprised to find this card in a chest at a field camp

**Return NO when:**
- Any of the FAIL-7 "Too Pretty" tells are present (posed subject, designed environment, harmonious colors)
- The card looks like it belongs in a premium collectible card game rather than a field document
- The faction material evidence is absent — it could be from any faction
- The card looks like it was made to impress rather than made to be used

**When NO: identify one specific element, not a general feeling.** "The creature is posing" → fix the artwork prompt subject. "The environment looks designed" → fix the background description. "The colors are too balanced" → add specific weathering, wear, or visual evidence of the world. One element per iteration.

---

*Read alongside `docs/VISUAL_REFERENCE_LIBRARY_AND_TOOLS_v3.md` §1.5 (Failure Gallery) for the fix procedure for each failure mode.*
