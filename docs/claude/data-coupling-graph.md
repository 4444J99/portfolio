# Data Coupling Graph

Full producer/consumer map for all data files and quality artifacts in the portfolio project.

## Build-Time Data Flow

```
                        generate-data (Python)
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    projects.json       essays.json        system-metrics.json
    graph.json          experience.json         │
          │                   │           sync:identity
          │                   │                 ▼
          │                   │            about.json
          │                   │
          └─────────┬─────────┘
                    ▼
              astro build ──────────► dist/
                    │
              pagefind ──────────► dist/_pagefind/

  .quality/*.json ──► sync:vitals ──► vitals.json
                                      trust-vitals.json
                                      landing.json

  targets.json ─────► sync:omega ──► omega.json (criterion 5: "met" if count > 0)

  generate-badges ──► .quality/quality-metrics.json
```

## src/data/ Files

### projects.json
- **Producer**: `npm run generate-data` (Python script from `../ingesting-organ-document-structure/`)
- **Consumers**: `src/data/project-catalog.ts`, `src/data/project-index.ts`, `src/pages/projects/*.astro`, `ProjectCard.astro`, `ProjectGrid.astro`
- **Shape invariants** (enforced by `data-integrity.test.ts`):
  - `total_curated === projects.length`
  - All projects have `name`, `org`, `organ`, `description`, `tier`, `implementation_status`
  - `tier` in `['flagship','standard','infrastructure','archive']`
  - `implementation_status` in `['ACTIVE','DESIGN_ONLY','ARCHIVED']`
- **Generated only** — do not hand-edit

### essays.json
- **Producer**: `npm run generate-data`
- **Consumers**: `src/pages/essays.astro`, `src/pages/logos/[slug].astro`, `src/pages/feed.xml.ts`
- **Shape invariants**: `total === essays.length`, all have `title`/`slug`/`date`/`url`, `date` is valid ISO
- **Generated only**

### graph.json
- **Producer**: `npm run generate-data`
- **Consumers**: `src/pages/architecture.astro` (Cytoscape visualization)
- **Shape invariants**: `total_nodes === nodes.length`, `total_edges === edges.length`, every edge source/target references an existing node ID
- **Generated only**

### experience.json
- **Producer**: `npm run generate-data`
- **Consumers**: `src/pages/resume.astro`, `src/pages/resume/[slug].astro`
- **Generated only**

### system-metrics.json
- **Producer**: `npm run generate-data` (copied from sibling repo)
- **Consumers**: `src/pages/dashboard.astro`, `sync:identity` → `about.json`
- **Shape invariants**: Has `system`, `registry`, `omega`, `essays`, `sprints`, `github_issues`, `sprint_history`. Status counts sum to `total_repos`.
- **Generated only**

### personas.json
- **Producer**: Hand-authored
- **Consumers**: `src/pages/resume/[slug].astro`, `src/pages/for/[target].astro`, scout/strike scripts, OG image generation
- **Fields**: `id`, `title`, `thesis`, `stack`, `featured_projects`, `market_summary`, `sketchId`
- **Safe to hand-edit** — adding/removing personas requires `npm run sync:a11y-routes`

### targets.json
- **Producer**: `npm run strike:new`, `npm run strike:sweep` (AI-generated), hand-editable
- **Consumers**: `src/pages/for/[target].astro`, `sync:omega` (reactive coupling), data-integrity test
- **Invariant**: No target may have `[DRAFT]` in `intro` field (enforced by test)
- **Safe to hand-edit** — adding/removing targets requires `npm run sync:a11y-routes`

### omega.json
- **Producer**: `npm run sync:omega` (reactive: reads targets.json count)
- **Consumers**: `src/pages/omega.astro`
- **Generated only** — changes overwritten by sync

### vitals.json, trust-vitals.json, landing.json
- **Producer**: `npm run sync:vitals` (reads `.quality/*.json`, GitHub API)
- **Consumers**: `src/pages/index.astro` (landing), `src/pages/dashboard.astro` (vitals)
- **Generated only**

### about.json
- **Producer**: `npm run sync:identity` (reads system-metrics.json)
- **Consumers**: `src/pages/about.astro`
- **Generated only**

### scout-candidates.json
- **Producer**: `npm run strike:scout` (gemini CLI per persona)
- **Consumers**: `src/pages/dashboard.astro`
- **Safe to hand-edit**

### github-pages.json
- **Producer**: `npm run sync:github-pages`
- **Consumers**: `src/pages/github-pages.json.ts`, `src/pages/github-pages.xml.ts`
- **Generated only**

### github-pages-curation.json
- **Producer**: Hand-authored (curation overrides for GitHub Pages index)
- **Consumers**: `sync:github-pages` script
- **Safe to hand-edit**

### schema-person.ts
- **Producer**: Hand-authored
- **Consumers**: `Layout.astro` (Schema.org microdata)
- **Safe to hand-edit**

## .quality/ Files

### ratchet-policy.json
- **Writers**: Hand-authored, `advance-ratchet-phase.mjs`
- **Readers**: `.config/vitest.config.ts` (coverage floors at config time), `scripts/check-typecheck-hints.mjs` (hint budget), `quality-governance.test.ts` (README sync), `sync:vitals` (for vitals output)
- **Constraint**: Must contain phase matching `QUALITY_PHASE` env var (default: `defaultPhase` field)

### security-policy.json
- **Writers**: Hand-authored
- **Readers**: `scripts/security-audit.mjs`, `quality-governance.test.ts` (README sync)
- **Constraint**: Checkpoints must match README security ratchet line

### quality-metrics.json
- **Writer**: `npm run generate-badges`
- **Readers**: `sync:vitals` → included in vitals output

### CI-generated artifacts (not committed)
- `vitest-report.json`, `security-summary.json`, `e2e-smoke-summary.json`, `runtime-errors-summary.json`, `perf-summary.json`, etc.
- Written by quality scripts during CI, uploaded as workflow artifacts, consolidated in finalize job

## Reactive Couplings (code paths)

### 1. targets.json → omega.json
`scripts/sync-omega.mjs` reads `targets.json`, counts entries, marks omega criterion 5 as `"met"` if count > 0. Runs during `npm run build` chain.

### 2. .quality/*.json → vitals/trust/landing
`scripts/sync-trust-metrics.mjs` reads all `.quality/` policy files plus quality metrics, computes trust scores, writes `vitals.json`, `trust-vitals.json`, `landing.json`. Runs during both `dev` and `build`.

### 3. system-metrics.json → about.json
`scripts/sync-identity.mjs` reads `system-metrics.json`, extracts system summary, writes `about.json`. Runs during `npm run build` chain.
