# CLAUDE.md

Astro 5 static site. GitHub Pages at `https://4444j99.github.io/portfolio/`. Node >= 22.

## Commands

```bash
# Daily workflow
npm run dev              # Dev server → localhost:4321/portfolio/
npm run build            # Full build chain → dist/
npm run preflight        # Pre-push gate (~80% of CI failures). Run before every push.
npm run lint:fix         # Biome autofix (tabs, single quotes, trailing commas, width 100)
npm run test             # Vitest unit + integration (-c .config/vitest.config.ts)
npm run typecheck:strict # Ratcheted hint budget (fails if hints > threshold)
npm run quality:local:no-lh  # Full CI-parity quality pipeline, no Lighthouse

# Single test
npx vitest run src/data/__tests__/data-integrity.test.ts -c .config/vitest.config.ts
npx vitest run -t "test name pattern" -c .config/vitest.config.ts

# Build-first tests (require npm run build)
npm run test:a11y        # axe-core on built HTML
npm run test:e2e:smoke   # Playwright smoke (mobile + desktop)
npm run test:runtime:errors  # Runtime error telemetry

# Data sync
npm run sync:vitals      # Trust metrics → vitals.json, trust-vitals.json, landing.json
npm run sync:omega       # Maturity scorecard → omega.json
npm run sync:identity    # Identity data → about.json
npm run generate-data    # Regenerate src/data/ from sibling Python repo
```

Full command catalog: [`docs/claude/command-reference.md`](docs/claude/command-reference.md)

## Invariants

**If you violate these, CI breaks.** Every row is enforced; there are no warnings-only.

| If you change... | You MUST also... | Enforced by |
|---|---|---|
| Coverage thresholds in `.quality/ratchet-policy.json` | Update `README.md` coverage ratchet line (exact regex) | `quality-governance.test.ts` |
| Lighthouse scores in `.config/lighthouserc.cjs` | Update `README.md` `Perf >= N` line | `quality-governance.test.ts` |
| Security checkpoints in `.quality/security-policy.json` | Update `README.md` security ratchet line | `quality-governance.test.ts` |
| Hint budgets in `.quality/ratchet-policy.json` | Update `README.md` hint budget line | `quality-governance.test.ts` |
| `defaultPhase` in `ratchet-policy.json` | Update `QUALITY_PHASE` in `quality.yml` line 19 | `quality-governance.test.ts` |
| Add/remove page in `src/pages/` | Run `npm run sync:a11y-routes` | `check-runtime-route-manifest.mjs` |
| Add/remove persona in `personas.json` | Run `npm run sync:a11y-routes` | `check-runtime-route-manifest.mjs` |
| Add/remove target in `targets.json` | Run `npm run sync:a11y-routes` | `check-runtime-route-manifest.mjs` |
| Add/remove essay in `src/content/logos/` | Run `npm run sync:a11y-routes` | `check-runtime-route-manifest.mjs` |
| `base` in `astro.config.mjs` (currently `/portfolio`) | ALL links, `canonicalBase` in `src/utils/paths.ts`, GitHub Pages config | **Nothing automated** — total breakage |
| Remove `src/test/setup.ts` | Fix `setupFiles` in `.config/vitest.config.ts` | **Nothing** — all sketch tests fail silently |
| Set `QUALITY_PHASE` to unknown phase | Ensure phase exists in `ratchet-policy.json` | `vitest.config.ts` crashes at startup |

**Governance test mechanics**: `quality-governance.test.ts` parses `README.md` with regexes and asserts exact numeric match against `.quality/*.json` and `.config/lighthouserc.cjs`. Both sides must be changed **in the same commit**.

## Build & Data Pipeline

### Build chain (sequential — any failure stops all)

```
generate-badges → sync:vitals → sync:omega → sync:identity → astro build → pagefind
```

Defined in `package.json` line 23. The `dev` script only runs `sync:vitals` before `astro dev`.

### Reactive data couplings

1. `targets.json` count > 0 → `sync:omega` marks omega criterion 5 as `"met"`
2. `.quality/*.json` → `sync:vitals` → `vitals.json` + `trust-vitals.json` + `landing.json`
3. `system-metrics.json` → `sync:identity` → `about.json` system_summary

### Data producers (who writes `src/data/`)

