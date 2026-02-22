# Asset License Manifest
Last updated: 2026-02-21

All assets used in Chaos Creatures must be listed here with license and commercial use status.
Commercial use = permitted for sale in the App Store without royalty payments.

## Fonts

| Asset | Source | License | Commercial Use |
|-------|--------|---------|----------------|
| Cinzel-Regular.ttf | Google Fonts / google/fonts GitHub | OFL 1.1 | Yes |
| Cinzel-Bold.ttf | Google Fonts / google/fonts GitHub | OFL 1.1 | Yes |
| EBGaramond-Regular.ttf | Google Fonts / google/fonts GitHub | OFL 1.1 | Yes |
| EBGaramond-Italic.ttf | Google Fonts / google/fonts GitHub | OFL 1.1 | Yes |
| EBGaramond-SemiBold.ttf | Google Fonts / google/fonts GitHub | OFL 1.1 | Yes |
| Oswald-Bold.ttf | Google Fonts / google/fonts GitHub | OFL 1.1 | Yes |

Note: Cinzel, EBGaramond, and Oswald were downloaded as variable-weight TTFs
(single file covers all weights). The PostScript name availability at runtime
depends on iOS variable font registration — see CardFont.swift debugVerifyRequiredFonts().

## AI-Generated Card Art (Existing — Placeholder Status)
| Asset | Generation Method | Commercial Use | Status |
|-------|-----------------|----------------|--------|
| 35 base card images (scripts/output/) | fal-ai/fast-sdxl + EldritchPaletteKnife via fal.ai (not Replicate) | Yes — "Sell images they generate" permitted | PLACEHOLDER — replace before launch |

## LoRA Weights
| Asset | Status | License |
|-------|--------|---------|
| chscrt-sdxl-lora.safetensors | RETIRED — derived from EldritchPaletteKnife, cannot use on Replicate | N/A |
| chscrt-sdxl-lora-v2.safetensors | PENDING — to be trained on public domain + SDXL base | Apache 2.0 (SDXL base) + Public Domain |

## Training Data (for new LoRA v2)
| Source | Artists | License | Commercial Use |
|--------|---------|---------|----------------|
| Wikimedia Commons | Gustave Dore, Arthur Rackham, Edmund Dulac, Hieronymus Bosch, William Blake, Francisco Goya, Giovanni Battista Piranesi, N.C. Wyeth, John Martin | Public Domain (pre-1953, copyright expired) | Yes |
| MET Open Access API | Same artists | CC0 | Yes |
| Rijksmuseum API | Same artists | Public Domain | Yes |
| SDXL Base 1.0 outputs | N/A (AI-generated) | Apache 2.0 | Yes |

## Audio (Pending — Phase 6)
| Asset | Source | License | Commercial Use |
|-------|--------|---------|----------------|
| [To be populated in Phase 6] | freesound.org or itch.io | CC0 or Commercial | TBD |
| seal_demonic_legendary.png | fal.ai FLUX.1 Dev output — AI generated | fal.ai commercial license | 2026-02-22 | Yes | No | — |
| seal_demonic_common.png | fal.ai FLUX.1 Dev output — AI generated | fal.ai commercial license | 2026-02-22 | Yes | No | — |
| seal_demonic_uncommon.png | fal.ai FLUX.1 Dev output — AI generated | fal.ai commercial license | 2026-02-22 | Yes | No | — |
| seal_demonic_rare.png | fal.ai FLUX.1 Dev output — AI generated | fal.ai commercial license | 2026-02-22 | Yes | No | — |
| seal_demonic_epic.png | fal.ai FLUX.1 Dev output — AI generated | fal.ai commercial license | 2026-02-22 | Yes | No | — |
| seal_fey_common.png | fal.ai FLUX.1 Dev output — AI generated | fal.ai commercial license | 2026-02-22 | Yes | No | — |
| seal_fey_uncommon.png | fal.ai FLUX.1 Dev output — AI generated | fal.ai commercial license | 2026-02-22 | Yes | No | — |
| seal_fey_rare.png | fal.ai FLUX.1 Dev output — AI generated | fal.ai commercial license | 2026-02-22 | Yes | No | — |
| seal_fey_epic.png | fal.ai FLUX.1 Dev output — AI generated | fal.ai commercial license | 2026-02-22 | Yes | No | — |
| seal_fey_legendary.png | fal.ai FLUX.1 Dev output — AI generated | fal.ai commercial license | 2026-02-22 | Yes | No | — |
| seal_ironwright_common.png | fal.ai FLUX.1 Dev output — AI generated | fal.ai commercial license | 2026-02-22 | Yes | No | — |
| seal_ironwright_uncommon.png | fal.ai FLUX.1 Dev output — AI generated | fal.ai commercial license | 2026-02-22 | Yes | No | — |
| seal_ironwright_rare.png | fal.ai FLUX.1 Dev output — AI generated | fal.ai commercial license | 2026-02-22 | Yes | No | — |
| seal_ironwright_epic.png | fal.ai FLUX.1 Dev output — AI generated | fal.ai commercial license | 2026-02-22 | Yes | No | — |
| seal_ironwright_legendary.png | fal.ai FLUX.1 Dev output — AI generated | fal.ai commercial license | 2026-02-22 | Yes | No | — |
| seal_celestial_common.png | fal.ai FLUX.1 Dev output — AI generated | fal.ai commercial license | 2026-02-22 | Yes | No | — |
| seal_celestial_uncommon.png | fal.ai FLUX.1 Dev output — AI generated | fal.ai commercial license | 2026-02-22 | Yes | No | — |
| seal_celestial_rare.png | fal.ai FLUX.1 Dev output — AI generated | fal.ai commercial license | 2026-02-22 | Yes | No | — |
| seal_celestial_epic.png | fal.ai FLUX.1 Dev output — AI generated | fal.ai commercial license | 2026-02-22 | Yes | No | — |
| seal_celestial_legendary.png | fal.ai FLUX.1 Dev output — AI generated | fal.ai commercial license | 2026-02-22 | Yes | No | — |
| seal_endless_common.png | fal.ai FLUX.1 Dev output — AI generated | fal.ai commercial license | 2026-02-22 | Yes | No | — |
| seal_endless_uncommon.png | fal.ai FLUX.1 Dev output — AI generated | fal.ai commercial license | 2026-02-22 | Yes | No | — |
| seal_endless_rare.png | fal.ai FLUX.1 Dev output — AI generated | fal.ai commercial license | 2026-02-22 | Yes | No | — |
| seal_endless_epic.png | fal.ai FLUX.1 Dev output — AI generated | fal.ai commercial license | 2026-02-22 | Yes | No | — |
| seal_endless_legendary.png | fal.ai FLUX.1 Dev output — AI generated | fal.ai commercial license | 2026-02-22 | Yes | No | — |
