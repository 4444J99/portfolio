#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { chromium } from 'playwright';

const args = process.argv.slice(2);

function parseOption(name, fallback = null) {
  const eq = args.find((entry) => entry.startsWith(`--${name}=`));
  if (eq) return eq.split('=')[1] ?? fallback;
  const index = args.indexOf(`--${name}`);
  if (index >= 0) return args[index + 1] ?? fallback;
  return fallback;
}

const outputPath = resolve(parseOption('json-out', '.quality/runtime-errors-summary.json'));
const allowlistPath = resolve(parseOption('allowlist', '.quality/runtime-error-allowlist.json'));
const basePath = '/portfolio';
const host = '127.0.0.1';
const port = Number(parseOption('port', '4322'));
const previewUrl = `http://${host}:${port}`;

const routeMatrix = [
  '/',
  '/about',
  '/dashboard',
  '/consult',
  '/omega',
  '/architecture',
  '/gallery',
  '/projects/recursive-engine',
];

const viewportProfiles = [
  { name: 'mobile', viewport: { width: 390, height: 844 } },
  { name: 'desktop', viewport: { width: 1440, height: 900 } },
];

function readAllowlist() {
  if (!existsSync(allowlistPath)) {
    return [];
  }
  const raw = JSON.parse(readFileSync(allowlistPath, 'utf-8'));
  const entries = Array.isArray(raw?.entries) ? raw.entries : [];
  return entries
    .filter((entry) => typeof entry?.pattern === 'string' && entry.pattern.length > 0)
    .map((entry) => ({
      pattern: new RegExp(entry.pattern),
      reason: typeof entry.reason === 'string' ? entry.reason : 'unspecified',
    }));
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status === 404) return;
    } catch {
      // retry
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 300));
  }
  throw new Error(`Timed out waiting for preview server at ${url}`);
}

function startPreviewServer() {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  return spawn(
    npmCmd,
    ['run', 'preview', '--', '--host', host, '--port', String(port)],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    }
  );
}

function classifyEvent(message, allowlist) {
  for (const entry of allowlist) {
    if (entry.pattern.test(message)) {
      return { classification: 'allowlisted', reason: entry.reason };
    }
  }
  return { classification: 'uncategorized', reason: null };
}

async function runRouteInteractions(page) {
  await page.evaluate(() => {
    document.dispatchEvent(new Event('astro:page-load'));
    document.dispatchEvent(new Event('astro:page-load'));
  }).catch(() => {});

  const menu = page.locator('.header__toggle').first();
  if (await menu.count() > 0 && await menu.isVisible()) {
    await menu.click().catch(() => {});
    await menu.click().catch(() => {});
  }

  const search = page.locator('.search-trigger').first();
  if (await search.count() > 0 && await search.isVisible()) {
    await search.click().catch(() => {});
    const close = page.locator('.search-dialog__close').first();
    if (await close.count() > 0 && await close.isVisible()) {
      await close.click().catch(() => {});
    } else {
      await page.keyboard.press('Escape').catch(() => {});
    }
  }

  const theme = page.locator('.theme-toggle').first();
  if (await theme.count() > 0 && await theme.isVisible()) {
    await theme.click().catch(() => {});
  }

  const pause = page.locator('.sketch-ctrl--pause').first();
  if (await pause.count() > 0 && await pause.isVisible()) {
    await pause.click().catch(() => {});
    await pause.click().catch(() => {});
  }
}

const allowlist = readAllowlist();
const preview = startPreviewServer();
let browser;
const events = [];

try {
  await waitForServer(`${previewUrl}${basePath}/`);
  browser = await chromium.launch({ headless: true });

  for (const profile of viewportProfiles) {
    const context = await browser.newContext({ viewport: profile.viewport });

    for (const route of routeMatrix) {
      const page = await context.newPage();
      const pageEvents = [];

      page.on('pageerror', (error) => {
        pageEvents.push({
          type: 'pageerror',
          message: error?.message ?? String(error),
        });
      });

      page.on('console', (msg) => {
        if (msg.type() !== 'error') return;
        pageEvents.push({
          type: 'console.error',
          message: msg.text(),
        });
      });

      const fullRoute = `${basePath}${route}`;
      await page.goto(`${previewUrl}${fullRoute}`, { waitUntil: 'networkidle' });
      await runRouteInteractions(page);
      await page.waitForTimeout(150);

      for (const event of pageEvents) {
        const classified = classifyEvent(event.message, allowlist);
        events.push({
          viewport: profile.name,
          route: fullRoute,
          ...event,
          classification: classified.classification,
          reason: classified.reason,
        });
      }

      await page.close();
    }

    await context.close();
  }
} finally {
  await browser?.close().catch(() => {});
  if (!preview.killed) {
    preview.kill('SIGTERM');
    await new Promise((resolveClose) => {
      const timeout = setTimeout(resolveClose, 3000);
      preview.once('exit', () => {
        clearTimeout(timeout);
        resolveClose();
      });
    });
  }
}

const uncategorized = events.filter((event) => event.classification === 'uncategorized');
const allowlisted = events.filter((event) => event.classification === 'allowlisted');

const summary = {
  generated: new Date().toISOString(),
  source: 'playwright runtime telemetry',
  basePath,
  profiles: viewportProfiles.map((profile) => profile.name),
  routes: routeMatrix.map((route) => `${basePath}${route}`),
  counts: {
    total: events.length,
    uncategorized: uncategorized.length,
    allowlisted: allowlisted.length,
  },
  events,
  status: uncategorized.length > 0 ? 'fail' : 'pass',
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(summary, null, 2) + '\n');

if (summary.status === 'fail') {
  console.error(`Runtime error telemetry failed with ${uncategorized.length} uncategorized runtime error(s).`);
  uncategorized.slice(0, 20).forEach((event) => {
    console.error(`- [${event.viewport}] ${event.route} (${event.type}) ${event.message}`);
  });
  process.exit(1);
}

console.log(`Runtime error telemetry passed (${events.length} events, uncategorized=0).`);
