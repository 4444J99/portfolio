import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	f1_complexityReduction,
	f2_termSubstitution,
	f3_informationDensity,
	f3_scoreSentence,
	f4_registerShift,
	f5_classifySentences,
	f5_coherencePreservation,
	simplify,
} from '../shibui-rhetoric.mjs';

// ─── F1: Complexity Reduction ─────────────────────────────────────────────────

describe('F1: Complexity Reduction', () => {
	it('removes non-restrictive relative clauses', () => {
		const input =
			"Conway's Law, which observes that system design mirrors organizational structure, is the foundation.";
		const result = f1_complexityReduction(input);
		assert.ok(!result.includes('which observes'));
		assert.ok(result.includes("Conway's Law"));
		assert.ok(result.includes('foundation'));
	});

	it('removes parenthetical asides', () => {
		const input = 'The system (built over two years) handles 100 repos.';
		const result = f1_complexityReduction(input);
		assert.ok(!result.includes('built over two years'));
		assert.ok(result.includes('handles 100 repos'));
	});

	it('strips citation markers', () => {
		const input = 'This was documented (Brooks, 1975) in detail [1].';
		const result = f1_complexityReduction(input);
		assert.ok(!result.includes('Brooks'));
		assert.ok(!result.includes('[1]'));
	});

	it('removes em-dash asides', () => {
		const input = 'The system — originally designed for internal use — now serves external users.';
		const result = f1_complexityReduction(input);
		assert.ok(!result.includes('originally designed'));
		assert.ok(result.includes('system'));
	});

	it('preserves short text unchanged', () => {
		const input = 'I built a registry.';
		assert.equal(f1_complexityReduction(input), input);
	});
});

// ─── F2: Term Substitution ────────────────────────────────────────────────────

describe('F2: Term Substitution', () => {
	const vocab = new Map([
		[
			'conways-law',
			{
				term: "Conway's Law",
				definition: 'The 1968 observation that systems mirror org structure',
			},
		],
		['epistemic', { term: 'epistemic', definition: 'Related to knowledge and how we know things' }],
	]);

	it('substitutes first occurrence of a domain term', () => {
		const input = 'The epistemic approach was novel.';
		const result = f2_termSubstitution(input, vocab);
		assert.ok(
			result.includes('knowledge') || result.includes('related to knowledge'),
			`Expected substitution, got: ${result}`,
		);
	});

	it('limits substitutions to 3 per text block', () => {
		const bigVocab = new Map([
			['a', { term: 'alpha', definition: 'first' }],
			['b', { term: 'beta', definition: 'second' }],
			['c', { term: 'gamma', definition: 'third' }],
			['d', { term: 'delta', definition: 'fourth' }],
		]);
		const input = 'alpha beta gamma delta.';
		const result = f2_termSubstitution(input, bigVocab);
		// At most 3 substitutions
		const origWords = ['alpha', 'beta', 'gamma', 'delta'];
		const remaining = origWords.filter((w) => result.includes(w));
		assert.ok(remaining.length >= 1, 'At least one original term should remain');
	});

	it('returns text unchanged with empty vocabulary', () => {
		assert.equal(f2_termSubstitution('hello world', new Map()), 'hello world');
	});
});

// ─── F3: Information Density ──────────────────────────────────────────────────

describe('F3: Information Density', () => {
	it('scores filler sentences low', () => {
		const filler = 'As widely documented in the literature, this is generally known.';
		const score = f3_scoreSentence(filler);
		assert.ok(score < 0.4, `Expected low score, got ${score}`);
	});

	it('scores data-rich sentences high', () => {
		const data = 'The system produced 270,000 words in 48 hours across 72 repositories.';
		const score = f3_scoreSentence(data);
		assert.ok(score > 0.6, `Expected high score, got ${score}`);
	});

	it('filters filler from mixed paragraphs', () => {
		const input =
			'The system produced 270,000 words in 48 hours. As widely documented in the literature, this approach is generally known. It is important to note that quality gates prevent errors. The cost was $1-3 per README.';
		const result = f3_informationDensity(input);
		assert.ok(result.includes('270,000'), 'High-info sentence preserved');
		assert.ok(result.includes('$1-3'), 'Data sentence preserved');
	});
});

