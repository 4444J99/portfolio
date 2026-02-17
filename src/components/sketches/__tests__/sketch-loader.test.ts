import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Tests for the sketch registry in sketch-loader.ts.
 * Since sketch-loader.ts depends on browser globals (window, document, IntersectionObserver),
 * we parse the source to verify the registry without executing it.
 */
const loaderSource = readFileSync(
  resolve(__dirname, '../sketch-loader.ts'),
  'utf-8'
);

// Extract sketch IDs from the sketchModules record
const moduleEntries = [...loaderSource.matchAll(/'([a-z-]+)':\s*\(\)\s*=>\s*import\(/g)];
const registeredIds = moduleEntries.map(m => m[1]);

describe('sketch registry', () => {
  it('has registered sketches', () => {
    expect(registeredIds.length).toBeGreaterThan(0);
  });

  it('has unique sketch IDs', () => {
    expect(new Set(registeredIds).size).toBe(registeredIds.length);
  });

  it('includes the background sketch', () => {
    expect(registeredIds).toContain('background');
  });

  it('includes the hero sketch', () => {
    expect(registeredIds).toContain('hero');
  });

  it('sketch IDs are kebab-case', () => {
    for (const id of registeredIds) {
      expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });

  it('every sketch ID has a corresponding file', () => {
    const { readdirSync } = require('fs');
    const sketchDir = resolve(__dirname, '..');
    const files = readdirSync(sketchDir) as string[];
    const sketchFiles = new Set(
      files
        .filter((f: string) => f.endsWith('-sketch.ts'))
        .map((f: string) => f.replace('-sketch.ts', ''))
    );

    for (const id of registeredIds) {
      expect(sketchFiles.has(id)).toBe(true);
    }
  });

  it('exports expected public functions', () => {
    // Verify the module exports the expected public API
    const exports = [
      'teardown',
      'teardownPage',
      'reinitPage',
      'getSketchInstance',
      'pauseSketch',
      'resumeSketch',
      'initSketches',
    ];
    for (const name of exports) {
      expect(loaderSource).toContain(`export function ${name}`);
    }
  });

  it('concurrency limit is defined', () => {
    expect(loaderSource).toContain('MAX_CONCURRENT');
  });
});
