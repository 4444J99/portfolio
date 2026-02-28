# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # Dev server at localhost:4321/portfolio/ (auto-runs sync:vitals)
npm run build          # Production build → dist/ (auto-runs generate-badges, sync:vitals, sync:omega, pagefind)
npm run preview        # Preview production build

# Testing
npm run test                    # Unit + integration tests (vitest, config at .config/vitest.config.ts)
npm run test:coverage           # Coverage report (V8)
npm run test:a11y               # Static accessibility audit (axe-core on built HTML)
npm run test:a11y:runtime       # Runtime browser a11y (Playwright + axe)
npm run test:e2e:smoke          # Playwright smoke suite (mobile + desktop)
npm run test:runtime:errors     # Runtime error telemetry (desktop + mobile viewports)
npm run test:security           # npm audit + allowlist contract
npm run test:perf:budgets       # Date-ratcheted gzip chunk/route budgets

# Quality gates
npm run typecheck               # Astro check (type diagnostics)
npm run typecheck:strict        # Ratcheted hint budget (fails if hints > threshold)
npm run quality:local:no-lh    # Full CI-parity quality pipeline, skips Lighthouse (recommended locally)
npm run quality:local           # Same + Lighthouse (resource-heavy, needs Chrome)
npm run validate                # HTML validation + internal link check
npm run generate-badges         # Regenerate quality badges + metrics JSON

# Data sync
npm run sync:vitals             # Sync trust metrics (auto-run by dev/build)
npm run sync:omega              # Sync omega maturity scorecard from targets.json
npm run sync:github-pages       # Sync GitHub Pages index data
npm run generate-data           # Regenerate src/data/ from sibling repo (requires ../ingesting-organ-document-structure/)

# Strike Intelligence Engine
npm run strike:new "Company" "Role" ["persona-id"]  # Create strike target with AI-generated content
npm run strike:scout            # AI discovers candidates matching personas via gemini CLI
npm run strike:sweep            # Batch-process intake/job-descriptions/ into strike targets

# Workspace package tests (Node built-in test runner, NOT vitest)
npm run test:github-pages-core  # packages/github-pages-index-core/
npm run test:quality-ratchet-kit # packages/quality-ratchet-kit/
npm run test:sketches           # packages/sketches/
```

**Running single vitest tests:**
```bash
npx vitest run src/data/__tests__/data-integrity.test.ts -c .config/vitest.config.ts
npx vitest run -t "test name pattern" -c .config/vitest.config.ts
```

**Build-first tests:** a11y, E2E smoke, runtime errors, and build-output tests all require `npm run build` first.

## Architecture

**Astro 5** static site deployed to GitHub Pages at `https://4444j99.github.io/portfolio/`.

### Key Constraint: Base Path

All internal links and assets must account for the `/portfolio` base path configured in `astro.config.mjs`. Use relative paths or Astro's built-in path handling.

### Routing

Pages in `src/pages/` map to URLs via Astro file-based routing. ~20 project case-study pages under `src/pages/projects/` plus top-level pages (index, about, resume, dashboard, essays, omega, gallery, etc.).

**Dynamic routes:**
- `src/pages/for/[target].astro` — persona-targeted application pages (driven by `targets.json` + `personas.json`)
- `src/pages/resume/[slug].astro` — per-persona resume pages with data enrichment from project catalog
- `src/pages/og/[...slug].png.ts` — OG image generation at build time (satori + resvg-js)
- `src/pages/feed.xml.ts`, `github-pages.json.ts`, `github-pages.xml.ts` — API/RSS endpoints

### Persona System

`src/data/personas.json` defines career personas (e.g., `ai-systems-engineer`, `systems-architect`). Each persona has: `id`, `title`, `thesis`, `stack`, `featured_projects`, `market_summary`, `sketchId`. Personas drive:
- **Resume pages** (`/resume/[slug]`) — each persona renders a tailored resume with enriched project data
- **Strike targets** (`/for/[target]`) — persona-specific application landing pages
- **AI content generation** — scout/strike scripts use persona context in gemini prompts

### Strike Intelligence Engine

Three-component AI recruitment system using the `gemini` CLI for content generation:
1. **Scout** (`scripts/scout-agent.mjs`) — discovers candidates per persona, writes to `src/data/scout-candidates.json`
2. **Strike** (`scripts/strike-new.mjs`) — creates a target in `src/data/targets.json` + generates OG image at `public/og/strikes/`
3. **Operative Sweep** (`scripts/operative-sweep.mjs`) — batch-processes `intake/job-descriptions/*.txt` into strike targets

All three gracefully degrade with `[DRAFT]` templates if gemini is unavailable.

### Omega System (Maturity Scorecard)

`src/data/omega.json` tracks system maturity across horizons and criteria (met/in_progress/not_started). `sync-omega.mjs` reactively updates omega criteria from `targets.json` counts. `src/pages/omega.astro` renders a color-coded scorecard with progress bars.

### Styling

**No CSS framework.** Global design system via CSS custom properties in `src/styles/global.css`. Components add scoped styles.

- Colors: dark theme (`#0a0a0b` base), gold (`--accent: #d4a853`) / burnt sienna (`--accent-hover: #c4463a`)
- Typography: `--font-heading: 'Syne'`, `--font-body: 'Plus Jakarta Sans'`, `--font-mono: 'JetBrains Mono'`
- Spacing: Fibonacci-influenced rem scale (`--space-2xs` through `--space-4xl`)
- Layout: `--max-width: 1100px`, `--max-width-narrow: 740px`
- Responsive: 768px mobile breakpoint, `clamp()` fluid typography

