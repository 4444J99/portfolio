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

const outputPath = resolve(parseOption('json-out', '.quality/green-run-history.json'));
const apiBase = parseOption('api-base', 'https://api.github.com');
const workflowFile = parseOption('workflow', 'quality.yml');
const branch = parseOption('branch', 'main');
const maxRuns = Number(parseOption('max-runs', '30'));
const repository = parseOption('repo', process.env.GITHUB_REPOSITORY ?? null);
const token = parseOption('token', process.env.GITHUB_TOKEN ?? null); // allow-secret: env token placeholder only
const registerPath = resolve(parseOption('register', '.quality/security-register.json'));
const dateOverride = parseOption('date', process.env.GREEN_RUN_POLICY_DATE ?? null);
const referenceTime = dateOverride ? parseDateOrNull(dateOverride) : Date.now();

if (dateOverride && referenceTime === null) {
  console.error(`Invalid --date/GREEN_RUN_POLICY_DATE value: ${dateOverride}`);
  process.exit(1);
}

function writeSummary(summary) {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(summary, null, 2) + '\n');
}

let requiredConsecutive = Number(parseOption('required', '5'));
let enforceAfterDate = null;
if (existsSync(registerPath)) {
  const register = JSON.parse(readFileSync(registerPath, 'utf-8'));
  const maybeRequired = Number(register?.exitCriteria?.consecutiveGreenRuns);
  if (Number.isFinite(maybeRequired) && maybeRequired > 0) {
    requiredConsecutive = maybeRequired;
  }
  enforceAfterDate = register?.window?.end ?? null;
}

if (!repository || !token) {
  const summary = {
    generated: new Date().toISOString(),
    source: 'GitHub Actions Workflow Runs API',
    repository: repository ?? null,
    workflow: workflowFile,
    branch,
    requiredConsecutive,
    enforceAfterDate,
    status: 'skipped',
    reason: 'Missing GITHUB_REPOSITORY or GITHUB_TOKEN',
    consecutiveSuccess: null,
    runs: [],
  };
  writeSummary(summary);
  console.log('Green-run tracker skipped (missing token/repository context).');
  process.exit(0);
}

const runsUrl = new URL(`${apiBase}/repos/${repository}/actions/workflows/${workflowFile}/runs`);
runsUrl.searchParams.set('branch', branch);
runsUrl.searchParams.set('per_page', String(maxRuns));
runsUrl.searchParams.set('exclude_pull_requests', 'false');

const response = await fetch(runsUrl, {
  headers: {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  },
});

if (!response.ok) {
  const body = await response.text();
  const summary = {
    generated: new Date().toISOString(),
    source: 'GitHub Actions Workflow Runs API',
    repository,
    workflow: workflowFile,
    branch,
    requiredConsecutive,
    enforceAfterDate,
    status: 'fail',
    reason: `GitHub API request failed: HTTP ${response.status}`,
    responseBody: body.slice(0, 1000),
    consecutiveSuccess: null,
    runs: [],
  };
  writeSummary(summary);
  console.error(`Green-run tracker failed: HTTP ${response.status}`);
  process.exit(1);
}

const payload = await response.json();
const workflowRuns = Array.isArray(payload?.workflow_runs) ? payload.workflow_runs : [];

const runs = workflowRuns.map((run) => ({
  id: run.id,
  runNumber: run.run_number,
  event: run.event,
  status: run.status,
  conclusion: run.conclusion,
  htmlUrl: run.html_url,
  createdAt: run.created_at,
  updatedAt: run.updated_at,
}));

let consecutiveSuccess = 0;
for (const run of runs) {
  if (run.status !== 'completed') break;
  if (run.conclusion !== 'success') break;
  consecutiveSuccess += 1;
}

const enforceAfterTs = parseDateOrNull(enforceAfterDate);
const enforceNow = enforceAfterTs !== null && (referenceTime ?? Date.now()) >= enforceAfterTs;
const status = enforceNow && consecutiveSuccess < requiredConsecutive ? 'fail' : 'pass';

const summary = {
  generated: new Date().toISOString(),
  source: 'GitHub Actions Workflow Runs API',
  repository,
  workflow: workflowFile,
  branch,
  requiredConsecutive,
  enforceAfterDate,
  enforceNow,
  policyReferenceDate: new Date(referenceTime ?? Date.now()).toISOString(),
  consecutiveSuccess,
  latestRun: runs[0] ?? null,
  runs,
  status,
};

writeSummary(summary);

if (status === 'fail') {
  console.error(
    `Green-run tracker failed: consecutive successful runs ${consecutiveSuccess} is below required ${requiredConsecutive} (enforced after ${enforceAfterDate}).`
  );
  process.exit(1);
}

console.log(`Green-run tracker recorded ${consecutiveSuccess} consecutive successful run(s).`);
