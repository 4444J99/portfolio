# Portfolio — Anthony James Padavano

[![Live Site](https://img.shields.io/badge/Live-4444j99.github.io/portfolio-00BCD4?style=flat)](https://4444j99.github.io/portfolio/)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Quality Gates](https://github.com/4444j99/portfolio/actions/workflows/quality.yml/badge.svg)](https://github.com/4444j99/portfolio/actions/workflows/quality.yml)

Personal portfolio site showcasing 20 project case studies, an interactive p5.js generative hero, and an embedded resume — organized around an [eight-organ creative system](https://github.com/meta-organvm) spanning 91 repositories and 8 GitHub organizations.

**Live:** [4444j99.github.io/portfolio](https://4444j99.github.io/portfolio/)

![Portfolio Preview](homepage-full.png)

## Tech Stack

- **Framework:** [Astro](https://astro.build/) — static site generation with zero JS by default
- **Interactive:** [p5.js](https://p5js.org/) — generative art hero visualization
- **Visualizations:** [D3.js](https://d3js.org/) — 8 interactive data charts
- **Typography:** Syne + Plus Jakarta Sans + JetBrains Mono (self-hosted woff2)
- **Deployment:** GitHub Pages via GitHub Actions
- **Theme:** Dynamic dark/light system with gold (`#d4a853`) / burnt sienna (`#c4463a`) accents

## Quality Infrastructure

Every push runs automated quality gates via [GitHub Actions](.github/workflows/quality.yml), plus a daily [security drift monitor](.github/workflows/security-drift.yml):

| Gate | Tool | Threshold |
|------|------|-----------|
| Security audit | `npm audit` (contract scripts) | Unsuppressed Critical = 0, High = 0, policy-ratcheted Moderate/Low |
| GitHub advisory delta | Dependabot Alerts API contract | Open alerts = 0 (critical/high/moderate/low) |
| Unit & integration tests | [Vitest](https://vitest.dev/) | All pass |
| Coverage floor (ratcheted) | [Vitest Coverage](https://vitest.dev/guide/coverage) | Statements ≥ 25, Branches ≥ 18, Functions ≥ 18, Lines ≥ 25 (phase `W6`) |
| Accessibility audit | [axe-core](https://github.com/dequelabs/axe-core) | Zero critical/serious (static + runtime browser audit) |
| Runtime a11y coverage | Custom script | Policy-ratcheted route coverage, target 100% by 2026-03-18 |
| E2E navigation smoke | [Playwright](https://playwright.dev/) | Zero unexpected failures, zero flaky tests |
| Runtime error telemetry | Playwright browser telemetry | Zero uncategorized `console.error` / `pageerror` |
| JS budget gates | Custom scripts | Route + chunk + interaction gzip budgets enforced |
| Performance budgets | [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) | Perf ≥ 85, A11y ≥ 90, SEO ≥ 90 |
| HTML validation | [html-validate](https://html-validate.org/) | Zero errors |
| Link checking | Custom script | All internal links valid |

### GitHub Pages Directory Policy

- Schema compatibility: `github-pages-index.v2` and `github-pages-index.v2.1` are accepted during transition.
- Migration notes: `docs/GITHUB_PAGES_SCHEMA_MIGRATION.md`.
- Canonical threshold source: `scripts/config/github-pages-policy.json`.
- Deploy continuity posture:
  - Deploy sync uses non-strict mode with fallback to the last known-good index when GitHub API fetches fail.
  - Deploy validation gate defaults resolve from policy (`max-age-hours=72`, `max-errored=8`, `max-unreachable=5`) unless explicitly overridden via CLI flags.
- Alerting posture:
  - Open alert if fallback sync occurs more than once in a rolling 24-hour window.
  - Open alert if `errored` exceeds policy budget (`>8`).
- Current baseline (2026-02-17): `total=85`, `built=76`, `errored=6`, `unreachable=0`.
- Active budget (2026-02-18 onward): keep errored repos at `<=8` and unreachable repos at `<=5`.
- Schema migration notes (`v2 -> v2.1`):
  - Added top-level optional fields: `syncStatus`, `syncWarnings`, `stats`.
  - Added repo-level optional fields: `probeMethod`, `probeLatencyMs`, `lastError`.
  - Existing `v2` consumers remain compatible because all `v2.1` additions are optional.

Coverage ratchet policy: W2 `12/8/8/12`, W4 `18/12/12/18`, W6 `25/18/18/25` (Statements/Branches/Functions/Lines).  
Typecheck hint budget policy: W2 `<=20`, W4 `<=8`, W6 `=0`.
Runtime a11y coverage ratchet: `2026-02-25` `>=85%`, `2026-03-04` `>=95%`, `2026-03-18` `=100%`.
Security ratchet checkpoints: `2026-02-21` `moderate<=5, low<=4`, `2026-02-28` `moderate<=2, low<=2`, `2026-03-07` `moderate<=1, low<=1`, `2026-03-18` `moderate<=0, low<=0`.

```bash
npm run test              # Unit + integration tests (vitest)
npm run test:report       # Vitest JSON report for measured totals
npm run test:coverage     # Coverage report (V8)
npm run test:security:prod # Security audit gate (prod deps only)
npm run test:security     # Security audit gate (npm audit + allowlist contract)
npm run test:security:github # GitHub Dependabot advisory delta gate
npm run test:security:drift # Security drift regression guard
npm run test:a11y         # Accessibility audit (axe-core on all pages)
npm run test:a11y:runtime # Runtime browser accessibility audit (Playwright + axe)
npm run test:a11y:coverage # Runtime a11y route coverage gate
npm run test:e2e:smoke    # Playwright navigation/lifecycle smoke suite
npm run check:runtime-route-manifest # Dist vs runtime telemetry manifest sync gate
npm run test:runtime:errors # Playwright runtime error telemetry (desktop + mobile)
npm run typecheck         # Astro + TypeScript type checks
npm run typecheck:strict  # Typecheck with ratcheted hint budget (phase-aware)
npm run validate          # HTML validation + internal link check
npm run collect:perf      # Collect route/chunk performance metrics
npm run test:perf:budgets # Enforce route/chunk/interaction gzip JS budgets
npm run lighthouse        # Lighthouse CI performance budgets
npm run verify:quality    # Artifact-backed metrics freshness contract (requires freshly generated quality artifacts)
npm run quality:delta     # Baseline regression delta enforcement
npm run quality:green-track # Consecutive-green-run tracker artifact
npm run quality:summary   # Markdown quality summary generation
npm run quality:ledger    # Longitudinal quality ledger (JSON + Markdown)
npm run quality:local     # CI-parity local quality pipeline
npm run test:ci           # Alias of quality:local
```

## Structure

```
src/
├── components/       # Header, Footer, ProjectCard, SketchContainer, charts/
├── layouts/          # Base Layout with SEO/Schema.org
├── pages/
│   ├── index.astro        # Landing — organ-grouped project grid
│   ├── about.astro        # Professional bio + artist statement
│   ├── resume.astro       # Full resume with print CSS
│   ├── dashboard.astro    # System metrics, data viz, quality gates
│   ├── essays.astro       # Technical writing collection
│   ├── gallery.astro      # Generative art gallery (29 sketches)
│   ├── architecture.astro # System architecture overview
│   ├── community.astro    # Community & collaboration
│   ├── consult.astro      # Consulting services
│   ├── products.astro     # Products showcase
│   ├── 404.astro          # Custom 404 page
│   └── projects/          # 20 individual project pages
├── data/                  # JSON data + TypeScript types
├── scripts/               # Build scripts (OG images, a11y audit, validation)
└── styles/                # Global CSS design system
```

## Local Development

```bash
npm install
npm run dev          # http://localhost:4321/portfolio/
npm run build        # Build to ./dist/
npm run preview      # Preview production build
```

## License

[MIT](LICENSE)
