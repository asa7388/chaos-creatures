# Design Overhaul Delivery Prompt
### Instructions for delivering the design guide to your AI agent

---

> This is a design guide that is the single source of truth for this project. It is already present in the repository. This will be a multi-hour, multi-session overhaul of a large codebase with significant existing design tech debt. Before writing a single line of implementation code, complete every step below in order. Do not skip steps, combine steps, or begin implementation until explicitly instructed.

---

## Step 1 — Verify the Guide Files Are Present and Readable

The guide files are already in the repository. Do not download or recreate them. Confirm they exist and are non-empty:

```bash
[ -s docs/CARD_DESIGN_GUIDE.md ]   && echo "Guide OK ($(wc -l < docs/CARD_DESIGN_GUIDE.md) lines)"   || echo "GUIDE MISSING OR EMPTY — do not proceed"
[ -s docs/CARD_DESIGN_QUICKREF.md ] && echo "Quickref OK ($(wc -l < docs/CARD_DESIGN_QUICKREF.md) lines)" || echo "QUICKREF MISSING OR EMPTY — do not proceed"
```

If either check fails, stop and report to the user before doing anything else.

- `docs/CARD_DESIGN_GUIDE.md` — the full guide, authoritative source of truth for all design decisions and implementation
- `docs/CARD_DESIGN_QUICKREF.md` — lookup-only companion (tables, measurements, checklists, no prose)

**The quick reference is a derived summary — if the two files ever conflict, the full guide wins.**

The intended usage pattern: read the full guide at session start and after compaction; use the quick reference for mid-implementation value lookups (specific measurements, timing tables, shader parameters) without re-reading the entire guide.

Do not proceed to Step 1b until both files confirm present.

---

## Step 1b — Audit and Clean Up CLAUDE.md

**Do not add anything to CLAUDE.md yet.** The existing file likely contains conflicting design direction that must be resolved before new content is added. Adding the Design Authority block on top of conflicting content creates two sources of truth fighting each other, which will cause the wrong behavior under context compaction.

### 1b-i. Archive the current file

Before making any changes, copy the current CLAUDE.md to a safe location:

```bash
cp CLAUDE.md docs/CLAUDE_ARCHIVE_$(date +%Y%m%d).md
echo "Archived to docs/CLAUDE_ARCHIVE_$(date +%Y%m%d).md"
```

### 1b-ii. Categorize every section — then stop and wait for approval

Read the entire current CLAUDE.md. Write a categorization of every distinct block of content to `Logs/CLAUDEMD_AUDIT.md`. Assign each block one of the following categories:

```
KEEP
  Essential project config not covered by the design guide.
  Examples: build commands, environment requirements, repo structure
  conventions, non-design agent behavioral rules, CI/CD notes,
  testing infrastructure.

REMOVE_SUPERSEDED
  Design direction, visual decisions, art style guidance, animation
  specs, asset strategy, color decisions, typography, or any other
  content now fully covered by docs/CARD_DESIGN_GUIDE.md.
  This content is not lost — it lives in the guide.

REMOVE_CONFLICTING
  Content that directly contradicts the design guide.
  Note the specific conflict before removing.

REMOVE_REDUNDANT
  Content that duplicates the guide without conflicting, creating
  two places to maintain the same information.

NEEDS_DECISION
  Content that is ambiguous, partially overlapping with the guide,
  or that you are uncertain about. Do not remove these unilaterally.
```

**Present the categorization and wait for user approval before making any deletions. Do not proceed to 1b-iii until the user responds.**

### 1b-iii. Execute the cleanup (only after user approval)

Once the user has approved the categorization:

- Remove all `REMOVE_SUPERSEDED`, `REMOVE_CONFLICTING`, and `REMOVE_REDUNDANT` blocks
- Keep all `KEEP` blocks exactly as they are — do not reword or reorganize them
- For each `REMOVE_CONFLICTING` item, write a one-line note in `Logs/CONFLICTS.md` describing what was removed and what the guide says instead
- Leave `NEEDS_DECISION` items in place with an inline comment: `<!-- NEEDS DECISION: [brief description] -->` so they are visible but do not block the rest of the cleanup
- The goal is a CLAUDE.md that is short, non-redundant, and contains zero design direction — all design direction now lives in the guide

