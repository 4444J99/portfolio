#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const args = process.argv.slice(2);

function parseOption(name, fallback = null) {
  const eq = args.find((entry) => entry.startsWith(`--${name}=`));
  if (eq) return eq.split('=')[1] ?? fallback;
  const index = args.indexOf(`--${name}`);
  if (index >= 0) return args[index + 1] ?? fallback;
  return fallback;
}

const perfSummaryPath = resolve(parseOption('summary', '.quality/perf-summary.json'));
const outputPath = resolve(parseOption('json-out', '.quality/perf-budget-summary.json'));

const ROUTE_BUDGETS_GZIP = {
  '/portfolio/about': 120 * 1024,
  '/portfolio/resume': 120 * 1024,
  '/portfolio/consult': 120 * 1024,
  '/portfolio/dashboard': 220 * 1024,
  '/portfolio/architecture': 350 * 1024,
  '/portfolio/gallery': 420 * 1024,
};

if (!existsSync(perfSummaryPath)) {
  console.error(`Missing performance summary: ${perfSummaryPath}`);
  process.exit(1);
}

const perfSummary = JSON.parse(readFileSync(perfSummaryPath, 'utf-8'));
const routeTotals = perfSummary.routeJsTotals ?? {};

const checks = Object.entries(ROUTE_BUDGETS_GZIP).map(([route, budgetGzipBytes]) => {
  const actual = routeTotals[route]?.gzipBytes ?? null;
  if (actual === null) {
    return {
      route,
      budgetGzipBytes,
      actualGzipBytes: null,
      deltaGzipBytes: null,
      status: 'missing',
    };
  }
  const delta = actual - budgetGzipBytes;
  return {
    route,
    budgetGzipBytes,
    actualGzipBytes: actual,
    deltaGzipBytes: delta,
    status: actual <= budgetGzipBytes ? 'pass' : 'fail',
  };
});

const failing = checks.filter((check) => check.status === 'fail' || check.status === 'missing');
const summary = {
  generated: new Date().toISOString(),
  source: perfSummaryPath,
  thresholds: ROUTE_BUDGETS_GZIP,
  checks,
  status: failing.length === 0 ? 'pass' : 'fail',
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(summary, null, 2) + '\n');

if (summary.status === 'fail') {
  console.error('Bundle budget checks failed:');
  failing.forEach((check) => {
    if (check.status === 'missing') {
      console.error(`- ${check.route}: missing route metrics`);
      return;
    }
    const deltaKb = (check.deltaGzipBytes / 1024).toFixed(2);
    console.error(`- ${check.route}: exceeds budget by ${deltaKb}KB gzip`);
  });
  process.exit(1);
}

console.log('Bundle budget checks passed.');
