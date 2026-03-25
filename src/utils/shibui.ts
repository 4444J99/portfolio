/** Depth states — the three stops of the Shibui content system. */
export type ShibuiDepth = 'overview' | 'standard' | 'full';

/** String → float canonical mapping. */
export const DEPTH_MAP = {
	overview: 0,
	standard: 0.5,
	full: 1,
} as const satisfies Record<ShibuiDepth, number>;

/** Human-readable labels for each depth state. */
export const DEPTH_LABELS = {
	overview: 'Overview',
	standard: 'Standard',
	full: 'Full Depth',
} as const satisfies Record<ShibuiDepth, string>;

/** Ordered cycle for click-to-advance. */
export const DEPTH_CYCLE: ShibuiDepth[] = ['overview', 'standard', 'full'];

export function depthToFloat(d: ShibuiDepth): number {
	return DEPTH_MAP[d];
}

export function floatToDepth(f: number): ShibuiDepth {
	if (f <= 0.25) return 'overview';
	if (f <= 0.75) return 'standard';
	return 'full';
}

export const STORAGE_KEY = 'shibui-depth';

/** Advance to the next depth state in the cycle. */
export function nextDepth(current: ShibuiDepth): ShibuiDepth {
	const idx = DEPTH_CYCLE.indexOf(current);
	return DEPTH_CYCLE[(idx + 1) % DEPTH_CYCLE.length];
}

/** Step depth in a direction (for arrow keys). Clamps at boundaries. */
export function stepDepth(current: ShibuiDepth, direction: 'deeper' | 'shallower'): ShibuiDepth {
	const idx = DEPTH_CYCLE.indexOf(current);
	if (direction === 'deeper') return DEPTH_CYCLE[Math.min(idx + 1, DEPTH_CYCLE.length - 1)];
	return DEPTH_CYCLE[Math.max(idx - 1, 0)];
}

/** Read stored depth from localStorage. Returns null if no preference stored. */
export function readStoredDepth(): ShibuiDepth | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) {
			const parsed = JSON.parse(raw);
			if (parsed?.depth && DEPTH_CYCLE.includes(parsed.depth)) {
				return parsed.depth as ShibuiDepth;
			}
		}
	} catch {
		// localStorage unavailable or corrupt — fall through
	}
	return null;
}

/** Write depth preference to localStorage. */
export function writeStoredDepth(depth: ShibuiDepth): void {
	try {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				depth,
				version: 1,
				timestamp: Date.now(),
			}),
		);
	} catch {
		// localStorage unavailable — silently degrade
	}
}

/** Infer initial depth from document.referrer. Best-effort heuristic.
 *  Only called when no stored preference exists (true first visit). */
export function inferInitialDepth(referrer: string): ShibuiDepth {
	if (referrer.includes('github.com')) return 'full';
	if (referrer.includes('linkedin.com')) return 'overview';
	if (referrer.includes('google.com')) return 'standard';
	return 'overview';
}

/** Enforce a page-level minimum depth floor.
 *  If the page declares data-shibui-page-floor="standard", depth cannot go below standard. */
export function enforceFloor(depth: ShibuiDepth, floor: ShibuiDepth | null): ShibuiDepth {
	if (!floor) return depth;
	const depthIdx = DEPTH_CYCLE.indexOf(depth);
	const floorIdx = DEPTH_CYCLE.indexOf(floor);
	return depthIdx < floorIdx ? floor : depth;
}