**What a well-cleaned CLAUDE.md looks like when done:**
- The Design Authority block (added in Step 1c, below)
- Project setup and build instructions
- Repo structure conventions
- Non-design agent behavioral rules
- Pointers to key documents
- Nothing about visual design, art direction, animations, colors, typography, or assets

### 1b-iv. Verify the cleanup

```bash
wc -l CLAUDE.md
echo "Conflicts log:"
cat Logs/CONFLICTS.md
```

Report the line count before and after, and list all conflicts that were logged.

---

## Step 1c — Add the Design Authority Block to CLAUDE.md

Only after the cleanup in Step 1b is complete and confirmed, add the following block to the **very top** of CLAUDE.md, above all existing content:

```markdown
## Design Authority — Read Before Any Design or Art Decision

`docs/CARD_DESIGN_GUIDE.md` is the single source of truth for all card visual
design, asset strategy, animation, haptics, sound, layout, and accessibility.
`docs/CARD_DESIGN_QUICKREF.md` is a lookup-only companion for mid-implementation
value lookups. If they conflict, the full guide is authoritative.

RULES:
1. If any file in this repo contradicts the design guide, the design guide wins.
   Update or annotate the contradicting file to note the conflict.
2. Any deviation from the guide requires explicit user approval before implementation.
   State the conflict, your reason for the deviation, and wait for confirmation.
3. At the start of every new session or after any context compaction event,
   re-read the full guide before doing any work. Do not rely on memory.
4. At the start of every implementation task, re-read the specific guide section
   for that task — not just your notes about it. Use the Table of Contents.
5. During active implementation, use CARD_DESIGN_QUICKREF.md for specific value
   lookups (measurements, timings, tables) without re-reading the full guide.
6. When in doubt: stop, re-read, then proceed.

COMPACTION RECOVERY PROTOCOL:
If you detect that your context has been compacted or summarized, or if you
are unsure whether compaction has occurred (assume it has if uncertain):
  a. Stop all implementation work immediately
  b. Read docs/CARD_DESIGN_GUIDE.md in full
  c. Read Logs/MASTER_STATE.json
  d. Read Logs/iteration_log.md (last 10 entries)
  e. Write a brief recovery confirmation to Logs/iteration_log.md noting
     what you re-read and your current understanding of state
  f. Only then resume work
```

Also add the following implementation rules block to CLAUDE.md. These are permanent for the duration of the overhaul:

```markdown
## Implementation Rules — Design Overhaul (Active)

SESSION START PROTOCOL (every session, no exceptions):
1. Read Logs/MASTER_STATE.json — confirm current phase and next task
2. Read Logs/iteration_log.md — last 10 entries minimum
3. Read the specific guide section relevant to today's task
4. Write a one-line confirmation to iteration_log.md before writing any code

COMPACTION DETECTION:
If you are unsure whether compaction has occurred, assume it has.
Run the full compaction recovery protocol from the Design Authority block above.

PHASE DISCIPLINE:
- Complete one phase fully before starting the next
- A phase is complete only when its exit criteria from Section 12.5 of the
  guide are met — not when it "looks right"
- Take simulator screenshots at the end of every phase
- Write a structured critique using the Section 12.3 template before marking
  any phase done
- Never mark a phase complete without running the exit criteria checklist

CONFLICT HANDLING:
If you encounter a conflict between the guide and existing implementation:
- Do not resolve it unilaterally
- Write the conflict to Logs/CONFLICTS.md: file, line number, what exists,
  what the guide requires, your recommended resolution
- Flag it in iteration_log.md
- Proceed to the next non-conflicted task and return when the user responds

NEVER:
- Rely on in-context memory of the guide — always re-read the relevant section
- Skip the screenshot and critique step at the end of a phase
- Proceed past a hard gate (smoke test, haptic gate) without user sign-off
- Make a design decision not covered by the guide without user approval
- Bundle multiple phases into a single session without explicit user permission
- Mark a haptic interaction as complete without physical device verification
```

