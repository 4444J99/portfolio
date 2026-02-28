import { describe, it, expect, vi } from 'vitest';
import { GET } from '../feed.xml';

// Mock the astro rss module
vi.mock('@astrojs/rss', () => ({
  default: vi.fn((opts) => new Response(JSON.stringify(opts))),
}));

describe('feed.xml.ts', () => {
  it('should generate an RSS feed response', () => {
    const context = {
      site: new URL('https://4444j99.github.io/portfolio/'),
    } as any;

    const response = GET(context);
    expect(response).toBeInstanceOf(Response);
  });
});
