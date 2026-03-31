const LOW_ENTROPY_PATTERNS = [
	/\b(?:as (?:widely |is well |has been )?(?:documented|noted|observed|discussed|established|recognized|known))\b/i,
	/\b(?:it (?:is|should be) (?:worth |important to )?not(?:ed?|ing|eworthy) that)\b/i,
	/\b(?:in (?:this|the) (?:context|regard|sense|respect))\b/i,
	/\b(?:the (?:fact|reality|truth) (?:that|is that|remains that))\b/i,
	/\b(?:broadly speaking|generally speaking|in general terms)\b/i,
	/\b(?:from (?:a|the|an) (?:\w+ )?(?:perspective|standpoint|point of view))\b/i,
	/\b(?:it (?:can|could|may|might) be (?:argued|said|suggested|noted) that)\b/i,
	/\b(?:leverage synergies|paradigm shift|best[- ]in[- ]class|thought leader|game[- ]?changer)\b/i,
	/\b(?:move the needle|circle back|low[- ]hanging fruit|deep dive|value[- ]add)\b/i,
	/\b(?:cutting[- ]edge|next[- ]generation|world[- ]class|state[- ]of[- ]the[- ]art|industry[- ]leading)\b/i,
	/\b(?:at the end of the day|when all is said and done|it goes without saying)\b/i,
	/\b(?:needless to say|to be honest|the bottom line is|the thing is)\b/i,
	/\b(?:having said that|that being said|all things considered|by and large)\b/i,
	/\b(?:don't worry|rest assured|have no fear|trust me on this)\b/i,
	/\b(?:it's going to be (?:great|amazing|incredible|fantastic))\b/i,
	/\b(?:incredibly powerful|truly revolutionary|absolutely essential|game-changing)\b/i,
	/\b(?:breathtakingly elegant|mind-blowingly|phenomenally)\b/i,
	/\b(?:the sky is the limit|anything is possible|dream big|reach for the stars)\b/i,
	/\b(?:unlock your potential|take it to the next level|push the envelope)\b/i,
];

const HIGH_ENTROPY_PATTERNS = [
	/\d+(?:\.\d+)?%/,
	/\b\d{2,}[,.]?\d*\b/,
	/\b(?:produced|generated|created|built|shipped|launched|deployed)\b/i,
	/\b(?:hours?|days?|weeks?|months?|minutes?|seconds?)\b/i,
	/\b(?:first|only|unique|novel|original|unprecedented)\b/i,
];

/**
 * F3: Information Density Control — Shannon entropy / necessity scoring
 * Keep high-information sentences, drop low-information filler.
 *
 * @param {string} sentence
 * @returns {number} 0-1 density score
 */
export function f3_scoreSentence(sentence) {
	if (sentence.length < 20) return 0.3;

	let score = 0.5;

	for (const pattern of LOW_ENTROPY_PATTERNS) {
		if (pattern.test(sentence)) score -= 0.15;
	}

	for (const pattern of HIGH_ENTROPY_PATTERNS) {
		if (pattern.test(sentence)) score += 0.1;
	}

	const properNouns = sentence.match(/(?<=\s)[A-Z][a-z]+/g);
	if (properNouns && properNouns.length > 0) score += 0.05 * Math.min(properNouns.length, 3);

	if (/\b(?:perhaps|possibly|arguably|somewhat|relatively|fairly|rather)\b/i.test(sentence)) {
		score -= 0.1;
	}

	const abstractNouns = sentence.match(
		/\b(?:ontology|epistemology|hermeneutics|phenomenology|praxis|dialectic|teleology|axiom)\b/gi,
	);
	if (abstractNouns && abstractNouns.length >= 2) score -= 0.15;

	const mythicTerms = sentence.match(
		/\b(?:transcendent|primordial|sacred|alchemical|divine|eternal|cosmic|archetypal)\b/gi,
	);
	if (mythicTerms && mythicTerms.length >= 1 && !/\b\d/.test(sentence)) score -= 0.1;

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
	if (sentences.length <= 2) return text;

	const scored = sentences.map((s) => ({ text: s, score: f3_scoreSentence(s) }));
	const mean = scored.reduce((sum, s) => sum + s.score, 0) / scored.length;

	const kept = scored.filter((s) => s.score >= mean - 0.1);

	if (kept.length > 0 && kept[0].text !== scored[0].text) {
		kept.unshift(scored[0]);
	}

	return kept.map((s) => s.text).join(' ');
}

function splitSentences(text) {
	const raw = text.match(/[^.!?]+(?:[.!?]+(?:\s|$))/g) || [text];
	return raw.map((s) => s.trim()).filter((s) => s.length > 0);
}
