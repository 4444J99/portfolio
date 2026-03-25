# Shibui Phase 2: Content Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the extraction, distillation, annotation, and validation scripts for generating entry-level content from 21 project pages.

**Architecture:** Four Node.js scripts (.mjs) that operate on .astro files and produce sidecar YAML in src/data/shibui/projects/. Extraction is deterministic parsing. Distillation and annotation use gemini CLI with [DRAFT] fallback. Validation runs in the build chain.

**Tech Stack:** Node.js (ESM), yaml package, gemini CLI, vitest for validation tests.

**Spec:** `docs/superpowers/specs/2026-03-24-shibui-phase-2-content-pipeline-design.md`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `scripts/shibui-extract.mjs` | Parse .astro → YAML with section structure |
| Create | `scripts/shibui-distill.mjs` | Generate entry text via gemini CLI |
| Create | `scripts/shibui-annotate.mjs` | Generate term annotations via gemini CLI |
| Create | `scripts/shibui-validate.mjs` | Schema validation for shibui YAML |
| Create | `src/data/shibui/projects/` | Output directory for YAML files |
| Create | `src/data/__tests__/shibui-content.test.ts` | Data integrity tests for shibui YAML |
| Modify | `package.json` | Add npm scripts for shibui pipeline |

---

## Task 1: shibui:extract Script

**Files:**
- Create: `scripts/shibui-extract.mjs`
- Create: `src/data/shibui/projects/` (directory)

Parses each .astro project page, extracts section structure, outputs YAML.

- [ ] **Step 1: Create the extraction script**

