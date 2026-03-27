import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const DIST = resolve(process.cwd(), 'dist');

describe('bento grid structure', () => {
	const indexPath = resolve(DIST, 'index.html');

	it('dist/index.html exists', () => {
		expect(existsSync(indexPath)).toBe(true);
	});

	it('has bento-grid section', () => {
		const html = readFileSync(indexPath, 'utf8');
		expect(html).toContain('class="bento-grid"');
		expect(html).toContain('aria-label="Portfolio overview"');
	});

	it('has hero cell with name and stat pills', () => {
		const html = readFileSync(indexPath, 'utf8');
		expect(html).toContain('bento-cell--hero');
		expect(html).toContain('Anthony James Padavano');
		expect(html).toContain('stat-pill');
	});

	it('has 2 featured project cards with transition:name', () => {
		const html = readFileSync(indexPath, 'utf8');
		const featured = html.match(/bento-card--featured/g);
		expect(featured?.length).toBe(2);
		expect(html).toContain('data-astro-transition-scope');
	});

	it('has controls cell with view toggle and depth control', () => {
		const html = readFileSync(indexPath, 'utf8');
		expect(html).toContain('controls-cell');
		expect(html).toContain('bento-view-toggle');
		expect(html).toContain('data-shibui-control');
	});

	it('has persona cell with 4 persona links', () => {
		const html = readFileSync(indexPath, 'utf8');
		expect(html).toContain('persona-cell');
		const personaLinks = html.match(/persona-cell__link/g);
		expect(personaLinks?.length).toBeGreaterThanOrEqual(4);
	});

	it('has CTA cell', () => {
		const html = readFileSync(indexPath, 'utf8');
		expect(html).toContain('cta-cell');
		expect(html).toContain('Start a conversation');
	});

	it('has see-all projects link', () => {
		const html = readFileSync(indexPath, 'utf8');
		expect(html).toContain('bento-card--see-all');
	});

	it('does NOT have old ProjectGrid or home-pair', () => {
		const html = readFileSync(indexPath, 'utf8');
		expect(html).not.toContain('project-grid');
		expect(html).not.toContain('home-pair');
		expect(html).not.toContain('organ-group__toggle');
	});

	it('has dual-view data attributes', () => {
		const html = readFileSync(indexPath, 'utf8');
		expect(html).toContain('data-hero-view="engineering"');
		expect(html).toContain('data-hero-view="creative"');
		expect(html).toContain('data-stats-view="engineering"');
		expect(html).toContain('data-stats-view="creative"');
	});
});
