# @4444j99/quality-ratchet-kit

A centralized toolkit for enforcing progressive quality thresholds across codebases, extracted from the portfolio quality pipeline. It provides a formal system for phase-based quality ratcheting, ensuring test coverage, bundle sizes, and security policies never regress.

## Core Concepts

The Ratchet Kit relies on a `.quality/` directory containing two main policies:

- `ratchet-policy.json`: Defines phase-based coverage thresholds (e.g., Bronze, Silver, Gold).
- `security-policy.json`: Defines allowed vulnerability thresholds over time based on checkpoints.

It enforces the "Ratchet System": metrics can only go up (or stay at the defined floor), never down.

## Installation

```bash
npm install -D @4444j99/quality-ratchet-kit
```

## CLI Usage

The package exports three CLI binaries designed for use in CI/CD pipelines (like GitHub Actions):

### 1. `ratchet-kit check-quality-deltas`

Compares the current quality metrics against the previous ledger snapshot to ensure no regressions occurred (the ratchet didn't slip backwards). Ensures stability and prevents performance drift.

```bash
npx ratchet-kit check-quality-deltas --ledger src/data/quality-ledger.json --metrics .quality/artifacts/quality-metrics.json
```

### 2. `ratchet-kit verify-quality-contracts`

Verifies that the `README.md` documentation accurately reflects the JSON policies in `.quality/`. Ensures that human-readable governance documentation Stays in strict sync with the CI enforcement logic.

```bash
npx ratchet-kit verify-quality-contracts --readme README.md --policy .quality/ratchet-policy.json
```

### 3. `ratchet-kit check-bundle-budgets`

Analyzes the Astro build output to enforce bundle size budgets per page route and per chunk, ensuring performance remains tight.

```bash
npx ratchet-kit check-bundle-budgets --dist dist --config .quality/perf-budgets.json
```

## Node API Usage

```javascript
import { loadRatchetPolicy, resolveCoverageThresholds } from '@4444j99/quality-ratchet-kit';

// Load policy from a directory
const policy = loadRatchetPolicy('.quality');

// Get current acting phase floors based on environment
const { phase, coverage } = resolveCoverageThresholds(policy);

console.log(`Current phase: ${phase}`);
console.log(`Statements floor: ${coverage.statements}%`);
```

## Available API Methods

- `loadRatchetPolicy(qualityDir)` — Load `ratchet-policy.json`
- `resolvePhase(policy, envPhase?)` — Get the active quality phase
- `resolveCoverageThresholds(policy, envPhase?)` — Get coverage floors for a phase
- `loadSecurityPolicy(qualityDir)` — Load `security-policy.json`
- `resolveSecurityCheckpoint(checkpoints, referenceTime?)` — Find the active checkpoint
- `checkThresholds(actual, thresholds)` — Compare metrics against policy
- `validateGovernanceSync(readmePath, policy)` — Verify README matches policy JSON
