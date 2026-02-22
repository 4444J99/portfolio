#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseOption } from './lib/cli-utils.mjs';

function readJson(path, label) {
  if (!existsSync(path)) {
    throw new Error(`Missing ${label}: ${path}`);
  }
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function normalizeCounts(raw) {
  return {
    critical: Number(raw?.critical ?? 0),
    high: Number(raw?.high ?? 0),
    moderate: Number(raw?.moderate ?? 0),
    low: Number(raw?.low ?? 0),
    total: Number(raw?.total ?? 0),
  };
}

const fullSummaryPath = resolve(parseOption('full', '.quality/security-summary.json'));
const prodSummaryPath = resolve(parseOption('prod', '.quality/security-summary-prod.json'));
const githubSummaryPath = resolve(parseOption('github', '.quality/github-advisory-summary.json'));
const baselinePath = resolve(parseOption('baseline', '.quality/security-baseline.json'));
const outputPath = resolve(parseOption('json-out', '.quality/security-drift-summary.json'));

let fullSummary;
let prodSummary;
let githubSummary = null;
let baseline;

try {
  fullSummary = readJson(fullSummaryPath, 'full security summary');
  prodSummary = readJson(prodSummaryPath, 'prod security summary');
  baseline = readJson(baselinePath, 'security drift baseline');
  if (existsSync(githubSummaryPath)) {
    githubSummary = JSON.parse(readFileSync(githubSummaryPath, 'utf-8'));
  }
} catch (error) {
  console.error(String(error));
  process.exit(1);
}

const fullCounts = normalizeCounts(fullSummary?.unsuppressed?.counts);
const prodCounts = normalizeCounts(prodSummary?.unsuppressed?.counts);
const baselineFull = normalizeCounts(baseline?.full);
const baselineProd = normalizeCounts(baseline?.prod);

const allowedIncrease = {
  critical: Number(baseline?.allowedIncrease?.critical ?? 0),
  high: Number(baseline?.allowedIncrease?.high ?? 0),
  moderate: Number(baseline?.allowedIncrease?.moderate ?? 0),
  low: Number(baseline?.allowedIncrease?.low ?? 0),
  total: Number(baseline?.allowedIncrease?.total ?? 0),
};

const drift = {
  full: {},
  prod: {},
};

for (const key of ['critical', 'high', 'moderate', 'low', 'total']) {
  drift.full[key] = fullCounts[key] - baselineFull[key];
  drift.prod[key] = prodCounts[key] - baselineProd[key];
}

const failures = [];

for (const key of ['critical', 'high', 'moderate', 'low', 'total']) {
  if (drift.full[key] > allowedIncrease[key]) {
    failures.push(`full.${key} drift ${drift.full[key]} exceeds allowed increase ${allowedIncrease[key]}`);
  }
  if (drift.prod[key] > allowedIncrease[key]) {
    failures.push(`prod.${key} drift ${drift.prod[key]} exceeds allowed increase ${allowedIncrease[key]}`);
  }
}

const githubOpenAlerts = Number(githubSummary?.counts?.total ?? 0);
const githubOpenAlertsMax = Number(baseline?.githubOpenAlertsMax ?? 0);

if (githubSummary && githubSummary.status !== 'skipped' && githubOpenAlerts > githubOpenAlertsMax) {
  failures.push(`github open alerts ${githubOpenAlerts} exceed allowed max ${githubOpenAlertsMax}`);
}

const summary = {
  generated: new Date().toISOString(),
  source: {
    full: fullSummaryPath,
    prod: prodSummaryPath,
    github: existsSync(githubSummaryPath) ? githubSummaryPath : null,
    baseline: baselinePath,
  },
  fullCounts,
  prodCounts,
  baseline: {
    full: baselineFull,
    prod: baselineProd,
    githubOpenAlertsMax,
    allowedIncrease,
  },
  drift,
  github: githubSummary
    ? {
        status: githubSummary.status,
        openAlerts: githubOpenAlerts,
      }
    : null,
  status: failures.length === 0 ? 'pass' : 'fail',
  failures,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(summary, null, 2) + '\n');

if (summary.status === 'fail') {
  console.error('Security drift check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Security drift check passed.');
