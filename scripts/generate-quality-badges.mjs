#!/usr/bin/env node

/**
 * Generate quality metric badges and structured JSON data from measured artifacts.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

function badge(label, value, color) {
  const labelWidth = label.length * 7 + 12;
  const valueWidth = value.length * 7 + 12;
  const totalWidth = labelWidth + valueWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${totalWidth}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${value}</text>
  </g>
</svg>`;
}

function scoreColor(score) {
  if (score === null) return '#9f9f9f';
  if (score >= 90) return '#4c1';
  if (score >= 70) return '#dfb317';
  return '#e05d44';
}

function statusColor(status) {
  if (status === 'pass') return '#4c1';
  if (status === 'fail') return '#e05d44';
  return '#9f9f9f';
}

function countTestFiles(dir) {
  let count = 0;
  if (!existsSync(dir)) return 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) count += countTestFiles(fullPath);
    else if (entry.name.endsWith('.test.ts')) count += 1;
  }
  return count;
}

function countHtmlFiles(dir) {
  let count = 0;
  if (!existsSync(dir)) return 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) count += countHtmlFiles(fullPath);
    else if (entry.name.endsWith('.html')) count += 1;
  }
  return count;
}

function countFiles(dir) {
  let count = 0;
  if (!existsSync(dir)) return 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) count += countFiles(fullPath);
    else count += 1;
  }
  return count;
}

function toNumberOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function average(numbers) {
  if (!numbers.length) return null;
  return Math.round(numbers.reduce((sum, value) => sum + value, 0) / numbers.length);
}

function emptyCounts() {
  return { critical: null, high: null, moderate: null, low: null, total: null };
}

function readSummaryCounts(summary) {
  const counts = summary?.unsuppressed?.counts ?? {};
  return {
    critical: toNumberOrNull(counts.critical),
    high: toNumberOrNull(counts.high),
    moderate: toNumberOrNull(counts.moderate),
    low: toNumberOrNull(counts.low),
    total: toNumberOrNull(counts.total),
  };
}

function deriveDevCounts(fullCounts, prodCounts) {
  const keys = ['critical', 'high', 'moderate', 'low', 'total'];
  const result = {};
  for (const key of keys) {
    const full = fullCounts[key];
    const prod = prodCounts[key];
    if (typeof full !== 'number' || typeof prod !== 'number') {
      result[key] = null;
      continue;
    }
    result[key] = Math.max(0, full - prod);
  }
  return result;
}

const metrics = {
  generated: new Date().toISOString(),
  tests: { total: null, passed: null, files: 0 },
  security: {
    critical: null,
    high: null,
    moderate: null,
    low: null,
    total: null,
    githubOpenAlerts: null,
    githubAdvisoryStatus: 'unknown',
    prodCounts: emptyCounts(),
    devCounts: emptyCounts(),
    allowlistActive: 0,
    policyCheckpoint: null,
    status: 'unknown',
    source: null,
    githubSource: null,
  },
  coverage: { statements: null, branches: null, functions: null, lines: null },
  lighthouse: { performance: null, accessibility: null, bestPractices: null, seo: null },
  a11y: {
    status: 'unknown',
    static: { pagesAudited: null, critical: null, serious: null, status: 'unknown' },
    runtime: {
      pagesAudited: null,
      critical: null,
      serious: null,
      focusChecks: null,
      focusFailures: null,
      routesCovered: null,
      totalRoutes: null,
      coveragePct: null,
      status: 'unknown',
    },
  },
  performance: {
    routeBudgetsStatus: 'unknown',
    chunkBudgetsStatus: 'unknown',
    interactionBudgetsStatus: 'unknown',
    routeBudgetCheckpoint: null,
    chunkBudgetCheckpoint: null,
    interactionBudgetCheckpoint: null,
    largestChunks: [],
    interactiveRouteJsTotals: {},
    routeJsTotals: {},
    source: null,
  },
  runtimeErrors: {
    status: 'unknown',
    total: null,
    uncategorized: null,
    allowlisted: null,
    source: null,
  },
  stability: {
    status: 'unknown',
    consecutiveSuccess: null,
    requiredConsecutive: null,
    source: null,
  },
  build: { pages: 0, bundleFiles: 0 },
  sources: {
    tests: '.quality/vitest-report.json',
    security: '.quality/security-summary.json',
    securityProd: '.quality/security-summary-prod.json',
    securityGithub: '.quality/github-advisory-summary.json',
    securityDrift: '.quality/security-drift-summary.json',
    coverage: 'coverage/coverage-summary.json',
    lighthouse: '.lighthouseci/lhr-*.json',
    a11yStatic: '.a11y/a11y-summary.json',
    a11yRuntime: '.a11y/runtime-summary.json',
    runtimeCoverage: '.quality/runtime-coverage-summary.json',
    e2eSmoke: '.quality/e2e-smoke-summary.json',
    runtimeErrors: '.quality/runtime-errors-summary.json',
    greenRuns: '.quality/green-run-history.json',
    ledger: '.quality/quality-ledger.json',
    policyGovernance: '.quality/policy-governance-summary.json',
    performance: '.quality/perf-summary.json + .quality/perf-budget-summary.json',
    build: 'dist/**/*.html and dist/_astro/**/*',
  },
};