| Script | Writes to |
|--------|-----------|
| `generate-data` | projects.json, essays.json, graph.json, experience.json, system-metrics.json |
| `sync:vitals` | vitals.json, trust-vitals.json, landing.json |
| `sync:omega` | omega.json |
| `sync:identity` | about.json |
| `strike:new` / `strike:sweep` | targets.json |
| `scout-agent` | scout-candidates.json |
| `sync:github-pages` | github-pages.json |
| `generate-badges` | .quality/quality-metrics.json |

**Safe to hand-edit**: `personas.json`, `targets.json`, `github-pages-curation.json`. All others are generated — edits will be overwritten.

Full coupling graph with line numbers: [`docs/claude/data-coupling-graph.md`](docs/claude/data-coupling-graph.md)

## House Style

### Component anatomy

```astro
---
interface Props {
  title: string;
  items: Item[];
}
const { title, items } = Astro.props;
---

<section class="my-block">
  <h2 class="my-block__title">{title}</h2>
  {items.map((item) => (
    <div class="my-block__item">{item.name}</div>
  ))}
</section>

<style>
  .my-block {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-xl);
    transition: all var(--transition-base);
  }
  .my-block__title {
    font-family: var(--font-heading);
    color: var(--accent-text);
  }
</style>
```

**Rules**:
- Props interface at top of frontmatter, single destructure from `Astro.props`
- Scoped `<style>` block, BEM naming (`.block`, `.block__element`, `.block--modifier`)
- All values from CSS custom properties — never hardcode colors, spacing, fonts, transitions
- Data attributes for state-driven CSS: `data-portfolio-view`, `data-active`, etc.
- `:global([data-portfolio-view="..."])` for cross-component view switching

### CSS design tokens (never hardcode)

```
Colors:    --bg-primary (#0a0a0b), --bg-card (#181818), --border (#2a2a2a)
           --text-primary (#fff), --text-secondary (#b0b0b0), --text-muted (#707070)
           --accent (#d4a853 gold), --accent-hover (#c4463a burnt sienna)
           --success (#10b981), --failure (#ef4444), --warning (#f59e0b)
Fonts:     --font-heading (Syne), --font-body (Plus Jakarta Sans), --font-mono (JetBrains Mono)
Spacing:   --space-2xs (0.25rem) through --space-4xl (6rem), Fibonacci-influenced
Layout:    --max-width (1100px), --max-width-narrow (740px), 768px mobile breakpoint
Radius:    --radius-sm (0.25rem), --radius-md (0.5rem), --radius-lg (1rem)
Motion:    --transition-fast (150ms), --transition-base (250ms), --transition-slow (400ms)
Z-index:   --z-hidden (-1), --z-base (0), --z-dropdown (100), --z-sticky (200), --z-modal (1000)
Shadows:   --shadow-sm through --shadow-2xl
```

Self-hosted fonts (woff2) in `public/fonts/`. Fluid typography via `clamp()`.

### Client-side patterns

- **View transitions**: `astro:page-load` → init, `astro:before-swap` → teardown. Background canvas persists via `transition:persist`.
- **Cleanup**: AbortController for event listeners; `teardownPage()` removes per-page p5/D3 instances but preserves `#bg-canvas`.
- **Lazy loading**: IntersectionObserver (200px rootMargin), unobserve after init.
- **Throttling**: MAX_CONCURRENT=4 for p5.js sketch init, queue-based.
- **Deferred init**: RequestIdleCallback for above-fold, PerformanceObserver for post-LCP background sketch.
- **Reduced motion**: 60 warmup frames then `noLoop()` when `prefers-reduced-motion: reduce`.
- **State**: Singleton pattern via localStorage + data attributes on `<main>` for CSS-driven view switching.

### Import conventions

- `@/` alias → `src/` (Astro built-in, also configured in vitest)
- `{ base }` from `src/utils/paths.ts` for ALL dynamic URLs: `` `${base}projects/${slug}/` ``
- Workspace packages: `@4444j99/sketches`, `@4444j99/quality-ratchet-kit`, `@meta-organvm/github-pages-index-core`
- Import order: Astro utilities → components (alphabetical) → data → utilities
- Static JSON imports processed at build time; dynamic imports for lazy modules

Full annotated examples: [`docs/claude/house-style.md`](docs/claude/house-style.md)

## Architecture

### File tree

