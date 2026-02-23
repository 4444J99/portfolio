import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(__dirname, '../src');
const sketchDir = resolve(srcDir, 'sketches');

describe('palette', () => {
  const paletteSource = readFileSync(resolve(srcDir, 'palette.ts'), 'utf-8');

  it('exports PALETTE constant', () => {
    assert.ok(paletteSource.includes('export const PALETTE'));
  });

  it('exports getTextColor function', () => {
    assert.ok(paletteSource.includes('export function getTextColor'));
  });

  it('exports RGB type', () => {
    assert.ok(paletteSource.includes('export type RGB'));
  });

  it('PALETTE has spectrum array', () => {
    assert.ok(paletteSource.includes('spectrum'));
  });
});

describe('sketch files', () => {
  const files = readdirSync(sketchDir).filter((f) => f.endsWith('-sketch.ts'));

  it('has 30 sketch files', () => {
    assert.equal(files.length, 30);
  });

  it('all files follow kebab-case-sketch.ts naming', () => {
    for (const f of files) {
      assert.match(f, /^[a-z][a-z0-9-]*-sketch\.ts$/);
    }
  });

  it('sketch files import from parent palette (not sibling)', () => {
    for (const f of files) {
      const src = readFileSync(resolve(sketchDir, f), 'utf-8');
      if (src.includes('palette')) {
        assert.ok(
          src.includes("from '../palette'"),
          `${f} should import from '../palette', not './palette'`
        );
      }
    }
  });
});

describe('index', () => {
  const indexSource = readFileSync(resolve(srcDir, 'index.ts'), 'utf-8');

  it('re-exports PALETTE', () => {
    assert.ok(indexSource.includes('PALETTE'));
  });

  it('re-exports getTextColor', () => {
    assert.ok(indexSource.includes('getTextColor'));
  });

  it('exports SKETCH_NAMES array', () => {
    assert.ok(indexSource.includes('SKETCH_NAMES'));
  });

  it('exports SketchName type', () => {
    assert.ok(indexSource.includes('SketchName'));
  });
});
