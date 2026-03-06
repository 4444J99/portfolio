/**
 * Compare actual metrics against policy thresholds.
 * @param {object} actual - Actual coverage values { statements, branches, functions, lines }
 * @param {object} thresholds - Policy threshold values
 * @returns {{ pass: boolean, failures: Array<{ metric: string, actual: number, threshold: number }> }}
 */
export function checkThresholds(actual, thresholds) {
	const failures = [];
	for (const [metric, threshold] of Object.entries(thresholds)) {
		const value = actual[metric];
		if (typeof value === 'number' && value < threshold) {
			failures.push({ metric, actual: value, threshold });
		}
	}
	return { pass: failures.length === 0, failures };
}
