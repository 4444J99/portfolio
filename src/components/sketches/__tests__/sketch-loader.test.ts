// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Parse original file for static tests
const loaderSource = readFileSync(
  resolve(__dirname, '../sketch-loader.ts'),
  'utf-8'
);

const moduleEntries = [...loaderSource.matchAll(/'([a-z-]+)':\s*\(\)\s*=>\s*import\(/g)];
const registeredIds = moduleEntries.map(m => m[1]);

describe('sketch registry (static)', () => {
  it('has registered sketches', () => {
    expect(registeredIds.length).toBeGreaterThan(0);
  });
  it('has unique sketch IDs', () => {
    expect(new Set(registeredIds).size).toBe(registeredIds.length);
  });
  it('includes the background sketch', () => {
    expect(registeredIds).toContain('background');
  });
  it('every sketch ID has a corresponding file', () => {
    const sketchDir = resolve(__dirname, '..');
    const files = readdirSync(sketchDir) as string[];
    const sketchFiles = new Set(
      files.filter((f: string) => f.endsWith('-sketch.ts')).map((f: string) => f.replace('-sketch.ts', ''))
    );
    for (const id of registeredIds) {
      expect(sketchFiles.has(id)).toBe(true);
    }
  });
});

describe('sketch-loader runtime', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal('IntersectionObserver', vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('can be imported and exports teardown', async () => {
    const loader = await import('../sketch-loader');
    expect(typeof loader.teardown).toBe('function');
    loader.teardown();
  });

  it('can be imported and exports initSketches', async () => {
    const loader = await import('../sketch-loader');
    expect(typeof loader.initSketches).toBe('function');
  });
  
  it('can teardownPage cleanly', async () => {
    const loader = await import('../sketch-loader');
    expect(() => loader.teardownPage()).not.toThrow();
  });
});
