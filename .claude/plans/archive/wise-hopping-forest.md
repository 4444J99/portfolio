# The Integrity Layer

## Context

The portfolio has progressed through three layers: **Base** (structure) → **Experience** (UX polish) → **Presence** (outward reach). The site now has 31 pages, 25+ generative sketches, 8 D3 charts, View Transitions, light/dark theme, OG images, RSS, PWA, print support, and Pagefind search.

**The problem:** The portfolio claims engineering rigor — 91 repos, 4,000+ tests, 82 CI workflows — yet the portfolio *itself* has zero tests, zero quality gates, and no CI beyond "does it build." For any hiring manager who inspects the repo, this is the single largest credibility gap. The Integrity Layer transforms the portfolio from a site that *describes* engineering discipline into one that *demonstrates* it.

## Commit Sequence (8 Commits)

```
Commit 1: Test infra + utility tests ──────┐
Commit 2: Component logic tests ────────────┤ (Foundation — sequential)
Commit 3: Accessibility audit ──────────────┘
Commit 4: Lighthouse CI budgets              (Independent after 1)
Commit 5: HTML validation + link checking    (Independent after build)
Commit 6: CI quality pipeline ───────────────── Requires 1–5
Commit 7: Dashboard quality section ─────────── Requires 6
Commit 8: README badges + docs update ──────── Last
```

---

### Commit 1: Test Infrastructure + Utility Unit Tests

Establish vitest, write first tests for pure TypeScript utilities.

**New dependencies (all dev):** `vitest`, `@vitest/coverage-v8`

**New files:**
- `vitest.config.ts` — config with src aliases, coverage thresholds
- `src/utils/__tests__/og-image.test.ts` — mock satori/resvg, verify dimensions, title truncation
- `src/data/__tests__/project-index.test.ts` — unique slugs, valid tags, format validation
- `src/data/__tests__/data-integrity.test.ts` — schema validation for all JSON data files, referential integrity
- `src/components/charts/__tests__/chart-utils.test.ts` — `formatNumber`, tooltip factory
- `src/components/charts/__tests__/chart-theme.test.ts` — `getChartTheme` fallback values

**Modify:** `package.json` (add deps, `test`, `test:coverage` scripts), `tsconfig.json` (vitest types)

---

### Commit 2: Component Logic + Smoke Tests

Test extracted TypeScript logic from Astro components (related project filtering, slug matching, navigation indexing).

**New dependency (dev):** `cheerio` (HTML parsing for built output assertions)

**New files:**
- `src/components/__tests__/project-detail-logic.test.ts` — related projects filtering, prev/next nav generation
- `src/components/__tests__/build-output.test.ts` — snapshot tests on key built HTML pages (requires prior `npm run build`)
- `src/components/sketches/__tests__/sketch-loader.test.ts` — sketch registry, initialization logic

**Modify:** `vitest.config.ts` (add jsdom environment for DOM tests)

---

### Commit 3: Accessibility Audit Integration

Build-time axe-core auditing against all 31 built HTML pages.

**New dependency (dev):** `axe-core`

**New files:**
- `scripts/a11y-audit.mjs` — loads each `dist/*.html` into jsdom, runs axe-core, reports by severity, exits non-zero on critical/serious
- `src/__tests__/a11y.test.ts` — vitest integration running axe on key pages

**Modify:** `package.json` (add `test:a11y` script)

---

### Commit 4: Lighthouse CI Performance Budgets

Enforce performance, accessibility, and SEO scores on every build.

**New dependency (dev):** `@lhci/cli`

**New files:**
- `lighthouserc.js` — config: `staticDistDir: './dist'`, key page URLs, assertions (perf ≥ 85, a11y ≥ 90, best-practices ≥ 90, SEO ≥ 90), timing budgets (FCP < 2s, LCP < 3s, CLS < 0.1)

**Modify:** `package.json` (add `lighthouse` script), `.gitignore` (add `.lighthouseci/`)

---

### Commit 5: HTML Validation + Link Checking

Validate all 31 HTML pages and check every internal link.

**New dependencies (dev):** `html-validate`, `linkinator`

**New files:**
- `.htmlvalidate.json` — rules config (allow Astro patterns, `data-*` attrs)
- `scripts/validate-build.mjs` — runs html-validate + linkinator (internal only) on `dist/`

**Modify:** `package.json` (add `validate` script)

---

### Commit 6: GitHub Actions Quality Pipeline

CI workflow running all quality gates on push and PR.

**New files:**
- `.github/workflows/quality.yml` — `build-and-test` job: checkout → Node 22 → `npm ci` → `npm run build` → `npm run test` → `npm run test:a11y` → `npm run validate` → `npm run lighthouse` → upload artifacts (coverage, Lighthouse reports)

**Modify:** `package.json` (add `test:ci` script chaining all gates)

---

### Commit 7: Quality Dashboard + Coverage Badges

Make test results visible to visitors on the dashboard page.

**New files:**
- `scripts/generate-quality-badges.mjs` — reads vitest coverage JSON + Lighthouse results → generates SVG badges to `public/badges/` + `src/data/quality-metrics.json`
- `public/badges/` — generated coverage, Lighthouse, a11y SVG badges
- `src/data/quality-metrics.json` — structured quality data

**Modify:**
- `src/pages/dashboard.astro` — new "Quality Gates" section: test count, coverage %, Lighthouse scores, a11y status, bundle size, build freshness
- `src/types/data.ts` — add `QualityMetrics` interface

---

### Commit 8: README Badges + CLAUDE.md Update

Document the quality infrastructure.

**Modify:**
- `README.md` — quality badges at top, "Quality Infrastructure" section
- `CLAUDE.md` — replace "No test runner" with full test strategy, commands, thresholds, debugging tips

---

## New Dependencies (All Dev)

| Package | Purpose |
|---------|---------|
| `vitest` | Test runner (Vite-native) |
| `@vitest/coverage-v8` | Coverage via V8 |
| `cheerio` | HTML parsing for assertions |
| `axe-core` | Accessibility auditing |
| `@lhci/cli` | Lighthouse CI |
| `html-validate` | HTML validation |
| `linkinator` | Dead link checking |

Zero production bundle impact.

## Verification

After all 8 commits:
```
npm run test              # Unit + component logic tests pass
npm run test:coverage     # Coverage report generated
npm run test:a11y         # All 31 pages pass axe-core (no critical/serious)
npm run validate          # Valid HTML, no broken internal links
npm run lighthouse        # Perf ≥85, A11y ≥90, BP ≥90, SEO ≥90
npm run test:ci           # All gates chain together
npm run build             # Still clean (31 pages, OG images, RSS)
# Push → quality.yml runs green
# Dashboard → quality section visible with real metrics
# README → badges show coverage %, Lighthouse scores
```
