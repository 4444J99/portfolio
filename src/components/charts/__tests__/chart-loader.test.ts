// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as loader from '../chart-loader';

// Mock chart modules at top level
vi.mock('../organ-bar-chart', () => ({ default: vi.fn() }));

describe('chart-loader lifecycle', () => {
	let observerCallback: (entries: any[]) => void;
	const mockObserve = vi.fn();
	const mockDisconnect = vi.fn();

	beforeEach(() => {
		document.body.innerHTML = '';
		vi.useFakeTimers();

		class MockIntersectionObserver {
			constructor(cb: any) {
				observerCallback = cb;
			}
			observe = mockObserve;
			disconnect = mockDisconnect;
		}

		vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
	});

	afterEach(async () => {
		loader.teardown();
		vi.runOnlyPendingTimers();
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.clearAllMocks();
	});

	it('observes charts on astro:page-load', async () => {
		const container = document.createElement('div');
		container.dataset.chart = 'organ-bar';
		document.body.appendChild(container);

		document.dispatchEvent(new Event('astro:page-load'));

		expect(mockObserve).toHaveBeenCalledWith(container);
	});

	it('initializes chart when it becomes visible', async () => {
		const container = document.createElement('div');
		container.dataset.chart = 'organ-bar';
		container.dataset.chartData = JSON.stringify({ organs: [] });
		document.body.appendChild(container);

		document.dispatchEvent(new Event('astro:page-load'));

		observerCallback([{ isIntersecting: true, target: container }]);

		await vi.advanceTimersByTimeAsync(100);
	});

	it('observes charts without IntersectionObserver', async () => {
		const originalObserver = window.IntersectionObserver;
		// @ts-expect-error
		delete window.IntersectionObserver;

		const container = document.createElement('div');
		container.dataset.chart = 'organ-bar';
		container.dataset.chartData = JSON.stringify({ organs: [] });
		document.body.appendChild(container);

		document.dispatchEvent(new Event('astro:page-load'));

		await vi.advanceTimersByTimeAsync(100);

		window.IntersectionObserver = originalObserver;
	});

	it('handles elements leaving the viewport', async () => {
		const container = document.createElement('div');
		container.dataset.chart = 'organ-bar';
		document.body.appendChild(container);

		document.dispatchEvent(new Event('astro:page-load'));

		observerCallback([{ isIntersecting: false, target: container }]);
	});

	it('cleans up on astro:before-swap', async () => {
		const container = document.createElement('div');
		container.dataset.chart = 'organ-bar';
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		container.appendChild(svg);
		document.body.appendChild(container);

		// Trigger some initial state
		document.dispatchEvent(new Event('astro:page-load'));
		observerCallback([{ isIntersecting: true, target: container }]);

		document.dispatchEvent(new Event('astro:before-swap'));

		expect(container.querySelector('svg')).toBeNull();
		expect(mockDisconnect).toHaveBeenCalled();
	});
});