// ─── F4: Register Shift ──────────────────────────────────────────────────────

describe('F4: Register Shift', () => {
	it('shifts passive to first-person active', () => {
		const input = 'The system was designed to handle complexity.';
		const result = f4_registerShift(input);
		assert.ok(result.includes('I designed'), `Expected first-person, got: ${result}`);
	});

	it('simplifies academic vocabulary', () => {
		const input = 'The methodology facilitates the discourse.';
		const result = f4_registerShift(input);
		assert.ok(!result.includes('methodology'), `Expected no "methodology", got: ${result}`);
		assert.ok(!result.includes('facilitates'), `Expected no "facilitates", got: ${result}`);
		assert.ok(!result.includes('discourse'), `Expected no "discourse", got: ${result}`);
	});

	it('replaces hedging constructions', () => {
		const input =
			'In order to achieve this, it is important to note that the implementation was utilized.';
		const result = f4_registerShift(input);
		assert.ok(!result.includes('In order to'));
		assert.ok(!result.includes('it is important'));
		assert.ok(result.includes('used') || result.includes('us'));
	});
});

// ─── F5: Coherence Preservation ───────────────────────────────────────────────

describe('F5: Coherence Preservation', () => {
	it('classifies first sentence as nucleus', () => {
		const sentences = ['The core claim.', 'For example, supporting detail.', 'More detail.'];
		const classified = f5_classifySentences(sentences);
		assert.equal(classified[0].role, 'nucleus');
	});

	it('classifies "For example" as satellite', () => {
		const sentences = ['The core claim.', 'For example, this shows it.'];
		const classified = f5_classifySentences(sentences);
		assert.equal(classified[1].role, 'satellite');
	});

	it('classifies "However" as nucleus', () => {
		const sentences = ['First point.', 'However, the opposite is true.'];
		const classified = f5_classifySentences(sentences);
		assert.equal(classified[1].role, 'nucleus');
	});

	it('preserves nucleus sentences in compression', () => {
		const input =
			'The bottleneck shifts from production to review. For example, writing 270K words is cheap. Furthermore, review takes 400 hours. However, the economics are fundamentally different. Additionally, this changes hiring. The cost per README is $1-3.';
		const result = f5_coherencePreservation(input);
		assert.ok(result.includes('bottleneck'), 'First nucleus preserved');
		assert.ok(result.includes('However'), '"However" nucleus preserved');
	});
});

// ─── Composition ──────────────────────────────────────────────────────────────

describe('simplify() composition', () => {
	it('produces shorter output than input', () => {
		const input =
			"Conway's Law, which observes that system design mirrors organizational structure, is the foundation of the eight-organ system. As widely documented in the literature, this principle has been utilized by software architects for decades. The methodology was implemented across 105 repositories in 48 hours. For example, each repository carries CI workflows. Furthermore, the validation suite checks 228 points.";
		const result = simplify(input);
		assert.ok(
			result.length < input.length,
			`Output (${result.length}) should be shorter than input (${input.length})`,
		);
		assert.ok(result.length > 20, 'Output should not be empty');
	});

	it('respects maxLength option', () => {
		const input =
			'A long paragraph with many sentences. It goes on and on. There are many details here. Some are important. Others are not. The key point is at the beginning. Everything else is elaboration. This should be compressed.';
		const result = simplify(input, null, { maxLength: 150 });
		assert.ok(result.length <= 150, `Expected ≤150 chars, got ${result.length}`);
	});

	it('handles short text gracefully', () => {
		const input = 'Short text.';
		assert.equal(simplify(input), input);
	});

	it('handles empty text', () => {
		assert.equal(simplify(''), '');
		assert.equal(simplify(null), null);
	});
});
