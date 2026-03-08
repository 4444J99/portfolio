# Claude Archives Inventory — Portfolio Project

**Date:** 2026-03-06  
**Project:** 4444J99/portfolio  
**Status:** Exploration Complete

---

## Executive Summary

The portfolio project has an extensive Claude work history spanning **121 session archives** and **4 plan documents** across two time periods. Active work is documented in three comprehensive plans covering:
1. Quality audit (12 identified weaknesses across 3 priority levels)
2. CI/CD pipeline resilience (17-day blockage post-mortem + hardening strategy)
3. Route manifest drift analysis (architectural coupling issues)

No work is currently in progress — all pending tasks are documented but awaiting implementation.

---

## Directory Structure

```
/Users/4jp/.claude/
├── plans/
│   ├── portfolio/                          # Active portfolio plans
│   │   ├── 2026-03-06-portfolio-audit-and-implementation-strategy.md
│   │   ├── 2026-03-06-portfolio-route-manifest-drift-analysis.md
│   │   └── curious-napping-gosling.md
│   ├── archive/2026-02/
│   │   └── portfolio-round4-quality-audit.md
│   └── [other organ/project plans]
│
├── projects/
│   ├── -Users-4jp-Workspace-4444J99-portfolio/
│   │   ├── [121 session directories]
│   │   └── memory/MEMORY.md               # Persistent session memory
│   └── [other project archives]
│
└── [global configuration]
```

---

## Active Plans (Portfolio-Specific)

### 1. 2026-03-06-portfolio-audit-and-implementation-strategy.md
**Status:** ACTIVE — Implementation Pending  
**Lines:** 448  
**Created:** 2026-03-06

**Purpose:** Comprehensive quality audit with prioritized implementation roadmap

**Content Overview:**
- Identifies 12 weaknesses across 3 priority levels (0, 1, 2/3)
- Examines 5 core systems: Persona System, Strike Intelligence Engine, Quality Ratchet System, Omega System, Consult Worker
- Documents 3 implementation sprints with specific file modifications and timelines

**Priority 0 Issues (Critical):**
- **W1:** Resume PDFs returning 404s — `orchestrate-resume-pdfs.mjs` missing
- **W2:** `[DRAFT]` placeholder content in strike targets — needs Palantir/OpenAI data

**Priority 1 Issues (High):**
- **W3:** Typo in `orchestrate-resume-pdfs.mjs` (function call)
- **W4:** `vitals.json` showing zeros — needs data source restoration
- **W5:** Hardcoded sketch count in analytics — should be `persona.sketchId` validation
- **W6:** `QUALITY_PHASE` mismatch between `.quality/ratchet-policy.json` and `.github/workflows/quality.yml`

**Priority 2/3 Issues (Medium/Low):**
- Metrics JSON hardcoding; missing PDF integrity test; security documentation; filter persistence; URL parameters; analytics wiring

**Implementation Plan:**
- **Sprint 1** (Immediate, <4 hours): Fix W3 typo, write W2 content, replace hardcoded sketch count
- **Sprint 2** (Within 48 hours): Fix vitals.json zeros, resolve QUALITY_PHASE mismatch, externalize metrics, add PDF test
- **Sprint 3** (Within 1 week): Persist filter state, add URL parameters, wire analytics

**Related Files:**
- `.quality/ratchet-policy.json` — policy definitions
- `README.md` — governance table (must match policy JSON)
- `.github/workflows/quality.yml` — CI workflow
- `orchestrate-resume-pdfs.mjs` — resume generation script
- `src/data/strike-targets.json` — strike target definitions
- `src/data/vitals.json` — trust metrics

**Actionable Next Step:** Implement Sprint 1 fixes (estimated 4 hours)

---

### 2. 2026-03-06-portfolio-route-manifest-drift-analysis.md
**Status:** ACTIVE — Investigation Complete, Implementation Pending  
**Lines:** 242  
**Created:** 2026-03-06

**Purpose:** Analyze architectural drift in route manifest system

**Content Overview:**
- Documents how committed `scripts/runtime-a11y-routes.json` becomes stale when data files change
- Identifies root causes and three solution options
- Maps data dependency chain and CI execution order

**Root Causes:**
1. **Committed Manifest + Data Dependencies:** Manifest is version-controlled but derived from uncommitted data files
2. **CI Execution Order Mismatch:** Build job doesn't regenerate manifest; test-a11y regenerates but doesn't update committed version; test-e2e validates against stale committed version
3. **No Pre-commit Hook:** Developers can commit data changes without updating manifest

**Solution Options:**
- **Option A (Recommended):** Add `npm run sync:a11y-routes` to build job in `quality.yml` — ensures manifest always reflects actual routes
- **Option B:** Use pre-commit hook (Husky) — catches drift locally but can be bypassed
- **Option C:** Make manifest runtime-generated — removes drift possibility but adds test overhead

