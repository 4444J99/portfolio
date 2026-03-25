#!/usr/bin/env node
// scripts/shibui-yaml-backfill.mjs
// Syncs entry text from .astro project pages back into shibui YAML data files.
// Only replaces [DRAFT] entries; leaves existing real text untouched.
// New ShibuiContent IDs (not in YAML) are appended to the best-matching section.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGES_DIR = path.join(__dirname, '../src/pages/projects');
const YAML_DIR = path.join(__dirname, '../src/data/shibui/projects');

// ─── helpers ────────────────────────────────────────────────────────────────

/** Extract all ShibuiContent blocks from an .astro file.
 *  Returns Map<id, entryText> */
function extractShibuiEntries(source) {
	const entries = new Map();

	// Match ShibuiContent blocks with their id and entry slot content.
	// Pattern: <ShibuiContent id="..."> ... <span slot="entry"> ... </span>
	const blockRegex =
		/<ShibuiContent\s+id="([^"]+)"[^>]*>\s*<span\s+slot="entry">\s*([\s\S]*?)\s*<\/span>/g;

	let match;
	while ((match = blockRegex.exec(source)) !== null) {
		const id = match[1];
		const rawEntry = match[2];

		// Extract text from <p> tags inside the entry slot
		const pRegex = /<p>([\s\S]*?)<\/p>/g;
		const paragraphs = [];
		let pMatch;
		while ((pMatch = pRegex.exec(rawEntry)) !== null) {
			// Strip HTML tags but keep the text content
			const text = stripHtml(pMatch[1]).trim();
			if (text.length > 0) {
				paragraphs.push(text);
			}
		}

		if (paragraphs.length > 0) {
			// Join multiple paragraphs with a space (most entries are single <p>)
			entries.set(id, paragraphs.join(' '));
		}
	}

	return entries;
}

/** Strip HTML/Astro tags from text, preserving readable content. */
function stripHtml(raw) {
	// Remove self-closing components like <Cite …/>
	let text = raw.replace(/<[A-Za-z][^>]*\/>/g, '');
	// Remove opening and closing tags
	text = text.replace(/<[^>]+>/g, '');
	// Replace {…} template expressions with [dynamic]
	text = text.replace(/\{[^}]*\}/g, '[dynamic]');
	// Decode common HTML entities
	text = text.replace(/&gt;/g, '>');
	text = text.replace(/&lt;/g, '<');
	text = text.replace(/&amp;/g, '&');
	text = text.replace(/&mdash;/g, '\u2014');
	text = text.replace(/&ndash;/g, '\u2013');
	text = text.replace(/&rsquo;/g, '\u2019');
	text = text.replace(/&lsquo;/g, '\u2018');
	text = text.replace(/&rdquo;/g, '\u201C');
	text = text.replace(/&ldquo;/g, '\u201D');
	text = text.replace(/&#8594;/g, '\u2192');
	// Collapse whitespace
	text = text.replace(/\s+/g, ' ');
	return text.trim();
}

/** Escape a string for YAML double-quoted scalar. */
function yamlEscape(s) {
	return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** Convert heading text to slug (matching shibui-extract.mjs logic). */
function headingToSlug(heading) {
	return heading
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}

/**
 * Process a single YAML file, updating [DRAFT] entries and adding new IDs.
 * Operates on raw text to preserve formatting exactly.
 * Returns { updated, added, remainingDrafts }
 */
function processYaml(yamlPath, astroEntries) {
	const content = fs.readFileSync(yamlPath, 'utf8');
	const lines = content.split('\n');

	let updated = 0;
	let added = 0;
	let remainingDrafts = 0;

	// Track which astro IDs were matched (for finding new ones to add)
	const matchedIds = new Set();

	// Collect all existing IDs from the YAML
	const existingIds = new Set();
	for (const line of lines) {
		const idMatch = line.match(/^\s+- id: "([^"]+)"/);
		if (idMatch) existingIds.add(idMatch[1]);
	}

	// Pass 1: Replace [DRAFT] entries where we have astro content
	const newLines = [];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		// Check if this is an entry: "[DRAFT]" line
		if (/^\s+entry: "\[DRAFT\]"/.test(line)) {
			// Look backwards for the id of this unit
			let unitId = null;
			for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
				const idMatch = lines[j].match(/^\s+- id: "([^"]+)"/);
				if (idMatch) {
					unitId = idMatch[1];
					break;
				}
			}

			if (unitId && astroEntries.has(unitId)) {
				// Replace [DRAFT] with actual entry text
				const entryText = astroEntries.get(unitId);
				const indent = line.match(/^(\s+)/)[1];
				newLines.push(`${indent}entry: "${yamlEscape(entryText)}"`);
				matchedIds.add(unitId);
				updated++;
			} else {
				// No match — keep the [DRAFT]
				newLines.push(line);
				remainingDrafts++;
			}
		} else {
			newLines.push(line);
		}
	}

	// Pass 2: Find new IDs in astro that don't exist in YAML
	const newIds = [];
	for (const [id, text] of astroEntries) {
		if (!existingIds.has(id) && !matchedIds.has(id)) {
			newIds.push({ id, text });
		}
	}

	// Pass 3: Add new IDs to the best-matching section
	if (newIds.length > 0) {
		// Parse section structure from the YAML lines to find insertion points
		const sectionInfo = parseSections(newLines);

		for (const { id, text } of newIds) {
			// Extract section slug from the ID: "project.section-name.pN" → "section-name"
			const parts = id.split('.');
			if (parts.length < 3) continue;
			const sectionSlug = parts.slice(1, -1).join('.');

			// Find best matching section
			const bestSection = findBestSection(sectionSlug, sectionInfo);
			if (bestSection) {
				// Insert new unit at the end of the matching section's units
				const insertIdx = bestSection.lastUnitEndLine + 1;
				const unitLines = [
					`      - id: "${id}"`,
					`        elevated_preview: ""`,
					`        entry: "${yamlEscape(text)}"`,
				];
				newLines.splice(insertIdx, 0, ...unitLines);

				// Update section info line numbers for subsequent insertions
				for (const sec of sectionInfo) {
					if (sec.lastUnitEndLine >= insertIdx) {
						sec.lastUnitEndLine += unitLines.length;
					}
				}
				bestSection.lastUnitEndLine = insertIdx + unitLines.length - 1;
				added++;
			}
		}
	}

	// Write back
	const result = newLines.join('\n');
	if (result !== content) {
		fs.writeFileSync(yamlPath, result, 'utf8');
	}

	return { updated, added, remainingDrafts };
}

