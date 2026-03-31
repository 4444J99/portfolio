/**
 * F1: Complexity Reduction — Chomsky's Transformational Grammar
 * Flatten embedded clauses to reduce syntactic complexity.
 * Target: depth(S) ≤ 2 (max 2 levels of clause embedding)
 *
 * @param {string} text
 * @returns {string}
 */
export function f1_complexityReduction(text) {
	let result = text;

	result = result.replace(/\s*\([^)]{1,80}\)/g, '');

	result = result.replace(/,\s*which\s[^,;.]{5,120}[,;]/gi, ',');
	result = result.replace(/,\s*who\s[^,;.]{5,120}[,;]/gi, ',');
	result = result.replace(/,\s*whom\s[^,;.]{5,120}[,;]/gi, ',');

	result = result.replace(/,\s*which\s[^.]{5,120}\./gi, '.');
	result = result.replace(/,\s*who\s[^.]{5,120}\./gi, '.');

	result = result.replace(/,\s*(?:a|an|the)\s+[^,]{3,60},/gi, ',');

	result = result.replace(/\s*—\s*[^—.]{5,100}\s*—\s*/g, ' ');
	result = result.replace(/\s*—\s*[^.]{5,100}\./g, '.');

	result = result.replace(/\s*\[\d+\]/g, '');
	result = result.replace(/\s*\([A-Z][a-z]+(?:\s(?:and|&)\s[A-Z][a-z]+)?,?\s*\d{4}[a-z]?\)/g, '');
	result = result.replace(/\s*\((?:ibid|op\.\s*cit|cf)\.\)/gi, '');

	result = result.replace(/,\s*,/g, ',');
	result = result.replace(/\s{2,}/g, ' ');
	result = result.replace(/\s+([.,;:!?])/g, '$1');

	return result.trim();
}
