import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../../../');
const readme = readFileSync(resolve(root, 'README.md'), 'utf-8');
const lighthouseRc = readFileSync(resolve(root, 'lighthouserc.cjs'), 'utf-8');
const workflow = readFileSync(resolve(root, '.github/workflows/quality.yml'), 'utf-8');
const vitestConfig = readFileSync(resolve(root, 'vitest.config.ts'), 'utf-8');
const typecheckScript = readFileSync(resolve(root, 'scripts/check-typecheck-hints.mjs'), 'utf-8');
const policy = JSON.parse(readFileSync(resolve(root, '.quality/ratchet-policy.json'), 'utf-8'));

function parseCoverageRatchetFromReadme() {
  const match = readme.match(
    /Coverage ratchet policy:\s*W2 `([0-9]+)\/([0-9]+)\/([0-9]+)\/([0-9]+)`, W4 `([0-9]+)\/([0-9]+)\/([0-9]+)\/([0-9]+)`, W6 `([0-9]+)\/([0-9]+)\/([0-9]+)\/([0-9]+)`/
  );
  expect(match).not.toBeNull();
  return {
    W2: {
      statements: Number(match![1]),
      branches: Number(match![2]),
      functions: Number(match![3]),
      lines: Number(match![4]),
    },
    W4: {
      statements: Number(match![5]),
      branches: Number(match![6]),
      functions: Number(match![7]),
      lines: Number(match![8]),
    },
    W6: {
      statements: Number(match![9]),
      branches: Number(match![10]),
      functions: Number(match![11]),
      lines: Number(match![12]),
    },
  };
}

function parseHintRatchetFromReadme() {
  const match = readme.match(/Typecheck hint budget policy:\s*W2 `<=([0-9]+)`, W4 `<=([0-9]+)`, W6 `=([0-9]+)`/);
  expect(match).not.toBeNull();
  return {
    W2: Number(match![1]),
    W4: Number(match![2]),
    W6: Number(match![3]),
  };
}

describe('quality governance drift checks', () => {
  it('README performance threshold matches Lighthouse enforcement', () => {
    const readmePerf = readme.match(/Perf ≥ ([0-9]+)/);
    const configPerf = lighthouseRc.match(/'categories:performance': \['error', \{ minScore: ([0-9.]+) \}\]/);

    expect(readmePerf).not.toBeNull();
    expect(configPerf).not.toBeNull();

    const readmeValue = Number(readmePerf![1]);
    const configValue = Math.round(Number(configPerf![1]) * 100);
    expect(readmeValue).toBe(configValue);
  });

  it('README ratchet schedule matches policy file', () => {
    const readmeCoverage = parseCoverageRatchetFromReadme();
    expect(readmeCoverage).toEqual({
      W2: policy.phases.W2.coverage,
      W4: policy.phases.W4.coverage,
      W6: policy.phases.W6.coverage,
    });

    const readmeHints = parseHintRatchetFromReadme();
    expect(readmeHints).toEqual({
      W2: policy.phases.W2.typecheck.hintsMax,
      W4: policy.phases.W4.typecheck.hintsMax,
      W6: policy.phases.W6.typecheck.hintsMax,
    });
  });

  it('CI workflow explicitly sets the phase and runs the parity pipeline', () => {
    expect(workflow).toContain('QUALITY_PHASE: W6');
    expect(workflow).toContain('run: npm run quality:local');
    expect(workflow).toContain('run: npm run quality:summary -- --allow-missing');
  });

  it('coverage and typecheck gates are policy-driven, not hardcoded', () => {
    expect(vitestConfig).toContain('.quality/ratchet-policy.json');
    expect(vitestConfig).toContain('thresholds: coverage');
    expect(typecheckScript).toContain('.quality/ratchet-policy.json');
    expect(typecheckScript).toContain('policy.phases?.[phase]?.typecheck?.hintsMax');
  });
});
