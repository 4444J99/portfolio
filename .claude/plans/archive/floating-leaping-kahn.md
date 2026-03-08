# Fix CI Quality Pipeline Hang

## Context

The CI "Quality parity pipeline" step runs `npm run quality:core`, a 21-step sequential `&&` chain. It's hanging for 40+ minutes because **Lighthouse CI audits 32 routes × 3 runs = 96 Chrome audits** with no timeout. On GitHub Actions runners, each audit takes 30-60s, totaling 48-96 minutes.

A `quality:core:no-lh` variant already exists in `package.json` that skips the Lighthouse step. The CI workflow should use it — production Lighthouse scores are already covered by `lighthouse:cloud` (PSI API).

## Fix (2 files)

### 1. `.github/workflows/quality.yml` — line 77

Switch CI from `quality:core` to `quality:core:no-lh`:

```yaml
# Before
run: npm run quality:core

# After
run: npm run quality:core:no-lh
```

All other gates still run: typecheck, build, vitest, a11y (static + runtime), E2E smoke, runtime errors, HTML validation, bundle budgets, badges, etc. Only the 96-audit local Lighthouse is dropped.

### 2. `lighthouserc.cjs` — line 42

Reduce runs for local use:

```js
// Before
numberOfRuns: 3,

// After
numberOfRuns: 1,
```

Makes `npm run lighthouse` (still available locally via `quality:local`) do 32 audits instead of 96. Finishes in ~5 min instead of 30+.

## Files Modified

| File | Line | Change |
|------|------|--------|
| `.github/workflows/quality.yml` | 77 | `quality:core` → `quality:core:no-lh` |
| `lighthouserc.cjs` | 42 | `numberOfRuns: 3` → `numberOfRuns: 1` |

## Verification

1. Push to main → CI quality gates pass in ~10-15 min (not 40+)
2. Deploy workflow triggers on quality success
3. `npm run lighthouse` still works locally (32 audits, ~5 min)
