# CLAUDE.md Audit — Pre-Cleanup Categorization
Generated: 2026-02-21
CLAUDE.md line count before cleanup: 327

---

## Summary
- KEEP: 18 blocks
- REMOVE_SUPERSEDED: 2 blocks
- REMOVE_CONFLICTING: 5 blocks
- REMOVE_REDUNDANT: 0 blocks
- NEEDS_DECISION: 2 blocks

---

## Detailed Categorization

---

### KEEP: Project Overview
Lines: 1–4
Reason: Project identity context for all agents. Describes the core game mechanic (D20 Chaos Roll, instability, Order/Chaos events). Not a visual or design spec. Not present anywhere in the design guide. Every agent needs to know what they are building.
Content summary: One-paragraph description of Chaos Creatures as an AI-generated card game with D20 Chaos Roll mechanics and instability-based Order/Chaos events.

---

### KEEP: Build Context
Lines: 6–20
Reason: Behavioral mandates governing all agents: solo non-engineer owner, codebase completeness status, current phase (polish and audit), code-ready output requirement, and the critical 3-clicks/1-terminal-command owner workflow constraint. None of this is in the design guide. These constraints must remain visible to every agent.
Content summary: Solo owner, functionally complete codebase, polish phase, agents must produce code-ready output, owner processes must require no more than 3 clicks or one terminal command.

---

### KEEP: Infrastructure Stack
Lines: 22–42
Reason: Authoritative registry of all decided services (Supabase, Railway, Vercel, fal.ai, OpenAI GPT-4o Mini, Cloudflare R2, PostHog, StoreKit 2, ImageMagick 7, node-canvas, Puppeteer, sharp) with an explicit no-alternatives mandate. Also contains all credential file locations (.env, game-server/.env, admin-dashboard/.env.local, Config.xcconfig). The design guide references only Replicate and fal.ai within its art generation scope — it does not enumerate the full project infrastructure. Credential paths are essential operational data not found in the guide.
Content summary: Full decided-service list with no-alternatives mandate, plus credential file locations for every service.

---

### KEEP: Client Technology
Lines: 44–54
Reason: Platform constraint governing all iOS implementation. The design guide's Preamble locks iOS 16+ and Swift, but this section covers all screens (not just card rendering) with specific framework-to-feature mappings (SwiftUI for menus/collection/shop/onboarding, SpriteKit for battlefield, StoreKit 2 for IAP, URLSession + Supabase SDK for networking, Swift Concurrency for async). The NOT React Native / NOT Unity / NOT Expo prohibition is a critical guard against misunderstanding. Keep as the full-scope client platform authority.
Content summary: Swift + SwiftUI + SpriteKit + StoreKit 2 stack with explicit prohibition against React Native, Unity, and Expo. Framework-to-feature allocations.

---

### KEEP: Live Deployment
Lines: 56–62
Reason: Operational configuration containing live URLs for all deployed services with Railway, Vercel, Supabase (including project ref), and R2 CDN. Agents need these to interact with live services and verify deployments. Not present in the design guide.
Content summary: Four live deployment URLs: Game Server (Railway), Admin Dashboard (Vercel), Supabase project, R2 CDN.

---

### KEEP: Current Build State
Lines: 64–84
Reason: Project status snapshot orienting incoming agents to what exists, what remains, and what is broken. Known bugs section contains actionable workarounds (Edge Function verifyServiceRole 403 workaround, fal.ai base64 workaround for R2 download failures). Not present in the design guide. Essential for any agent entering the project.
Content summary: Completed items (database, edge functions, game server, admin dashboard, iOS app, card art, faction expansion, visual assets), incomplete items (art at scale, visual polish, App Store, audio), two known bugs with workarounds.

---

### KEEP: Two Applications
Lines: 86–98
Reason: Architectural scoping rule distinguishing the iOS game client from the Next.js admin dashboard. States that no document should mix admin and game features. Not covered by the design guide, which is exclusively scoped to iOS card rendering. Prevents agents from placing admin features in iOS code or vice versa.
Content summary: Two distinct apps — iOS game client and Next.js admin dashboard (Vercel). Eight admin pages listed. Cross-contamination prohibition.

---