```javascript
// scripts/shibui-extract.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECTS_DIR = path.join(__dirname, '../src/pages/projects');
const OUTPUT_DIR = path.join(__dirname, '../src/data/shibui/projects');

/** Strip HTML/Astro tags from text, preserving inner text content. */
function stripTags(html) {
	return html
		.replace(/<Cite[^>]*\/>/g, '')  // Remove self-closing Cite tags
		.replace(/<ShibuiTerm[^>]*term="([^"]*)"[^>]*\/>/g, '$1')  // Keep ShibuiTerm text
		.replace(/<abbr[^>]*>([^<]*)<\/abbr>/g, '$1')  // Keep abbr text
		.replace(/<[^>]+>/g, '')  // Strip all remaining tags
		.replace(/\{[^}]+\}/g, '[dynamic]')  // Mark template expressions
		.replace(/&[a-z]+;/g, ' ')  // Replace HTML entities
		.replace(/\s+/g, ' ')  // Collapse whitespace
		.trim();
}

/** Extract sections (h2 headings + paragraphs) from .astro content. */
function extractSections(content) {
	// Get content after the frontmatter closing ---
	const fmEnd = content.indexOf('---', content.indexOf('---') + 3);
	const body = content.slice(fmEnd + 3);

	const sections = [];
	let currentSection = null;
	let pIndex = 0;

	// Split by lines and process
	const lines = body.split('\n');
	let inParagraph = false;
	let paragraphBuffer = '';

	for (const line of lines) {
		const h2Match = line.match(/<h2[^>]*>(.*?)<\/h2>/);
		const h3Match = line.match(/<h3[^>]*>(.*?)<\/h3>/);

		if (h2Match) {
			// Flush current paragraph
			if (inParagraph && paragraphBuffer.trim()) {
				const text = stripTags(paragraphBuffer);
				if (text.length > 30 && currentSection) {
					pIndex++;
					currentSection.units.push({
						id: `p${pIndex}`,
						elevated_preview: text.slice(0, 80) + (text.length > 80 ? '...' : ''),
						entry: '',
					});
				}
				paragraphBuffer = '';
				inParagraph = false;
			}

			const heading = stripTags(h2Match[1]);
			currentSection = { heading, units: [] };
			sections.push(currentSection);
			pIndex = 0;
			continue;
		}

		// Track paragraph content
		if (line.includes('<p>') || line.includes('<p ')) {
			inParagraph = true;
			paragraphBuffer = line;
		} else if (inParagraph) {
			paragraphBuffer += '\n' + line;
			if (line.includes('</p>')) {
				const text = stripTags(paragraphBuffer);
				if (text.length > 30 && currentSection) {
					pIndex++;
					currentSection.units.push({
						id: `p${pIndex}`,
						elevated_preview: text.slice(0, 80) + (text.length > 80 ? '...' : ''),
						entry: '',
					});
				}
				paragraphBuffer = '';
				inParagraph = false;
			}
		}
	}

	return sections;
}

/** Extract ProjectLayout props from frontmatter area. */
function extractMetadata(content) {
	const titleMatch = content.match(/title="([^"]+)"/);
	const taglineMatch = content.match(/tagline="([^"]+)"/);
	return {
		title: titleMatch ? titleMatch[1] : '',
		tagline: taglineMatch ? taglineMatch[1] : '',
	};
}

// --- Main ---
function main() {
	// Ensure output directory exists
	fs.mkdirSync(OUTPUT_DIR, { recursive: true });

	const files = fs.readdirSync(PROJECTS_DIR)
		.filter(f => f.endsWith('.astro'))
		.sort();

	let created = 0;
	let skipped = 0;

	for (const file of files) {
		const slug = file.replace('.astro', '');
		const outPath = path.join(OUTPUT_DIR, `${slug}.yaml`);

		// Skip if YAML already exists (don't overwrite human edits)
		if (fs.existsSync(outPath)) {
			console.log(`⏭️  ${slug} — YAML exists, skipping`);
			skipped++;
			continue;
		}

		const content = fs.readFileSync(path.join(PROJECTS_DIR, file), 'utf-8');
		const metadata = extractMetadata(content);
		const sections = extractSections(content);

		// Build YAML manually (no dependency needed for simple structure)
		let yaml = `# Shibui content — ${slug}\n`;
		yaml += `# Generated by shibui:extract. Edit entry text, then remove [DRAFT] markers.\n`;
		yaml += `page: projects/${slug}\n`;
		yaml += `title: "${metadata.title.replace(/"/g, '\\"')}"\n`;
		yaml += `tagline: "${metadata.tagline.replace(/"/g, '\\"')}"\n`;
		yaml += `sections:\n`;

		for (const section of sections) {
			yaml += `  - heading: "${section.heading.replace(/"/g, '\\"')}"\n`;
			yaml += `    units:\n`;
			for (const unit of section.units) {
				const headingSlug = section.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
				yaml += `      - id: "${slug}.${headingSlug}.${unit.id}"\n`;
				yaml += `        elevated_preview: "${unit.elevated_preview.replace(/"/g, '\\"')}"\n`;
				yaml += `        entry: "[DRAFT]"\n`;
			}
		}

		fs.writeFileSync(outPath, yaml, 'utf-8');
		console.log(`✅ ${slug} — ${sections.length} sections, ${sections.reduce((n, s) => n + s.units.length, 0)} units`);
		created++;
	}

	console.log(`\n📊 Done: ${created} created, ${skipped} skipped`);
}

main();
```

- [ ] **Step 2: Create output directory and add npm script**

```bash
mkdir -p src/data/shibui/projects
```

Add to package.json scripts:
```json
"shibui:extract": "node scripts/shibui-extract.mjs"
```

- [ ] **Step 3: Run extraction**

```bash
npm run shibui:extract
```

Expected: 21 YAML files created in `src/data/shibui/projects/`, each with sections and [DRAFT] entry fields.

- [ ] **Step 4: Verify output**

Spot-check 2-3 YAML files. Verify section headings match the actual project pages. Verify elevated_preview text is sensible.

- [ ] **Step 5: Commit**

```bash
git add scripts/shibui-extract.mjs src/data/shibui/projects/ package.json
git commit -m "feat(shibui): add shibui:extract script — parse 21 project pages into YAML"
```

---

## Task 2: shibui:distill Script

**Files:**
- Create: `scripts/shibui-distill.mjs`

Reads YAML files, generates entry text via gemini CLI.

- [ ] **Step 1: Create the distillation script**

```javascript
// scripts/shibui-distill.mjs
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHIBUI_DIR = path.join(__dirname, '../src/data/shibui/projects');

