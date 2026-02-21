# CLAUDE.md Content Audit
**Purpose:** Categorize every distinct content block in CLAUDE.md relative to docs/CARD_DESIGN_GUIDE.md
**Guide version read:** docs/CARD_DESIGN_GUIDE.md (full, ~2937 lines) + docs/CARD_DESIGN_QUICKREF.md
**CLAUDE.md lines audited:** 1–328
**Date:** 2026-02-20
**Note:** This file overwrites a prior partial audit. All entries are new from scratch.

---

## Category Legend

| Category | Meaning |
|----------|---------|
| `KEEP` | Essential project config not covered by the design guide. Examples: build commands, environment requirements, repo structure conventions, non-design agent behavioral rules, CI/CD notes, testing infrastructure. |
| `REMOVE_SUPERSEDED` | Design direction, visual decisions, art style guidance, animation specs, asset strategy, color decisions, typography, or any other content now fully covered by docs/CARD_DESIGN_GUIDE.md. Content is not lost — it lives in the guide. |
| `REMOVE_CONFLICTING` | Content that directly contradicts the design guide. Specific conflict noted before removal. |
| `REMOVE_REDUNDANT` | Duplicates the guide without conflicting, creating two places to maintain the same information. |
| `NEEDS_DECISION` | Ambiguous, partially overlapping, or uncertain. Do not remove unilaterally. |

---

## Block-by-Block Entries

---

### [KEEP] — Project Overview
**Lines:** 1–4
**Summary:** One-paragraph description of Chaos Creatures: AI-generated card game, D20 Chaos Roll mechanic, instability-based Order/Chaos events.
**Reason:** Project identity context. Not a visual, design, or asset spec. Not mentioned anywhere in the design guide. All agents need to know what they are building. Essential to retain.

---

### [KEEP] — Build Context
**Lines:** 6–20
**Summary:** Solo non-engineer owner. Codebase functionally complete (80+ Swift files). Current phase: polish and audit. Agents must produce code-ready output. Owner workflow mandate: max 3 clicks or 1 terminal command per owner action.
**Reason:** Behavioral constraints governing how all agents must structure deliverables and owner-facing processes. The design guide contains no owner workflow rules, phase status, or behavioral mandates. Essential for all agents.

---

### [KEEP] — Infrastructure Stack
**Lines:** 22–42
**Summary:** Full list of all decided services: Supabase, Railway, Vercel, fal.ai, OpenAI GPT-4o Mini, Cloudflare R2, PostHog, Apple Developer Program, StoreKit 2, ImageMagick 7, node-canvas, Puppeteer, sharp. Credential file locations for each.
**Reason:** Authoritative infrastructure registry with a hard no-alternatives mandate. The design guide references Replicate and fal.ai within its art generation sections only; it does not enumerate the full project infrastructure. The credential file locations (.env, game-server/.env, admin-dashboard/.env.local, Config.xcconfig) are essential operational data not found in the guide. KEEP the full block.

---

### [KEEP] — Client Technology
**Lines:** 44–54
**Summary:** Swift + SwiftUI + SpriteKit, iOS only. Specific framework allocations: SwiftUI for menus/collection/shop/onboarding, SpriteKit for battlefield, StoreKit 2 for IAP, URLSession + Supabase SDK for networking, Swift Concurrency for async. Explicit prohibition: NOT React Native, NOT Unity, NOT Expo.
**Reason:** Platform constraint governing every iOS implementation decision. The design guide's Preamble locks iOS 16+ and Swift, but CLAUDE.md's Client Technology section is broader — it covers all screens (not just card rendering) and names every relevant framework with its scope. The NOT React Native prohibition is a critical guard against misunderstanding. KEEP as the authoritative full-scope client platform statement.

---

### [KEEP] — Live Deployment
**Lines:** 56–62
**Summary:** Live URLs for all deployed services: Game Server (Railway), Admin Dashboard (Vercel), Supabase (with project ref), R2 CDN.
**Reason:** Operational configuration. Agents need these URLs to interact with live services, verify deployments, and configure environment variables. Not present in the design guide.

---

