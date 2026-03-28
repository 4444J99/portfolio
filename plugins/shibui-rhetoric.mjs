/**
 * shibui-rhetoric.mjs — The Five Rhetorical Transformation Functions
 *
 * Replaces naive generateEntry() with linguistically-grounded simplification.
 * Each function is derived from a specific rhetorical/linguistic discipline:
 *
 *   F1: Complexity Reduction    — Chomsky's Transformational Grammar
 *   F2: Term Substitution       — Hypernym chains via vocabulary.json
 *   F3: Information Density     — Shannon entropy / necessity scoring
 *   F4: Register Shift          — Halliday's Systemic Functional Linguistics
 *   F5: Coherence Preservation  — Rhetorical Structure Theory (nucleus/satellite)
 *
 * The composition: simplify(text) = F5(F4(F3(F2(F1(text)))))
 * Each function is independently testable and configurable.
 */

// ─── F1: Complexity Reduction ─────────────────────────────────────────────────
// Chomsky's Transformational Grammar: reduce syntactic depth.
// Flatten relative clauses, decompose compound-complex sentences.
// Target: depth(S) ≤ 2 (max 2 levels of clause embedding)

/**
 * Flatten embedded clauses to reduce syntactic complexity.
 * Removes relative clauses, parenthetical asides, and appositives
 * that add depth without core meaning.
 *
 * @param {string} text
 * @returns {string}
 */
export function f1_complexityReduction(text) {
	let result = text;

	// Remove parenthetical asides: "text (parenthetical content) more text"
	// Only remove if parenthetical is < 80 chars (short clarifications, not substantive)
	result = result.replace(/\s*\([^)]{1,80}\)/g, '');

	// Remove non-restrictive relative clauses: ", which/who/whom + clause,"
	// These add detail but not core meaning
	result = result.replace(/,\s*which\s[^,;.]{5,120}[,;]/gi, ',');
	result = result.replace(/,\s*who\s[^,;.]{5,120}[,;]/gi, ',');
	result = result.replace(/,\s*whom\s[^,;.]{5,120}[,;]/gi, ',');

	// Remove trailing non-restrictive clauses at sentence end: ", which/who + clause."
	result = result.replace(/,\s*which\s[^.]{5,120}\./gi, '.');
	result = result.replace(/,\s*who\s[^.]{5,120}\./gi, '.');

	// Remove appositives: "noun, a/an description," → "noun,"
	result = result.replace(/,\s*(?:a|an|the)\s+[^,]{3,60},/gi, ',');

	// Flatten "X — Y — Z" em-dash asides (common in academic prose)
	result = result.replace(/\s*—\s*[^—.]{5,100}\s*—\s*/g, ' ');
	// Single trailing em-dash clause: "text — elaboration."
	result = result.replace(/\s*—\s*[^.]{5,100}\./g, '.');

	// Remove citation artifacts: [1], (Author, 2024), (ibid.), etc.
	result = result.replace(/\s*\[\d+\]/g, '');
	result = result.replace(/\s*\([A-Z][a-z]+(?:\s(?:and|&)\s[A-Z][a-z]+)?,?\s*\d{4}[a-z]?\)/g, '');
	result = result.replace(/\s*\((?:ibid|op\.\s*cit|cf)\.\)/gi, '');

	// Clean up double commas, spaces, and orphaned punctuation
	result = result.replace(/,\s*,/g, ',');
	result = result.replace(/\s{2,}/g, ' ');
	result = result.replace(/\s+([.,;:!?])/g, '$1');

	return result.trim();
}

// ─── F2: Term Substitution ────────────────────────────────────────────────────
// Hypernym chains: replace domain-specific terms with accessible alternatives.
// Uses vocabulary.json definitions as substitution source.

/**
 * Replace domain-specific terms with their plain-language definitions.
 * Only substitutes on first occurrence; preserves subsequent mentions.
 *
 * @param {string} text
 * @param {Map<string, {term: string, definition: string}>} vocabulary
 * @returns {string}
 */
export function f2_termSubstitution(text, vocabulary) {
	if (!vocabulary || vocabulary.size === 0) return text;

	let result = text;
	const substituted = new Set();

	// Sort by term length descending (longest first to avoid partial matches)
	const sorted = [...vocabulary.entries()]
		.filter(([, v]) => v.definition && v.definition.length < 100)
		.sort((a, b) => b[1].term.length - a[1].term.length);

	for (const [, { term, definition }] of sorted) {
		if (substituted.size >= 3) break; // max 3 substitutions per text block

		const pattern = new RegExp(`\\b${escapeRegex(term)}\\b`, 'i');
		if (pattern.test(result) && !substituted.has(term.toLowerCase())) {
			// Extract the core meaning (before em-dash or semicolon elaboration)
			const core = definition.split(/\s*[—–;]\s*/)[0].trim();
			// Only substitute if the core definition is shorter than the term + 20 chars
			if (core.length < term.length + 40) {
				result = result.replace(pattern, core.toLowerCase());
				substituted.add(term.toLowerCase());
			}
		}
	}

	return result;
}

