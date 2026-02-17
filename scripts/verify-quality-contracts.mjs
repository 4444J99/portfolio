#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const paths = {
  metrics: resolve('src/data/quality-metrics.json'),
  vitest: resolve('.quality/vitest-report.json'),
  security: resolve('.quality/security-summary.json'),
  securityProd: resolve('.quality/security-summary-prod.json'),
  securityGithub: resolve('.quality/github-advisory-summary.json'),
  securityDrift: resolve('.quality/security-drift-summary.json'),
  securityRaw: resolve('.quality/security-audit-raw.json'),
  securityProdRaw: resolve('.quality/security-audit-prod-raw.json'),
  securityPolicy: resolve('.quality/security-policy.json'),
  securityRegister: resolve('.quality/security-register.json'),
  coverage: resolve('coverage/coverage-summary.json'),
  staticA11y: resolve('.a11y/a11y-summary.json'),
  runtimeA11y: resolve('.a11y/runtime-summary.json'),
  runtimeCoverage: resolve('.quality/runtime-coverage-summary.json'),
  e2eSmoke: resolve('.quality/e2e-smoke-summary.json'),
  runtimeErrors: resolve('.quality/runtime-errors-summary.json'),
  greenRuns: resolve('.quality/green-run-history.json'),
  perfSummary: resolve('.quality/perf-summary.json'),
  perfBudget: resolve('.quality/perf-budget-summary.json'),
  lighthouseDir: resolve('.lighthouseci'),
  dist: resolve('dist'),
};

const errors = [];

function fail(message) {
  errors.push(message);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function countHtmlFiles(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) total += countHtmlFiles(fullPath);
    else if (entry.name.endsWith('.html')) total += 1;
  }
  return total;
}

function countFiles(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) total += countFiles(fullPath);
    else total += 1;
  }
  return total;
}

function average(arr) {
  if (!arr.length) return null;
  return Math.round(arr.reduce((acc, value) => acc + value, 0) / arr.length);
}

function toNullableNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

for (const [key, path] of Object.entries(paths)) {
  if (!existsSync(path)) fail(`Missing ${key} artifact: ${path}`);
}

