import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ABOUT_PATH = path.join(__dirname, '../src/data/about.json');
const METRICS_PATH = path.join(__dirname, '../src/data/system-metrics.json');

/**
 * Synchronizes the system identity (about.json) with real-time metrics.
 * Prevents identity drift between the static summary and the dynamic registry.
 */
function syncIdentity() {
	if (!fs.existsSync(METRICS_PATH)) {
		console.error('❌ Metrics file not found. Run sync:vitals first.');
		return;
	}

	const about = JSON.parse(fs.readFileSync(ABOUT_PATH, 'utf8'));
	const metrics = JSON.parse(fs.readFileSync(METRICS_PATH, 'utf8'));

	const { registry, substance, documentation_words, adrs, schemas } = metrics;
	const activeRepos = registry.implementation_status.ACTIVE;
	const archivedRepos = registry.implementation_status.ARCHIVED;
	const totalRepos = registry.total_repos;

	// Build the high-fidelity summary string
	const summary = `${metrics.sprints.completed} SPRINTS COMPLETE — ${totalRepos} repos (${activeRepos} ACTIVE, ${archivedRepos} ARCHIVED), ${metrics.essays.total} published essays (~${Math.round(metrics.essays.word_count_estimate / 1000)}K words), ${metrics.sprints.completed} named sprints, 9 flagship repos, 102 CI/CD workflows, ~${Math.round(documentation_words / 1000)}K+ total words, full provenance tracking, 100% seed.yaml coverage. Omega status: ${metrics.omega.met}/17 met.`.trim();

	if (about.system_summary === summary) {
		console.log('✅ Identity is already in sync with system vitals.');
		return;
	}

	about.system_summary = summary;
	about.generated = new Date().toISOString();

	fs.writeFileSync(ABOUT_PATH, JSON.stringify(about, null, '\t'), 'utf8');
	console.log(`🚀 Identity synchronized: ${totalRepos} repos, ${metrics.omega.met}/17 Omega criteria.`);
}

syncIdentity();
