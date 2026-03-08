# Fix Portfolio Deployment: Site Not Live

## Context

The portfolio at `https://4444j99.github.io/portfolio/` is not deploying. Root cause chain:

1. **Earlier today**: Multiple rapid pushes to main (badge SVGs, CI fixes, ratchet kit, etceter4 removal, omega update, metrics sync) each triggered a Quality Gates workflow run.
2. **Older commits had broken `package-lock.json`** — `npm ci` failed for commits before `e0f3406` (our fix). These quality runs completed as failures.
3. **Newer commits pass `npm ci`** but the `quality:core:no-lh` step is a single massive chain of ~20 npm scripts (typecheck → build → vitest → playwright a11y → e2e → perf → validate → badges...). The Playwright tests are hanging indefinitely on CI.
4. **No concurrency limit** in `quality.yml` — 4 runs are executing simultaneously, burning CI minutes.
5. **No job timeout** — GitHub defaults to 6 hours, so hung Playwright tests run for hours.
6. **Deploy workflow requires quality success** (`workflow_run` trigger) — since quality never succeeds, deploy never runs.
7. **Last successful deploy**: today at 10:09 UTC via daily schedule cron, which checked the _previous_ quality run status. But subsequent pushes changed the site content, and those changes haven't deployed.

## Plan

### Step 1: Cancel stuck quality runs

```bash
gh run cancel 22319378414 --repo 4444J99/portfolio  # omega evidence push (5h+ stuck)
gh run cancel 22319391403 --repo 4444J99/portfolio  # application-pipeline push (5h+ stuck)
gh run cancel 22321626238 --repo 4444J99/portfolio  # metrics sync push (4h+ stuck)
gh run cancel 22319461489 --repo 4444J99/portfolio  # dependabot PR (5h+ stuck)
```

### Step 2: Add concurrency + timeout to quality.yml

**File:** `/Users/4jp/Workspace/4444J99/portfolio/.github/workflows/quality.yml`

Add after `permissions:` block (before `jobs:`):
```yaml
concurrency:
  group: quality-${{ github.ref }}
  cancel-in-progress: true
```

Add `timeout-minutes: 30` to the `build-and-test` job. 30 minutes is generous for the full pipeline but catches infinite hangs.

### Step 3: Add concurrency to deploy.yml

**File:** `/Users/4jp/Workspace/4444J99/portfolio/.github/workflows/deploy.yml`

Already has concurrency for `pages` group — no change needed.

### Step 4: Trigger manual deploy

After committing the workflow fix, trigger a manual deploy:
```bash
gh workflow run deploy.yml --repo 4444J99/portfolio
```

The `workflow_dispatch` event bypasses the quality gate check (deploy.yml build job condition already allows it).

### Step 5: Verify site is live

```bash
curl -s -o /dev/null -w "%{http_code}" https://4444j99.github.io/portfolio/
```

## Files to Modify

| File | Change |
|------|--------|
| `.github/workflows/quality.yml` | Add `concurrency` block + `timeout-minutes: 30` on job |

## Verification

1. `gh run list --repo 4444J99/portfolio --workflow deploy.yml --limit 3` — latest run should be `success` via `workflow_dispatch`
2. `curl -s https://4444j99.github.io/portfolio/ | grep -o '<title>.*</title>'` — should return portfolio title
3. `gh run list --repo 4444J99/portfolio --workflow quality.yml --status in_progress` — should be empty (no more hung runs)