if (errors.length) {
  console.error('Quality contract failed: required artifacts missing.');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const metrics = readJson(paths.metrics);
const vitestReport = readJson(paths.vitest);
const securitySummary = readJson(paths.security);
const securityProdSummary = readJson(paths.securityProd);
const securityGithubSummary = readJson(paths.securityGithub);
const securityDriftSummary = readJson(paths.securityDrift);
const securityPolicy = readJson(paths.securityPolicy);
const securityRegister = readJson(paths.securityRegister);
const coverage = readJson(paths.coverage);
const staticA11y = readJson(paths.staticA11y);
const runtimeA11y = readJson(paths.runtimeA11y);
const runtimeCoverage = readJson(paths.runtimeCoverage);
const e2eSmoke = readJson(paths.e2eSmoke);
const runtimeErrors = readJson(paths.runtimeErrors);
const greenRuns = readJson(paths.greenRuns);
const perfSummary = readJson(paths.perfSummary);
const perfBudget = readJson(paths.perfBudget);

const requiredSourceKeys = [
  'tests',
  'security',
  'securityProd',
  'securityGithub',
  'securityDrift',
  'coverage',
  'lighthouse',
  'a11yStatic',
  'a11yRuntime',
  'runtimeCoverage',
  'e2eSmoke',
  'runtimeErrors',
  'greenRuns',
  'ledger',
  'policyGovernance',
  'performance',
  'build',
];
for (const key of requiredSourceKeys) {
  if (typeof metrics.sources?.[key] !== 'string') {
    fail(`metrics.sources.${key} missing or not string`);
  }
}

if (metrics.tests.total !== vitestReport.numTotalTests) {
  fail(`tests.total mismatch: metrics=${metrics.tests.total}, report=${vitestReport.numTotalTests}`);
}
if (metrics.tests.passed !== vitestReport.numPassedTests) {
  fail(`tests.passed mismatch: metrics=${metrics.tests.passed}, report=${vitestReport.numPassedTests}`);
}

const fullCounts = securitySummary?.unsuppressed?.counts ?? {};
const prodCounts = securityProdSummary?.unsuppressed?.counts ?? {};

const securityPairs = [
  ['critical', toNullableNumber(fullCounts.critical)],
  ['high', toNullableNumber(fullCounts.high)],
  ['moderate', toNullableNumber(fullCounts.moderate)],
  ['low', toNullableNumber(fullCounts.low)],
  ['total', toNullableNumber(fullCounts.total)],
  ['status', securitySummary.status],
  ['allowlistActive', toNullableNumber(securitySummary?.allowlist?.activeCount) ?? 0],
];

for (const [field, expected] of securityPairs) {
  if (metrics.security[field] !== expected) {
    fail(`security.${field} mismatch: metrics=${metrics.security[field]}, summary=${expected}`);
  }
}

const githubOpenAlerts = toNullableNumber(securityGithubSummary?.counts?.total);
if (metrics.security.githubOpenAlerts !== githubOpenAlerts) {
  fail(`security.githubOpenAlerts mismatch: metrics=${metrics.security.githubOpenAlerts}, summary=${githubOpenAlerts}`);
}
if (metrics.security.githubAdvisoryStatus !== securityGithubSummary.status) {
  fail(`security.githubAdvisoryStatus mismatch: metrics=${metrics.security.githubAdvisoryStatus}, summary=${securityGithubSummary.status}`);
}
if (securityDriftSummary.status !== 'pass') {
  fail(`security drift summary status is ${securityDriftSummary.status}`);
}

const prodPairs = [
  ['critical', toNullableNumber(prodCounts.critical)],
  ['high', toNullableNumber(prodCounts.high)],
  ['moderate', toNullableNumber(prodCounts.moderate)],
  ['low', toNullableNumber(prodCounts.low)],
  ['total', toNullableNumber(prodCounts.total)],
];
for (const [field, expected] of prodPairs) {
  if (metrics.security.prodCounts[field] !== expected) {
    fail(`security.prodCounts.${field} mismatch: metrics=${metrics.security.prodCounts[field]}, summary=${expected}`);
  }
}

const expectedDevCounts = {
  critical: typeof fullCounts.critical === 'number' && typeof prodCounts.critical === 'number' ? Math.max(0, fullCounts.critical - prodCounts.critical) : null,
  high: typeof fullCounts.high === 'number' && typeof prodCounts.high === 'number' ? Math.max(0, fullCounts.high - prodCounts.high) : null,
  moderate: typeof fullCounts.moderate === 'number' && typeof prodCounts.moderate === 'number' ? Math.max(0, fullCounts.moderate - prodCounts.moderate) : null,
  low: typeof fullCounts.low === 'number' && typeof prodCounts.low === 'number' ? Math.max(0, fullCounts.low - prodCounts.low) : null,
  total: typeof fullCounts.total === 'number' && typeof prodCounts.total === 'number' ? Math.max(0, fullCounts.total - prodCounts.total) : null,
};
for (const field of ['critical', 'high', 'moderate', 'low', 'total']) {
  if (metrics.security.devCounts[field] !== expectedDevCounts[field]) {
    fail(`security.devCounts.${field} mismatch: metrics=${metrics.security.devCounts[field]}, expected=${expectedDevCounts[field]}`);
  }
}

if (securitySummary.status !== 'pass') {
  fail(`security summary status is ${securitySummary.status}`);
}
if (securityProdSummary.status !== 'pass') {
  fail(`security prod summary status is ${securityProdSummary.status}`);
}

if (!metrics.security.policyCheckpoint || typeof metrics.security.policyCheckpoint.date !== 'string') {
  fail('security.policyCheckpoint missing in metrics');
} else {
  const checkpointDate = metrics.security.policyCheckpoint.date;
  const checkpoint = Array.isArray(securityPolicy.checkpoints)
    ? securityPolicy.checkpoints.find((entry) => entry.date === checkpointDate)
    : null;

  if (!checkpoint) {
    fail(`security.policyCheckpoint date ${checkpointDate} missing from security policy`);
  }
}

const requiredSprintDates = ['2026-02-21', '2026-02-28', '2026-03-07', '2026-03-14', '2026-03-18'];
const registerCheckpoints = Array.isArray(securityRegister.checkpoints) ? securityRegister.checkpoints : [];
for (const date of requiredSprintDates) {
  if (!registerCheckpoints.some((checkpoint) => checkpoint?.date === date)) {
    fail(`security register missing checkpoint date ${date}`);
  }
}

const vulnerabilityFamilies = Array.isArray(securityRegister.vulnerabilityFamilies)
  ? securityRegister.vulnerabilityFamilies
  : [];
if (vulnerabilityFamilies.length === 0) {
  fail('security register has no vulnerabilityFamilies entries');
}
for (const family of vulnerabilityFamilies) {
  if (typeof family.family !== 'string' || family.family.trim().length === 0) {
    fail('security register vulnerability family missing `family` name');
  }
  if (typeof family.owner !== 'string' || family.owner.trim().length === 0) {
    fail(`security register family ${family.family ?? 'unknown'} missing owner`);
  }
  if (typeof family.eta !== 'string' || !Number.isFinite(Date.parse(family.eta))) {
    fail(`security register family ${family.family ?? 'unknown'} has invalid ETA`);
  }
  if (typeof family.status !== 'string' || family.status.trim().length === 0) {
    fail(`security register family ${family.family ?? 'unknown'} missing status`);
  }
}

const rollbackPolicy = securityRegister.rollbackPolicy ?? null;
if (!rollbackPolicy || typeof rollbackPolicy !== 'object') {
  fail('security register missing rollbackPolicy');
} else {
  if (typeof rollbackPolicy.intent !== 'string' || rollbackPolicy.intent.trim().length === 0) {
    fail('security register rollbackPolicy.intent missing');
  }
  if (!Number.isFinite(rollbackPolicy.maxRelaxationDays) || rollbackPolicy.maxRelaxationDays > 14) {
    fail('security register rollbackPolicy.maxRelaxationDays must be <=14');
  }
  if (!Array.isArray(rollbackPolicy.requirements) || rollbackPolicy.requirements.length === 0) {
    fail('security register rollbackPolicy.requirements missing');
  }
}

if ((securityRegister.exitCriteria?.consecutiveGreenRuns ?? null) !== 5) {
  fail('security register exitCriteria.consecutiveGreenRuns must equal 5');
}

const coveragePairs = [
  ['statements', Math.round(coverage.total.statements.pct)],
  ['branches', Math.round(coverage.total.branches.pct)],
  ['functions', Math.round(coverage.total.functions.pct)],
  ['lines', Math.round(coverage.total.lines.pct)],
];

for (const [metric, expected] of coveragePairs) {
  if (metrics.coverage[metric] !== expected) {
    fail(`coverage.${metric} mismatch: metrics=${metrics.coverage[metric]}, summary=${expected}`);
  }
}

const staticPairs = [
  ['pagesAudited', staticA11y.pagesAudited],
  ['critical', staticA11y.critical],
  ['serious', staticA11y.serious],
  ['status', staticA11y.status],
];
for (const [field, expected] of staticPairs) {
  if (metrics.a11y.static[field] !== expected) {
    fail(`a11y.static.${field} mismatch: metrics=${metrics.a11y.static[field]}, summary=${expected}`);
  }
}

const runtimePairs = [
  ['pagesAudited', toNullableNumber(runtimeA11y.pagesAudited)],
  ['critical', toNullableNumber(runtimeA11y.critical)],
  ['serious', toNullableNumber(runtimeA11y.serious)],
  ['focusChecks', toNullableNumber(runtimeA11y.focusChecks)],
  ['focusFailures', toNullableNumber(runtimeA11y.focusFailures)],
  ['routesCovered', toNullableNumber(runtimeCoverage.routesCovered)],
  ['totalRoutes', toNullableNumber(runtimeCoverage.totalRoutes)],
  ['coveragePct', toNullableNumber(runtimeCoverage.coveragePct)],
  ['status', runtimeA11y.status],
];
for (const [field, expected] of runtimePairs) {
  if (metrics.a11y.runtime[field] !== expected) {
    fail(`a11y.runtime.${field} mismatch: metrics=${metrics.a11y.runtime[field]}, summary=${expected}`);
  }
}

if (e2eSmoke.status !== 'pass') {
  fail(`e2e smoke status is ${e2eSmoke.status}`);
}
if ((e2eSmoke.unexpected ?? 0) > 0) {
  fail(`e2e smoke unexpected failures detected: ${e2eSmoke.unexpected}`);
}
if ((e2eSmoke.flaky ?? 0) > 0) {
  fail(`e2e smoke flaky tests detected: ${e2eSmoke.flaky}`);
}

if (runtimeErrors.status !== 'pass') {
  fail(`runtime error telemetry status is ${runtimeErrors.status}`);
}
if ((runtimeErrors?.counts?.uncategorized ?? 0) > 0) {
  fail(`runtime error telemetry uncategorized errors detected: ${runtimeErrors.counts.uncategorized}`);
}

if (metrics.runtimeErrors.status !== runtimeErrors.status) {
  fail(`runtimeErrors.status mismatch: metrics=${metrics.runtimeErrors.status}, summary=${runtimeErrors.status}`);
}
if (metrics.runtimeErrors.total !== toNullableNumber(runtimeErrors?.counts?.total)) {
  fail(`runtimeErrors.total mismatch: metrics=${metrics.runtimeErrors.total}, summary=${toNullableNumber(runtimeErrors?.counts?.total)}`);
}
if (metrics.runtimeErrors.uncategorized !== toNullableNumber(runtimeErrors?.counts?.uncategorized)) {
  fail(`runtimeErrors.uncategorized mismatch: metrics=${metrics.runtimeErrors.uncategorized}, summary=${toNullableNumber(runtimeErrors?.counts?.uncategorized)}`);
}
if (metrics.runtimeErrors.allowlisted !== toNullableNumber(runtimeErrors?.counts?.allowlisted)) {
  fail(`runtimeErrors.allowlisted mismatch: metrics=${metrics.runtimeErrors.allowlisted}, summary=${toNullableNumber(runtimeErrors?.counts?.allowlisted)}`);
}

if (metrics.stability.status !== greenRuns.status) {
  fail(`stability.status mismatch: metrics=${metrics.stability.status}, summary=${greenRuns.status}`);
}
if (metrics.stability.consecutiveSuccess !== toNullableNumber(greenRuns.consecutiveSuccess)) {
  fail(`stability.consecutiveSuccess mismatch: metrics=${metrics.stability.consecutiveSuccess}, summary=${toNullableNumber(greenRuns.consecutiveSuccess)}`);
}
if (metrics.stability.requiredConsecutive !== toNullableNumber(greenRuns.requiredConsecutive)) {
  fail(`stability.requiredConsecutive mismatch: metrics=${metrics.stability.requiredConsecutive}, summary=${toNullableNumber(greenRuns.requiredConsecutive)}`);
}

if (metrics.performance.routeBudgetsStatus !== perfBudget.routeBudgetsStatus) {
  fail(`performance.routeBudgetsStatus mismatch: metrics=${metrics.performance.routeBudgetsStatus}, summary=${perfBudget.routeBudgetsStatus}`);
}
if (metrics.performance.chunkBudgetsStatus !== perfBudget.chunkBudgetsStatus) {
  fail(`performance.chunkBudgetsStatus mismatch: metrics=${metrics.performance.chunkBudgetsStatus}, summary=${perfBudget.chunkBudgetsStatus}`);
}
if (metrics.performance.interactionBudgetsStatus !== perfBudget.interactionBudgetsStatus) {
  fail(`performance.interactionBudgetsStatus mismatch: metrics=${metrics.performance.interactionBudgetsStatus}, summary=${perfBudget.interactionBudgetsStatus}`);
}
const routeCheckpointDate = perfBudget?.routeThresholdCheckpoint?.date ?? null;
const chunkCheckpointDate = perfBudget?.chunkThresholdCheckpoint?.date ?? null;
const interactionCheckpointDate = perfBudget?.interactionThresholdCheckpoint?.date ?? null;

if ((metrics.performance.routeBudgetCheckpoint?.date ?? null) !== routeCheckpointDate) {
  fail(`performance.routeBudgetCheckpoint mismatch: metrics=${metrics.performance.routeBudgetCheckpoint?.date ?? null}, summary=${routeCheckpointDate}`);
}
if ((metrics.performance.chunkBudgetCheckpoint?.date ?? null) !== chunkCheckpointDate) {
  fail(`performance.chunkBudgetCheckpoint mismatch: metrics=${metrics.performance.chunkBudgetCheckpoint?.date ?? null}, summary=${chunkCheckpointDate}`);
}
if ((metrics.performance.interactionBudgetCheckpoint?.date ?? null) !== interactionCheckpointDate) {
  fail(`performance.interactionBudgetCheckpoint mismatch: metrics=${metrics.performance.interactionBudgetCheckpoint?.date ?? null}, summary=${interactionCheckpointDate}`);
}

const expectedLargestChunks = Array.isArray(perfSummary.largestChunks)
  ? perfSummary.largestChunks.slice(0, 10).map((chunk) => ({ chunk: chunk.chunk, gzipBytes: chunk.gzipBytes }))
  : [];
if (JSON.stringify(metrics.performance.largestChunks) !== JSON.stringify(expectedLargestChunks)) {
  fail('performance.largestChunks mismatch with perf summary');
}
if (JSON.stringify(metrics.performance.routeJsTotals) !== JSON.stringify(perfSummary.routeJsTotals ?? {})) {
  fail('performance.routeJsTotals mismatch with perf summary');
}
if (JSON.stringify(metrics.performance.interactiveRouteJsTotals) !== JSON.stringify(perfSummary.interactiveRouteJsTotals ?? {})) {
  fail('performance.interactiveRouteJsTotals mismatch with perf summary');
}

const lhrFiles = readdirSync(paths.lighthouseDir).filter((name) => name.startsWith('lhr-') && name.endsWith('.json'));
if (!lhrFiles.length) {
  fail('No Lighthouse JSON files found (expected lhr-*.json files).');
} else {
  const scores = {
    performance: [],
    accessibility: [],
    bestPractices: [],
    seo: [],
  };

  for (const file of lhrFiles) {
    const lhr = readJson(join(paths.lighthouseDir, file));
    if (lhr.categories?.performance?.score !== undefined) scores.performance.push(lhr.categories.performance.score * 100);
    if (lhr.categories?.accessibility?.score !== undefined) scores.accessibility.push(lhr.categories.accessibility.score * 100);
    if (lhr.categories?.['best-practices']?.score !== undefined) scores.bestPractices.push(lhr.categories['best-practices'].score * 100);
    if (lhr.categories?.seo?.score !== undefined) scores.seo.push(lhr.categories.seo.score * 100);
  }

  const lhPairs = [
    ['performance', average(scores.performance)],
    ['accessibility', average(scores.accessibility)],
    ['bestPractices', average(scores.bestPractices)],
    ['seo', average(scores.seo)],
  ];

  for (const [metric, expected] of lhPairs) {
    if (metrics.lighthouse[metric] !== expected) {
      fail(`lighthouse.${metric} mismatch: metrics=${metrics.lighthouse[metric]}, recomputed=${expected}`);
    }
  }
}

const htmlPageCount = countHtmlFiles(paths.dist);
if (metrics.build.pages !== htmlPageCount) {
  fail(`build.pages mismatch: metrics=${metrics.build.pages}, dist=${htmlPageCount}`);
}

const bundleCount = existsSync(resolve('dist/_astro')) ? countFiles(resolve('dist/_astro')) : 0;
if (metrics.build.bundleFiles !== bundleCount) {
  fail(`build.bundleFiles mismatch: metrics=${metrics.build.bundleFiles}, dist/_astro=${bundleCount}`);
}

const sourceTimes = [
  paths.vitest,
  paths.security,
  paths.securityProd,
  paths.securityGithub,
  paths.securityDrift,
  paths.securityRaw,
  paths.securityProdRaw,
  paths.coverage,
  paths.staticA11y,
  paths.runtimeA11y,
  paths.runtimeCoverage,
  paths.e2eSmoke,
  paths.runtimeErrors,
  paths.greenRuns,
  paths.perfSummary,
  paths.perfBudget,
  ...lhrFiles.map((file) => join(paths.lighthouseDir, file)),
].map((path) => statSync(path).mtimeMs);

const latestSourceMtime = Math.max(...sourceTimes);
const metricsGenerated = Date.parse(metrics.generated);
if (!Number.isFinite(metricsGenerated)) {
  fail(`metrics.generated is not a valid timestamp: ${metrics.generated}`);
} else {
  const freshnessLagMs = latestSourceMtime - metricsGenerated;
  if (freshnessLagMs > 120000) {
    fail(`metrics are stale by ${(freshnessLagMs / 1000).toFixed(1)}s; regenerate with npm run generate-badges`);
  }
}

if (errors.length) {
  console.error('Quality contract verification failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Quality contract verification passed.');
