import { describe, it, expect } from 'vitest';
import { buildArchitectureNavigatorData } from '../architecture-data';
import { projectCatalog } from '../../data/project-catalog';

describe('buildArchitectureNavigatorData', () => {
  const data = buildArchitectureNavigatorData();

  it('includes all canonical organs in configured order', () => {
    expect(data.organs.map((o) => o.organ)).toEqual([
      'ORGAN-I',
      'ORGAN-II',
      'ORGAN-III',
      'ORGAN-IV',
      'ORGAN-V',
      'ORGAN-VI',
      'ORGAN-VII',
      'META-ORGANVM',
    ]);
  });

  it('maps project counts by organ deterministically', () => {
    const counts = Object.fromEntries(data.organs.map((o) => [o.organ, o.count]));
    expect(counts).toEqual({
      'ORGAN-I': 5,
      'ORGAN-II': 3,
      'ORGAN-III': 5,
      'ORGAN-IV': 2,
      'ORGAN-V': 2,
      'ORGAN-VI': 1,
      'ORGAN-VII': 1,
      'META-ORGANVM': 1,
    });
  });

  it('includes every catalog project exactly once', () => {
    const navigatorSlugs = data.organs.flatMap((o) => o.projects.map((p) => p.slug));
    expect(new Set(navigatorSlugs).size).toBe(projectCatalog.length);
    expect(new Set(navigatorSlugs)).toEqual(new Set(projectCatalog.map((p) => p.slug)));
  });

  it('uses corrected label for ORGAN-IV', () => {
    const organ = data.organs.find((o) => o.organ === 'ORGAN-IV');
    expect(organ?.label).toBe('Taxis/Orchestration');
  });
});