### [KEEP] — Current Build State
**Lines:** 64–84
**Summary:** Completed items (database, edge functions, game server, admin dashboard, iOS app, card art, faction expansion, visual assets including current CardFrameView state). Incomplete items (art at scale, visual polish, App Store, audio). Known bugs (Edge Function verifyServiceRole 403, fal.ai R2 download intermittent failure with base64 workaround).
**Reason:** Current project status that orients all incoming agents to what exists, what remains, and what is broken. The known bugs are actionable technical facts with workarounds. Not present in the design guide. Essential for any agent entering the project.

---

### [KEEP] — Two Applications
**Lines:** 86–98
**Summary:** Explicitly distinguishes the iOS game client from the Next.js admin dashboard (deployed on Vercel). Lists admin dashboard pages. States that no document should mix admin and game features.
**Reason:** Architectural scoping rule for documentation and implementation. Not covered in the design guide, which is exclusively scoped to iOS card rendering. This rule prevents agents from placing admin features in iOS code or vice versa. Essential to retain.

---

### [KEEP] — Budget Constraint
**Lines:** 100–104
**Summary:** $300 total budget cap. Requires all docs referencing infrastructure costs to include dollar estimates within this cap. All visual assets must be AI-generated or free/open-source.
**Reason:** Project-level financial constraint. The design guide's §11.1 contains an art generation budget allocation table (percentages per category) but does not set a project-level dollar cap. The CLAUDE.md constraint is broader and must remain as the financial authority for all decisions.

---

### [REMOVE_CONFLICTING] — Polish Budget (~$100 remaining)
**Lines:** 106–113
**Summary:** ~$100 remaining for polish. Line items include: visual assets via fal.ai (~$4), fonts (Cinzel + Alegreya), SFX (freesound.org CC0), music (Suno.ai free tier), optional itch.io packs.
**Reason:** REMOVE_CONFLICTING on two specific items within this block.

**Conflict 1 — Art generation service:** "Visual assets (frames, icons, card backs): AI-generated via fal.ai (~$4 total)." The design guide (§3.1–3.3) specifies the art generation pipeline as: custom LoRA via Replicate for creatures, fal.ai FLUX.1 Dev for non-creature cards. More specifically, the guide does specify fal.ai for non-creature artwork — but CLAUDE.md's statement here says all visual assets (frames, icons, card backs) go through fal.ai, which aligns partially. The deeper conflict is with the prior CLAUDE.md line (line 30) that says "fal.ai (FLUX Kontext API)" while the guide uses "fal.ai FLUX.1 Dev." FLUX Kontext and FLUX.1 Dev are different models with different parameters and call signatures.

**Conflict 2 — Font:** "Cinzel + Alegreya" — the design guide (§1.5) specifies Cinzel + EBGaramond + Oswald-Bold. Alegreya is not mentioned in the guide. Budgeting for Alegreya (even though it is free) implies implementing a font the guide does not use.

The overall structure of the block (budget tracking, SFX/music sources) is KEEP. Only the conflicting specifics need reconciliation.

---

### [KEEP] — Monetization Principle
**Lines:** 115–123
**Summary:** No pay-to-win mandate. Free players must be able to beat paying players. Subscription tiers affect modifier selection breadth (2/3/4 options) not modifier power. No exclusive gameplay content behind paywalls. Fair matchmaking.
**Reason:** Core game design and economy policy. Not covered anywhere in the design guide, which is limited to card rendering. Essential for agents working on economy, progression, shop, and subscription systems.

---

### [KEEP] — Launch Requirements (App Store)
**Lines:** 125–134
**Summary:** Privacy policy URL, ToS URL, app icon (1024x1024 via fal.ai), screenshots from Xcode Simulator, description copy and keywords, age rating questionnaire answers, privacy nutrition labels.
**Reason:** App Store submission checklist. Not covered by the design guide. Required for App Store prep phase agents.

---

### [REMOVE_CONFLICTING] — Art Quality Target
**Lines:** 136–140
**Summary:** Card art must look hand-painted. Locked style anchor (v5) lists public domain artists by faction: Gustave Dore + N.C. Wyeth (base), Piranesi + John Martin (Ironwright), Rackham + Dulac (Fey), Bosch (Demonic), Dore + Blake (Celestial), Dore + Goya (The Endless). Traditional media aesthetics: impasto brushstrokes, ink linework, crosshatching. Colors vivid within palette knife oil painting aesthetic.
**Reason:** REMOVE_CONFLICTING.

