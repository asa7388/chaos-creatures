# Chaos Creatures — AI-Generated Card Game

## Project Overview
Chaos Creatures is a mobile-first collectible card game where every card's art is AI-generated and evolves through play. The core mechanic is a D20 Chaos Roll at the start of each turn that triggers Order or Chaos events based on the player's instability rating.

## Repository Structure
```
docs/design/
  00-game-design-master.md    — Master design doc (all systems, UI, decisions)
  01-battle-mechanics.md      — Battle mechanics (PP, instability, turn structure, keywords, events, factions, modifiers)
  02-card-data-model.md       — Data model (all entities, enums, game state, data flows)
  03-prompt-templates.md      — AI generation pipeline (FLUX Kontext, GPT-4o Mini)
  04-progression-economy.md   — XP curves, Chaos Dust economy, quest design
  05-content-pipeline.md      — Batch generation tooling, QA, seasonal releases
  06-technical-architecture.md — System design, APIs, infrastructure
  07-ui-ux-specs.md           — Wireframes and interaction specs
  08-audio-design.md          — Music, SFX, per-faction audio
  09-monetization-details.md  — Subscription tiers, pricing, conversion funnels
  10-prd.md                   — Formal PRD for engineering handoff
  PROGRESS.md                 — Task tracking for orchestrator
```

## Key Design Decisions (Do Not Contradict)
- 3 factions: Ironwright Collective (Augment), Fey Courts (Bond), Demonic Kingdoms (Corruption)
- 7 keywords: Shield, Lifesteal, Flying, Reach, Deathtouch, Taunt, Piercing
- MTG-style combat: declare attackers → defender assigns blockers → simultaneous damage
- Taunt = forced attack + forced block (two-part rule)
- Main phase only spells — no instant-speed, no response windows
- PP-based modifier pools: 12 pools × (8 universal + 4 per faction) = 240 modifiers
- Subscription-tiered modifier selection: Free (2 options), Mid (3), Top (4)
- Chaos Dust economy: no real money on individual cards
- CM cost is fixed forever through evolution
- Evolution energy thresholds: 15/30/50/75, earn 2/win 1/loss, all 20 deck cards earn simultaneously
- Instability formula: avatar modifier + sum(creature base_instability + evolution changes + modifier adjustments), clamped 1-20

## Agent Workflow
This project uses an orchestrator agent that delegates to specialized sub-agents. See `.claude/agents/` for all agent definitions. The orchestrator coordinates the production of docs 03-10.