---

## Step 2 — Read the Guide Completely

Read `docs/CARD_DESIGN_GUIDE.md` from start to finish, including the addendum. This is not skimmable. The guide contains specific pixel measurements, shader parameter mappings, exact animation timings, pre-build verification checklists, and LoRA deployment instructions that cannot be reconstructed from summaries. Every detail matters.

After reading, write the following to `Logs/iteration_log.md`:

```
## Guide Read Confirmation — [timestamp]
Guide read in full: docs/CARD_DESIGN_GUIDE.md
Sections read: 1 through 14 + Addendum

Top 3 sections expected to require most significant changes:
1. [section name] — [one sentence reason]
2. [section name] — [one sentence reason]
3. [section name] — [one sentence reason]

Deployment parameters confirmed:
- iOS minimum: iOS 16
- Devices: iPhone + iPad
- Chip baseline: A14+
- LoRA file location: https://pub-ab96c6d0742748d19e4ad5502f3fea09.r2.dev/training/chscrt-sdxl-lora.safetensors (R2 public URL, accessed via Replicate extra_lora param — see Section 3.2)
- Asset generation budget: $10.00
```

Do not proceed to Step 3 until this log entry is written.

---

## Step 3 — Multiagent Audit

The codebase is large enough that a single-agent audit will either exhaust context or produce a shallow result. Structure the audit using focused passes — one guide section group at a time. If Claude Code subagents are available, spawn one per group below. If not, conduct sequential focused passes, completing and writing each audit file before starting the next.

### 3a. Create the audit coordination document

Create `Logs/AUDIT_MASTER.md`:

```markdown
# Design Audit Master
## Status: [ ] Not started | [→] In progress | [✓] Complete | [!] Blocked

[ ] Section 1:  Aesthetic System & Design Language
[ ] Section 2:  Card Data Schema & Templating
[ ] Section 3:  Asset Strategy & LoRA
[ ] Section 4:  Environment & Tool Setup
[ ] Section 5:  Agent Tool-Use Techniques
[ ] Section 6:  Effects & Animations
[ ] Section 7:  Haptics
[ ] Section 8:  Sound
[ ] Section 9:  iPad Layout
[ ] Section 10: Accessibility
[ ] Section 11: Production Workflow
[ ] Section 12: Iterative Testing
[ ] Section 13: Performance Profiling
[ ] Section 14: Quality Bar
```

### 3b. Audit Agent assignments

Each agent or focused pass must:
1. Read `docs/CARD_DESIGN_GUIDE.md` in full before examining any code
2. Read `Logs/AUDIT_MASTER.md` to confirm its assigned sections
3. Search the codebase for all files relevant to its sections
4. For each relevant file: note what is compliant, what is non-compliant (with file name and line number), and what is entirely absent
5. Write findings to `Logs/AUDIT_[SECTION_NAME].md`
6. Update `Logs/AUDIT_MASTER.md` marking each completed section `[✓]`
7. Not begin the next section until the current section's audit file is written and complete

---

**Audit Agent A — Visual & Design**
Assigned sections: 1, 2, 6, 9, 14
Primary files to examine: all `Views/`, `Shaders/`, any existing `CALayer`/`SpriteKit`/`MTKView`/`Metal` code, layout files, any existing color or typography definitions

For each file found, assess against:
- Precise card layout proportions (Section 1.4 measurements table)
- Typography specification (Section 1.5 font and size table)
- Color palette compliance (Section 1.2 — P3 values)
- State transition animation specs (Section 1.6 timing and curve table)
- Card back implementation (Section 1.8)
- Error/fallback states (Section 1.9)
- Dark mode aesthetic (Section 1.3)
- Gesture priority ordering (Section 1.7)
- Shader implementations (Section 6.1–6.5)
- iPad size class handling (Section 9)

---

