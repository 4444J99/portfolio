import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const root = resolve(__dirname, '../../');
const scriptPath = resolve(root, 'scripts/check-runtime-a11y-coverage.mjs');
const tempDirs: string[] = [];

interface RunResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

function makeTempDir() {
  const dir = mkdtempSync(join(tmpdir(), 'runtime-a11y-coverage-'));
  tempDirs.push(dir);
  return dir;
}

function runNode(args: string[], cwd: string): RunResult {
  const result = spawnSync('node', [scriptPath, ...args], {
    cwd,
    encoding: 'utf-8',
  });
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe('check-runtime-a11y-coverage', () => {
  it('enforces checkpoint ratchets from policy date', () => {
    const dir = makeTempDir();
    const distDir = join(dir, 'dist');
    const summaryPath = join(dir, '.a11y', 'runtime-summary.json');
    const outputPath = join(dir, '.quality', 'runtime-coverage-summary.json');

    mkdirSync(distDir, { recursive: true });
    mkdirSync(join(dir, '.a11y'), { recursive: true });
    mkdirSync(join(dir, '.quality'), { recursive: true });

    for (let i = 0; i < 20; i += 1) {
      writeFileSync(join(distDir, `page-${i}.html`), '<html><body>ok</body></html>\n');
    }

    writeFileSync(
      summaryPath,
      JSON.stringify(
        { pagesAudited: 18, status: 'pass', critical: 0, serious: 0, focusChecks: 0, focusFailures: 0 },
        null,
        2
      ) + '\n'
    );

    const result = runNode(
      ['--runtime-summary', summaryPath, '--dist', distDir, '--json-out', outputPath, '--date', '2026-03-04'],
      dir
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('below required 95%');
  });

  it('supports explicit min-coverage override', () => {
    const dir = makeTempDir();
    const distDir = join(dir, 'dist');
    const summaryPath = join(dir, '.a11y', 'runtime-summary.json');
    const outputPath = join(dir, '.quality', 'runtime-coverage-summary.json');

    mkdirSync(distDir, { recursive: true });
    mkdirSync(join(dir, '.a11y'), { recursive: true });
    mkdirSync(join(dir, '.quality'), { recursive: true });

    for (let i = 0; i < 4; i += 1) {
      writeFileSync(join(distDir, `route-${i}.html`), '<html><body>ok</body></html>\n');
    }

    writeFileSync(
      summaryPath,
      JSON.stringify(
        { pagesAudited: 3, status: 'pass', critical: 0, serious: 0, focusChecks: 0, focusFailures: 0 },
        null,
        2
      ) + '\n'
    );

    const result = runNode(
      ['--runtime-summary', summaryPath, '--dist', distDir, '--json-out', outputPath, '--min-coverage', '75'],
      dir
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Runtime a11y coverage gate passed (75% >= 75%)');
  });
});
