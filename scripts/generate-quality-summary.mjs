#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const args = process.argv.slice(2);

function parseOption(name) {
  const eq = args.find((entry) => entry.startsWith(`--${name}=`));
  if (eq) return eq.split('=')[1] ?? null;
  const index = args.indexOf(`--${name}`);
  if (index >= 0) return args[index + 1] ?? null;
  return null;
}

const allowMissing = args.includes('--allow-missing');
const outputPath = resolve(parseOption('out') || '.quality/quality-summary.md');
const policyPath = resolve('.quality/ratchet-policy.json');
const currentPath = resolve('src/data/quality-metrics.json');
const baselinePath = resolve('src/data/quality-metrics-baseline.json');
const deltaPath = resolve('.quality/delta-summary.json');
const typecheckPath = resolve('.quality/typecheck-summary.json');

function readJson(path, label) {
  if (!existsSync(path)) {
    if (allowMissing) return null;
    throw new Error(`Missing ${label}: ${path}`);
  }
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function deltaText(current, baseline) {
  if (typeof current !== 'number' || typeof baseline !== 'number') return 'n/a';
  const delta = Number((current - baseline).toFixed(2));
  if (delta === 0) return '0';
  return delta > 0 ? `+${delta}` : `${delta}`;
}

function metricRow(label, current, baseline) {
  return `| ${label} | ${current ?? 'n/a'} | ${baseline ?? 'n/a'} | ${deltaText(current, baseline)} |`;
}

let policy;
let current;
let baseline;
let deltaSummary;
let typecheckSummary;

try {
  policy = readJson(policyPath, 'ratchet policy');
  current = readJson(currentPath, 'current quality metrics');
  baseline = readJson(baselinePath, 'quality baseline');
  deltaSummary = readJson(deltaPath, 'delta summary');
  typecheckSummary = readJson(typecheckPath, 'typecheck summary');
} catch (error) {
  console.error(String(error));
  process.exit(1);
}

const phase = process.env.QUALITY_PHASE || policy?.defaultPhase || 'W6';
const coverageTarget = policy?.phases?.[phase]?.coverage ?? null;
const hintTarget = policy?.phases?.[phase]?.typecheck?.hintsMax ?? null;

const regressions = deltaSummary?.regressions ?? [];
const topRegressions = regressions.slice(0, 5);

const lines = [];
lines.push('# Quality Summary');
lines.push('');
lines.push(`- Generated: ${new Date().toISOString()}`);
lines.push(`- Phase: ${phase}`);
lines.push(`- Overall status: ${regressions.length === 0 ? 'PASS' : 'FAIL'}`);
lines.push('');
lines.push('## Gate Snapshot');
lines.push('');
lines.push(`- Typecheck: ${typecheckSummary?.status ?? 'unknown'} (hints ${typecheckSummary?.hints ?? 'n/a'} / budget ${hintTarget ?? 'n/a'})`);
lines.push(`- Coverage: statements ${current?.coverage?.statements ?? 'n/a'}, branches ${current?.coverage?.branches ?? 'n/a'}, functions ${current?.coverage?.functions ?? 'n/a'}, lines ${current?.coverage?.lines ?? 'n/a'}`);
if (coverageTarget) {
  lines.push(`- Coverage targets (${phase}): ${coverageTarget.statements}/${coverageTarget.branches}/${coverageTarget.functions}/${coverageTarget.lines}`);
}
lines.push(`- Accessibility: static ${current?.a11y?.static?.status ?? 'n/a'}, runtime ${current?.a11y?.runtime?.status ?? 'n/a'}, overall ${current?.a11y?.status ?? 'n/a'}`);
lines.push(`- Lighthouse: perf ${current?.lighthouse?.performance ?? 'n/a'}, a11y ${current?.lighthouse?.accessibility ?? 'n/a'}, bp ${current?.lighthouse?.bestPractices ?? 'n/a'}, seo ${current?.lighthouse?.seo ?? 'n/a'}`);
lines.push('');
lines.push('## Deltas vs Baseline');
lines.push('');
lines.push('| Metric | Current | Baseline | Delta |');
lines.push('|---|---:|---:|---:|');
lines.push(metricRow('Coverage statements', current?.coverage?.statements, baseline?.coverage?.statements));
lines.push(metricRow('Coverage branches', current?.coverage?.branches, baseline?.coverage?.branches));
lines.push(metricRow('Coverage functions', current?.coverage?.functions, baseline?.coverage?.functions));
lines.push(metricRow('Coverage lines', current?.coverage?.lines, baseline?.coverage?.lines));
lines.push(metricRow('LH performance', current?.lighthouse?.performance, baseline?.lighthouse?.performance));
lines.push(metricRow('LH accessibility', current?.lighthouse?.accessibility, baseline?.lighthouse?.accessibility));
lines.push(metricRow('LH best practices', current?.lighthouse?.bestPractices, baseline?.lighthouse?.bestPractices));
lines.push(metricRow('LH SEO', current?.lighthouse?.seo, baseline?.lighthouse?.seo));
lines.push(metricRow('A11y critical total', (current?.a11y?.static?.critical ?? 0) + (current?.a11y?.runtime?.critical ?? 0), (baseline?.a11y?.static?.critical ?? 0) + (baseline?.a11y?.runtime?.critical ?? 0)));
lines.push(metricRow('A11y serious total', (current?.a11y?.static?.serious ?? 0) + (current?.a11y?.runtime?.serious ?? 0), (baseline?.a11y?.static?.serious ?? 0) + (baseline?.a11y?.runtime?.serious ?? 0)));
lines.push('');
lines.push('## Top Regressions');
lines.push('');
if (!topRegressions.length) {
  lines.push('- None');
} else {
  topRegressions.forEach((regression) => {
    lines.push(`- ${regression.message}`);
  });
}

const markdown = `${lines.join('\n')}\n`;
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, markdown);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
}

console.log(`Quality summary written to ${outputPath}`);
