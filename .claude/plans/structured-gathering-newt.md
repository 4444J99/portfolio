# Plan: CLAUDE.md Rewrite for Codebase Omniscience

## Context

The portfolio CLAUDE.md (201 lines) provides orientation but not mastery. Three deep explorations surfaced three layers of tacit knowledge absent from the current file:

1. **Data coupling graph** — 28 data files, 29 quality artifacts, 6-step build chain, 3 reactive couplings, all with producer/consumer relationships
2. **Failure modes & invariants** — 9 categories of "if X then Y" constraints, governance sync enforcement via regex, silent CI failures
3. **House style** — unwritten component patterns, CSS system, lifecycle hooks, import conventions

The user's standard: "what would your maker need to unlock within you to grant you full omniscient omnipotence of the entire codebase?" — meaning a future Claude instance reading ONLY CLAUDE.md should be able to safely modify any file, write code that matches house style, debug CI failures, and navigate the data pipeline without trial and error.

## Approach

Rewrite CLAUDE.md (~350 lines) with a consequence-first structure. Create 3 companion reference docs in `docs/claude/` for deep-dive material. The existing `.quality/GOVERNANCE-COUPLING.md` already captures the invariants table — CLAUDE.md will incorporate and extend it.

## Files to Create/Modify

### 1. `CLAUDE.md` — Full rewrite (~350 lines)

**Section structure:**

| # | Section | Lines | Purpose |
|---|---------|-------|---------|
| 1 | Identity & Commands | ~40 | What this is + the 12 commands you actually need |
| 2 | Invariants | ~40 | "If X then Y" table — the single highest-value addition |
| 3 | Build & Data Pipeline | ~40 | Sequential build chain + reactive data couplings + producer/consumer map |
| 4 | House Style | ~55 | Component anatomy, CSS system, client-side patterns, imports |
| 5 | Architecture | ~45 | File tree + subsystem one-liners + key constraint callouts |
| 6 | CI/CD | ~30 | Pipeline topology, failure modes, deploy gating |
| 7 | Testing | ~25 | Config, thresholds, build-first tests, governance test |
| 8 | Debugging | ~30 | Top 10 failure modes with root cause + fix |
| 9 | Companion References | ~10 | Pointers to deep-dive docs |

**Key differences from current CLAUDE.md:**

- **Added**: Invariants table (from `.quality/GOVERNANCE-COUPLING.md` + extensions), build pipeline directed graph, reactive data couplings, house style rules, CI topology diagram, failure mode catalog
- **Restructured**: Commands pruned to essential 12 (full list → companion doc), architecture condensed to tree + one-liners
- **Moved to companions**: Full command catalog, exhaustive component pattern examples, data coupling graph with line numbers
- **Kept**: Base path constraint, workspace packages table, Biome/TypeScript conventions, debugging section (expanded)

**Section 2 content — Invariants (extends GOVERNANCE-COUPLING.md):**

| If you change... | You MUST also... | Enforced by |
|---|---|---|
| Coverage thresholds in `.quality/ratchet-policy.json` | Update README.md ratchet line (exact regex match) | `quality-governance.test.ts` |
| Lighthouse scores in `.config/lighthouserc.cjs` | Update README.md `Perf ≥ N` line | `quality-governance.test.ts` |
| Security checkpoints in `.quality/security-policy.json` | Update README.md security ratchet line | `quality-governance.test.ts` |
| Hint budgets in `.quality/ratchet-policy.json` | Update README.md hint budget line | `quality-governance.test.ts` |
| `defaultPhase` in ratchet-policy.json | Update `QUALITY_PHASE` in `quality.yml` | `quality-governance.test.ts` |
| Add/remove page in `src/pages/` | Run `npm run sync:a11y-routes` | `check-runtime-route-manifest.mjs` |
| Add/remove persona in `personas.json` | Run `npm run sync:a11y-routes` | `check-runtime-route-manifest.mjs` |
| Add/remove target in `targets.json` | Run `npm run sync:a11y-routes` | `check-runtime-route-manifest.mjs` |
| Add/remove essay in `src/content/logos/` | Run `npm run sync:a11y-routes` | `check-runtime-route-manifest.mjs` |
| `base` in `astro.config.mjs` | ALL links, `canonicalBase` in `src/utils/paths.ts` | Nothing automated — total breakage |
| Remove `src/test/setup.ts` | Fix `setupFiles` in `.config/vitest.config.ts` | Nothing — all sketch tests fail silently |
| Set `QUALITY_PHASE` to unknown phase | Ensure phase exists in `ratchet-policy.json` | `vitest.config.ts` crashes at startup |

**Section 3 content — Build & Data Pipeline:**

Build chain (sequential, any failure stops all):
```
generate-badges → sync:vitals → sync:omega → sync:identity → astro build → pagefind
```

