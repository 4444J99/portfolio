/**
 * Parse target metadata JSON from gemini CLI output.
 * Strips ANSI codes and gemini log lines, extracts first JSON object, validates required fields.
 */

const GEMINI_LOG_PREFIXES = ['Loading ', 'Server ', 'Tools ', 'Loaded '];

function isGeminiLogLine(line) {
	return (
		GEMINI_LOG_PREFIXES.some((p) => line.startsWith(p)) || line.includes('tool update notification')
	);
}

/**
 * Parse raw gemini output into { company, role, persona_id }.
 * @param {string} rawOutput - raw stdout from gemini CLI
 * @returns {{ company: string, role: string, persona_id: string }}
 * @throws {Error} if JSON cannot be extracted or required fields are missing
 */
export function parseTargetJson(rawOutput) {
	const lines = rawOutput
		.replace(/\u001b\[[0-9;]*m/g, '')
		.split('\n')
		.map((l) => l.trim())
		.filter((l) => l.length > 0);

	const cleanOutput = lines
		.filter((l) => !isGeminiLogLine(l))
		.join('')
		.trim();

	const jsonMatch = cleanOutput.match(/\{\s*[\s\S]*\s*\}/);
	if (!jsonMatch) {
		throw new Error('Failed to extract JSON from AI output.');
	}

	const parsed = JSON.parse(jsonMatch[0]);
	if (!parsed.company || !parsed.role || !parsed.persona_id) {
		throw new Error('Parsed JSON missing required fields.');
	}

	return {
		company: String(parsed.company),
		role: String(parsed.role),
		persona_id: String(parsed.persona_id),
	};
}
