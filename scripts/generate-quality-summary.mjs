#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseOption } from './lib/cli-utils.mjs';

const args = process.argv.slice(2);
const allowMissing = args.includes('--allow-missing');
const outputPath = resolve(parseOption('out') || '.quality/quality-summary.md');
const policyPath = resolve('.quality/ratchet-policy.json');
const currentPath = resolve('src/data/quality-metrics.json');
const baselinePath = resolve('src/data/quality-metrics-baseline.json');
const deltaPath = resolve('.quality/delta-summary.json');
const typecheckPath = resolve('.quality/typecheck-summary.json');
const securityRegisterPath = resolve('.quality/security-register.json');
const greenRunsPath = resolve('.quality/green-run-history.json');
const runtimeErrorsPath = resolve('.quality/runtime-errors-summary.json');

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

function formatSeverityTarget(target) {
  if (!target || typeof target !== 'object') return 'n/a';
  const critical = Number.isFinite(target.critical) ? target.critical : 'n/a';
  const high = Number.isFinite(target.high) ? target.high : 'n/a';
  const moderate = Number.isFinite(target.moderate) ? target.moderate : 'n/a';
  const low = Number.isFinite(target.low) ? target.low : 'n/a';
  return `C${critical} H${high} M${moderate} L${low}`;
}

let policy;
let current;
let baseline;
let deltaSummary;
let typecheckSummary;
let securityRegister;
let greenRunsSummary;
let runtimeErrorsSummary;

