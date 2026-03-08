# Evaluation-to-Growth: Portfolio Project Review

## Context

Full-project review of the Astro 5 portfolio at `/Users/4jp/Workspace/4444J99/portfolio/` using the Evaluation-to-Growth framework. The site is a deployed job-search portfolio for Anthony James Padavano with 20 case studies, persona-driven resumes, a Strike Intelligence Engine for autonomous recruitment, and an Omega maturity scorecard. It's live at `https://4444j99.github.io/portfolio/`.

The codebase has strong engineering foundations (284 tests, zero vulnerabilities, quality ratchet system, deploy gating) but the review surfaced several issues where the live site undermines its own credibility thesis — broken PDF downloads, zero-value metrics displayed on the homepage, and draft placeholder content on public pages aimed at hiring managers.

---

## Phase 1: Evaluation

### Strengths

| Dimension | Evidence |
|-----------|----------|
| **Testing** | 284 tests / 84 suites, all passing. W10 coverage ratchet (45/32/32/45). |
| **Security** | Zero vulnerabilities. Date-ratcheted sprint targeting zero by 2026-03-18. |
| **Deploy Safety** | `workflow_run` gating — quality.yml must pass before deploy.yml fires. |
| **Accessibility** | Comprehensive ARIA: `role="toolbar"`, `aria-pressed`, `aria-expanded`, `aria-live`, `aria-controls`. AbortController cleanup. `prefers-reduced-motion`. |
| **Content System** | 20 case studies with academic citations (Cite, References, Figure, MermaidDiagram). 4 personas. Dynamic resume route with data enrichment. |
| **Architecture** | Clean data-driven design: JSON → Astro pages. 30 typed p5.js sketches. Three workspace packages. View transition persistence. |
| **Quality Governance** | Ratchet policy JSON + README sync enforcement. Regression guards. CODEOWNERS on policy files. |

### Weaknesses (verified)

