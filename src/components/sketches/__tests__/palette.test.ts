import { describe, it, expect } from 'vitest';
import { PALETTE, getTextColor } from '../palette';
import type { RGB } from '../palette';

function isValidRGB(tuple: RGB): boolean {
  return (
    Array.isArray(tuple) &&
    tuple.length === 3 &&
    tuple.every((v) => typeof v === 'number' && v >= 0 && v <= 255)
  );
}

describe('PALETTE', () => {
  it('exports expected color keys', () => {
    const expectedKeys = ['white', 'black', 'text', 'accent', 'spectrum'];
    for (const key of expectedKeys) {
      expect(PALETTE).toHaveProperty(key);
    }
  });

  it('single-color entries are valid RGB tuples', () => {
    const singleColors: (keyof typeof PALETTE)[] = [
      'white', 'black', 'text', 'muted', 'border', 'card',
      'accent', 'accentHover', 'accentYellow', 'purple', 'green',
    ];
    for (const key of singleColors) {
      expect(isValidRGB(PALETTE[key] as RGB), `${key} should be valid RGB`).toBe(true);
    }
  });

  it('spectrum has 13 entries', () => {
    expect(PALETTE.spectrum).toHaveLength(13);
  });

  it('every spectrum entry is a valid RGB tuple', () => {
    for (const color of PALETTE.spectrum) {
      expect(isValidRGB(color)).toBe(true);
    }
  });
});

describe('getTextColor', () => {
  it('returns a valid RGB tuple', () => {
    const result = getTextColor();
    expect(isValidRGB(result)).toBe(true);
  });
});
