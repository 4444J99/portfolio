import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { JSDOM } from 'jsdom';

const DIST = resolve(__dirname, '../../dist');

function findHtmlFiles(dir: string): string[] {
  const results: string[] = [];
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

async function auditFile(filePath: string) {
  const html = readFileSync(filePath, 'utf-8');
  const dom = new JSDOM(html, { runScripts: 'outside-only' });

  // Inject axe-core into jsdom — standard documented approach for running
  // axe-core in Node.js. The source is a trusted first-party dependency.
  const axeSource = readFileSync(
    resolve('node_modules/axe-core/axe.min.js'),
    'utf-8'
  );
  dom.window.eval(axeSource); // eslint-disable-line no-eval -- trusted axe-core bundle

  const results = await dom.window.axe.run(dom.window.document, {
    runOnly: ['wcag2a', 'wcag2aa'],
  });

  dom.window.close();
  return results;
}

// Key pages to audit — representative sample covering all page types
const keyPages = [
  'index.html',
  'about/index.html',
  'dashboard/index.html',
  'resume/index.html',
  'essays/index.html',
  'projects/recursive-engine/index.html',
  '404.html',
];

describe('accessibility (axe-core)', () => {
  it('dist/ exists for a11y auditing', () => {
    expect(existsSync(DIST)).toBe(true);
  });

  for (const page of keyPages) {
    it(`${page} has no critical a11y violations`, async () => {
      const filePath = resolve(DIST, page);
      if (!existsSync(filePath)) return; // skip if not built

      const results = await auditFile(filePath);
      const critical = results.violations.filter(
        (v: { impact: string }) => v.impact === 'critical'
      );

      if (critical.length > 0) {
        const summary = critical.map(
          (v: { id: string; description: string }) => `${v.id}: ${v.description}`
        ).join('\n');
        expect.fail(`Critical violations:\n${summary}`);
      }
    });

    it(`${page} has no serious a11y violations`, async () => {
      const filePath = resolve(DIST, page);
      if (!existsSync(filePath)) return;

      const results = await auditFile(filePath);
      const serious = results.violations.filter(
        (v: { impact: string }) => v.impact === 'serious'
      );

      if (serious.length > 0) {
        const summary = serious.map(
          (v: { id: string; description: string }) => `${v.id}: ${v.description}`
        ).join('\n');
        expect.fail(`Serious violations:\n${summary}`);
      }
    });
  }
});
