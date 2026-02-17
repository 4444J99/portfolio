import { describe, it, expect } from 'vitest';
import quality from '../quality-metrics.json';

describe('quality-metrics.json', () => {
  it('uses nullable measured fields instead of synthetic test assertions', () => {
    expect(quality.tests.total).toBeNull();
    expect(quality.tests.passed).toBeNull();
  });

  it('includes provenance strings for every metric family', () => {
    expect(typeof quality.sources.tests).toBe('string');
    expect(typeof quality.sources.coverage).toBe('string');
    expect(typeof quality.sources.lighthouse).toBe('string');
    expect(typeof quality.sources.a11y).toBe('string');
    expect(typeof quality.sources.build).toBe('string');
  });
});
