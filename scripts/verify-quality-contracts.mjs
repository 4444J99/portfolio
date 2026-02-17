#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const paths = {
  metrics: resolve('src/data/quality-metrics.json'),
  vitest: resolve('.quality/vitest-report.json'),
  coverage: resolve('coverage/coverage-summary.json'),
  staticA11y: resolve('.a11y/a11y-summary.json'),
  runtimeA11y: resolve('.a11y/runtime-summary.json'),
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
  const sum = arr.reduce((acc, value) => acc + value, 0);
  return Math.round(sum / arr.length);
}

function toNullableNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

if (!existsSync(paths.metrics)) fail(`Missing metrics file: ${paths.metrics}`);
if (!existsSync(paths.vitest)) fail(`Missing Vitest report: ${paths.vitest}`);
if (!existsSync(paths.coverage)) fail(`Missing coverage summary: ${paths.coverage}`);
if (!existsSync(paths.staticA11y)) fail(`Missing static a11y summary: ${paths.staticA11y}`);
if (!existsSync(paths.runtimeA11y)) fail(`Missing runtime a11y summary: ${paths.runtimeA11y}`);
if (!existsSync(paths.lighthouseDir)) fail(`Missing Lighthouse report directory: ${paths.lighthouseDir}`);
if (!existsSync(paths.dist)) fail(`Missing build output: ${paths.dist}`);

if (errors.length) {
  console.error('Quality contract failed: required artifacts missing.');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const metrics = readJson(paths.metrics);
const vitestReport = readJson(paths.vitest);
const coverage = readJson(paths.coverage);
const staticA11y = readJson(paths.staticA11y);
const runtimeA11y = readJson(paths.runtimeA11y);

if (metrics.tests.total !== vitestReport.numTotalTests) {
  fail(`tests.total mismatch: metrics=${metrics.tests.total}, report=${vitestReport.numTotalTests}`);
}
if (metrics.tests.passed !== vitestReport.numPassedTests) {
  fail(`tests.passed mismatch: metrics=${metrics.tests.passed}, report=${vitestReport.numPassedTests}`);
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
  ['status', runtimeA11y.status],
];
for (const [field, expected] of runtimePairs) {
  if (metrics.a11y.runtime[field] !== expected) {
    fail(`a11y.runtime.${field} mismatch: metrics=${metrics.a11y.runtime[field]}, summary=${expected}`);
  }
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
  paths.coverage,
  paths.staticA11y,
  paths.runtimeA11y,
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
