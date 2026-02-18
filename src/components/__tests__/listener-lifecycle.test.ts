import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function read(relativePath: string) {
  return readFileSync(resolve(__dirname, '../../', relativePath), 'utf-8');
}

describe('client listener lifecycle guards', () => {
  it('header script uses AbortController-based cleanup across page loads', () => {
    const source = read('components/Header.astro');
    expect(source).toContain('new AbortController()');
    expect(source).toContain('state.controller?.abort()');
    expect(source).toContain("document.addEventListener('astro:before-swap'");
  });

  it('footer theme toggles are rebound via AbortController and singleton media listener', () => {
    const source = read('components/Footer.astro');
    expect(source).toContain('new AbortController()');
    expect(source).toContain('state.controller?.abort()');
    expect(source).toContain('if (!state.mediaListener)');
  });

  it('gallery controls clean up fullscreen and click listeners per navigation', () => {
    const source = read('pages/gallery.astro');
    expect(source).toContain('new AbortController()');
    expect(source).toContain('state.controller?.abort()');
    expect(source).toContain("document.addEventListener('fullscreenchange'");
  });

  it('search dialog listeners are rebound through AbortController cleanup', () => {
    const source = read('components/Search.astro');
    expect(source).toContain('new AbortController()');
    expect(source).toContain('state.controller.abort()');
    expect(source).toContain("document.addEventListener('astro:before-swap'");
  });

  it('sketch loader keeps a single resize handler and removes it on teardown', () => {
    const source = read('components/sketches/sketch-loader.ts');
    expect(source).toContain('let resizeHandler');
    expect(source).toContain("window.addEventListener('resize', resizeHandler)");
    expect(source).toContain("window.removeEventListener('resize', resizeHandler)");
  });
});
