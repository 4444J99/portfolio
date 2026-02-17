#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const args = process.argv.slice(2);
const BASELINE_MIN_COVERAGE = 75;
const COVERAGE_CHECKPOINTS = [
  { date: '2026-02-25', minCoveragePct: 85 },
  { date: '2026-03-04', minCoveragePct: 95 },
  { date: '2026-03-18', minCoveragePct: 100 },
];

function parseOption(name, fallback = null) {
  const eq = args.find((entry) => entry.startsWith(`--${name}=`));
  if (eq) return eq.split('=')[1] ?? fallback;
  const index = args.indexOf(`--${name}`);
  if (index >= 0) return args[index + 1] ?? fallback;
  return fallback;
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

function parseDateOrNull(value) {
  if (!value || typeof value !== 'string') return null;
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : null;
}

function resolveMinCoverage(referenceTime) {
  const sorted = [...COVERAGE_CHECKPOINTS].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  const reached = sorted.filter((checkpoint) => Date.parse(checkpoint.date) <= referenceTime);
  if (reached.length === 0) {
    return {
      checkpoint: null,
      minCoveragePct: BASELINE_MIN_COVERAGE,
    };
  }
  const checkpoint = reached[reached.length - 1];
  return {
    checkpoint,
    minCoveragePct: checkpoint.minCoveragePct,
  };
}

const runtimeSummaryPath = resolve(parseOption('runtime-summary', '.a11y/runtime-summary.json'));
const distPath = resolve(parseOption('dist', 'dist'));
const outputPath = resolve(parseOption('json-out', '.quality/runtime-coverage-summary.json'));
const dateOverride = parseOption('date', process.env.RUNTIME_A11Y_POLICY_DATE ?? null);
const referenceTime = dateOverride ? parseDateOrNull(dateOverride) : Date.now();

if (dateOverride && referenceTime === null) {
  console.error(`Invalid --date/RUNTIME_A11Y_POLICY_DATE value: ${dateOverride}`);
  process.exit(1);
}

const minCoverageOverride = parseOption('min-coverage', null);
const resolvedCoverage = resolveMinCoverage(referenceTime ?? Date.now());
const minCoverage = minCoverageOverride === null
  ? resolvedCoverage.minCoveragePct
  : Number(minCoverageOverride);

if (!existsSync(runtimeSummaryPath)) {
  console.error(`Missing runtime a11y summary: ${runtimeSummaryPath}`);
  process.exit(1);
}
if (!existsSync(distPath)) {
  console.error(`Missing dist output: ${distPath}`);
  process.exit(1);
}
if (!Number.isFinite(minCoverage) || minCoverage < 0 || minCoverage > 100) {
  console.error(`Invalid coverage target: ${minCoverage}`);
  process.exit(1);
}

const runtimeSummary = JSON.parse(readFileSync(runtimeSummaryPath, 'utf-8'));
const totalRoutes = countHtmlFiles(distPath);
const routesCovered = typeof runtimeSummary.pagesAudited === 'number' ? runtimeSummary.pagesAudited : 0;
const coveragePct = totalRoutes > 0 ? Number(((routesCovered / totalRoutes) * 100).toFixed(2)) : 0;

const failures = [];
if (runtimeSummary.status !== 'pass') {
  failures.push(`runtime a11y summary status is ${runtimeSummary.status}`);
}
if (coveragePct < minCoverage) {
  failures.push(`runtime coverage ${coveragePct}% is below required ${minCoverage}%`);
}

const summary = {
  generated: new Date().toISOString(),
  sourceRuntime: runtimeSummaryPath,
  sourceRoutes: distPath,
  policyReferenceDate: new Date(referenceTime ?? Date.now()).toISOString(),
  policyBaselineMinCoveragePct: BASELINE_MIN_COVERAGE,
  policyCheckpoints: COVERAGE_CHECKPOINTS,
  policyCheckpoint: resolvedCoverage.checkpoint,
  routesCovered,
  totalRoutes,
  coveragePct,
  minCoveragePct: minCoverage,
  status: failures.length === 0 ? 'pass' : 'fail',
  failures,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(summary, null, 2) + '\n');

if (summary.status === 'fail') {
  console.error('Runtime a11y coverage gate failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Runtime a11y coverage gate passed (${coveragePct}% >= ${minCoverage}%).`);
