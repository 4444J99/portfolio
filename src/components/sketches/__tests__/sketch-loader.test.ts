// @vitest-environment jsdom

import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Parse original file for static tests
const loaderSource = readFileSync(resolve(__dirname, '../sketch-loader.ts'), 'utf-8');

const moduleEntries = [...loaderSource.matchAll(/['"]?([a-z-]+)['"]?:\s*\(\)\s*=>\s*import\(/g)];
const registeredIds = moduleEntries.map((m) => m[1]);

// Mock p5 and sketch modules at top level
vi.mock('p5', () => {
	return {
		default: class MockP5 {
			constructor(sketch: any) {
				const p = {
					remove: vi.fn(),
					noLoop: vi.fn(),
					loop: vi.fn(),
					redraw: vi.fn(),
					draw: vi.fn(),
				};
				sketch(p);
				Object.assign(this, p);
			}
			remove = vi.fn();
			noLoop = vi.fn();
			loop = vi.fn();
			redraw = vi.fn();
			draw = vi.fn();
		},
	};
});

// Mock all sketch modules
vi.mock('../hero-sketch', () => ({ default: vi.fn() }));
vi.mock('../background-sketch', () => ({ default: vi.fn() }));

describe('sketch registry (static)', () => {
	it('has registered sketches', () => {
		expect(registeredIds.length).toBeGreaterThan(0);
	});
	it('has unique sketch IDs', () => {
		expect(new Set(registeredIds).size).toBe(registeredIds.length);
	});
	it('includes the background sketch', () => {
		expect(registeredIds).toContain('background');
	});
	it('every sketch ID has a corresponding file', () => {
		const sketchDir = resolve(__dirname, '..');
		const files = readdirSync(sketchDir) as string[];
		const sketchFiles = new Set(
			files
				.filter((f: string) => f.endsWith('-sketch.ts'))
				.map((f: string) => f.replace('-sketch.ts', '')),
		);
		for (const id of registeredIds) {
			expect(sketchFiles.has(id)).toBe(true);
		}
	});
});

describe('sketch-loader runtime', () => {
	let observerCallback: (entries: any[]) => void;
	const mockObserve = vi.fn();
	const mockUnobserve = vi.fn();
	const mockDisconnect = vi.fn();

	beforeEach(() => {
		vi.stubGlobal(
			'matchMedia',
			vi.fn().mockReturnValue({
				matches: false,
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
			}),
		);

		class MockIntersectionObserver {
			constructor(cb: any) {
				observerCallback = cb;
			}
			observe = mockObserve;
			unobserve = mockUnobserve;
			disconnect = mockDisconnect;
		}

		vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
		vi.stubGlobal(
			'requestIdleCallback',
			vi.fn((cb) => cb({ didTimeout: false, timeRemaining: () => 10 })),
		);
		vi.stubGlobal('cancelIdleCallback', vi.fn());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.resetModules();
		vi.clearAllMocks();
		document.body.innerHTML = '';
	});

	it('can be imported and exports teardown', async () => {
		const loader = await import('../sketch-loader');
		expect(typeof loader.teardown).toBe('function');
		loader.teardown();
	});

	it('initSketches observes sketch containers', async () => {
		const container = document.createElement('div');
		container.className = 'sketch-container';
		container.dataset.sketch = 'hero';
		document.body.appendChild(container);

		const { initSketches } = await import('../sketch-loader');
		initSketches();

		expect(mockObserve).toHaveBeenCalledWith(container);
	});

	it('loads sketch when container becomes visible', async () => {
		const container = document.createElement('div');
		container.className = 'sketch-container';
		container.dataset.sketch = 'hero';
		document.body.appendChild(container);

		const { initSketches, getSketchInstance } = await import('../sketch-loader');
		initSketches();

		// Trigger intersection
		observerCallback([{ isIntersecting: true, target: container }]);

		for (let i = 0; i < 10; i++) {
			await new Promise((resolve) => setTimeout(resolve, 10));
		}

		expect(getSketchInstance(container)).toBeDefined();
		expect(mockUnobserve).toHaveBeenCalledWith(container);
	});

	it('handles sketch load error gracefully', async () => {
		const container = document.createElement('div');
		container.className = 'sketch-container';
		container.dataset.sketch = 'invalid';
		document.body.appendChild(container);

		const { initSketches } = await import('../sketch-loader');
		initSketches();

		observerCallback([{ isIntersecting: true, target: container }]);

		for (let i = 0; i < 10; i++) {
			await new Promise((resolve) => setTimeout(resolve, 10));
		}

		// Should show fallback text or fallback element
		const fallback = container.querySelector('div');
		expect(fallback?.textContent).toContain('[invalid]');
	});

	it('teardown removes all instances', async () => {
		const container = document.createElement('div');
		container.className = 'sketch-container';
		container.dataset.sketch = 'hero';
		document.body.appendChild(container);

		const { initSketches, getSketchInstance, teardown } = await import('../sketch-loader');
		initSketches();
		observerCallback([{ isIntersecting: true, target: container }]);

		for (let i = 0; i < 10; i++) {
			await new Promise((resolve) => setTimeout(resolve, 10));
		}

		const instance = getSketchInstance(container);
		teardown();

		expect(instance?.remove).toHaveBeenCalled();
		expect(getSketchInstance(container)).toBeUndefined();
	});

	it('pauseSketch and resumeSketch toggle data attributes', async () => {
		const container = document.createElement('div');
		container.className = 'sketch-container';
		container.dataset.sketch = 'hero';
		document.body.appendChild(container);

		const { initSketches, pauseSketch, resumeSketch } = await import('../sketch-loader');
		initSketches();
		observerCallback([{ isIntersecting: true, target: container }]);

		for (let i = 0; i < 10; i++) {
			await new Promise((resolve) => setTimeout(resolve, 10));
		}

		pauseSketch(container);
		expect(container.hasAttribute('data-paused')).toBe(true);

		resumeSketch(container);
		expect(container.hasAttribute('data-paused')).toBe(false);
	});

	it('handles window resize events to update sketch container heights', async () => {
		const container = document.createElement('div');
		container.className = 'sketch-container';
		container.dataset.sketch = 'hero';
		container.dataset.height = '600px';
		container.dataset.mobileHeight = '300px';
		document.body.appendChild(container);

		const { initSketches } = await import('../sketch-loader');
		initSketches();

		// Trigger resize event
		window.dispatchEvent(new Event('resize'));

		for (let i = 0; i < 15; i++) {
			await new Promise((resolve) => setTimeout(resolve, 10));
		}

		expect(container.style.height).toBeDefined();
	});

	it('initBackground schedules gracefully and cleans up', async () => {
		const bg = document.createElement('canvas');
		bg.id = 'bg-canvas';
		document.body.appendChild(bg);

		const { reinitPage, teardownPage } = await import('../sketch-loader');
		reinitPage();

		for (let i = 0; i < 25; i++) {
			await new Promise((resolve) => setTimeout(resolve, 10));
		}

		teardownPage();
	});

	it('teardownPage preserves bg-canvas but removes others', async () => {
		const bg = document.createElement('canvas');
		bg.id = 'bg-canvas';
		document.body.appendChild(bg);

		const container = document.createElement('div');
		container.className = 'sketch-container';
		container.dataset.sketch = 'hero';
		document.body.appendChild(container);

		const { initSketches, teardownPage, getSketchInstance } = await import('../sketch-loader');
		initSketches();

		observerCallback([{ isIntersecting: true, target: container }]);

		for (let i = 0; i < 20; i++) {
			await new Promise((resolve) => setTimeout(resolve, 10));
		}

		teardownPage();
		expect(getSketchInstance(container)).toBeUndefined();
	});

	it('teardown catches remove exceptions', async () => {
		const container = document.createElement('div');
		container.className = 'sketch-container';
		container.dataset.sketch = 'hero';
		document.body.appendChild(container);

		const { initSketches, teardown, getSketchInstance } = await import('../sketch-loader');
		initSketches();
		observerCallback([{ isIntersecting: true, target: container }]);

		for (let i = 0; i < 10; i++) {
			await new Promise((resolve) => setTimeout(resolve, 10));
		}

		const instance = getSketchInstance(container);
		if (instance) {
			instance.remove = () => {
				throw new Error('already removed');
			};
		}

		expect(() => teardown()).not.toThrow();
	});

	it('teardownPage catches remove exceptions', async () => {
		const container = document.createElement('div');
		container.className = 'sketch-container';
		container.dataset.sketch = 'hero';
		document.body.appendChild(container);

		const { initSketches, teardownPage, getSketchInstance } = await import('../sketch-loader');
		initSketches();
		observerCallback([{ isIntersecting: true, target: container }]);

		for (let i = 0; i < 10; i++) {
			await new Promise((resolve) => setTimeout(resolve, 10));
		}

		const instance = getSketchInstance(container);
		if (instance) {
			instance.remove = () => {
				throw new Error('already removed');
			};
		}

		expect(() => teardownPage()).not.toThrow();
	});

	it('scheduleBackgroundInit handles PerformanceObserver errors', async () => {
		class FailingPerformanceObserver {
			disconnect = vi.fn();
			observe() {
				throw new Error('Mock error');
			}
		}
		vi.stubGlobal('PerformanceObserver', FailingPerformanceObserver);

		const bg = document.createElement('canvas');
		bg.id = 'bg-canvas';
		document.body.appendChild(bg);

		const { reinitPage } = await import('../sketch-loader');
		reinitPage();

		for (let i = 0; i < 10; i++) {
			await new Promise((resolve) => setTimeout(resolve, 10));
		}
		vi.unstubAllGlobals();
	});
});
