import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../..');
const scriptPath = resolve(root, 'scripts/check-data-freshness.mjs');

function makeTempDir(prefix = 'data-freshness-test-') {
	return mkdtempSync(resolve(tmpdir(), prefix));
}

function runScript(args, cwd) {
	const result = spawnSync('node', [scriptPath, ...args], {
		cwd,
		encoding: 'utf-8',
	});
	return {
		status: result.status,
		stdout: result.stdout ?? '',
		stderr: result.stderr ?? '',
	};
}

describe('stale/fresh detection with mock timestamps', () => {
	it('detects fresh files when timestamp is recent', () => {
		const dir = makeTempDir();
		const dataDir = resolve(dir, 'src/data');
		mkdirSync(dataDir, { recursive: true });

		const now = new Date().toISOString();

		// Create data files that the script checks
		writeFileSync(resolve(dataDir, 'omega.json'), JSON.stringify({ generated: now }));
		writeFileSync(resolve(dataDir, 'github-pages.json'), JSON.stringify({ generatedAt: now }));
		writeFileSync(resolve(dataDir, 'vitals.json'), JSON.stringify({ timestamp: now }));
		writeFileSync(resolve(dataDir, 'system-metrics.json'), JSON.stringify({ generated: now }));
		writeFileSync(resolve(dataDir, 'projects.json'), JSON.stringify({ generated: now }));

		const outputPath = resolve(dir, 'freshness.json');
		const result = runScript(['--json-out', outputPath], dir);

		assert.equal(result.status, 0, `Expected pass. stderr: ${result.stderr}`);
		const summary = JSON.parse(readFileSync(outputPath, 'utf-8'));
		assert.equal(summary.status, 'pass');

		const freshCount = summary.results.filter((r) => r.status === 'fresh').length;
		assert.equal(freshCount, 5, 'All 5 files should be fresh');

		rmSync(dir, { recursive: true, force: true });
	});

	it('detects stale files when timestamp is old', () => {
		const dir = makeTempDir();
		const dataDir = resolve(dir, 'src/data');
		mkdirSync(dataDir, { recursive: true });

		// 30 days ago — older than any default threshold
		const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

		writeFileSync(resolve(dataDir, 'omega.json'), JSON.stringify({ generated: oldDate }));
		writeFileSync(resolve(dataDir, 'github-pages.json'), JSON.stringify({ generatedAt: oldDate }));
		writeFileSync(resolve(dataDir, 'vitals.json'), JSON.stringify({ timestamp: oldDate }));
		writeFileSync(resolve(dataDir, 'system-metrics.json'), JSON.stringify({ generated: oldDate }));
		writeFileSync(resolve(dataDir, 'projects.json'), JSON.stringify({ generated: oldDate }));

		const outputPath = resolve(dir, 'freshness.json');
		const result = runScript(['--json-out', outputPath], dir);

		assert.equal(result.status, 1, 'Should fail when files are stale');
		const summary = JSON.parse(readFileSync(outputPath, 'utf-8'));
		assert.equal(summary.status, 'fail');

		const staleCount = summary.results.filter((r) => r.status === 'stale').length;
		assert.ok(staleCount > 0, 'At least one file should be stale');

		rmSync(dir, { recursive: true, force: true });
	});

	it('reports missing files', () => {
		const dir = makeTempDir();
		// Don't create any data files — they should all be missing
		const outputPath = resolve(dir, 'freshness.json');
		const result = runScript(['--json-out', outputPath], dir);

		assert.equal(result.status, 1, 'Should fail when files are missing');
		const summary = JSON.parse(readFileSync(outputPath, 'utf-8'));
		assert.equal(summary.status, 'fail');

		const missingCount = summary.results.filter((r) => r.status === 'missing').length;
		assert.equal(missingCount, 5, 'All 5 files should be missing');

		rmSync(dir, { recursive: true, force: true });
	});
});

describe('threshold logic', () => {
	it('--max-age-days overrides per-file thresholds', () => {
		const dir = makeTempDir();
		const dataDir = resolve(dir, 'src/data');
		mkdirSync(dataDir, { recursive: true });

		// 10 days ago — stale for github-pages (3d) and omega/vitals (7d),
		// but fresh if we override to 15 days
		const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

		writeFileSync(resolve(dataDir, 'omega.json'), JSON.stringify({ generated: tenDaysAgo }));
		writeFileSync(
			resolve(dataDir, 'github-pages.json'),
			JSON.stringify({ generatedAt: tenDaysAgo }),
		);
		writeFileSync(resolve(dataDir, 'vitals.json'), JSON.stringify({ timestamp: tenDaysAgo }));
		writeFileSync(
			resolve(dataDir, 'system-metrics.json'),
			JSON.stringify({ generated: tenDaysAgo }),
		);
		writeFileSync(resolve(dataDir, 'projects.json'), JSON.stringify({ generated: tenDaysAgo }));

		// Without override — should fail (github-pages has 3d threshold)
		const outputFail = resolve(dir, 'freshness-fail.json');
		const failResult = runScript(['--json-out', outputFail], dir);
		assert.equal(failResult.status, 1, 'Should fail with default thresholds');

		// With override — 15 days, all should pass
		const outputPass = resolve(dir, 'freshness-pass.json');
		const passResult = runScript(['--json-out', outputPass, '--max-age-days', '15'], dir);
		assert.equal(
			passResult.status,
			0,
			`Should pass with 15d override. stderr: ${passResult.stderr}`,
		);

		const summary = JSON.parse(readFileSync(outputPass, 'utf-8'));
		assert.equal(summary.globalMaxAgeDaysOverride, 15);
		assert.equal(summary.status, 'pass');

		rmSync(dir, { recursive: true, force: true });
	});

	it('falls back to mtime when JSON timestamp field is missing', () => {
		const dir = makeTempDir();
		const dataDir = resolve(dir, 'src/data');
		mkdirSync(dataDir, { recursive: true });

		const now = new Date().toISOString();

		// omega.json without the 'generated' field — should fall back to mtime (which is now)
		writeFileSync(resolve(dataDir, 'omega.json'), JSON.stringify({ something: 'else' }));
		writeFileSync(resolve(dataDir, 'github-pages.json'), JSON.stringify({ generatedAt: now }));
		writeFileSync(resolve(dataDir, 'vitals.json'), JSON.stringify({ timestamp: now }));
		writeFileSync(resolve(dataDir, 'system-metrics.json'), JSON.stringify({ generated: now }));
		writeFileSync(resolve(dataDir, 'projects.json'), JSON.stringify({ generated: now }));

		const outputPath = resolve(dir, 'freshness.json');
		const result = runScript(['--json-out', outputPath], dir);

		assert.equal(result.status, 0, `Should pass (mtime is current). stderr: ${result.stderr}`);
		const summary = JSON.parse(readFileSync(outputPath, 'utf-8'));
		const omegaResult = summary.results.find((r) => r.file === 'src/data/omega.json');
		assert.equal(omegaResult.timestampSource, 'mtime', 'Should fall back to mtime');
		assert.equal(omegaResult.status, 'fresh');

		rmSync(dir, { recursive: true, force: true });
	});
});
