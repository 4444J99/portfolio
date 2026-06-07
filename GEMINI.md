# Portfolio — Gemini CLI Context

This project is a high-performance, quality-ratcheted personal portfolio for Anthony James Padavano, built with Astro 5 and TypeScript. It features a sophisticated design system, generative p5.js backgrounds, and D3.js data visualizations.

## Project Overview

- **Purpose:** Professional portfolio showcasing 20+ case studies, interactive art, and system metrics.
- **Core Framework:** **Astro 5** (Static Site Generation).
- **Interactive Layers:** **p5.js** (Generative background/gallery) and **D3.js** (Interactive data charts).
- **Organization:** Structured around an "Eight-Organ System" (Theoria, Poiesis, Ergon, Taxis, Logos, Koinonia, Kerygma, Meta).
- **Key Constraint:** Deployed to GitHub Pages at the **`/portfolio`** base path. All internal links and assets must be relative or handled via Astro's path utilities.

## Tech Stack

- **Frontend:** Astro 5, TypeScript, Vanilla CSS (Design Tokens).
- **Data:** JSON-driven architecture (`src/data/`), often synced from sibling repositories.
- **Visualization:** D3.js for charts, p5.js for generative art.
- **Search:** Pagefind (static search index generated at build time).
- **Runtime Environment:** Node.js >= 22.

## Building and Running

### Development
```bash
npm install
npm run dev          # Local dev server at localhost:4321/portfolio/
```

### Production
```bash
npm run build        # Build → dist/ (includes Pagefind indexing)
npm run preview      # Preview production build
```

### Data Management
```bash
npm run generate-data  # Regenerate local data from sibling repos
npm run sync:vitals    # Sync performance/trust metrics
npm run sync:github-pages # Sync external GitHub Pages index
```

## Quality & Testing Pipeline

This project enforces a rigorous **Quality Ratchet** system via the `.quality/` directory and custom scripts.

### Core Testing Commands
- **Unit/Integration:** `npm run test` (Vitest).
- **Coverage:** `npm run test:coverage` (Phase-based floors in `ratchet-policy.json`).
- **Accessibility:** `npm run test:a11y` (Static) and `npm run test:a11y:runtime` (Playwright + axe).
- **E2E/Smoke:** `npm run test:e2e:smoke` (Playwright).
- **Security:** `npm run test:security` (npm audit + custom allowlist contracts).
- **Performance:** `npm run lighthouse` (Local CI) or `npm run lighthouse:cloud` (PSI API).
- **Budgets:** `npm run test:perf:budgets` (Enforces route + chunk gzip size limits).

### Deployment Gate
Deployments only trigger via GitHub Actions (`deploy.yml`) after the full `quality.yml` workflow passes successfully.

## Development Conventions

- **Design System:** No CSS frameworks. Use CSS custom properties in `src/styles/global.css`.
- **Spacing:** Fibonacci-influenced scale (`--space-2xs` to `--space-5xl`).
- **Styling:** Component-scoped `<style>` blocks in `.astro` files.
- **TypeScript:** Strict mode enabled. Use Props interfaces for all components.
- **ESM:** The project is ESM-only (`"type": "module"`).
- **View Transitions:** Uses Astro's `<ClientRouter />`. Use `astro:page-load` for initialization and `astro:before-swap` for teardown.
- **Commit Messages:** Imperative mood with conventional prefixes (`feat:`, `fix:`, `chore:`, `docs:`).

## Architecture & Directory Structure

- `src/components/`: Reusable Astro components (grouped by category like `charts/`, `dashboard/`).
- `src/data/`: JSON datasets and corresponding TypeScript types.
- `src/pages/`: File-based routing (note the `/portfolio` base path requirement).
- `src/styles/`: Global design system and theme variables.
- `scripts/`: Custom build and quality automation (JS/MJS and some Python).
- `.quality/`: Policy JSONs and metric artifacts for the ratchet system.
- `packages/`: Local workspace packages (e.g., `github-pages-index-core`).

