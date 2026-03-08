# Portfolio Project: Complete Failure Modes & Invariants Analysis

**Date**: 2026-03-06  
**Scope**: Exhaustive mapping of failure modes, invariants, and non-obvious constraints in `/Users/4jp/Workspace/4444J99/portfolio`

---

## 1. BUILD INVARIANTS

### 1.1 Script Chain Dependencies
**File**: `package.json` (line 23)

The `build` script is a **sequential chain** — all steps must execute in order:
```
npm run generate-badges && 
npm run sync:vitals && 
npm run sync:omega && 
npm run sync:identity && 
astro build && 
npx pagefind --site dist --glob '**/*.html'
```

**Failure modes:**
- If `generate-badges` fails, build stops immediately. No badges JSON written to `.quality/`.
- If `sync:vitals` fails (e.g., missing trust metrics data), build stops. Vitest coverage thresholds won't be loaded at test time.
- If `sync:omega` fails (missing targets.json or schema mismatch), omega.json not updated. Omega page renders stale data.
- If `sync:identity` fails (missing identity data source), build stops. Identity components fail at runtime.
- If `astro build` fails (type error, route collision, missing layout), no dist/ directory. CI artifacts empty.
- If `pagefind` fails (dist/ malformed HTML), search index not generated. Search feature broken.

**Cross-file constraint**: 
- `astro.config.mjs` line 9 sets `base: '/portfolio'` — all internal link generation depends on this. If changed, routing breaks across all 20 project pages and dynamic routes.

### 1.2 Data Synchronization Before Build
**File**: `.github/workflows/quality.yml` (lines 72-81)

The CI build job runs four sync commands **before** `npm run build`:
```yaml
- npm run sync:github-pages
- npm run sync:vitals
- npm run sync:omega
- npm run sync:identity
```

**Failure mode**: If ANY of these fail in CI, `npm run build` still runs but with incomplete/stale data. The `build` script's own sync steps run again, but:
- `sync:vitals` cached data may differ between first and second run
- `sync:omega` depends on updated targets.json from first run
- Policy-driven coverage thresholds loaded at vitest startup depend on sync:vitals output

**Invariant**: All four sync commands must pass **before** vitest config loads coverage thresholds, which happens at test startup, not build time.

### 1.3 Base Path Routing
**File**: `astro.config.mjs` (line 9)
```javascript
base: '/portfolio'
```

**Constraint**: Every internal link, asset reference, and dynamic route must account for this prefix.

**Failure modes if changed to `base: '/'`**:
- All relative links in components (e.g., `href="/about"`) become broken (404s)
- Resume pages at `/resume/[slug]` redirect to wrong path
- Strike target pages at `/for/[target]` redirect wrong
- OG image generation routes at `/og/[...slug].png.ts` may fail path resolution
- GitHub Pages deployment expects `/portfolio/` prefix — docs won't render

**Cross-file constraint**: 
- All Astro `.astro` files use relative paths or `Astro.url` which respects base. 
- If base path changed, all routes in `src/pages/` silently break at runtime.

### 1.4 Vite Chunk Splitting
**File**: `astro.config.mjs` (lines 24-29)

Manual vendor chunks defined:
```javascript
'vendor-p5': ['p5'],
'vendor-mermaid': ['mermaid'],
'vendor-cytoscape': ['cytoscape'],
'vendor-katex': ['katex']
```

**Constraint**: If a new vendor import is added (e.g., `import d3-force` in a sketch), it must either:
1. Be added to one of the existing vendor chunks, OR
2. Have its own chunk defined, OR
3. Be accepted as part of the default bundle

**Failure mode**: 
- If large vendor (d3, three.js) imported without chunk definition, single bundle may exceed 1800kB warning threshold.
- Chunk warning doesn't fail build but pollutes CI logs and signals potential performance regression.
- Actual bundle budget enforcement happens in `npm run test:perf:budgets` (separate check).

---

## 2. TEST INVARIANTS

### 2.1 Canvas API Stub Dependency
**File**: `src/test/setup.ts` (lines 36-47)

Vitest setup file stubs canvas APIs because jsdom doesn't implement them:
```javascript
HTMLCanvasElement.prototype.getContext = () => contextStub;
contextStub.toDataURL = () => 'data:image/png;base64,';
```

