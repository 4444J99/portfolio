import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Load a security-policy.json file from the given directory.
 * @param {string} qualityDir - Path to the .quality directory
 * @returns {object} The parsed security policy
 */
export function loadSecurityPolicy(qualityDir) {
	const policyPath = resolve(qualityDir, 'security-policy.json');
	if (!existsSync(policyPath)) {
		throw new Error(`Missing security policy at ${policyPath}`);
	}
	return JSON.parse(readFileSync(policyPath, 'utf-8'));
}

/**
 * Sort checkpoints by date ascending.
 * @param {Array} checkpoints
 * @returns {Array} Sorted checkpoints
 */
export function sortCheckpoints(checkpoints) {
	return [...checkpoints]
		.filter((cp) => cp && typeof cp.date === 'string')
		.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}

/**
 * Resolve the currently active security checkpoint.
 * @param {Array} checkpoints - Array of checkpoint objects with date field
 * @param {number} [referenceTime] - Reference timestamp (defaults to now)
 * @returns {object|null} The active checkpoint or null
 */
export function resolveSecurityCheckpoint(checkpoints, referenceTime) {
	const sorted = sortCheckpoints(checkpoints);
	if (sorted.length === 0) return null;
	const ref = referenceTime ?? Date.now();
	const reached = sorted.filter((cp) => Date.parse(cp.date) <= ref);
	return reached.length > 0 ? reached[reached.length - 1] : sorted[0];
}
