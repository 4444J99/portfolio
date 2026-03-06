#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const EXPECTED = {
	sync: 'f6b475c8ba5941e3837b8439f907ae1721dd5b0f7cf6498360093b836689a53d',
	validate: '0f6348dbeb2b6e57549b406db1deda2e84cc2391f16c42c5677038d0def0d7ac',
	telemetry: '4a047d66bf9332d01bf2467c4150bf9f50f6646e351115f07db6de3dc271ae3b',
	entrypoint: 'e77da7fc486fe70f6a30a7d8fded0a883beeb0dfaa4229d7ff8cf9222b3e6380',
};

function sha256(filePath) {
	const content = readFileSync(filePath);
	return createHash('sha256').update(content).digest('hex');
}

const checks = [
	{
		label: 'sync core',
		filePath: resolve('packages/github-pages-index-core/src/sync-core.mjs'),
		expected: EXPECTED.sync,
	},
	{
		label: 'validate core',
		filePath: resolve('packages/github-pages-index-core/src/validate-core.mjs'),
		expected: EXPECTED.validate,
	},
	{
		label: 'telemetry core',
		filePath: resolve('packages/github-pages-index-core/src/telemetry-core.mjs'),
		expected: EXPECTED.telemetry,
	},
	{
		label: 'package entrypoint',
		filePath: resolve('packages/github-pages-index-core/src/index.mjs'),
		expected: EXPECTED.entrypoint,
	},
];

let failed = false;

for (const check of checks) {
	const actual = sha256(check.filePath);
	if (actual !== check.expected) {
		failed = true;
		console.error(`GitHub Pages ${check.label} drift detected:`);
		console.error(`- file: ${check.filePath}`);
		console.error(`- expected: ${check.expected}`);
		console.error(`- actual:   ${actual}`);
	}
}

if (failed) {
	console.error('\nUpdate canonical hashes after intentionally releasing a new core version.');
	process.exit(1);
}

console.log('GitHub Pages core drift check passed.');