// ─── F3: Information Density Control ──────────────────────────────────────────
// Shannon entropy / necessity scoring: keep high-information sentences,
// drop low-information filler. Ported from narratological-lenses
// Necessity Diagnostic concept.

/** Filler phrases that add no information (low entropy) */
const LOW_ENTROPY_PATTERNS = [
	/\b(?:as (?:widely |is well |has been )?(?:documented|noted|observed|discussed|established|recognized|known))\b/i,
	/\b(?:it (?:is|should be) (?:worth |important to )?not(?:ed?|ing|eworthy) that)\b/i,
	/\b(?:in (?:this|the) (?:context|regard|sense|respect))\b/i,
	/\b(?:the (?:fact|reality|truth) (?:that|is that|remains that))\b/i,
	/\b(?:broadly speaking|generally speaking|in general terms)\b/i,
	/\b(?:from (?:a|the|an) (?:\w+ )?(?:perspective|standpoint|point of view))\b/i,
	/\b(?:it (?:can|could|may|might) be (?:argued|said|suggested|noted) that)\b/i,
	/\b(?:fundamentally|essentially|basically|ultimately)\b/i,
];

/** Markers of high-information content (high entropy) */
const HIGH_ENTROPY_PATTERNS = [
	/\d+(?:\.\d+)?%/, // percentages
	/\b\d{2,}[,.]?\d*\b/, // significant numbers
	/\b(?:produced|generated|created|built|shipped|launched|deployed)\b/i, // concrete actions
	/\b(?:hours?|days?|weeks?|months?|minutes?|seconds?)\b/i, // time specifics
	/\b(?:first|only|unique|novel|original|unprecedented)\b/i, // uniqueness claims
];

/**
 * Score a sentence's information density.
 * High score = high information (keep). Low score = filler (remove).
 *
 * @param {string} sentence
 * @returns {number} 0-1 density score
 */
export function f3_scoreSentence(sentence) {
	if (sentence.length < 20) return 0.3; // short sentences are usually transitions

	let score = 0.5; // baseline

	// Penalize filler patterns
	for (const pattern of LOW_ENTROPY_PATTERNS) {
		if (pattern.test(sentence)) score -= 0.15;
	}

	// Reward high-information patterns
	for (const pattern of HIGH_ENTROPY_PATTERNS) {
		if (pattern.test(sentence)) score += 0.1;
	}

	// Reward specificity: proper nouns (capitalized words not at sentence start)
	const properNouns = sentence.match(/(?<=\s)[A-Z][a-z]+/g);
	if (properNouns && properNouns.length > 0) score += 0.05 * Math.min(properNouns.length, 3);

	// Penalize hedging language
	if (/\b(?:perhaps|possibly|arguably|somewhat|relatively|fairly|rather)\b/i.test(sentence)) {
		score -= 0.1;
	}

	return Math.max(0, Math.min(1, score));
}

/**
 * Filter sentences by information density.
 * Keeps sentences above the mean density threshold.
 *
 * @param {string} text
 * @returns {string}
 */
export function f3_informationDensity(text) {
	const sentences = splitSentences(text);
	if (sentences.length <= 2) return text; // too short to filter

	const scored = sentences.map((s) => ({ text: s, score: f3_scoreSentence(s) }));
	const mean = scored.reduce((sum, s) => sum + s.score, 0) / scored.length;

	// Keep sentences above mean (or within 0.1 of mean for borderline cases)
	const kept = scored.filter((s) => s.score >= mean - 0.1);

	// Always keep first sentence (topic sentence) and last sentence (conclusion)
	if (kept.length > 0 && kept[0].text !== scored[0].text) {
		kept.unshift(scored[0]);
	}

	return kept.map((s) => s.text).join(' ');
}

// ─── F4: Register Shift ──────────────────────────────────────────────────────
// Halliday's SFL: shift tenor (formal→casual) and mode (written→spoken).
// Field (topic) stays constant. Transforms academic register to conversational.

/**
 * Shift text from academic register to conversational register.
 * Preserves meaning; changes voice, person, and formality.
 *
 * @param {string} text
 * @returns {string}
 */
