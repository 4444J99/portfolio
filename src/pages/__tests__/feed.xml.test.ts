import { describe, expect, it, vi } from 'vitest';
import { GET } from '../feed.xml';

// Mock the astro rss module
vi.mock('@astrojs/rss', () => ({
	default: vi.fn((opts) => new Response(JSON.stringify(opts))),
}));

describe('feed.xml.ts', () => {
	it('should generate an RSS feed response with site from context', () => {
		const context = {
			site: new URL('https://example.com/'),
		} as any;

		const response = GET(context);
		expect(response).toBeInstanceOf(Response);
	});

	it('should generate an RSS feed response with fallback site', () => {
		const context = {
			site: undefined,
		} as any;

		const response = GET(context);
		expect(response).toBeInstanceOf(Response);
	});
});