/** Parse section structure from YAML lines.
 *  Returns [{heading, headingSlug, headingLine, lastUnitEndLine}] */
function parseSections(lines) {
	const sections = [];
	let currentSection = null;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		// Match section heading
		const headingMatch = line.match(/^\s+- heading: "([^"]+)"/);
		if (headingMatch) {
			if (currentSection) {
				currentSection.lastUnitEndLine = i - 1;
				sections.push(currentSection);
			}
			currentSection = {
				heading: headingMatch[1],
				headingSlug: headingToSlug(headingMatch[1]),
				headingLine: i,
				lastUnitEndLine: i,
			};
		}

		// Track unit entries to find the last line of each section
		if (currentSection && /^\s+entry:/.test(line)) {
			currentSection.lastUnitEndLine = i;
		}
	}

	if (currentSection) {
		currentSection.lastUnitEndLine = lines.length - 1;
		// Don't count trailing blank lines
		while (
			currentSection.lastUnitEndLine > currentSection.headingLine &&
			lines[currentSection.lastUnitEndLine].trim() === ''
		) {
			currentSection.lastUnitEndLine--;
		}
		sections.push(currentSection);
	}

	return sections;
}

/** Find the best matching section for a given slug. */
function findBestSection(sectionSlug, sections) {
	// Exact match
	for (const sec of sections) {
		if (sec.headingSlug === sectionSlug) return sec;
	}

	// Partial match — slug contains or is contained by a section slug
	for (const sec of sections) {
		if (sectionSlug.includes(sec.headingSlug) || sec.headingSlug.includes(sectionSlug)) {
			return sec;
		}
	}

	// Word overlap match
	const slugWords = new Set(sectionSlug.split('-'));
	let bestScore = 0;
	let bestSection = null;
	for (const sec of sections) {
		const secWords = new Set(sec.headingSlug.split('-'));
		let overlap = 0;
		for (const w of slugWords) {
			if (secWords.has(w)) overlap++;
		}
		if (overlap > bestScore) {
			bestScore = overlap;
			bestSection = sec;
		}
	}

	return bestSection;
}

// ─── main ───────────────────────────────────────────────────────────────────

function main() {
	const astroFiles = fs
		.readdirSync(PAGES_DIR)
		.filter((f) => f.endsWith('.astro'))
		.sort();

	let totalUpdated = 0;
	let totalAdded = 0;
	let totalRemainingDrafts = 0;
	let totalAstroEntries = 0;
	const perFile = [];

	for (const file of astroFiles) {
		const slug = path.basename(file, '.astro');
		const astroPath = path.join(PAGES_DIR, file);
		const yamlPath = path.join(YAML_DIR, `${slug}.yaml`);

		if (!fs.existsSync(yamlPath)) {
			console.log(`  skip  ${slug} — no YAML file`);
			continue;
		}

		const source = fs.readFileSync(astroPath, 'utf8');
		const astroEntries = extractShibuiEntries(source);
		totalAstroEntries += astroEntries.size;

		if (astroEntries.size === 0) {
			console.log(`  skip  ${slug} — no ShibuiContent entries in .astro`);
			continue;
		}

		const { updated, added, remainingDrafts } = processYaml(yamlPath, astroEntries);

		const status = [];
		if (updated > 0) status.push(`${updated} updated`);
		if (added > 0) status.push(`${added} added`);
		if (remainingDrafts > 0) status.push(`${remainingDrafts} drafts remain`);

		console.log(
			`  ${updated > 0 || added > 0 ? 'write' : 'skip '}  ${slug} (${status.join(', ')})`,
		);

		totalUpdated += updated;
		totalAdded += added;
		totalRemainingDrafts += remainingDrafts;

		if (updated > 0 || added > 0 || remainingDrafts > 0) {
			perFile.push({ slug, updated, added, remainingDrafts });
		}
	}

	console.log('\n─── Summary ───');
	console.log(`Astro ShibuiContent blocks found: ${totalAstroEntries}`);
	console.log(`YAML [DRAFT] entries updated:     ${totalUpdated}`);
	console.log(`New entries added to YAML:         ${totalAdded}`);
	console.log(`Remaining [DRAFT] entries:         ${totalRemainingDrafts}`);

	if (totalRemainingDrafts > 0) {
		console.log('\n─── Remaining Drafts by File ───');
		for (const { slug, remainingDrafts } of perFile) {
			if (remainingDrafts > 0) {
				console.log(`  ${slug}: ${remainingDrafts} drafts`);
			}
		}
	}
}

main();
