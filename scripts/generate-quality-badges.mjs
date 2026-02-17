#!/usr/bin/env node

/**
 * Generate quality metric badges and structured JSON data.
 *
 * Reads from measured artifacts when available:
 *   - .quality/vitest-report.json
 *   - coverage/coverage-summary.json
 *   - .lighthouseci/lhr-*.json
 *   - .a11y/a11y-summary.json (static)
 *   - .a11y/runtime-summary.json (runtime)
 *   - dist/
 *
 * Writes:
 *   - public/badges/*.svg
 *   - src/data/quality-metrics.json
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

function countTestFiles(dir) {
  let count = 0;
  if (!existsSync(dir)) return 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) count += countTestFiles(fullPath);
    else if (entry.name.endsWith('.test.ts')) count++;
  }
  return count;
}

function countHtmlFiles(dir) {
  let count = 0;
  if (!existsSync(dir)) return 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) count += countHtmlFiles(fullPath);
    else if (entry.name.endsWith('.html')) count++;
  }
  return count;
}

function countFiles(dir) {
  let count = 0;
  if (!existsSync(dir)) return 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) count += countFiles(fullPath);
    else count++;
  }
  return count;
}

function toNumberOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

const metrics = {
  generated: new Date().toISOString(),
  tests: { total: null, passed: null, files: 0 },
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
      status: 'unknown',
    },
  },
  build: { pages: 0, bundleFiles: 0 },
  sources: {
    tests: '.quality/vitest-report.json',
    coverage: 'coverage/coverage-summary.json',
    lighthouse: '.lighthouseci/lhr-*.json',
    a11yStatic: '.a11y/a11y-summary.json',
    a11yRuntime: '.a11y/runtime-summary.json',
    build: 'dist/**/*.html and dist/_astro/**/*',
  },
};

metrics.tests.files = countTestFiles(resolve('src'));

const vitestReportPath = resolve('.quality/vitest-report.json');
if (existsSync(vitestReportPath)) {
  try {
    const report = JSON.parse(readFileSync(vitestReportPath, 'utf-8'));
    metrics.tests.total = toNumberOrNull(report.numTotalTests);
    metrics.tests.passed = toNumberOrNull(report.numPassedTests);
  } catch {
    // keep nulls
  }
}

const coveragePath = resolve('coverage/coverage-summary.json');
if (existsSync(coveragePath)) {
  try {
    const cov = JSON.parse(readFileSync(coveragePath, 'utf-8'));
    if (cov.total) {
      metrics.coverage.statements = Math.round(cov.total.statements.pct);
      metrics.coverage.branches = Math.round(cov.total.branches.pct);
      metrics.coverage.functions = Math.round(cov.total.functions.pct);
      metrics.coverage.lines = Math.round(cov.total.lines.pct);
    }
  } catch {
    // keep nulls
  }
}

const lhciDir = resolve('.lighthouseci');
if (existsSync(lhciDir)) {
  try {
    const lhciFiles = readdirSync(lhciDir).filter((f) => f.endsWith('.json') && f.startsWith('lhr-'));
    const scores = { performance: [], accessibility: [], bestPractices: [], seo: [] };

    for (const file of lhciFiles) {
      const lhr = JSON.parse(readFileSync(join(lhciDir, file), 'utf-8'));
      if (!lhr.categories) continue;
      if (lhr.categories.performance) scores.performance.push(lhr.categories.performance.score * 100);
      if (lhr.categories.accessibility) scores.accessibility.push(lhr.categories.accessibility.score * 100);
      if (lhr.categories['best-practices']) scores.bestPractices.push(lhr.categories['best-practices'].score * 100);
      if (lhr.categories.seo) scores.seo.push(lhr.categories.seo.score * 100);
    }

    const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null);
    metrics.lighthouse.performance = avg(scores.performance);
    metrics.lighthouse.accessibility = avg(scores.accessibility);
    metrics.lighthouse.bestPractices = avg(scores.bestPractices);
    metrics.lighthouse.seo = avg(scores.seo);
  } catch {
    // keep nulls
  }
}

