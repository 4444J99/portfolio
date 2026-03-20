import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../..');
const scriptPath = resolve(root, 'scripts/security-audit.mjs');

function makeTempDir(prefix = 'security-audit-test-') {
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

function writeFixtures(dir, { policy, allowlist, audit } = {}) {
	const policyPath = resolve(dir, 'policy.json');
	const allowlistPath = resolve(dir, 'allowlist.json');
	const fixturePath = resolve(dir, 'audit-fixture.json');

	writeFileSync(
		policyPath,
		JSON.stringify(
			policy ?? {
				rules: { maxCritical: 0, maxHigh: 0 },
				checkpoints: [{ date: '2026-01-01', maxModerate: 10, maxLow: 10 }],
			},
		),
	);
	writeFileSync(allowlistPath, JSON.stringify(allowlist ?? { version: 1, entries: [] }));
	writeFileSync(
		fixturePath,
		JSON.stringify(
			audit ?? {
				vulnerabilities: {},
				metadata: {
					vulnerabilities: { critical: 0, high: 0, moderate: 0, low: 0, info: 0, total: 0 },
				},
			},
		),
	);

	return { policyPath, allowlistPath, fixturePath };
}

describe('security-audit CLI flag parsing', () => {
	it('accepts --json-out to control output path', () => {
		const dir = makeTempDir();
		const outputPath = resolve(dir, 'custom-output.json');
		const { policyPath, allowlistPath, fixturePath } = writeFixtures(dir);

		const result = runScript(
			[
				'--json-out',
				outputPath,
				'--policy',
				policyPath,
				'--allowlist',
				allowlistPath,
				'--audit-fixture',
				fixturePath,
			],
			dir,
		);

		assert.equal(
			result.status,
			0,
			`Expected exit 0, got ${result.status}. stderr: ${result.stderr}`,
		);
		assert.ok(existsSync(outputPath), 'Custom output file should exist');
		rmSync(dir, { recursive: true, force: true });
	});

	it('accepts --omit=dev to set prod scope', () => {
		const dir = makeTempDir();
		const outputPath = resolve(dir, 'output.json');
		const { policyPath, allowlistPath, fixturePath } = writeFixtures(dir);

		const result = runScript(
			[
				'--json-out',
				outputPath,
				'--policy',
				policyPath,
				'--allowlist',
				allowlistPath,
				'--audit-fixture',
				fixturePath,
				'--omit',
				'dev',
			],
			dir,
		);

		assert.equal(result.status, 0);
		const summary = JSON.parse(readFileSync(outputPath, 'utf-8'));
		assert.equal(summary.scope, 'prod', 'Scope should be prod when --omit=dev');
		rmSync(dir, { recursive: true, force: true });
	});
});

describe('tallyBySeverity logic', () => {
	it('counts vulnerabilities by severity correctly', () => {
		const dir = makeTempDir();
		const outputPath = resolve(dir, 'output.json');
		const { policyPath, allowlistPath, fixturePath } = writeFixtures(dir, {
			policy: {
				rules: { maxCritical: 5, maxHigh: 5 },
				checkpoints: [{ date: '2026-01-01', maxModerate: 10, maxLow: 10 }],
			},
			audit: {
				vulnerabilities: {
					'pkg-a': { severity: 'critical', via: [], fixAvailable: false },
					'pkg-b': { severity: 'high', via: [], fixAvailable: true },
					'pkg-c': { severity: 'moderate', via: [], fixAvailable: false },
					'pkg-d': { severity: 'low', via: [], fixAvailable: false },
					'pkg-e': { severity: 'high', via: [], fixAvailable: false },
				},
				metadata: {
					vulnerabilities: { critical: 1, high: 2, moderate: 1, low: 1, info: 0, total: 5 },
				},
			},
		});

		const result = runScript(
			[
				'--json-out',
				outputPath,
				'--policy',
				policyPath,
				'--allowlist',
				allowlistPath,
				'--audit-fixture',
				fixturePath,
			],
			dir,
		);

		assert.equal(result.status, 0);
		const summary = JSON.parse(readFileSync(outputPath, 'utf-8'));
		assert.equal(summary.unsuppressed.counts.critical, 1);
		assert.equal(summary.unsuppressed.counts.high, 2);
		assert.equal(summary.unsuppressed.counts.moderate, 1);
		assert.equal(summary.unsuppressed.counts.low, 1);
		assert.equal(summary.unsuppressed.counts.total, 5);
		rmSync(dir, { recursive: true, force: true });
	});
});

describe('checkpoint resolution logic', () => {
	it('resolves the most recent checkpoint at or before reference date', () => {
		const dir = makeTempDir();
		const outputPath = resolve(dir, 'output.json');
		const { policyPath, allowlistPath, fixturePath } = writeFixtures(dir, {
			policy: {
				rules: { maxCritical: 0, maxHigh: 0 },
				checkpoints: [
					{ date: '2026-01-01', maxModerate: 10, maxLow: 10 },
					{ date: '2026-02-01', maxModerate: 5, maxLow: 5 },
					{ date: '2026-03-01', maxModerate: 2, maxLow: 2 },
				],
			},
		});

		const result = runScript(
			[
				'--json-out',
				outputPath,
				'--policy',
				policyPath,
				'--allowlist',
				allowlistPath,
				'--audit-fixture',
				fixturePath,
				'--date',
				'2026-02-15',
			],
			dir,
		);

		assert.equal(result.status, 0);
		const summary = JSON.parse(readFileSync(outputPath, 'utf-8'));
		assert.equal(summary.checkpoint.date, '2026-02-01', 'Should resolve to Feb 1 checkpoint');
		assert.equal(summary.checkpointRules.maxModerate, 5);
		rmSync(dir, { recursive: true, force: true });
	});

	it('resolves the first checkpoint when reference date is before all', () => {
		const dir = makeTempDir();
		const outputPath = resolve(dir, 'output.json');
		const { policyPath, allowlistPath, fixturePath } = writeFixtures(dir, {
			policy: {
				rules: { maxCritical: 0, maxHigh: 0 },
				checkpoints: [
					{ date: '2026-03-01', maxModerate: 2, maxLow: 2 },
					{ date: '2026-04-01', maxModerate: 1, maxLow: 1 },
				],
			},
		});

		const result = runScript(
			[
				'--json-out',
				outputPath,
				'--policy',
				policyPath,
				'--allowlist',
				allowlistPath,
				'--audit-fixture',
				fixturePath,
				'--date',
				'2026-01-01',
			],
			dir,
		);

		assert.equal(result.status, 0);
		const summary = JSON.parse(readFileSync(outputPath, 'utf-8'));
		assert.equal(summary.checkpoint.date, '2026-03-01', 'Should fall back to first checkpoint');
		rmSync(dir, { recursive: true, force: true });
	});
});
