import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(__dirname, '../../../');
const securityAuditScript = resolve(root, 'scripts/security-audit.mjs');
const runtimeCoverageScript = resolve(root, 'scripts/check-runtime-a11y-coverage.mjs');
const tempDirs: string[] = [];

function makeTempDir() {
  const dir = mkdtempSync(join(tmpdir(), 'quality-ratchet-'));
  tempDirs.push(dir);
  return dir;
}

function runNode(script: string, args: string[], cwd: string) {
  return spawnSync('node', [script, ...args], {
    cwd,
    encoding: 'utf-8',
  });
}

function buildAuditFixture(moderate: number, low: number) {
  const vulnerabilities: Record<string, { severity: string; via: unknown[]; fixAvailable: boolean }> = {};
  for (let i = 0; i < moderate; i += 1) {
    vulnerabilities[`moderate-${i}`] = { severity: 'moderate', via: [], fixAvailable: true };
  }
  for (let i = 0; i < low; i += 1) {
    vulnerabilities[`low-${i}`] = { severity: 'low', via: [], fixAvailable: true };
  }

  return {
    vulnerabilities,
    metadata: {
      vulnerabilities: {
        critical: 0,
        high: 0,
        moderate,
        low,
        info: 0,
        total: moderate + low,
      },
    },
  };
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe('date-ratchet policy simulations', () => {
  it('enforces security checkpoint thresholds by date', () => {
    const dir = makeTempDir();
    const qualityDir = join(dir, '.quality');
    mkdirSync(qualityDir, { recursive: true });

    const policyPath = join(qualityDir, 'security-policy.json');
    const allowlistPath = join(qualityDir, 'security-allowlist.json');
    const fixturePath = join(qualityDir, 'audit-fixture.json');

    writeFileSync(
      policyPath,
      JSON.stringify(
        {
          rules: { maxCritical: 0, maxHigh: 0 },
          checkpoints: [
            { date: '2026-02-21', maxModerate: 5, maxLow: 4 },
            { date: '2026-02-28', maxModerate: 2, maxLow: 2 },
            { date: '2026-03-18', maxModerate: 0, maxLow: 0 },
          ],
          allowlist: {
            maxDurationDays: 14,
            requiredFields: ['package', 'severity', 'reason', 'owner', 'created', 'expires', 'trackingIssue'],
          },
        },
        null,
        2
      ) + '\n'
    );

    writeFileSync(allowlistPath, JSON.stringify({ version: 1, entries: [] }, null, 2) + '\n');
    writeFileSync(fixturePath, JSON.stringify(buildAuditFixture(5, 4), null, 2) + '\n');

    const passAtFirstCheckpoint = runNode(
      securityAuditScript,
      [
        '--audit-fixture', fixturePath,
        '--policy', policyPath,
        '--allowlist', allowlistPath,
        '--date', '2026-02-21',
        '--json-out', join(qualityDir, 'security-summary.json'),
      ],
      dir
    );
    expect(passAtFirstCheckpoint.status).toBe(0);

    const failAtSecondCheckpoint = runNode(
      securityAuditScript,
      [
        '--audit-fixture', fixturePath,
        '--policy', policyPath,
        '--allowlist', allowlistPath,
        '--date', '2026-02-28',
        '--json-out', join(qualityDir, 'security-summary.json'),
      ],
      dir
    );
    expect(failAtSecondCheckpoint.status).toBe(1);
    expect(failAtSecondCheckpoint.stderr).toContain('unsuppressed moderate vulnerabilities');

    writeFileSync(fixturePath, JSON.stringify(buildAuditFixture(0, 0), null, 2) + '\n');
    const passAtFinalCheckpoint = runNode(
      securityAuditScript,
      [
        '--audit-fixture', fixturePath,
        '--policy', policyPath,
        '--allowlist', allowlistPath,
        '--date', '2026-03-18',
        '--json-out', join(qualityDir, 'security-summary.json'),
      ],
      dir
    );
    expect(passAtFinalCheckpoint.status).toBe(0);
  });

  it('enforces runtime a11y coverage ratchet by date', () => {
    const dir = makeTempDir();
    const qualityDir = join(dir, '.quality');
    const a11yDir = join(dir, '.a11y');
    const distDir = join(dir, 'dist');

    mkdirSync(qualityDir, { recursive: true });
    mkdirSync(a11yDir, { recursive: true });
    mkdirSync(distDir, { recursive: true });

    // 20 synthetic html outputs for deterministic coverage math.
    for (let i = 0; i < 20; i += 1) {
      writeFileSync(join(distDir, `page-${i}.html`), '<html><body>ok</body></html>\n');
    }

    const runtimeSummaryPath = join(a11yDir, 'runtime-summary.json');

    writeFileSync(
      runtimeSummaryPath,
      JSON.stringify({ pagesAudited: 17, status: 'pass', critical: 0, serious: 0, focusChecks: 2, focusFailures: 0 }, null, 2) + '\n'
    );
    const passAt85 = runNode(
      runtimeCoverageScript,
      [
        '--runtime-summary', runtimeSummaryPath,
        '--dist', distDir,
        '--date', '2026-02-25',
        '--json-out', join(qualityDir, 'runtime-coverage-summary.json'),
      ],
      dir
    );
    expect(passAt85.status).toBe(0);

    writeFileSync(
      runtimeSummaryPath,
      JSON.stringify({ pagesAudited: 18, status: 'pass', critical: 0, serious: 0, focusChecks: 2, focusFailures: 0 }, null, 2) + '\n'
    );
    const failAt95 = runNode(
      runtimeCoverageScript,
      [
        '--runtime-summary', runtimeSummaryPath,
        '--dist', distDir,
        '--date', '2026-03-04',
        '--json-out', join(qualityDir, 'runtime-coverage-summary.json'),
      ],
      dir
    );
    expect(failAt95.status).toBe(1);
    expect(failAt95.stderr).toContain('below required 95%');

    writeFileSync(
      runtimeSummaryPath,
      JSON.stringify({ pagesAudited: 20, status: 'pass', critical: 0, serious: 0, focusChecks: 2, focusFailures: 0 }, null, 2) + '\n'
    );
    const passAt100 = runNode(
      runtimeCoverageScript,
      [
        '--runtime-summary', runtimeSummaryPath,
        '--dist', distDir,
        '--date', '2026-03-18',
        '--json-out', join(qualityDir, 'runtime-coverage-summary.json'),
      ],
      dir
    );
    expect(passAt100.status).toBe(0);
  });
});
