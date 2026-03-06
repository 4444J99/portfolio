/**
 * Validates output shape of sync-trust-metrics and sync-omega scripts.
 * These artifacts are produced by npm run sync:vitals and npm run sync:omega (run during build).
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../');

describe('trust-vitals.json (sync-trust-metrics output)', () => {
  const path = resolve(root, 'src/data/trust-vitals.json');

  it('exists', () => {
    expect(existsSync(path)).toBe(true);
  });

  it('has expected top-level shape', () => {
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    expect(data).toHaveProperty('tests');
    expect(data).toHaveProperty('security');
    expect(data).toHaveProperty('ecosystem');
    expect(data).toHaveProperty('humanImpact');
    expect(data).toHaveProperty('generatedAt');
    expect(data).toHaveProperty('fingerprint');
  });

  it('humanImpact has human-impact.json provenance merge', () => {
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    expect(data.humanImpact).toHaveProperty('totalStudents');
    expect(data.humanImpact).toHaveProperty('completionRate');
    expect(data.humanImpact).toHaveProperty('approval');
    expect(data.humanImpact).toHaveProperty('provenance');
    expect(typeof data.humanImpact.totalStudents).toBe('number');
  });

  it('tests object has total, passed, suites, status', () => {
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    expect(data.tests).toHaveProperty('total');
    expect(data.tests).toHaveProperty('passed');
    expect(data.tests).toHaveProperty('suites');
    expect(data.tests).toHaveProperty('status');
  });
});

describe('omega.json (sync-omega output)', () => {
  const path = resolve(root, 'src/data/omega.json');

  it('exists', () => {
    expect(existsSync(path)).toBe(true);
  });

  it('has criteria and summary', () => {
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    expect(Array.isArray(data.criteria)).toBe(true);
    expect(data).toHaveProperty('summary');
    expect(data.summary).toHaveProperty('met');
    expect(data.summary).toHaveProperty('in_progress');
    expect(data.summary).toHaveProperty('not_started');
    expect(data.summary).toHaveProperty('total');
  });

  it('summary totals match criteria length', () => {
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    const { met, in_progress, not_started, total } = data.summary;
    expect(met + in_progress + not_started).toBe(total);
    expect(total).toBe(data.criteria.length);
  });
});
