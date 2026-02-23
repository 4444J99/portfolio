# @4444j99/quality-ratchet-kit

Reusable quality ratchet utilities extracted from the portfolio quality pipeline.

## Usage

```js
import { loadRatchetPolicy, resolveCoverageThresholds } from '@4444j99/quality-ratchet-kit';

const policy = loadRatchetPolicy('.quality');
const { phase, coverage } = resolveCoverageThresholds(policy);
```

## API

- `loadRatchetPolicy(qualityDir)` — Load ratchet-policy.json
- `resolvePhase(policy, envPhase?)` — Get the active quality phase
- `resolveCoverageThresholds(policy, envPhase?)` — Get coverage floors for a phase
- `loadSecurityPolicy(qualityDir)` — Load security-policy.json
- `resolveSecurityCheckpoint(checkpoints, referenceTime?)` — Find the active checkpoint
- `checkThresholds(actual, thresholds)` — Compare metrics against policy
- `validateGovernanceSync(readmePath, policy)` — Verify README matches policy JSON
