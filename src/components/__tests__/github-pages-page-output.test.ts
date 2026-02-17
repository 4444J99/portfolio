import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as cheerio from 'cheerio';

const DIST = resolve(process.cwd(), 'dist');
const PAGE = resolve(DIST, 'github-pages/index.html');
const JSON_FEED = resolve(DIST, 'github-pages.json');
const XML_FEED = resolve(DIST, 'github-pages.xml');

describe('GitHub Pages directory output', () => {
  it('emits HTML and machine-readable endpoints', () => {
    expect(existsSync(PAGE)).toBe(true);
    expect(existsSync(JSON_FEED)).toBe(true);
    expect(existsSync(XML_FEED)).toBe(true);
  });

  it('renders health, diagnostics, and tracked outbound links', () => {
    const html = readFileSync(PAGE, 'utf-8');
    const $ = cheerio.load(html);

    expect($('h1').first().text().toLowerCase()).toContain('github pages directory');
    expect($('h2').filter((_index, node) => $(node).text().includes('System Pages Health')).length).toBeGreaterThan(0);
    expect($('h2').filter((_index, node) => $(node).text().includes('Why this matters')).length).toBeGreaterThan(0);
    expect($('a[data-gh-pages-track]').length).toBeGreaterThan(0);

    const jsonLink = $('a').filter(
      (_index, node) => $(node).attr('href')?.includes('github-pages.json') ?? false
    );
    const xmlLink = $('a').filter(
      (_index, node) => $(node).attr('href')?.includes('github-pages.xml') ?? false
    );
    expect(jsonLink.length).toBeGreaterThan(0);
    expect(xmlLink.length).toBeGreaterThan(0);
  });
});
