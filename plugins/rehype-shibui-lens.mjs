/**
 * rehype-shibui-lens — The Shibui Depth Lens
 *
 * A rehype plugin that transforms HTML at build time:
 * 1. Scores every <p> by complexity (readability + domain density + citation density)
 * 2. Tags paragraphs with data-shibui-c="0.72"
 * 3. Wraps detected domain terms in <span class="shibui-term">
 * 4. Injects simplified entry text as hidden siblings for complex paragraphs
 *
 * The lens replaces manual ShibuiContent/ShibuiTerm wrapping with algorithmic transformation.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { toString as hastToString } from 'hast-util-to-string';
import rs from 'text-readability';
import { visit } from 'unist-util-visit';

// ─── Vocabulary ───────────────────────────────────────────────────────────────

let vocabulary = null;
let definedTerms = []; // sorted longest-first for greedy matching

function loadVocabulary() {
	if (vocabulary) return;
	try {
		const path = resolve(import.meta.dirname ?? '.', '../src/data/shibui/vocabulary.json');
		const data = JSON.parse(readFileSync(path, 'utf8'));
		vocabulary = data.terms;

		// Build term list: only terms with definitions, sorted longest first
		definedTerms = Object.entries(vocabulary)
			.filter(([, v]) => v.definition)
			.map(([key, v]) => ({
				key,
				term: v.displayTerm || key,
				definition: v.definition,
				pattern: new RegExp(`\\b(${escapeRegex(v.displayTerm || key)})\\b`, 'gi'),
			}))
			.sort((a, b) => b.term.length - a.term.length); // longest first
	} catch (e) {
		console.warn('[rehype-shibui-lens] Could not load vocabulary.json:', e.message);
		vocabulary = {};
		definedTerms = [];
	}
}

function escapeRegex(s) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Complexity scoring ───────────────────────────────────────────────────────

/**
 * Score a text block's complexity on a 0-1 scale.
 * Combines Flesch readability, domain term density, and citation markers.
 */
function scoreComplexity(text) {
	if (!text || text.length < 50) return 0;

	// Flesch Reading Ease: 100 = very easy, 0 = very hard
	// Normalize to 0-1 where 1 = most complex
	let flesch;
	try {
		const raw = rs.fleschReadingEase(text);
		flesch = Math.max(0, Math.min(1, 1 - raw / 100));
	} catch {
		flesch = 0.5;
	}

	// Domain term density
	const words = text.toLowerCase().split(/\s+/).length;
	let domainHits = 0;
	for (const { pattern } of definedTerms) {
		const matches = text.match(pattern);
		if (matches) domainHits += matches.length;
	}
	const domainDensity = Math.min(1, (domainHits / Math.max(words, 1)) * 10);

	// Citation markers (parenthetical years, superscript refs, Cite patterns)
	const citePatterns = text.match(/\(\d{4}\)|\[\d+\]|<cite|<sup|Cite\s/gi);
	const citeDensity = Math.min(1, (citePatterns?.length || 0) / 3);

	// Weighted average
	return Math.round((flesch * 0.5 + domainDensity * 0.3 + citeDensity * 0.2) * 100) / 100;
}

// ─── Entry text generation (rule-based) ───────────────────────────────────────

/**
 * Generate a simplified entry version of a paragraph.
 * Rule-based mechanical simplification — no LLM needed.
 */
function generateEntry(text) {
	let entry = text;

	// Strip citation markers: (Author, 2024), [1], etc.
	entry = entry.replace(/\([A-Z][^)]*\d{4}[^)]*\)/g, '');
	entry = entry.replace(/\[\d+\]/g, '');

	// Replace domain terms with definitions (first occurrence only)
	for (const { term, definition, pattern } of definedTerms) {
		// Only replace if the definition is shorter than the term context
		if (definition.length < 80) {
			let replaced = false;
			entry = entry.replace(pattern, (match) => {
				if (replaced) return match;
				replaced = true;
				return definition.split('—')[0].split('–')[0].trim();
			});
		}
	}

	// Take first 2 sentences
	const sentences = entry.match(/[^.!?]+[.!?]+/g) || [entry];
	entry = sentences.slice(0, 2).join(' ').trim();

	// Clean up extra spaces, orphaned punctuation
	entry = entry
		.replace(/\s{2,}/g, ' ')
		.replace(/\s+([.,;:])/g, '$1')
		.trim();

	// Cap at 300 chars
	if (entry.length > 300) {
		entry = entry.slice(0, 297).replace(/\s\S*$/, '') + '...';
	}

	return entry;
}

