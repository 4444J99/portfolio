import { describe, it, expect } from 'vitest';
import { formatNumber } from '../chart-utils';

describe('formatNumber', () => {
  it('returns raw string for numbers under 1000', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(1)).toBe('1');
    expect(formatNumber(999)).toBe('999');
  });

  it('formats thousands with k suffix', () => {
    expect(formatNumber(1000)).toBe('1.0k');
    expect(formatNumber(1500)).toBe('1.5k');
    expect(formatNumber(2345)).toBe('2.3k');
    expect(formatNumber(10000)).toBe('10.0k');
  });

  it('handles edge case at exactly 1000', () => {
    expect(formatNumber(1000)).toBe('1.0k');
  });

  it('handles large numbers', () => {
    expect(formatNumber(100000)).toBe('100.0k');
    expect(formatNumber(1000000)).toBe('1000.0k');
  });
});
