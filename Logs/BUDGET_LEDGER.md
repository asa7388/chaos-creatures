# Asset Generation Budget Ledger
Total budget: $10.00
Date started: 2026-02-21

## Entries

| Date | Service | Purpose | Cost | Remaining |
|------|---------|---------|------|-----------|
| 2026-02-21 | — | Budget initialized | $0.00 | $10.00 |

## Budget Rules
- Log every API call that costs money before making it
- Do not proceed if remaining budget would go negative
- Replicate: ~$0.0046/image (SDXL, ~15s @ A100)
- fal.ai FLUX.1 Dev: ~$0.025/image
- OpenAI GPT-4o Mini: ~$0.001/card text generation
- Estimated LoRA training: ~$2-3 on Replicate (one-time)
- Estimated creature art (50 cards): ~$0.23 on Replicate
- Estimated non-creature art (30 cards): ~$0.75 on fal.ai
- Estimated text generation (80 cards): ~$0.08 on OpenAI
- Total estimated generation cost: ~$3-4, well within $10.00 budget

## Notes
- Public domain image downloads for LoRA training: $0 (free museum APIs)
- Google Fonts (EBGaramond, Oswald, Cinzel): $0 (OFL license)
- Font download via curl: $0