**Failure modes if removed**:
- All tests that import p5.js sketches fail with "NotImplementedError: HTMLCanvasElement.getContext is not implemented"
- axe-core's probe of DOM (in a11y tests) attempts canvas queries, prints "Not implemented" to console
- Tests pass but console warnings mask real issues

**Invariant**: `src/test/setup.ts` must be registered in vitest config at `.config/vitest.config.ts` (line 62):
```javascript
setupFiles: ['src/test/setup.ts'],
```

If vitest config's `setupFiles` is removed or path changed, canvas tests will fail silently.

### 2.2 Vitest Config Loads Policy at Startup
**File**: `.config/vitest.config.ts` (lines 29-74)

Coverage thresholds are loaded **at vitest config time**, not at test execution:

```javascript
const policy = JSON.parse(
  readFileSync(resolve(root, '.quality/ratchet-policy.json'), 'utf-8')
);
const phase = process.env.QUALITY_PHASE || policy.defaultPhase;
const minCoverage = policy.phases[phase].coverage;

// ...

thresholds: coverage
```

**Failure modes**:
- If `.quality/ratchet-policy.json` is deleted or malformed JSON, vitest crashes before any tests run.
- If policy file exists but `phases[phase]` is undefined (e.g., phase='W99' doesn't exist), threshold resolution fails.
- If `QUALITY_PHASE` env var set to invalid phase name (e.g., `QUALITY_PHASE=W5`), no matching threshold — undefined behavior.

**Cross-file constraint**: 
- `.github/workflows/quality.yml` line 19 sets `QUALITY_PHASE: W10` globally.
- If this is changed to a phase name not in `ratchet-policy.json`, vitest config fails to resolve thresholds.

### 2.3 Data Integrity Test Dependencies
**File**: `src/data/__tests__/data-integrity.test.ts` (lines 1-178)

Tests import from `src/data/`:
```javascript
import projects from '../projects.json';
import essays from '../essays.json';
import graph from '../graph.json';
import targets from '../targets.json';
import vitals from '../vitals.json';
```

**Shape invariants** (failure modes if violated):

| File | Invariant | Line | Failure |
|------|-----------|------|---------|
| `projects.json` | `total_curated === projects.length` | 18 | Test fails, indicates orphaned projects |
| `projects.json` | All projects have `name`, `org`, `organ`, `description`, `tier`, `implementation_status` | 22-29 | Test fails, UI renders undefined/null values |
| `projects.json` | `tier` in `['flagship','standard','infrastructure','archive']` | 33-36 | Invalid tier breaks CSS classname binding |
| `projects.json` | `implementation_status` in `['ACTIVE','DESIGN_ONLY','ARCHIVED']` | 40-43 | Filter logic in components breaks |
| `essays.json` | `total === essays.length` | 53 | Test fails, essay count incorrect |
| `essays.json` | All essays have `title`, `slug`, `date`, `url` | 57-62 | Renders incomplete essay cards |
| `essays.json` | `date` parses as valid ISO | 66-68 | Invalid date breaks sort order |
| `graph.json` | `total_nodes === nodes.length`, `total_edges === edges.length` | 92-98 | Visualization renders partial graph |
| `graph.json` | Every edge `source` and `target` reference existing node IDs | 108-112 | Cytoscape throws rendering error |
| `targets.json` | No `intro` contains `'[DRAFT]'` placeholder | 119 | Strike targets show unfinished content |
| `vitals.json` | `substance.code_files`, `test_files`, `automated_tests` > 0 | 126-128 | System metrics dashboard shows incomplete data |
| `system-metrics.json` | Top-level has `system`, `registry`, `omega`, `essays`, `sprints`, `github_issues`, `sprint_history` | 144-150 | Dashboard sections fail to render |
| `system-metrics.json` | `registry.implementation_status` counts sum to `total_repos` | 158-163 | Data audit fails, indicates inconsistent state |

**Critical constraint**: 
- `npm run generate-data` generates these files from `../ingesting-organ-document-structure/`.
- If source pipeline produces malformed JSON, these tests fail.
- Tests are **not** run before build in CI, they're run in parallel in the `test-unit` job (which depends on `build`).
- This means a malformed data file passes build but fails in `test-unit` job, blocking CI.

### 2.4 Test Exclusions from Coverage
**File**: `.config/vitest.config.ts` (lines 70-71)

Coverage excludes:
```javascript
['**/*.astro', 'packages/sketches/**'],
```

**Invariant**: 
- If `.astro` files are moved or a sketch implementation file is moved to `packages/sketches/`, coverage may count code that shouldn't be counted.
- If coverage threshold is changed without accounting for these exclusions, claimed coverage may not match actual.

### 2.5 Typecheck Hint Budget Test
**File**: `scripts/check-typecheck-hints.mjs` (line 7)

Hint budget resolved from:
1. `--budget` CLI flag, OR
2. `TYPECHECK_HINT_BUDGET` env var, OR
3. `policy.phases[phase].typecheck.hintsMax`

**Failure modes**:
- If `QUALITY_PHASE=W10` but `ratchet-policy.json` doesn't define `phases.W10.typecheck.hintsMax`, undefined is compared to a number.
- If no flag, env var, or policy entry, script throws error.

**Cross-file constraint**: 
- `quality-governance.test.ts` line 108-115 asserts README hints values match policy.
- If README says `W10 =0` but policy file says `hintsMax: 5`, governance test fails before hints check runs.

### 2.6 Quality Governance Test: README Sync
**File**: `src/data/__tests__/quality-governance.test.ts` (lines 24-172)

Three critical regex-based assertions that **must** stay in sync with README.md:

**Coverage Ratchet Regex** (lines 25-26):
```
/Coverage ratchet policy:\s*W2 `([0-9]+)\/([0-9]+)\/([0-9]+)\/([0-9]+)`, W4 `([0-9]+)\/([0-9]+)\/([0-9]+)\/([0-9]+)`, W6 `([0-9]+)\/([0-9]+)\/([0-9]+)\/([0-9]+)`, W8 `([0-9]+)\/([0-9]+)\/([0-9]+)\/([0-9]+)`, W10 `([0-9]+)\/([0-9]+)\/([0-9]+)\/([0-9]+)`/
```

**Failure mode**: If README.md says `Coverage ratchet policy: W2 \`45/32/32/45\`...` but `.quality/ratchet-policy.json` has different numbers, test fails.

**Hint Budget Regex** (lines 64-65):
```
/Typecheck hint budget policy:\s*W2 `<=([0-9]+)`, W4 `<=([0-9]+)`, W6 `=([0-9]+)`, W8 `=([0-9]+)`, W10 `=([0-9]+)`/
```

**Failure mode**: If README says `W6 =5` but policy says `hintsMax: 10`, test fails.

**Security Ratchet Regex** (lines 124-125):
```
/Security ratchet checkpoints:\s*`([0-9-]+)` `moderate<=([0-9]+), low<=([0-9]+)`, ...
```

**Failure mode**: If README security policy doesn't match 5 checkpoint entries in `.quality/security-policy.json`, test fails.

**Constraint Summary**:
- Changing thresholds in `.quality/ratchet-policy.json` requires identical changes in README.md
- Changing README thresholds requires updating `.quality/ratchet-policy.json`
- Both must be changed **together** in the same commit
- The governance test **always runs** before finalize job, so any mismatch blocks CI

### 2.7 Playwright Setup
**File**: `.config/vitest.config.ts` + `src/pages` tests

Tests run with jsdom environment (line 52: `environment: 'jsdom'`), but **Playwright tests in `src/__tests__/` require `npm run build` first** because they test the built HTML output.

**Failure mode**: 
- Running `npm run test:e2e:smoke` without `npm run build` fails with 404 errors (no dist/).
- CI avoids this by making `test-e2e` depend on `build` job in workflow.

---

## 3. CI/CD FAILURE MODES

### 3.1 Quality Pipeline Artifact Passing
**File**: `.github/workflows/quality.yml` (lines 63-93)

Build job uploads two artifacts:
```yaml
- name: Upload dist
  with:
    name: build-dist
    retention-days: 1
    path: dist/
    
- name: Upload data
  with:
    name: built-data
    retention-days: 1
    path: src/data/
```

**Failure modes**:
- If `npm run build` fails before generating `dist/`, upload succeeds with empty artifact.
- Downstream jobs (`test-unit`, `test-a11y`, etc.) download empty artifacts and tests fail.
- Empty dist/ + empty src/data/ doesn't cause immediate failure, but tests fail with 404s and import errors.

**Non-obvious point**: 
- Retention is 1 day. If a job is delayed and retried >24h later, artifact is deleted.
- `test-unit` job runs immediately after build, so this is not practical issue, but could cause confusion if manual retry is attempted after 24h.

### 3.2 Finalize Job Consolidation
**File**: `.github/workflows/quality.yml` (lines 211-250)

Finalize job depends on all 6 parallel jobs and runs only `if: always()`:
```yaml
needs: [security, lint-and-typecheck, build, test-unit, test-a11y, test-e2e, performance]
if: always()
```

**Consolidation logic** (lines 227-233):
```bash
mkdir -p .quality .a11y src/data
cp -r artifacts/security-artifacts/* .quality/ 2>/dev/null || true
cp -r artifacts/e2e-artifacts/* .quality/ 2>/dev/null || true
cp -r artifacts/perf-artifacts/.quality/* .quality/ 2>/dev/null || true
cp -r artifacts/a11y-artifacts/* .a11y/ 2>/dev/null || true
cp -r artifacts/built-data/* src/data/ 2>/dev/null || true
```

**Failure modes**:
- If multiple jobs upload to same path (e.g., `security-artifacts` and `e2e-artifacts` both write to `.quality/summary.json`), last copy wins, earlier is overwritten.
- `2>/dev/null || true` silences errors, so failed consolidation goes undetected.
- If download-artifact step fails (network issue), subsequent jobs have empty artifacts.

**Non-obvious constraint**: 
- Order of `cp` commands matters. If `built-data` is copied last and overwrites something, that artifact is lost.

### 3.3 Deploy Gating Logic
**File**: `.github/workflows/deploy.yml` (lines 42-89)

Build job conditionally runs based on event type:
```yaml
if: |
  github.event_name == 'schedule' || 
  github.event_name == 'workflow_dispatch' ||
  (github.event_name == 'workflow_run' && needs.check-quality.outputs.quality_success == 'true')
```

**Failure modes**:
- If `workflow_run` is triggered but `check-quality` job fails (quality.yml failed), deploy is skipped silently.
- No notification sent to user that deploy was blocked.
- Schedule-based deploys always run regardless of quality.yml status (line 44 condition is permissive).

**Non-obvious point**: 
- `workflow_dispatch` always deploys, even if quality is failing.
- This is intentional (manual override), but could deploy broken code if user triggers manually.

### 3.4 Scheduled Quality Check
**File**: `.github/workflows/quality.yml` (line 9)
```yaml
schedule:
  - cron: "17 9 * * *"
```

Runs daily at 9:17 UTC. **No check** that the cron schedule is valid in CI.

**Failure mode**: If cron expression is malformed (e.g., typo `"17 9 * * *"` → `"17 9 * * * *"`), GitHub silently disables the schedule. No alert to user. Quality gates stop running.

### 3.5 Environment Variable Cascade
**File**: `.github/workflows/quality.yml` (line 19) + `.github/workflows/deploy.yml` (line 86)

Quality job sets:
```yaml
env:
  QUALITY_PHASE: W10
```

Deploy job sets:
```yaml
- name: Build
  env:
    PUBLIC_CONSULT_API_BASE: ${{ secrets.PUBLIC_CONSULT_API_BASE }}
```

**Failure modes**:
- If `PUBLIC_CONSULT_API_BASE` secret is deleted, deploy build fails silently (Astro build errors not visible).
- If `QUALITY_PHASE` is changed in workflow file but not updated in vitest config default, phase mismatch may occur.

---

## 4. DATA INTEGRITY CONSTRAINTS

### 4.1 Strike Target [DRAFT] Check
**File**: `src/data/__tests__/data-integrity.test.ts` (lines 117-121)

Invariant: `targets.json` must have **zero** targets with `[DRAFT]` in intro field.

```javascript
it('no strike target has [DRAFT] placeholder in intro', () => {
  for (const t of targets.targets) {
    expect(t.intro, `target ${t.slug} has [DRAFT]`).not.toContain('[DRAFT]');
  }
});
```

**Failure modes**:
- If `npm run strike:new` is called and gemini API fails, intro defaults to `[DRAFT] Put your high-value synthesis here...` (script line 35, 39).
- If this target is committed without manual review, test fails.
- **Script graceful degradation**: Strike script catches gemini errors and returns draft template, but test catches this at commit time.

**Cross-file constraint**:
- `scripts/strike-new.mjs` lines 34-40 define the fallback template.
- If template text is changed, test regex must be updated.

### 4.2 System Metrics Registry Consistency
**File**: `src/data/__tests__/data-integrity.test.ts` (lines 158-163)

Invariant: Implementation status counts must sum to total repos.

```javascript
const sum = Object.values(systemMetrics.registry.implementation_status).reduce((a, b) => a + b, 0);
expect(sum).toBe(systemMetrics.registry.total_repos);
```

**Failure mode**: 
- If `npm run generate-data` generates system-metrics.json with mismatched counts (e.g., ACTIVE:50 + ARCHIVED:30 + DESIGN_ONLY:15 = 95, but total_repos:100), test fails.
- Indicates pipeline error in source data generation.

### 4.3 Graph Edge Referential Integrity
**File**: `src/data/__tests__/data-integrity.test.ts` (lines 107-112)

Invariant: Every edge must reference existing nodes.

```javascript
const nodeIds = new Set(graph.nodes.map(n => n.id));
for (const e of graph.edges) {
  expect(nodeIds.has(e.source)).toBe(true);
  expect(nodeIds.has(e.target)).toBe(true);
}
```

**Failure mode**: 
- If graph.json is manually edited and edge added with non-existent source node ID, test fails.
- Cytoscape visualization will drop orphaned edges, rendering incomplete dependency graph.

---

## 5. GOVERNANCE SYNC CONSTRAINTS

### 5.1 Quality Governance Test Assertions
**File**: `src/data/__tests__/quality-governance.test.ts` (lines 83-187)

**Assertion 1**: README perf threshold matches Lighthouse config
- **File**: `README.md` + `.config/lighthouserc.cjs`
- **Pattern**: README `Perf ≥ 90` must match lighthouserc `minScore: 0.90`
- **Failure mode**: If threshold updated in README without updating `.config/lighthouserc.cjs` (or vice versa), test fails.

**Assertion 2**: README ratchet schedule matches policy file (lines 98-121)
- **Files**: `README.md` + `.quality/ratchet-policy.json`
- **Pattern**: README coverage values must match policy phases exactly
- **Example**: `W10 \`45/32/32/45\`` in README must match `phases.W10.coverage: {statements: 45, branches: 32, functions: 32, lines: 45}`
- **Failure mode**: Changing coverage threshold in one place without the other breaks test.

**Assertion 3**: CI workflow explicitly sets phase and runs parity pipeline (lines 166-172)
- **File**: `.github/workflows/quality.yml`
- **Check**: Asserts `QUALITY_PHASE: W10` is set and security tests are included
- **Failure mode**: If workflow is refactored and `QUALITY_PHASE` removed, test fails.

**Assertion 4**: Coverage/typecheck gates are policy-driven (lines 182-187)
- **Files**: `.config/vitest.config.ts` + `scripts/check-typecheck-hints.mjs`
- **Check**: Asserts vitest config reads `.quality/ratchet-policy.json` and hints script reads policy
- **Failure mode**: If gates are hardcoded instead of policy-driven, test fails.

### 5.2 Multi-File Sync Points
**Summary of "if X then Y" constraints**:

| File A | Change | File B | Required Change | Why |
|--------|--------|--------|-----------------|-----|
| `README.md` | Update coverage threshold `W10 45/32/32/45` | `.quality/ratchet-policy.json` | Update `phases.W10.coverage` | Test parses both and asserts equality |
| `.quality/ratchet-policy.json` | Add new phase `W12` | `README.md` | Add `W12` to ratchet policy section | Test regex fails if phase missing |
| `.config/lighthouserc.cjs` | Change `minScore: 0.85` | `README.md` | Update `Perf ≥ 85` | Test asserts match |
| `scripts/check-typecheck-hints.mjs` | Change budget extraction logic | `.quality/ratchet-policy.json` | Ensure `typecheck.hintsMax` still readable | Script will fail to parse |
| `astro.config.mjs` | Change `base: '/portfolio'` | All `src/pages/*.astro` | Update all relative/absolute links | Routes break if not coordinated |
| `.github/workflows/quality.yml` | Change `QUALITY_PHASE: W10` | `.quality/ratchet-policy.json` | Ensure phase `W10` exists in policy | Vitest config resolution fails |

---

## 6. SCRIPT FAILURE MODES & GRACEFUL DEGRADATION

### 6.1 Strike Intelligence Engine (AI Content Generation)
**File**: `scripts/strike-new.mjs` (lines 11-69)

Three functions with **identical graceful fallback pattern**:

**generateAIIntro()** (lines 11-41):
```javascript
try {
  const output = execSync(`gemini -p "${prompt}"`, { encoding: 'utf8' });
  // ... filter output for ANSI codes, "Loading", "Server", etc.
  return cleanOutput || `[DRAFT] Put your high-value synthesis here...`;
} catch (error) {
  console.warn('⚠️ AI generation failed. Falling back to draft template.');
  return `[DRAFT] Put your high-value synthesis here...`;
}
```

**Failure modes**:
1. **gemini CLI not installed**: execSync throws "command not found"
2. **gemini API key missing**: execSync returns error message in stdout
3. **gemini API rate limit**: output truncated or connection reset
4. **empty output**: cleanOutput is empty string, falls back to template

**Graceful degradation**: All failures return `[DRAFT]` template. No exception thrown. Script continues.

**Critical constraint**: 
- `data-integrity.test.ts` line 119 asserts no target has `[DRAFT]`.
- If strike:new is called with failing gemini, returns draft intro, must be manually edited before commit.
- **This is intentional**: allows creating strikes offline (no API required), but prevents accidental commit of drafts.

**generateAIProposal()** (lines 43-69):
- Same pattern as intro
- Fallback: `<p>[DRAFT PROPOSAL] Detailed architectural proposal goes here.</p>`
- Failure: Returns raw HTML or draft HTML. Script doesn't fail.

**Script exit failures**:
- Line 77-79: If company or role not provided, exits with code 1.
- Line 88-91: If slug already exists in targets.json, exits with code 1.
- All other failures (gemini, OG generation) are logged but script continues.

### 6.2 Scout Agent (Candidate Discovery)
**File**: `scripts/scout-agent.mjs`

Pattern: For each persona, call gemini. If fails, warn and continue.

```javascript
try {
  const output = execSync(`gemini -p "${prompt}"`, { encoding: 'utf8' });
  const candidates = JSON.parse(output);
} catch (error) {
  console.warn(`⚠️ Scout failed for ${persona.id}`);
  // Continue to next persona
}
```

**Failure modes**:
1. **Invalid JSON from gemini**: JSON.parse throws
2. **gemini timeout**: execSync times out
3. **missing personas.json**: readFileSync throws

**Graceful degradation**: 
- Errors are caught, warning logged, loop continues to next persona.
- Some personas may successfully generate candidates, others skipped.
- scout-candidates.json written with whatever was found.

**Non-obvious point**: 
- Script doesn't fail if **all** personas fail. It writes scout-candidates.json with empty array.
- User must check output/log to realize script didn't find anything.

### 6.3 Operative Sweep (Batch Job Processing)
**File**: `scripts/operative-sweep.mjs`

Reads job descriptions from `intake/job-descriptions/*.txt|.md`, calls gemini per file, calls `npm run strike:new` for each.

```javascript
for (const file of jobFiles) {
  try {
    const output = execSync(`gemini -p "${prompt}"`, { encoding: 'utf8' });
    const target = parseTargetJson(output);
    execSync(`npm run strike:new "${target.company}" "${target.role}" "${target.persona_id}"`);
    fs.renameSync(filePath, processedPath);
  } catch (error) {
    console.error(`❌ Error processing ${file}: ${error.message}`);
    // Continue to next file
  }
}
```

**Failure modes**:
1. **Malformed JSON from gemini**: parseTargetJson throws
2. **strike:new exits with code 1** (slug exists, etc.): execSync throws, file not moved to processed/
3. **intake dir doesn't exist**: readdir throws before loop

**Graceful degradation**: 
- Per-file errors are logged, loop continues.
- Processed files are moved to `intake/job-descriptions/processed/` only if strike:new succeeds.
- Failed files remain in source directory for manual retry/inspection.

**Non-obvious point**: 
- If strike:new fails (e.g., slug already exists), the job description file stays in `intake/job-descriptions/`, not processed/.
- User must manually move it or fix duplicate before re-running.

### 6.4 Typecheck Hints Budget Enforcement
**File**: `scripts/check-typecheck-hints.mjs`

**Failure mode 1: Missing policy file**
```javascript
const policy = JSON.parse(readFileSync(resolve(root, '.quality/ratchet-policy.json'), 'utf-8'));
```
If file doesn't exist, throws immediately. No fallback.

**Failure mode 2: Parsing hint count**
```javascript
const lines = output.split('\n').map(line => line.trim());
const hints = lines.filter(line => line.includes('ts/astro(')).length;
```
If astro check output format changes, hint count may be 0 even if hints exist. No validation.

**Failure mode 3: Phase mismatch**
```javascript
const phase = process.env.QUALITY_PHASE || policy.defaultPhase;
const budget = policy.phases[phase]?.typecheck?.hintsMax;
if (budget === undefined) throw new Error(...);
```
If phase doesn't exist in policy, error thrown. Script exits code 1.

**Non-obvious point**: 
- Script spawns `npx astro check`, which itself is a separate tool.
- If astro check fails (syntax error in tsconfig), astro throws, process.exit(1), script never reaches hint counting.
- Two failure modes: astro fail vs hint budget exceed.

---

## 7. PREFLIGHT SCRIPT BEHAVIOR

**File**: `package.json` (line 72)

```
npm run lint && npm run typecheck && npm run build && npm run validate && npm run sync:a11y-routes && npm run check:runtime-route-manifest && npm run test
```

**Sequential steps**:
1. **lint** — runs `biome check .` (tabs, quotes, formatting)
2. **typecheck** — runs `astro check` (type diagnostics, NOT hint budget check)
3. **build** — full build chain (includes pagefind indexing)
4. **validate** — link checking + HTML validation
5. **sync:a11y-routes** — syncs a11y route list
6. **check:runtime-route-manifest** — asserts routes match manifest
7. **test** — vitest unit + integration tests

**Failure modes**:

| Step | Failure | Downstream Impact |
|------|---------|-------------------|
| lint | Biome formatting issue | Stops. No build. |
| typecheck | Type error in .astro | Stops. No build. |
| build | Missing async function | Stops. No dist/. All downstream fail. |
| validate | Dead link in HTML | Stops. dist/ exists but links broken. |
| sync:a11y-routes | Missing data | Stops. a11y tests can't run. |
| check:runtime-route-manifest | Routes mismatch | Stops. Indicates build/runtime divergence. |
| test | Coverage below threshold | Stops. Quality gate fails. |

**Non-obvious point**: 
- Preflight runs **full vitest**, not just unit tests.
- This includes a11y tests, which require `npm run sync:a11y-routes` to populate the route manifest.
- If step 5 fails, step 7 fails even if tests themselves are valid.

**Order dependency**: 
- build (step 3) must complete before validate (step 4), sync:a11y-routes (step 5), check:runtime-route-manifest (step 6).
- If any early step fails, later steps never run, masking their potential issues.

**Use case**: 
- Preflight is meant for **pre-push check** before committing.
- User runs `npm run preflight` locally, fails on step 3 (build), pushes branch anyway.
- CI quality.yml runs in parallel, also fails on build. Same issue caught by CI.
- Preflight doesn't add value if user doesn't run it locally.

---

## 8. SUMMARY: EVERY "IF X THEN Y" CONSTRAINT

### Build-Level Constraints
| Constraint | File A | File B | Impact |
|-----------|--------|--------|--------|
| Base path set in astro.config.mjs | astro.config.mjs:9 | all `.astro` files | Routing breaks if base changed without updating links |
| Build script chain order | package.json:23 | all sync/astro/pagefind | Any step fail stops entire build |
| Policy file exists at runtime | .config/vitest.config.ts:29 | .quality/ratchet-policy.json | Vitest crashes if policy missing |
| Phase name exists in policy | .github/workflows/quality.yml:19 | .quality/ratchet-policy.json | Vitest config fails to resolve thresholds |
| Coverage thresholds sync | README.md | .quality/ratchet-policy.json | quality-governance.test.ts fails if mismatch |
| Hint budget sync | README.md | .quality/ratchet-policy.json | quality-governance.test.ts fails if mismatch |
| Lighthouse threshold sync | README.md | .config/lighthouserc.cjs | quality-governance.test.ts fails if mismatch |
| Canvas stub installed | src/test/setup.ts | .config/vitest.config.ts | Tests fail if setup file missing or unregistered |
| Data file shape | src/data/*.json | src/data/__tests__/data-integrity.test.ts | Tests fail, UI renders undefined values |

### CI-Level Constraints
| Constraint | File A | File B | Impact |
|-----------|--------|--------|--------|
| Artifact consolidation order | .github/workflows/quality.yml:227-233 | artifact paths | Later cp commands overwrite earlier ones |
| Deploy gating on quality success | .github/workflows/deploy.yml:49 | .github/workflows/quality.yml | Broken code deployed if quality blocked |
| Schedule cron valid | .github/workflows/quality.yml:9 | GitHub | Invalid cron silently disables schedule |
| Secrets exist in deploy | .github/workflows/deploy.yml:86 | GitHub secrets | Build fails if secret deleted |

### Script-Level Constraints
| Constraint | File A | File B | Impact |
|-----------|--------|--------|--------|
| Strike intro without [DRAFT] | scripts/strike-new.mjs:35,39 | src/data/__tests__/data-integrity.test.ts:119 | Test fails if gemini unavailable and draft template committed |
| Hint parsing regex | scripts/check-typecheck-hints.mjs:77-80 | astro check output format | Hint count wrong if astro output changes |
| Job description processing order | scripts/operative-sweep.mjs:81 | intake/ directory | Failed files not moved to processed/, remain for retry |
| gemini CLI availability | All strike/scout/sweep scripts | system PATH | Scripts return [DRAFT] templates, no failure |

---

## 9. CRITICAL FILES SUMMARY

| File | Line(s) | Purpose | Failure Impact |
|------|---------|---------|-----------------|
| `astro.config.mjs` | 9 | Sets base path | Routing breaks if changed |
| `astro.config.mjs` | 21 | Chunk size warning | Informational only, doesn't fail build |
| `astro.config.mjs` | 24-29 | Manual vendor chunks | OOMs if large vendor added without chunk |
| `package.json` | 6 | Node version constraint | CI uses 22, build fails on < 22 |
| `package.json` | 23 | Build script chain | One fail stops all |
| `package.json` | 72 | Preflight script | Pre-push check, catches issues early |
| `src/test/setup.ts` | 36-47 | Canvas stub | Tests fail if removed |
| `.config/vitest.config.ts` | 29-74 | Policy-driven config | Vitest crashes if policy missing/invalid |
| `.github/workflows/quality.yml` | 19 | QUALITY_PHASE env | Phase mismatch causes vitest fail |
| `.github/workflows/quality.yml` | 227-233 | Artifact consolidation | Last cp wins, earlier overwrites |
| `.github/workflows/deploy.yml` | 49 | Deploy gating | Blocks deploy if quality failed |
| `src/data/__tests__/quality-governance.test.ts` | 25-26, 64-65, 124-125 | README sync checks | Fails if policy/README mismatch |
| `src/data/__tests__/data-integrity.test.ts` | 18, 53, 92-98, 119 | Data shape validation | Tests fail, UI breaks if invalid |
| `.quality/ratchet-policy.json` | 1-84 | Policy source of truth | All phase/coverage/security checks read from here |
| `scripts/strike-new.mjs` | 35, 39 | [DRAFT] fallback | Test fails if template committed |
| `scripts/check-typecheck-hints.mjs` | 7, 29-42, 77-80 | Hint budget enforcement | Fails if policy missing/phase invalid/format changes |

