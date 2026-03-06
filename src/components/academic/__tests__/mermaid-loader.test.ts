// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock mermaid at top level
vi.mock('mermaid', () => ({
	default: {
		initialize: vi.fn(),
		render: vi.fn().mockResolvedValue({ svg: '<svg>mock-mermaid</svg>' }),
	},
}));

describe('mermaid-loader runtime', () => {
	let observerCallback: (entries: any[]) => void;
	const mockObserve = vi.fn();
	const mockUnobserve = vi.fn();
	const mockDisconnect = vi.fn();

	beforeEach(() => {
		document.body.innerHTML = '';

		class MockIntersectionObserver {
			constructor(cb: any) {
				observerCallback = cb;
			}
			observe = mockObserve;
			unobserve = mockUnobserve;
			disconnect = mockDisconnect;
		}

		vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
	});

	afterEach(async () => {
		const { teardown } = await import('../mermaid-loader');
		teardown();
		vi.unstubAllGlobals();
		vi.resetModules();
		vi.clearAllMocks();
	});

	it('observes mermaid diagrams on astro:page-load', async () => {
		const container = document.createElement('div');
		container.className = 'mermaid';
		container.dataset.chart = 'graph TD;';
		document.body.appendChild(container);

		await import('../mermaid-loader');
		document.dispatchEvent(new Event('astro:page-load'));

		expect(mockObserve).toHaveBeenCalledWith(container);
	});

	it('renders mermaid when diagram becomes visible', async () => {
		const container = document.createElement('div');
		container.className = 'mermaid';
		container.dataset.chart = 'graph TD;';
		document.body.appendChild(container);

		await import('../mermaid-loader');
		document.dispatchEvent(new Event('astro:page-load'));

		observerCallback([{ isIntersecting: true, target: container }]);

		for (let i = 0; i < 10; i++) {
			await new Promise((resolve) => setTimeout(resolve, 10));
		}

		expect(container.innerHTML).toContain('mock-mermaid');
		expect(mockUnobserve).toHaveBeenCalledWith(container);
	});

	it('observes mermaid diagrams without IntersectionObserver', async () => {
		const originalObserver = window.IntersectionObserver;
		// @ts-expect-error
		delete window.IntersectionObserver;

		const container = document.createElement('div');
		container.className = 'mermaid';
		container.dataset.chart = 'graph TD;';
		document.body.appendChild(container);

		await import('../mermaid-loader');
		document.dispatchEvent(new Event('astro:page-load'));

		// Wait for microtasks
		for (let i = 0; i < 5; i++) {
			await new Promise((resolve) => setTimeout(resolve, 10));
		}

		window.IntersectionObserver = originalObserver;
	});

	it('handles render errors gracefully', async () => {
		const container = document.createElement('div');
		container.className = 'mermaid';
		container.dataset.chart = 'graph TD;';
		document.body.appendChild(container);

		vi.doMock('mermaid', () => ({
			default: {
				initialize: vi.fn(),
				render: vi.fn().mockRejectedValue(new Error('Render failed')),
			},
		}));

		await import('../mermaid-loader');
		document.dispatchEvent(new Event('astro:page-load'));

		observerCallback([{ isIntersecting: true, target: container }]);

		for (let i = 0; i < 5; i++) {
			await new Promise((resolve) => setTimeout(resolve, 10));
		}
	});

	it('cleans up on astro:before-swap', async () => {
		await import('../mermaid-loader');
		document.dispatchEvent(new Event('astro:page-load'));
		document.dispatchEvent(new Event('astro:before-swap'));

		expect(mockDisconnect).toHaveBeenCalled();
	});
});
