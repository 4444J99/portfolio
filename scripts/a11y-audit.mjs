#!/usr/bin/env node

/**
 * Accessibility audit — runs axe-core against all built HTML pages.
 * Exits non-zero if any critical or serious violations are found.
 *
 * Usage: node scripts/a11y-audit.mjs [--verbose]
 */

import { readFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { JSDOM } from 'jsdom';

const DIST = resolve('dist');
const verbose = process.argv.includes('--verbose');

function findHtmlFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findHtmlFiles(fullPath));
    } else if (entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

async function auditPage(filePath) {
  const html = readFileSync(filePath, 'utf-8');
  const dom = new JSDOM(html, { runScripts: 'outside-only' });

  // Inject axe-core into the jsdom window — this is the standard
  // documented approach for running axe-core in Node.js environments.
  // The source is a trusted first-party dependency, not user input.
  const axeSource = readFileSync(
    resolve('node_modules/axe-core/axe.min.js'),
    'utf-8'
  );
  dom.window.eval(axeSource); // eslint-disable-line no-eval

  const results = await dom.window.axe.run(dom.window.document, {
    runOnly: ['wcag2a', 'wcag2aa', 'best-practice'],
  });

  dom.window.close();
  return results;
}

async function main() {
  const files = findHtmlFiles(DIST);
  console.log(`Auditing ${files.length} HTML pages for accessibility...\n`);

  let criticalCount = 0;
  let seriousCount = 0;
  let moderateCount = 0;
  let minorCount = 0;

  for (const file of files) {
    const relPath = file.replace(DIST + '/', '');
    const results = await auditPage(file);

    const critical = results.violations.filter(v => v.impact === 'critical');
    const serious = results.violations.filter(v => v.impact === 'serious');
    const moderate = results.violations.filter(v => v.impact === 'moderate');
    const minor = results.violations.filter(v => v.impact === 'minor');

    criticalCount += critical.length;
    seriousCount += serious.length;
    moderateCount += moderate.length;
    minorCount += minor.length;

    if (critical.length > 0 || serious.length > 0 || verbose) {
      const icon = critical.length > 0 ? '✗' : serious.length > 0 ? '!' : '✓';
      console.log(`${icon} ${relPath}`);

      for (const v of [...critical, ...serious]) {
        console.log(`  [${v.impact.toUpperCase()}] ${v.id}: ${v.description}`);
        if (verbose) {
          for (const node of v.nodes) {
            console.log(`    → ${node.html.slice(0, 120)}`);
          }
        }
      }

      if (verbose && moderate.length > 0) {
        for (const v of moderate) {
          console.log(`  [MODERATE] ${v.id}: ${v.description}`);
        }
      }
    } else {
      console.log(`✓ ${relPath}`);
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Pages audited: ${files.length}`);
  console.log(`Critical: ${criticalCount}`);
  console.log(`Serious:  ${seriousCount}`);
  console.log(`Moderate: ${moderateCount}`);
  console.log(`Minor:    ${minorCount}`);

  if (criticalCount > 0 || seriousCount > 0) {
    console.log('\n✗ FAIL — critical or serious violations found');
    process.exit(1);
  }

  console.log('\n✓ PASS — no critical or serious violations');
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