## Governance Note
`quality-governance.test.ts` ensures that `README.md` threshold documentation stays in sync with the JSON policies in `.quality/`. Updates to one require updates to the other to pass CI.

<!-- ORGANVM:AUTO:START -->
## System Context (auto-generated — do not edit)

**Organ:** PERSONAL (Personal / Liminal) | **Tier:** flagship | **Status:** PUBLIC_PROCESS
**Org:** `4444j99` | **Repo:** `portfolio`

### Edges
- *No inter-repo edges declared in seed.yaml*

### Siblings in Personal / Liminal
`domus-genoma`, `system-system--system`, `hokage-chess`, `_portal`

### Governance
- *Standard ORGANVM governance applies*

*Last synced: 2026-06-07T14:00:33Z*

## Active Handoff Protocol

If `.conductor/active-handoff.md` exists, **READ IT FIRST** before doing any work.
It contains constraints, locked files, conventions, and completed work from the
originating agent. You MUST honor all constraints listed there.

If the handoff says "CROSS-VERIFICATION REQUIRED", your self-assessment will
NOT be trusted. A different agent will verify your output against these constraints.

## Session Review Protocol

At the end of each session that produces or modifies files:
1. Run `organvm session review --latest` to get a session summary
2. Check for unimplemented plans: `organvm session plans --project .`
3. Export significant sessions: `organvm session export <id> --slug <slug>`
4. Run `organvm prompts distill --dry-run` to detect uncovered operational patterns

Transcripts are on-demand (never committed):
- `organvm session transcript <id>` — conversation summary
- `organvm session transcript <id> --unabridged` — full audit trail
- `organvm session prompts <id>` — human prompts only


## System Library

Plans: 269 indexed | Chains: 5 available | SOPs: 18 active
Discover: `organvm plans search <query>` | `organvm chains list` | `organvm sop lifecycle`
Library: `/Users/4jp/Code/organvm/praxis-perpetua/library`


## Active Directives

| Scope | Phase | Name | Description |
|-------|-------|------|-------------|
| system | any | atomic-clock | The Atomic Clock |
| system | any | execution-sequence | Execution Sequence |
| system | any | multi-agent-dispatch | Multi-Agent Dispatch |
| system | any | session-handoff-avalanche | Session Handoff Avalanche |
| system | any | system-loops | System Loops |
| system | any | prompting-standards | Prompting Standards |
| system | any | prompting-standards | Prompting Standards |
| system | any | prompting-standards | Prompting Standards |
| system | any | background-task-resilience | background-task-resilience |
| system | any | context-window-conservation | context-window-conservation |
| system | any | session-self-critique | session-self-critique |
| system | any | the-descent-protocol | the-descent-protocol |
| system | any | the-membrane-protocol | the-membrane-protocol |
| system | any | theory-to-concrete-gate | theory-to-concrete-gate |
| system | any | triangulation-protocol | triangulation-protocol |
| unknown | any | SOP-application-genesis | SOP: Application Submission Genesis (Pilot implementation of SPEC-023) |
| unknown | any | diagnostic-inter-rater-agreement | SOP: Diagnostic Inter-Rater Agreement (IRA) Grade Norming |
| unknown | any | SOP-001_REPOSITORY_SEEDING | SOP-001: Repository Seeding Procedure |
| unknown | any | SOP-002_WORKSPACE_AUDIT | SOP-002: Comprehensive Workspace Audit Procedure |
| unknown | any | SOP-003_GOVERNANCE_PROMOTION | SOP-003: Governance Promotion Procedure |
| unknown | any | SOP-004_SEED_YAML_VALIDATION | SOP-004: Seed.yaml Validation Procedure |
| unknown | any | SOP-005_ORGAN_CLASSIFICATION | SOP-005: Organ Classification Procedure |
| unknown | any | SOP-006_PHASE_TRANSITION | SOP-006: Phase Transition Procedure |
| unknown | any | SOP-007_CLAUDE_MD_GENERATION | SOP-007: CLAUDE.md Generation Procedure |
| unknown | any | SOP-008_DEPENDENCY_MAPPING | SOP-008: Dependency Mapping Procedure |
| unknown | any | SOP-009_IRF_ASSIGNMENT | SOP-009: IRF Assignment Procedure |
| unknown | any | SOP-010_MULTI_REPO_ORCHESTRATION | SOP-010: Multi-Repo Orchestration Procedure |

