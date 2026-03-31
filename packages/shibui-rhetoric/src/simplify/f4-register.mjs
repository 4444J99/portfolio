/**
 * F4: Register Shift — Halliday's Systemic Functional Linguistics
 * Shift tenor (formal→casual) and mode (written→spoken).
 * Field (topic) stays constant.
 *
 * @param {string} text
 * @returns {string}
 */
export function f4_registerShift(text) {
	let result = text;

	result = result.replace(
		/\bThe (\w+) (?:was|were|has been|had been) (\w+ed)\b/gi,
		(_, noun, verb) => {
			return `I ${verb} the ${noun.toLowerCase()}`;
		},
	);
	result = result.replace(
		/\bIt (?:is|was|has been) (?:observed|noted|found|discovered|determined) that\b/gi,
		'I found that',
	);
	result = result.replace(
		/\bOne (?:might|could|may|can) (?:argue|suggest|note|observe)\b/gi,
		'You could say',
	);
	result = result.replace(/\bThe author\b/gi, 'I');
	result = result.replace(
		/\bThis (?:paper|essay|document|work|study|analysis|investigation)\b/gi,
		'This',
	);

	result = result.replace(/\bIn order to\b/gi, 'To');
	result = result.replace(/\bDue to the fact that\b/gi, 'Because');
	result = result.replace(/\bWith respect to\b/gi, 'About');
	result = result.replace(/\bIn the context of\b/gi, 'In');
	result = result.replace(/\bWith regard to\b/gi, 'About');
	result = result.replace(/\bIn light of\b/gi, 'Given');
	result = result.replace(/\bFor the purpose of\b/gi, 'To');
	result = result.replace(/\bIn the event that\b/gi, 'If');
	result = result.replace(/\bAt this point in time\b/gi, 'Now');
	result = result.replace(/\bPrior to\b/gi, 'Before');
	result = result.replace(/\bSubsequent to\b/gi, 'After');
	result = result.replace(/\bIn the absence of\b/gi, 'Without');
	result = result.replace(/\bNotwithstanding\b/gi, 'Despite');
	result = result.replace(/\bIn accordance with\b/gi, 'Following');
	result = result.replace(
		/\bA(?:n)? (?:significant |considerable |substantial )?(?:number|amount|quantity) of\b/gi,
		'Many',
	);

	result = result.replace(
		/\bIt is (?:important|worth noting|critical|essential|necessary|interesting) (?:to note |to observe |to recognize |to acknowledge )?that\b/gi,
		'',
	);
	result = result.replace(
		/\bIt (?:should|must|can) be (?:noted|emphasized|stressed|recognized) that\b/gi,
		'',
	);

	result = result.replace(/\butiliz(e|es|ed|ing)\b/gi, (_, s) => `us${s}`);
	result = result.replace(/\bimplement(?:ed|s)?\b/gi, 'built');
	result = result.replace(/\bimplementation\b/gi, 'building');
	result = result.replace(/\bfacilitat(e|es|ed|ing)\b/gi, (_, s) => {
		const map = { e: 'help', es: 'helps', ed: 'helped', ing: 'helping' };
		return map[s] || 'help';
	});
	result = result.replace(/\bdemonstrat(e|es|ed|ing)\b/gi, (_, s) => {
		const map = { e: 'show', es: 'shows', ed: 'showed', ing: 'showing' };
		return map[s] || 'show';
	});
	result = result.replace(/\bconstitutes?\b/gi, 'makes up');
	result = result.replace(/\bmethodology\b/gi, 'approach');
	result = result.replace(/\bparadigm\b/gi, 'model');
	result = result.replace(/\bdiscourse\b/gi, 'discussion');
	result = result.replace(/\bcommence\b/gi, 'start');
	result = result.replace(/\bterminate\b/gi, 'end');
	result = result.replace(/\bsubsequently\b/gi, 'then');
	result = result.replace(/\bapproximately\b/gi, 'about');
	result = result.replace(/\bnevertheless\b/gi, 'still');
	result = result.replace(/\bconsequently\b/gi, 'so');
	result = result.replace(/\bpreclude\b/gi, 'prevent');
	result = result.replace(/\bameliorat(e|es|ed|ing)\b/gi, (_, s) => {
		const map = { e: 'improve', es: 'improves', ed: 'improved', ing: 'improving' };
		return map[s] || 'improve';
	});
	result = result.replace(/\bascertain\b/gi, 'find out');
	result = result.replace(/\bendeavor\b/gi, 'try');
	result = result.replace(/\bsufficient\b/gi, 'enough');
	result = result.replace(/\bfundamentally\b/gi, 'at its core');
	result = result.replace(/\bessentially\b/gi, 'really');
	result = result.replace(/\bbasically\b/gi, 'really');
	result = result.replace(/\bultimately\b/gi, 'in the end');

	result = result.replace(/\s{2,}/g, ' ');
	result = result.replace(/^\s*,\s*/, '');

	return result.trim();
}
