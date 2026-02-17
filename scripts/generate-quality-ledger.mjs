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

function readJson(path, fallback = null) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function toDelta(current, baseline) {
  if (typeof current !== 'number' || typeof baseline !== 'number') return null;
  return Number((current - baseline).toFixed(2));
}

function fmt(value) {
  if (value === null || value === undefined) return 'n/a';
  return String(value);
}

const currentPath = resolve(parseOption('current', 'src/data/quality-metrics.json'));
const baselinePath = resolve(parseOption('baseline', 'src/data/quality-metrics-baseline.json'));
const greenRunsPath = resolve(parseOption('green', '.quality/green-run-history.json'));
const securityDriftPath = resolve(parseOption('security-drift', '.quality/security-drift-summary.json'));
const outputJsonPath = resolve(parseOption('json-out', '.quality/quality-ledger.json'));
const outputMdPath = resolve(parseOption('md-out', '.quality/quality-ledger.md'));

const current = readJson(currentPath);
if (!current) {
  console.error(`Missing current quality metrics: ${currentPath}`);
  process.exit(1);
}

const baseline = readJson(baselinePath, null);
const greenRuns = readJson(greenRunsPath, null);
const securityDrift = readJson(securityDriftPath, null);

const snapshot = {
  generated: current.generated ?? new Date().toISOString(),
  tests: {
    total: current.tests?.total ?? null,
    passed: current.tests?.passed ?? null,
  },
  coverage: {
    statements: current.coverage?.statements ?? null,
    branches: current.coverage?.branches ?? null,
    functions: current.coverage?.functions ?? null,
    lines: current.coverage?.lines ?? null,
  },
  security: {
    status: current.security?.status ?? 'unknown',
    critical: current.security?.critical ?? null,
    high: current.security?.high ?? null,
    moderate: current.security?.moderate ?? null,
    low: current.security?.low ?? null,
    allowlistActive: current.security?.allowlistActive ?? null,
  },
  a11y: {
    status: current.a11y?.status ?? 'unknown',
    runtimeCoveragePct: current.a11y?.runtime?.coveragePct ?? null,
  },
  performance: {
    routeBudgetsStatus: current.performance?.routeBudgetsStatus ?? 'unknown',
    chunkBudgetsStatus: current.performance?.chunkBudgetsStatus ?? 'unknown',
    interactionBudgetsStatus: current.performance?.interactionBudgetsStatus ?? 'unknown',
  },
  lighthouse: {
    performance: current.lighthouse?.performance ?? null,
    accessibility: current.lighthouse?.accessibility ?? null,
    bestPractices: current.lighthouse?.bestPractices ?? null,
    seo: current.lighthouse?.seo ?? null,
  },
  stability: {
    consecutiveSuccess: greenRuns?.consecutiveSuccess ?? null,
    requiredConsecutive: greenRuns?.requiredConsecutive ?? null,
    greenStatus: greenRuns?.status ?? 'unknown',
  },
  drift: {
    securityDriftStatus: securityDrift?.status ?? 'unknown',
    securityDriftFailures: Array.isArray(securityDrift?.failures) ? securityDrift.failures.length : null,
    coverageStatementsDelta: toDelta(current.coverage?.statements, baseline?.coverage?.statements),
    coverageBranchesDelta: toDelta(current.coverage?.branches, baseline?.coverage?.branches),
    coverageFunctionsDelta: toDelta(current.coverage?.functions, baseline?.coverage?.functions),
    coverageLinesDelta: toDelta(current.coverage?.lines, baseline?.coverage?.lines),
    lhPerformanceDelta: toDelta(current.lighthouse?.performance, baseline?.lighthouse?.performance),
    runtimeCoverageDelta: toDelta(current.a11y?.runtime?.coveragePct, baseline?.a11y?.runtime?.coveragePct),
  },
};

const existingLedger = readJson(outputJsonPath, { version: 1, snapshots: [] });
const snapshots = Array.isArray(existingLedger?.snapshots) ? existingLedger.snapshots : [];

const existingIndex = snapshots.findIndex((entry) => entry.generated === snapshot.generated);
if (existingIndex >= 0) {
  snapshots[existingIndex] = snapshot;
} else {
  snapshots.push(snapshot);
}

snapshots.sort((a, b) => Date.parse(a.generated) - Date.parse(b.generated));
const trimmedSnapshots = snapshots.slice(-120);

const ledger = {
  version: 1,
  generated: new Date().toISOString(),
  source: {
    current: currentPath,
    baseline: existsSync(baselinePath) ? baselinePath : null,
    greenRuns: existsSync(greenRunsPath) ? greenRunsPath : null,
    securityDrift: existsSync(securityDriftPath) ? securityDriftPath : null,
  },
  snapshots: trimmedSnapshots,
};

const recent = [...trimmedSnapshots].reverse().slice(0, 20);
const lines = [];
lines.push('# Quality Ledger');
lines.push('');
lines.push(`- Generated: ${ledger.generated}`);
lines.push(`- Snapshots tracked: ${trimmedSnapshots.length}`);
lines.push(`- Current consecutive green runs: ${fmt(snapshot.stability.consecutiveSuccess)} / ${fmt(snapshot.stability.requiredConsecutive)}`);
lines.push('');
lines.push('| Generated | Security | Runtime A11y % | Perf Budgets | Coverage (S/B/F/L) | LH Perf | Green Runs |');
lines.push('|---|---|---:|---|---|---:|---:|');

for (const entry of recent) {
  lines.push(
    `| ${entry.generated} | ${entry.security.status} (C${fmt(entry.security.critical)} H${fmt(entry.security.high)} M${fmt(entry.security.moderate)} L${fmt(entry.security.low)}) | ${fmt(entry.a11y.runtimeCoveragePct)} | ${entry.performance.routeBudgetsStatus}/${entry.performance.chunkBudgetsStatus}/${entry.performance.interactionBudgetsStatus} | ${fmt(entry.coverage.statements)}/${fmt(entry.coverage.branches)}/${fmt(entry.coverage.functions)}/${fmt(entry.coverage.lines)} | ${fmt(entry.lighthouse.performance)} | ${fmt(entry.stability.consecutiveSuccess)} |`
  );
}

mkdirSync(dirname(outputJsonPath), { recursive: true });
writeFileSync(outputJsonPath, JSON.stringify(ledger, null, 2) + '\n');
writeFileSync(outputMdPath, `${lines.join('\n')}\n`);

console.log(`Quality ledger written to ${outputJsonPath} and ${outputMdPath}.`);
