import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../../../');
const readme = readFileSync(resolve(root, 'README.md'), 'utf-8');
const lighthouseScript = readFileSync(resolve(root, 'scripts/lighthouse-ci.mjs'), 'utf-8');
const workflow = readFileSync(resolve(root, '.github/workflows/ci.yml'), 'utf-8');
const vitestConfig = readFileSync(resolve(root, '.config/vitest.config.ts'), 'utf-8');
const typecheckScript = readFileSync(resolve(root, 'scripts/check-typecheck-hints.mjs'), 'utf-8');
const runtimeCoverageScript = readFileSync(
	resolve(root, 'scripts/check-runtime-a11y-coverage.mjs'),
	'utf-8',
);
const policy = JSON.parse(readFileSync(resolve(root, '.quality/ratchet-policy.json'), 'utf-8'));
const securityPolicy = JSON.parse(
	readFileSync(resolve(root, '.quality/security-policy.json'), 'utf-8'),
);

function parseCoverageRatchetFromReadme() {
	const match = readme.match(
		/Coverage ratchet policy:\s*W2 `([0-9]+)\/([0-9]+)\/([0-9]+)\/([0-9]+)`, W4 `([0-9]+)\/([0-9]+)\/([0-9]+)\/([0-9]+)`, W6 `([0-9]+)\/([0-9]+)\/([0-9]+)\/([0-9]+)`, W8 `([0-9]+)\/([0-9]+)\/([0-9]+)\/([0-9]+)`, W10 `([0-9]+)\/([0-9]+)\/([0-9]+)\/([0-9]+)`/,
	);
	expect(match).not.toBeNull();
	return {
		W2: {
			statements: Number(match![1]),
			branches: Number(match![2]),
			functions: Number(match![3]),
			lines: Number(match![4]),
		},
		W4: {
			statements: Number(match![5]),
			branches: Number(match![6]),
			functions: Number(match![7]),
			lines: Number(match![8]),
		},
		W6: {
			statements: Number(match![9]),
			branches: Number(match![10]),
			functions: Number(match![11]),
			lines: Number(match![12]),
		},
		W8: {
			statements: Number(match![13]),
			branches: Number(match![14]),
			functions: Number(match![15]),
			lines: Number(match![16]),
		},
		W10: {
			statements: Number(match![17]),
			branches: Number(match![18]),
			functions: Number(match![19]),
			lines: Number(match![20]),
		},
	};
}

function parseHintRatchetFromReadme() {
	const match = readme.match(
		/Typecheck hint budget policy:\s*W2 `<=([0-9]+)`, W4 `<=([0-9]+)`, W6 `=([0-9]+)`, W8 `=([0-9]+)`, W10 `=([0-9]+)`/,
	);
	expect(match).not.toBeNull();
	return {
		W2: Number(match![1]),
		W4: Number(match![2]),
		W6: Number(match![3]),
		W8: Number(match![4]),
		W10: Number(match![5]),
	};
}

function parseRuntimeCoverageRatchetFromReadme() {
	const match = readme.match(/Runtime a11y coverage ratchet: 100% enforcement \(reached\)\./);
	expect(match).not.toBeNull();
	return true;
}

describe('quality governance drift checks', () => {
	it('README performance threshold matches Lighthouse enforcement', () => {
		const readmePerf = readme.match(/Perf ≥ ([0-9]+)/);
		const configPerf = lighthouseScript.match(
			/'categories:performance': \['error', \{ minScore: ([0-9.]+) \}\]/,
		);

		expect(readmePerf).not.toBeNull();
		expect(configPerf).not.toBeNull();

		const readmeValue = Number(readmePerf![1]);
		const configValue = Math.round(Number(configPerf![1]) * 100);
		expect(readmeValue).toBe(configValue);
	});

	it('README ratchet schedule matches policy file', () => {
		const readmeCoverage = parseCoverageRatchetFromReadme();
		expect(readmeCoverage).toEqual({
			W2: policy.phases.W2.coverage,
			W4: policy.phases.W4.coverage,
			W6: policy.phases.W6.coverage,
			W8: policy.phases.W8.coverage,
			W10: policy.phases.W10.coverage,
		});

		const readmeHints = parseHintRatchetFromReadme();
		expect(readmeHints).toEqual({
			W2: policy.phases.W2.typecheck.hintsMax,
			W4: policy.phases.W4.typecheck.hintsMax,
			W6: policy.phases.W6.typecheck.hintsMax,
			W8: policy.phases.W8.typecheck.hintsMax,
			W10: policy.phases.W10.typecheck.hintsMax,
		});

		const runtimeCoverageRatchet = parseRuntimeCoverageRatchetFromReadme();
		expect(runtimeCoverageRatchet).toBe(true);

		expect(runtimeCoverageScript).toContain(`const BASELINE_MIN_COVERAGE = 100;`);
	});

	it('README security ratchet schedule matches security policy file', () => {
		const readmeSecurity = readme.match(
			/Security ratchet checkpoints:\s*`([0-9-]+)` `moderate<=([0-9]+), low<=([0-9]+)`, `([0-9-]+)` `moderate<=([0-9]+), low<=([0-9]+)`, `([0-9-]+)` `moderate<=([0-9]+), low<=([0-9]+)`, `([0-9-]+)` `moderate<=([0-9]+), low<=([0-9]+)`, `([0-9-]+)` `moderate<=([0-9]+), low<=([0-9]+)`/,
		);
		expect(readmeSecurity).not.toBeNull();

		const checkpoints = securityPolicy.checkpoints.map(
			(checkpoint: { date: string; maxModerate: number; maxLow: number }) => ({
				date: checkpoint.date,
				maxModerate: checkpoint.maxModerate,
				maxLow: checkpoint.maxLow,
			}),
		);

		expect(checkpoints).toEqual([
			{
				date: readmeSecurity![1],
				maxModerate: Number(readmeSecurity![2]),
				maxLow: Number(readmeSecurity![3]),
			},
			{
				date: readmeSecurity![4],
				maxModerate: Number(readmeSecurity![5]),
				maxLow: Number(readmeSecurity![6]),
			},
			{
				date: readmeSecurity![7],
				maxModerate: Number(readmeSecurity![8]),
				maxLow: Number(readmeSecurity![9]),
			},
			{
				date: readmeSecurity![10],
				maxModerate: Number(readmeSecurity![11]),
				maxLow: Number(readmeSecurity![12]),
			},
			{
				date: readmeSecurity![13],
				maxModerate: Number(readmeSecurity![14]),
				maxLow: Number(readmeSecurity![15]),
			},
		]);
	});

	it('CI workflow explicitly sets the phase and runs essential gates', () => {
		expect(workflow).toContain(`QUALITY_PHASE: ${policy.defaultPhase}`);
		expect(workflow).toContain('npm run lint');
		expect(workflow).toContain('npm run typecheck:strict');
		expect(workflow).toContain('npm run build');
		expect(workflow).toContain('npm run test:coverage');
		expect(workflow).toContain('npm run validate');
	});

	it('coverage and typecheck gates are policy-driven, not hardcoded', () => {
		expect(vitestConfig).toContain('.quality/ratchet-policy.json');
		expect(vitestConfig).toContain('thresholds: coverage');
		expect(typecheckScript).toContain('.quality/ratchet-policy.json');
		expect(typecheckScript).toContain('policy.phases?.[phase]?.typecheck?.hintsMax');
	});
});
