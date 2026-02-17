// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { teardown } from '../chart-loader';

class MockIntersectionObserver {
  private callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe(element: Element) {
    const rect = element.getBoundingClientRect();
    this.callback(
      [{
        target: element,
        isIntersecting: true,
        intersectionRatio: 1,
        time: Date.now(),
        boundingClientRect: rect,
        intersectionRect: rect,
        rootBounds: null,
      }],
      this as unknown as IntersectionObserver
    );
  }

  disconnect() {}
}

describe('chart-loader lifecycle', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div data-chart="unknown" class="chart-container">
        <svg></svg>
        <div class="chart-tooltip">tooltip</div>
      </div>
    `;

    Object.defineProperty(window, 'IntersectionObserver', {
      writable: true,
      configurable: true,
      value: MockIntersectionObserver,
    });

    vi.stubGlobal('clearTimeout', clearTimeout);
    vi.stubGlobal('setTimeout', setTimeout);
  });

  it('initializes on astro:page-load and cleans up on astro:before-swap', () => {
    document.dispatchEvent(new Event('astro:page-load'));

    const container = document.querySelector<HTMLElement>('[data-chart="unknown"]');
    expect(container).not.toBeNull();

    document.dispatchEvent(new Event('astro:before-swap'));

    expect(container?.querySelector('svg')).toBeNull();
    expect(container?.querySelector('.chart-tooltip')).toBeNull();
  });

  it('teardown can be called safely multiple times', () => {
    teardown();
    expect(() => teardown()).not.toThrow();
  });
});