Linked skills: SOP-TRIADIC-REVIEW-PROTOCOL, cicd-resilience-and-recovery, continuous-learning-agent, evaluation-to-growth, genesis-dna, multi-agent-workforce-planner, promotion-and-state-transitions, quality-gate-baseline-calibration, repo-onboarding-and-habitat-creation, session-self-critique, structural-integrity-audit, the-membrane-protocol, triple-reference


**Prompting (Google)**: context 1M tokens (Gemini 1.5 Pro), format: markdown, thinking: thinking mode (thinkingConfig)


## External Mirrors (Network Testament)

- **technical** (3): withastro/astro, microsoft/TypeScript, vitest-dev/vitest

Convergences: 2 | Run: `organvm network map --repo portfolio` | `organvm network suggest`


## Task Queue (from pipeline)

**228** pending tasks | Last pipeline: unknown

- `409935c01615` Engine — similarity_engine.py [astro, cloudflare, p5.js]
- `9ebc34b18470` Output — similarity-clusters.json [astro, cloudflare, p5.js]
- `ccc0db168edf` Report — SIMILARITY-REPORT.md [astro, cloudflare, p5.js]
- `07a91cde2e2e` Portfolio — ACTIVE (P1) [astro, cloudflare, p5.js]
- `45fba9e2c5ce` Client sites — UNKNOWN [astro, cloudflare, p5.js]
- `2a99dbecff79` ORGAN-II — OPERATIONAL [astro, cloudflare, p5.js]
- `ca9794c3bde2` Registry — AUTHORITATIVE [astro, cloudflare, p5.js]
- `57d7bb37e7ae` A — 1777490789085.md [vercel]
- ... and 220 more

Cross-organ links: 2227 | Top tags: `chezmoi`, `bash`, `python`, `go`, `mcp`

Run: `organvm atoms pipeline --write && organvm atoms fanout --write`


## System Density (auto-generated)

AMMOI: 25% | Edges: 0 | Tensions: 0 | Clusters: 0 | Adv: 27 | Events(24h): 38806
Structure: 8 organs / 149 repos / 1654 components (depth 17) | Inference: 0% | Organs: META-ORGANVM:63%, ORGAN-I:53%, ORGAN-II:48%, ORGAN-III:55% +5 more
Last pulse: 2026-06-07T14:00:21 | Δ24h: n/a | Δ7d: n/a


## Logos Documentation Layer

**Status:** MISSING | **Symmetry:** 0.5 (GHOST)

Nature demands a documentation counterpart. This formation maintains its narrative record in `docs/logos/`.

### The Tetradic Counterpart
- **[Telos (Idealized Form)](../docs/logos/telos.md)** — The dream and theoretical grounding.
- **[Pragma (Concrete State)](../docs/logos/pragma.md)** — The honest account of what exists.
- **[Praxis (Remediation Plan)](../docs/logos/praxis.md)** — The attack vectors for evolution.
- **[Receptio (Reception)](../docs/logos/receptio.md)** — The account of the constructed polis.

### Alchemical I/O
- **[Source & Transmutation](../docs/logos/alchemical-io.md)** — Narrative of inputs, process, and returns.

- **[Public Essay](https://organvm-v-logos.github.io/public-process/)** — System-wide narrative entry.

*Compliance: Implementation exists without record.*

<!-- ORGANVM:AUTO:END -->
