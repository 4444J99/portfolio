#!/usr/bin/env node
// scripts/shibui-build-vocab.mjs
// Phase 1 of the Shibui Lens: Build domain vocabulary via TF-IDF.
// Reads all essays + project pages, extracts terms, computes IDF scores.
// Seeds definitions from existing ShibuiTerm annotations.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const __dirname =
	import.meta.dirname ?? import.meta.url.replace('file://', '').replace(/\/[^/]+$/, '');
const ROOT = resolve(__dirname, '..');
const PROJECTS_DIR = join(ROOT, 'src/pages/projects');
const ESSAYS_DIR = join(ROOT, 'src/content/logos');
const PAGES_DIR = join(ROOT, 'src/pages');
const OUTPUT = join(ROOT, 'src/data/shibui/vocabulary.json');

// ─── Stopwords ────────────────────────────────────────────────────────────────
const STOPWORDS = new Set([
	'a',
	'an',
	'the',
	'and',
	'or',
	'but',
	'in',
	'on',
	'at',
	'to',
	'for',
	'of',
	'with',
	'by',
	'from',
	'is',
	'are',
	'was',
	'were',
	'be',
	'been',
	'being',
	'have',
	'has',
	'had',
	'do',
	'does',
	'did',
	'will',
	'would',
	'could',
	'should',
	'may',
	'might',
	'can',
	'shall',
	'it',
	'its',
	'this',
	'that',
	'these',
	'those',
	'i',
	'me',
	'my',
	'we',
	'our',
	'you',
	'your',
	'he',
	'she',
	'they',
	'them',
	'his',
	'her',
	'their',
	'not',
	'no',
	'nor',
	'so',
	'if',
	'then',
	'than',
	'as',
	'up',
	'out',
	'about',
	'into',
	'over',
	'after',
	'before',
	'between',
	'under',
	'above',
	'each',
	'every',
	'all',
	'both',
	'few',
	'more',
	'most',
	'other',
	'some',
	'such',
	'only',
	'own',
	'same',
	'too',
	'very',
	'just',
	'also',
	'now',
	'here',
	'there',
	'when',
	'where',
	'how',
	'what',
	'which',
	'who',
	'whom',
	'why',
	'because',
	'while',
	'during',
	'through',
	'although',
	'however',
	'since',
	'until',
	'unless',
	'whether',
	'yet',
	'still',
	'even',
	'much',
	'many',
	'well',
	'back',
	'like',
	'get',
	'got',
	'make',
	'made',
	'take',
	'give',
	'go',
	'come',
	'see',
	'know',
	'think',
	'say',
	'tell',
	'use',
	'used',
	'using',
	'new',
	'one',
	'two',
	'first',
	'last',
	'long',
	'great',
	'little',
	'right',
	'old',
	'big',
	'high',
	'small',
	'large',
	'next',
	'early',
	'young',
	'important',
	'public',
	'bad',
	'good',
	'best',
	'better',
	'sure',
	'rather',
	'already',
	'perhaps',
	'never',
	'always',
	'often',
	'sometimes',
	'without',
	'within',
	'across',
	'against',
	'along',
	'though',
	'among',
	'per',
	'need',
	'needs',
	'want',
	'work',
	'way',
	'thing',
	'things',
	'system',
	'systems',
	'project',
	'projects',
	'code',
]);

// ─── Text extraction ──────────────────────────────────────────────────────────

