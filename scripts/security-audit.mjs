#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const args = process.argv.slice(2);
const DEFAULT_OUTPUT = resolve('.quality/security-summary.json');
const DEFAULT_ALLOWLIST = resolve('.quality/security-allowlist.json');
const DEFAULT_POLICY = resolve('.quality/security-policy.json');

function parseOption(name, fallback = null) {
  const eq = args.find((entry) => entry.startsWith(`--${name}=`));
  if (eq) return eq.split('=')[1] ?? fallback;
  const index = args.indexOf(`--${name}`);
  if (index >= 0) return args[index + 1] ?? fallback;
  return fallback;
}

function hasFlag(name) {
  return args.includes(`--${name}`) || args.some((entry) => entry.startsWith(`--${name}=`));
}

function readJson(path, fallback = null) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function parseDateOrNull(value) {
  if (!value || typeof value !== 'string') return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
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

function sortCheckpoints(checkpoints) {
  return [...checkpoints]
    .filter((checkpoint) => checkpoint && typeof checkpoint.date === 'string')
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}

function resolveCheckpoint(checkpoints, referenceTime) {
  if (checkpoints.length === 0) return null;
  const reached = checkpoints.filter((checkpoint) => Date.parse(checkpoint.date) <= referenceTime);
  if (reached.length > 0) return reached[reached.length - 1];
  return checkpoints[0];
}

const outputPath = resolve(parseOption('json-out', DEFAULT_OUTPUT));
const allowlistPath = resolve(parseOption('allowlist', DEFAULT_ALLOWLIST));
const policyPath = resolve(parseOption('policy', DEFAULT_POLICY));
const omitOption = parseOption('omit', null);
const scope = omitOption === 'dev' || hasFlag('prod') ? 'prod' : 'full';
const now = Date.now();
const dateOverride = parseOption('date', process.env.SECURITY_POLICY_DATE ?? null);
const referenceTime = dateOverride ? parseDateOrNull(dateOverride) : now;

if (dateOverride && referenceTime === null) {
  console.error(`Invalid --date/SECURITY_POLICY_DATE value: ${dateOverride}`);
  process.exit(1);
}

const rawOutputPath = resolve(
  parseOption(
    'raw-out',
    scope === 'prod' ? '.quality/security-audit-prod-raw.json' : '.quality/security-audit-raw.json'
  )
);
const auditFixturePath = parseOption('audit-fixture', null);

const policy = readJson(policyPath, null);
if (!policy) {
  console.error(`Missing security policy: ${policyPath}`);
  process.exit(1);
}

const checkpoints = sortCheckpoints(Array.isArray(policy.checkpoints) ? policy.checkpoints : []);
if (!checkpoints.length) {
  console.error(`Security policy has no checkpoints: ${policyPath}`);
  process.exit(1);
}

const rules = {
  maxCritical: Number.isFinite(policy.rules?.maxCritical) ? policy.rules.maxCritical : 0,
  maxHigh: Number.isFinite(policy.rules?.maxHigh) ? policy.rules.maxHigh : 0,
};

const checkpoint = resolveCheckpoint(checkpoints, referenceTime ?? now);
if (!checkpoint) {
  console.error('Unable to resolve active security checkpoint.');
  process.exit(1);
}

const checkpointRules = {
  maxModerate: Number.isFinite(checkpoint.maxModerate) ? checkpoint.maxModerate : Number.POSITIVE_INFINITY,
  maxLow: Number.isFinite(checkpoint.maxLow) ? checkpoint.maxLow : Number.POSITIVE_INFINITY,
};

const allowlistPolicy = {
  maxDurationDays: Number.isFinite(policy.allowlist?.maxDurationDays) ? policy.allowlist.maxDurationDays : 14,
  requiredFields: Array.isArray(policy.allowlist?.requiredFields)
    ? policy.allowlist.requiredFields
    : ['package', 'severity', 'reason', 'owner', 'created', 'expires', 'trackingIssue'],
};

const allowlistRaw = readJson(allowlistPath, { version: 1, entries: [] });
const allowlistEntries = Array.isArray(allowlistRaw?.entries) ? allowlistRaw.entries : [];

const malformedAllowlistEntries = [];
const expiredAllowlistEntries = [];
const activeAllowlistEntries = [];

for (const entry of allowlistEntries) {
  const missingFields = allowlistPolicy.requiredFields.filter((field) => {
    const value = entry?.[field];
    return typeof value !== 'string' || value.trim().length === 0;
  });

  const createdAt = parseDateOrNull(entry?.created);
  const expiresAt = parseDateOrNull(entry?.expires);
  const severity = entry?.severity;
  const durationMs = createdAt !== null && expiresAt !== null ? expiresAt - createdAt : null;

  const validationErrors = [];
  if (missingFields.length > 0) validationErrors.push(`missing required fields: ${missingFields.join(', ')}`);
  if (createdAt === null) validationErrors.push('invalid created date');
  if (expiresAt === null) validationErrors.push('invalid expires date');
  if (createdAt !== null && expiresAt !== null && expiresAt < createdAt) validationErrors.push('expires precedes created');
  if (!['critical', 'high', 'moderate', 'low', 'info'].includes(severity)) validationErrors.push(`invalid severity: ${severity}`);
  if (
    durationMs !== null
    && durationMs > allowlistPolicy.maxDurationDays * 24 * 60 * 60 * 1000
  ) {
    validationErrors.push(`expiry exceeds max duration of ${allowlistPolicy.maxDurationDays} days`);
  }

  if (validationErrors.length > 0) {
    malformedAllowlistEntries.push({ entry, errors: validationErrors });
    continue;
  }

  if ((expiresAt ?? 0) < now) {
    expiredAllowlistEntries.push(entry);
    continue;
  }

  activeAllowlistEntries.push(entry);
}

let auditReport;
let command = 'fixture';

if (auditFixturePath) {
  const resolvedFixturePath = resolve(auditFixturePath);
  if (!existsSync(resolvedFixturePath)) {
    console.error(`Missing --audit-fixture file: ${resolvedFixturePath}`);
    process.exit(1);
  }
  auditReport = JSON.parse(readFileSync(resolvedFixturePath, 'utf-8'));
  command = `fixture:${resolvedFixturePath}`;
} else {
  const omitArg = scope === 'prod' ? '--omit=dev' : '';
  command = ['npm', 'audit', '--json', omitArg].filter(Boolean).join(' ');

  try {
    const raw = execSync(command, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
    auditReport = JSON.parse(raw);
  } catch (error) {
    const stdout = error?.stdout?.toString?.() ?? '';
    if (!stdout.trim()) {
      console.error(`Failed to run security audit command: ${command}`);
      process.exit(1);
    }
    auditReport = JSON.parse(stdout);
  }
}

mkdirSync(dirname(rawOutputPath), { recursive: true });
writeFileSync(rawOutputPath, JSON.stringify(auditReport, null, 2) + '\n');

const vulnerabilitiesMap = auditReport.vulnerabilities ?? {};
const vulnerabilities = Object.entries(vulnerabilitiesMap).map(([pkg, data]) => ({
  package: pkg,
  severity: data?.severity ?? 'info',
  via: data?.via ?? [],
  fixAvailable: data?.fixAvailable ?? null,
}));

function matchAllowlist(vulnerability) {
  return activeAllowlistEntries.find((entry) => (
    entry.package === vulnerability.package
    && entry.severity === vulnerability.severity
  )) ?? null;
}

const suppressed = [];
const unsuppressed = [];
for (const vulnerability of vulnerabilities) {
  const allow = matchAllowlist(vulnerability);
  if (allow) {
    suppressed.push({
      ...vulnerability,
      allowlist: {
        owner: allow.owner,
        reason: allow.reason,
        created: allow.created,
        expires: allow.expires,
        trackingIssue: allow.trackingIssue,
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
if (malformedAllowlistEntries.length > 0) {
  failures.push(`malformed allowlist entries: ${malformedAllowlistEntries.length}`);
}
if (expiredAllowlistEntries.length > 0) {
  failures.push(`expired allowlist entries: ${expiredAllowlistEntries.length}`);
}
if (unsuppressedCounts.critical > rules.maxCritical) {
  failures.push(`unsuppressed critical vulnerabilities ${unsuppressedCounts.critical} exceed max ${rules.maxCritical}`);
}
if (unsuppressedCounts.high > rules.maxHigh) {
  failures.push(`unsuppressed high vulnerabilities ${unsuppressedCounts.high} exceed max ${rules.maxHigh}`);
}
if (scope === 'full') {
  if (unsuppressedCounts.moderate > checkpointRules.maxModerate) {
    failures.push(
      `unsuppressed moderate vulnerabilities ${unsuppressedCounts.moderate} exceed checkpoint max ${checkpointRules.maxModerate} (effective ${checkpoint.date})`
    );
  }
  if (unsuppressedCounts.low > checkpointRules.maxLow) {
    failures.push(
      `unsuppressed low vulnerabilities ${unsuppressedCounts.low} exceed checkpoint max ${checkpointRules.maxLow} (effective ${checkpoint.date})`
    );
  }
}

const summary = {
  generated: new Date().toISOString(),
  scope,
  sourceCommand: command,
  source: 'npm audit --json',
  rawAuditPath: rawOutputPath,
  allowlistPath,
  policyPath,
  policyReferenceDate: new Date(referenceTime ?? now).toISOString(),
  checkpoint,
  rules,
  checkpointRules,
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
    maxDurationDays: allowlistPolicy.maxDurationDays,
    activeCount: activeAllowlistEntries.length,
    active: activeAllowlistEntries,
    expiredCount: expiredAllowlistEntries.length,
    expired: expiredAllowlistEntries,
    malformedCount: malformedAllowlistEntries.length,
    malformed: malformedAllowlistEntries,
  },
  status: failures.length === 0 ? 'pass' : 'fail',
  failures,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(summary, null, 2) + '\n');

if (summary.status === 'fail') {
  console.error(`Security audit gate failed (${scope} scope):`);
  failures.forEach((message) => console.error(`- ${message}`));
  unsuppressed
    .filter((vulnerability) => ['critical', 'high', 'moderate', 'low'].includes(vulnerability.severity))
    .forEach((vulnerability) => {
      console.error(`  • ${vulnerability.package} [${vulnerability.severity}]`);
    });
  process.exit(1);
}

console.log(`Security audit gate passed (${scope} scope).`);
console.log(
  `Unsuppressed vulnerabilities: critical=${unsuppressedCounts.critical} high=${unsuppressedCounts.high} moderate=${unsuppressedCounts.moderate} low=${unsuppressedCounts.low}`
);
