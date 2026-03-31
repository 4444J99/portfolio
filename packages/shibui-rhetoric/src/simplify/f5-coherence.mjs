import { f3_scoreSentence } from './f3-density.mjs';

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

const NUCLEUS_MARKERS = [
	/^(?:The (?:key|core|central|main|critical|fundamental) (?:insight|point|claim|finding|result|observation))\b/i,
	/^(?:(?:But|However|Yet|Nevertheless|Instead))\b/i,
	/^(?:Therefore|Thus|Consequently|Hence|Accordingly)\b/i,
	/^(?:The (?:result|outcome|conclusion|implication) (?:is|was))\b/i,
];

/**
 * F5: Coherence Preservation — Rhetorical Structure Theory
 * Identify nucleus (core claim) and satellites (evidence/elaboration).
 * Preserve nucleus, compress satellites.
 *
 * @param {string[]} sentences
 * @returns {{text: string, role: 'nucleus' | 'satellite'}[]}
 */
export function f5_classifySentences(sentences) {
	return sentences.map((s, i) => {
		if (i === 0) return { text: s, role: 'nucleus' };

		for (const marker of SATELLITE_MARKERS) {
			if (marker.test(s.trim())) return { text: s, role: 'satellite' };
		}

		for (const marker of NUCLEUS_MARKERS) {
			if (marker.test(s.trim())) return { text: s, role: 'nucleus' };
		}

		if (/\d{2,}/.test(s) || /\b\d+(?:\.\d+)?%\b/.test(s)) {
			return { text: s, role: 'nucleus' };
		}

		return { text: s, role: i < sentences.length / 2 ? 'nucleus' : 'satellite' };
	});
}

/**
 * Preserve coherence: keep nucleus sentences, compress satellites.
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

	const scoredSatellites = satellites
		.map((s) => ({ ...s, score: f3_scoreSentence(s.text) }))
		.sort((a, b) => b.score - a.score)
		.slice(0, 2);

	const keepSet = new Set([...nuclei.map((n) => n.text), ...scoredSatellites.map((s) => s.text)]);

	const kept = sentences.filter((s) => keepSet.has(s));
	return kept.join(' ');
}

function splitSentences(text) {
	const raw = text.match(/[^.!?]+(?:[.!?]+(?:\s|$))/g) || [text];
	return raw.map((s) => s.trim()).filter((s) => s.length > 0);
}