**Audit Agent B — Assets & Pipeline**
Assigned sections: 3, 4, 8, 11
Primary files to examine: `Resources/`, `Scripts/`, `Assets.xcassets/`, build phases, `Makefile` or equivalent, any existing generation scripts, sound files, font files, texture files

For each file found, assess against:
- Asset catalog structure and ASTC compression settings (Section 4.6)
- Font registration in Info.plist (Section 1.5)
- LoRA deployment configuration (Section 3.2)
- Normal map assets (Section 3.5)
- Foil gradient texture (Section 3.6)
- Color grading pipeline (Section 3.4)
- Art box compositing spec (Section 3.7)
- License manifest existence and completeness (Section 3.9)
- Sound assets and processing pipeline (Section 8)
- Budget ledger existence (Section 11.1)

---

**Audit Agent C — Systems & Quality**
Assigned sections: 5, 7, 10, 12, 13
Primary files to examine: any haptic manager classes, audio engine classes, test targets, `Logs/` directory, accessibility annotations in views, Instruments configurations, performance notes

For each file found, assess against:
- HapticEngine implementation (Section 7.2)
- AHAP files existence (Section 7.2 — list of required files)
- SoundEngine implementation (Section 8.3)
- VoiceOver labels on card components (Section 10.1)
- Dynamic Type scaling (Section 10.2)
- Reduce Motion handling (Section 10.3)
- Color contrast audit results (Section 10.4)
- Visual regression script existence (Section 12.2)
- Structured critique log existence (Section 12.3)
- Instruments profiling history (Section 13.1)
- Texture cache implementation (Section 13.4)
- Memory warning handling (Section 13.5)

---

### 3c. Audit completion gate

Before proceeding to Step 4, confirm:

```bash
ls Logs/AUDIT_*.md
grep "\[ \]" Logs/AUDIT_MASTER.md | wc -l
# Must return 0 — all sections must be marked complete
```

Do not proceed to Step 4 if any section is incomplete.

---

## Step 4 — Consolidate the Audit

Read all `Logs/AUDIT_*.md` files and produce two documents.

### 4a. Gap Analysis

Write `Logs/GAP_ANALYSIS.md`. This is a flat list of every gap found across all audit sections, categorized as follows:

```
CONFLICT   — existing implementation directly contradicts the guide
PARTIAL    — implementation exists but needs modification to meet the guide
ABSENT     — feature or spec is entirely missing from the codebase
COMPLIANT  — no action needed (list these briefly for completeness)
```

Format each entry as:

```markdown
### [CATEGORY] [Section N.N] — [Short description]
**File:** path/to/file.swift (line XX)
**Current:** [what exists now]
**Required:** [what the guide specifies]
**Recommended action:** [what needs to happen]
```

### 4b. Implementation Plan

Write `Logs/IMPLEMENTATION_PLAN.md`. This is a sequenced work plan that:

- Orders work to respect guide dependencies (schema before views, environment before effects, smoke test before any shader work)
- Groups related changes into discrete named phases
- Marks the following as **hard gates requiring user sign-off before proceeding**:
  - Smoke test (Section 4.9) — user must see all four simulator screenshots
  - Haptic verification (Section 7.3) — user must confirm on physical device
- Flags any CONFLICT items that require a user decision before work can begin, listed at the top of the plan under "Decisions Required Before Starting"
- Notes which phases can run in parallel and which must be sequential

### 4c. Present and wait

Present both `Logs/GAP_ANALYSIS.md` and `Logs/IMPLEMENTATION_PLAN.md` to the user.

**Do not begin any implementation work until the user explicitly approves the plan.**

---

## Step 5 — Implementation

Begin only after the user has approved the implementation plan in Step 4.

Work through the plan one phase at a time. At the end of each phase:

1. Take simulator screenshots on all four required devices:
   - iPhone 15 Pro
   - iPhone 12
   - iPad Pro 12.9-inch (6th generation)
   - iPad Air (5th generation)
2. Write a structured critique using the exact template from Section 12.3 of the guide
3. Run the visual regression script from Section 12.2
4. Present screenshots and critique to the user before beginning the next phase

