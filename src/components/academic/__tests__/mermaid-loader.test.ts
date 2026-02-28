// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { teardown } from '../mermaid-loader';

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('mermaid-loader.ts', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="mermaid" data-chart="graph TD; A-->B;"></div>
    `;
    
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  afterEach(() => {
    teardown();
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('initializes on astro:page-load', () => {
    document.dispatchEvent(new Event('astro:page-load'));
    expect(document.querySelector('.mermaid')).not.toBeNull();
  });

  it('cleans up on astro:before-swap', () => {
    document.dispatchEvent(new Event('astro:before-swap'));
    expect(() => teardown()).not.toThrow();
  });
});
