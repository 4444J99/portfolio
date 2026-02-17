## Summary
- What changed:
- Why this change is needed:

## Quality Gates
- [ ] `npm run quality:local` passes locally
- [ ] `npm run quality:summary` regenerated and reviewed
- [ ] Security policy impact reviewed (`.quality/security-policy.json`) when thresholds change
- [ ] Security allowlist impact reviewed (`.quality/security-allowlist.json`) when entries change
- [ ] No security gate regressions (`npm run test:security`)
- [ ] No prod security regressions (`npm run test:security:prod`)
- [ ] No GitHub advisory delta regressions (`npm run test:security:github`)
- [ ] No security drift regressions (`npm run test:security:drift`)
- [ ] No route budget regressions (`npm run test:perf:budgets`)
- [ ] Runtime a11y coverage meets current ratchet checkpoint (`npm run test:a11y:coverage`)
- [ ] E2E smoke suite is stable with zero flaky tests (`npm run test:e2e:smoke`)
- [ ] Runtime telemetry has zero uncategorized browser errors (`npm run test:runtime:errors`)

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
