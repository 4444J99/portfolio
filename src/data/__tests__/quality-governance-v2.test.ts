import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../../../');
const workflow = readFileSync(resolve(root, '.github/workflows/quality.yml'), 'utf-8');
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));
const qualityGates = readFileSync(resolve(root, 'src/components/dashboard/QualityGates.astro'), 'utf-8');
const metricsType = readFileSync(resolve(root, 'src/types/data.ts'), 'utf-8');

describe('quality governance v2 contracts', () => {
  it('includes security gate and blocking parity pipeline in CI', () => {
    expect(workflow).toContain('name: Security gate');
    expect(workflow).toContain('run: npm run test:security');
    expect(workflow).toContain('run: npm run quality:local');
  });

  it('exposes the expanded quality scripts in package.json', () => {
    const scripts = packageJson.scripts ?? {};
    expect(typeof scripts['test:security']).toBe('string');
    expect(typeof scripts['test:a11y:coverage']).toBe('string');
    expect(typeof scripts['test:e2e:smoke']).toBe('string');
    expect(typeof scripts['collect:perf']).toBe('string');
    expect(typeof scripts['test:perf:budgets']).toBe('string');
    expect(typeof scripts['quality:local']).toBe('string');
  });

  it('renders security/perf sections in quality gates UI', () => {
    expect(qualityGates).toContain('Security Audit');
    expect(qualityGates).toContain('Perf Budgets');
    expect(qualityGates).toContain('badges/security.svg');
    expect(qualityGates).toContain('badges/perf-budgets.svg');
  });

  it('defines security/performance fields in QualityMetrics type', () => {
    expect(metricsType).toContain('security: {');
    expect(metricsType).toContain('performance: {');
    expect(metricsType).toContain('runtimeCoverage');
    expect(metricsType).toContain('routeBudgetsStatus');
  });

  it('tracks automation configs for dependency updates and security allowlist', () => {
    expect(existsSync(resolve(root, '.github/dependabot.yml'))).toBe(true);
    expect(existsSync(resolve(root, '.quality/security-allowlist.json'))).toBe(true);
  });
});
