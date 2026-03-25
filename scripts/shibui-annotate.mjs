#!/usr/bin/env node
// scripts/shibui-annotate.mjs
// Appends an annotations: block to each shibui YAML that lacks one.
// Calls gemini CLI to identify 2-4 domain-specific terms with plain-English definitions.
// Falls back gracefully if gemini is unavailable.

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHIBUI_DIR = path.join(__dirname, '../src/data/shibui/projects');
const RATE_LIMIT_MS = 2000;

// ─── gemini helpers (same pattern as strike-new.mjs) ────────────────────────

function cleanGeminiOutput(raw) {
	return raw
		.replace(/\u001b\[[0-9;]*m/g, '') // strip ANSI codes
		.split('\n')
		.map((l) => l.trim())
		.filter((l) => l.length > 0)
		.filter(
			(l) =>
				!l.startsWith('Loading ') &&
				!l.startsWith('Server ') &&
				!l.startsWith('Tools ') &&
				!l.startsWith('Loaded ') &&
				!l.includes('tool update notification'),
		);
}

function callGemini(prompt) {
	// Write prompt to temp file to avoid shell escaping issues
	const tmpFile = path.join(__dirname, '.shibui-prompt.tmp');
	try {
		fs.writeFileSync(tmpFile, prompt, 'utf8');
		const raw = execSync(`cat "${tmpFile}" | gemini -p "" 2>/dev/null`, {
			encoding: 'utf8',
			timeout: 30000,
		});
		return cleanGeminiOutput(raw).join('\n').trim();
	} finally {
		try {
			fs.unlinkSync(tmpFile);
		} catch {}
	}
}

/**
 * Ask gemini for 2-4 domain-specific terms from the project text.
 * Returns an array of { term, definition } objects, or [] on failure.
 */
function generateAnnotations(slug, combinedText) {
	const prompt =
		'You are identifying domain-specific technical terms for a portfolio glossary. ' +
		'Given the following project description, output EXACTLY 2-4 terms that a non-technical reader ' +
		'might need explained. ' +
		'Format: one term per line as "TERM: plain-English definition (one sentence, max 20 words)." ' +
		'Do not add numbering, bullets, or any other text. Only the TERM: definition lines.\n\n' +
		`Project: ${slug}\n\n${combinedText.slice(0, 1500)}`;

	try {
		const output = callGemini(prompt);
		const lines = output.split('\n').filter((l) => l.includes(':'));
		const annotations = [];
		for (const line of lines) {
			const colonIdx = line.indexOf(':');
			if (colonIdx === -1) continue;
			const term = line.slice(0, colonIdx).trim();
			const definition = line.slice(colonIdx + 1).trim();
			if (term && definition) {
				annotations.push({ term, definition });
				if (annotations.length >= 4) break;
			}
		}
		return annotations.length >= 2 ? annotations : [];
	} catch (_err) {
		return [];
	}
}

// ─── YAML helpers ─────────────────────────────────────────────────────────

function yamlStr(s) {
	return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

/** Build the annotations: YAML block to append. */
function buildAnnotationsBlock(annotations) {
	const lines = ['annotations:'];
	for (const { term, definition } of annotations) {
		lines.push(`  - term: "${yamlStr(term)}"`);
		lines.push(`    definition: "${yamlStr(definition)}"`);
	}
	return lines.join('\n') + '\n';
}

/** Collect all elevated_preview values from a YAML text. */
function extractPreviews(yamlText) {
	const matches = [...yamlText.matchAll(/elevated_preview: "([^"]+)"/g)];
	return matches.map((m) => m[1].replace(/\\"/g, '"')).join(' ');
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── main ───────────────────────────────────────────────────────────────────

async function main() {
	if (!fs.existsSync(SHIBUI_DIR)) {
		console.log('No shibui directory found. Run shibui:extract first.');
		process.exit(0);
	}

	const files = fs
		.readdirSync(SHIBUI_DIR)
		.filter((f) => f.endsWith('.yaml'))
		.sort();

	let annotated = 0;
	let skipped = 0;
	let fallbacks = 0;

	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const filePath = path.join(SHIBUI_DIR, file);
		const yamlText = fs.readFileSync(filePath, 'utf8');

		// Skip if annotations block already present
		if (yamlText.includes('annotations:')) {
			console.log(`  skip  ${file} (annotations already present)`);
			skipped++;
			continue;
		}

		const slug = path.basename(file, '.yaml');
		const combinedText = extractPreviews(yamlText);

		console.log(`  annotate ${file}`);

		const annotations = generateAnnotations(slug, combinedText);

		if (annotations.length === 0) {
			console.warn(`    ⚠ fallback — gemini unavailable or returned no valid terms`);
			fallbacks++;
			// Append a placeholder block so the file is not re-processed indefinitely
			const placeholder =
				'annotations:\n  # Run shibui:annotate again once gemini CLI is available\n';
			fs.writeFileSync(filePath, yamlText + placeholder, 'utf8');
		} else {
			const block = buildAnnotationsBlock(annotations);
			fs.writeFileSync(filePath, yamlText + block, 'utf8');
			console.log(`    ✓ ${annotations.length} terms added`);
			annotated++;
		}

		if (i < files.length - 1) {
			await sleep(RATE_LIMIT_MS);
		}
	}

	console.log(`\nDone. Annotated: ${annotated}, Skipped: ${skipped}, Fallbacks: ${fallbacks}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
