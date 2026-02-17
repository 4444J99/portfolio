#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const ANSI_PATTERN = /\u001b\[[0-9;]*m/g;
const POLICY_PATH = resolve('.quality/ratchet-policy.json');
const SUMMARY_PATH = resolve('.quality/typecheck-summary.json');

function parseOption(argv, key) {
  const equalsArg = argv.find((entry) => entry.startsWith(`--${key}=`));
  if (equalsArg) return equalsArg.split('=')[1] ?? null;

  const index = argv.indexOf(`--${key}`);
  if (index >= 0) return argv[index + 1] ?? null;

  return null;
}

function loadPolicy() {
  if (!existsSync(POLICY_PATH)) {
    throw new Error(`Missing ratchet policy: ${POLICY_PATH}`);
  }
  return JSON.parse(readFileSync(POLICY_PATH, 'utf-8'));
}

function resolvePhase(argv, policy) {
  return parseOption(argv, 'phase') || process.env.QUALITY_PHASE || policy.defaultPhase || 'W6';
}

function resolveBudget(argv, policy, phase) {
  const cliBudget = parseOption(argv, 'budget');
  if (cliBudget !== null) return Number.parseInt(cliBudget, 10);

  const envBudget = process.env.TYPECHECK_HINT_BUDGET;
  if (envBudget !== undefined) return Number.parseInt(envBudget, 10);

  const phaseBudget = policy.phases?.[phase]?.typecheck?.hintsMax;
  if (typeof phaseBudget === 'number') return phaseBudget;

  return 0;
}

const args = process.argv.slice(2);
const policy = loadPolicy();
const phase = resolvePhase(args, policy);
const budget = resolveBudget(args, policy, phase);

if (!Number.isFinite(budget) || budget < 0) {
  console.error('[typecheck:strict] Invalid hint budget. Use a non-negative integer.');
  process.exit(1);
}

const child = spawn('npx', ['astro', 'check'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: process.platform === 'win32',
  env: process.env,
});

let combinedOutput = '';

child.stdout.on('data', (chunk) => {
  const text = chunk.toString();
  combinedOutput += text;
  process.stdout.write(text);
});

child.stderr.on('data', (chunk) => {
  const text = chunk.toString();
  combinedOutput += text;
  process.stderr.write(text);
});

child.on('close', (code) => {
  const cleaned = combinedOutput.replaceAll(ANSI_PATTERN, '');
  const summaryMatch = cleaned.match(/-\s*(\d+)\s+hints?/i);
  const hints = summaryMatch
    ? Number.parseInt(summaryMatch[1], 10)
    : (cleaned.match(/\b(?:ts|astro)\(\d+\):/g) ?? []).length;

  const status = code === 0 && hints <= budget ? 'pass' : 'fail';
  const summary = {
    generated: new Date().toISOString(),
    phase,
    budget,
    hints,
    status,
    astroExitCode: code ?? 1,
  };

  mkdirSync(dirname(SUMMARY_PATH), { recursive: true });
  writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2) + '\n');

  if (code !== 0) {
    process.exit(code ?? 1);
  }

  if (hints > budget) {
    console.error(`\n[typecheck:strict] Hint budget exceeded for phase ${phase}: ${hints} hints (budget ${budget}).`);
    process.exit(1);
  }

  console.log(`\n[typecheck:strict] OK for phase ${phase}: ${hints} hints (budget ${budget}).`);
  process.exit(0);
});
