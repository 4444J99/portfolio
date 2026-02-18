import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../../../');
const workflow = readFileSync(resolve(root, '.github/workflows/quality.yml'), 'utf-8');
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));
const qualityGates = readFileSync(resolve(root, 'src/components/dashboard/QualityGates.astro'), 'utf-8');
const metricsType = readFileSync(resolve(root, 'src/types/data.ts'), 'utf-8');
const runtimeErrorScript = readFileSync(resolve(root, 'scripts/test-runtime-errors.mjs'), 'utf-8');

describe('quality governance v2 contracts', () => {
  it('includes security gate and blocking parity pipeline in CI', () => {
    expect(workflow).toContain('name: Security gates (prod + full tree)');
    expect(workflow).toContain('npm run test:security:prod');
    expect(workflow).toContain('npm run test:security');
    expect(workflow).toContain('npm run test:security:github');
    expect(workflow).toContain('npm run test:security:drift');
    expect(workflow).toContain('cron: "17 9 * * *"');
    expect(workflow).toContain('Policy governance guard');
    expect(workflow).toContain('run: npm run quality:core');
  });

  it('exposes the expanded quality scripts in package.json', () => {
    const scripts = packageJson.scripts ?? {};
    expect(typeof scripts['test:security:prod']).toBe('string');
    expect(typeof scripts['test:security']).toBe('string');
    expect(typeof scripts['test:security:github']).toBe('string');
    expect(typeof scripts['test:security:drift']).toBe('string');
    expect(typeof scripts['test:a11y:coverage']).toBe('string');
    expect(typeof scripts['test:e2e:smoke']).toBe('string');
    expect(typeof scripts['test:runtime:errors']).toBe('string');
    expect(typeof scripts['collect:perf']).toBe('string');
    expect(typeof scripts['test:perf:budgets']).toBe('string');
    expect(typeof scripts['quality:green-track']).toBe('string');
    expect(typeof scripts['quality:ledger']).toBe('string');
    expect(typeof scripts['quality:core']).toBe('string');
    expect(typeof scripts['quality:local']).toBe('string');
  });

  it('runtime error telemetry is manifest-driven', () => {
    expect(runtimeErrorScript).toContain('scripts/runtime-a11y-routes.json');
    expect(runtimeErrorScript).toContain("parseOption('manifest'");
    expect(runtimeErrorScript).toContain("parseOption('route-limit'");
    expect(runtimeErrorScript).toContain('manifest.routes');
  });

  it('renders security/perf sections in quality gates UI', () => {
    expect(qualityGates).toContain('Security Audit');
    expect(qualityGates).toContain('Perf Budgets');
    expect(qualityGates).toContain('Runtime Errors');
    expect(qualityGates).toContain('Green Run Tracker');
    expect(qualityGates).toContain('badges/security.svg');
    expect(qualityGates).toContain('badges/perf-budgets.svg');
  });

  it('defines security/performance fields in QualityMetrics type', () => {
    expect(metricsType).toContain('security: {');
    expect(metricsType).toContain('prodCounts');
    expect(metricsType).toContain('policyCheckpoint');
    expect(metricsType).toContain('githubOpenAlerts');
    expect(metricsType).toContain('githubAdvisoryStatus');
    expect(metricsType).toContain('performance: {');
    expect(metricsType).toContain('chunkBudgetsStatus');
    expect(metricsType).toContain('interactionBudgetsStatus');
    expect(metricsType).toContain('routeBudgetCheckpoint');
    expect(metricsType).toContain('runtimeCoverage');
    expect(metricsType).toContain('routeBudgetsStatus');
    expect(metricsType).toContain('runtimeErrors: {');
    expect(metricsType).toContain('stability: {');
  });

  it('tracks automation configs and security policy contracts', () => {
    expect(existsSync(resolve(root, '.github/dependabot.yml'))).toBe(true);
    expect(existsSync(resolve(root, '.github/workflows/security-drift.yml'))).toBe(true);
    expect(existsSync(resolve(root, '.quality/security-allowlist.json'))).toBe(true);
    expect(existsSync(resolve(root, '.quality/security-policy.json'))).toBe(true);
    expect(existsSync(resolve(root, '.quality/security-register.json'))).toBe(true);
    expect(existsSync(resolve(root, '.quality/security-baseline.json'))).toBe(true);
    expect(existsSync(resolve(root, '.quality/runtime-error-allowlist.json'))).toBe(true);
    expect(existsSync(resolve(root, '.github/CODEOWNERS'))).toBe(true);
  });
});
