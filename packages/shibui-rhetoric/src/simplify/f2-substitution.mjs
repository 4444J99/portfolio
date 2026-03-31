/**
 * F2: Term Substitution — Hypernym chains
 * Replace domain-specific terms with accessible alternatives.
 * Uses vocabulary definitions as substitution source.
 *
 * @param {string} text
 * @param {Map<string, {term: string, definition: string}>} vocabulary
 * @returns {string}
 */
export function f2_termSubstitution(text, vocabulary) {
	if (!vocabulary || vocabulary.size === 0) return text;

	let result = text;
	const substituted = new Set();

	const sorted = [...vocabulary.entries()]
		.filter(([, v]) => v.definition && v.definition.length < 100)
		.sort((a, b) => b[1].term.length - a[1].term.length);

	for (const [, { term, definition }] of sorted) {
		if (substituted.size >= 3) break;

		const pattern = new RegExp(`\\b${escapeRegex(term)}\\b`, 'i');
		if (pattern.test(result) && !substituted.has(term.toLowerCase())) {
			const core = definition.split(/\s*[—–;]\s*/)[0].trim();
			if (core.length < term.length + 40) {
				result = result.replace(pattern, core.toLowerCase());
				substituted.add(term.toLowerCase());
			}
		}
	}

	return result;
}

function escapeRegex(s) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
