import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import personas from '../personas.json';

const root = resolve(__dirname, '../../../');
const resumeDir = resolve(root, 'public/resume');

describe('resume PDF integrity', () => {
	it('every persona has a downloadable PDF in public/resume/', () => {
		for (const persona of personas.personas) {
			const pdfName = persona.pdfName || persona.title.replace(/\s+/g, '_');
			const filename = `Anthony_James_Padavano_${pdfName}.pdf`;
			const filepath = resolve(resumeDir, filename);
			expect(existsSync(filepath), `Missing PDF for persona "${persona.id}": ${filename}`).toBe(
				true,
			);
		}
	});

	it('no persona pdfName contains path-breaking characters', () => {
		for (const persona of personas.personas) {
			const pdfName = persona.pdfName || persona.title.replace(/\s+/g, '_');
			expect(pdfName, `pdfName for "${persona.id}" contains /`).not.toContain('/');
			expect(pdfName, `pdfName for "${persona.id}" contains \\`).not.toContain('\\');
		}
	});
});