**Data Dependency Chain:**
```
personas.json ─┐
targets.json  ├──> sync-a11y-routes.mjs ──> runtime-a11y-routes.json (COMMITTED)
project-index ┘
     ↓
   getStaticPaths() at build
     ↓
   dist/*.html files
     ↓
   check-runtime-route-manifest validates against COMMITTED manifest
```

**Related Files:**
- `scripts/runtime-a11y-routes.json` — committed manifest
- `scripts/sync-a11y-routes.mjs` — manifest generator
- `scripts/check-runtime-route-manifest.mjs` — manifest validator
- `src/pages/for/[target].astro` — targets routes
- `src/pages/resume/[slug].astro` — personas routes
- `src/pages/logos/[slug].astro` — logos routes
- `.github/workflows/quality.yml` — CI workflow execution order
- `package.json` — npm script definitions

**Actionable Next Step:** Implement Option A (add `sync:a11y-routes` to build job, estimated 15 minutes)

---

### 3. curious-napping-gosling.md
**Status:** ACTIVE — Post-Mortem Complete, Hardening Pending  
**Lines:** 214  
**Created:** 2026-03-06

**Purpose:** Post-mortem of 17-day CI/CD pipeline blockage + structural hardening strategy

**Context:** Pipeline blocked Feb 17 – Mar 6, 2026. Unblocking required 10 commits across 4 cycles, touching 8 files, 5 failure categories. Root cause: **structural fragility** — 23 independent quality gates with hidden coupling and no drift detection until CI failed sequentially.

**Two Deliverables:**

**Deliverable 1: Generalized SOP**
- **File:** `~/Workspace/meta-organvm/organvm-corpvs-testamentvm/docs/operations/sop--cicd-resilience.md` (to be created)
- **Format:** Project-agnostic, reusable across ~111 repos
- **Content:** 6 phases for diagnosing/unclogging pipelines
  1. **Triage:** Extract complete failure surface (5 min)
  2. **Classify:** Categorize by type (drift, threshold, formatter, stale artifact, missing dep, code bug)
  3. **Reproduce locally:** Fix all reproducible failures in batch
  4. **Fix CI-only failures:** Handle environment-dependent tests
  5. **Single push, full watch:** Commit all fixes together, never partial
  6. **Post-mortem audit:** Review for structural improvements

- **Structural Principles:**
  1. **Derive, don't duplicate:** Generate lists from filesystem at runtime
  2. **Preflight locally:** Single command that runs all locally-reproducible checks
  3. **Document coupling:** Maintain human-readable coupling map
  4. **Split thresholds by environment:** CI floors vs local targets
  5. **Diagnose fully before fixing:** Collect entire failure surface first

**Deliverable 2: Portfolio Hardening**

**Part A: Eliminate hardcoded route list**
- **File:** `scripts/sync-a11y-routes.mjs`
- **Change:** Replace 18 static routes with filesystem walk of `src/pages/`
- **Approach:** Convert `src/pages/about.astro` → `/about`, `src/pages/index.astro` → `/`, etc.
- **Handles:** Dynamic routes via data source injection (unchanged)

**Part B: Add `npm run preflight`**
- **File:** `package.json`
- **Command:** `npm run lint && npm run typecheck && npm run build && npm run validate && npm run sync:a11y-routes && node scripts/check-runtime-route-manifest.mjs && npm run test`
- **Coverage:** ~80% of CI failures caught locally

**Part C: Create governance coupling manifest**
- **File:** `.quality/GOVERNANCE-COUPLING.md`
- **Content:** Coupling map showing interdependencies between quality policies and documentation

**Part D: Update CLAUDE.md**
- Add `npm run preflight` to Commands section
- Note: "Run before pushing to catch ~80% of CI failures locally"

**Files to Create/Modify:**
| File | Action | Why |
|------|--------|-----|
| `~/Workspace/meta-organvm/organvm-corpvs-testamentvm/docs/operations/sop--cicd-resilience.md` | CREATE | Cross-organ SOP |
| `portfolio/scripts/sync-a11y-routes.mjs` | MODIFY | Replace hardcoded routes |
| `portfolio/scripts/runtime-a11y-routes.json` | REGENERATE | Downstream artifact |
| `portfolio/package.json` | MODIFY | Add preflight script |
| `portfolio/.quality/GOVERNANCE-COUPLING.md` | CREATE | Coupling manifest |
| `portfolio/CLAUDE.md` | MODIFY | Document preflight |

**Related Files:**
- `src/pages/` (all Astro pages)
- `src/data/personas.json`, `targets.json`, `projects.json`
- `.github/workflows/quality.yml` (CI workflow)

**Actionable Next Step:** Implement Portfolio Hardening (estimated 3-4 hours across all 4 parts)

---

## Archived Plans

### portfolio-round4-quality-audit.md
**Status:** ARCHIVED  
**Location:** `/Users/4jp/.claude/plans/archive/2026-02/`  
**Lines:** 100+  
**Created:** 2026-02

**Purpose:** Round 4 accessibility quality audit

**Content Overview:**
- Examines 8 investigation areas: touch targets, focus management, color contrast, responsive gaps, print styles, reduced motion, semantic HTML, image/SVG a11y
- Documents design system colors and accessibility baseline
- References prior rounds (1-3) that completed various fixes