| ID | Finding | Severity |
|----|---------|----------|
| W1 | Resume PDF download links 404 for 2 of 4 personas (slash in title creates directory path) | P0 |
| W2 | `[DRAFT]` placeholder content on live Palantir and OpenAI strike target pages | P0 |
| W3 | Typo in `orchestrate-resume-pdfs.mjs:24` — `res` instead of `r` crashes waitForServer | P0 |
| W4 | Homepage displays zeros: "0 Code Files", "0 Test Files", "0+ Automated Tests" from `vitals.json` | P1 |
| W5 | Hardcoded "32" generative sketches on homepage — actual count is 30 | P1 |
| W6 | CI uses `QUALITY_PHASE: W6` but `ratchet-policy.json` defaultPhase is `W10` — local/CI mismatch | P1 |
| W7 | Human impact metrics hardcoded in `sync-trust-metrics.mjs` with no provenance | P1 |
| W8 | `SECURITY.md` has placeholder email `[security@ajp.com]` | P2 |
| W9 | Filter chip state not persisted across page reloads | P2 |
| W10 | No URL parameter for view selection (can't deep-link to creative view) | P2 |
| W11 | docs/ directory (4 files) not linked from site navigation | P3 |
| W12 | No linting configuration (eslint/biome/prettier) | P3 |

---

## Phase 2: Reinforcement

### R1. Fix Resume PDF Download Paths [P0]

**Problem:** `src/pages/resume/[slug].astro:77` constructs download href as:
```
Anthony_James_Padavano_${persona.pdfName || persona.title.replace(/\s+/g, '_')}.pdf
```
For "Systems Architect / Backend Lead" → `..._Systems_Architect_/_Backend_Lead.pdf` — the `/` becomes a path separator → 404.

**Files:**
- `src/data/personas.json` — Add `pdfName` to systems-architect and technical-pm:
  - systems-architect: `"pdfName": "Systems_Architect"`
  - technical-pm: `"pdfName": "Technical_Program_Manager"`
- `public/resume/` — Clean up broken directory entries (`Anthony_James_Padavano_Systems Architect `, `Anthony_James_Padavano_Technical Program Manager `)

**Complexity:** Small

### R2. Replace [DRAFT] Targets with Real Content [P0]

**Problem:** `src/data/targets.json` lines 14, 28 — Palantir and OpenAI have `[DRAFT]` placeholders on live public pages.

**Files:**
- `src/data/targets.json` — Write real intros for Palantir and OpenAI, matching the quality of existing Anthropic/Vercel entries. Or add build-time validation that fails on `[DRAFT]` content.

**Complexity:** Medium (requires content writing)

### R3. Fix orchestrate-resume-pdfs.mjs Typo [P0]

**Problem:** Line 24: `setTimeout(res, 500)` — `res` is from the outer `isServerRunning` scope (a fetch Response), should be `r` (the Promise resolver).

**File:** `scripts/orchestrate-resume-pdfs.mjs:24`
**Change:** `setTimeout(res, 500)` → `setTimeout(r, 500)`

**Complexity:** Trivial

### R4. Fix Zero-Value Vitals on Homepage [P1]

**Problem:** `src/data/vitals.json` has `code_files: 0`, `test_files: 0`, `automated_tests: 0`, `essays: 0`. These display prominently on the homepage stats section and hero subtitle.

**Files:**
- `src/data/vitals.json` — Populate with real values from the generate-data pipeline, or hardcode accurate values until pipeline is fixed
- `src/data/__tests__/data-integrity.test.ts` — Add assertions that critical vitals are non-zero

**Complexity:** Medium (root cause is in sibling repo `../ingesting-organ-document-structure/`)

### R5. Derive Sketch Count from Source of Truth [P1]

**Problem:** `src/pages/index.astro:78` hardcodes `32`. `SKETCH_NAMES` in `packages/sketches/src/index.ts` has 30 entries.

**File:** `src/pages/index.astro:78`
**Change:** Import `SKETCH_NAMES` from `@4444j99/sketches` and use `{SKETCH_NAMES.length}`

**Complexity:** Trivial

### R6. Resolve QUALITY_PHASE CI/Local Mismatch [P1]

**Problem:** Three-way inconsistency:
- `.quality/ratchet-policy.json` defaultPhase: `"W10"`
- `.github/workflows/quality.yml:27`: `QUALITY_PHASE: W6`
- `src/data/__tests__/quality-governance.test.ts:115`: asserts `W6`

**Decision needed:** Either advance CI to W10 (coordinated edit of quality.yml + governance test + README) or document the intentional difference.

**Files:** `.github/workflows/quality.yml`, `src/data/__tests__/quality-governance.test.ts`, `README.md`

**Complexity:** Small (but requires coordinated edits)

### R7. Externalize Human Impact Metrics [P1]

**Problem:** `scripts/sync-trust-metrics.mjs` hardcodes `{ totalStudents: 2000, completionRate: 97, approval: 92 }` with no provenance.

**File:** Create `src/data/human-impact.json` with documented sources. Update `scripts/sync-trust-metrics.mjs` to import from it.

**Complexity:** Small

### R8. Fix SECURITY.md Placeholder [P2]

**File:** `.github/SECURITY.md`
**Change:** Replace `[security@ajp.com]` with `padavano.anthony@gmail.com`, update supported versions.

**Complexity:** Trivial

### R9. Persist Filter Chip State [P2]

**File:** `src/components/home/IndexFilters.astro`
**Change:** Read/write active filter to localStorage alongside existing view preference persistence.

**Complexity:** Small

### R10. Add View URL Parameter [P2]

**File:** `src/components/home/IndexFilters.astro`
**Change:** Check `URLSearchParams` for `?view=creative|engineering` on init; update `history.replaceState` on toggle.

**Complexity:** Small

---

## Phase 3: Risk Analysis

### Blind Spots

| ID | Risk | Mitigation |
|----|------|------------|
| BS1 | "91 repositories / 8 orgs" framing may read as bureaucratic overhead to hiring managers unfamiliar with ORGANVM | Lead with outcome metrics (test counts, coverage, delivery) on persona pages before introducing organ taxonomy |
| BS2 | Omega scorecard shows 2/17 met — could read as "barely started" | Add velocity context: criteria met per week, H1 evidence progress, timeline visualization |
| BS3 | No analytics — impossible to measure if strike target pages or persona resumes are effective | Add privacy-respecting analytics (Plausible/Umami/Cloudflare Web Analytics) |
| BS4 | Deep links always land on engineering view — creative view not shareable | Addressed by R10 |

### Shatter Points

| ID | Risk | Mitigation |
|----|------|------------|
| SP1 | Quality governance test requires coordinated edits to 4+ files for any ratchet advancement | Create `scripts/advance-ratchet-phase.mjs` to atomically update all files |
| SP2 | `quality:local` chains 20+ sequential scripts — one flaky test blocks everything | Split into parallel groups; add `quality:fast` subset |
| SP3 | `gemini` CLI is undocumented system requirement for Strike scripts | Document in CLAUDE.md; add preflight check in strike scripts |
| SP4 | Resume PDF download path constructed client-side drifts from server-side generation | Add build-time test asserting every constructed PDF path exists in `public/resume/` |

---

## Phase 4: Growth

### G1. Resume PDF Integrity Test [P1, Small]

Create `src/data/__tests__/resume-integrity.test.ts` — reads `personas.json`, constructs every PDF download URL the same way `resume/[slug].astro` does, asserts file exists in `public/resume/`. Would have caught R1 before shipping.

### G2. Derived Statistics Everywhere [P1, Small]

Replace all hardcoded stats across the codebase with imports from canonical sources. `SKETCH_NAMES.length` for sketch count, `vitals.json` for numeric claims. Grep for hardcoded numbers and trace to source.

### G3. Privacy-Respecting Analytics [P2, Small]

Add Plausible/Cloudflare Web Analytics script to `src/layouts/Layout.astro`. Measure: persona page visits, strike target views, PDF downloads, view toggle distribution.

### G4. Ratchet Phase Advancement Script [P2, Medium]

Create `scripts/advance-ratchet-phase.mjs` that atomically updates `ratchet-policy.json`, `quality.yml`, governance test, and README. Eliminates SP1.

### G5. Quality Pipeline Parallelization [P3, Medium]

Split `quality:core` into parallel groups using `concurrently`. Security tests || build step first, then a11y/e2e/runtime after build, then badges/summary. ~30-40% time reduction.

### G6. Strike Engine Feedback Loop [P3, Large]

Dashboard widget showing strike target page views, PDF downloads, contact clicks. Depends on G3 analytics.

---

## Implementation Sequence

### Sprint 1 — Immediate (code fixes)
1. **R3** — Fix `orchestrate-resume-pdfs.mjs:24` typo (`res` → `r`) [trivial]
2. **R1** — Add `pdfName` to 2 personas, clean up broken `public/resume/` entries [small]
3. **R5** — Replace hardcoded "32" with `SKETCH_NAMES.length` [trivial]
4. **R8** — Fix SECURITY.md placeholder [trivial]

### Sprint 2 — Within 48 hours (content + data)
5. **R2** — Write real Palantir/OpenAI target content [medium]
6. **R4** — Fix vitals.json zeros (populate or interim hardcode) [medium]
7. **R7** — Externalize human impact metrics [small]
8. **R6** — Resolve QUALITY_PHASE mismatch [small]
9. **G1** — Add resume PDF integrity test [small]

### Sprint 3 — Within 1 week (UX + infra)
10. **R9** — Persist filter chip state [small]
11. **R10** — Add view URL parameter [small]
12. **G2** — Derive all statistics from canonical sources [small]
13. **G4** — Ratchet phase advancement script [medium]
14. **SP3** — Document gemini CLI requirement [trivial]

### Backlog
15. **G3** — Analytics [small]
16. **R11** — Link docs from navigation [medium]
17. **R12** — Add linting config [medium]
18. **G5** — Pipeline parallelization [medium]
19. **G6** — Strike feedback loop [large]

---

## Verification

After Sprint 1 + 2 implementation:
```bash
# Verify PDF paths resolve
npm run build && ls public/resume/*.pdf

# Verify no [DRAFT] in live pages
grep -r "\[DRAFT\]" src/data/targets.json  # should return nothing

# Verify vitals are non-zero
node -e "const v = require('./src/data/vitals.json'); console.assert(v.substance.code_files > 0, 'code_files is zero')"

# Verify sketch count is derived
grep -n "32" src/pages/index.astro  # should not match generative sketches

# Run tests
npm run test
npm run typecheck:strict
npm run quality:local:no-lh
```