metrics.tests.files = countTestFiles(resolve('src'));

const vitestReportPath = resolve('.quality/vitest-report.json');
if (existsSync(vitestReportPath)) {
  const report = JSON.parse(readFileSync(vitestReportPath, 'utf-8'));
  metrics.tests.total = toNumberOrNull(report.numTotalTests);
  metrics.tests.passed = toNumberOrNull(report.numPassedTests);
}

const securitySummaryPath = resolve('.quality/security-summary.json');
const securityProdSummaryPath = resolve('.quality/security-summary-prod.json');
const securityGithubSummaryPath = resolve('.quality/github-advisory-summary.json');
const securityFullSummary = existsSync(securitySummaryPath)
  ? JSON.parse(readFileSync(securitySummaryPath, 'utf-8'))
  : null;
const securityProdSummary = existsSync(securityProdSummaryPath)
  ? JSON.parse(readFileSync(securityProdSummaryPath, 'utf-8'))
  : null;
const securityGithubSummary = existsSync(securityGithubSummaryPath)
  ? JSON.parse(readFileSync(securityGithubSummaryPath, 'utf-8'))
  : null;

if (securityFullSummary) {
  const fullCounts = readSummaryCounts(securityFullSummary);
  metrics.security.critical = fullCounts.critical;
  metrics.security.high = fullCounts.high;
  metrics.security.moderate = fullCounts.moderate;
  metrics.security.low = fullCounts.low;
  metrics.security.total = fullCounts.total;
  metrics.security.status = typeof securityFullSummary.status === 'string' ? securityFullSummary.status : 'unknown';
  metrics.security.allowlistActive =
    toNumberOrNull(securityFullSummary?.allowlist?.activeCount)
    ?? (Array.isArray(securityFullSummary?.allowlist?.active) ? securityFullSummary.allowlist.active.length : 0);
  if (securityFullSummary.checkpoint && typeof securityFullSummary.checkpoint.date === 'string') {
    metrics.security.policyCheckpoint = {
      date: securityFullSummary.checkpoint.date,
      maxModerate: Number(securityFullSummary.checkpoint.maxModerate),
      maxLow: Number(securityFullSummary.checkpoint.maxLow),
    };
  }
  metrics.security.source = metrics.sources.security;

  const prodCounts = securityProdSummary ? readSummaryCounts(securityProdSummary) : emptyCounts();
  metrics.security.prodCounts = prodCounts;
  metrics.security.devCounts = deriveDevCounts(fullCounts, prodCounts);
}

if (securityGithubSummary) {
  metrics.security.githubAdvisoryStatus = typeof securityGithubSummary.status === 'string'
    ? securityGithubSummary.status
    : 'unknown';
  metrics.security.githubOpenAlerts = toNumberOrNull(securityGithubSummary?.counts?.total);
  metrics.security.githubSource = metrics.sources.securityGithub;

  if (metrics.security.status === 'unknown') {
    metrics.security.status = metrics.security.githubAdvisoryStatus;
  } else if (metrics.security.status === 'pass' && metrics.security.githubAdvisoryStatus === 'fail') {
    metrics.security.status = 'fail';
  }
}