### KEEP: Budget Constraint (top-level)
Lines: 100–104
Reason: Project-level financial constraint ($300 total cap, dollar estimates required in all infrastructure docs, all visual assets must be AI-generated or free/open-source). The design guide's Section 11 contains an art generation budget allocation table but does not set a project-level dollar cap. CLAUDE.md is the financial authority for all decisions.
Content summary: $300 total build-to-launch budget. All docs referencing infrastructure must include dollar estimates. Visual assets must be AI-generated or free/open-source.

---

### REMOVE_CONFLICTING: Polish Budget (~$100 remaining)
Lines: 106–113
Conflict: Two items in this block conflict with the design guide.

Conflict A — fal.ai model: Line 30 (Infrastructure Stack) says "fal.ai (FLUX Kontext API)." The design guide Section 3.3 specifies the fal.ai model as `fal-ai/flux/dev` (FLUX.1 Dev) with specific parameters (28 inference steps, guidance_scale 3.5). FLUX Kontext is an image-to-image editing model with a completely different API call structure and different outputs than FLUX.1 Dev. An agent implementing CLAUDE.md would use the wrong model and wrong call signature for all non-creature art generation.

Conflict B — Font: Line 109 budgets for "Cinzel + Alegreya fonts." The design guide Section 1.5 specifies three font families: Cinzel (headings), EBGaramond (body text, flavor text, keyword abilities), and Oswald-Bold (stats/numbers). Alegreya is absent from the guide entirely. The guide's Info.plist registration block and smoke test code hardcode EBGaramond and Oswald-Bold. Budgeting for Alegreya implies implementing a font the guide does not use, which would cause the guide's smoke test to fail.

The remaining budget tracking content (total remaining, SFX/music sources, itch.io contingency) contains no conflicts and is non-visual. Resolution approach: remove the conflicting font and model line items; keep the financial tracking structure.

---

### KEEP: Monetization Principle
Lines: 115–123
Reason: Core game design and economy policy (no pay-to-win, free players can beat paying players, subscription tiers affect modifier selection breadth not power, no exclusive gameplay content behind paywalls, fair matchmaking). Not covered anywhere in the design guide, which is limited to card rendering. Essential for agents working on economy, progression, shop, and subscription systems.
Content summary: No-pay-to-win mandate. Subscription tiers give more modifier choices (2/3/4 options by tier), not stronger modifiers.

---

### KEEP: Launch Requirements (App Store)
Lines: 125–134
Reason: App Store submission checklist (privacy policy URL, ToS URL, app icon spec, screenshots, description copy, age rating questionnaire, privacy nutrition labels). Not covered by the design guide. Required for App Store prep phase agents.
Content summary: Seven App Store requirements listed, all scoped to the iOS client submission.

---

### REMOVE_CONFLICTING: Art Quality Target
Lines: 136–140
Conflict: CLAUDE.md states "Locked style anchor (v5) references only public domain artists: Gustave Dore and N.C. Wyeth (base anchor)" and specifically calls out N.C. Wyeth as a cross-faction base anchor. The design guide Section 3.1 (Faction Artist System) does not use N.C. Wyeth at all — not as a base anchor, not for any faction. The guide's base aesthetic is "oil painting, impasto brushwork" applied universally, with faction-specific artist references (Piranesi for Ironwright, Rackham+Dulac for Fey, Bosch for Demonic, Doré for Celestial/Endless). The mention of "John Martin" for Ironwright in CLAUDE.md does not appear in the guide (the guide uses Piranesi only for Ironwright). These discrepancies are minor in practice (the faction-specific artists agree across both documents for Fey, Demonic, Celestial, Endless), but the base anchor (N.C. Wyeth in CLAUDE.md vs. no universal anchor in the guide) is a direct difference.

The "hand-painted professional illustrator" quality bar and rejection criteria are superseded by the design guide's Section 14 (Quality Bar), which is more specific: "The physical test: show it to someone without context — if they ask 'is that a real card?' it is working." Both the quality bar and the artist table should be removed from CLAUDE.md; the guide's Section 3.1 and Section 14 are the authoritative replacements.

---

