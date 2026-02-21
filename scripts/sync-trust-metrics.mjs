import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUALITY_DIR = path.join(__dirname, '../.quality');
const OUTPUT_PATH = path.join(__dirname, '../src/data/trust-vitals.json');

async function syncVitals() {
  console.log('📡 Syncing Engineering Vitals...');

  const buildTimestamp = new Date().toISOString();
  const artifactHash = crypto.createHash('shake256', { outputLength: 4 }).update(buildTimestamp).digest('hex');

  const vitals = {
    tests: { total: 0, passed: 0, suites: 0, status: 'unknown' },
    security: { status: 'unknown', vulnerabilities: 0, lastAudit: null },
    ecosystem: { totalRepos: 0, healthy: 0, errored: 0, status: 'unknown' },
    humanImpact: { totalStudents: 2000, completionRate: 97, approval: 92 },
    generatedAt: buildTimestamp,
    fingerprint: artifactHash.toUpperCase()
  };

  // 1. Parse Tests
  try {
    const testData = JSON.parse(fs.readFileSync(path.join(QUALITY_DIR, 'vitest-report.json'), 'utf8'));
    vitals.tests = {
      total: testData.numTotalTests,
      passed: testData.numPassedTests,
      suites: testData.numTotalTestSuites,
      status: testData.success ? 'pass' : 'fail'
    };
  } catch (e) {
    console.warn('⚠️ Could not parse vitest-report.json');
  }

  // 2. Parse Security
  try {
    const secData = JSON.parse(fs.readFileSync(path.join(QUALITY_DIR, 'security-summary.json'), 'utf8'));
    vitals.security = {
      status: secData.status,
      vulnerabilities: secData.metadata.vulnerabilities.total,
      lastAudit: secData.generated
    };
  } catch (e) {
    console.warn('⚠️ Could not parse security-summary.json');
  }

  // 3. Parse Ecosystem Telemetry
  try {
    const fleetData = JSON.parse(fs.readFileSync(path.join(QUALITY_DIR, 'github-pages-telemetry.json'), 'utf8'));
    vitals.ecosystem = {
      totalRepos: fleetData.totals.repos,
      healthy: fleetData.totals.built,
      errored: fleetData.totals.errored,
      status: fleetData.syncStatus === 'ok' ? 'pass' : 'warning'
    };
  } catch (e) {
    console.warn('⚠️ Could not parse github-pages-telemetry.json');
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(vitals, null, 2));
  console.log(`✅ Trust Vitals synced to ${OUTPUT_PATH}`);
}

syncVitals().catch(console.error);
