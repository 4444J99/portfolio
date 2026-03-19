#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * ATS (Applicant Tracking System) readability audit for resume files.
 *
 * Performs file-level checks on generated PDFs (size, naming) and analyses
 * resume HTML pages for semantic structure that translates well to ATS parsing.
 * Lightweight — no PDF parsing dependencies.
 *
 * Outputs:
 *   .quality/ats-audit-summary.json   — machine-readable audit report
 *   stdout                            — human-readable checklist + file results
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

/** PDF search candidates — ordered by preference */
const PDF_SEARCH_DIRS = [
	join(ROOT, 'public/resume'),
	join(ROOT, 'public/resumes'),
	join(ROOT, 'dist/resume'),
	join(ROOT, 'dist/resumes'),
];

const OUTPUT_PATH = resolve(ROOT, '.quality/ats-audit-summary.json');

/** 2 MB — ATS systems commonly reject larger files */
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

/** Characters that cause issues in ATS filename parsing */
const PROBLEMATIC_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1F]/;

/**
 * ATS manual verification checklist.
 * These items cannot be checked programmatically without heavy PDF parsing
 * dependencies, so they are surfaced as a human-review checklist.
 */
const ATS_MANUAL_CHECKLIST = [
	'PDF opens in a plain text viewer (content is not image-only)',
	'Section headings use ATS-standard names: Experience, Education, Skills, Projects',
	'No multi-column layout (single column flows better through ATS parsers)',
	'No tables used for content layout (use plain lists instead)',
	'Contact info is plain text — not embedded in a PDF header/footer field',
	'Dates are in a standard format: MM/YYYY or Month YYYY',
	'No logos or decorative images embedded in the PDF',
	'Font is standard (Arial, Calibri, Times New Roman, or similar — not decorative)',
	'File was generated with text layer enabled (tagged PDF, not scanned image)',
];

/**
 * ATS-friendly section heading keywords to look for in HTML resume pages.
 * Presence of these as h2/h3 text content is a positive signal.
 */
const ATS_SECTION_KEYWORDS = [
	'experience',
	'education',
	'skills',
	'projects',
	'summary',
	'certifications',
	'history',
	'work',
	'employment',
	'technical',
	'professional',
];

// ---------------------------------------------------------------------------
// PDF file auditing
// ---------------------------------------------------------------------------

/**
 * Find the first PDF search directory that exists and contains PDF files.
 * @returns {{ dir: string, files: string[] } | null}
 */
function findPdfDirectory() {
	for (const dir of PDF_SEARCH_DIRS) {
		if (!existsSync(dir)) continue;
		const files = readdirSync(dir).filter((f) => extname(f).toLowerCase() === '.pdf');
		if (files.length > 0) return { dir, files };
	}
	return null;
}

/**
 * @typedef {{
 *   file: string,
 *   path: string,
 *   sizeBytes: number,
 *   sizeMB: number,
 *   status: 'pass' | 'fail',
 *   issues: string[],
 * }} PdfAuditResult
 */

/**
 * Audit a single PDF file for ATS-related file-level concerns.
 * @param {string} dir
 * @param {string} filename
 * @returns {PdfAuditResult}
 */
function auditPdfFile(dir, filename) {
	const filePath = join(dir, filename);
	const issues = [];

	const stat = statSync(filePath);
	const sizeBytes = stat.size;
	const sizeMB = sizeBytes / (1024 * 1024);

	// Check 1: File must be non-empty
	if (sizeBytes === 0) {
		issues.push('File is empty (0 bytes)');
	}

	// Check 2: File size must be within ATS limits
	if (sizeBytes > MAX_FILE_SIZE_BYTES) {
		issues.push(
			`File too large for many ATS systems: ${sizeMB.toFixed(2)} MB (limit: ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB)`,
		);
	}

	// Check 3: Filename must not contain characters that break ATS parsers
	if (PROBLEMATIC_FILENAME_CHARS.test(filename)) {
		issues.push(`Filename contains characters that may break ATS parsers: "${filename}"`);
	}

	return {
		file: filename,
		path: filePath,
		sizeBytes,
		sizeMB: Number(sizeMB.toFixed(3)),
		status: issues.length === 0 ? 'pass' : 'fail',
		issues,
	};
}