const coveragePath = resolve('coverage/coverage-summary.json');
if (existsSync(coveragePath)) {
  const cov = JSON.parse(readFileSync(coveragePath, 'utf-8'));
  if (cov.total) {
    metrics.coverage.statements = Math.round(cov.total.statements.pct);
    metrics.coverage.branches = Math.round(cov.total.branches.pct);
    metrics.coverage.functions = Math.round(cov.total.functions.pct);
    metrics.coverage.lines = Math.round(cov.total.lines.pct);
  }
}

const lhciDir = resolve('.lighthouseci');
if (existsSync(lhciDir)) {
  const lhciFiles = readdirSync(lhciDir).filter((f) => f.endsWith('.json') && f.startsWith('lhr-'));
  const scores = { performance: [], accessibility: [], bestPractices: [], seo: [] };

  for (const file of lhciFiles) {
    const lhr = JSON.parse(readFileSync(join(lhciDir, file), 'utf-8'));
    if (lhr.categories?.performance) scores.performance.push(lhr.categories.performance.score * 100);
    if (lhr.categories?.accessibility) scores.accessibility.push(lhr.categories.accessibility.score * 100);
    if (lhr.categories?.['best-practices']) scores.bestPractices.push(lhr.categories['best-practices'].score * 100);
    if (lhr.categories?.seo) scores.seo.push(lhr.categories.seo.score * 100);
  }

  metrics.lighthouse.performance = average(scores.performance);
  metrics.lighthouse.accessibility = average(scores.accessibility);
  metrics.lighthouse.bestPractices = average(scores.bestPractices);
  metrics.lighthouse.seo = average(scores.seo);
}

const staticA11yPath = resolve('.a11y/a11y-summary.json');
if (existsSync(staticA11yPath)) {
  const staticA11y = JSON.parse(readFileSync(staticA11yPath, 'utf-8'));
  metrics.a11y.static.pagesAudited = toNumberOrNull(staticA11y.pagesAudited);
  metrics.a11y.static.critical = toNumberOrNull(staticA11y.critical);
  metrics.a11y.static.serious = toNumberOrNull(staticA11y.serious);
  metrics.a11y.static.status = typeof staticA11y.status === 'string' ? staticA11y.status : 'unknown';
}

const runtimeA11yPath = resolve('.a11y/runtime-summary.json');
if (existsSync(runtimeA11yPath)) {
  const runtimeA11y = JSON.parse(readFileSync(runtimeA11yPath, 'utf-8'));
  metrics.a11y.runtime.pagesAudited = toNumberOrNull(runtimeA11y.pagesAudited);
  metrics.a11y.runtime.critical = toNumberOrNull(runtimeA11y.critical);
  metrics.a11y.runtime.serious = toNumberOrNull(runtimeA11y.serious);
  metrics.a11y.runtime.focusChecks = toNumberOrNull(runtimeA11y.focusChecks);
  metrics.a11y.runtime.focusFailures = toNumberOrNull(runtimeA11y.focusFailures);
  metrics.a11y.runtime.status = typeof runtimeA11y.status === 'string' ? runtimeA11y.status : 'unknown';
}

const runtimeCoveragePath = resolve('.quality/runtime-coverage-summary.json');
if (existsSync(runtimeCoveragePath)) {
  const runtimeCoverage = JSON.parse(readFileSync(runtimeCoveragePath, 'utf-8'));
  metrics.a11y.runtime.routesCovered = toNumberOrNull(runtimeCoverage.routesCovered);
  metrics.a11y.runtime.totalRoutes = toNumberOrNull(runtimeCoverage.totalRoutes);
  metrics.a11y.runtime.coveragePct = toNumberOrNull(runtimeCoverage.coveragePct);
}

const perfSummaryPath = resolve('.quality/perf-summary.json');
if (existsSync(perfSummaryPath)) {
  const perfSummary = JSON.parse(readFileSync(perfSummaryPath, 'utf-8'));
  metrics.performance.largestChunks = Array.isArray(perfSummary.largestChunks)
    ? perfSummary.largestChunks.slice(0, 10).map((chunk) => ({
      chunk: chunk.chunk,
      gzipBytes: chunk.gzipBytes,
    }))
    : [];
  metrics.performance.routeJsTotals = perfSummary.routeJsTotals ?? {};
  metrics.performance.interactiveRouteJsTotals = perfSummary.interactiveRouteJsTotals ?? {};
  metrics.performance.source = metrics.sources.performance;
}

