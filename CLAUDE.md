# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # Dev server at localhost:4321/portfolio/ (auto-runs sync:vitals)
npm run build          # Production build → dist/ (auto-runs sync:vitals + pagefind indexing)
npm run preview        # Preview production build
npm run generate-data  # Regenerate src/data/ from sibling repo (requires ../ingesting-organ-document-structure/)

# Testing
npm run test                    # Unit + integration tests (vitest)
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
npm run quality:local           # Security gates + full quality pipeline (CI-parity)
npm run test:ci                 # Alias for quality:local
npm run validate                # HTML validation + internal link check
npm run lighthouse              # Lighthouse CI performance budgets
npm run generate-badges         # Regenerate quality badges + metrics JSON

# Data sync
npm run sync:vitals             # Sync trust metrics (auto-run by dev/build)
npm run sync:github-pages       # Sync GitHub Pages index data
npm run test:github-pages-core  # Node built-in test runner (not vitest) for packages/github-pages-index-core/
```

**Running single tests:**
```bash
npx vitest run src/data/__tests__/data-integrity.test.ts   # single test file
npx vitest run -t "test name pattern"                       # by name
```

**Build-first tests:** Build-output tests, a11y tests, E2E smoke, and runtime error tests all require `npm run build` first. Playwright smoke auto-starts preview via playwright config.

## Architecture

**Astro 5** static site deployed to GitHub Pages at `https://4444j99.github.io/portfolio/`.

### Key Constraint: Base Path

All internal links and assets must account for the `/portfolio` base path configured in `astro.config.mjs`. Use relative paths or Astro's built-in path handling.

### Routing

Pages in `src/pages/` map directly to URLs (Astro file-based routing). 20 project case-study pages under `src/pages/projects/` plus top-level pages: index, about, resume, dashboard, essays, architecture, community, consult, products, gallery, omega, philosophy, github-pages, and 404.

**Dynamic routes:**
- `src/pages/for/[target].astro` — persona-targeted application pages (driven by `targets.json` + `personas.json`)
- `src/pages/resume/[slug].astro` — dynamic resume persona pages
- `src/pages/og/[...slug].png.ts` — OG image generation at build time (satori + resvg-js)
- `src/pages/feed.xml.ts`, `github-pages.json.ts`, `github-pages.xml.ts` — API/RSS endpoints

### Styling

**No CSS framework.** One global stylesheet (`src/styles/global.css`) defines the design system via CSS custom properties. Components add scoped styles on top.

- Colors: dark theme (`#0a0a0b` base), gold (`--accent: #d4a853`) / burnt sienna (`--accent-hover: #c4463a`)
- Typography: `--font-heading: 'Syne'`, `--font-body: 'Plus Jakarta Sans'`, `--font-mono: 'JetBrains Mono'`
- Spacing: Fibonacci-influenced rem scale (`--space-2xs` through `--space-4xl`)
- Layout: `--max-width: 1100px`, `--max-width-narrow: 740px`
- Responsive: 768px mobile breakpoint, `clamp()` fluid typography

Self-hosted fonts (woff2) in `public/fonts/`. Use existing custom properties rather than hardcoding values.

### Quality Ratchet System

`.quality/` is a committed directory with policy JSONs and runtime artifacts.

- `ratchet-policy.json` — phase-based coverage/typecheck thresholds (currently W6). `vitest.config.ts` reads coverage floors from this file at config time.
- `security-policy.json` — date-based security ratchet checkpoints with allowlist contract (max 14-day entries).
- `scripts/check-bundle-budgets.mjs` — date-ratcheted chunk/route gzip budgets.
- **Critical**: `quality-governance.test.ts` parses `README.md` ratchet values and asserts they match the JSON policy files. Changing thresholds in JSON without updating README (or vice versa) fails tests.
- CODEOWNERS protects policy files.

### Deploy Gate

