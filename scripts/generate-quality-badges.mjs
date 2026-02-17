#!/usr/bin/env node

/**
 * Generate quality metric badges and structured JSON data.
 *
 * Reads from:
 *   - vitest coverage JSON (if available)
 *   - Lighthouse CI results (if available)
 *   - a11y audit JSON summary (if available)
 *   - Build output (dist/)
 *
 * Writes:
 *   - public/badges/*.svg
 *   - src/data/quality-metrics.json
 *
 * Usage: node scripts/generate-quality-badges.mjs
 */

import { writeFileSync, existsSync, readFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

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

const metrics = {
  generated: new Date().toISOString(),
  tests: { total: null, passed: null, files: 0 },
  coverage: { statements: null, branches: null, functions: null, lines: null },
  lighthouse: { performance: null, accessibility: null, bestPractices: null, seo: null },
  a11y: { pagesAudited: null, critical: null, serious: null, status: 'unknown' },
  build: { pages: 0, bundleFiles: 0 },
  sources: {
    tests: 'Counted src/**/*.test.ts files (assertion counts unavailable without dedicated Vitest JSON reporter output).',
    coverage: 'coverage/coverage-summary.json',
    lighthouse: '.lighthouseci/lhr-*.json',
    a11y: '.a11y/a11y-summary.json',
    build: 'dist/**/*.html and dist/_astro/**/*',
  },
};

metrics.tests.files = countTestFiles(resolve('src'));

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

const a11yPath = resolve('.a11y/a11y-summary.json');
if (existsSync(a11yPath)) {
  try {
    const a11y = JSON.parse(readFileSync(a11yPath, 'utf-8'));
    metrics.a11y.pagesAudited = typeof a11y.pagesAudited === 'number' ? a11y.pagesAudited : null;
    metrics.a11y.critical = typeof a11y.critical === 'number' ? a11y.critical : null;
    metrics.a11y.serious = typeof a11y.serious === 'number' ? a11y.serious : null;
    metrics.a11y.status = typeof a11y.status === 'string' ? a11y.status : 'unknown';
  } catch {
    // keep unknown defaults
  }
}

metrics.build.pages = countHtmlFiles(resolve('dist'));
metrics.build.bundleFiles = countFiles(resolve('dist/_astro'));

const badgesDir = resolve('public/badges');
const coverageScore = metrics.coverage.lines ?? metrics.coverage.statements;

writeFileSync(
  join(badgesDir, 'tests.svg'),
  badge('tests', `${metrics.tests.files} files`, '#4c1')
);

writeFileSync(
  join(badgesDir, 'coverage.svg'),
  badge('coverage', coverageScore === null ? 'n/a' : `${coverageScore}%`, scoreColor(coverageScore))
);

writeFileSync(
  join(badgesDir, 'lighthouse-perf.svg'),
  badge('performance', metrics.lighthouse.performance === null ? 'n/a' : `${metrics.lighthouse.performance}`, scoreColor(metrics.lighthouse.performance))
);

writeFileSync(
  join(badgesDir, 'lighthouse-a11y.svg'),
  badge('accessibility', metrics.lighthouse.accessibility === null ? 'n/a' : `${metrics.lighthouse.accessibility}`, scoreColor(metrics.lighthouse.accessibility))
);

writeFileSync(
  join(badgesDir, 'lighthouse-seo.svg'),
  badge('SEO', metrics.lighthouse.seo === null ? 'n/a' : `${metrics.lighthouse.seo}`, scoreColor(metrics.lighthouse.seo))
);

const a11yColor = metrics.a11y.status === 'pass' ? '#4c1' : metrics.a11y.status === 'fail' ? '#e05d44' : '#9f9f9f';
writeFileSync(
  join(badgesDir, 'a11y.svg'),
  badge('a11y', metrics.a11y.status, a11yColor)
);

writeFileSync(
  join(badgesDir, 'pages.svg'),
  badge('pages', `${metrics.build.pages}`, '#007ec6')
);

writeFileSync(
  resolve('src/data/quality-metrics.json'),
  JSON.stringify(metrics, null, 2) + '\n'
);

console.log('Generated quality badges and metrics:');
console.log(`  Tests: ${metrics.tests.files} files (assertions: n/a)`);
console.log(`  Coverage: ${coverageScore === null ? 'n/a' : `${coverageScore}%`}`);
console.log(`  Lighthouse: perf=${metrics.lighthouse.performance ?? 'n/a'} a11y=${metrics.lighthouse.accessibility ?? 'n/a'} seo=${metrics.lighthouse.seo ?? 'n/a'}`);
console.log(`  A11y: ${metrics.a11y.status} (critical=${metrics.a11y.critical ?? 'n/a'}, serious=${metrics.a11y.serious ?? 'n/a'})`);
console.log(`  Build: pages=${metrics.build.pages} bundleFiles=${metrics.build.bundleFiles}`);