Reactive couplings:
- `targets.json` count > 0 → `sync:omega` marks omega criterion 5 as "met"
- `.quality/*.json` → `sync:vitals` → `trust-vitals.json` + `vitals.json` + `landing.json`
- `system-metrics.json` → `sync:identity` → `about.json` system_summary

Data producers (who writes to `src/data/`):
- `generate-data` → projects, essays, experience, system-metrics (from sibling Python repo)
- `sync:vitals` → vitals.json, trust-vitals.json, landing.json
- `sync:omega` → omega.json
- `sync:identity` → about.json
- `strike:new` / `strike:sweep` → targets.json
- `scout-agent` → scout-candidates.json
- `sync:github-pages` → github-pages.json
- `generate-badges` → quality-metrics.json

**Section 4 content — House Style:**

Components: TypeScript Props interface → destructure → scoped `<style>` with BEM naming → all values from CSS custom properties

Client-side JS patterns:
- View transition lifecycle: `astro:page-load` → init, `astro:before-swap` → teardown
- AbortController for event listener cleanup
- IntersectionObserver (200px rootMargin) for lazy loading
- MAX_CONCURRENT=4 throttle for p5.js sketch init
- RequestIdleCallback for deferred init, PerformanceObserver for post-LCP scheduling
- `prefers-reduced-motion`: warmup 60 frames then `noLoop()`
- Singleton state via localStorage + data attributes on `<main>` for CSS-driven view switching

CSS tokens (never hardcode): `--accent` (gold), `--accent-hover` (burnt sienna), `--font-heading` (Syne), `--font-body` (Plus Jakarta Sans), `--space-*` (Fibonacci scale), `--transition-*`, `--radius-*`

Imports: `@/` alias for `src/`, `base` from `src/utils/paths.ts` for all dynamic URLs, workspace packages via `@4444j99/*` and `@meta-organvm/*`

### 2. `docs/claude/data-coupling-graph.md` — NEW (~200 lines)

Full producer/consumer map for all data files and quality artifacts. Content sourced from Agent 1's exploration report. Includes:
- Every `src/data/*.json` file: producer script, consumer pages/components
- Every `.quality/*.json` file: writer script (with line numbers), reader script
- The 3 reactive couplings with code paths
- Which files are safe to hand-edit vs. generated-only
- Build-time data flow diagram (ASCII)

### 3. `docs/claude/command-reference.md` — NEW (~100 lines)

Complete npm script catalog organized by category:
- Build chain (with dependency order)
- Quality gates (with what they produce)
- Data sync (with inputs/outputs)
- Strike/scout commands
- Workspace package tests (Node built-in runner, NOT vitest)
- Which commands need `npm run build` first
- Which commands need external tools (gemini CLI, Chrome, Playwright)

### 4. `docs/claude/house-style.md` — NEW (~120 lines)

Annotated code examples showing:
- Standard Astro component template (Props, destructure, style block, BEM naming)
- Client-side script patterns (singleton, AbortController, view transition lifecycle)
- How to add a new p5.js sketch to the registry
- How to add a new D3 chart module
- Dynamic route pattern ([target].astro, [slug].astro)
- CSS custom property catalog (colors, spacing, typography, transitions, z-index, shadows)

## What Gets Removed from Current CLAUDE.md

- Full 56-line command block → pruned to 12 essentials, full list moves to `docs/claude/command-reference.md`
- Verbose architecture prose (persona system, omega, chart system paragraphs) → condensed to one-liners, depth in companion docs
- Consult Worker section (4 lines) → stays but compressed
- Redundant "Test Configuration" subsection I just added → folded into Testing section

## Source Material

The following files contain the raw exploration data used to build this plan:
- Agent 1 output: data coupling graph (inline in conversation)
- `/Users/4jp/.claude/plans/2026-03-06-portfolio-failure-modes-analysis.md` — failure modes & invariants
- `/Users/4jp/.claude/plans/portfolio-house-style-conventions.md` — house style conventions
- `/Users/4jp/Workspace/4444J99/portfolio/.quality/GOVERNANCE-COUPLING.md` — existing invariants table (incorporated + extended)

## Verification

After implementation:

1. **Structural check**: CLAUDE.md should be 300-400 lines, scannable, with clear section headers
2. **Invariants accuracy**: Cross-check every row in the invariants table against `quality-governance.test.ts` (lines 24-188)
3. **Build pipeline accuracy**: Cross-check against `package.json` line 23 (`"build"` script)
4. **House style accuracy**: Spot-check 2-3 CSS property names against `src/styles/global.css`
5. **No broken references**: Every companion doc path mentioned in CLAUDE.md must exist after creation
6. **Run preflight**: `npm run preflight` to ensure no CLAUDE.md changes accidentally break anything
7. **Commit**: `docs: rewrite CLAUDE.md for codebase omniscience + companion reference docs`
