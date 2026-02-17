import { describe, it, expect } from 'vitest';
import { classificationColors } from '../chart-theme';

describe('classificationColors', () => {
  it('includes all expected classification keys', () => {
    expect(classificationColors).toHaveProperty('SUBSTANTIAL');
    expect(classificationColors).toHaveProperty('PARTIAL');
    expect(classificationColors).toHaveProperty('MINIMAL');
    expect(classificationColors).toHaveProperty('SKELETON');
  });

  it('all values are valid hex colors', () => {
    for (const color of Object.values(classificationColors)) {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('keys match system-metrics classification categories', () => {
    const expectedKeys = ['SUBSTANTIAL', 'PARTIAL', 'MINIMAL', 'SKELETON'];
    expect(Object.keys(classificationColors).sort()).toEqual(expectedKeys.sort());
  });
});

describe('organColors (re-export)', () => {
  it('exports organColors from chart-theme', async () => {
    const { organColors } = await import('../chart-theme');
    expect(organColors).toBeTruthy();
    expect(typeof organColors).toBe('object');
    expect(Object.keys(organColors).length).toBeGreaterThan(0);
  });

  it('organ color values are valid hex colors', async () => {
    const { organColors } = await import('../chart-theme');
    for (const color of Object.values(organColors)) {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
