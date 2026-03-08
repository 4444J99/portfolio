# CI/CD Pipeline Resilience: Post-Mortem + Cross-Organ SOP

## Context

The portfolio CI/CD pipeline was blocked for 17 days (Feb 17 – Mar 6, 2026). Unblocking required 10 commits across 4 push-watch-fix cycles, touching 8 files across 5 failure categories. The root cause was not any single bug but a **structural fragility**: 23 independent quality gates with hidden coupling and no mechanism to detect drift until CI failed sequentially.

This plan produces two deliverables:
1. **Generalized SOP** at `meta-organvm/organvm-corpvs-testamentvm/docs/operations/sop--cicd-resilience.md` — project-agnostic, reusable across all ~111 repos
2. **Portfolio hardening** — structural fixes to prevent this class of failure in this specific project

---

## Deliverable 1: Generalized SOP

**File:** `~/Workspace/meta-organvm/organvm-corpvs-testamentvm/docs/operations/sop--cicd-resilience.md`
**Format:** Follows existing corpus SOP conventions (`sop--` prefix, standard header with Created/Author/Status/Companions/Toolchain)

### Document Structure

```
# SOP: CI/CD Pipeline Resilience & Recovery

**Created:** 2026-03-06
**Author:** @4444j99 (AI-conductor model)
**Status:** ACTIVE
**Companions:** emergency-procedures.md, key-workflows.md, operational-cadence.md
**Precedent:** Portfolio pipeline blockage (Feb 17 – Mar 6, 2026)
**Toolchain:** gh CLI, project-specific quality scripts

> Systematic protocol for diagnosing, unclogging, and structurally
> hardening CI/CD pipelines across the ORGANVM system.
```

### SOP Content Sections

#### Part A: Thesis / Antithesis / Synthesis (the "why")

**THESIS — What mature quality systems do well:**
1. Comprehensive gate coverage catches real regressions (not theater)
2. Monotonic ratchets (date-based, phase-based) create sustainable improvement
3. Separating generation from validation catches generator bugs
4. Build-first gating prevents phantom passes (stale artifact false-greens)
5. The "plan all fixes, push once" approach is orders of magnitude faster than serial fix-push-watch

**ANTITHESIS — Structural failure modes common to all quality-gated projects:**
1. **Drift magnets** — Any manually maintained list that mirrors filesystem structure will drift. Law: `P(drift) → 1` as `t → ∞`
2. **Sequential discovery tax** — N hidden failures cost `N × cycle_time` when found serially, but `~1 × cycle_time` if found in parallel locally. The multiplier is the CI round-trip time.
3. **CI-only validation gap** — Checks that can only run in CI (browser-dependent, runner-dependent) create an irreducible feedback delay. Minimize the set of CI-only checks.
4. **Invisible coupling** — When changing file A requires also changing file B, but no document or error message tells you about B until CI fails.
5. **Environment-blind thresholds** — A threshold that works on a developer's M3 but flakes on a GitHub Actions runner is not a quality gate; it's a coin flip.
6. **No local pre-flight** — If nothing runs before `git push`, every mistake costs a full CI cycle.

**SYNTHESIS — Universal structural principles:**
1. **Derive, don't duplicate.** Generate lists from filesystem/data at runtime. Never maintain a parallel copy.
2. **Preflight locally.** Every project should have a single command that runs all locally-reproducible checks.
3. **Document coupling.** Maintain a human-readable coupling map: "if you change X, also change Y, enforced by Z."
4. **Split thresholds by environment.** CI floors (tolerant, catches regressions) vs lab/local targets (aspirational, never blocks deploy).
5. **Diagnose fully before fixing.** Collect the entire failure surface before writing the first line of code.

#### Part B: The Protocol (the "how")

**Phase 0 — Triage** (5 min, any project)
```bash
gh run list --limit 1 --status failure --repo OWNER/REPO
gh run view RUN_ID --repo OWNER/REPO
gh run view RUN_ID --repo OWNER/REPO --log-failed | tail -100
```
Output: complete list of all failing jobs + error messages. Do NOT fix anything yet.

**Phase 1 — Classify** (10 min)
Categorize each failure:
| Category | Pattern | Fix archetype |
|----------|---------|---------------|
| Drift | Hardcoded list ≠ filesystem | Make dynamic |
| Threshold | Score too strict for CI | Relax to env-appropriate value |
| Formatter | Generated file fails lint | Exclude from formatter |
| Stale artifact | Old manifest/summary | Regenerate |
| Missing dep | Tool not installed in CI | Add install step |
| Code bug | Invalid HTML, broken link | Fix the code |

**Phase 2 — Reproduce locally** (15 min)
```bash
# Project-specific preflight (if it exists):
npm run preflight        # or quality:local:no-lh, or pytest, etc.
# Generic fallback:
<lint> && <typecheck> && <build> && <test>
```
Fix all locally-reproducible failures in a single batch.

**Phase 3 — Fix CI-only failures** (varies)
For browser-dependent / runner-dependent failures:
1. Extract exact values from CI logs (not just "failed")
2. Distinguish environmental flake from real regression
3. Fix regressions; adjust environmental thresholds with documented rationale

**Phase 4 — Single push, full watch**
```bash
git add <specific files>
git commit -m "fix: unclog CI — [all fixes summarized]"
git push origin main
gh run watch $(gh run list --limit 1 --json databaseId -q '.[0].databaseId') --exit-status
```
If it fails: return to Phase 0 with fresh triage. Never push partial fixes.