const perfBudgetPath = resolve('.quality/perf-budget-summary.json');
if (existsSync(perfBudgetPath)) {
  const perfBudget = JSON.parse(readFileSync(perfBudgetPath, 'utf-8'));
  metrics.performance.routeBudgetsStatus = typeof perfBudget.routeBudgetsStatus === 'string'
    ? perfBudget.routeBudgetsStatus
    : (typeof perfBudget.status === 'string' ? perfBudget.status : 'unknown');
  metrics.performance.chunkBudgetsStatus = typeof perfBudget.chunkBudgetsStatus === 'string'
    ? perfBudget.chunkBudgetsStatus
    : 'unknown';
  metrics.performance.interactionBudgetsStatus = typeof perfBudget.interactionBudgetsStatus === 'string'
    ? perfBudget.interactionBudgetsStatus
    : 'unknown';
  metrics.performance.routeBudgetCheckpoint =
    perfBudget?.routeThresholdCheckpoint && typeof perfBudget.routeThresholdCheckpoint.date === 'string'
      ? { date: perfBudget.routeThresholdCheckpoint.date }
      : null;
  metrics.performance.chunkBudgetCheckpoint =
    perfBudget?.chunkThresholdCheckpoint && typeof perfBudget.chunkThresholdCheckpoint.date === 'string'
      ? { date: perfBudget.chunkThresholdCheckpoint.date }
      : null;
  metrics.performance.interactionBudgetCheckpoint =
    perfBudget?.interactionThresholdCheckpoint && typeof perfBudget.interactionThresholdCheckpoint.date === 'string'
      ? { date: perfBudget.interactionThresholdCheckpoint.date }
      : null;
}

const runtimeErrorsPath = resolve('.quality/runtime-errors-summary.json');
if (existsSync(runtimeErrorsPath)) {
  const runtimeErrors = JSON.parse(readFileSync(runtimeErrorsPath, 'utf-8'));
  metrics.runtimeErrors.status = typeof runtimeErrors.status === 'string' ? runtimeErrors.status : 'unknown';
  metrics.runtimeErrors.total = toNumberOrNull(runtimeErrors?.counts?.total);
  metrics.runtimeErrors.uncategorized = toNumberOrNull(runtimeErrors?.counts?.uncategorized);
  metrics.runtimeErrors.allowlisted = toNumberOrNull(runtimeErrors?.counts?.allowlisted);
  metrics.runtimeErrors.source = metrics.sources.runtimeErrors;
}

const greenRunsPath = resolve('.quality/green-run-history.json');
if (existsSync(greenRunsPath)) {
  const greenRuns = JSON.parse(readFileSync(greenRunsPath, 'utf-8'));
  metrics.stability.status = typeof greenRuns.status === 'string' ? greenRuns.status : 'unknown';
  metrics.stability.consecutiveSuccess = toNumberOrNull(greenRuns.consecutiveSuccess);
  metrics.stability.requiredConsecutive = toNumberOrNull(greenRuns.requiredConsecutive);
  metrics.stability.source = metrics.sources.greenRuns;
}

const a11yStates = [metrics.a11y.static.status, metrics.a11y.runtime.status].filter((state) => state !== 'unknown');
metrics.a11y.status = a11yStates.length === 0
  ? 'unknown'
  : (a11yStates.every((state) => state === 'pass') ? 'pass' : 'fail');

metrics.build.pages = countHtmlFiles(resolve('dist'));
metrics.build.bundleFiles = countFiles(resolve('dist/_astro'));

const badgesDir = resolve('public/badges');
mkdirSync(badgesDir, { recursive: true });

const coverageScore = metrics.coverage.lines ?? metrics.coverage.statements;
const testsBadge = metrics.tests.total === null || metrics.tests.passed === null
  ? `${metrics.tests.files} files`
  : `${metrics.tests.passed}/${metrics.tests.total}`;
