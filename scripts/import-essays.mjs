#!/usr/bin/env node

/**
 * Import essays from the logos organ (Jekyll _posts) into the portfolio's
 * Astro content collection at src/content/logos/.
 *
 * Frontmatter transformation:
 *   - layout, author, category, related_repos, reading_time, word_count, references → removed
 *   - date → pubDate (unquoted for Astro Date parsing)
 *   - excerpt → description
 *   - portfolio_relevance: "CRITICAL" → featured: true, else false
 *   - tags: capitalize first letter of each tag
 *   - Filename: strip YYYY-MM-DD- prefix
 */

import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const SOURCE_DIR = join(
	import.meta.dirname,
	'..',
	'..',
	'..',
	'organvm-v-logos',
	'public-process',
	'_posts',
);
const TARGET_DIR = join(import.meta.dirname, '..', 'src', 'content', 'logos');

/** Parse Jekyll frontmatter from a markdown file. Returns { frontmatter, body }. */
function parseFrontmatter(content) {
	const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
	if (!match) {
		throw new Error('No frontmatter found');
	}
	const raw = match[1];
	const body = match[2];

	const fm = {};
	let currentKey = null;
	let currentArrayItems = null;

	for (const line of raw.split('\n')) {
		// Continuation of a YAML array (indented "- value")
		if (currentKey && /^\s+-\s+/.test(line)) {
			currentArrayItems.push(line.replace(/^\s+-\s+/, '').replace(/^["']|["']$/g, ''));
			continue;
		}

		// If we were collecting array items, flush them
		if (currentKey && currentArrayItems) {
			fm[currentKey] = currentArrayItems;
			currentKey = null;
			currentArrayItems = null;
		}

		// Key: value line
		const kvMatch = line.match(/^(\w[\w_]*)\s*:\s*(.*)$/);
		if (!kvMatch) continue;

		const key = kvMatch[1];
		let value = kvMatch[2].trim();

		// Inline array: [item1, item2, ...]
		if (value.startsWith('[') && value.endsWith(']')) {
			const inner = value.slice(1, -1);
			fm[key] = inner ? inner.split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')) : [];
			continue;
		}

		// Start of a multi-line array (value is empty after colon)
		if (value === '') {
			currentKey = key;
			currentArrayItems = [];
			continue;
		}

		// Strip quotes
		value = value.replace(/^["']|["']$/g, '');
		fm[key] = value;
	}

	// Flush any trailing array
	if (currentKey && currentArrayItems) {
		fm[currentKey] = currentArrayItems;
	}

	return { frontmatter: fm, body };
}

/** Capitalize first letter of a tag (hyphenated words: capitalize first segment only). */
function capitalizeTag(tag) {
	if (!tag) return tag;
	return tag.charAt(0).toUpperCase() + tag.slice(1);
}

/** Strip YYYY-MM-DD- prefix from filename. */
function stripDatePrefix(filename) {
	return filename.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

/** Build Astro frontmatter string. */
function buildAstroFrontmatter({ title, description, pubDate, featured, tags }) {
	const lines = ['---'];
	lines.push(`title: "${title.replace(/"/g, '\\"')}"`);
	if (description) {
		lines.push(`description: "${description.replace(/"/g, '\\"')}"`);
	}
	lines.push(`pubDate: ${pubDate}`);
	lines.push(`featured: ${featured}`);
	if (tags && tags.length > 0) {
		const formatted = tags.map((t) => `"${capitalizeTag(t)}"`).join(', ');
		lines.push(`tags: [${formatted}]`);
	}
	lines.push('---');
	return lines.join('\n');
}

// --- Main ---

// Remove the stub placeholder
const stubPath = join(TARGET_DIR, 'logocentric-architecture.md');
if (existsSync(stubPath)) {
	rmSync(stubPath);
	console.log('Removed stub: logocentric-architecture.md');
}

const sourceFiles = readdirSync(SOURCE_DIR).filter((f) => f.endsWith('.md'));
let imported = 0;

for (const file of sourceFiles) {
	const content = readFileSync(join(SOURCE_DIR, file), 'utf-8');
	const { frontmatter: fm, body } = parseFrontmatter(content);

	const title = fm.title || '';
	const description = fm.excerpt || '';
	const pubDate = fm.date || '';
	const featured = fm.portfolio_relevance === 'CRITICAL';
	const tags = Array.isArray(fm.tags) ? fm.tags : [];

	const astroFrontmatter = buildAstroFrontmatter({
		title,
		description,
		pubDate,
		featured,
		tags,
	});

	const targetFilename = stripDatePrefix(file);
	const output = `${astroFrontmatter}\n${body}`;

	writeFileSync(join(TARGET_DIR, targetFilename), output, 'utf-8');
	imported++;
	console.log(`  ${file} → ${targetFilename}${featured ? ' [FEATURED]' : ''}`);
}

console.log(`\nImported ${imported} essays to src/content/logos/`);
