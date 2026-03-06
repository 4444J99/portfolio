#!/usr/bin/env node
/**
 * Advance or sync the quality ratchet default phase across policy, workflow, and CI.
 * Updates: ratchet-policy.json defaultPhase, quality.yml QUALITY_PHASE.
 *
 * Usage:
 *   node scripts/advance-ratchet-phase.mjs --phase W10 --dry-run   # preview
 *   node scripts/advance-ratchet-phase.mjs --phase W10 --confirm   # apply
 *
 * Phase must be an existing phase in ratchet-policy.json (W2, W4, W6, W8, W10).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const POLICY_PATH = path.join(ROOT, '.quality/ratchet-policy.json');
const WORKFLOW_PATH = path.join(ROOT, '.github/workflows/quality.yml');

const VALID_PHASES = ['W2', 'W4', 'W6', 'W8', 'W10'];

function parseArgs() {
  const args = process.argv.slice(2);
  let phase = null;
  let dryRun = false;
  let confirm = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--phase' && args[i + 1]) {
      phase = args[i + 1];
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (args[i] === '--confirm') {
      confirm = true;
    }
  }

  return { phase, dryRun, confirm };
}

function main() {
  const { phase, dryRun, confirm } = parseArgs();

  if (!phase) {
    console.error('Usage: node scripts/advance-ratchet-phase.mjs --phase W10 [--dry-run] [--confirm]');
    console.error('  --phase W2|W4|W6|W8|W10  Target phase (must exist in policy)');
    console.error('  --dry-run                 Preview changes without writing');
    console.error('  --confirm                 Required to write; prevents accidental runs');
    process.exit(1);
  }

  if (!VALID_PHASES.includes(phase)) {
    console.error(`Error: Phase must be one of ${VALID_PHASES.join(', ')}`);
    process.exit(1);
  }

  if (!dryRun && !confirm) {
    console.error('Error: --confirm required to apply changes. Use --dry-run to preview.');
    process.exit(1);
  }

  const policy = JSON.parse(fs.readFileSync(POLICY_PATH, 'utf-8'));
  const workflow = fs.readFileSync(WORKFLOW_PATH, 'utf-8');

  if (!policy.phases?.[phase]) {
    console.error(`Error: Phase ${phase} not found in ratchet-policy.json`);
    process.exit(1);
  }

  const currentPhase = policy.defaultPhase;
  if (currentPhase === phase && !workflow.includes(`QUALITY_PHASE: ${phase}`)) {
    console.log(`Phase ${phase} already default in policy; workflow may be out of sync.`);
  }

  const policyChanged = currentPhase !== phase;
  const workflowNeedsUpdate = !workflow.includes(`QUALITY_PHASE: ${phase}`);

  if (!policyChanged && !workflowNeedsUpdate) {
    console.log(`No changes needed. Default phase is already ${phase}.`);
    process.exit(0);
  }

  console.log('Planned changes:');
  if (policyChanged) {
    console.log(`  ratchet-policy.json: defaultPhase ${currentPhase} → ${phase}`);
  }
  if (workflowNeedsUpdate) {
    console.log(`  quality.yml: QUALITY_PHASE → ${phase}`);
  }

  if (dryRun) {
    console.log('\n[--dry-run] No files modified.');
    process.exit(0);
  }

  if (policyChanged) {
    policy.defaultPhase = phase;
    fs.writeFileSync(POLICY_PATH, JSON.stringify(policy, null, 2) + '\n');
    console.log('  ✓ Updated ratchet-policy.json');
  }

  if (workflowNeedsUpdate) {
    const updated = workflow.replace(/QUALITY_PHASE:\s*\w+/g, `QUALITY_PHASE: ${phase}`);
    fs.writeFileSync(WORKFLOW_PATH, updated);
    console.log('  ✓ Updated quality.yml');
  }

  console.log('\nDone. Run "npm run test" to verify quality governance tests pass.');
}

main();
