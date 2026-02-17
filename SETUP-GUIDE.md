# Chaos Creatures — Multi-Agent Workflow Setup Guide

## Prerequisites

1. **Claude Code installed** — `npm install -g @anthropic-ai/claude-code`
2. **VS Code** with Claude Code extension (or use Claude Code from terminal)
3. **Anthropic API key** configured (Claude Code will prompt you on first run)
4. **Your 3 design docs** ready to copy into the project

---

## Step 1: Create the Project

```bash
mkdir chaos-creatures
cd chaos-creatures
git init
```

## Step 2: Copy the Agent Files

Copy the entire `.claude/` folder from this package into your project root:

```
chaos-creatures/
├── .claude/
│   └── agents/
│       ├── orchestrator.md
│       ├── prompt-engineer.md
│       ├── economy-designer.md
│       ├── tech-architect.md
│       ├── prd-writer.md
│       ├── content-pipeline.md
│       ├── ui-spec-writer.md
│       ├── audio-designer.md
│       └── monetization-analyst.md
├── CLAUDE.md
└── docs/
    └── design/
        ├── 00-game-design-master.md    ← YOUR FILE
        ├── 01-battle-mechanics.md      ← YOUR FILE
        ├── 02-card-data-model.md       ← YOUR FILE
        └── PROGRESS.md
```

## Step 3: Copy Your Design Docs

Copy your 3 completed design docs into `docs/design/`:
- `00-game-design-master.md`
- `01-battle-mechanics.md`
- `02-card-data-model.md`

## Step 4: Open in VS Code

```bash
code .
```

## Step 5: Launch Claude Code

Open the Claude Code terminal panel in VS Code (or run `claude` in your terminal from the project root).

## Step 6: Verify Agents Are Loaded

Type this first to confirm all agents are visible:

```
/agents
```

You should see all 9 agents listed (orchestrator + 8 specialists). If any are missing, check that the `.claude/agents/` files are in the right location.

---

## Step 7: Run the Pipeline

### Option A — Orchestrated (Recommended for First Run)

Copy-paste this starting prompt into Claude Code:

```
Use the orchestrator agent to run the full documentation pipeline for the Chaos Creatures project.

The 3 core design docs are complete in docs/design/ (00, 01, 02). The orchestrator should:

1. Read the core docs to understand the game design
2. Run Wave 1 agents in parallel: prompt-engineer (03), economy-designer (04), content-pipeline (05), tech-architect (06), ui-spec-writer (07), audio-designer (08), monetization-analyst (09)
3. After Wave 1 completes, run the prd-writer (10) to synthesize everything
4. Update PROGRESS.md after each agent completes
5. Run a final validation pass for cross-document consistency

Start with Wave 1 now.
```

### Option B — Manual Agent-by-Agent

If you want more control, invoke agents individually:

```
Use the tech-architect agent to produce docs/design/06-technical-architecture.md. Read all 3 core design docs first, then write the complete technical architecture document.
```

```
Use the prompt-engineer agent to produce docs/design/03-prompt-templates.md. Read the core design docs first, focusing on evolution, factions, and AI model choices.
```

```
Use the economy-designer agent to produce docs/design/04-progression-economy.md. Read the core design docs first, focusing on evolution thresholds, Chaos Dust rates, and subscription tiers.
```

(Repeat for each agent/doc pair.)

### Option C — True Parallelism with Multiple Sessions

For maximum speed, open multiple terminal tabs and run separate Claude Code sessions:

**Terminal 1:**
```bash
cd chaos-creatures
claude
# Then: Use the tech-architect agent to produce docs/design/06-technical-architecture.md
```

**Terminal 2:**
```bash
cd chaos-creatures
claude
# Then: Use the prompt-engineer agent to produce docs/design/03-prompt-templates.md
```

**Terminal 3:**
```bash
cd chaos-creatures
claude
# Then: Use the economy-designer agent to produce docs/design/04-progression-economy.md
```

Each session runs independently with its own context window. They all read from the same design docs and write to separate output files, so there are no conflicts.

After all Wave 1 sessions complete, open a new session for the PRD:

```bash
claude
# Then: Use the prd-writer agent to produce docs/design/10-prd.md. All other docs (03-09) are now complete in docs/design/. Read everything, then write the formal PRD.
```

---

## Agent Summary

| Agent | Output File | Model | Purpose |
|---|---|---|---|
| `orchestrator` | (coordinates) | Opus | Manages task flow, tracks progress, validates consistency |
| `prompt-engineer` | 03-prompt-templates.md | Sonnet | FLUX Kontext prompts, GPT-4o Mini text gen, faction voice |
| `economy-designer` | 04-progression-economy.md | Sonnet | XP curves, Chaos Dust math, quest design, economy modeling |
| `content-pipeline` | 05-content-pipeline.md | Sonnet | Batch card generation, QA, seasonal content plan |
| `tech-architect` | 06-technical-architecture.md | Opus | System architecture, APIs, game server, AI pipeline infra |
| `ui-spec-writer` | 07-ui-ux-specs.md | Sonnet | Screen specs, interaction patterns, mobile UI |
| `audio-designer` | 08-audio-design.md | Sonnet | Music, SFX, faction audio identity, adaptive audio |
| `monetization-analyst` | 09-monetization-details.md | Sonnet | Subscription model, conversion funnels, revenue projections |
| `prd-writer` | 10-prd.md | Opus | Final PRD synthesizing all docs for engineering handoff |

**Model choices:** Opus for the orchestrator, tech architect, and PRD writer (these need the deepest reasoning and cross-referencing). Sonnet for domain specialists (good output quality, faster, cheaper).

---

## Troubleshooting

**Agent not found:** Make sure files are in `.claude/agents/` (not `.claude/agent/` or `agents/`). File extension must be `.md`.

**Agent ignores design docs:** Start your prompt with "Read all docs in docs/design/ first, then..." — agents need explicit instruction to gather context.

**Output too short or shallow:** Resume the agent: "Resume the previous tech-architect agent and expand Section X with more detail."

**Cross-document conflicts after all agents run:** Use the orchestrator: "Use the orchestrator agent to validate all docs in docs/design/ for consistency. Check faction names, numbers, cross-references."

**Context window limits:** If a single agent runs out of context, split the task: "Use the tech-architect agent to write Sections 1-5 of 06-technical-architecture.md" then "Resume the tech-architect agent and write Sections 6-9."

---

## After the Pipeline

Once all 10 docs are complete, you'll have:
- ~15,000+ lines of game design documentation
- A complete PRD ready for engineering handoff
- Technical architecture ready for implementation
- Every system specified to implementation depth

The next step is using Claude Code (without the documentation agents) to actually build the game, starting from the technical architecture and PRD.
