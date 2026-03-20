#!/usr/bin/env node

/**
 * sync-content-from-praxis.mjs
 *
 * Copies pre-generated JSON data files from the sibling
 * ingesting-organ-document-structure repo into src/data/.
 * Unlike `npm run generate-data`, this does NOT run the Python
 * generator — it only copies already-built outputs.
 */

import { copyFileSync, existsSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const PRAXIS_DIR = resolve(ROOT, '..', 'ingesting-organ-document-structure');
const DATA_DIR = join(ROOT, 'src', 'data');

/** Files the Python generator writes into --output-dir */
const GENERATED_FILES = ['projects.json', 'essays.json', 'graph.json', 'experience.json'];

/** Files that live at the praxis repo root (not in --output-dir) */
const ROOT_FILES = ['system-metrics.json'];

function main() {
	if (!existsSync(PRAXIS_DIR)) {
		console.error(
			`\u2717 Praxis repo not found at ${PRAXIS_DIR}\n` +
				'  Clone ingesting-organ-document-structure alongside the portfolio repo.',
		);
		process.exit(1);
	}

	let copied = 0;
	let skipped = 0;

	// The Python generator writes into an output dir; when run via
	// `generate-data` that dir is src/data/ itself. But praxis may also
	// keep a cached copy at its own output/ directory. We check both.
	const praxisOutputDir = join(PRAXIS_DIR, 'output');
	const generatedSource = existsSync(praxisOutputDir) ? praxisOutputDir : PRAXIS_DIR;

	for (const file of GENERATED_FILES) {
		const src = join(generatedSource, file);
		const dest = join(DATA_DIR, file);
		if (existsSync(src)) {
			copyFileSync(src, dest);
			console.log(`  \u2713 ${basename(src)}`);
			copied++;
		} else {
			console.warn(`  \u2013 ${file} not found in ${generatedSource}`);
			skipped++;
		}
	}

	for (const file of ROOT_FILES) {
		const src = join(PRAXIS_DIR, file);
		const dest = join(DATA_DIR, file);
		if (existsSync(src)) {
			copyFileSync(src, dest);
			console.log(`  \u2713 ${basename(src)}`);
			copied++;
		} else {
			console.warn(`  \u2013 ${file} not found at praxis root`);
			skipped++;
		}
	}

	console.log(`\nDone. ${copied} copied, ${skipped} skipped.`);
	if (copied === 0) {
		console.error('No files were copied — run the Python generator first.');
		process.exit(1);
	}
}

main();