**Conflict — Artist reference model:** CLAUDE.md assigns specific artists per faction (Piranesi + John Martin for Ironwright; Rackham + Dulac for Fey Courts; Bosch for Demonic; Dore + Blake for Celestial; Dore + Goya for The Endless). The design guide's §3.2 prompt structure uses N.C. Wyeth as the creature LoRA style reference without faction-specific artist branching. The guide's §3.3 non-creature prompt templates reference "N.C. Wyeth influence" and "Hudson River School influence" across all factions. There is no per-faction artist assignment in the guide. CLAUDE.md's faction-specific artist anchor system is architecturally incompatible with the guide's single-prompt-style approach.

**Also superseded in intent:** The "hand-painted professional illustrator" quality bar and the "if it looks AI-generated, it is a failed generation" rule are expressed in the design guide's §14 (Quality Bar) with more specificity: "an observer's first instinct is to reach out and touch the card, not to recognize it as a screen UI" and "The physical test: show it to someone without context — if they ask 'is that a real card?' it is working."

---

### [REMOVE_SUPERSEDED] — Art Consistency
**Lines:** 142–144
**Summary:** All card art must look like it belongs in the same game. Base prompt prefix enforces consistent style, lighting, color palette, and framing across all cards.
**Reason:** REMOVE_SUPERSEDED. The design guide's §1.1 (Core Aesthetic Principles) fully covers and exceeds this single-sentence statement. The guide specifies: consistent oil paint aesthetic, parchment palette (§1.2 with precise P3 color values), color grading pipeline (§3.4, mandatory for every generated artwork), and shader-driven material consistency applied uniformly to all cards (§6.1, §6.2). The "base prompt prefix" concept is implemented in the guide's prompt templates in §3.2 and §3.3. Nothing in this CLAUDE.md block extends beyond what the guide covers.

---

### [REMOVE_SUPERSEDED] — Composition Variety
**Lines:** 146–148
**Summary:** 25 composition templates auto-selected by card tier/keywords/mana cost. No two cards in a batch with same composition. 13 faction environments. 8 weather modifiers (~30%), 6 time-of-day modifiers (~40%), scale modifiers mapped to mana cost (TINY/SMALL/LARGE/COLOSSAL).
**Reason:** REMOVE_SUPERSEDED. This describes the prompt-generation pipeline, which is now governed by the design guide's §3 (Asset Strategy). The guide provides the complete generation pipeline for both creature cards (§3.2, LoRA via Replicate) and non-creature cards (§3.3, fal.ai FLUX.1 Dev) with full prompt templates. The weather/time-of-day/scale modifier system from CLAUDE.md (v5.1 prompt system) is not carried into the guide and should be treated as superseded by the guide's more complete pipeline specification. The granular details (25 compositions, 13 environments) live in docs/design/03-prompt-templates.md and the faction-art-bible.md, not in CLAUDE.md, so removing this CLAUDE.md summary does not lose the data.

---

### [REMOVE_CONFLICTING] — Card Visual System
**Lines:** 150–159
**Summary:** Decided asset strategy: full-art cards with no bordered frames, art fills entire card face, translucent text panel at bottom with name (Cinzel font), stat icons (chaos-motes, sword-atk, heart-hp), faction icon, and flavor text. Rarity as thin edge glow at card border. Fonts: Cinzel + Alegreya (OFL, Google Fonts). Keyword icons: 9 AI-generated, 256x256, transparent background. Faction icons: 5 AI-generated, 512x512. Card backs: 1 universal + 5 faction-specific, AI-generated. Rarity treatments: Common (matte), Uncommon (metallic sheen), Rare (energy glow, SKAction pulse), Epic (purple shimmer, SKShader), Legendary (gold prismatic, particle emitter).
**Reason:** REMOVE_CONFLICTING. This block contains five direct, irreconcilable conflicts with the design guide:

