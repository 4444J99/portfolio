import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';
import * as cheerio from 'cheerio';

const DIST = resolve(__dirname, '../../../dist');

function loadPage(path: string) {
  const file = resolve(DIST, path);
  if (!existsSync(file)) return null;
  const html = readFileSync(file, 'utf-8');
  return cheerio.load(html);
}

function countHtmlFiles(dir: string): number {
  let count = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      count += countHtmlFiles(fullPath);
    } else if (entry.name.endsWith('.html')) {
      count++;
    }
  }
  return count;
}

describe('build output', () => {
  it('dist/ directory exists', () => {
    expect(existsSync(DIST)).toBe(true);
  });

  it('produces 31 HTML pages', () => {
    expect(countHtmlFiles(DIST)).toBe(31);
  });
});

describe('index page', () => {
  const $ = loadPage('index.html');

  it('exists', () => {
    expect($).not.toBeNull();
  });

  it('has a <title> tag', () => {
    expect($!('title').length).toBe(1);
    expect($!('title').text()).toBeTruthy();
  });

  it('has Open Graph meta tags', () => {
    expect($!('meta[property="og:title"]').length).toBe(1);
    expect($!('meta[property="og:description"]').length).toBe(1);
  });

  it('has a <main> element', () => {
    expect($!('main').length).toBeGreaterThanOrEqual(1);
  });

  it('has a <nav> or header element', () => {
    const hasNav = $!('nav').length > 0 || $!('header').length > 0;
    expect(hasNav).toBe(true);
  });
});

describe('dashboard page', () => {
  const $ = loadPage('dashboard/index.html');

  it('exists', () => {
    expect($).not.toBeNull();
  });

  it('contains system metrics content', () => {
    const text = $!('body').text();
    expect(text).toContain('Dashboard');
  });
});

describe('project pages', () => {
  const projectSlugs = [
    'recursive-engine',
    'agentic-titan',
    'eight-organ-system',
  ];

  for (const slug of projectSlugs) {
    it(`projects/${slug} exists and has title`, () => {
      const $ = loadPage(`projects/${slug}/index.html`);
      expect($).not.toBeNull();
      expect($!('title').text()).toBeTruthy();
    });
  }

  it('project pages have article element', () => {
    const $ = loadPage('projects/recursive-engine/index.html');
    expect($!('article').length).toBeGreaterThanOrEqual(1);
  });
});

describe('resume page', () => {
  const $ = loadPage('resume/index.html');

  it('exists', () => {
    expect($).not.toBeNull();
  });

  it('has a <title> containing Resume', () => {
    expect($!('title').text().toLowerCase()).toContain('resume');
  });
});

describe('404 page', () => {
  const $ = loadPage('404.html');

  it('exists', () => {
    expect($).not.toBeNull();
  });
});

describe('HTML structure conventions', () => {
  const pages = ['index.html', 'about/index.html', 'dashboard/index.html'];

  for (const page of pages) {
    it(`${page} has lang attribute on <html>`, () => {
      const $ = loadPage(page);
      expect($!('html').attr('lang')).toBeTruthy();
    });

    it(`${page} has viewport meta tag`, () => {
      const $ = loadPage(page);
      expect($!('meta[name="viewport"]').length).toBe(1);
    });

    it(`${page} has charset meta tag`, () => {
      const $ = loadPage(page);
      expect($!('meta[charset]').length).toBe(1);
    });
  }
});