/** Strip HTML/Astro/MDX tags, extract prose text. */
function extractText(source) {
	let text = source;
	// Remove frontmatter
	text = text.replace(/^---[\s\S]*?---/m, '');
	// Remove import statements
	text = text.replace(/^import\s+.*$/gm, '');
	// Remove JSX/Astro component tags (self-closing and paired)
	text = text.replace(/<[A-Z][^>]*\/>/g, '');
	text = text.replace(/<[A-Z][^>]*>[\s\S]*?<\/[A-Z][^>]*>/g, '');
	// Remove HTML tags but keep text
	text = text.replace(/<[^>]+>/g, ' ');
	// Remove code blocks
	text = text.replace(/```[\s\S]*?```/g, '');
	text = text.replace(/`[^`]+`/g, '');
	// Remove template expressions
	text = text.replace(/\{[^}]*\}/g, ' ');
	// Remove markdown syntax
	text = text.replace(/[#*_~[\]()]/g, ' ');
	// Collapse whitespace
	text = text.replace(/\s+/g, ' ').trim();
	return text;
}

/** Tokenize text into lowercase word tokens, filtering stopwords. */
function tokenize(text) {
	return text
		.toLowerCase()
		.split(/[^a-z'-]+/)
		.filter((w) => w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
}

// ─── TF-IDF ───────────────────────────────────────────────────────────────────

/**
 * Compute TF-IDF across a corpus of documents.
 * @param {Map<string, string[]>} corpus - docId → tokens
 * @returns {Map<string, { idf: number, docs: number }>} - term → { idf, docs }
 */
function computeIdf(corpus) {
	const docCount = corpus.size;
	const docFreq = new Map(); // term → number of docs containing it

	for (const tokens of corpus.values()) {
		const unique = new Set(tokens);
		for (const term of unique) {
			docFreq.set(term, (docFreq.get(term) || 0) + 1);
		}
	}

	const idf = new Map();
	for (const [term, df] of docFreq) {
		// Only include terms that appear in at least 2 docs (not typos)
		// and in fewer than 60% of docs (not generic)
		if (df >= 2 && df / docCount < 0.6) {
			idf.set(term, {
				idf: Math.log(docCount / df),
				docs: df,
			});
		}
	}
	return idf;
}

/**
 * For each document, compute top N terms by TF-IDF weight.
 * @returns {Map<string, Array<{term: string, weight: number}>>}
 */
function topTermsPerDoc(corpus, idfMap, n = 10) {
	const result = new Map();
	for (const [docId, tokens] of corpus) {
		const tf = new Map();
		for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
		const maxTf = Math.max(...tf.values(), 1);

		const scored = [];
		for (const [term, count] of tf) {
			const idfEntry = idfMap.get(term);
			if (idfEntry) {
				scored.push({ term, weight: (count / maxTf) * idfEntry.idf });
			}
		}
		scored.sort((a, b) => b.weight - a.weight);
		result.set(
			docId,
			scored.slice(0, n).map((s) => ({ term: s.term, weight: Math.round(s.weight * 100) / 100 })),
		);
	}
	return result;
}

// ─── Extract existing definitions from ShibuiTerm annotations ─────────────────

function extractExistingDefinitions() {
	const defs = new Map();
	const pattern = /term="([^"]+)"\s+definition="([^"]+)"/g;

	// Scan project pages
	for (const f of readdirSync(PROJECTS_DIR).filter((f) => f.endsWith('.astro'))) {
		const source = readFileSync(join(PROJECTS_DIR, f), 'utf8');
		let m;
		while ((m = pattern.exec(source)) !== null) {
			defs.set(m[1].toLowerCase(), m[2]);
		}
	}

	// Scan other pages
	for (const page of ['about.astro', 'philosophy.astro']) {
		const path = join(PAGES_DIR, page);
		try {
			const source = readFileSync(path, 'utf8');
			let m;
			while ((m = pattern.exec(source)) !== null) {
				defs.set(m[1].toLowerCase(), m[2]);
			}
		} catch {
			/* page may not exist */
		}
	}

	return defs;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
	console.log('Shibui Lens — Building domain vocabulary...\n');

	// Build corpus
	const corpus = new Map();

	// Project pages
	const projectFiles = readdirSync(PROJECTS_DIR).filter((f) => f.endsWith('.astro'));
	for (const f of projectFiles) {
		const source = readFileSync(join(PROJECTS_DIR, f), 'utf8');
		const text = extractText(source);
		const tokens = tokenize(text);
		corpus.set(`project:${basename(f, '.astro')}`, tokens);
	}

	// Essays
	const essayFiles = readdirSync(ESSAYS_DIR).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));
	for (const f of essayFiles) {
		const source = readFileSync(join(ESSAYS_DIR, f), 'utf8');
		const text = extractText(source);
		const tokens = tokenize(text);
		corpus.set(`essay:${basename(f, '.mdx').replace('.md', '')}`, tokens);
	}

	console.log(
		`  Corpus: ${corpus.size} documents (${projectFiles.length} projects, ${essayFiles.length} essays)`,
	);

	// Compute IDF
	const idfMap = computeIdf(corpus);
	console.log(`  Vocabulary: ${idfMap.size} unique terms (filtered: 2+ docs, <60% prevalence)`);

	// Get top terms per doc
	const docTerms = topTermsPerDoc(corpus, idfMap, 15);

	// Collect global top terms by aggregate weight
	const globalScores = new Map();
	for (const terms of docTerms.values()) {
		for (const { term, weight } of terms) {
			globalScores.set(term, (globalScores.get(term) || 0) + weight);
		}
	}
	const globalTop = [...globalScores.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 300)
		.map(([term, score]) => ({ term, score: Math.round(score * 100) / 100 }));

	// Seed definitions from existing ShibuiTerm annotations
	const existingDefs = extractExistingDefinitions();
	console.log(`  Existing definitions: ${existingDefs.size} from ShibuiTerm annotations`);

	// Build vocabulary output — match definitions using fuzzy key matching
	const vocabulary = {};
	for (const { term, score } of globalTop) {
		const idfEntry = idfMap.get(term);

		// Try exact match first, then match as first word of multi-word definition keys
		let definition = existingDefs.get(term) || null;
		if (!definition) {
			for (const [defTerm, defText] of existingDefs) {
				const firstWord = defTerm.split(/[\s'-]+/)[0].toLowerCase();
				if (firstWord === term && defTerm.length > term.length) {
					definition = defText;
					// Store the display form of the multi-word term
					vocabulary[term] = {
						idf: Math.round((idfEntry?.idf || 0) * 100) / 100,
						score,
						docs: idfEntry?.docs || 0,
						definition,
						displayTerm: defTerm,
					};
					break;
				}
			}
		}
		if (!vocabulary[term]) {
			vocabulary[term] = {
				idf: Math.round((idfEntry?.idf || 0) * 100) / 100,
				score,
				docs: idfEntry?.docs || 0,
				definition,
			};
		}
	}

	// Also add multi-word terms from existing definitions as vocabulary entries
	// (these are the hand-curated gold standard)
	for (const [defTerm, defText] of existingDefs) {
		const key = defTerm
			.toLowerCase()
			.replace(/[^a-z0-9-]/g, '-')
			.replace(/-+/g, '-');
		if (!vocabulary[key]) {
			vocabulary[key] = {
				idf: 0,
				score: 0,
				docs: 0,
				definition: defText,
				displayTerm: defTerm,
				source: 'manual',
			};
		}
	}

	// Count stats
	const withDef = Object.values(vocabulary).filter((v) => v.definition).length;
	const withoutDef = Object.values(vocabulary).filter((v) => !v.definition).length;

	const output = {
		_meta: {
			generated: new Date().toISOString(),
			corpus_size: corpus.size,
			vocabulary_size: Object.keys(vocabulary).length,
			definitions_seeded: withDef,
			definitions_needed: withoutDef,
		},
		terms: vocabulary,
	};

	writeFileSync(OUTPUT, JSON.stringify(output, null, '\t'), 'utf8');
	console.log(`\n  Output: ${OUTPUT}`);
	console.log(
		`  Terms: ${Object.keys(vocabulary).length} (${withDef} with definitions, ${withoutDef} need definitions)`,
	);
	console.log('\nDone.');
}

main();
