import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const root = resolve(__dirname, '../../');
const scriptPath = resolve(root, 'scripts/validate-github-pages.mjs');
const validFixturePath = resolve(root, 'packages/github-pages-index-core/test/fixtures/valid-v21.json');
const tempDirs: string[] = [];

interface RunResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

function makeTempDir() {
  const dir = mkdtempSync(join(tmpdir(), 'validate-github-pages-'));
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

function buildPayload(erroredCount: number) {
  const fixture = JSON.parse(readFileSync(validFixturePath, 'utf-8'));
  const seedRepo = fixture.repos[0];
  const now = new Date().toISOString();
  const totalRepos = Math.max(erroredCount, 1);
  const repos = [];

  for (let i = 0; i < totalRepos; i += 1) {
    const repoName = `repo-${String(i).padStart(2, '0')}`;
    const repo = {
      ...seedRepo,
      owner: '4444J99',
      repo: repoName,
      fullName: `4444J99/${repoName}`,
      repoUrl: `https://github.com/4444J99/${repoName}`,
      pageUrl: `https://4444j99.github.io/${repoName}/`,
      status: i < erroredCount ? 'errored' : 'built',
      reachable: true,
      updatedAt: now,
      lastCheckedAt: now,
      lastError: i < erroredCount ? 'simulated error' : null,
    };
    repos.push(repo);
  }

  return {
    ...fixture,
    generatedAt: now,
    totalRepos: repos.length,
    repos,
  };
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe('validate-github-pages defaults and overrides', () => {
  it('uses policy defaults when CLI thresholds are omitted', () => {
    const dir = makeTempDir();
    const inputPath = join(dir, 'github-pages.json');
    const policyPath = join(dir, 'policy.json');

    writeFileSync(inputPath, JSON.stringify(buildPayload(9), null, 2) + '\n');
    writeFileSync(
      policyPath,
      JSON.stringify(
        {
          validation: {
            maxAgeHours: 72,
            maxErrored: 8,
            maxUnreachable: 5,
          },
        },
        null,
        2
      ) + '\n'
    );

    const result = runNode(['--input', inputPath, '--policy', policyPath], dir);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('max-errored: 8');
    expect(result.stderr).toContain('Errored repos 9 exceed threshold 8.');
  });

  it('allows explicit CLI overrides to supersede policy defaults', () => {
    const dir = makeTempDir();
    const inputPath = join(dir, 'github-pages.json');
    const policyPath = join(dir, 'policy.json');

    writeFileSync(inputPath, JSON.stringify(buildPayload(9), null, 2) + '\n');
    writeFileSync(
      policyPath,
      JSON.stringify(
        {
          validation: {
            maxAgeHours: 72,
            maxErrored: 8,
            maxUnreachable: 5,
          },
        },
        null,
        2
      ) + '\n'
    );

    const result = runNode(
      ['--input', inputPath, '--policy', policyPath, '--max-errored', '9'],
      dir
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('max-errored: 9');
    expect(result.stdout).toContain('GitHub Pages index validation passed.');
  });
});