const staticA11yPath = resolve('.a11y/a11y-summary.json');
if (existsSync(staticA11yPath)) {
  try {
    const staticA11y = JSON.parse(readFileSync(staticA11yPath, 'utf-8'));
    metrics.a11y.static.pagesAudited = toNumberOrNull(staticA11y.pagesAudited);
    metrics.a11y.static.critical = toNumberOrNull(staticA11y.critical);
    metrics.a11y.static.serious = toNumberOrNull(staticA11y.serious);
    metrics.a11y.static.status = typeof staticA11y.status === 'string' ? staticA11y.status : 'unknown';
  } catch {
    // keep defaults
  }
}

const runtimeA11yPath = resolve('.a11y/runtime-summary.json');
if (existsSync(runtimeA11yPath)) {
  try {
    const runtimeA11y = JSON.parse(readFileSync(runtimeA11yPath, 'utf-8'));
    metrics.a11y.runtime.pagesAudited = toNumberOrNull(runtimeA11y.pagesAudited);
    metrics.a11y.runtime.critical = toNumberOrNull(runtimeA11y.critical);
    metrics.a11y.runtime.serious = toNumberOrNull(runtimeA11y.serious);
    metrics.a11y.runtime.focusChecks = toNumberOrNull(runtimeA11y.focusChecks);
    metrics.a11y.runtime.focusFailures = toNumberOrNull(runtimeA11y.focusFailures);
    metrics.a11y.runtime.status = typeof runtimeA11y.status === 'string' ? runtimeA11y.status : 'unknown';
  } catch {
    // keep defaults
  }
}

const a11yStates = [metrics.a11y.static.status, metrics.a11y.runtime.status].filter((state) => state !== 'unknown');
if (a11yStates.length === 0) {
  metrics.a11y.status = 'unknown';
} else {
  metrics.a11y.status = a11yStates.every((state) => state === 'pass') ? 'pass' : 'fail';
}

metrics.build.pages = countHtmlFiles(resolve('dist'));
metrics.build.bundleFiles = countFiles(resolve('dist/_astro'));

const badgesDir = resolve('public/badges');
mkdirSync(badgesDir, { recursive: true });

const coverageScore = metrics.coverage.lines ?? metrics.coverage.statements;
const testsBadge = metrics.tests.total === null || metrics.tests.passed === null
  ? `${metrics.tests.files} files`
  : `${metrics.tests.passed}/${metrics.tests.total}`;
const a11yColor = metrics.a11y.status === 'pass' ? '#4c1' : metrics.a11y.status === 'fail' ? '#e05d44' : '#9f9f9f';

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
writeFileSync(join(badgesDir, 'a11y.svg'), badge('a11y', metrics.a11y.status, a11yColor));
writeFileSync(join(badgesDir, 'pages.svg'), badge('pages', `${metrics.build.pages}`, '#007ec6'));

writeFileSync(resolve('src/data/quality-metrics.json'), JSON.stringify(metrics, null, 2) + '\n');

console.log('Generated quality badges and metrics:');
console.log(
  `  Tests: ${metrics.tests.passed ?? 'n/a'}/${metrics.tests.total ?? 'n/a'} (files=${metrics.tests.files})`
);
console.log(`  Coverage: ${coverageScore === null ? 'n/a' : `${coverageScore}%`}`);
console.log(
  `  Lighthouse: perf=${metrics.lighthouse.performance ?? 'n/a'} a11y=${metrics.lighthouse.accessibility ?? 'n/a'} seo=${metrics.lighthouse.seo ?? 'n/a'}`
);
console.log(
  `  A11y static: ${metrics.a11y.static.status} (critical=${metrics.a11y.static.critical ?? 'n/a'}, serious=${metrics.a11y.static.serious ?? 'n/a'})`
);
console.log(
  `  A11y runtime: ${metrics.a11y.runtime.status} (critical=${metrics.a11y.runtime.critical ?? 'n/a'}, serious=${metrics.a11y.runtime.serious ?? 'n/a'}, focusFailures=${metrics.a11y.runtime.focusFailures ?? 'n/a'})`
);
console.log(`  Build: pages=${metrics.build.pages} bundleFiles=${metrics.build.bundleFiles}`);