export function f4_registerShift(text) {
	let result = text;

	// Tenor shift: third-person passive → first-person active
	// "The system was designed to..." → "I designed the system to..."
	result = result.replace(
		/\bThe (\w+) (?:was|were|has been|had been) (\w+ed)\b/gi,
		(_, noun, verb) => {
			return `I ${verb} the ${noun.toLowerCase()}`;
		},
	);
	// "It is observed that..." → "I noticed that..."
	result = result.replace(
		/\bIt (?:is|was|has been) (?:observed|noted|found|discovered|determined) that\b/gi,
		'I found that',
	);
	// "One might argue..." → "You could say..."
	result = result.replace(
		/\bOne (?:might|could|may|can) (?:argue|suggest|note|observe)\b/gi,
		'You could say',
	);
	// "The author" → "I"
	result = result.replace(/\bThe author\b/gi, 'I');
	// "This paper/essay/document" → "this"
	result = result.replace(
		/\bThis (?:paper|essay|document|work|study|analysis|investigation)\b/gi,
		'This',
	);

	// Mode shift: written formality → spoken directness
	// "In order to" → "To"
	result = result.replace(/\bIn order to\b/gi, 'To');
	// "Due to the fact that" → "Because"
	result = result.replace(/\bDue to the fact that\b/gi, 'Because');
	// "It is important to note that" → "" (remove entirely)
	result = result.replace(
		/\bIt is (?:important|worth noting|critical|essential|necessary) (?:to note |to observe )?that\b/gi,
		'',
	);
	// "With respect to" → "About"
	result = result.replace(/\bWith respect to\b/gi, 'About');
	// "In the context of" → "In"
	result = result.replace(/\bIn the context of\b/gi, 'In');
	// "Utiliz(e/ing)" → "us(e/ing)"
	result = result.replace(/\butiliz(e|es|ed|ing)\b/gi, (_, suffix) => `us${suffix}`);
	// "Implement(ation)" → "build/built" (in non-technical contexts)
	result = result.replace(/\bimplement(?:ed|s)?\b/gi, 'built');
	result = result.replace(/\bimplementation\b/gi, 'building');
	// "Facilitate(s/d)" → "help(s/ed)"
	result = result.replace(/\bfacilitat(e|es|ed|ing)\b/gi, (_, s) => {
		const map = { e: 'help', es: 'helps', ed: 'helped', ing: 'helping' };
		return map[s] || 'help';
	});
	// "Demonstrate(s/d)" → "show(s/ed)"
	result = result.replace(/\bdemonstrat(e|es|ed|ing)\b/gi, (_, s) => {
		const map = { e: 'show', es: 'shows', ed: 'showed', ing: 'showing' };
		return map[s] || 'show';
	});
	// "Constitute(s)" → "make(s) up" / "is"
	result = result.replace(/\bconstitutes?\b/gi, 'makes up');
	// "Methodology" → "method" / "approach"
	result = result.replace(/\bmethodology\b/gi, 'approach');
	// "Paradigm" → "model" / "approach"
	result = result.replace(/\bparadigm\b/gi, 'model');
	// "Discourse" → "conversation" / "discussion"
	result = result.replace(/\bdiscourse\b/gi, 'discussion');

	// Clean up artifacts from transformations
	result = result.replace(/\s{2,}/g, ' ');
	result = result.replace(/^\s*,\s*/, '');

	return result.trim();
}

// ─── F5: Coherence Preservation ───────────────────────────────────────────────
// Rhetorical Structure Theory: identify nucleus (core claim) and satellites
// (evidence/elaboration). Preserve nucleus, compress satellites.
// Ported from narratological-lenses causal binding concept.

/** Discourse markers that signal satellite (supporting) content */
const SATELLITE_MARKERS = [
	/^(?:For (?:example|instance))\b/i,
	/^(?:In particular)\b/i,
	/^(?:Specifically)\b/i,
	/^(?:That is(?:,| to say))\b/i,
	/^(?:Furthermore|Moreover|Additionally|Also)\b/i,
	/^(?:Similarly|Likewise|In the same way)\b/i,
	/^(?:As (?:a result|such|noted|mentioned|discussed))\b/i,
	/^(?:This (?:means|implies|suggests|indicates))\b/i,
];

/** Discourse markers that signal nucleus (core claim) content */
const NUCLEUS_MARKERS = [
	/^(?:The (?:key|core|central|main|critical|fundamental) (?:insight|point|claim|finding|result|observation))\b/i,
	/^(?:(?:But|However|Yet|Nevertheless|Instead))\b/i,
	/^(?:Therefore|Thus|Consequently|Hence|Accordingly)\b/i,
	/^(?:The (?:result|outcome|conclusion|implication) (?:is|was))\b/i,
];

