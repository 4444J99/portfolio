#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import zlib from 'node:zlib';

const args = process.argv.slice(2);
const DIST = resolve('dist');
const ASTRO_DIR = resolve('dist/_astro');
const OUTPUT_PATH = resolve(parseOption('json-out', '.quality/perf-summary.json'));
const BASE_PATH = '/portfolio';

function parseOption(name, fallback = null) {
  const eq = args.find((entry) => entry.startsWith(`--${name}=`));
  if (eq) return eq.split('=')[1] ?? fallback;
  const index = args.indexOf(`--${name}`);
  if (index >= 0) return args[index + 1] ?? fallback;
  return fallback;
}

function walkFiles(dir, predicate, results = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, predicate, results);
    } else if (predicate(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

function normalizeRouteFromHtmlPath(htmlPath) {
  const rel = relative(DIST, htmlPath).replaceAll('\\', '/');
  if (rel === 'index.html') return `${BASE_PATH}/`;
  if (rel === '404.html') return `${BASE_PATH}/404.html`;
  if (rel.endsWith('/index.html')) {
    return `${BASE_PATH}/${rel.slice(0, -'/index.html'.length)}`;
  }
  return `${BASE_PATH}/${rel.replace(/\.html$/, '')}`;
}

function fileSizes(filePath) {
  const source = readFileSync(filePath);
  const rawBytes = statSync(filePath).size;
  const gzipBytes = zlib.gzipSync(source, { level: 9 }).length;
  return { rawBytes, gzipBytes };
}

if (!existsSync(DIST)) {
  console.error('dist/ not found. Run `npm run build` before collecting performance metrics.');
  process.exit(1);
}

const htmlFiles = walkFiles(DIST, (name) => name.endsWith('.html'));
const chunkFiles = existsSync(ASTRO_DIR) ? walkFiles(ASTRO_DIR, (name) => name.endsWith('.js')) : [];

const chunkSizeMap = new Map();
for (const chunkPath of chunkFiles) {
  chunkSizeMap.set(chunkPath, {
    chunk: relative(DIST, chunkPath).replaceAll('\\', '/'),
    ...fileSizes(chunkPath),
  });
}

const routeJsTotals = {};
for (const htmlPath of htmlFiles) {
  const html = readFileSync(htmlPath, 'utf-8');
  const route = normalizeRouteFromHtmlPath(htmlPath);
  const scripts = new Set();
  const scriptPattern = /<script[^>]+src="([^"]+_astro[^"]+\.js)"/g;
  let match;
  while ((match = scriptPattern.exec(html)) !== null) {
    let src = match[1];
    if (src.startsWith(`${BASE_PATH}/`)) src = src.slice(BASE_PATH.length + 1);
    if (src.startsWith('/')) src = src.slice(1);
    const absolute = join(DIST, src);
    if (existsSync(absolute)) scripts.add(absolute);
  }

  let rawBytes = 0;
  let gzipBytes = 0;
  const assets = [];
  for (const scriptFile of scripts) {
    const info = chunkSizeMap.get(scriptFile) ?? {
      chunk: relative(DIST, scriptFile).replaceAll('\\', '/'),
      ...fileSizes(scriptFile),
    };
    rawBytes += info.rawBytes;
    gzipBytes += info.gzipBytes;
    assets.push(info.chunk);
  }

  routeJsTotals[route] = {
    rawBytes,
    gzipBytes,
    assetCount: assets.length,
    assets: assets.sort(),
  };
}

const largestChunks = Array.from(chunkSizeMap.values())
  .sort((a, b) => b.gzipBytes - a.gzipBytes)
  .slice(0, 20);

const summary = {
  generated: new Date().toISOString(),
  source: 'dist/**/*.html + dist/_astro/**/*.js',
  basePath: BASE_PATH,
  routesAnalyzed: htmlFiles.length,
  chunksAnalyzed: chunkFiles.length,
  routeJsTotals,
  largestChunks,
  status: 'pass',
};

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, JSON.stringify(summary, null, 2) + '\n');

console.log(
  `Collected performance metrics for ${summary.routesAnalyzed} routes and ${summary.chunksAnalyzed} JS chunks.`
);