### REMOVE_SUPERSEDED: Art Consistency
Lines: 142–144
Reason: Superseded by design guide Section 1.1 (Core Aesthetic Principles), which fully covers and exceeds this single-sentence statement. The guide specifies: consistent oil paint aesthetic, precise color palette (Section 1.2 with P3 values), mandatory color grading pipeline (Section 3.4 applied to every generated artwork), and shader-driven material consistency via Metal shaders applied uniformly to all cards (Sections 6.1–6.2). The "base prompt prefix" concept is implemented in the guide's prompt templates (Sections 3.2 and 3.3). Nothing in this CLAUDE.md block adds beyond what the guide covers.
Conflict if any: None — fully superseded without conflict.

---

### REMOVE_SUPERSEDED: Composition Variety
Lines: 146–148
Reason: Superseded by the design guide's Section 3 (Asset Strategy), which provides the complete generation pipeline for both creature cards (Section 3.2, LoRA via Replicate) and non-creature cards (Section 3.3, fal.ai FLUX.1 Dev) with full prompt templates. The specific numbers in this CLAUDE.md block (25 composition templates, 13 faction environments, 8 weather modifiers, 6 time-of-day modifiers) belong in docs/design/03-prompt-templates.md and faction-art-bible.md, which are the proper repositories for this data. Removing this summary from CLAUDE.md does not lose the data — it removes a summary that duplicates content from those more detailed sources.
Conflict if any: None — fully superseded without conflict.

---

### REMOVE_CONFLICTING: Card Visual System
Lines: 150–159
Conflict: This block contains three direct conflicts with the design guide.

Conflict A — Card layout architecture: CLAUDE.md specifies "Full-art cards with no bordered frames. Art fills the entire card face. A translucent text panel at the bottom contains card name, stat icons, faction icon, and flavor text." The design guide Section 1.4 specifies a structured bordered card with precisely measured zones: outer border (3pt), inner content area, Name Bar at top (25pt, 8.5% of height), Art Box in the center (132pt, 45% of height), Type Line (18pt), Text Box (88pt, 30% of height), Stats Bar (15pt), Rarity Color Bar (4pt). The art box occupies 45% of the card height, not the full face. The guide specifies full-art only for Planar Ruins ("art bleeds to all four edges of the art box," Section 1.5b). These layouts are fundamentally incompatible for creature cards — one is full-art with a bottom overlay panel, the other is a structured card with distinct labeled zones. An agent reading CLAUDE.md builds a different card than an agent reading the guide.

Conflict B — Font selection: CLAUDE.md specifies "Cinzel (card names, headers) + Alegreya (body text, flavor text, stats)." The design guide Section 1.5 specifies three font families: Cinzel-Regular and Cinzel-Bold (headings, name bar, type line, collector number), EBGaramond-Regular / Italic / SemiBold (ability text, flavor text, keyword abilities), and Oswald-Bold (ATK/HP stats and numbers). Alegreya is entirely absent from the guide. The guide's Info.plist registration block explicitly lists the six font weights to register, none of which is Alegreya. The smoke test code in Section 4.9 uses `.custom("EBGaramond-Regular", ...)` and `.custom("Oswald-Bold", ...)`. Implementing Alegreya instead would cause the guide's smoke test to fail.

Conflict C — Rarity representation (edge glow vs. structured treatments): CLAUDE.md says "Rarity treatment applied as a thin edge glow at the card border." The guide Section 1.4 specifies rarity through a combination of: border width (3–4pt by tier), inner shadow depth (none to 2pt), outer glow using specific palette colors at specific opacities (aged-gold 40% opacity for Rare; epic-amethyst 50% for Epic; legendary-ember 60% for Legendary), a distinct 4pt Rarity Color Bar at the bottom of the inner content area, and a WaxSeal component (34×34pt overlapping the stats bar). Not a simple thin edge glow.

Note: Rarity tier count (5 tiers: Common/Uncommon/Rare/Epic/Legendary) is consistent between CLAUDE.md and the guide — not a conflict.

---

### KEEP: Testing & Validation
Lines: 169–178
Reason: Project-wide testing behavioral mandate applying to all agents on all features (not just card rendering). Covers gameplay logic, edge functions, game server, and all non-card UI screens. The design guide Sections 5.1–5.4 and Section 12 specify visual testing and refinement techniques scoped to card rendering — this CLAUDE.md section is broader and complementary.
Content summary: Agents must build, run, and visually verify in Xcode Simulator. Fix issues before declaring done. Write and run unit and integration tests. Code is done only when it compiles, runs without crashes, and passes tests.