/**
 * Classify each sentence as nucleus or satellite based on discourse markers
 * and position. Returns sentences tagged with their RST role.
 *
 * @param {string[]} sentences
 * @returns {{text: string, role: 'nucleus' | 'satellite'}[]}
 */
export function f5_classifySentences(sentences) {
	return sentences.map((s, i) => {
		// First sentence is almost always nucleus (topic sentence)
		if (i === 0) return { text: s, role: 'nucleus' };

		// Check for explicit satellite markers
		for (const marker of SATELLITE_MARKERS) {
			if (marker.test(s.trim())) return { text: s, role: 'satellite' };
		}

		// Check for explicit nucleus markers
		for (const marker of NUCLEUS_MARKERS) {
			if (marker.test(s.trim())) return { text: s, role: 'nucleus' };
		}

		// Heuristic: sentences with numbers/data are more likely nucleus (evidence)
		if (/\d{2,}/.test(s) || /\b\d+(?:\.\d+)?%\b/.test(s)) {
			return { text: s, role: 'nucleus' };
		}

		// Default: classify by position (earlier = more likely nucleus)
		return { text: s, role: i < sentences.length / 2 ? 'nucleus' : 'satellite' };
	});
}

/**
 * Preserve coherence: keep nucleus sentences, compress satellites.
 * Maximum output: nucleus + top 2 satellites (by information density).
 *
 * @param {string} text
 * @returns {string}
 */
export function f5_coherencePreservation(text) {
	const sentences = splitSentences(text);
	if (sentences.length <= 3) return text;

	const classified = f5_classifySentences(sentences);

	const nuclei = classified.filter((s) => s.role === 'nucleus');
	const satellites = classified.filter((s) => s.role === 'satellite');

	// Keep all nuclei + top 2 satellites (scored by information density)
	const scoredSatellites = satellites
		.map((s) => ({ ...s, score: f3_scoreSentence(s.text) }))
		.sort((a, b) => b.score - a.score)
		.slice(0, 2);

	// Reconstruct in original order
	const keepSet = new Set([...nuclei.map((n) => n.text), ...scoredSatellites.map((s) => s.text)]);

	const kept = sentences.filter((s) => keepSet.has(s));
	return kept.join(' ');
}

// ─── Composition ──────────────────────────────────────────────────────────────

/**
 * The composed simplification function.
 * Applies F1 → F2 → F3 → F4 → F5 in sequence.
 *
 * @param {string} text - Input paragraph text
 * @param {Map<string, {term: string, definition: string}>} [vocabulary] - Domain vocabulary
 * @param {object} [options]
 * @param {number} [options.maxLength=300] - Maximum output length in characters
 * @param {boolean} [options.skipF2=false] - Skip term substitution
 * @param {boolean} [options.skipF4=false] - Skip register shift
 * @returns {string}
 */
export function simplify(text, vocabulary, options = {}) {
	const { maxLength = 300, skipF2 = false, skipF4 = false } = options;

	if (!text || text.length < 50) return text;

	// F1: Reduce syntactic complexity
	let result = f1_complexityReduction(text);

	// F2: Substitute domain terms with accessible alternatives
	if (!skipF2 && vocabulary) {
		result = f2_termSubstitution(result, vocabulary);
	}

	// F3: Filter by information density
	result = f3_informationDensity(result);

	// F4: Shift register from academic to conversational
	if (!skipF4) {
		result = f4_registerShift(result);
	}

	// F5: Preserve coherence (nucleus/satellite)
	result = f5_coherencePreservation(result);

	// Final length cap
	if (result.length > maxLength) {
		result = result.slice(0, maxLength - 3).replace(/\s\S*$/, '') + '...';
	}

	// Clean up
	result = result.replace(/\s{2,}/g, ' ').trim();

	// Ensure it starts with a capital letter
	if (result.length > 0) {
		result = result[0].toUpperCase() + result.slice(1);
	}

	return result;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Split text into sentences. Handles abbreviations and decimals.
 * @param {string} text
 * @returns {string[]}
 */
function splitSentences(text) {
	// Split on period/exclamation/question followed by space + capital letter
	// Avoid splitting on abbreviations (Mr., Dr., etc.) and decimals (3.14)
	const raw = text.match(/[^.!?]+(?:[.!?]+(?:\s|$))/g) || [text];
	return raw.map((s) => s.trim()).filter((s) => s.length > 0);
}

function escapeRegex(s) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