```
src/
  pages/           # Astro file-based routing
    index.astro    # Homepage with dual engineering/creative view
    about.astro, resume.astro, dashboard.astro, omega.astro, ...
    projects/      # 21 case-study pages
    for/[target].astro     # Strike target landing pages (from targets.json + personas.json)
    resume/[slug].astro    # Per-persona resumes (from personas.json, sketchId binds bg art)
    logos/[slug].astro     # Essay pages (from src/content/logos/)
    og/[...slug].png.ts    # OG image generation (satori + resvg-js)
    feed.xml.ts, github-pages.json.ts  # API/RSS endpoints
  components/      # Astro components, scoped styles
    charts/        # D3 chart system (chart-loader.ts, chart-theme.ts, 8+ modules)
    scripts/       # Client lifecycle (SketchLifecycle, ClientBootstrap, ScrollReveal)
  layouts/Layout.astro  # All pages wrap this. Provides head, nav, footer, bg canvas, view transitions.
  data/            # Generated JSON (see Data Pipeline above). Hand-edit only personas/targets/curation.
  styles/global.css     # Design system (791 lines of custom properties). THE source of truth for tokens.
  utils/paths.ts        # Exports base, canonicalBase. Use for all dynamic URLs.
  test/setup.ts         # Canvas API stubs for jsdom. Required by vitest config.
packages/
  sketches/        # 30 named p5.js sketches, typed registry (SketchName), shared PALETTE
  quality-ratchet-kit/  # Policy loading, phase resolution, governance sync
  github-pages-index-core/  # GitHub Pages indexing + telemetry
.quality/          # Committed policy JSONs + CI artifacts
.config/           # Vitest, Playwright, Lighthouse configs (NOT project root)
workers/consult-api/  # Cloudflare Worker + D1 (consultation request API)
scripts/           # Build/sync/quality/strike scripts (all .mjs)
```

### Key subsystems (one-liner each)

- **Dual portfolio view**: `data-portfolio-view` attribute on `<main>` toggles engineering/creative tags via CSS `:global()` selectors
- **p5.js canvas**: Full-page `#bg-canvas` (z-index -1, pointer-events none) with 30 sketches; resume pages bind via `persona.sketchId`
- **Chart system**: D3 charts in `src/components/charts/`, loaded via `chart-loader.ts` dynamic imports, themed via `chart-theme.ts`
- **Persona system**: `personas.json` drives resume pages, strike targets, scout prompts, and sketch bindings
- **Strike engine**: Three scripts (strike-new, scout-agent, operative-sweep) using gemini CLI; graceful `[DRAFT]` fallback if unavailable
- **Omega scorecard**: `omega.json` tracks maturity criteria; `sync-omega.mjs` reactively updates from targets.json counts
- **Quality ratchet**: Phase-based thresholds in `.quality/ratchet-policy.json`; vitest config reads coverage floors at startup
- **Consult worker**: Cloudflare Worker at `workers/consult-api/` backed by D1, own wrangler config and migrations

### Manual chunks (astro.config.mjs)

`vendor-p5`, `vendor-mermaid`, `vendor-cytoscape`, `vendor-katex`. Chunk warning limit 1800kB. New large vendors need their own chunk definition.

## CI/CD

### Pipeline topology

```
quality.yml (push/PR/daily 9:17 UTC)
  ├─ security          (npm audit + allowlist)
  ├─ lint-and-typecheck (biome + astro check + hint budget)
  ├─ build             (full chain → uploads dist/ + src/data/ artifacts)
  │   ├─ test-unit     (vitest, downloads artifacts)
  │   ├─ test-a11y     (axe-core + runtime a11y, downloads dist/)
  │   ├─ test-e2e      (Playwright smoke, downloads dist/)
  │   └─ performance   (bundle budgets + Lighthouse)
  └─ finalize          (if: always(), consolidates all artifacts, runs governance test)

deploy.yml (workflow_run on quality success | schedule | manual)
  └─ build + deploy to gh-pages branch
```

### CI failure modes

- **Empty artifact cascade**: If `npm run build` fails, `dist/` artifact is empty. All downstream jobs fail with 404s/import errors.
- **Silent schedule disable**: Malformed cron in quality.yml silently stops scheduled runs. No alert.
- **Artifact retention**: 1-day retention. Manual retry after 24h finds deleted artifacts.
- **Finalize consolidation**: `cp -r ... 2>/dev/null || true` silences errors. Failed consolidation goes undetected.
- **Deploy bypass**: `workflow_dispatch` always deploys regardless of quality status (intentional manual override).
- **Secret dependency**: `PUBLIC_CONSULT_API_BASE` secret required for deploy build. Deleted secret = silent build failure. <!-- allow-secret -->