**Conflict 1 — Card layout architecture:**
- CLAUDE.md: "Full-art cards with no bordered frames. Art fills the entire card face. A translucent text panel at the bottom contains card name, stat icons, faction icon, and flavor text."
- Guide §1.4: Structured card with named measurement zones: outer border (3pt), inner content area, Name Bar at top (25pt), Art Box in the middle (132pt, 45% of height), Type Line (18pt), Text Box (30% of height, 88pt), Stats Bar (15pt), Rarity Color Bar (4pt at bottom). This is a traditional bordered card frame, not a full-art design. The art box occupies 45% of the card height, not the full face.
- These layouts are fundamentally incompatible. An agent implementing the guide would build a bordered structured card; an agent implementing CLAUDE.md would build a full-art bottom-panel card.

**Conflict 2 — Font selection:**
- CLAUDE.md: Cinzel + Alegreya (two font families).
- Guide §1.5: Cinzel-Regular, Cinzel-Bold, EBGaramond-Regular, EBGaramond-Italic, EBGaramond-SemiBold, Oswald-Bold (three font families, six weights). Alegreya is absent from the guide. EBGaramond fills the body text role that CLAUDE.md assigned to Alegreya. Oswald-Bold is added for stats/numbers (ATK/DEF). The guide's Info.plist registration block and smoke test code (§4.9) hardcode EBGaramond and Oswald-Bold. Implementing Alegreya instead would cause smoke test failures against the guide's SmokeTestCardView.

**Conflict 3 — Rarity tier names and count:**
- CLAUDE.md: 5 tiers — Common, Uncommon, Rare, Epic (purple shimmer), Legendary (gold prismatic).
- Guide §1.4, §2.1 (Swift enum), §2.2 (shader mappings), §6.6 (WaxSealView): 4 tiers — Common, Uncommon, Rare, Mythic. The Swift enum in §2.1 is `enum Rarity: String, Codable { case common, uncommon, rare, mythic }`. The WaxSealView in §6.6 maps rarities to: parchment-mid (common), antique-silver (uncommon), aged-gold (rare), mythic-ember (mythic). There is no Epic or Legendary case anywhere in the guide. Mythic uses mythic-ember (orange-red `#C85A1A`), not purple. Implementing CLAUDE.md's rarity system would produce Swift compilation errors against the guide's enum.

**Conflict 4 — Card backs count:**
- CLAUDE.md: 1 universal + 5 faction-specific card backs.
- Guide §1.8: One card back design specified, with no mention of faction-specific variants. The guide's card back spec (canvas-warm base, center wax seal 40pt diameter, wax-red, parchment-mid border, no card info) is singular.

**Conflict 5 — Rarity edge treatment:**
- CLAUDE.md: "Rarity treatment applied as a thin edge glow at the card border."
- Guide §1.4 (Border weight by rarity table): Rarity is expressed as border weight variations (3–4pt), inner shadows (none to 2pt), outer glows using specific palette colors at specific opacities (aged-gold for Rare at 40%; mythic-ember for Mythic at 60%), and a 4pt rarity color bar at the bottom of the inner content area. The guide also uses WaxSeal (34×34pt overlapping the stats bar) as a rarity indicator (§6.6). Not a simple "thin edge glow."

---

### [REMOVE_CONFLICTING] — Animation & Polish
**Lines:** 161–167
**Summary:** SpriteKit for all battlefield animations (card play, attacks, damage, death, chaos roll, events). SwiftUI for menu/UI transitions. Named animations: card play (hand to board), attack declaration (glow + movement), damage numbers (floating text), creature death (fade/shatter), chaos roll (D20 spin), event popup, evolution reveal. Loading/error/empty states for every screen.
**Reason:** REMOVE_CONFLICTING in part.

**Conflict — Card rendering engine:**
- CLAUDE.md: "SpriteKit for all battlefield animations (card play, attacks, damage, death)." This implies SpriteKit is responsible for card-level rendering on the battlefield.
- Guide §1.6 and all of §6: The guide implements all card state transitions (focused, selected, tapped, previewed, inGraveyard, summoning, damaged) using SwiftUI animations (`.spring()`, `.easeIn`, `.easeOut`) and Metal shaders (MTKView via UIViewRepresentable). The guide's card rendering pipeline is entirely SwiftUI + Metal, not SpriteKit. The guide's §6 explicitly opens with "All effects use Metal, Core Animation, and SpriteKit" — but SpriteKit appears only in §6.8 (particle systems, stored as .sks files) and §13.2 (SpriteKit frame time target). Card state animations and shaders are Metal + Core Animation + SwiftUI, not SpriteKit-driven.
- This is not a complete resolution: CLAUDE.md and the guide both allow SpriteKit for particles, but CLAUDE.md implies SpriteKit handles card play/attack/death animations that the guide implements in SwiftUI + Metal. The specific card-rendering engine is in conflict.

