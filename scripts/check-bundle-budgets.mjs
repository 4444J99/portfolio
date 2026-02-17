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

function parseDateOrNull(value) {
  if (!value || typeof value !== 'string') return null;
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : null;
}

function selectChunkThresholds(referenceTime) {
  const checkpoints = [
    {
      date: '2026-02-17',
      thresholds: {
        'vendor-mermaid': 480 * 1024,
        'vendor-p5': 320 * 1024,
        'vendor-cytoscape': 200 * 1024,
      },
    },
    {
      date: '2026-03-07',
      thresholds: {
        'vendor-mermaid': 430 * 1024,
        'vendor-p5': 290 * 1024,
        'vendor-cytoscape': 185 * 1024,
      },
    },
    {
      date: '2026-03-18',
      thresholds: {
        'vendor-mermaid': 350 * 1024,
        'vendor-p5': 260 * 1024,
        'vendor-cytoscape': 170 * 1024,
      },
    },
  ];

  const reached = checkpoints.filter((checkpoint) => Date.parse(checkpoint.date) <= referenceTime);
  if (reached.length === 0) return checkpoints[0];
  return reached[reached.length - 1];
}

function selectInteractionThresholds(referenceTime) {
  const checkpoints = [
    {
      date: '2026-02-17',
      thresholds: {
        '/portfolio/architecture': 1024 * 1024,
        '/portfolio/gallery': 1024 * 1024,
      },
    },
    {
      date: '2026-03-07',
      thresholds: {
        '/portfolio/architecture': 960 * 1024,
        '/portfolio/gallery': 980 * 1024,
      },
    },
    {
      date: '2026-03-18',
      thresholds: {
        '/portfolio/architecture': 900 * 1024,
        '/portfolio/gallery': 920 * 1024,
      },
    },
  ];

  const reached = checkpoints.filter((checkpoint) => Date.parse(checkpoint.date) <= referenceTime);
  if (reached.length === 0) return checkpoints[0];
  return reached[reached.length - 1];
}

const perfSummaryPath = resolve(parseOption('summary', '.quality/perf-summary.json'));
const outputPath = resolve(parseOption('json-out', '.quality/perf-budget-summary.json'));
const dateOverride = parseOption('date', process.env.PERF_BUDGET_POLICY_DATE ?? null);
const referenceTime = dateOverride ? parseDateOrNull(dateOverride) : Date.now();

if (dateOverride && referenceTime === null) {
  console.error(`Invalid --date/PERF_BUDGET_POLICY_DATE value: ${dateOverride}`);
  process.exit(1);
}

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
const interactionTotals = perfSummary.interactiveRouteJsTotals ?? {};
const chunkTotals = Array.isArray(perfSummary.largestChunks) ? perfSummary.largestChunks : [];
const chunkThresholdCheckpoint = selectChunkThresholds(referenceTime ?? Date.now());
const interactionThresholdCheckpoint = selectInteractionThresholds(referenceTime ?? Date.now());
const CHUNK_BUDGETS_GZIP = chunkThresholdCheckpoint.thresholds;
const INTERACTION_ROUTE_BUDGETS_GZIP = interactionThresholdCheckpoint.thresholds;

function buildBudgetCheck(key, actual, budget) {
  if (actual === null || actual === undefined) {
    return {
      key,
      budgetGzipBytes: budget,
      actualGzipBytes: null,
      deltaGzipBytes: null,
      status: 'missing',
    };
  }

  const delta = actual - budget;
  return {
    key,
    budgetGzipBytes: budget,
    actualGzipBytes: actual,
    deltaGzipBytes: delta,
    status: actual <= budget ? 'pass' : 'fail',
  };
}

const routeChecks = Object.entries(ROUTE_BUDGETS_GZIP).map(([route, budget]) => {
  const actual = routeTotals[route]?.gzipBytes ?? null;
  return {
    route,
    ...buildBudgetCheck(route, actual, budget),
  };
});

const interactionChecks = Object.entries(INTERACTION_ROUTE_BUDGETS_GZIP).map(([route, budget]) => {
  const actual = interactionTotals[route]?.gzipBytes ?? null;
  return {
    route,
    ...buildBudgetCheck(route, actual, budget),
  };
});

const chunkChecks = Object.entries(CHUNK_BUDGETS_GZIP).map(([chunkToken, budget]) => {
  const chunk = chunkTotals.find((entry) => entry.chunk.includes(chunkToken)) ?? null;
  const actual = chunk?.gzipBytes ?? null;
  return {
    chunk: chunk?.chunk ?? chunkToken,
    token: chunkToken, // allow-secret: false positive, this is a chunk label key
    ...buildBudgetCheck(chunkToken, actual, budget),
  };
});

const routeFailures = routeChecks.filter((check) => check.status === 'fail' || check.status === 'missing');
const interactionFailures = interactionChecks.filter((check) => check.status === 'fail' || check.status === 'missing');
const chunkFailures = chunkChecks.filter((check) => check.status === 'fail' || check.status === 'missing');

const routeBudgetsStatus = routeFailures.length === 0 ? 'pass' : 'fail';
const interactionBudgetsStatus = interactionFailures.length === 0 ? 'pass' : 'fail';
const chunkBudgetsStatus = chunkFailures.length === 0 ? 'pass' : 'fail';

const summary = {
  generated: new Date().toISOString(),
  source: perfSummaryPath,
  policyReferenceDate: new Date(referenceTime ?? Date.now()).toISOString(),
  routeThresholds: ROUTE_BUDGETS_GZIP,
  interactionThresholds: INTERACTION_ROUTE_BUDGETS_GZIP,
  interactionThresholdCheckpoint,
  chunkThresholdCheckpoint,
  chunkThresholds: CHUNK_BUDGETS_GZIP,
  routeChecks,
  interactionChecks,
  chunkChecks,
  routeBudgetsStatus,
  interactionBudgetsStatus,
  chunkBudgetsStatus,
  status: routeBudgetsStatus === 'pass' && interactionBudgetsStatus === 'pass' && chunkBudgetsStatus === 'pass'
    ? 'pass'
    : 'fail',
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(summary, null, 2) + '\n');

if (summary.status === 'fail') {
  console.error('Bundle budget checks failed:');

  const failLine = (label, item) => {
    if (item.status === 'missing') {
      console.error(`- ${label}: missing metric`);
      return;
    }
    const deltaKb = (item.deltaGzipBytes / 1024).toFixed(2);
    console.error(`- ${label}: exceeds budget by ${deltaKb}KB gzip`);
  };

  routeFailures.forEach((item) => failLine(`route ${item.route}`, item));
  interactionFailures.forEach((item) => failLine(`interaction ${item.route}`, item));
  chunkFailures.forEach((item) => failLine(`chunk ${item.chunk}`, item));

  process.exit(1);
}

console.log('Bundle budget checks passed.');