---

### KEEP: Safety Rules
Lines: 180–190
Reason: Repository safety and git hygiene rules applying to all agents on all tasks. Not covered anywhere in the design guide. Non-negotiable constraints that must remain visible in CLAUDE.md.
Content summary: Eight absolute rules covering docs/design/ file protection, revision log requirement, pre-operation git commits, no destructive bash commands, no force-push/rebase/branch-deletion, no API key commits, .gitignore requirements, and stash/revert as the only recovery methods.

---

### KEEP: Copyright & Trademark Prohibition
Lines: 192–204
Reason: Legal compliance policy governing all content generation across the entire project (code, design docs, AI prompts, asset filenames). The design guide incorporates this rule into its negative prompts (Section 3.2 explicitly excludes "MTG, Magic the Gathering, Wizards of the Coast, Pokémon, Yu-Gi-Oh, any trademarked character"), but the CLAUDE.md policy is broader in scope — it covers all agents, all code, all docs, and all filenames. Keep as the project-level legal compliance authority.
Content summary: Prohibition on trademarked and copyrighted content in all project artifacts. Approved list of public domain artists (pre-1953). Generic description fallback rule.

---

### KEEP: Protected Files
Lines: 206–215
Reason: Document authority hierarchy essential for all agents. Designates 00-game-design-master.md, 01-battle-mechanics.md, and 02-card-data-model.md as source-of-truth protected files. Not covered by the design guide. Keep as the authority hierarchy statement.
Content summary: Three protected design files as source of truth. Downstream docs (03–10) must conform to them. CLAUDE.md updatable only for deployment state and infrastructure changes.

---

### NEEDS_DECISION: Protected Files — missing design guide authority
Lines: 206–215 (same block, specific gap)
Issue: docs/CARD_DESIGN_GUIDE.md is not listed in the Protected Files section despite being the most detailed and current authority for visual rendering decisions. The guide self-declares "if the two files conflict, this guide is authoritative" (referring only to itself vs. docs/CARD_DESIGN_QUICKREF.md). It makes no claim about its authority relative to CLAUDE.md. Without an explicit statement, agents have no defined rule for resolving the conflicts identified in this audit (card layout, font selection, iOS version, fal.ai model). The rarity tier count and the faction artist system have no conflict, but the other four do. Owner must decide: (a) add the design guide to the Protected Files list with explicit precedence over CLAUDE.md for visual/rendering decisions, or (b) update CLAUDE.md's conflicting sections to match the guide and remove the ambiguity.

---

### KEEP: Repository Structure
Lines: 217–244
Reason: Navigation reference for all agents. Complete directory map of the actual chaos-creatures repository (iOS app, game server, admin dashboard, supabase, scripts, docs). Not present in the design guide. The guide's Section 4.2 contains a project scaffold template describing an ideal structure, not the actual repository.
Content summary: Full directory map covering all top-level modules and all docs/design/ files with descriptions.

---

### KEEP: Key Design Decisions (Do Not Contradict)
Lines: 246–261
Reason: Locked game mechanics governing gameplay, card behavior, and economy. Zero overlap with the design guide, which covers only visual rendering. These decisions are the authority for all agents working on game logic, card data models, economy systems, and server-side mechanics. Do not remove under any circumstances.
Content summary: Five factions with faction keywords, Ironwright identity (NOT steampunk), 10 sub-factions, 9 gameplay keywords, Planar Ruins card type rules, combat sequence (declare attackers → defender assigns blockers → simultaneous damage), Taunt two-part rule, main-phase-only spells, PP modifier pools (170 total), subscription tier modifier selection (2/3/4 options by tier), Chaos Dust economy, fixed CM cost through evolution, evolution energy thresholds, instability formula, 10 avatars.

---

### KEEP: Agent Workflow
Lines: 263–268
Reason: Phase and orchestration status that orients agents: doc and build pipelines complete, current phase is visual polish across 9 waves. References docs/design/13-visual-design-guide.md by name (directing agents to the wave plan) without duplicating its content.
Content summary: Orchestrator + sub-agent architecture. Doc and build pipelines complete. Current phase: visual polish (9 waves). Pointer to doc 13 for wave details.