const SYSTEM_PROMPT = `You are simplifying portfolio content for a general audience.

RULES (Law 1 — Conservation of Meaning):
- Preserve ALL factual claims (numbers, outcomes, what was built)
- Preserve proper nouns (project names, technologies)
- NEVER add information not present in the source text
- Replace domain-specific jargon with plain language
- Write in first person if the source uses first person
- Use active voice and concrete verbs
- Keep the conversational tone of a portfolio, not a technical summary
- Target 40-60% length reduction
- Output ONLY the simplified text, no commentary

EXAMPLES:
Source: "Shneiderman's framework proposes a third path: systems that amplify human capability rather than replacing it."
Output: "There's a third approach: systems where AI amplifies what humans can do instead of replacing them."

Source: "The conductor model formalizes this at industrial scale."
Output: "This method scales that principle to production-level work."`;

function cleanGeminiOutput(output) {
	return output
		.replace(/\u001b\[[0-9;]*m/g, '')
		.split('\n')
		.map(l => l.trim())
		.filter(l => l.length > 0)
		.filter(l =>
			!l.startsWith('Loading ') &&
			!l.startsWith('Server ') &&
			!l.startsWith('Tools ') &&
			!l.startsWith('Loaded ') &&
			!l.includes('tool update notification')
		)
		.join(' ')
		.trim();
}

function distill(elevatedText) {
	const prompt = `${SYSTEM_PROMPT}\n\nSimplify this text:\n"${elevatedText}"`;

	try {
		const escaped = prompt.replace(/"/g, '\\"').replace(/`/g, '\\`');
		const output = execSync(`gemini -p "${escaped}" 2>/dev/null`, {
			encoding: 'utf8',
			timeout: 30000,
		});
		const clean = cleanGeminiOutput(output);
		return clean || '[DRAFT]';
	} catch {
		return '[DRAFT]';
	}
}

function sleep(ms) {
	return new Promise(r => setTimeout(r, ms));
}

async function main() {
	const files = fs.readdirSync(SHIBUI_DIR)
		.filter(f => f.endsWith('.yaml'))
		.sort();

	let total = 0;
	let distilled = 0;
	let skipped = 0;

	for (const file of files) {
		const filePath = path.join(SHIBUI_DIR, file);
		let content = fs.readFileSync(filePath, 'utf-8');

		// Find all entry: "[DRAFT]" lines and their preceding elevated_preview
		const lines = content.split('\n');
		let modified = false;

		for (let i = 0; i < lines.length; i++) {
			if (lines[i].trim() === 'entry: "[DRAFT]"') {
				// Find the elevated_preview above
				const previewLine = lines[i - 1];
				const previewMatch = previewLine?.match(/elevated_preview:\s*"(.+)"/);

				if (previewMatch) {
					total++;
					const preview = previewMatch[1];
					console.log(`🧠 Distilling: ${preview.slice(0, 60)}...`);

					const entry = distill(preview);
					lines[i] = `        entry: "${entry.replace(/"/g, '\\"')}"`;
					modified = true;
					distilled++;

					// Rate limit
					await sleep(2000);
				}
			} else if (lines[i].trim().startsWith('entry:') && !lines[i].includes('[DRAFT]')) {
				skipped++;
			}
		}

		if (modified) {
			fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
			console.log(`💾 Saved ${file}`);
		}
	}

	console.log(`\n📊 Done: ${distilled} distilled, ${skipped} already done, ${total} total`);
}

main();
```

- [ ] **Step 2: Add npm script**

```json
"shibui:distill": "node scripts/shibui-distill.mjs"
```

- [ ] **Step 3: Test with one file**

Copy one YAML to test. Run distill. Verify output is sensible entry text.

- [ ] **Step 4: Commit**

```bash
git add scripts/shibui-distill.mjs package.json
git commit -m "feat(shibui): add shibui:distill script — AI-generated entry text via gemini CLI"
```

---

## Task 3: shibui:annotate Script

**Files:**
- Create: `scripts/shibui-annotate.mjs`

Identifies domain-specific terms and generates definitions.

- [ ] **Step 1: Create the annotation script**

```javascript
// scripts/shibui-annotate.mjs
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHIBUI_DIR = path.join(__dirname, '../src/data/shibui/projects');

