#!/usr/bin/env node
// scripts/shibui-distill.mjs
// Fills [DRAFT] entry fields in shibui YAML stubs using the gemini CLI.
// Conservation of Meaning: preserve all claims, strip jargon, first person,
// conversational tone, 40-60% reduction.
// Falls back to [DRAFT] if gemini is unavailable.

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
		)
		.join(' ')
		.trim();
}

function callGemini(prompt) {
	// Write prompt to temp file to avoid shell escaping issues with quotes,
	// backticks, dollar signs, etc. in elevated text content.
	const tmpFile = path.join(__dirname, '.shibui-prompt.tmp');
	try {
		fs.writeFileSync(tmpFile, prompt, 'utf8');
		const raw = execSync(`cat "${tmpFile}" | gemini -p "" 2>/dev/null`, {
			encoding: 'utf8',
			timeout: 30000,
		});
		return cleanGeminiOutput(raw);
	} finally {
		try { fs.unlinkSync(tmpFile); } catch {}
	}
}

function generateEntry(unitId, elevatedPreview) {
	const systemPrompt =
		'You are rewriting technical portfolio text into conversational entry-level summaries. ' +
		'RULES: 1) Preserve every factual claim — no omissions. ' +
		'2) Write in first person ("I built", "I chose"). ' +
		'3) Remove jargon acronyms and framework names where possible — describe what they do instead. ' +
		'4) Target 40-60% shorter than the source. ' +
		'5) Sound like a thoughtful person explaining their work to a curious non-expert, not a LinkedIn post. ' +
		'6) Output only the rewritten paragraph — no preamble, no labels.';

	const userPrompt = `${systemPrompt}\n\nRewrite this for the entry layer (unit: ${unitId}):\n\n${elevatedPreview}`;

	try {
		const result = callGemini(userPrompt);
		return result || '[DRAFT]';
	} catch (_err) {
		return '[DRAFT]';
	}
}

// ─── minimal YAML round-trip (no external dep) ───────────────────────────────
// We read the raw text and do targeted string replacements rather than
// a full parse/serialise, to preserve formatting and comments.

function replaceEntryInYaml(yamlText, unitId, newEntry) {
	// Find the unit block and replace its entry: "[DRAFT]" line.
	// Pattern: id: "…unitId…" followed (possibly after other fields) by entry: "[DRAFT]"
	// We do a targeted replacement scoped near the ID.
	const idPattern = new RegExp(
		`(\\s+- id: "${escapeRegex(unitId)}"[\\s\\S]*?entry: )"\\[DRAFT\\]"`,
		'm',
	);
	const sanitised = newEntry.replace(/"/g, '\\"').replace(/\n/g, ' ');
	return yamlText.replace(idPattern, `$1"${sanitised}"`);
}

function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

	let total = 0;
	let processed = 0;
	let fallbacks = 0;

	for (const file of files) {
		const filePath = path.join(SHIBUI_DIR, file);
		let yamlText = fs.readFileSync(filePath, 'utf8');

		// Find all [DRAFT] entries with their unit IDs
		// Pattern: id: "some-id"\n        elevated_preview: "..."\n        entry: "[DRAFT]"
		const unitRegex = /- id: "([^"]+)"[\s\S]*?entry: "\[DRAFT\]"/g;
		const drafts = [];
		let m;
		while ((m = unitRegex.exec(yamlText)) !== null) {
			const unitId = m[1];
			// Extract elevated_preview for this unit
			const previewMatch = m[0].match(/elevated_preview: "([^"]+)"/);
			const preview = previewMatch ? previewMatch[1].replace(/\\"/g, '"') : '';
			drafts.push({ unitId, preview });
		}

		if (drafts.length === 0) {
			console.log(`  skip  ${file} (no [DRAFT] entries)`);
			continue;
		}

		console.log(`  distill ${file} — ${drafts.length} unit(s)`);

		for (const { unitId, preview } of drafts) {
			total++;
			console.log(`    → ${unitId}`);

			const entry = generateEntry(unitId, preview);
			if (entry === '[DRAFT]') {
				console.warn(`      ⚠ fallback (gemini unavailable)`);
				fallbacks++;
			}

			yamlText = replaceEntryInYaml(yamlText, unitId, entry);
			processed++;

			if (processed < total || drafts.indexOf({ unitId, preview }) < drafts.length - 1) {
				await sleep(RATE_LIMIT_MS);
			}
		}

		fs.writeFileSync(filePath, yamlText, 'utf8');
	}

	console.log(
		`\nDone. Processed: ${processed}, Fallbacks (kept [DRAFT]): ${fallbacks}`,
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
