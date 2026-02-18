#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const args = process.argv.slice(2);
const DEFAULT_MANIFEST_PATH = resolve('scripts/runtime-a11y-routes.json');
const DEFAULT_DIST_PATH = resolve('dist');

function parseOption(name, fallback = null) {
  const eq = args.find((entry) => entry.startsWith(`--${name}=`));
  if (eq) return eq.split('=')[1] ?? fallback;
  const index = args.indexOf(`--${name}`);
  if (index >= 0) return args[index + 1] ?? fallback;
  return fallback;
}

function normalizeRoutePath(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed === '/') return '/';
  const prefixed = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return prefixed.endsWith('/') ? prefixed.slice(0, -1) : prefixed;
}

function collectHtmlFiles(dir, bucket = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) collectHtmlFiles(fullPath, bucket);
    else if (entry.isFile() && entry.name.endsWith('.html')) bucket.push(fullPath);
  }
  return bucket;
}

function distFileToRoute(distPath, filePath) {
  const rel = relative(distPath, filePath).replace(/\\/g, '/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) {
    return `/${rel.slice(0, -'/index.html'.length)}`;
  }
  return `/${rel}`;
}

const manifestPath = resolve(parseOption('manifest', DEFAULT_MANIFEST_PATH));
const distPath = resolve(parseOption('dist', DEFAULT_DIST_PATH));
const outputPath = resolve(parseOption('json-out', '.quality/runtime-route-manifest-summary.json'));

if (!existsSync(manifestPath)) {
  console.error(`Runtime route manifest not found: ${manifestPath}`);
  process.exit(1);
}

if (!existsSync(distPath)) {
  console.error(`dist/ not found: ${distPath}. Run \`npm run build\` first.`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
const manifestRoutes = [...new Set(
  (Array.isArray(manifest.routes) ? manifest.routes : [])
    .map((entry) => normalizeRoutePath(entry?.path))
    .filter((route) => typeof route === 'string')
)].sort();

const distRoutes = [...new Set(
  collectHtmlFiles(distPath)
    .map((filePath) => normalizeRoutePath(distFileToRoute(distPath, filePath)))
    .filter((route) => typeof route === 'string')
)].sort();

const distRouteSet = new Set(distRoutes);
const manifestRouteSet = new Set(manifestRoutes);

const missingInManifest = distRoutes.filter((route) => !manifestRouteSet.has(route));
const missingInDist = manifestRoutes.filter((route) => !distRouteSet.has(route));
const failures = [];

if (missingInManifest.length > 0) {
  failures.push(`Routes built in dist but missing from manifest: ${missingInManifest.join(', ')}`);
}

if (missingInDist.length > 0) {
  failures.push(`Routes listed in manifest but missing from dist: ${missingInDist.join(', ')}`);
}

const summary = {
  generated: new Date().toISOString(),
  manifestPath,
  distPath,
  manifestRouteCount: manifestRoutes.length,
  distRouteCount: distRoutes.length,
  manifestRoutes,
  distRoutes,
  missingInManifest,
  missingInDist,
  status: failures.length === 0 ? 'pass' : 'fail',
  failures,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(summary, null, 2) + '\n');

if (summary.status === 'fail') {
  console.error('Runtime route manifest sync check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Runtime route manifest sync check passed (${manifestRoutes.length} routes).`);
