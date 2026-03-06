#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const personasPath = path.join(__dirname, '../src/data/personas.json');
const projectsDir = path.join(__dirname, '../src/pages/projects');

function validatePersonas() {
	console.log('🔍 Validating Persona featured project links...');

	if (!fs.existsSync(personasPath)) {
		console.error('❌ personas.json not found');
		process.exit(1);
	}

	const data = JSON.parse(fs.readFileSync(personasPath, 'utf8'));
	const personas = data.personas || [];
	let errors = 0;

	for (const persona of personas) {
		console.log(`  Persona: ${persona.title}`);
		for (const project of persona.featured_projects) {
			const astroPath = path.join(projectsDir, `${project.slug}.astro`);
			const tsPath = path.join(projectsDir, `${project.slug}.ts`);

			if (!fs.existsSync(astroPath) && !fs.existsSync(tsPath)) {
				console.error(
					`    ❌ Link Rot: Project slug "${project.slug}" has no corresponding page in src/pages/projects/`,
				);
				errors++;
			}
		}
	}

	if (errors > 0) {
		console.error(`\n❌ Validation failed: ${errors} dead project links found in personas.json`);
		process.exit(1);
	}

	console.log('\n✅ All persona project links are valid.');
}

validatePersonas();
