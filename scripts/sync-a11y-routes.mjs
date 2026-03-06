#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Paths
const TARGETS_PATH = path.join(__dirname, '../src/data/targets.json');
const PERSONAS_PATH = path.join(__dirname, '../src/data/personas.json');
const PROJECT_INDEX_PATH = path.join(__dirname, '../src/data/project-index.ts');
const OUTPUT_PATH = path.join(__dirname, 'runtime-a11y-routes.json');

const DEFAULT_CHECKS = ['nav-menu', 'dropdown-menu', 'search-dialog', 'theme-toggle'];

async function generateA11yRoutes() {
	console.log('🔄 Synchronizing Runtime A11y Routes...');

	const targets = JSON.parse(fs.readFileSync(TARGETS_PATH, 'utf8')).targets;
	const personas = JSON.parse(fs.readFileSync(PERSONAS_PATH, 'utf8')).personas;

	// Extract slugs from the TS file with regex to avoid compiling it
	const projectTsContent = fs.readFileSync(PROJECT_INDEX_PATH, 'utf8');
	const projectMatches = [...projectTsContent.matchAll(/slug:\s*['"]([^'"]+)['"]/g)];
	const projectSlugs = projectMatches.map((m) => m[1]);

	const routes = [
		{ path: '/', checks: DEFAULT_CHECKS },
		{ path: '/about', checks: DEFAULT_CHECKS },
		{ path: '/resume', checks: DEFAULT_CHECKS },
		{ path: '/resume/polymath', checks: DEFAULT_CHECKS },
		{ path: '/dashboard', checks: DEFAULT_CHECKS },
		{ path: '/essays', checks: DEFAULT_CHECKS },
		{
			path: '/gallery',
			checks: [...DEFAULT_CHECKS, 'gallery-filter', 'fullscreen'],
			requiredFocusSelectors: ['.sketch-ctrl--pause', '.sketch-ctrl--fullscreen'],
		},
		{ path: '/architecture', checks: DEFAULT_CHECKS },
		{ path: '/community', checks: DEFAULT_CHECKS },
		{ path: '/consult', checks: DEFAULT_CHECKS },
		{ path: '/products', checks: DEFAULT_CHECKS },
		{ path: '/omega', checks: DEFAULT_CHECKS },
		{ path: '/github-pages', checks: DEFAULT_CHECKS },
		{ path: '/404.html', checks: DEFAULT_CHECKS },
		{ path: '/philosophy', checks: DEFAULT_CHECKS },
		{ path: '/testimonials', checks: DEFAULT_CHECKS },
		{ path: '/roadmap', checks: DEFAULT_CHECKS },
		{ path: '/impact', checks: DEFAULT_CHECKS },
		{ path: '/press', checks: DEFAULT_CHECKS },
	];

	// Inject Project Routes
	projectSlugs.forEach((slug) => {
		routes.push({ path: `/projects/${slug}`, checks: DEFAULT_CHECKS });
	});

	// Inject Persona Routes
	personas.forEach((persona) => {
		routes.push({ path: `/resume/${persona.id}`, checks: DEFAULT_CHECKS });
	});

	// Inject Logos Routes
	routes.push({ path: '/logos', checks: DEFAULT_CHECKS });
	const logosContentDir = path.join(__dirname, '../src/content/logos');
	if (fs.existsSync(logosContentDir)) {
		for (const entry of fs.readdirSync(logosContentDir)) {
			if (entry.endsWith('.md') || entry.endsWith('.mdx')) {
				const slug = entry.replace(/\.(md|mdx)$/, '');
				routes.push({ path: `/logos/${slug}`, checks: DEFAULT_CHECKS });
			}
		}
	}

	// Inject Dynamic Target Routes
	targets.forEach((target) => {
		routes.push({ path: `/for/${target.slug}`, checks: DEFAULT_CHECKS });
	});

	const manifest = {
		basePath: '/portfolio',
		routes,
	};

	fs.writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2) + '\n');
	console.log(`✅ Successfully generated ${routes.length} routes for A11y runtime audit.`);
}

generateA11yRoutes().catch(console.error);