---

### REMOVE_CONFLICTING: Animation & Polish
Lines: 161–167
Conflict: CLAUDE.md states "SpriteKit for all battlefield animations (card play, attacks, damage, death, chaos roll, events)." This implies SpriteKit is responsible for all card-level rendering and animation on the battlefield. The design guide implements card state transitions (focused, selected, tapped, previewed, inGraveyard, summoning, damaged) using SwiftUI animation modifiers (`.spring()`, `.easeIn`, `.easeOut`) and Metal shaders via MTKView (Sections 1.6, 6.1–6.5). SpriteKit appears in the guide only for particle systems (Section 6.8, stored as .sks files) and ambient particle scenes (Section 13.2). The guide's explicit statement in Section 6 is: "All effects use Metal, Core Animation, and SpriteKit" — with SpriteKit in a supporting role for particles, not as the primary card animation engine.

The conflict: CLAUDE.md says SpriteKit handles all battlefield card animations (card play, attacks, damage numbers, death effects). The guide says SwiftUI + Metal handle card state transitions (these map to the same animations: summoning, damaged, inGraveyard), with SpriteKit handling particles only. An agent following CLAUDE.md would implement the card play animation in SpriteKit; an agent following the guide would implement it in SwiftUI with a Metal shader. These are different code paths that cannot be merged without a design decision.

Not conflicting (superseded only): The named gameplay events (chaos roll D20 spin, event popup, evolution reveal, attack declaration glow) are not card display states — they are battlefield events not specified in the guide, which focuses on the card display system. The loading/error/empty states mandate is a general UX rule not addressed by the guide. These portions are REMOVE_SUPERSEDED in spirit, not REMOVE_CONFLICTING.

---

### KEEP: Build Phase Protocol — Context Resilience
Lines: 270–327
Reason: Agent operational resilience protocol (checkpoint files, recovery procedure, commit frequency, idempotent execution). Not covered by the design guide. The guide's Section 5.6 (context management) is scoped to card rendering workflow only — this section covers all agents on all modules. Keep in full.
Content summary: Checkpoint file protocol (location, format, update cadence), 5-step compaction recovery procedure, commit frequency rules (after every 2–3 files, format: build({module}): {description}), idempotent execution requirements (check before create, skip complete files, continue from partial).

---

## NEEDS_DECISION: iOS Minimum Version
Lines: 26 (Client Technology block, Infrastructure Stack)
Issue: CLAUDE.md specifies "iOS 17+ minimum target" in the Client Technology section and the Infrastructure Stack bullet. The design guide Preamble locked deployment parameters table specifies "Minimum iOS: iOS 16." These are the same parameter with different values. iOS 16 support requires older device support and excludes access to some iOS 17 SwiftUI APIs. The guide was written to target iOS 16. Implementing the guide's code against an iOS 17 minimum would produce no runtime issues (iOS 17 devices run iOS 16 code), but an iOS 16 minimum means the app must not use iOS 17-only APIs — the guide may reference some. Owner must confirm the canonical minimum deployment target.

---

## Conflict Summary for Special Attention

Five blocks are categorized REMOVE_CONFLICTING. Each requires owner resolution before any agent implements card-related work.

---

### Conflict 1 — fal.ai Model (Polish Budget, line 109; Infrastructure Stack, line 30)
CLAUDE.md says: "fal.ai (FLUX Kontext API)" and budgets for fal.ai as the generation service for all visual assets.
Guide says (Section 3.3): The fal.ai model is `fal-ai/flux/dev` (FLUX.1 Dev), with specific parameters: 28 inference steps, guidance_scale 3.5, image_size "square_hd". A complete Python generation function is provided. FLUX Kontext is absent from the guide.
Nature: Wrong model specified. FLUX Kontext is an image-to-image editing model; FLUX.1 Dev is text-to-image. Different API call structure, different inputs, different outputs.
Resolution needed: Confirm whether FLUX.1 Dev (guide) or FLUX Kontext (CLAUDE.md) is the intended model. If FLUX.1 Dev, update CLAUDE.md line 30 and the Polish Budget line.

---

