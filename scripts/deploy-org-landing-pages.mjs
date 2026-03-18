#!/usr/bin/env node

/**
 * Deploys generated landing pages to each organ's .github.io repo.
 * Clones the repo (or uses existing), copies the generated index.html,
 * commits, and pushes.
 *
 * Prerequisites:
 *   - Run generate-org-landing-pages.mjs first
 *   - SSH access to all org repos
 *
 * Usage:
 *   node scripts/deploy-org-landing-pages.mjs           # dry-run (shows what would be pushed)
 *   node scripts/deploy-org-landing-pages.mjs --push    # actually push to remotes
 */

import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const DIST = resolve('dist-org-pages');
const WORK = resolve('.tmp-org-deploy');
const dryRun = !process.argv.includes('--push');

const ORGS = [
	'organvm-i-theoria',
	'organvm-ii-poiesis',
	'organvm-iii-ergon',
	'organvm-iv-taxis',
	'organvm-v-logos',
	'organvm-vi-koinonia',
	'organvm-vii-kerygma',
	'meta-organvm',
];

if (dryRun) console.log('DRY RUN — add --push to actually deploy\n');

mkdirSync(WORK, { recursive: true });

for (const org of ORGS) {
	const srcFile = resolve(DIST, org, 'index.html');
	if (!existsSync(srcFile)) {
		console.log(`  ✗ ${org} — no generated page found`);
		continue;
	}

	const repoName = `${org}.github.io`;
	const repoUrl = `git@github.com:${org}/${repoName}.git`;
	const repoDir = join(WORK, repoName);

	try {
		// Clone if not already present
		if (!existsSync(repoDir)) {
			console.log(`  ↓ Cloning ${repoName}...`);
			execSync(`git clone --depth 1 ${repoUrl} "${repoDir}"`, {
				stdio: 'pipe',
				timeout: 30000,
			});
		}

		// Copy generated page
		const destFile = join(repoDir, 'index.html');
		const newContent = readFileSync(srcFile, 'utf-8');
		const oldContent = existsSync(destFile) ? readFileSync(destFile, 'utf-8') : '';

		if (newContent === oldContent) {
			console.log(`  = ${org} — no changes`);
			continue;
		}

		if (dryRun) {
			console.log(`  ~ ${org} — would update index.html`);
			continue;
		}

		writeFileSync(destFile, newContent);

		// Commit and push
		execSync('git add index.html', { cwd: repoDir, stdio: 'pipe' });
		execSync('git commit -m "chore: regenerate landing page with fixed nav and portfolio links"', {
			cwd: repoDir,
			stdio: 'pipe',
		});
		execSync('git push origin main', { cwd: repoDir, stdio: 'pipe', timeout: 30000 });
		console.log(`  ✓ ${org} — deployed`);
	} catch (err) {
		console.log(`  ✗ ${org} — ${err.message.split('\n')[0]}`);
	}
}

if (dryRun) {
	console.log(`\nDry run complete. Review pages in ${DIST}/ then run with --push.`);
} else {
	console.log('\nDeploy complete.');
}
