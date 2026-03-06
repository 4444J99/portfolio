import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const FALLBACK_THRESHOLDS = {
	statements: 25,
	branches: 18,
	functions: 18,
	lines: 25,
};

/**
 * Load a ratchet-policy.json file from the given directory.
 * @param {string} qualityDir - Path to the .quality directory
 * @returns {object} The parsed ratchet policy
 */
export function loadRatchetPolicy(qualityDir) {
	const policyPath = resolve(qualityDir, 'ratchet-policy.json');
	if (!existsSync(policyPath)) {
		throw new Error(`Missing ratchet policy at ${policyPath}`);
	}
	return JSON.parse(readFileSync(policyPath, 'utf-8'));
}

/**
 * Resolve the active phase from a ratchet policy.
 * @param {object} policy - The ratchet policy object
 * @param {string} [envPhase] - Override phase from environment
 * @returns {string} The resolved phase name
 */
export function resolvePhase(policy, envPhase) {
	return envPhase || policy.defaultPhase;
}

/**
 * Resolve coverage thresholds for a given phase.
 * @param {object} policy - The ratchet policy object
 * @param {string} [envPhase] - Override phase from environment
 * @returns {{ phase: string, coverage: object }}
 */
export function resolveCoverageThresholds(policy, envPhase) {
	const phase = resolvePhase(policy, envPhase);
	const phasePolicy = policy.phases?.[phase];

	if (!phasePolicy?.coverage) {
		return { phase, coverage: { ...FALLBACK_THRESHOLDS } };
	}

	return { phase, coverage: phasePolicy.coverage };
}
