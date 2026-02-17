import { describe, it, expect } from 'vitest';
import { projectIndex, type ProjectEntry } from '../../data/project-index';

/**
 * Tests for the logic used in ProjectDetail.astro:
 * - Related projects filtering (shared tags, limited to 3)
 * - Prev/next navigation generation
 */

function getRelatedProjects(currentSlug: string, tags: string[]): (ProjectEntry & { shared: number })[] {
  const tagSet = new Set(tags);
  return projectIndex
    .filter(p => p.slug !== currentSlug)
    .map(p => ({ ...p, shared: p.tags.filter(t => tagSet.has(t)).length }))
    .filter(p => p.shared > 0)
    .sort((a, b) => b.shared - a.shared)
    .slice(0, 3);
}

function getPrevNext(currentSlug: string) {
  const currentIdx = projectIndex.findIndex(p => p.slug === currentSlug);
  return {
    prev: currentIdx > 0 ? projectIndex[currentIdx - 1] : null,
    next: currentIdx < projectIndex.length - 1 ? projectIndex[currentIdx + 1] : null,
  };
}

describe('related projects filtering', () => {
  it('excludes the current project', () => {
    const slug = projectIndex[0].slug;
    const tags = projectIndex[0].tags;
    const related = getRelatedProjects(slug, tags);
    expect(related.every(r => r.slug !== slug)).toBe(true);
  });

  it('returns max 3 results', () => {
    const slug = projectIndex[0].slug;
    // Use a broad tag that many projects share
    const related = getRelatedProjects(slug, projectIndex[0].tags);
    expect(related.length).toBeLessThanOrEqual(3);
  });

  it('returns only projects that share at least one tag', () => {
    const related = getRelatedProjects('recursive-engine', ['Theory', 'Python', 'DSL']);
    for (const r of related) {
      expect(r.shared).toBeGreaterThan(0);
    }
  });

  it('sorts by number of shared tags descending', () => {
    const related = getRelatedProjects('recursive-engine', ['Theory', 'Python', 'DSL']);
    for (let i = 1; i < related.length; i++) {
      expect(related[i - 1].shared).toBeGreaterThanOrEqual(related[i].shared);
    }
  });

  it('returns empty for tags with no matches', () => {
    const related = getRelatedProjects('recursive-engine', ['NonexistentTag']);
    expect(related).toEqual([]);
  });
});

describe('prev/next navigation', () => {
  it('first project has no prev', () => {
    const { prev, next } = getPrevNext(projectIndex[0].slug);
    expect(prev).toBeNull();
    expect(next).toBeTruthy();
  });

  it('last project has no next', () => {
    const last = projectIndex[projectIndex.length - 1];
    const { prev, next } = getPrevNext(last.slug);
    expect(prev).toBeTruthy();
    expect(next).toBeNull();
  });

  it('middle project has both prev and next', () => {
    const mid = projectIndex[Math.floor(projectIndex.length / 2)];
    const { prev, next } = getPrevNext(mid.slug);
    expect(prev).toBeTruthy();
    expect(next).toBeTruthy();
  });

  it('prev is the project at index-1', () => {
    const idx = 5;
    const { prev } = getPrevNext(projectIndex[idx].slug);
    expect(prev!.slug).toBe(projectIndex[idx - 1].slug);
  });

  it('next is the project at index+1', () => {
    const idx = 5;
    const { next } = getPrevNext(projectIndex[idx].slug);
    expect(next!.slug).toBe(projectIndex[idx + 1].slug);
  });

  it('unknown slug returns no prev (findIndex returns -1)', () => {
    // When slug isn't found, findIndex returns -1.
    // -1 > 0 is false → prev is null. This matches ProjectDetail.astro behavior.
    const { prev } = getPrevNext('nonexistent-slug');
    expect(prev).toBeNull();
  });
});
