#!/usr/bin/env node
// scripts/shibui-validate.mjs
// Validates shibui YAML files for editorial completeness.
// Exits 0 when directory doesn't exist or is empty (graceful skip during draft phase).
// Exits 1 when validation errors are found.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHIBUI_DIR = path.join(__dirname, '../src/data/shibui/projects');

// ─── validation helpers ──────────────────────────────────────────────────────

function extractField(yamlText, field) {
	const m = yamlText.match(new RegExp(`^${field}: "?([^"\\n]+)"?`, 'm'));
	return m ? m[1].trim() : null;
}

function extractUnitIds(yamlText) {
	const ids = [];
	const re = /- id: "([^"]+)"/g;
	let m;
	while ((m = re.exec(yamlText)) !== null) {
		ids.push(m[1]);
	}
	return ids;
}

function validateFile(filePath, errors) {
	const file = path.basename(filePath);
	const text = fs.readFileSync(filePath, 'utf8');

	// Required fields
	const page = extractField(text, 'page');
	const title = extractField(text, 'title');

	if (!page) errors.push(`${file}: missing required field 'page'`);
	if (!title) errors.push(`${file}: missing required field 'title'`);

	// No [DRAFT] markers
	const draftMatches = [...text.matchAll(/\[DRAFT\]/g)];
	if (draftMatches.length > 0) {
		errors.push(`${file}: ${draftMatches.length} [DRAFT] marker(s) — run shibui:distill`);
	}

	// No [REVIEW] markers
	const reviewMatches = [...text.matchAll(/\[REVIEW\]/g)];
	if (reviewMatches.length > 0) {
		errors.push(`${file}: ${reviewMatches.length} [REVIEW] marker(s) — resolve before publishing`);
	}

	// Unique unit IDs (within this file)
	const ids = extractUnitIds(text);
	const seen = new Set();
	for (const id of ids) {
		if (seen.has(id)) {
			errors.push(`${file}: duplicate unit ID "${id}"`);
		}
		seen.add(id);
	}
}

// ─── main ───────────────────────────────────────────────────────────────────

function main() {
	// Graceful skip — directory doesn't exist yet
	if (!fs.existsSync(SHIBUI_DIR)) {
		console.log('shibui:validate — no shibui directory, skipping (run shibui:extract first)');
		process.exit(0);
	}

	const files = fs
		.readdirSync(SHIBUI_DIR)
		.filter((f) => f.endsWith('.yaml'))
		.sort();

	// Graceful skip — no YAML files yet
	if (files.length === 0) {
		console.log('shibui:validate — no YAML files found, skipping');
		process.exit(0);
	}

	const errors = [];

	// Also check for globally unique unit IDs across all files
	const globalIds = new Map(); // id → filename
	for (const file of files) {
		const text = fs.readFileSync(path.join(SHIBUI_DIR, file), 'utf8');
		const ids = extractUnitIds(text);
		for (const id of ids) {
			if (globalIds.has(id)) {
				errors.push(`Duplicate unit ID "${id}" found in both "${globalIds.get(id)}" and "${file}"`);
			} else {
				globalIds.set(id, file);
			}
		}
	}

	for (const file of files) {
		validateFile(path.join(SHIBUI_DIR, file), errors);
	}

	if (errors.length === 0) {
		console.log(`shibui:validate — ${files.length} file(s) OK`);
		process.exit(0);
	} else {
		console.error(`shibui:validate — ${errors.length} error(s):`);
		for (const e of errors) {
			console.error(`  ✗ ${e}`);
		}
		process.exit(1);
	}
}

main();
