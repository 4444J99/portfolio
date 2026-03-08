# Portfolio Route Manifest Drift Analysis

**Date:** 2026-03-06  
**Project:** 4444J99/portfolio  
**Status:** Investigation Complete

## Executive Summary

The Astro portfolio project has an architectural drift problem where the committed route manifest (`scripts/runtime-a11y-routes.json`) can become stale when data files change. The manifest is generated from three data sources (personas.json, targets.json, project-index.ts) but committed to the repository. Changes to these files invalidate the manifest, causing CI failures during the `test-e2e` job's manifest drift detection.

## The Route Manifest System

### Three Components

1. **Route Generation (Dynamic Pages)**
   - `src/pages/for/[target].astro` — generates routes from `targets.json` via `getStaticPaths()`
   - `src/pages/resume/[slug].astro` — generates routes from `personas.json` via `getStaticPaths()`
   - `src/pages/logos/[slug].astro` — generates routes from content collection via `getCollection('logos')`
   - `src/pages/og/[...slug].png.ts` — generates OG image routes for projects, personas, and targets

2. **Manifest Generation**
   - `scripts/sync-a11y-routes.mjs` reads:
     - Static hardcoded routes (28-48 lines)
     - Project slugs from `src/internal/project-index.ts` via regex
     - Persona slugs from `src/data/personas.json`
     - Target slugs from `src/data/targets.json`
   - Writes to `scripts/runtime-a11y-routes.json` (COMMITTED to repo)

3. **Manifest Validation**
   - `scripts/check-runtime-route-manifest.mjs` compares:
     - Committed manifest file (`scripts/runtime-a11y-routes.json`)
     - Actual built routes (all `.html` files in `dist/`)
   - Fails if discrepancies exist

### Data Dependency Chain

```
personas.json ─┐
targets.json  ├──> sync-a11y-routes.mjs ──> scripts/runtime-a11y-routes.json (COMMITTED)
project-index ┘
     ↓
     Triggers getStaticPaths() at build time
     ↓
     dist/*.html files
     ↓
     check-runtime-route-manifest.mjs validates against COMMITTED manifest
```

## The Drift Problem

### Root Cause

The manifest is **committed** but generated from **data files**. When data files change (adding a persona, target, or project), the committed manifest becomes stale.

### CI Execution Order (from quality.yml)

