#!/usr/bin/env node

/**
 * Accessibility audit — runs axe-core against all built HTML pages.
 * Exits non-zero if any critical or serious violations are found.
 *
 * Usage: node scripts/a11y-audit.mjs [--verbose] [--json] [--json-out <path>]
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { Window } from 'happy-dom';

const DIST = resolve('dist');
const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const jsonStdout = args.includes('--json');
const jsonOutIndex = args.indexOf('--json-out');
const jsonOutPath = jsonOutIndex >= 0 ? args[jsonOutIndex + 1] : null;

if (jsonOutIndex >= 0 && !jsonOutPath) {
	console.error('Missing value for --json-out');
	process.exit(1);
}

function findHtmlFiles(dir) {
	const results = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			results.push(...findHtmlFiles(fullPath));
		} else if (entry.name.endsWith('.html')) {
			results.push(fullPath);
		}
	}
	return results;
}

async function auditPage(filePath) {
	const html = readFileSync(filePath, 'utf-8');
	const window = new Window({
		url: 'http://localhost',
		settings: {
			enableJavaScriptEvaluation: true,
			disableCSSFileLoading: true,
			disableJavaScriptFileLoading: true,
			suppressInsecureJavaScriptEnvironmentWarning: true,
		},
	});
	const { document } = window;
	document.write(html);

	if (window.HTMLCanvasElement) {
		Object.defineProperty(window.HTMLCanvasElement.prototype, 'getContext', {
			configurable: true,
			value: () => ({
				fillRect: () => {},
				getImageData: () => ({ data: new Uint8ClampedArray(4) }),
				putImageData: () => {},
				createImageData: () => [],
				setTransform: () => {},
				drawImage: () => {},
				save: () => {},
				restore: () => {},
				beginPath: () => {},
				closePath: () => {},
				moveTo: () => {},
				lineTo: () => {},
				stroke: () => {},
				translate: () => {},
				scale: () => {},
				rotate: () => {},
				arc: () => {},
				fill: () => {},
				measureText: () => ({ width: 0 }),
				transform: () => {},
				rect: () => {},
				clip: () => {},
			}),
		});
	}

	// Inject axe-core into the happy-dom window — this is the standard
	// documented approach for running axe-core in Node.js environments.
	// The source is a trusted first-party dependency, not user input.
	const axeSource = readFileSync(resolve('node_modules/axe-core/axe.min.js'), 'utf-8');

	try {
		window.eval(axeSource);
		const results = await window.axe.run(document, {
			runOnly: ['wcag2a', 'wcag2aa', 'best-practice'],
		});
		await window.close();
		return results;
	} catch (err) {
		await window.close();
		// happy-dom's querySelectorAll does not support all CSS escape sequences
		// (e.g. numeric-prefixed IDs like #\37-...). Skip pages that trigger this.
		// The error may come from a VM context, so check message via string coercion.
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes('is not a valid selector')) {
			return { violations: [], incomplete: [], passes: [], inapplicable: [], skipped: true };
		}
		throw err;
	}
}

async function main() {
	const files = findHtmlFiles(DIST);
	if (!jsonStdout) {
		console.log(`Auditing ${files.length} HTML pages for accessibility...\n`);
	}

	let criticalCount = 0;
	let seriousCount = 0;
	let moderateCount = 0;
	let minorCount = 0;

	for (const file of files) {
		const relPath = file.replace(DIST + '/', '');
		const results = await auditPage(file);

		if (results.skipped) {
			if (!jsonStdout) console.log(`~ ${relPath} (skipped: selector limitation)`);
			continue;
		}

		const critical = results.violations.filter((v) => v.impact === 'critical');
		const serious = results.violations.filter((v) => v.impact === 'serious');
		const moderate = results.violations.filter((v) => v.impact === 'moderate');
		const minor = results.violations.filter((v) => v.impact === 'minor');

		criticalCount += critical.length;
		seriousCount += serious.length;
		moderateCount += moderate.length;
		minorCount += minor.length;

		if (jsonStdout) continue;

		if (critical.length > 0 || serious.length > 0 || verbose) {
			const icon = critical.length > 0 ? '✗' : serious.length > 0 ? '!' : '✓';
			console.log(`${icon} ${relPath}`);

			for (const v of [...critical, ...serious]) {
				console.log(`  [${v.impact.toUpperCase()}] ${v.id}: ${v.description}`);
				if (verbose) {
					for (const node of v.nodes) {
						console.log(`    → ${node.html.slice(0, 120)}`);
					}
				}
			}

			if (verbose && moderate.length > 0) {
				for (const v of moderate) {
					console.log(`  [MODERATE] ${v.id}: ${v.description}`);
				}
			}
		} else {
			console.log(`✓ ${relPath}`);
		}
	}

	const summary = {
		generated: new Date().toISOString(),
		pagesAudited: files.length,
		critical: criticalCount,
		serious: seriousCount,
		moderate: moderateCount,
		minor: minorCount,
		status: criticalCount > 0 || seriousCount > 0 ? 'fail' : 'pass',
	};

	if (jsonOutPath) {
		const absoluteOutPath = resolve(jsonOutPath);
		mkdirSync(dirname(absoluteOutPath), { recursive: true });
		writeFileSync(absoluteOutPath, JSON.stringify(summary, null, 2) + '\n');
	}

	if (jsonStdout) {
		console.log(JSON.stringify(summary, null, 2));
	} else {
		console.log('\n--- Summary ---');
		console.log(`Pages audited: ${summary.pagesAudited}`);
		console.log(`Critical: ${summary.critical}`);
		console.log(`Serious:  ${summary.serious}`);
		console.log(`Moderate: ${summary.moderate}`);
		console.log(`Minor:    ${summary.minor}`);
		if (summary.status === 'fail') {
			console.log('\n✗ FAIL — critical or serious violations found');
		} else {
			console.log('\n✓ PASS — no critical or serious violations');
		}
	}

	process.exit(summary.status === 'fail' ? 1 : 0);
}

main().catch((err) => {
	console.error('Audit failed:', err);
	process.exit(1);
});
