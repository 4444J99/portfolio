import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUALITY_DIR = path.join(__dirname, '../.quality');
const DATA_DIR = path.join(__dirname, '../src/data');
const VITALS_PATH = path.join(DATA_DIR, 'vitals.json');
const TRUST_VITALS_PATH = path.join(DATA_DIR, 'trust-vitals.json');
const SYSTEM_METRICS_PATH = path.join(DATA_DIR, 'system-metrics.json');
const HUMAN_IMPACT_PATH = path.join(DATA_DIR, 'human-impact.json');

async function syncVitals() {
	console.log('📡 Syncing Engineering Vitals...');

	const buildTimestamp = new Date().toISOString();
	const artifactHash = crypto
		.createHash('shake256', { outputLength: 4 })
		.update(buildTimestamp)
		.digest('hex');

	const trustVitals = {
		tests: { total: 0, passed: 0, suites: 0, status: 'unknown' },
		security: { status: 'unknown', vulnerabilities: 0, lastAudit: null },
		ecosystem: { totalRepos: 0, healthy: 0, errored: 0, status: 'unknown' },
		humanImpact: JSON.parse(fs.readFileSync(HUMAN_IMPACT_PATH, 'utf8')),
		generatedAt: buildTimestamp,
		fingerprint: artifactHash.toUpperCase(),
		strikes: { total: 0, conversionRate: 0 },
	};

	// 0. Parse Strike Log
	try {
		const OPERATIVE_LOG_PATH = path.join(DATA_DIR, 'operative-log.json');
		if (fs.existsSync(OPERATIVE_LOG_PATH)) {
			const logData = JSON.parse(fs.readFileSync(OPERATIVE_LOG_PATH, 'utf8'));
			trustVitals.strikes = {
				total: logData.global_stats.total_strikes,
				conversionRate: logData.global_stats.conversion_rate
			};
		}
	} catch (e) {
		console.warn('⚠️ Could not parse operative-log.json');
	}

	// 1. Parse Tests
	try {
		const testData = JSON.parse(
			fs.readFileSync(path.join(QUALITY_DIR, 'vitest-report.json'), 'utf8'),
		);
		trustVitals.tests = {
			total: testData.numTotalTests,
			passed: testData.numPassedTests,
			suites: testData.numTotalTestSuites,
			status: testData.success ? 'pass' : 'fail',
		};
	} catch (e) {
		console.warn('⚠️ Could not parse vitest-report.json');
	}

	// 2. Parse Security
	try {
		const secData = JSON.parse(
			fs.readFileSync(path.join(QUALITY_DIR, 'security-summary.json'), 'utf8'),
		);
		trustVitals.security = {
			status: secData.status,
			vulnerabilities: secData.metadata.vulnerabilities.total,
			lastAudit: secData.generated,
		};
	} catch (e) {
		console.warn('⚠️ Could not parse security-summary.json');
	}

	// 3. Parse Ecosystem Telemetry
	try {
		const fleetData = JSON.parse(
			fs.readFileSync(path.join(QUALITY_DIR, 'github-pages-telemetry.json'), 'utf8'),
		);
		trustVitals.ecosystem = {
			totalRepos: fleetData.totals.repos,
			healthy: fleetData.totals.built,
			errored: fleetData.totals.errored,
			status: fleetData.syncStatus === 'ok' ? 'pass' : 'warning',
		};
	} catch (e) {
		console.warn('⚠️ Could not parse github-pages-telemetry.json');
	}

	fs.writeFileSync(TRUST_VITALS_PATH, JSON.stringify(trustVitals, null, 2));
	console.log(`✅ Trust Vitals synced to ${TRUST_VITALS_PATH}`);

	// 4. Derive vitals.json from system-metrics.json
	try {
		const metrics = JSON.parse(fs.readFileSync(SYSTEM_METRICS_PATH, 'utf8'));
		
		const vitals = {
			repos: {
				total: metrics.registry.total_repos,
				active: metrics.registry.implementation_status.ACTIVE,
				orgs: metrics.registry.total_organs
			},
			substance: {
				code_files: metrics.substance?.code_files || (metrics.registry.total_repos * 20),
				test_files: metrics.substance?.test_files || Math.round(metrics.automated_tests / 5),
				automated_tests: metrics.automated_tests,
				ci_passing: metrics.registry.ci_coverage,
				ci_coverage_pct: Math.round((metrics.registry.ci_coverage / metrics.registry.total_repos) * 100)
			},
			logos: {
				essays: metrics.essays.total,
				words: metrics.documentation_words
			},
			timestamp: metrics.generated
		};

		fs.writeFileSync(VITALS_PATH, JSON.stringify(vitals, null, 2));
		console.log(`✅ Derived Vitals synced to ${VITALS_PATH}`);

		// 5. Update landing.json metrics from system-metrics.json
		const LANDING_PATH = path.join(DATA_DIR, 'landing.json');
		if (fs.existsSync(LANDING_PATH)) {
			const landing = JSON.parse(fs.readFileSync(LANDING_PATH, 'utf8'));
			landing.metrics = {
				total_repos: metrics.registry.total_repos,
				active_repos: metrics.registry.implementation_status.ACTIVE,
				archived_repos: metrics.registry.implementation_status.ARCHIVED,
				dependency_edges: metrics.registry.dependency_edges,
				ci_workflows: metrics.ci_workflows,
				operational_organs: metrics.registry.operational_organs,
				sprints_completed: metrics.sprints.completed
			};
			landing.generated = metrics.generated;
			fs.writeFileSync(LANDING_PATH, JSON.stringify(landing, null, 2));
			console.log(`✅ Landing Metrics synced to ${LANDING_PATH}`);
		}
	} catch (e) {
		console.error('❌ Failed to derive metrics from system-metrics.json:', e.message);
	}
}

syncVitals().catch(console.error);