1. **Build job** (lines 63-93)
   - Runs `npm run sync:github-pages`, `npm run sync:vitals`, `npm run sync:omega`, `npm run sync:identity`
   - Does **NOT** run `sync:a11y-routes`
   - Builds site → generates routes via getStaticPaths() → creates dist/*.html

2. **test-a11y job** (lines 119-147, depends on build)
   - Runs `npm run test:a11y:runtime` (line 139)
   - Which calls `npm run sync:a11y-routes` (package.json line 51)
   - REGENERATES the manifest in-memory
   - Then audits all routes in the regenerated manifest

3. **test-e2e job** (lines 149-177, depends on build)
   - Runs `npm run test:runtime:errors` (line 169)
   - Which calls `npm run check:runtime-route-manifest` (package.json line 55)
   - Compares COMMITTED manifest against dist files
   - **FAILS if committed manifest is stale**

### The Race Condition

```
SCENARIO: Developer adds new persona to personas.json and pushes
│
├─ Build completes: getStaticPaths() uses personas.json → generates new route in dist/
├─ build job SKIPS sync:a11y-routes → committed manifest still has old persona list
│
├─ test-a11y job: sync:a11y-routes REGENERATES manifest with new persona
│  (but this is in-memory, not committed)
│
└─ test-e2e job: check-runtime-route-manifest reads COMMITTED manifest
   ✗ FAILS: committed manifest doesn't match dist/ routes
```

### Evidence of the Problem

From `scripts/check-runtime-route-manifest.mjs` (lines 75-81):
```javascript
if (missingInManifest.size > 0) {
  console.error('Routes exist in dist but not in manifest:');
  // FAILS
}
if (notInDist.size > 0) {
  console.error('Routes in manifest but not in dist:');
  // FAILS
}
```

The script reads `scripts/runtime-a11y-routes.json` (line 7), which is the committed version.

## Architectural Issues

### Issue 1: Committed Manifest + Data File Dependencies

**Problem:** The manifest is version-controlled but its contents are derived from uncommitted data dependencies.

**Impact:** 
- Data changes invalidate the manifest
- Manual re-commit of manifest required after data updates
- CI failures are intermittent (depend on what changed)

### Issue 2: CI Execution Order Mismatch

**Problem:** 
- Build job does NOT regenerate manifest
- test-a11y job regenerates manifest but doesn't update the committed version
- test-e2e job validates against the committed version

**Impact:**
- The regeneration in test-a11y is wasted effort
- Committed manifest is used for validation, making test-a11y regeneration irrelevant

### Issue 3: No Pre-commit Hook or Pre-build Step

**Problem:** There's no mechanism to ensure the committed manifest stays in sync with data files before CI runs.

**Impact:**
- Developers can commit data changes without updating the manifest
- CI discovers the problem too late (in test-e2e job)
- Test failures are not caught locally

## Recommended Solutions

### Option A: Regenerate Manifest in Build Job (Recommended)

Add `sync:a11y-routes` to the build job in quality.yml:
```yaml
- name: Sync Data
  run: |
    npm run sync:github-pages
    npm run sync:vitals
    npm run sync:omega
    npm run sync:identity
    npm run sync:a11y-routes  # ADD THIS
```

**Pros:**
- Manifest always reflects actual routes
- Committed manifest stays in sync
- Single source of truth

**Cons:**
- Adds ~5-10s to build time
- Requires committing manifest regeneration

### Option B: Use Pre-commit Hook

Add Husky hook to regenerate manifest before commit:
```bash
npm run sync:a11y-routes && git add scripts/runtime-a11y-routes.json
```

**Pros:**
- Catches drift locally
- No CI overhead

**Cons:**
- Requires developer setup
- Can be bypassed with `--no-verify`

### Option C: Make Manifest Runtime-Generated (Breaking Change)

Remove manifest from committed files, regenerate it at test runtime:
- Update test:a11y:runtime to write manifest to dist/
- Update check-runtime-route-manifest to read generated manifest, not committed version
- Remove scripts/runtime-a11y-routes.json from git

**Pros:**
- No drift possible
- Single source of truth (data files)
- Cleaner architecture

**Cons:**
- Manifest must be regenerated every test run
- Adds test runtime overhead

## Implementation Priority

1. **Immediate:** Add `npm run sync:a11y-routes` to build job (Option A)
   - Simplest fix
   - Prevents drift at build time
   - ~10-15s overhead acceptable

2. **Medium:** Add pre-commit hook (Option B supplement)
   - Catches local drift
   - Reduces CI failures

3. **Long-term:** Evaluate Option C
   - Architectural improvement
   - Requires more planning

## Files Involved

### Core Manifest Files
- `scripts/runtime-a11y-routes.json` — COMMITTED manifest
- `scripts/sync-a11y-routes.mjs` — generates manifest from data
- `scripts/check-runtime-route-manifest.mjs` — validates against built routes

### Dynamic Route Pages
- `src/pages/for/[target].astro` — targets.json → routes
- `src/pages/resume/[slug].astro` — personas.json → routes
- `src/pages/logos/[slug].astro` — content collection → routes
- `src/pages/og/[...slug].png.ts` — all three sources → OG image routes

### Data Files (Drift Sources)
- `src/data/personas.json` — drives `/resume/[slug]` routes
- `src/data/targets.json` — drives `/for/[target]` routes
- `src/internal/project-index.ts` — drives static route extraction

### CI Workflow
- `.github/workflows/quality.yml` — execution order (build → test-a11y → test-e2e)
- `package.json` — npm script definitions (sync:a11y-routes, test:a11y:runtime, check:runtime-route-manifest)

## Investigation Status: Complete

All six requested investigation tasks completed:

1. ✓ **sync-a11y-routes.mjs** — Reads targets.json, personas.json, and project-index.ts; writes scripts/runtime-a11y-routes.json
2. ✓ **Dynamic route files** — Mapped getStaticPaths() usage in four files
3. ✓ **sync:a11y-routes in CI** — Called in test:a11y:runtime (package.json line 52)
4. ✓ **quality.yml workflow** — Identified execution order and timing issue
5. ✓ **check-runtime-a11y-coverage.mjs** — Calculates (routesCovered / totalRoutes) * 100
6. ✓ **Manifest strategy** — Committed manifest used, causing drift with data file changes

## Conclusion

The route manifest drift problem is architectural: a committed file depends on mutable data sources. The simplest fix is to regenerate the manifest during the build job, ensuring it's always in sync with actual routes before validation.