try {
  policy = readJson(policyPath, 'ratchet policy');
  current = readJson(currentPath, 'current quality metrics');
  baseline = readJson(baselinePath, 'quality baseline');
  deltaSummary = readJson(deltaPath, 'delta summary');
  typecheckSummary = readJson(typecheckPath, 'typecheck summary');
  securityRegister = readJson(securityRegisterPath, 'security register');
  greenRunsSummary = readJson(greenRunsPath, 'green-run history');
  runtimeErrorsSummary = readJson(runtimeErrorsPath, 'runtime error telemetry summary');
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
lines.push(`- Security: ${current?.security?.status ?? 'n/a'} (critical ${current?.security?.critical ?? 'n/a'}, high ${current?.security?.high ?? 'n/a'})`);
lines.push(`- Security split: prod ${current?.security?.prodCounts?.total ?? 'n/a'} / dev ${current?.security?.devCounts?.total ?? 'n/a'} (allowlist active ${current?.security?.allowlistActive ?? 'n/a'})`);
lines.push(`- Security checkpoint: ${current?.security?.policyCheckpoint ? `${current.security.policyCheckpoint.date} (moderate<=${current.security.policyCheckpoint.maxModerate}, low<=${current.security.policyCheckpoint.maxLow})` : 'n/a'}`);
lines.push(`- Coverage: statements ${current?.coverage?.statements ?? 'n/a'}, branches ${current?.coverage?.branches ?? 'n/a'}, functions ${current?.coverage?.functions ?? 'n/a'}, lines ${current?.coverage?.lines ?? 'n/a'}`);
if (coverageTarget) {
  lines.push(`- Coverage targets (${phase}): ${coverageTarget.statements}/${coverageTarget.branches}/${coverageTarget.functions}/${coverageTarget.lines}`);
}
lines.push(`- Accessibility: static ${current?.a11y?.static?.status ?? 'n/a'}, runtime ${current?.a11y?.runtime?.status ?? 'n/a'}, overall ${current?.a11y?.status ?? 'n/a'}`);
lines.push(
  `- Runtime route coverage: ${current?.a11y?.runtime?.routesCovered ?? 'n/a'}/${current?.a11y?.runtime?.totalRoutes ?? 'n/a'} (${current?.a11y?.runtime?.coveragePct ?? 'n/a'}%)`
);
lines.push(`- E2E smoke: ${current?.sources?.e2eSmoke ?? 'n/a'}`);
lines.push(`- Runtime errors: ${runtimeErrorsSummary?.status ?? current?.runtimeErrors?.status ?? 'n/a'} (uncategorized ${runtimeErrorsSummary?.counts?.uncategorized ?? current?.runtimeErrors?.uncategorized ?? 'n/a'})`);
lines.push(`- Green-run tracker: ${greenRunsSummary?.consecutiveSuccess ?? current?.stability?.consecutiveSuccess ?? 'n/a'}/${greenRunsSummary?.requiredConsecutive ?? current?.stability?.requiredConsecutive ?? 'n/a'} (${greenRunsSummary?.status ?? current?.stability?.status ?? 'n/a'})`);
lines.push(`- Perf budgets: route ${current?.performance?.routeBudgetsStatus ?? 'n/a'}, chunk ${current?.performance?.chunkBudgetsStatus ?? 'n/a'}, interaction ${current?.performance?.interactionBudgetsStatus ?? 'n/a'}`);
lines.push(`- Lighthouse: perf ${current?.lighthouse?.performance ?? 'n/a'}, a11y ${current?.lighthouse?.accessibility ?? 'n/a'}, bp ${current?.lighthouse?.bestPractices ?? 'n/a'}, seo ${current?.lighthouse?.seo ?? 'n/a'}`);
lines.push('');
lines.push('## Security Sprint Cadence');
lines.push('');

const checkpoints = Array.isArray(securityRegister?.checkpoints) ? securityRegister.checkpoints : [];
if (checkpoints.length > 0) {
  lines.push('| Date | Target | Status | Notes |');
  lines.push('|---|---|---|---|');
  checkpoints.forEach((checkpoint) => {
    lines.push(`| ${checkpoint.date ?? 'n/a'} | ${formatSeverityTarget(checkpoint.target)} | ${checkpoint.status ?? 'n/a'} | ${checkpoint.notes ?? ''} |`);
  });
} else {
  lines.push('- No checkpoint schedule found.');
}
lines.push('');
lines.push('### Vulnerability Families');
lines.push('');
const families = Array.isArray(securityRegister?.vulnerabilityFamilies) ? securityRegister.vulnerabilityFamilies : [];
if (families.length > 0) {
  families.forEach((family) => {
    lines.push(`- ${family.family ?? 'unknown'}: owner ${family.owner ?? 'n/a'}, ETA ${family.eta ?? 'n/a'}, status ${family.status ?? 'n/a'}`);
  });
} else {
  lines.push('- None');
}
lines.push('');
lines.push('### Rollback Policy');
lines.push('');
const rollbackPolicy = securityRegister?.rollbackPolicy ?? null;
if (rollbackPolicy) {
  lines.push(`- Intent: ${rollbackPolicy.intent ?? 'n/a'}`);
  lines.push(`- Maximum temporary relaxation: ${rollbackPolicy.maxRelaxationDays ?? 'n/a'} day(s)`);
  const requirements = Array.isArray(rollbackPolicy.requirements) ? rollbackPolicy.requirements : [];
  if (requirements.length === 0) {
    lines.push('- Requirements: none documented');
  } else {
    requirements.forEach((requirement) => lines.push(`- Requirement: ${requirement}`));
  }
} else {
  lines.push('- No rollback policy documented.');
}
lines.push('');
lines.push('## Deltas vs Baseline');
lines.push('');
lines.push('| Metric | Current | Baseline | Delta |');
lines.push('|---|---:|---:|---:|');
lines.push(metricRow('Coverage statements', current?.coverage?.statements, baseline?.coverage?.statements));
lines.push(metricRow('Coverage branches', current?.coverage?.branches, baseline?.coverage?.branches));
lines.push(metricRow('Coverage functions', current?.coverage?.functions, baseline?.coverage?.functions));
lines.push(metricRow('Coverage lines', current?.coverage?.lines, baseline?.coverage?.lines));
lines.push(metricRow('Security critical', current?.security?.critical, baseline?.security?.critical));
lines.push(metricRow('Security high', current?.security?.high, baseline?.security?.high));
lines.push(metricRow('Security moderate', current?.security?.moderate, baseline?.security?.moderate));
lines.push(metricRow('Security low', current?.security?.low, baseline?.security?.low));
lines.push(metricRow('Security github open alerts', current?.security?.githubOpenAlerts, baseline?.security?.githubOpenAlerts));
lines.push(metricRow('LH performance', current?.lighthouse?.performance, baseline?.lighthouse?.performance));
lines.push(metricRow('LH accessibility', current?.lighthouse?.accessibility, baseline?.lighthouse?.accessibility));
lines.push(metricRow('LH best practices', current?.lighthouse?.bestPractices, baseline?.lighthouse?.bestPractices));
lines.push(metricRow('LH SEO', current?.lighthouse?.seo, baseline?.lighthouse?.seo));
lines.push(metricRow('Runtime coverage %', current?.a11y?.runtime?.coveragePct, baseline?.a11y?.runtime?.coveragePct));
lines.push(metricRow('Runtime uncategorized errors', current?.runtimeErrors?.uncategorized, baseline?.runtimeErrors?.uncategorized));
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
