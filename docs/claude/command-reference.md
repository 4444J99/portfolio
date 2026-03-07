# Command Reference

Complete npm script catalog for the portfolio project, organized by category.

## Build Chain

These run sequentially during `npm run build` (package.json line 23):

| Order | Command | Produces | Reads |
|-------|---------|----------|-------|
| 1 | `npm run generate-badges` | `.quality/quality-metrics.json` | `.quality/*.json`, coverage data |
| 2 | `npm run sync:vitals` | `src/data/vitals.json`, `trust-vitals.json`, `landing.json` | `.quality/*.json`, GitHub API |
| 3 | `npm run sync:omega` | `src/data/omega.json` | `src/data/targets.json` |
| 4 | `npm run sync:identity` | `src/data/about.json` | `src/data/system-metrics.json` |
| 5 | `astro build` | `dist/` | All `src/` files |
| 6 | `npx pagefind --site dist` | `dist/_pagefind/` | Built HTML in `dist/` |

The `dev` script only runs `sync:vitals` then `astro dev`.

## Quality Gates

### Fast checks (no build required)
| Command | What it does |
|---------|-------------|
| `npm run lint` | Biome check (tabs, single quotes, trailing commas, width 100) |
| `npm run lint:fix` | Biome autofix |
| `npm run typecheck` | `astro check` (type diagnostics only, no hint budget) |
| `npm run typecheck:strict` | Hint budget enforcement from ratchet-policy.json |

### Build-first checks (require `npm run build`)
| Command | What it does | External deps |
|---------|-------------|---------------|
| `npm run test` | Vitest unit + integration | — |
| `npm run test:coverage` | Coverage report (V8 provider) | — |
| `npm run test:a11y` | Static axe-core audit on built HTML | — |
| `npm run test:a11y:runtime` | Playwright + axe runtime audit | Playwright browsers |
| `npm run test:e2e:smoke` | Playwright smoke (mobile + desktop) | Playwright browsers |
| `npm run test:runtime:errors` | Runtime error telemetry | Playwright browsers |
| `npm run validate` | HTML validation + internal link check | — |
| `npm run test:perf:budgets` | Date-ratcheted gzip chunk/route budgets | — |
| `npm run lighthouse` | LHCI autorun | Chrome |

### Security
| Command | What it does |
|---------|-------------|
| `npm run test:security` | npm audit + allowlist contract |
| `npm run test:security:prod` | npm audit (production deps only) |
| `npm run test:security:github` | GitHub Advisory delta check |
| `npm run test:security:drift` | Security drift check |

### Composite pipelines
| Command | What it runs | Notes |
|---------|-------------|-------|
| `npm run preflight` | lint → typecheck → build → validate → sync:a11y-routes → check:runtime-route-manifest → test | ~80% of CI failures. Run before pushing. |
| `npm run quality:local:no-lh` | security checks → lint → typecheck:strict → build → all tests → badges → verify → summary | Full CI parity minus Lighthouse |
| `npm run quality:local` | Same as above + Lighthouse | Resource-heavy, needs Chrome |

## Data Sync

| Command | Input | Output |
|---------|-------|--------|
| `npm run generate-data` | `../ingesting-organ-document-structure/` (Python) | `src/data/projects.json`, `essays.json`, `graph.json`, `experience.json`, `system-metrics.json` |
| `npm run sync:vitals` | `.quality/*.json`, GitHub API | `src/data/vitals.json`, `trust-vitals.json`, `landing.json` |
| `npm run sync:omega` | `src/data/targets.json` | `src/data/omega.json` |
| `npm run sync:identity` | `src/data/system-metrics.json` | `src/data/about.json` |
| `npm run sync:github-pages` | GitHub Pages API | `src/data/github-pages.json` |
| `npm run sync:a11y-routes` | `src/pages/`, `personas.json`, `targets.json`, content | `.a11y/routes.json` manifest |
| `npm run sync:workspace-health` | Workspace package analysis | `src/data/workspace-health.json` |

## Strike Intelligence Engine

All require `gemini` CLI. Gracefully degrade with `[DRAFT]` templates if unavailable.

| Command | What it does | Writes to |
|---------|-------------|-----------|
| `npm run strike:new "Company" "Role" ["persona"]` | Create strike target with AI content + OG image | `src/data/targets.json`, `public/og/strikes/` |
| `npm run strike:scout` | AI discovers candidates per persona | `src/data/scout-candidates.json` |
| `npm run strike:sweep` | Batch-process `intake/job-descriptions/` | `src/data/targets.json` (via strike:new) |
| `npm run analyze:strikes` | Analyze operative data | stdout |

## Workspace Package Tests

These use Node's built-in test runner (`node --test`), NOT vitest:

```bash
npm run test:github-pages-core    # packages/github-pages-index-core/
npm run test:quality-ratchet-kit   # packages/quality-ratchet-kit/
npm run test:sketches              # packages/sketches/
```

## Consult Worker (Cloudflare)

```bash
npm run consult:worker:dev              # Local dev via wrangler --remote
npm run consult:worker:deploy           # Deploy to Cloudflare
npm run consult:worker:migrate:local    # Apply D1 migrations locally
npm run consult:worker:migrate:remote   # Apply D1 migrations to prod
```

## Resume & Assets

```bash
npm run build:resume    # Render resume YAML → PDF via orchestrate-resume-pdfs.mjs
npm run build:qr        # Generate QR codes
```

## Quality Reporting

| Command | Output |
|---------|--------|
| `npm run quality:summary` | `.quality/quality-summary.md` |
| `npm run quality:ledger` | `.quality/quality-ledger.json` + `.quality/quality-ledger.md` |
| `npm run quality:green-track` | `.quality/green-run-history.json` |
| `npm run quality:delta` | Quality delta check |
| `npm run verify:quality` | Verify quality contracts |
