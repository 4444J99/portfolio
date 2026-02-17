import { describe, expect, it } from 'vitest';
import githubPages from '../../data/github-pages.json';

interface RepoEntry {
  owner: string;
  repo: string;
  fullName: string;
  pageUrl: string;
  repoUrl: string;
  probeMethod?: string | null;
  probeLatencyMs?: number | null;
  lastError?: string | null;
}

interface DirectoryPayload {
  schemaVersion: string;
  generatedAt: string;
  totalRepos: number;
  repos: RepoEntry[];
  syncStatus?: string;
  syncWarnings?: string[];
  stats?: Record<string, unknown>;
}

const directory = githubPages as DirectoryPayload;

function compareIdentity(a: RepoEntry, b: RepoEntry) {
  const ownerOrder = a.owner.localeCompare(b.owner, undefined, { sensitivity: 'base' });
  if (ownerOrder !== 0) return ownerOrder;
  return a.repo.localeCompare(b.repo, undefined, { sensitivity: 'base' });
}

describe('github-pages.json contract', () => {
  it('uses a supported schema version', () => {
    expect(['github-pages-index.v2', 'github-pages-index.v2.1']).toContain(directory.schemaVersion);
  });

  it('matches declared repo count', () => {
    expect(directory.totalRepos).toBe(directory.repos.length);
  });

  it('contains no duplicate fullName values', () => {
    const seen = new Set<string>();
    for (const repo of directory.repos) {
      const key = repo.fullName.toLowerCase();
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it('is deterministically sorted by owner then repo', () => {
    for (let index = 1; index < directory.repos.length; index += 1) {
      const previous = directory.repos[index - 1];
      const current = directory.repos[index];
      expect(compareIdentity(previous, current)).toBeLessThanOrEqual(0);
    }
  });

  it('keeps all repo and page links on https', () => {
    for (const repo of directory.repos) {
      expect(repo.pageUrl.startsWith('https://')).toBe(true);
      expect(repo.repoUrl.startsWith('https://')).toBe(true);
    }
  });

  it('accepts optional v2.1 telemetry fields when present', () => {
    if (directory.syncStatus !== undefined) {
      expect(typeof directory.syncStatus).toBe('string');
    }
    if (directory.syncWarnings !== undefined) {
      expect(Array.isArray(directory.syncWarnings)).toBe(true);
      expect(directory.syncWarnings.every((entry) => typeof entry === 'string')).toBe(true);
    }

    for (const repo of directory.repos) {
      if (repo.probeMethod !== undefined && repo.probeMethod !== null) {
        expect(['head', 'get']).toContain(repo.probeMethod);
      }
      if (repo.probeLatencyMs !== undefined && repo.probeLatencyMs !== null) {
        expect(typeof repo.probeLatencyMs).toBe('number');
        expect(repo.probeLatencyMs).toBeGreaterThanOrEqual(0);
      }
      if (repo.lastError !== undefined && repo.lastError !== null) {
        expect(typeof repo.lastError).toBe('string');
      }
    }
  });

  it('generatedAt is parseable', () => {
    expect(Number.isFinite(Date.parse(directory.generatedAt))).toBe(true);
  });
});