// ─── Term annotation ──────────────────────────────────────────────────────────

/**
 * Find domain terms in a text node and return split children
 * with term spans injected.
 */
function annotateTerms(textValue) {
	if (!textValue || textValue.length < 10) return null;

	const segments = [];
	let remaining = textValue;
	let annotated = false;
	const usedTerms = new Set();

	// Greedy match: try longest terms first
	for (const { key, term, definition, pattern } of definedTerms) {
		if (usedTerms.has(key)) continue;

		const match = remaining.match(pattern);
		if (match) {
			const idx = remaining.indexOf(match[0]);
			if (idx === -1) continue;

			// Split: before + term span + after
			if (idx > 0) {
				segments.push({ type: 'text', value: remaining.slice(0, idx) });
			}
			segments.push({
				type: 'element',
				tagName: 'span',
				properties: {
					className: ['shibui-term'],
					'data-definition': definition,
				},
				children: [
					{
						type: 'element',
						tagName: 'span',
						properties: { className: ['shibui-term__text'] },
						children: [{ type: 'text', value: match[0] }],
					},
					{
						type: 'element',
						tagName: 'span',
						properties: {
							className: ['shibui-term__definition'],
							role: 'tooltip',
						},
						children: [{ type: 'text', value: definition }],
					},
				],
			});
			remaining = remaining.slice(idx + match[0].length);
			usedTerms.add(key);
			annotated = true;

			// Max 3 annotations per text node to avoid visual clutter
			if (usedTerms.size >= 3) break;
		}
	}

	if (!annotated) return null;
	if (remaining) segments.push({ type: 'text', value: remaining });
	return segments;
}

// ─── The Plugin ───────────────────────────────────────────────────────────────

/**
 * rehype-shibui-lens plugin.
 * Transforms the HTML AST at build time.
 */
export default function rehypeShibuiLens() {
	loadVocabulary();

	return (tree) => {
		// Build a set of nodes inside skip-worthy ancestors (header, nav, footer, etc.)
		const skipNodes = new WeakSet();
		const skipTags = new Set(['header', 'nav', 'footer', 'pre', 'code', 'script', 'style']);
		visit(tree, 'element', (node) => {
			if (skipTags.has(node.tagName)) {
				visit(node, 'element', (child) => {
					skipNodes.add(child);
				});
			}
		});

		visit(tree, 'element', (node, index, parent) => {
			// Skip elements already wrapped by manual ShibuiContent
			if (
				node.properties?.className?.includes?.('shibui-content') ||
				node.properties?.['dataShibuiLayer'] ||
				node.properties?.['data-shibui-layer'] ||
				node.properties?.dataUnitId ||
				node.properties?.['data-unit-id']
			) {
				return;
			}

			// Only process <p> elements in main content areas
			if (node.tagName !== 'p') return;
			if (!parent) return;
			// Skip paragraphs inside structural ancestors (header, nav, footer, etc.)
			if (skipNodes.has(node)) return;

			const text = hastToString(node);
			if (text.length < 80) return; // skip short paragraphs

			// 1. Score complexity
			const complexity = scoreComplexity(text);
			if (!node.properties) node.properties = {};
			node.properties['data-shibui-c'] = String(complexity);

			// 2. Annotate domain terms in text children
			const newChildren = [];
			for (const child of node.children) {
				if (child.type === 'text' && child.value.length > 20) {
					const annotated = annotateTerms(child.value);
					if (annotated) {
						newChildren.push(...annotated);
						continue;
					}
				}
				newChildren.push(child);
			}
			node.children = newChildren;

			// 3. Inject entry text sibling for complex paragraphs
			if (complexity > 0.3 && parent && typeof index === 'number') {
				const entry = generateEntry(text);
				if (entry && entry !== text && entry.length < text.length * 0.85) {
					const entryNode = {
						type: 'element',
						tagName: 'span',
						properties: {
							className: ['shibui-entry'],
							'data-shibui-c': String(complexity),
							ariaHidden: 'true',
						},
						children: [{ type: 'text', value: entry }],
					};
					// Insert entry BEFORE the paragraph
					parent.children.splice(index, 0, entryNode);
					return index + 2; // skip both entry and the original <p>
				}
			}
		});
	};
}