const PROMPT_TEMPLATE = `Identify 2-4 domain-specific terms in this text that a non-expert would not understand. For each, provide a one-sentence plain-language definition.

Text: "{TEXT}"

Output format (YAML, one per line):
- term: "the term"
  definition: "plain-language definition"

Only output the YAML list. No commentary.`;

function cleanGeminiOutput(output) {
	return output
		.replace(/\u001b\[[0-9;]*m/g, '')
		.split('\n')
		.filter(l => l.trim().length > 0)
		.filter(l =>
			!l.startsWith('Loading ') &&
			!l.startsWith('Server ') &&
			!l.startsWith('Tools ') &&
			!l.startsWith('Loaded ') &&
			!l.includes('tool update notification')
		)
		.join('\n')
		.trim();
}

function annotate(text) {
	const prompt = PROMPT_TEMPLATE.replace('{TEXT}', text);
	try {
		const escaped = prompt.replace(/"/g, '\\"').replace(/`/g, '\\`');
		const output = execSync(`gemini -p "${escaped}" 2>/dev/null`, {
			encoding: 'utf8',
			timeout: 30000,
		});
		return cleanGeminiOutput(output);
	} catch {
		return '';
	}
}

function sleep(ms) {
	return new Promise(r => setTimeout(r, ms));
}

async function main() {
	const files = fs.readdirSync(SHIBUI_DIR)
		.filter(f => f.endsWith('.yaml'))
		.sort();

	let annotated = 0;

	for (const file of files) {
		const filePath = path.join(SHIBUI_DIR, file);
		let content = fs.readFileSync(filePath, 'utf-8');

		// Skip files that already have annotations
		if (content.includes('annotations:')) {
			console.log(`⏭️  ${file} — already annotated`);
			continue;
		}

		// Find elevated_preview lines to annotate
		const previews = [];
		const lines = content.split('\n');
		for (const line of lines) {
			const match = line.match(/elevated_preview:\s*"(.+)"/);
			if (match) previews.push(match[1]);
		}

		if (previews.length === 0) continue;

		// Combine all previews for context
		const combined = previews.join(' ');
		console.log(`🔍 Annotating ${file}...`);
		const result = annotate(combined);

		if (result) {
			// Append annotations section to file
			content += `\nannotations:\n${result}\n`;
			fs.writeFileSync(filePath, content, 'utf-8');
			annotated++;
		}

		await sleep(2000);
	}

	console.log(`\n📊 Done: ${annotated} files annotated`);
}

main();
```

- [ ] **Step 2: Add npm script**

```json
"shibui:annotate": "node scripts/shibui-annotate.mjs"
```

- [ ] **Step 3: Commit**

```bash
git add scripts/shibui-annotate.mjs package.json
git commit -m "feat(shibui): add shibui:annotate script — AI-generated term definitions"
```

---

## Task 4: shibui:validate Script + Data Integrity Tests

**Files:**
- Create: `scripts/shibui-validate.mjs`
- Create: `src/data/__tests__/shibui-content.test.ts`
- Modify: `package.json` (build chain)

- [ ] **Step 1: Create validation script**

```javascript
// scripts/shibui-validate.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHIBUI_DIR = path.join(__dirname, '../src/data/shibui/projects');

function main() {
	if (!fs.existsSync(SHIBUI_DIR)) {
		console.log('ℹ️  No shibui data directory — skipping validation');
		process.exit(0);
	}

	const files = fs.readdirSync(SHIBUI_DIR).filter(f => f.endsWith('.yaml'));
	if (files.length === 0) {
		console.log('ℹ️  No shibui YAML files — skipping validation');
		process.exit(0);
	}

	let errors = 0;
	const allIds = new Set();

	for (const file of files) {
		const content = fs.readFileSync(path.join(SHIBUI_DIR, file), 'utf-8');

		// Check for [DRAFT] markers
		if (content.includes('[DRAFT]')) {
			console.error(`❌ ${file}: contains [DRAFT] marker — entry text not yet reviewed`);
			errors++;
		}

		// Check for [REVIEW] markers
		if (content.includes('[REVIEW]')) {
			console.error(`❌ ${file}: contains [REVIEW] marker — needs human review`);
			errors++;
		}

		// Check for duplicate IDs
		const idMatches = content.matchAll(/id:\s*"([^"]+)"/g);
		for (const match of idMatches) {
			const id = match[1];
			if (allIds.has(id)) {
				console.error(`❌ ${file}: duplicate unit ID "${id}"`);
				errors++;
			}
			allIds.add(id);
		}

		// Check required fields
		if (!content.includes('page:')) {
			console.error(`❌ ${file}: missing 'page' field`);
			errors++;
		}
		if (!content.includes('title:')) {
			console.error(`❌ ${file}: missing 'title' field`);
			errors++;
		}
	}

	if (errors > 0) {
		console.error(`\n💥 ${errors} validation errors found`);
		process.exit(1);
	}

	console.log(`✅ ${files.length} shibui YAML files validated`);
}

main();
```

- [ ] **Step 2: Create data integrity tests**

```typescript
// src/data/__tests__/shibui-content.test.ts
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const shibuiDir = resolve(__dirname, '../shibui/projects');

describe('shibui content integrity', () => {
	it('shibui directory exists', () => {
		expect(existsSync(shibuiDir)).toBe(true);
	});

	// Only run content tests if YAML files exist
	const files = existsSync(shibuiDir)
		? readdirSync(shibuiDir).filter(f => f.endsWith('.yaml'))
		: [];

	if (files.length > 0) {
		it('no YAML files contain [DRAFT] markers', () => {
			const drafts = files.filter(f => {
				const content = readFileSync(resolve(shibuiDir, f), 'utf-8');
				return content.includes('[DRAFT]');
			});
			expect(drafts).toEqual([]);
		});

		it('no YAML files contain [REVIEW] markers', () => {
			const reviews = files.filter(f => {
				const content = readFileSync(resolve(shibuiDir, f), 'utf-8');
				return content.includes('[REVIEW]');
			});
			expect(reviews).toEqual([]);
		});

		it('all YAML files have required fields', () => {
			const missing = files.filter(f => {
				const content = readFileSync(resolve(shibuiDir, f), 'utf-8');
				return !content.includes('page:') || !content.includes('title:');
			});
			expect(missing).toEqual([]);
		});

		it('unit IDs are globally unique', () => {
			const allIds = new Set();
			const dupes: string[] = [];
			for (const f of files) {
				const content = readFileSync(resolve(shibuiDir, f), 'utf-8');
				const ids = [...content.matchAll(/id:\s*"([^"]+)"/g)].map(m => m[1]);
				for (const id of ids) {
					if (allIds.has(id)) dupes.push(id);
					allIds.add(id);
				}
			}
			expect(dupes).toEqual([]);
		});
	}
});
```

- [ ] **Step 3: Add npm scripts and build chain integration**

Add to package.json scripts:
```json
"shibui:validate": "node scripts/shibui-validate.mjs"
```

Update the build script to include validation (add before astro build).

- [ ] **Step 4: Run tests**

```bash
npm run test
```

- [ ] **Step 5: Commit**

```bash
git add scripts/shibui-validate.mjs src/data/__tests__/shibui-content.test.ts package.json
git commit -m "feat(shibui): add shibui:validate script and data integrity tests"
```

---

## Task 5: Run Pipeline + Commit Generated YAML

- [ ] **Step 1: Run extraction on all 21 project pages**

```bash
npm run shibui:extract
```

- [ ] **Step 2: Run distillation (if gemini CLI available)**

```bash
npm run shibui:distill
```

If gemini is unavailable, YAML files will have [DRAFT] markers — that's expected. Human review happens separately.

- [ ] **Step 3: Run annotation (if gemini CLI available)**

```bash
npm run shibui:annotate
```

- [ ] **Step 4: Commit generated YAML (even with DRAFTs)**

```bash
git add src/data/shibui/projects/
git commit -m "feat(shibui): generate shibui YAML for 21 project pages (entry text pending review)"
```

---

## Task 6: Integration Verification

- [ ] **Step 1: Run validation**

```bash
npm run shibui:validate
```

Note: will report errors if [DRAFT] markers present — expected until human review.

- [ ] **Step 2: Run full test suite**

```bash
npm run test
```

- [ ] **Step 3: Run build**

```bash
npm run build
```

- [ ] **Step 4: Push**

```bash
git push origin main
```
