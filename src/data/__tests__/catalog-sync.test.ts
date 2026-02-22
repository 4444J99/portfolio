import { describe, it, expect } from 'vitest';
import { projectCatalog } from '../project-catalog';
import { projectIndex } from '../project-index';
import { organGroups } from '../organ-groups';

const catalogSlugs = new Set(projectCatalog.map(p => p.slug));
const indexSlugs = new Set(projectIndex.map(p => p.slug));
const organGroupSlugs = new Set(
  organGroups.flatMap(g => g.projects.map(p => p.slug))
);

describe('cross-catalog sync', () => {
  it('every project-index slug exists in project-catalog', () => {
    for (const slug of indexSlugs) {
      expect(catalogSlugs.has(slug), `project-index slug "${slug}" missing from project-catalog`).toBe(true);
    }
  });

  it('every organ-groups slug exists in project-catalog', () => {
    for (const slug of organGroupSlugs) {
      expect(catalogSlugs.has(slug), `organ-groups slug "${slug}" missing from project-catalog`).toBe(true);
    }
  });

  it('every organ-groups slug exists in project-index', () => {
    for (const slug of organGroupSlugs) {
      expect(indexSlugs.has(slug), `organ-groups slug "${slug}" missing from project-index`).toBe(true);
    }
  });

  it('project-index and organ-groups have the same slugs', () => {
    const indexOnly = [...indexSlugs].filter(s => !organGroupSlugs.has(s));
    const groupOnly = [...organGroupSlugs].filter(s => !indexSlugs.has(s));
    expect(indexOnly, 'slugs in project-index but not organ-groups').toEqual([]);
    expect(groupOnly, 'slugs in organ-groups but not project-index').toEqual([]);
  });
});