const perfBudgetOverall = [
  metrics.performance.routeBudgetsStatus,
  metrics.performance.chunkBudgetsStatus,
  metrics.performance.interactionBudgetsStatus,
].every((status) => status === 'pass')
  ? 'pass'
  : [metrics.performance.routeBudgetsStatus, metrics.performance.chunkBudgetsStatus, metrics.performance.interactionBudgetsStatus].includes('fail')
    ? 'fail'
    : 'unknown';

writeFileSync(join(badgesDir, 'tests.svg'), badge('tests', testsBadge, '#4c1'));
writeFileSync(
  join(badgesDir, 'coverage.svg'),
  badge('coverage', coverageScore === null ? 'n/a' : `${coverageScore}%`, scoreColor(coverageScore))
);
writeFileSync(
  join(badgesDir, 'lighthouse-perf.svg'),
  badge(
    'performance',
    metrics.lighthouse.performance === null ? 'n/a' : `${metrics.lighthouse.performance}`,
    scoreColor(metrics.lighthouse.performance)
  )
);
writeFileSync(
  join(badgesDir, 'lighthouse-a11y.svg'),
  badge(
    'accessibility',
    metrics.lighthouse.accessibility === null ? 'n/a' : `${metrics.lighthouse.accessibility}`,
    scoreColor(metrics.lighthouse.accessibility)
  )
);
writeFileSync(
  join(badgesDir, 'lighthouse-seo.svg'),
  badge('SEO', metrics.lighthouse.seo === null ? 'n/a' : `${metrics.lighthouse.seo}`, scoreColor(metrics.lighthouse.seo))
);
writeFileSync(join(badgesDir, 'a11y.svg'), badge('a11y', metrics.a11y.status, statusColor(metrics.a11y.status)));
writeFileSync(join(badgesDir, 'security.svg'), badge('security', metrics.security.status, statusColor(metrics.security.status)));
writeFileSync(join(badgesDir, 'perf-budgets.svg'), badge('perf-budgets', perfBudgetOverall, statusColor(perfBudgetOverall)));
writeFileSync(join(badgesDir, 'pages.svg'), badge('pages', `${metrics.build.pages}`, '#007ec6'));

writeFileSync(resolve('src/data/quality-metrics.json'), JSON.stringify(metrics, null, 2) + '\n');

console.log('Generated quality badges and metrics:');
console.log(`  Tests: ${metrics.tests.passed ?? 'n/a'}/${metrics.tests.total ?? 'n/a'} (files=${metrics.tests.files})`);
console.log(
  `  Security: status=${metrics.security.status} critical=${metrics.security.critical ?? 'n/a'} high=${metrics.security.high ?? 'n/a'} moderate=${metrics.security.moderate ?? 'n/a'} low=${metrics.security.low ?? 'n/a'} githubAlerts=${metrics.security.githubOpenAlerts ?? 'n/a'}`
);
console.log(`  Coverage: ${coverageScore === null ? 'n/a' : `${coverageScore}%`}`);
console.log(
  `  Lighthouse: perf=${metrics.lighthouse.performance ?? 'n/a'} a11y=${metrics.lighthouse.accessibility ?? 'n/a'} seo=${metrics.lighthouse.seo ?? 'n/a'}`
);
console.log(
  `  A11y runtime coverage: ${metrics.a11y.runtime.routesCovered ?? 'n/a'}/${metrics.a11y.runtime.totalRoutes ?? 'n/a'} (${metrics.a11y.runtime.coveragePct ?? 'n/a'}%)`
);
console.log(
  `  Perf budgets: route=${metrics.performance.routeBudgetsStatus} chunk=${metrics.performance.chunkBudgetsStatus} interaction=${metrics.performance.interactionBudgetsStatus}`
);
console.log(
  `  Runtime errors: status=${metrics.runtimeErrors.status} total=${metrics.runtimeErrors.total ?? 'n/a'} uncategorized=${metrics.runtimeErrors.uncategorized ?? 'n/a'}`
);
console.log(
  `  Green runs: ${metrics.stability.consecutiveSuccess ?? 'n/a'}/${metrics.stability.requiredConsecutive ?? 'n/a'} (${metrics.stability.status})`
);
console.log(`  Build: pages=${metrics.build.pages} bundleFiles=${metrics.build.bundleFiles}`);
