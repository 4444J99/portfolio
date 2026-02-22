#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseOption } from './lib/cli-utils.mjs';

function emptyCounts() {
  return {
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
    unknown: 0,
    total: 0,
  };
}

const outputPath = resolve(parseOption('json-out', '.quality/github-advisory-summary.json'));
const apiBase = parseOption('api-base', 'https://api.github.com');
const repository = parseOption('repo', process.env.GITHUB_REPOSITORY ?? null);
const token = parseOption('token', process.env.GITHUB_TOKEN ?? null); // allow-secret: env token placeholder only
const maxOpen = Number(parseOption('max-open', '0'));

if (!Number.isFinite(maxOpen) || maxOpen < 0) {
  console.error(`Invalid --max-open value: ${maxOpen}`);
  process.exit(1);
}

function writeSummary(summary) {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(summary, null, 2) + '\n');
}

if (!repository || !token) {
  const summary = {
    generated: new Date().toISOString(),
    source: 'GitHub Dependabot Alerts API',
    repository: repository ?? null,
    status: 'skipped',
    reason: 'Missing GITHUB_REPOSITORY or GITHUB_TOKEN',
    counts: emptyCounts(),
    maxOpen,
    alerts: [],
  };

  writeSummary(summary);
  console.log('GitHub advisory delta check skipped (missing token/repository context).');
  process.exit(0);
}

const endpoint = `${apiBase}/repos/${repository}/dependabot/alerts`;
const counts = emptyCounts();
const alerts = [];

let page = 1;

while (true) {
  const url = new URL(endpoint);
  url.searchParams.set('state', 'open');
  url.searchParams.set('per_page', '100');
  url.searchParams.set('page', String(page));

  const response = await fetch(url, {
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
      source: 'GitHub Dependabot Alerts API',
      repository,
      status: 'fail',
      reason: `GitHub API request failed: HTTP ${response.status}`,
      responseBody: body.slice(0, 1000),
      counts,
      maxOpen,
      alerts,
    };
    writeSummary(summary);
    console.error(`GitHub advisory delta check failed: HTTP ${response.status}`);
    console.error(body.slice(0, 500));
    process.exit(1);
  }

  const pageAlerts = await response.json();
  if (!Array.isArray(pageAlerts) || pageAlerts.length === 0) break;

  for (const alert of pageAlerts) {
    const severity = alert?.security_advisory?.severity ?? alert?.security_vulnerability?.severity ?? 'unknown';
    if (severity in counts) counts[severity] += 1;
    else counts.unknown += 1;
    counts.total += 1;

    alerts.push({
      number: alert.number ?? null,
      state: alert.state ?? null,
      dependency: alert?.dependency?.package?.name ?? null,
      severity,
      summary: alert?.security_advisory?.summary ?? null,
      advisoryGhsaId: alert?.security_advisory?.ghsa_id ?? null,
      url: alert?.html_url ?? null,
    });
  }

  if (pageAlerts.length < 100) break;
  page += 1;
}

const status = counts.total <= maxOpen ? 'pass' : 'fail';
const summary = {
  generated: new Date().toISOString(),
  source: 'GitHub Dependabot Alerts API',
  repository,
  status,
  counts,
  maxOpen,
  alerts,
};

writeSummary(summary);

if (status === 'fail') {
  console.error(
    `GitHub advisory delta check failed: ${counts.total} open alerts (critical=${counts.critical}, high=${counts.high}, moderate=${counts.moderate}, low=${counts.low}, unknown=${counts.unknown})`
  );
  process.exit(1);
}

console.log(
  `GitHub advisory delta check passed: ${counts.total} open alerts (critical=${counts.critical}, high=${counts.high}, moderate=${counts.moderate}, low=${counts.low}).`
);
