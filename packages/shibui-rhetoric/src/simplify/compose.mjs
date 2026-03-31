import { f1_complexityReduction } from './f1-complexity.mjs';
import { f2_termSubstitution } from './f2-substitution.mjs';
import { f3_informationDensity, f3_scoreSentence } from './f3-density.mjs';
import { f4_registerShift } from './f4-register.mjs';
import { f5_classifySentences, f5_coherencePreservation } from './f5-coherence.mjs';

export {
	f1_complexityReduction,
	f2_termSubstitution,
	f3_informationDensity,
	f3_scoreSentence,
	f4_registerShift,
	f5_classifySentences,
	f5_coherencePreservation,
};

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

	let result = f1_complexityReduction(text);

	if (!skipF2 && vocabulary) {
		result = f2_termSubstitution(result, vocabulary);
	}

	result = f3_informationDensity(result);

	if (!skipF4) {
		result = f4_registerShift(result);
	}

	result = f5_coherencePreservation(result);

	if (result.length > maxLength) {
		result = result.slice(0, maxLength - 3).replace(/\s\S*$/, '') + '...';
	}

	result = result.replace(/\s{2,}/g, ' ').trim();

	if (result.length > 0) {
		result = result[0].toUpperCase() + result.slice(1);
	}

	return result;
}
