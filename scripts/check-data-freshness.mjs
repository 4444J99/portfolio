#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseOption } from './lib/cli-utils.mjs';

/**
 * Data freshness validation script.
 * Reads key data files and checks whether their timestamps are within the allowed age threshold.
 * Exits 0 if all files are fresh, 1 if any are stale or missing.
 *
 * Supports:
 *   --max-age-days N   Override per-file thresholds with a single value
 *   --json-out PATH    Write JSON summary to PATH (default: .quality/data-freshness-summary.json)
 */

const outputPath = resolve(parseOption('json-out', '.quality/data-freshness-summary.json'));
const globalMaxAge = parseOption('max-age-days', null);

/** @typedef {{ file: string, timestampField: string|null, maxAgeDays: number }} FileSpec */

/** @type {FileSpec[]} */
const FILE_SPECS = [
	{ file: 'src/data/omega.json', timestampField: 'generated', maxAgeDays: 7 },
	{ file: 'src/data/github-pages.json', timestampField: 'generatedAt', maxAgeDays: 3 },
	{ file: 'src/data/vitals.json', timestampField: 'timestamp', maxAgeDays: 7 },
	{ file: 'src/data/system-metrics.json', timestampField: 'generated', maxAgeDays: 14 },
	{ file: 'src/data/projects.json', timestampField: 'generated', maxAgeDays: 14 },
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

/**
 * Resolve the effective max age for a file spec.
 * If --max-age-days is supplied on the CLI it overrides all per-file thresholds.
 * @param {FileSpec} spec
 * @returns {number}
 */
function effectiveMaxAge(spec) {
	if (globalMaxAge !== null) {
		const parsed = Number(globalMaxAge);
		if (Number.isNaN(parsed) || parsed <= 0) {
			throw new Error(`--max-age-days must be a positive number, got: ${globalMaxAge}`);
		}
		return parsed;
	}
	return spec.maxAgeDays;
}

/**
 * Resolve the timestamp for a file.
 * First tries the JSON field, falls back to file mtime, returns null if the file is missing.
 * @param {string} absPath
 * @param {string|null} timestampField
 * @returns {{ ts: Date, source: string }|null}
 */
function resolveTimestamp(absPath, timestampField) {
	if (!existsSync(absPath)) {
		return null;
	}

	if (timestampField !== null) {
		try {
			const raw = readFileSync(absPath, 'utf-8');
			const data = JSON.parse(raw);
			const value = data[timestampField];
			if (value) {
				const ts = new Date(value);
				if (!Number.isNaN(ts.getTime())) {
					return { ts, source: `json:${timestampField}` };
				}
			}
		} catch {
			// Fall through to mtime
		}
	}

	// Fall back to file modification time
	const { mtime } = statSync(absPath);
	return { ts: mtime, source: 'mtime' };
}

const results = [];
const failures = [];

for (const spec of FILE_SPECS) {
	const absPath = resolve(spec.file);
	const maxAgeDays = effectiveMaxAge(spec);
	const resolved = resolveTimestamp(absPath, spec.timestampField);

	if (resolved === null) {
		const result = {
			file: spec.file,
			status: 'missing',
			timestampField: spec.timestampField,
			maxAgeDays,
			timestamp: null,
			timestampSource: null,
			ageDays: null,
		};
		results.push(result);
		failures.push(`${spec.file}: file not found`);
		continue;
	}

	const { ts, source } = resolved;
	const ageDays = (now - ts.getTime()) / MS_PER_DAY;
	const stale = ageDays > maxAgeDays;

	const result = {
		file: spec.file,
		status: stale ? 'stale' : 'fresh',
		timestampField: spec.timestampField,
		maxAgeDays,
		timestamp: ts.toISOString(),
		timestampSource: source,
		ageDays: Number(ageDays.toFixed(2)),
	};

	results.push(result);

	if (stale) {
		failures.push(
			`${spec.file}: ${ageDays.toFixed(1)} days old (max ${maxAgeDays}d, source: ${source})`,
		);
	}
}

const summary = {
	generated: new Date().toISOString(),
	globalMaxAgeDaysOverride: globalMaxAge !== null ? Number(globalMaxAge) : null,
	status: failures.length === 0 ? 'pass' : 'fail',
	failures,
	results,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(summary, null, 2) + '\n');

if (summary.status === 'fail') {
	console.error('Data freshness check failed:');
	for (const msg of failures) {
		console.error(`  - ${msg}`);
	}
	process.exit(1);
}

const staleCount = results.filter((r) => r.status === 'stale').length;
const missingCount = results.filter((r) => r.status === 'missing').length;
console.log(
	`Data freshness check passed. ${results.length} files checked, ${staleCount} stale, ${missingCount} missing.`,
);