**Status:** Superseded by more comprehensive 2026-03-06 audit

---

## Session Archives

**Location:** `/Users/4jp/.claude/projects/-Users-4jp-Workspace-4444J99-portfolio/`

**Total Sessions:** 121 UUID-based session directories  
**Persistent Memory:** `memory/MEMORY.md` (workflow preferences, RenderCV v2.x path resolution notes, current date)

**Session Organization:**
- Each session is stored as `{UUID}/` directory
- Full conversation transcripts at `{UUID}.jsonl`
- Sessions indexed chronologically but queryable by UUID only

**Workflow Notes (from persistent memory):**
- Always push branches to origin immediately
- Merge feature branches into main when done
- Don't ask about PRs unless user requests
- RenderCV v2.x path resolution is relative to YAML file's parent dir

---

## Portfolio Project Status Summary

**Promotion State:** PUBLIC_PROCESS  
**Tier:** CANDIDATE  
**Unfinished Work:** 12 documented weaknesses requiring implementation

### Critical Path (Next 48 Hours)

**Sprint 1 (Immediate, <4 hours):**
1. Fix W3 typo in `orchestrate-resume-pdfs.mjs`
2. Write W2 content (Palantir/OpenAI strike targets)
3. Replace hardcoded sketch count with persona validation

**Sprint 2 (Within 48 hours):**
1. Fix vitals.json zeros
2. Resolve QUALITY_PHASE mismatch
3. Externalize metrics hardcoding
4. Add PDF integrity test
5. Write Security.md documentation

**Parallel Task (Portfolio Hardening, 3-4 hours):**
1. Replace hardcoded route list with filesystem walk
2. Add `npm run preflight` command
3. Create `.quality/GOVERNANCE-COUPLING.md`
4. Update CLAUDE.md with preflight documentation

### Medium-Term Work (1-2 Weeks)

**Sprint 3 Tasks:**
- Persist filter state (`engineering|creative` view toggle)
- Add URL parameters for view state
- Wire analytics integration

**Growth Initiatives:**
- MARS system (career trajectory modeling)
- Analytics pipeline (traffic, engagement metrics)
- Navigation documentation (Astro routing patterns)
- Build parallelization (faster CI cycles)
- Strike feedback loop (candidate outcome tracking)

---

## Key Insights

### Architectural Strengths
- Comprehensive quality ratchet system with date-based progression
- Persona-driven content generation enables targeted resumes/strike pages
- Generative art integration (30 named sketches + palette system)
- Dual portfolio view (engineering/creative toggle)
- Established CI/CD workflow with 8 parallel quality gates

### Architectural Weaknesses (Documented in Audit)
1. **Resume PDF system:** Broken 404s — critical blocker
2. **Strike targets:** Placeholder content — needs real data
3. **Route manifest drift:** Committed manifest can become stale
4. **Vitals data:** Zeros instead of actual metrics
5. **Metrics hardcoding:** Manual updates create synchronization debt
6. **Governance sync:** Policy JSON and README can diverge
7. **Filter persistence:** View toggle resets on navigation
8. **URL parameters:** View state not preserved in URLs
9. **Analytics:** Wired but not producing actionable insights
10. **Security documentation:** Missing explicit security.md
11. **PDF testing:** No integrity checks for generated PDFs
12. **Print styles:** May have responsive gaps

### Coupling Points
- `.quality/ratchet-policy.json` ↔ `README.md` (governance assertion in test)
- `personas.json` ↔ `targets.json` ↔ route manifest
- `QUALITY_PHASE` env var ↔ `.quality/ratchet-policy.json` ↔ `.github/workflows/quality.yml`
- `persona.sketchId` ↔ `packages/sketches/` registry
- Build artifact manifest ↔ test-e2e validation

---

## Next Steps for User

1. **Review the three active plans** to understand scope and priorities
2. **Choose starting point:**
   - Critical path: Implement Sprint 1 fixes (resume PDFs + placeholder content)
   - Preventive: Implement portfolio hardening (route manifest drift + preflight)
   - Structural: Create cross-organ SOP (reusable across all ~111 repos)
3. **Run `npm run preflight`** before pushing any changes
4. **Validate governance sync:** Ensure policy JSON and README stay in sync

---

## Document Index

| Document | Lines | Status | Priority | Est. Hours |
|----------|-------|--------|----------|-----------|
| portfolio-audit-and-implementation-strategy.md | 448 | Pending | 0, 1 | 20-30 |
| portfolio-route-manifest-drift-analysis.md | 242 | Investigation Complete | High | 3-4 |
| curious-napping-gosling.md | 214 | Post-mortem Complete | High | 4-5 |
| portfolio-round4-quality-audit.md | 100+ | Archived | Medium | — |

**Total Pending Implementation:** 27-39 hours of work documented across all sprints

---

**Created:** 2026-03-06  
**By:** Claude Code (exploration agent)  
**Mode:** Read-only investigation (no files modified)