**Not conflicting (superseded only):**
The named animations (chaos roll, attack declaration, event popup, evolution reveal) are gameplay events not specified in the guide, which focuses on card display states only. The loading/error/empty states mandate is a general UX rule not addressed by the guide. These portions are REMOVE_SUPERSEDED in spirit (the guide's §1.9 error states spec supersedes the "no blank screens" intent) rather than conflicting.

---

### [KEEP] — Testing & Validation
**Lines:** 169–178
**Summary:** Agents must test in Xcode Simulator: build and launch for compilation errors, visually inspect layouts, run gameplay scenarios, take screenshots. If build fails or UI looks wrong, fix immediately. Write and run unit and integration tests. Code is not done until it compiles, runs without crashes, and passes tests.
**Reason:** Project-wide testing behavioral mandate governing all agents on all features. The design guide (§5.1–5.4) specifies visual testing and refinement techniques specific to card rendering. CLAUDE.md's section is broader — it applies to gameplay logic, edge functions, game server, and all non-card UI screens. Both can coexist. KEEP as the overarching project testing standard.

---

### [KEEP] — Safety Rules
**Lines:** 180–190
**Summary:** Absolute rules: never delete docs/design/ files, never overwrite without appending to revision log first, always git commit before major operations, never run destructive bash commands, never git force-push/rebase/delete branches, never commit .xcconfig/.env/API keys, maintain .gitignore for secrets, use git stash/revert not manual reconstruction.
**Reason:** Repository safety and git hygiene rules applying to all agents on all tasks. Not covered anywhere in the design guide. These are non-negotiable constraints. Essential to retain in full.

---

### [KEEP] — Copyright & Trademark Prohibition
**Lines:** 192–204
**Summary:** Prohibits trademarked and copyrighted content in code, design docs, AI prompts, and asset filenames. Lists approved public domain artist references (Dore, Wyeth, Martin, Rackham, Dulac, Bosch, Blake, Goya, Piranesi — all died pre-1953). Requires generic descriptions when uncertain.
**Reason:** Legal compliance policy governing all content generation across the entire project. The design guide incorporates this rule into its prompt templates (§3.2 negative prompt explicitly excludes "MTG, Magic the Gathering, Wizards of the Coast, Pokémon, Yu-Gi-Oh, any trademarked character"), but the CLAUDE.md policy is broader in scope — it covers all code, all docs, all agents, and all filenames. KEEP as the project-level legal compliance authority.

---

### [KEEP] — Protected Files
**Lines:** 206–215
**Summary:** Designates docs/design/00-game-design-master.md, 01-battle-mechanics.md, and 02-card-data-model.md as source-of-truth protected files. Downstream docs (03–10) must conform to them. CLAUDE.md may be updated for deployment state and infrastructure only. Key Design Decisions in CLAUDE.md remain locked.
**Reason:** Document authority hierarchy essential for all agents. Not covered by the design guide. KEEP as the authority hierarchy statement. Note: docs/CARD_DESIGN_GUIDE.md is not listed here as a protected file — see NEEDS_DECISION entry below.

---

### [NEEDS_DECISION] — Protected Files: Missing CARD_DESIGN_GUIDE.md authority
**Lines:** 206–215 (same block, specific gap)
**Summary:** The Protected Files section does not mention docs/CARD_DESIGN_GUIDE.md or docs/CARD_DESIGN_QUICKREF.md, even though those documents are now the authoritative visual rendering spec for the project.
**Reason:** NEEDS_DECISION. Without an explicit authority statement for the design guide, agents have no defined priority relationship between CLAUDE.md's visual sections (which conflict with the guide) and the guide itself. The design guide says "if the two files conflict, this guide is authoritative" (referring to itself vs. the quickref), but makes no claim about its authority relative to CLAUDE.md. Owner must decide whether to: (a) add the design guide to the protected files list in CLAUDE.md, (b) explicitly state its precedence over CLAUDE.md's visual sections, or (c) some other resolution.

---

### [KEEP] — Repository Structure
**Lines:** 217–244
**Summary:** Complete directory map: ChaosCreatures/ (iOS), packages/game-server/ (Railway), packages/admin-dashboard/ (Vercel), supabase/ (migrations, functions, seed), scripts/ (58+ scripts), docs/design/ (13+ files with descriptions including all design docs and faction art bible).
**Reason:** Navigation reference for all agents. Not present in the design guide. The guide's §4.2 contains a scaffolding template (`mkdir -p CardGame/{Sources,Resources,...}`) that describes an ideal project structure, but it does not document the actual chaos-creatures repository. KEEP the actual repo map.

---

### [KEEP] — Key Design Decisions (Do Not Contradict)
**Lines:** 246–261
**Summary:** Locked game mechanics: 5 factions with assigned keywords (Augment, Bond, Corruption, Exalt, Persist), Ironwright identity (brutalist space-industrial, NOT steampunk), 2 sub-factions per faction (10 total), 9 keywords (Shield/Lifesteal/Flying/Reach/Deathtouch/Taunt/Piercing/Haste/Ward), Planar Ruins card type, combat rule (declare attackers → defender assigns blockers → simultaneous damage), Taunt rule (forced attack + forced block), main phase only spells, PP-based modifier pools (5 factions × 28 = 140 faction + 30 universal = 170 total), subscription tier modifier selection (Free 2/Mid 3/Top 4 options), Chaos Dust economy, CM cost fixed through evolution, evolution energy thresholds (15/30/50/75, earn 2 per win 1 per loss), instability formula, 10 avatars.
**Reason:** Locked game design decisions governing gameplay mechanics, card behavior, and economy. These have zero overlap with the design guide, which is exclusively about visual rendering. These decisions are the authority for every agent working on game logic, card data models, and economy systems. Do not remove under any circumstances.

---

### [KEEP] — Agent Workflow
**Lines:** 263–268
**Summary:** Orchestrator + sub-agent architecture. Agent definitions in .claude/agents/. Doc pipeline and build pipeline both complete. Current phase: visual polish across 9 waves. References docs/design/13-visual-design-guide.md.
**Reason:** Phase and orchestration status that agents need to orient their work. Not visual spec. References the design guide by name (doc 13) but does not duplicate its content. KEEP.

---

### [KEEP] — Build Phase Protocol — Context Resilience (full subsection)
**Lines:** 270–302
**Summary:** Protocol for surviving context window compaction. Defines: checkpoint file locations per module (game-server, supabase, supabase/functions, admin-dashboard, ChaosCreatures), checkpoint file format (Status, Files Created, Current Task, Test Results, Decisions Made, Next Steps), and the rule to update checkpoint after every file creation and test run.
**Reason:** Agent operational resilience protocol. Not covered in the design guide. Essential for long sessions where compaction is expected. The design guide has its own context management section (§5.6) scoped to the card rendering workflow — that section and this one are complementary, covering different scopes.

---

### [KEEP] — Recovery After Compaction
**Lines:** 304–311
**Summary:** 5-step recovery procedure after context loss: (1) read CHECKPOINT.md, (2) run git log --oneline -10, (3) glob module directory, (4) read existing files before modifying, (5) continue from where checkpoint says.
**Reason:** Agent operational protocol. Not covered by the design guide. Part of the project-wide resilience infrastructure.

---

### [KEEP] — Commit Frequently
**Lines:** 313–318
**Summary:** Commit after every 2–3 files that compile and pass tests. Commit message format: `build({module}): {what was added}`. Never let more than ~500 lines of uncommitted work accumulate.
**Reason:** Git discipline protocol for all agents. Not covered by the design guide.

---

### [KEEP] — Idempotent Execution
**Lines:** 320–327
**Summary:** Agents must check for existing files before creating, skip complete files, continue from partial files, avoid rewriting passing tests. Running an agent twice on the same module must produce the same result.
**Reason:** Agent behavioral protocol for safe re-runs and partial completion recovery. Not covered by the design guide.

---

## Summary Table

| Category | Count |
|----------|-------|
| `KEEP` | 20 |
| `REMOVE_SUPERSEDED` | 3 |
| `REMOVE_CONFLICTING` | 5 |
| `REMOVE_REDUNDANT` | 0 |
| `NEEDS_DECISION` | 2 |
| **TOTAL blocks** | **30** |

---

## Conflict Summary

All five REMOVE_CONFLICTING items require owner decisions before any agent implements card-related work. They are listed here with the specific contradiction spelled out.

---

### Conflict 1 — AI Image Generation Fal.ai Model (Polish Budget block, line 109)

**CLAUDE.md says:** "Visual assets (frames, icons, card backs): AI-generated via fal.ai (~$4 total)." The AI Image Generation line (line 30) says "fal.ai (FLUX Kontext API)."

**Guide says (§3.3):** fal.ai is used, but the model is "fal-ai/flux/dev" (FLUX.1 Dev), not FLUX Kontext. The model endpoint, parameter set (28 steps, guidance_scale 3.5), and API call structure are specific to FLUX.1 Dev. FLUX Kontext is a different model with different call signatures and behavior (it is an image-to-image editing model, not a text-to-image generation model).

**Nature of conflict:** Wrong model specified. Using FLUX Kontext instead of FLUX.1 Dev would require a completely different API call structure and would not produce the same outputs the guide's pipeline is designed around.

---

### Conflict 2 — Faction-Specific Artist References (Art Quality Target, lines 136–140)

**CLAUDE.md says:** Per-faction locked artist anchors — Piranesi + John Martin (Ironwright), Rackham + Dulac (Fey Courts), Hieronymus Bosch (Demonic), Dore + Blake (Celestial), Dore + Goya (The Endless). These are used as style anchors in every prompt for that faction.

**Guide says (§3.2 and §3.3):** Creature prompts reference "N.C. Wyeth style" as a universal anchor. Non-creature prompts reference "N.C. Wyeth influence" and "Hudson River School influence" for landscapes. There are no faction-specific artist references in the guide's prompt templates. The guide's aesthetic system is faction-agnostic in its artist references.

**Nature of conflict:** Architectural incompatibility. CLAUDE.md requires per-faction artist anchors in every prompt. The design guide uses a single universal style anchor across all factions. An agent following CLAUDE.md would build 5 different faction prompt prefixes; an agent following the guide would build one universal prompt template. The faction-art-bible.md and docs/design/03-prompt-templates.md contain the detailed faction system — they are the appropriate location for faction-specific art guidance, not CLAUDE.md.

---

### Conflict 3 — Card Layout Architecture (Card Visual System, lines 150–154)

**CLAUDE.md says:** "Full-art cards with no bordered frames. Art fills the entire card face. A translucent text panel at the bottom contains card name (Cinzel font), stat icons (chaos-motes, sword-atk, heart-hp), faction icon, and flavor text. Rarity treatment applied as a thin edge glow at the card border."

**Guide says (§1.4):** Structured card with precisely measured zones. The art box occupies 45% of card height (132pt out of 294pt) in the center, not the full face. There is a distinct Name Bar at the top (25pt), a Type Line row (18pt), a full Text Box (88pt, 30% of card height) with ability text and flavor text, a Stats Bar (15pt), and a 4pt Rarity Color Bar at the bottom. Rarity is expressed through border weight (3–4pt), inner shadows, outer glows (aged-gold for Rare at 40% opacity; mythic-ember for Mythic at 60%), a rarity color bar, and a WaxSeal component (34×34pt). Not a thin edge glow.

**Nature of conflict:** Fundamental layout architecture. The two layouts are not variations — they are incompatible implementations. The guide's §4.9 smoke test contains working Swift code for the structured layout that would need to be completely rewritten to implement CLAUDE.md's full-art panel design.

---

### Conflict 4 — Font Choices (Card Visual System, line 155)

**CLAUDE.md says:** "Fonts: Cinzel (card names, headers) + Alegreya (body text, flavor text, stats — readable serif). Both from Google Fonts, free, OFL license."

**Guide says (§1.5):** Three font families are specified: Cinzel-Regular and Cinzel-Bold (headings, name bar, type line, collector number), EBGaramond-Regular / Italic / SemiBold (ability text, flavor text, keyword abilities), Oswald-Bold (stats and numbers). Alegreya is entirely absent from the guide. The guide's Info.plist registration block explicitly lists the six font weights to register (Cinzel-Regular, Cinzel-Bold, EBGaramond-Regular, EBGaramond-Italic, EBGaramond-SemiBold, Oswald-Bold). The smoke test view (§4.9) uses `.custom("EBGaramond-Regular", ...)`, `.custom("EBGaramond-Italic", ...)`, and `.custom("Oswald-Bold", ...)` — none use Alegreya.

**Nature of conflict:** Direct naming conflict. Implementing Alegreya instead of EBGaramond + Oswald-Bold would cause the guide's smoke test to fail with font-not-found errors. Any agent reading CLAUDE.md's font spec and the guide's font spec would implement different fonts.

---

### Conflict 5 — Rarity Tier System (Card Visual System, line 159)

**CLAUDE.md says:** Five rarity tiers: Common (matte), Uncommon (metallic sheen), Rare (energy glow, SKAction pulse), Epic (purple shimmer, SKShader), Legendary (gold prismatic, particle emitter). Epic uses purple. Legendary uses gold prismatic.

**Guide says (§2.1 Swift enum, §2.2 shader mappings, §6.6 WaxSealView, §1.4 border weights):** Four rarity tiers: Common, Uncommon, Rare, Mythic. The Swift enum is `enum Rarity: String, Codable { case common, uncommon, rare, mythic }`. The shader parameter table maps these four cases to foilIntensity values (0, 0.3, 0.6, 1.0) and glowIntensity values (0, 0, 0.5, 1.0). The WaxSealView maps rarities to colors: parchment-mid (common), antique-silver (uncommon), aged-gold (rare), mythic-ember (mythic). Mythic uses mythic-ember (#C85A1A, orange-red), not purple. There is no Epic or Legendary case in the guide.

**Nature of conflict:** Data model incompatibility. CLAUDE.md's 5-tier rarity system would require a different Swift enum than the guide specifies. Any code written against the guide's 4-tier system is incompatible with CLAUDE.md's 5-tier system. This must be resolved against the protected files (02-card-data-model.md) to determine the canonical rarity tier count.

---

## NEEDS_DECISION Summary

---

### Decision 1 — Polish Budget font and tool line items

**Location:** Lines 106–113 (Polish Budget block)

**Issue:** The Polish Budget block budgets for Cinzel + Alegreya fonts and "fal.ai" for visual assets. Both of these specifics conflict with the design guide (Cinzel + EBGaramond + Oswald-Bold for fonts; fal.ai FLUX.1 Dev not FLUX Kontext for generation). The overall budget tracking (total remaining, SFX/music sources) is valid and should be KEPT. Only the specific conflicting line items need owner resolution.

**What owner must decide:** (a) Which font set is authoritative — CLAUDE.md's Cinzel + Alegreya or the guide's Cinzel + EBGaramond + Oswald-Bold? (b) Which fal.ai model is authoritative — FLUX Kontext (CLAUDE.md line 30) or FLUX.1 Dev (guide §3.3)?

---

### Decision 2 — CARD_DESIGN_GUIDE.md authority status in Protected Files

**Location:** Lines 206–215 (Protected Files block)

**Issue:** The Protected Files section names only docs/design/00, 01, and 02 as source-of-truth files. docs/CARD_DESIGN_GUIDE.md is not mentioned. Yet the design guide conflicts with CLAUDE.md on five distinct visual/asset decisions (see Conflict Summary above). Without an explicit authority statement, agents have no defined rule for resolving those conflicts.

**What owner must decide:** Should docs/CARD_DESIGN_GUIDE.md be added to the Protected Files list? If so, with what priority relationship to 00/01/02? Specifically: if CLAUDE.md's Card Visual System conflicts with the guide (as it does on rarity tiers, card layout, and fonts), which document wins? The guide is the more recent and detailed authority for visual matters, but the rarity tier conflict (4 vs. 5 tiers) can only be canonically resolved by checking 02-card-data-model.md.
