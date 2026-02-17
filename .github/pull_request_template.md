## Summary
- What changed:
- Why this change is needed:

## Quality Gates
- [ ] `npm run quality:local` passes locally
- [ ] `npm run quality:summary` regenerated and reviewed
- [ ] No security gate regressions (`npm run test:security`)
- [ ] No route budget regressions (`npm run test:perf:budgets`)
- [ ] Runtime a11y coverage remains >= 75% (`npm run test:a11y:coverage`)
- [ ] E2E smoke suite is stable with zero flaky tests (`npm run test:e2e:smoke`)

## Risk Notes
- Behavioral risk:
- Performance risk:
- Security risk:
- Rollback plan:

## Evidence
- Key artifact(s) reviewed:
  - `.quality/quality-summary.md`
  - `.quality/security-summary.json`
  - `.quality/perf-summary.json`
  - `.quality/runtime-coverage-summary.json`
