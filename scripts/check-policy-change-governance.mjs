#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const args = process.argv.slice(2);

function parseOption(name, fallback = null) {
  const eq = args.find((entry) => entry.startsWith(`--${name}=`));
  if (eq) return eq.split('=')[1] ?? fallback;
  const index = args.indexOf(`--${name}`);
  if (index >= 0) return args[index + 1] ?? fallback;
  return fallback;
}

function hasChecked(body, pattern) {
  return pattern.test(body);
}

const outputPath = resolve(parseOption('json-out', '.quality/policy-governance-summary.json'));
const baseSha = parseOption('base', process.env.GITHUB_BASE_SHA ?? null);
const headSha = parseOption('head', process.env.GITHUB_HEAD_SHA ?? process.env.GITHUB_SHA ?? null);
const prBody = parseOption('pr-body', process.env.PR_BODY ?? '');

const summary = {
  generated: new Date().toISOString(),
  source: 'git diff + pull_request body checklist',
  baseSha,
  headSha,
  changedFiles: [],
  checks: {
    securityPolicyCheckbox: false,
    securityAllowlistCheckbox: false,
    perfBudgetCheckbox: false,
  },
  status: 'pass',
  failures: [],
};

if (!baseSha || !headSha) {
  summary.status = 'skipped';
  summary.failures.push('Missing base/head SHA context; governance check applies only to pull_request runs.');
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(summary, null, 2) + '\n');
  console.log('Policy governance check skipped (non-PR context).');
  process.exit(0);
}

let changedFiles = [];
try {
  const diffOutput = execSync(`git diff --name-only ${baseSha}..${headSha}`, { encoding: 'utf-8' });
  changedFiles = diffOutput
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
} catch (error) {
  summary.status = 'fail';
  summary.failures.push(`Failed to read git diff for ${baseSha}..${headSha}`);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(summary, null, 2) + '\n');
  console.error(summary.failures[0]);
  process.exit(1);
}

summary.changedFiles = changedFiles;

const securityPolicyFiles = new Set([
  '.quality/security-policy.json',
  '.quality/security-allowlist.json',
  '.quality/security-register.json',
  'scripts/security-audit.mjs',
]);

const perfPolicyFiles = new Set([
  'scripts/check-bundle-budgets.mjs',
  'scripts/collect-performance-metrics.mjs',
  '.quality/ratchet-policy.json',
]);

const changedSecurityPolicy = changedFiles.some((file) => securityPolicyFiles.has(file));
const changedPerfPolicy = changedFiles.some((file) => perfPolicyFiles.has(file));

summary.checks.securityPolicyCheckbox = hasChecked(prBody, /\[[xX]\]\s*Security policy impact reviewed/i);
summary.checks.securityAllowlistCheckbox = hasChecked(prBody, /\[[xX]\]\s*Security allowlist impact reviewed/i);
summary.checks.perfBudgetCheckbox = hasChecked(prBody, /\[[xX]\]\s*No route budget regressions/i);

if (changedSecurityPolicy && !summary.checks.securityPolicyCheckbox) {
  summary.failures.push('Security policy files changed but PR checklist does not confirm policy impact review.');
}

if (changedSecurityPolicy && !summary.checks.securityAllowlistCheckbox) {
  summary.failures.push('Security policy files changed but PR checklist does not confirm allowlist impact review.');
}

if (changedPerfPolicy && !summary.checks.perfBudgetCheckbox) {
  summary.failures.push('Performance policy files changed but PR checklist does not confirm budget regression review.');
}

summary.status = summary.failures.length > 0 ? 'fail' : 'pass';

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(summary, null, 2) + '\n');

if (summary.status === 'fail') {
  console.error('Policy governance check failed:');
  summary.failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Policy governance check passed.');
