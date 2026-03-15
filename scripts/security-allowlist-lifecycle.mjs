#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ALLOWLIST_PATH = resolve('.quality/security-allowlist.json');
const RENEWAL_WINDOW_DAYS = 3;
const RENEWAL_EXTENSION_DAYS = 14;

function readJson(path) {
	if (!existsSync(path)) {
		console.error(`Missing allowlist file: ${path}`);
		process.exit(2);
	}
	return JSON.parse(readFileSync(path, 'utf-8'));
}

function toIsoDate(timestamp) {
	return new Date(timestamp).toISOString().slice(0, 10);
}

function addDays(isoDate, days) {
	const ms = Date.parse(isoDate) + days * 24 * 60 * 60 * 1000;
	return toIsoDate(ms);
}

function runAudit() {
	try {
		const raw = execSync('npm audit --json', {
			encoding: 'utf-8',
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		return JSON.parse(raw);
	} catch (error) {
		const stdout = error?.stdout?.toString?.() ?? '';
		if (!stdout.trim()) {
			console.error('Failed to run npm audit --json');
			process.exit(2);
		}
		return JSON.parse(stdout);
	}
}

const allowlistRaw = readJson(ALLOWLIST_PATH);
const entries = Array.isArray(allowlistRaw?.entries) ? allowlistRaw.entries : [];

const auditReport = runAudit();
const vulnerabilitiesMap = auditReport.vulnerabilities ?? {};

// Build a Set of package names currently in the audit report
const auditPackages = new Set(Object.keys(vulnerabilitiesMap));

const now = Date.now();
const renewalCutoff = now + RENEWAL_WINDOW_DAYS * 24 * 60 * 60 * 1000;

const removed = [];
const renewed = [];
const unchanged = [];
const updatedEntries = [];

for (const entry of entries) {
	const inAudit = auditPackages.has(entry.package);

	if (!inAudit) {
		// Vulnerability is gone — remove from allowlist
		removed.push({ package: entry.package, severity: entry.severity });
		continue;
	}

	const expiresAt = Date.parse(entry.expires);

	if (Number.isFinite(expiresAt) && expiresAt <= renewalCutoff) {
		// Expiring within 3 days and still vulnerable — auto-renew
		const newExpires = addDays(entry.expires, RENEWAL_EXTENSION_DAYS);
		const renewalNote = `[auto-renewed ${toIsoDate(now)}]`;
		const updatedEntry = {
			...entry,
			expires: newExpires,
			reason: entry.reason.includes('[auto-renewed')
				? entry.reason.replace(/\[auto-renewed [^\]]+\]/, renewalNote)
				: `${entry.reason} ${renewalNote}`,
		};
		renewed.push({ package: entry.package, severity: entry.severity, newExpires });
		updatedEntries.push(updatedEntry);
	} else {
		unchanged.push({ package: entry.package, severity: entry.severity });
		updatedEntries.push(entry);
	}
}

const summary = {
	removed,
	renewed,
	unchanged,
	timestamp: new Date().toISOString(),
};

const hasChanges = removed.length > 0 || renewed.length > 0;

if (hasChanges) {
	const updated = { ...allowlistRaw, entries: updatedEntries };
	writeFileSync(ALLOWLIST_PATH, JSON.stringify(updated, null, '\t') + '\n');
}

console.log(JSON.stringify(summary, null, '\t'));

process.exit(hasChanges ? 1 : 0);