### Conflict 2 — Card Layout Architecture (Card Visual System, lines 150–154)
CLAUDE.md says: Full-art cards — art fills the entire card face. Translucent text panel at the bottom contains card name, stat icons, faction icon, and flavor text. No bordered frame.
Guide says (Section 1.4): Structured bordered card. Art Box occupies 45% of card height (132pt of 294pt) in the center. Name Bar at top (25pt), Type Line below art (18pt), Text Box (88pt), Stats Bar (15pt), Rarity Color Bar (4pt). Full-art applies only to Planar Ruins (Section 1.5b).
Nature: Fundamental layout architecture conflict. The two designs produce visually incompatible cards for creature cards. The guide's Section 4.9 smoke test contains working Swift code for the structured layout.
Resolution needed: Confirm which layout is authoritative for creature cards and spells. The design guide is more detailed and more recent — recommend making the guide authoritative and updating CLAUDE.md to match.

---

### Conflict 3 — Font Selection (Card Visual System, line 155)
CLAUDE.md says: Cinzel + Alegreya (two font families, both OFL, Google Fonts).
Guide says (Section 1.5): Cinzel-Regular, Cinzel-Bold, EBGaramond-Regular, EBGaramond-Italic, EBGaramond-SemiBold, Oswald-Bold (three font families, six weights). Alegreya is absent. EBGaramond fills the body text role; Oswald-Bold handles stats and numbers. The guide's Info.plist registration block and smoke test code hardcode these six weights.
Nature: Direct naming conflict. Implementing Alegreya instead of EBGaramond + Oswald-Bold would cause the guide's smoke test to fail with font-not-found errors. Any card built to one spec looks different from a card built to the other.
Resolution needed: Confirm whether EBGaramond + Oswald-Bold (guide) or Alegreya (CLAUDE.md) is authoritative. Recommend accepting the guide's spec as it is more detailed and includes usage assignments per card zone.

---

### Conflict 4 — Rarity Visual Treatment (Card Visual System, line 159)
CLAUDE.md says: "Rarity treatment applied as a thin edge glow at the card border."
Guide says (Section 1.4): Rarity is expressed through: border width (3–4pt graduated by rarity), inner shadow depth (none to 2pt), outer glow using specific palette colors at specific opacities (aged-gold at 40% for Rare; epic-amethyst at 50% for Epic; legendary-ember at 60% for Legendary), a 4pt Rarity Color Bar at the bottom of the inner content area, and a WaxSeal component (34×34pt, Section 6.6). This is a multi-component treatment system, not a thin edge glow.
Nature: Significant underspecification in CLAUDE.md that points toward a different visual output than the guide. The WaxSeal is a distinct rarity indicator component with its own shader (Section 6.6) — absent from CLAUDE.md's description.
Resolution needed: Accept the guide's multi-component rarity system as authoritative. Remove the "thin edge glow" description from CLAUDE.md.

---

### Conflict 5 — Battlefield Animation Engine (Animation & Polish, lines 161–167)
CLAUDE.md says: "SpriteKit for all battlefield animations (card play, attacks, damage, death, chaos roll, events)."
Guide says (Sections 1.6, 6): Card state animations (focused, selected, tapped, inGraveyard, summoning, damaged) use SwiftUI animation modifiers and Metal shaders via MTKView. SpriteKit handles particle systems only (Section 6.8). Section 6 states: "All effects use Metal, Core Animation, and SpriteKit" — but the individual effect implementations in Sections 6.1–6.7 use Metal shaders and Core Animation, not SpriteKit node graphs, for card state transitions.
Nature: CLAUDE.md assigns card animation ownership to SpriteKit; the guide assigns it to SwiftUI + Metal. These are different frameworks with different code paths, different view hierarchies, and different performance characteristics. Code written to one approach cannot be used in the other.
Resolution needed: Confirm which rendering pipeline handles card-level animations (summoning, damaged, inGraveyard) on the battlefield. If the guide's SwiftUI + Metal approach is correct, CLAUDE.md's SpriteKit statement should be narrowed to: "SpriteKit for particle effects and ambient battlefield effects; SwiftUI + Metal shaders for card state transitions."

---

*End of audit. Total blocks reviewed: 30. Five conflicts require owner resolution before card implementation work proceeds.*