// ---------------------------------------------------------------------------
// HTML resume page semantic analysis
// ---------------------------------------------------------------------------

/**
 * @typedef {{
 *   file: string,
 *   hasH1: boolean,
 *   h2Headings: string[],
 *   h3Headings: string[],
 *   sectionCount: number,
 *   articleTag: boolean,
 *   atsKeywordsFound: string[],
 *   atsKeywordsMissing: string[],
 *   status: 'pass' | 'warn' | 'fail',
 *   notes: string[],
 * }} HtmlAuditResult
 */

/**
 * Extract text content from a simple HTML tag match (no DOM parser needed).
 * Returns an array of trimmed inner text strings for all matching tags.
 * @param {string} html
 * @param {string} tag — e.g. 'h1', 'h2'
 * @returns {string[]}
 */
function extractTagText(html, tag) {
	const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
	const results = [];
	let match;
	while ((match = pattern.exec(html)) !== null) {
		// Strip inner tags and normalise whitespace
		const text = match[1]
			.replace(/<[^>]+>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
		if (text) results.push(text);
	}
	return results;
}

/**
 * Count occurrences of a specific HTML tag in source.
 * @param {string} html
 * @param {string} tag
 * @returns {number}
 */
function countTag(html, tag) {
	const pattern = new RegExp(`<${tag}[\\s>]`, 'gi');
	return (html.match(pattern) ?? []).length;
}

/**
 * Audit an Astro resume page source file for semantic structure.
 * @param {string} filePath
 * @returns {HtmlAuditResult}
 */
function auditHtmlPage(filePath) {
	const notes = [];
	const source = readFileSync(filePath, 'utf-8');
	const relPath = filePath.replace(ROOT + '/', '');

	const h1Headings = extractTagText(source, 'h1');
	const h2Headings = extractTagText(source, 'h2');
	const h3Headings = extractTagText(source, 'h3');
	const sectionCount = countTag(source, 'section');
	const articleTag = /<article[\s>]/i.test(source);
	const hasH1 = h1Headings.length > 0;

	// Combine all heading text for keyword matching (lowercased)
	const allHeadingText = [...h1Headings, ...h2Headings, ...h3Headings]
		.map((t) => t.toLowerCase())
		.join(' ');

	const atsKeywordsFound = ATS_SECTION_KEYWORDS.filter((kw) => allHeadingText.includes(kw));
	const atsKeywordsMissing = ATS_SECTION_KEYWORDS.filter((kw) => !allHeadingText.includes(kw));

	// Semantic notes
	if (!hasH1) notes.push('No <h1> found — ATS expects a clear candidate name at h1');
	if (h2Headings.length === 0) notes.push('No <h2> section headings found');
	if (sectionCount === 0) notes.push('No <section> elements — consider wrapping resume sections');
	if (!articleTag)
		notes.push('No <article> element — wrapping resume content in <article> aids ATS');
	if (atsKeywordsFound.length < 3)
		notes.push(
			`Only ${atsKeywordsFound.length} ATS section keywords found in headings — consider aligning to standard names`,
		);

	let status = 'pass';
	if (!hasH1 || h2Headings.length === 0) status = 'fail';
	else if (notes.length > 0) status = 'warn';

	return {
		file: relPath,
		hasH1,
		h2Headings,
		h3Headings,
		sectionCount,
		articleTag,
		atsKeywordsFound,
		atsKeywordsMissing,
		status,
		notes,
	};
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const pdfDir = findPdfDirectory();
const pdfResults = [];

if (pdfDir === null) {
	console.warn(
		'[ats-audit] No PDF resume directory found. Searched:\n  ' + PDF_SEARCH_DIRS.join('\n  '),
	);
	console.warn('[ats-audit] Run `npm run generate:resumes` first to produce PDF files.\n');
} else {
	console.log(`\nATS Resume Audit — PDF Files`);
	console.log(`Directory: ${pdfDir.dir}`);
	console.log(`Found ${pdfDir.files.length} PDF file(s)\n`);

	for (const filename of pdfDir.files.sort()) {
		const result = auditPdfFile(pdfDir.dir, filename);
		pdfResults.push(result);

		const icon = result.status === 'pass' ? '[PASS]' : '[FAIL]';
		console.log(`  ${icon}  ${result.file}  (${result.sizeMB} MB)`);
		for (const issue of result.issues) {
			console.log(`         Issue: ${issue}`);
		}
	}
}

// HTML page audit
const resumePageDir = join(ROOT, 'src/pages/resume');
const htmlResults = [];

if (existsSync(resumePageDir)) {
	const pageFiles = readdirSync(resumePageDir).filter(
		(f) => f.endsWith('.astro') || f.endsWith('.html'),
	);

	console.log(`\nATS Resume Audit — HTML Page Semantic Structure`);
	console.log(`Directory: ${resumePageDir}`);
	console.log(`Found ${pageFiles.length} resume page(s)\n`);

	for (const filename of pageFiles.sort()) {
		const result = auditHtmlPage(join(resumePageDir, filename));
		htmlResults.push(result);

		const icon =
			result.status === 'pass' ? '[PASS]' : result.status === 'warn' ? '[WARN]' : '[FAIL]';
		console.log(`  ${icon}  ${filename}`);
		console.log(
			`         h1: ${result.hasH1 ? (result.h1Headings?.[0] ?? 'yes') : 'none'}  |  h2 count: ${result.h2Headings.length}  |  sections: ${result.sectionCount}`,
		);
		console.log(
			`         ATS keywords in headings: ${result.atsKeywordsFound.length > 0 ? result.atsKeywordsFound.join(', ') : 'none'}`,
		);
		for (const note of result.notes) {
			console.log(`         Note: ${note}`);
		}
	}
}

// Manual checklist
console.log('\nATS Resume Audit Checklist (manual verification required):');
for (const item of ATS_MANUAL_CHECKLIST) {
	console.log(`  - [ ] ${item}`);
}

// Build summary
const pdfPassed = pdfResults.filter((r) => r.status === 'pass').length;
const pdfFailed = pdfResults.filter((r) => r.status === 'fail').length;
const htmlPassed = htmlResults.filter((r) => r.status === 'pass').length;
const htmlWarned = htmlResults.filter((r) => r.status === 'warn').length;
const htmlFailed = htmlResults.filter((r) => r.status === 'fail').length;

const overallStatus =
	pdfFailed === 0 && htmlFailed === 0 ? (htmlWarned === 0 ? 'pass' : 'warn') : 'fail';

const summary = {
	generated: new Date().toISOString(),
	status: overallStatus,
	pdf: {
		directory: pdfDir?.dir ?? null,
		total: pdfResults.length,
		passed: pdfPassed,
		failed: pdfFailed,
		maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
		results: pdfResults,
	},
	htmlPages: {
		directory: resumePageDir,
		total: htmlResults.length,
		passed: htmlPassed,
		warned: htmlWarned,
		failed: htmlFailed,
		results: htmlResults,
	},
	manualChecklist: ATS_MANUAL_CHECKLIST,
};

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, JSON.stringify(summary, null, 2) + '\n');

console.log(`\nATS Audit Summary`);
console.log(`  PDFs    — ${pdfPassed} passed, ${pdfFailed} failed (of ${pdfResults.length} files)`);
console.log(
	`  HTML    — ${htmlPassed} passed, ${htmlWarned} warned, ${htmlFailed} failed (of ${htmlResults.length} pages)`,
);
console.log(`  Status  — ${overallStatus.toUpperCase()}`);
console.log(`  Report  — ${OUTPUT_PATH}\n`);