`deploy.yml` triggers on `quality.yml` workflow success (`workflow_run` with `completed` + `conclusion == 'success'`), not on direct push to main. Quality must pass before any deployment.

### Dual Portfolio View

`data-portfolio-view="engineering"|"creative"` attribute on `<main>` controls tag/tagline visibility. `IndexFilters.astro` handles the client-side toggle (AbortController pattern for cleanup). `ProjectCard.astro` uses `:global([data-portfolio-view="..."]) .card__tags--creative` scoped CSS selectors to show/hide per-view content.

### View Transition Lifecycle

`Layout.astro` uses Astro's `<ClientRouter />` for view transitions. Pattern: `astro:page-load` → initialize components, `astro:before-swap` → teardown. Background sketch canvas persists across navigations via `transition:persist`. Project cards use `transition:name` for heading animation.

### Chart System (D3)

Separate from p5.js sketches. Lives in `src/components/charts/` with `chart-loader.ts` (dynamic imports), `chart-theme.ts` (design-system-aligned tokens), and 8+ chart modules. Own test suite in `src/components/charts/__tests__/`.

### p5.js Background

Full-page canvas (`#bg-canvas`, z-index -1, `pointer-events: none`) renders generative art. Three visual modes via `data-bg-mode` on `<body>`: subtle, bold, extreme — each applies different CSS filter/saturation rules in `global.css`.

### Pagefind Search

Full-text search index generated at build time (`npx pagefind --site dist`, integrated into `npm run build`). `Search.astro` component provides the UI.

### Data Pipeline

`src/data/` contains JSON files generated by `npm run generate-data` from a sibling repo. Imported at build time by Astro pages. `src/data/schema-person.ts` exports Schema.org person data for `SchemaOrg.astro`.

### Local Workspace Package

`packages/github-pages-index-core/` is a workspace dependency (`@meta-organvm/github-pages-index-core`). Tests use **Node's built-in test runner**, not vitest: `npm run test:github-pages-core`.

### CI/CD

Three GitHub Actions workflows in `.github/workflows/`:
- **quality.yml** — runs all quality gates on push/PR (security, vitest, a11y, Playwright E2E, HTML validation, link check, bundle budgets, Lighthouse CI)
- **deploy.yml** — builds and deploys to GitHub Pages (gated on quality.yml success)
- **build-resume.yml** — renders resume YAML → PDF/DOCX via RenderCV + Pandoc, creates GitHub Release

## Conventions

- **TypeScript strict mode** via `astro/tsconfigs/strict`
- **ESM only** (`"type": "module"` in package.json)
- All components use TypeScript Props interfaces and component-scoped `<style>` blocks
- Astro directives: `class:list` for conditional classes, `is:inline` for client-side scripts that shouldn't be bundled
- Commit messages: imperative mood, conventional-ish prefixes (`feat:`, `fix:`, `chore:`)
- Accessibility: ARIA attributes on interactive elements, `prefers-reduced-motion` media query, semantic HTML
- `lodash-es` pinned to 4.17.23 in package.json overrides (prototype pollution fix)

## Debugging

- **Styles not applying**: CSS is component-scoped by default. Shared styles go in `global.css`; use custom properties for values.
- **Base path issues**: All routes and assets live under `/portfolio`. Check relative paths.
- **Mobile menu broken**: Header uses `is:inline` script — check it's not accidentally bundled.
- **Build chunk warnings**: Vite chunk limit is 1200kB (set for p5.js). Monitor `npm run build` output.
- **Tests failing on build output**: Build-output, a11y, E2E smoke, and runtime error tests require `npm run build` first.
- **Lighthouse fails locally**: Needs Chrome installed. CI uses `ubuntu-latest` which has Chrome. Check `lighthouserc.cjs` for score thresholds.
- **Governance test failures**: If `quality-governance.test.ts` fails, you likely changed a threshold in `.quality/*.json` without updating the matching value in `README.md` (or vice versa). Both must stay in sync.
