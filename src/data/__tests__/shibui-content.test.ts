// src/data/__tests__/shibui-content.test.ts
// Structural integrity tests for the shibui content pipeline.
// These tests validate schema correctness (required fields, unique IDs)
// but intentionally do NOT gate on [DRAFT] markers — draft state is expected
// after shibui:extract and before shibui:distill has been reviewed.

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SHIBUI_DIR = path.resolve(__dirname, '../../data/shibui/projects');

// ─── helpers ────────────────────────────────────────────────────────────────

function extractField(text: string, field: string): string | null {
	const m = text.match(new RegExp(`^${field}: "?([^"\\n]+)"?`, 'm'));
	return m ? m[1].trim() : null;
}

function extractUnitIds(text: string): string[] {
	const ids: string[] = [];
	const re = /- id: "([^"]+)"/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(text)) !== null) {
		ids.push(m[1]);
	}
	return ids;
}

function loadYamlFiles(): { file: string; text: string }[] {
	if (!fs.existsSync(SHIBUI_DIR)) return [];
	return fs
		.readdirSync(SHIBUI_DIR)
		.filter((f) => f.endsWith('.yaml'))
		.sort()
		.map((f) => ({ file: f, text: fs.readFileSync(path.join(SHIBUI_DIR, f), 'utf8') }));
}

// ─── tests ──────────────────────────────────────────────────────────────────

describe('shibui content pipeline', () => {
	it('shibui data directory exists', () => {
		expect(fs.existsSync(SHIBUI_DIR)).toBe(true);
	});

	it('has at least one YAML file', () => {
		const entries = loadYamlFiles();
		expect(entries.length).toBeGreaterThan(0);
	});

	it('each YAML has required field: page', () => {
		const entries = loadYamlFiles();
		for (const { file, text } of entries) {
			const page = extractField(text, 'page');
			expect(page, `${file}: missing 'page' field`).toBeTruthy();
		}
	});

	it('each YAML has required field: title', () => {
		const entries = loadYamlFiles();
		for (const { file, text } of entries) {
			const title = extractField(text, 'title');
			expect(title, `${file}: missing 'title' field`).toBeTruthy();
		}
	});

	it('unit IDs are unique within each file', () => {
		const entries = loadYamlFiles();
		for (const { file, text } of entries) {
			const ids = extractUnitIds(text);
			const seen = new Set<string>();
			for (const id of ids) {
				expect(seen.has(id), `${file}: duplicate unit ID "${id}"`).toBe(false);
				seen.add(id);
			}
		}
	});

	it('unit IDs are globally unique across all files', () => {
		const entries = loadYamlFiles();
		const globalIds = new Map<string, string>(); // id → filename
		for (const { file, text } of entries) {
			const ids = extractUnitIds(text);
			for (const id of ids) {
				const existing = globalIds.get(id);
				expect(
					existing,
					`Duplicate unit ID "${id}" in "${file}" (also in "${existing}")`,
				).toBeUndefined();
				globalIds.set(id, file);
			}
		}
	});

	it('unit IDs follow the slug.section-slug.pN naming convention', () => {
		const entries = loadYamlFiles();
		const idPattern = /^[a-z0-9-]+\.[a-z0-9-]+\.p\d+$/;
		for (const { file, text } of entries) {
			const ids = extractUnitIds(text);
			for (const id of ids) {
				expect(
					idPattern.test(id),
					`${file}: unit ID "${id}" does not match slug.section.pN pattern`,
				).toBe(true);
			}
		}
	});
});