Do not bundle multiple phases into a single pass without explicit user permission.

---

## Additional Context

Fill in the following before delivering this prompt:

- **Custom LoRA:** Stored on Cloudflare R2 at `https://pub-ab96c6d0742748d19e4ad5502f3fea09.r2.dev/training/chscrt-sdxl-lora.safetensors` and accessed via Replicate's `extra_lora` parameter. This URL is already populated in the `.env` template in Section 4.5 of the design guide as `LORA_URL`. Do not push the LoRA to Replicate as a custom model — load it directly from the R2 URL at inference time. Verify R2 reachability before every generation session using the check in Section 3.2.
- **LoRA deployment:** Replicate exclusively — see Section 3.2 of the design guide for the full generation call, scale tuning guide, and failure handling. Do not attempt to run the LoRA via any other service.
- **Total asset generation budget:** `$10.00` (split across Replicate creature artwork, fal.ai non-creature artwork and icons, and Claude API text generation — track all in BUDGET_LEDGER.md)
- **For conflicting existing code:** refactor in place rather than rewrite where possible, to preserve any non-design logic in existing files
- **Physical device haptic testing:** will be coordinated by the user — flag each haptic interaction as `⚠️ PENDING PHYSICAL DEVICE VERIFICATION` in the iteration log rather than self-verifying
- **Smoke test gate:** when reached, show the user all four simulator screenshots and wait for explicit approval before proceeding to effects work

---

## Quick Reference: Key Log Files

The following files must exist and be kept current throughout the overhaul. The agent must update them at the end of every work session.

| File | Purpose |
|------|---------|
| `docs/CARD_DESIGN_GUIDE.md` | Single source of truth — never modify |
| `docs/CARD_DESIGN_QUICKREF.md` | Lookup companion — never modify |
| `docs/CLAUDE_ARCHIVE_[date].md` | Pre-cleanup CLAUDE.md backup |
| `Logs/MASTER_STATE.json` | Current phase, task queue, budget remaining |
| `Logs/iteration_log.md` | Per-iteration work log with structured critiques |
| `Logs/AUDIT_MASTER.md` | Audit section completion tracker |
| `Logs/AUDIT_[SECTION].md` | Per-section audit findings |
| `Logs/GAP_ANALYSIS.md` | Consolidated gap list from audit |
| `Logs/IMPLEMENTATION_PLAN.md` | Approved sequenced work plan |
| `Logs/CONFLICTS.md` | All conflicts found, logged with file + line |
| `Logs/BUDGET_LEDGER.md` | Every API call logged with cost |
| `Logs/CLAUDEMD_AUDIT.md` | CLAUDE.md categorization before cleanup |
| `Resources/ASSET_LICENSE_MANIFEST.md` | Every asset with license and commercial status |

If any of these files does not exist at the start of a session, create it before doing any other work.

---

## Compaction Recovery — Standalone Reference

If context compaction is detected or suspected at any point during the overhaul, stop immediately and run this protocol in full before resuming:

1. Read `docs/CARD_DESIGN_GUIDE.md` in full
2. Read `Logs/MASTER_STATE.json`
3. Read `Logs/iteration_log.md` — last 10 entries
4. Read `Logs/IMPLEMENTATION_PLAN.md`
5. Write a recovery confirmation entry to `Logs/iteration_log.md`:

```markdown
## Compaction Recovery — [timestamp]
Re-read: CARD_DESIGN_GUIDE.md, MASTER_STATE.json, iteration_log.md, IMPLEMENTATION_PLAN.md
Current phase: [phase name from plan]
Next task: [specific next action]
Known conflicts pending user decision: [list or "none"]
Budget remaining: [from BUDGET_LEDGER.md]
Proceeding with: [one sentence describing what you are about to do]
```

6. Only then resume work

The compaction recovery protocol exists because context compaction does not just truncate recent messages — it compresses the *texture* of the guide into summaries. Precise measurements, shader parameter mappings, exact animation timings, and exit criteria checklists do not survive compaction accurately. Re-reading from disk is the only reliable way to restore them.
