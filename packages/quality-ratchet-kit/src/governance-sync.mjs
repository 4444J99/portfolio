import { readFileSync } from 'node:fs';

/**
 * Validate that README ratchet values match JSON policy values.
 * @param {string} readmePath - Path to README.md
 * @param {object} policy - Parsed ratchet policy object
 * @returns {{ synced: boolean, mismatches: string[] }}
 */
export function validateGovernanceSync(readmePath, policy) {
  const readme = readFileSync(readmePath, 'utf-8');
  const mismatches = [];

  const coverageMatch = readme.match(
    /Coverage ratchet policy:\s*W2 `([0-9]+)\/([0-9]+)\/([0-9]+)\/([0-9]+)`, W4 `([0-9]+)\/([0-9]+)\/([0-9]+)\/([0-9]+)`, W6 `([0-9]+)\/([0-9]+)\/([0-9]+)\/([0-9]+)`/
  );

  if (!coverageMatch) {
    mismatches.push('README missing coverage ratchet line');
  } else {
    const phases = ['W2', 'W4', 'W6'];
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      const phaseCoverage = policy.phases?.[phase]?.coverage;
      if (!phaseCoverage) continue;
      const offset = i * 4 + 1;
      const readmeValues = {
        statements: Number(coverageMatch[offset]),
        branches: Number(coverageMatch[offset + 1]),
        functions: Number(coverageMatch[offset + 2]),
        lines: Number(coverageMatch[offset + 3]),
      };
      for (const key of ['statements', 'branches', 'functions', 'lines']) {
        if (readmeValues[key] !== phaseCoverage[key]) {
          mismatches.push(`${phase}.${key}: README=${readmeValues[key]} policy=${phaseCoverage[key]}`);
        }
      }
    }
  }

  return { synced: mismatches.length === 0, mismatches };
}
