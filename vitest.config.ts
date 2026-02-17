import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

interface CoverageThresholds {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

interface RatchetPhasePolicy {
  coverage: CoverageThresholds;
}

interface RatchetPolicy {
  defaultPhase: string;
  phases: Record<string, RatchetPhasePolicy>;
}

const FALLBACK_THRESHOLDS: CoverageThresholds = {
  statements: 25,
  branches: 18,
  functions: 18,
  lines: 25,
};

function loadRatchetPolicy(): RatchetPolicy {
  const policyPath = resolve(__dirname, '.quality/ratchet-policy.json');
  if (!existsSync(policyPath)) {
    throw new Error(`Missing ratchet policy at ${policyPath}`);
  }
  return JSON.parse(readFileSync(policyPath, 'utf-8')) as RatchetPolicy;
}

function resolveCoverageThresholds() {
  const policy = loadRatchetPolicy();
  const phase = process.env.QUALITY_PHASE || policy.defaultPhase;
  const phasePolicy = policy.phases[phase];

  if (!phasePolicy?.coverage) {
    return { phase, coverage: FALLBACK_THRESHOLDS };
  }

  return { phase, coverage: phasePolicy.coverage };
}

const { coverage } = resolveCoverageThresholds();

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    include: ['src/**/__tests__/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/__tests__/**',
        'src/e2e/**',
        'src/**/*.astro',
        'src/components/sketches/*-sketch.ts',
        'src/env.d.ts',
      ],
      thresholds: coverage,
    },
  },
});
