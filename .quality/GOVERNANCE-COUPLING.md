# Governance Coupling Map

Instantiation of [SOP: CI/CD Pipeline Resilience](~/Workspace/meta-organvm/organvm-corpvs-testamentvm/docs/operations/sop--cicd-resilience.md) for the portfolio project.

## Coupling Map

| If you change... | Also update... | Enforced by |
|-----------------|----------------|-------------|
| `.config/lighthouserc.cjs` perf score | `README.md` Perf badge value | `quality-governance.test.ts` |
| `.quality/ratchet-policy.json` coverage phases | `README.md` coverage ratchet table | `quality-governance.test.ts` |
| `.quality/ratchet-policy.json` typecheck budgets | `README.md` typecheck hint budget line | `quality-governance.test.ts` |
| `.quality/security-policy.json` checkpoints | `README.md` security ratchet checkpoints | `quality-governance.test.ts` |
| `.quality/ratchet-policy.json` defaultPhase | `.github/workflows/quality.yml` `QUALITY_PHASE` env | `quality-governance.test.ts` |
| Any `src/pages/*.astro` (add/remove) | Run `npm run sync:a11y-routes` | `check-runtime-route-manifest.mjs` |
| Any `src/content/logos/*.md` (add/remove) | Run `npm run sync:a11y-routes` | `check-runtime-route-manifest.mjs` |
| `src/data/personas.json` (add/remove persona) | Run `npm run sync:a11y-routes` | `check-runtime-route-manifest.mjs` |
| `src/data/targets.json` (add/remove target) | Run `npm run sync:a11y-routes` | `check-runtime-route-manifest.mjs` |

## Preflight Command

```bash
npm run preflight
```

Catches ~80% of CI failures locally. Run before every push.

## CI-Only Checks (cannot reproduce locally)

- **Lighthouse** — requires headless Chrome in CI runner environment; scores vary by hardware
- **Playwright runtime a11y** — browser-dependent, included in `quality:local` but may differ from CI
- **E2E smoke** — Playwright browser tests, environment-sensitive

## Environment-Split Thresholds

| Metric | CI floor (error) | Local target (warn) |
|--------|------------------|---------------------|
| Lighthouse performance | 0.9 | 0.95+ |
| Lighthouse accessibility | 0.95 | 1.0 |
| Coverage (stmt/branch/func/line) | W10: 45/32/32/45 | W11+ targets |
| Typecheck hints | Budget from ratchet-policy.json | Zero new hints |
