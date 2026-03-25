// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	DEPTH_CYCLE,
	DEPTH_LABELS,
	DEPTH_MAP,
	depthToFloat,
	floatToDepth,
	inferInitialDepth,
	nextDepth,
	readStoredDepth,
	STORAGE_KEY,
	stepDepth,
	writeStoredDepth,
} from '@/utils/shibui';

// ---------------------------------------------------------------------------
// localStorage mock — happy-dom's vitest integration exposes a stripped
// localStorage that lacks .clear(); we stub the global with a full in-memory
// implementation to keep tests hermetic.
// ---------------------------------------------------------------------------
function makeLocalStorageMock() {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] ?? null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		},
		get length() {
			return Object.keys(store).length;
		},
		key: (index: number) => Object.keys(store)[index] ?? null,
	};
}

vi.stubGlobal('localStorage', makeLocalStorageMock());

describe('Depth mapping', () => {
	it('depthToFloat returns correct floats', () => {
		expect(depthToFloat('overview')).toBe(0);
		expect(depthToFloat('standard')).toBe(0.5);
		expect(depthToFloat('full')).toBe(1);
	});

	it('floatToDepth returns correct strings', () => {
		expect(floatToDepth(0)).toBe('overview');
		expect(floatToDepth(0.25)).toBe('overview');
		expect(floatToDepth(0.26)).toBe('standard');
		expect(floatToDepth(0.5)).toBe('standard');
		expect(floatToDepth(0.75)).toBe('standard');
		expect(floatToDepth(0.76)).toBe('full');
		expect(floatToDepth(1)).toBe('full');
	});

	it('DEPTH_MAP has 3 entries', () => {
		expect(Object.keys(DEPTH_MAP)).toHaveLength(3);
	});

	it('DEPTH_LABELS has correct human names', () => {
		expect(DEPTH_LABELS.overview).toBe('Overview');
		expect(DEPTH_LABELS.standard).toBe('Standard');
		expect(DEPTH_LABELS.full).toBe('Full Depth');
	});
});

describe('Cycling', () => {
	it('nextDepth cycles overview → standard → full → overview', () => {
		expect(nextDepth('overview')).toBe('standard');
		expect(nextDepth('standard')).toBe('full');
		expect(nextDepth('full')).toBe('overview');
	});
});

describe('Storage key', () => {
	it("STORAGE_KEY equals 'shibui-depth'", () => {
		expect(STORAGE_KEY).toBe('shibui-depth');
	});
});

describe('localStorage read/write', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('readStoredDepth returns null when empty', () => {
		expect(readStoredDepth()).toBeNull();
	});

	it('readStoredDepth returns null for invalid JSON', () => {
		localStorage.setItem(STORAGE_KEY, 'not-json{{{');
		expect(readStoredDepth()).toBeNull();
	});

	it('readStoredDepth returns null for invalid depth value', () => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ depth: 'bogus', version: 1 }));
		expect(readStoredDepth()).toBeNull();
	});

	it('readStoredDepth returns correct value for valid stored depth', () => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ depth: 'full', version: 1 }));
		expect(readStoredDepth()).toBe('full');
	});

	it('writeStoredDepth stores correct JSON shape with depth/version/timestamp', () => {
		const before = Date.now();
		writeStoredDepth('standard');
		const after = Date.now();

		const raw = localStorage.getItem(STORAGE_KEY);
		expect(raw).not.toBeNull();
		const parsed = JSON.parse(raw!);
		expect(parsed.depth).toBe('standard');
		expect(parsed.version).toBe(1);
		expect(parsed.timestamp).toBeGreaterThanOrEqual(before);
		expect(parsed.timestamp).toBeLessThanOrEqual(after);
	});

	it('roundtrip write → read works', () => {
		for (const depth of DEPTH_CYCLE) {
			writeStoredDepth(depth);
			expect(readStoredDepth()).toBe(depth);
		}
	});
});

describe('Referral heuristic', () => {
	it("returns 'full' for github.com referrer", () => {
		expect(inferInitialDepth('https://github.com/user/repo')).toBe('full');
	});

	it("returns 'overview' for linkedin.com referrer", () => {
		expect(inferInitialDepth('https://www.linkedin.com/in/user')).toBe('overview');
	});

	it("returns 'standard' for google.com referrer", () => {
		expect(inferInitialDepth('https://www.google.com/search?q=test')).toBe('standard');
	});

	it("returns 'overview' for empty string", () => {
		expect(inferInitialDepth('')).toBe('overview');
	});

	it("returns 'overview' for unknown referrers", () => {
		expect(inferInitialDepth('https://news.ycombinator.com')).toBe('overview');
		expect(inferInitialDepth('https://example.com')).toBe('overview');
	});
});

describe('Directional stepping', () => {
	it("stepDepth('overview', 'deeper') = 'standard'", () => {
		expect(stepDepth('overview', 'deeper')).toBe('standard');
	});

	it("stepDepth('full', 'deeper') = 'full' (clamp)", () => {
		expect(stepDepth('full', 'deeper')).toBe('full');
	});

	it("stepDepth('full', 'shallower') = 'standard'", () => {
		expect(stepDepth('full', 'shallower')).toBe('standard');
	});

	it("stepDepth('overview', 'shallower') = 'overview' (clamp)", () => {
		expect(stepDepth('overview', 'shallower')).toBe('overview');
	});
});
