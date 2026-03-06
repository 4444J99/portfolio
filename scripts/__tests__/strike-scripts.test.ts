import { describe, expect, it } from 'vitest';
import { parseTargetJson } from '../lib/parse-gemini-target.mjs';

describe('parseTargetJson', () => {
	it('extracts valid JSON with required fields', () => {
		const output = `{"company": "Acme Corp", "role": "Staff Engineer", "persona_id": "systems-architect"}`;
		const parsed = parseTargetJson(output);
		expect(parsed.company).toBe('Acme Corp');
		expect(parsed.role).toBe('Staff Engineer');
		expect(parsed.persona_id).toBe('systems-architect');
	});

	it('strips ANSI escape codes', () => {
		const output = `\u001b[32m{"company": "Foo", "role": "Bar", "persona_id": "ai-systems-engineer"}\u001b[0m`;
		const parsed = parseTargetJson(output);
		expect(parsed.company).toBe('Foo');
		expect(parsed.role).toBe('Bar');
	});

	it('ignores gemini log lines', () => {
		const output = `Loading model...\n{"company": "Baz", "role": "Lead", "persona_id": "creative-technologist"}`;
		const parsed = parseTargetJson(output);
		expect(parsed.company).toBe('Baz');
		expect(parsed.persona_id).toBe('creative-technologist');
	});

	it('extracts JSON from output with extra text', () => {
		const output = `Here is the result:\n{"company": "X", "role": "Y", "persona_id": "technical-pm"}\nDone.`;
		const parsed = parseTargetJson(output);
		expect(parsed.company).toBe('X');
	});

	it('throws when no JSON object found', () => {
		expect(() => parseTargetJson('no json here')).toThrow('Failed to extract JSON from AI output');
	});

	it('throws when JSON missing company', () => {
		const output = `{"role": "Engineer", "persona_id": "systems-architect"}`;
		expect(() => parseTargetJson(output)).toThrow('Parsed JSON missing required fields');
	});

	it('throws when JSON missing role', () => {
		const output = `{"company": "Acme", "persona_id": "systems-architect"}`;
		expect(() => parseTargetJson(output)).toThrow('Parsed JSON missing required fields');
	});

	it('throws when JSON missing persona_id', () => {
		const output = `{"company": "Acme", "role": "Engineer"}`;
		expect(() => parseTargetJson(output)).toThrow('Parsed JSON missing required fields');
	});

	it('accepts valid persona IDs', () => {
		const personas = [
			'ai-systems-engineer',
			'systems-architect',
			'creative-technologist',
			'technical-pm',
		];
		for (const pid of personas) {
			const output = `{"company": "Test", "role": "Role", "persona_id": "${pid}"}`;
			const parsed = parseTargetJson(output);
			expect(parsed.persona_id).toBe(pid);
		}
	});
});
