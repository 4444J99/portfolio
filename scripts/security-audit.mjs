#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const args = process.argv.slice(2);
const DEFAULT_OUTPUT = resolve('.quality/security-summary.json');
const DEFAULT_ALLOWLIST = resolve('.quality/security-allowlist.json');
const RULES = {
  maxCritical: 0,
  maxHigh: 0,
};

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

function safeDate(value) {
  if (!value) return null;
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : null;
}

function tallyBySeverity(items) {
  const counts = {
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
    info: 0,
    total: 0,
  };

  for (const item of items) {
    const severity = item.severity ?? 'info';
    if (severity in counts) counts[severity] += 1;
    counts.total += 1;
  }

  return counts;
}

const outputPath = resolve(parseOption('json-out', DEFAULT_OUTPUT));
const allowlistPath = resolve(parseOption('allowlist', DEFAULT_ALLOWLIST));
const now = Date.now();

const allowlistRaw = readJson(allowlistPath, { version: 1, entries: [] });
const allowlistEntries = Array.isArray(allowlistRaw?.entries) ? allowlistRaw.entries : [];
const expiredAllowlistEntries = [];
const activeAllowlistEntries = [];

for (const entry of allowlistEntries) {
  const expiresTs = safeDate(entry.expires);
  if (expiresTs !== null && expiresTs < now) {
    expiredAllowlistEntries.push(entry);
    continue;
  }
  activeAllowlistEntries.push(entry);
}

let auditReport;
try {
  const raw = execSync('npm audit --json', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
  auditReport = JSON.parse(raw);
} catch (error) {
  const stdout = error?.stdout?.toString?.() ?? '';
  if (!stdout.trim()) {
    console.error('Failed to run npm audit.');
    process.exit(1);
  }
  auditReport = JSON.parse(stdout);
}

const vulnerabilitiesMap = auditReport.vulnerabilities ?? {};
const vulnerabilities = Object.entries(vulnerabilitiesMap).map(([pkg, data]) => ({
  package: pkg,
  severity: data?.severity ?? 'info',
  via: data?.via ?? [],
  fixAvailable: data?.fixAvailable ?? null,
}));

function matchAllowlist(vulnerability) {
  return activeAllowlistEntries.find((entry) => {
    if (entry.package !== vulnerability.package) return false;
    if (entry.severity && entry.severity !== vulnerability.severity) return false;
    return true;
  }) ?? null;
}

const suppressed = [];
const unsuppressed = [];

for (const vulnerability of vulnerabilities) {
  const allow = matchAllowlist(vulnerability);
  if (allow) {
    suppressed.push({
      ...vulnerability,
      allowlist: {
        owner: allow.owner ?? null,
        reason: allow.reason ?? null,
        expires: allow.expires ?? null,
      },
    });
  } else {
    unsuppressed.push(vulnerability);
  }
}

const suppressedCounts = tallyBySeverity(suppressed);
const unsuppressedCounts = tallyBySeverity(unsuppressed);
const metadataCounts = auditReport.metadata?.vulnerabilities ?? {
  critical: 0,
  high: 0,
  moderate: 0,
  low: 0,
  info: 0,
  total: 0,
};

const failures = [];
if (expiredAllowlistEntries.length > 0) {
  failures.push(`expired allowlist entries: ${expiredAllowlistEntries.length}`);
}
if (unsuppressedCounts.critical > RULES.maxCritical) {
  failures.push(`unsuppressed critical vulnerabilities ${unsuppressedCounts.critical} exceed max ${RULES.maxCritical}`);
}
if (unsuppressedCounts.high > RULES.maxHigh) {
  failures.push(`unsuppressed high vulnerabilities ${unsuppressedCounts.high} exceed max ${RULES.maxHigh}`);
}

const summary = {
  generated: new Date().toISOString(),
  source: 'npm audit --json',
  allowlistPath,
  rules: RULES,
  metadata: {
    vulnerabilities: metadataCounts,
  },
  unsuppressed: {
    counts: unsuppressedCounts,
    vulnerabilities: unsuppressed,
  },
  suppressed: {
    counts: suppressedCounts,
    vulnerabilities: suppressed,
  },
  allowlist: {
    active: activeAllowlistEntries,
    expired: expiredAllowlistEntries,
  },
  status: failures.length === 0 ? 'pass' : 'fail',
  failures,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(summary, null, 2) + '\n');

if (summary.status === 'fail') {
  console.error('Security audit gate failed:');
  failures.forEach((message) => console.error(`- ${message}`));
  unsuppressed
    .filter((vulnerability) => vulnerability.severity === 'critical' || vulnerability.severity === 'high')
    .forEach((vulnerability) => {
      console.error(`  • ${vulnerability.package} [${vulnerability.severity}]`);
    });
  process.exit(1);
}

console.log('Security audit gate passed.');
console.log(
  `Unsuppressed vulnerabilities: critical=${unsuppressedCounts.critical} high=${unsuppressedCounts.high} moderate=${unsuppressedCounts.moderate} low=${unsuppressedCounts.low}`
);
