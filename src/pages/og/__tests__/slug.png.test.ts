import { describe, expect, it, vi } from 'vitest';
import { GET, getStaticPaths } from '../[...slug].png';

// Mock the generateOGImage utility to avoid actual image generation dependencies in tests
vi.mock('../../../utils/og-image', () => ({
	generateOGImage: vi.fn().mockResolvedValue(new Uint8Array([137, 80, 78, 71])),
}));

describe('[...slug].png.ts', () => {
	it('should generate static paths for all configured pages', () => {
		const paths = getStaticPaths({} as any) as any[];
		expect(paths.length).toBeGreaterThan(0);
		expect(paths[0]).toHaveProperty('params');
		expect(paths[0].params).toHaveProperty('slug');
		expect(paths[0]).toHaveProperty('props');
		expect(paths[0].props).toHaveProperty('title');
	});

	it('should return a PNG image response', async () => {
		const props = { title: 'Test', subtitle: 'Sub', accent: '#fff' };
		const response = (await GET({ props } as any)) as Response;

		expect(response).toBeInstanceOf(Response);
		expect(response.headers.get('Content-Type')).toBe('image/png');
		expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');

		const buffer = await response.arrayBuffer();
		expect(buffer.byteLength).toBe(4);
	});

	it('should return a PNG image response with fallback accent', async () => {
		const props = { title: 'Test', subtitle: 'Sub', accent: undefined };
		const response = (await GET({ props } as any)) as Response;

		expect(response).toBeInstanceOf(Response);
		expect(response.headers.get('Content-Type')).toBe('image/png');
	});
});