Self-hosted fonts (woff2) in `public/fonts/`. Use existing custom properties rather than hardcoding values.

### Quality Ratchet System

`.quality/` is a committed directory with policy JSONs and runtime artifacts.

- `ratchet-policy.json` — phase-based coverage/typecheck thresholds (currently **W10**: 45/32/32/45 stmt/branch/func/line). `.config/vitest.config.ts` reads coverage floors from this file at config time. Override with `QUALITY_PHASE` env var.
- `security-policy.json` — date-based security ratchet checkpoints with allowlist contract (max 14-day entries).
- `scripts/check-bundle-budgets.mjs` — date-ratcheted chunk/route gzip budgets.
- Regression guards in `ratchet-policy.json` prevent metric drops: max 3% coverage drop, max 5pt Lighthouse perf drop, zero security severity increases.
- **Critical**: `quality-governance.test.ts` parses `README.md` ratchet values and asserts they match the JSON policy files. Changing thresholds in JSON without updating README (or vice versa) fails tests.
- CODEOWNERS protects policy files.

### Dual Portfolio View

`data-portfolio-view="engineering"|"creative"` attribute on `<main>` controls tag/tagline visibility. `IndexFilters.astro` handles the client-side toggle (AbortController pattern for cleanup). `ProjectCard.astro` uses `:global([data-portfolio-view="..."]) .card__tags--creative` scoped CSS selectors to show/hide per-view content.

### View Transition Lifecycle

`Layout.astro` uses Astro's `<ClientRouter />` for view transitions. Pattern: `astro:page-load` → initialize, `astro:before-swap` → teardown. Background sketch canvas persists via `transition:persist`.

### p5.js Generative Art

Full-page canvas (`#bg-canvas`, z-index -1, `pointer-events: none`) renders generative art behind all content. The `packages/sketches/` package exports 30 named sketches (atoms, conductor, hero, spiral, swarm, etc.) with a typed registry (`SketchName` type) and shared `PALETTE` color system. Resume pages bind specific sketches via `persona.sketchId`.

### Chart System (D3)

Separate from p5.js. Lives in `src/components/charts/` with `chart-loader.ts` (dynamic imports), `chart-theme.ts` (design-system tokens), and 8+ chart modules. Own test suite in `src/components/charts/__tests__/`.

### Workspace Packages

Three local npm workspace packages in `packages/`:

| Package | Import Name | Test Runner | Purpose |
|---------|-------------|-------------|---------|
| `github-pages-index-core` | `@meta-organvm/github-pages-index-core` | Node built-in | GitHub Pages indexing + telemetry |
| `quality-ratchet-kit` | `@4444j99/quality-ratchet-kit` | Node built-in | Ratchet policy loading, phase resolution, governance sync validation |
| `sketches` | `@4444j99/sketches` | Node built-in | p5.js sketch registry, palette, typed exports |

### Vitest Configuration

Config lives at `.config/vitest.config.ts` (not project root). Key details:
- Path alias: `@` → `src/`
- Test pattern: `src/**/__tests__/**/*.test.ts` and `scripts/**/__tests__/**/*.test.ts`
- Setup file: `src/test/setup.ts` (stubs canvas APIs for jsdom)
- Coverage excludes `.astro` files and sketch implementations

### Build: Manual Chunks

`astro.config.mjs` splits large vendors: `vendor-p5`, `vendor-mermaid`, `vendor-cytoscape`, `vendor-katex`. Chunk warning limit is 1800kB.

### CI/CD

Three GitHub Actions workflows in `.github/workflows/`:
- **quality.yml** — all quality gates on push/PR (security, vitest, a11y, Playwright E2E, validation, budgets, Lighthouse)
- **deploy.yml** — builds and deploys to GitHub Pages (gated on quality.yml success via `workflow_run`)
- **build-resume.yml** — renders resume YAML → PDF/DOCX via RenderCV + Pandoc, creates GitHub Release

### Data Pipeline

`src/data/` contains JSON files generated by `npm run generate-data` from `../ingesting-organ-document-structure/`. Key data files: `personas.json`, `targets.json`, `omega.json`, `scout-candidates.json`, `projects.json`, `github-pages.json`. `src/data/schema-person.ts` exports Schema.org person data.

## Conventions

- **TypeScript strict mode** via `astro/tsconfigs/strict`
- **ESM only** (`"type": "module"`)
- Components use TypeScript Props interfaces and component-scoped `<style>` blocks
- Astro directives: `class:list` for conditional classes, `is:inline` for client-side scripts
- Commit messages: imperative mood, conventional prefixes (`feat:`, `fix:`, `chore:`)
- `lodash-es` pinned to 4.17.23 in overrides (prototype pollution fix)

## Debugging

- **Styles not applying**: CSS is component-scoped by default. Shared styles go in `global.css`; use custom properties.
- **Base path issues**: All routes and assets live under `/portfolio`. Check relative paths.
- **Mobile menu broken**: Header uses `is:inline` script — check it's not accidentally bundled.
- **Build chunk warnings**: Vite chunk limit is 1800kB. Monitor `npm run build` output.
- **Tests failing on build output**: a11y, E2E smoke, and runtime error tests require `npm run build` first.
- **Lighthouse fails locally**: Needs Chrome. Check `.config/lighthouserc.cjs` for thresholds.
- **Governance test failures**: Changed a threshold in `.quality/*.json` without updating `README.md` (or vice versa). Both must stay in sync.
- **Strike scripts fail**: Require `gemini` CLI installed and accessible. Scripts fall back to `[DRAFT]` templates on failure.