### Environment variables

- `QUALITY_PHASE=W12` (quality.yml line 19) — must match a phase in `ratchet-policy.json`
- `PUBLIC_CONSULT_API_BASE` (deploy.yml secret) — Cloudflare Worker URL

## Testing

### Configuration

All configs in `.config/` (not project root):
- **Vitest** — `.config/vitest.config.ts`: jsdom environment, `@` → `src/`, setup file `src/test/setup.ts` (canvas stubs), coverage excludes `.astro` and sketch implementations. Coverage thresholds loaded from `.quality/ratchet-policy.json` at config parse time.
- **Playwright** — `.config/playwright.smoke.config.ts`: mobile + desktop viewports
- **Lighthouse** — `scripts/lighthouse-ci.mjs`: programmatic API runner with inline thresholds

### Current phase: W12

Coverage floors: 55/40/40/55 (stmt/branch/func/line). Hint budget: 0. Test suite: **496 tests** (vitest unit + integration + workspace packages). Security: **0 vulnerabilities** (npm audit — all severity levels allowlisted, no upstream fixes available as of 2026-03-21).

### Workspace package tests

Use Node's built-in test runner (`node --test`), NOT vitest:
```bash
npm run test:github-pages-core
npm run test:quality-ratchet-kit
npm run test:sketches
```

### Data integrity tests

`src/data/__tests__/data-integrity.test.ts` validates JSON shape invariants: project fields, essay dates, graph edge referential integrity, no `[DRAFT]` in targets, system-metrics status counts sum to total. If `generate-data` produces malformed JSON, these catch it.

## Debugging

| Symptom | Root cause | Fix |
|---------|-----------|-----|
| Governance test fails | Changed threshold in `.quality/*.json` OR `README.md` but not both | Update both in same commit. Check exact regex in `quality-governance.test.ts` |
| Vitest crashes before running | `.quality/ratchet-policy.json` missing/malformed OR `QUALITY_PHASE` set to nonexistent phase | Verify file exists and phase name matches |
| Routes 404 in dev/preview | Base path mismatch | All URLs must use `${base}` from `src/utils/paths.ts`. Check `astro.config.mjs` line 9. |
| Styles not applying | CSS is component-scoped | Shared styles in `global.css`. Use custom properties. Cross-component: `:global()` |
| Sketch tests fail silently | `src/test/setup.ts` not loaded | Verify `setupFiles` in `.config/vitest.config.ts` points to it |
| Build-output tests fail | No `dist/` directory | Run `npm run build` first (a11y, E2E, runtime tests need built HTML) |
| Mobile menu broken | Header uses `is:inline` script | Check it's not accidentally bundled by Astro |
| Chunk size warnings | Large vendor without manual chunk | Add chunk definition in `astro.config.mjs` `manualChunks` |
| Strike scripts produce `[DRAFT]` | gemini CLI unavailable or API error | Install gemini CLI, or manually edit the intro before committing |
| Route manifest mismatch | Added/removed page without syncing | Run `npm run sync:a11y-routes` |
| Lighthouse fails locally | Needs Chrome | Run `npm run quality:local:no-lh` instead |
| CI passes but deploy blocked | quality.yml failed on a previous run | Check `workflow_run` trigger; manual deploy via `workflow_dispatch` |

## Conventions

- **TypeScript strict mode** (`astro/tsconfigs/strict`), **ESM only** (`"type": "module"`)
- **Biome** (not ESLint): tabs, single quotes, trailing commas, line width 100. Config at `biome.json`.
- **Commit messages**: imperative mood, conventional prefixes (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`)
- **Astro directives**: `class:list` for conditional classes, `is:inline` for client-side scripts
- `lodash` and `lodash-es` overridden to `>=4.18.1` (code injection + prototype pollution fixes)

## Companion References

- [`docs/claude/data-coupling-graph.md`](docs/claude/data-coupling-graph.md) — full producer/consumer map with line numbers
- [`docs/claude/command-reference.md`](docs/claude/command-reference.md) — complete npm script catalog by category
- [`docs/claude/house-style.md`](docs/claude/house-style.md) — annotated component, page, sketch, and chart patterns
- [`.quality/GOVERNANCE-COUPLING.md`](.quality/GOVERNANCE-COUPLING.md) — CI-specific coupling map and environment thresholds

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


**Prompting (Anthropic)**: context 200K tokens, format: XML tags, thinking: extended thinking (budget_tokens)


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
