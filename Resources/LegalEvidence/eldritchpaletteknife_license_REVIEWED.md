# EldritchPaletteKnife License Review
Date: 2026-02-21
Model: civitai.com/models/336656
Model name: Eldritch Palette Knife Painting (oil painting style)
Author: eldritchadam
Base model: SDXL 1.0
Published: Mar 5, 2024

## License Permissions (as displayed on model page, reviewed by owner 2026-02-21)

✅ Use the model without crediting the creator
✅ Sell images they generate
❌ Run on services that generate for money
✅ Run on Civitai
❌ Share merges using this model
❌ Sell this model or merges using this model
✅ Have different permissions when sharing merges

## Commercial Gate Result

FAILED.

"Run on services that generate for money" is NOT permitted.
Replicate charges per generation and falls into this category.

The custom LoRA (chscrt-sdxl-lora.safetensors) was trained on images generated
using EldritchPaletteKnife @ 0.9 strength — making it a derived work subject to
the same license restrictions.

## Consequence

The Replicate + LoRA pipeline specified in docs/CARD_DESIGN_GUIDE.md Section 3.2
cannot be used with the existing chscrt-sdxl-lora.safetensors.

See Logs/DEPENDENCY_DECISIONS.md — Decision 3 for resolution options.

## Evidence

Owner-provided screenshot from civitai.com/models/336656 reviewed 2026-02-21.
Screenshot shows license panel and model detail page confirming above permissions.
Physical screenshot available in owner's possession.
