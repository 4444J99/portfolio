import { describe, expect, it } from 'vitest';
import about from '../about.json';
import essays from '../essays.json';
import graph from '../graph.json';
import landing from '../landing.json';
import projects from '../projects.json';
import systemMetrics from '../system-metrics.json';
import targets from '../targets.json';
import vitals from '../vitals.json';

describe('projects.json', () => {
	it('has a projects array', () => {
		expect(Array.isArray(projects.projects)).toBe(true);
		expect(projects.projects.length).toBeGreaterThan(0);
	});

	it('total_curated matches projects array length', () => {
		expect(projects.total_curated).toBe(projects.projects.length);
	});

	it('every project has required fields', () => {
		for (const p of projects.projects) {
			expect(p.name).toBeTruthy();
			expect(p.org).toBeTruthy();
			expect(p.organ).toBeTruthy();
			expect(p.description).toBeTruthy();
			expect(p.tier).toBeTruthy();
			expect(p.implementation_status).toBeTruthy();
		}
	});

	it('tiers are valid values', () => {
		const validTiers = ['flagship', 'standard', 'infrastructure', 'archive'];
		for (const p of projects.projects) {
			expect(validTiers).toContain(p.tier);
		}
	});

	it('implementation_status values are valid', () => {
		const validStatuses = ['ACTIVE', 'DESIGN_ONLY', 'ARCHIVED'];
		for (const p of projects.projects) {
			expect(validStatuses).toContain(p.implementation_status);
		}
	});
});

describe('essays.json', () => {
	it('has an essays array', () => {
		expect(Array.isArray(essays.essays)).toBe(true);
	});

	it('total matches essays array length', () => {
		expect(essays.total).toBe(essays.essays.length);
	});

	it('every essay has required fields', () => {
		for (const e of essays.essays) {
			expect(e.title).toBeTruthy();
			expect(e.slug).toBeTruthy();
			expect(e.date).toBeTruthy();
			expect(e.url).toBeTruthy();
		}
	});

	it('essay dates are valid ISO-ish format', () => {
		for (const e of essays.essays) {
			expect(new Date(e.date).toString()).not.toBe('Invalid Date');
		}
	});
});

describe('landing.json', () => {
	it('exists and has expected structure', () => {
		expect(landing).toBeTruthy();
		expect(typeof landing).toBe('object');
	});
});

describe('about.json', () => {
	it('exists and has expected structure', () => {
		expect(about).toBeTruthy();
		expect(typeof about).toBe('object');
	});
});

describe('graph.json', () => {
	it('has nodes and edges arrays', () => {
		expect(Array.isArray(graph.nodes)).toBe(true);
		expect(Array.isArray(graph.edges)).toBe(true);
	});

	it('total_nodes matches nodes array length', () => {
		expect(graph.total_nodes).toBe(graph.nodes.length);
	});

	it('total_edges matches edges array length', () => {
		expect(graph.total_edges).toBe(graph.edges.length);
	});

	it('every node has an id and organ', () => {
		for (const n of graph.nodes) {
			expect(n.id).toBeTruthy();
			expect(n.organ).toBeTruthy();
		}
	});

	it('every edge references existing nodes', () => {
		const nodeIds = new Set(graph.nodes.map((n: { id: string }) => n.id));
		for (const e of graph.edges) {
			expect(nodeIds.has(e.source)).toBe(true);
			expect(nodeIds.has(e.target)).toBe(true);
		}
	});
});

describe('targets.json', () => {
	it('no strike target has [DRAFT] placeholder in intro', () => {
		for (const t of targets.targets) {
			expect(t.intro, `target ${t.slug} has [DRAFT]`).not.toContain('[DRAFT]');
		}
	});
});

describe('vitals.json', () => {
	it('substance metrics are non-zero', () => {
		expect(vitals.substance.code_files).toBeGreaterThan(0);
		expect(vitals.substance.test_files).toBeGreaterThan(0);
		expect(vitals.substance.automated_tests).toBeGreaterThan(0);
	});

	it('logos metrics are non-zero', () => {
		expect(vitals.logos.essays).toBeGreaterThan(0);
		expect(vitals.logos.words).toBeGreaterThan(0);
	});

	it('repo counts are non-zero', () => {
		expect(vitals.repos.total).toBeGreaterThan(0);
		expect(vitals.repos.active).toBeGreaterThan(0);
	});
});

describe('system-metrics.json', () => {
	it('has top-level required sections', () => {
		expect(systemMetrics.computed).toBeTruthy();
		expect(systemMetrics.schema_version).toBeTruthy();
		expect(systemMetrics.generated).toBeTruthy();
	});

	it('registry totals are positive', () => {
		expect(systemMetrics.computed.total_repos).toBeGreaterThan(0);
		expect(systemMetrics.computed.total_organs).toBeGreaterThan(0);
	});

	it('implementation_status counts sum to total_repos', () => {
		const sum = Object.values(systemMetrics.computed.implementation_status).reduce(
			(a: number, b: number) => a + b,
			0,
		);
		expect(sum).toBe(systemMetrics.computed.total_repos);
	});

	it('per_organ has entries', () => {
		const perOrgan = systemMetrics.computed.per_organ;
		expect(Object.keys(perOrgan).length).toBeGreaterThan(0);
		for (const [organ, data] of Object.entries(perOrgan) as [string, any][]) {
			expect(organ).toBeTruthy();
			expect(data.repos).toBeGreaterThan(0);
		}
	});

	it('contains documentation and test metrics', () => {
		const wc = systemMetrics.computed.word_counts;
		expect(wc).toBeTruthy();
	});
});