**Phase 5 — Post-mortem audit**
After green CI + successful deploy:
1. Review every change as if someone else made it — find flaws
2. For each fix, ask: "What structural change prevents this class of failure?"
3. Implement structural fixes as a separate commit

**Phase 6 — Feed back into this SOP**
If this incident revealed a new failure category, coupling point, or principle, update this document.

#### Part C: Project Instantiation Template

Each project that adopts this SOP should create a `.quality/GOVERNANCE-COUPLING.md` with:

```markdown
## Coupling Map
| If you change... | Also update... | Enforced by |
|-----------------|----------------|-------------|
| (project-specific entries) | | |

## Preflight Command
`npm run preflight` / `make preflight` / etc.

## CI-Only Checks (cannot reproduce locally)
- (list checks that require CI environment)

## Environment-Split Thresholds
| Metric | CI floor (error) | Local target (warn) |
|--------|------------------|---------------------|
| (project-specific) | | |
```

---

## Deliverable 2: Portfolio Structural Hardening

### A. Eliminate the last hardcoded route list

**File:** `scripts/sync-a11y-routes.mjs`
**Current:** 18 static routes in a handwritten array + dynamic injection for projects/personas/logos/targets.
**Target:** Zero hardcoded routes. Walk `src/pages/` at script time.

**Approach:** Replace the hardcoded array with a recursive walker of `src/pages/**/*.astro` that:
- Converts `src/pages/about.astro` → `/about`
- Converts `src/pages/index.astro` → `/`
- Converts `src/pages/404.astro` → `/404.html`
- Skips dynamic routes (`[slug]`, `[target]`, `[...rest]`) — those are already handled by data source injection
- Skips non-HTML endpoints (`.ts` files for `feed.xml`, `og/*.png`, `github-pages.json`, etc.)
- Applies per-route overrides from a small config map (gallery's extra checks)

```js
const ROUTE_OVERRIDES = {
  '/gallery': {
    checks: [...DEFAULT_CHECKS, 'gallery-filter', 'fullscreen'],
    requiredFocusSelectors: ['.sketch-ctrl--pause', '.sketch-ctrl--fullscreen'],
  },
};
```

Dynamic routes (logos content collection, personas, targets, projects) continue being injected from their data sources exactly as they are now.

### B. Add `npm run preflight`

**File:** `package.json`
```json
"preflight": "npm run lint && npm run typecheck && npm run build && npm run validate && npm run sync:a11y-routes && node scripts/check-runtime-route-manifest.mjs && npm run test"
```

This catches ~80% of CI failures locally. The remaining 20% (Lighthouse, Playwright runtime a11y, E2E smoke) require browser environments only available in CI.

### C. Create portfolio governance coupling manifest

**File:** `.quality/GOVERNANCE-COUPLING.md`

| If you change... | Also update... | Enforced by |
|-----------------|----------------|-------------|
| `.config/lighthouserc.cjs` perf score | README.md `Perf ≥ XX` | `quality-governance.test.ts` |
| `.quality/ratchet-policy.json` coverage phases | README.md coverage ratchet table | `quality-governance.test.ts` |
| `.quality/ratchet-policy.json` typecheck budgets | README.md typecheck hint budget line | `quality-governance.test.ts` |
| `.quality/security-policy.json` checkpoints | README.md security ratchet checkpoints | `quality-governance.test.ts` |
| `.quality/ratchet-policy.json` defaultPhase | `.github/workflows/quality.yml` `QUALITY_PHASE` env | `quality-governance.test.ts` |
| Any `src/pages/*.astro` (add/remove) | Run `npm run sync:a11y-routes` | `check-runtime-route-manifest.mjs` |
| Any `src/content/logos/*.md` (add/remove) | Run `npm run sync:a11y-routes` | `check-runtime-route-manifest.mjs` |
| `src/data/personas.json` (add/remove persona) | Run `npm run sync:a11y-routes` | `check-runtime-route-manifest.mjs` |
| `src/data/targets.json` (add/remove target) | Run `npm run sync:a11y-routes` | `check-runtime-route-manifest.mjs` |

### D. Update CLAUDE.md

Add `npm run preflight` to the Commands section and add a note: "Run before pushing to catch ~80% of CI failures locally."

---

## Files to Create/Modify

| File | Action | Why |
|------|--------|-----|
| `~/Workspace/meta-organvm/organvm-corpvs-testamentvm/docs/operations/sop--cicd-resilience.md` | **CREATE** | Cross-organ SOP |
| `portfolio/scripts/sync-a11y-routes.mjs` | **MODIFY** | Replace hardcoded routes with filesystem walk |
| `portfolio/scripts/runtime-a11y-routes.json` | **REGENERATE** | Downstream artifact |
| `portfolio/package.json` | **MODIFY** | Add `preflight` script |
| `portfolio/.quality/GOVERNANCE-COUPLING.md` | **CREATE** | Coupling manifest |
| `portfolio/CLAUDE.md` | **MODIFY** | Document preflight command |

## Verification

1. **Drift test:** Create `src/pages/test-drift.astro`, run `npm run sync:a11y-routes`, confirm it appears in manifest, delete dummy page
2. **Preflight test:** Run `npm run preflight` end-to-end — all checks pass
3. **Governance test:** `npm run test` — all 363 tests pass including governance sync assertions
4. **CI test:** Push, watch run, confirm all 8 jobs green + deploy triggers
5. **SOP review:** Read `sop--cicd-resilience.md` in corpus context — verify it's project-agnostic and follows existing SOP format conventions
