// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import classificationDonut from '../classification-donut-chart';
import codeTreemap from '../code-treemap-chart';
import dependencyGraph from '../dependency-graph-chart';
import flagshipStacked from '../flagship-stacked-chart';
import organBarChart from '../organ-bar-chart';
import organNavigatorChart from '../organ-navigator-chart';
import praxisSparklines from '../praxis-sparklines-chart';
import sprintTimeline from '../sprint-timeline-chart';

function createContainer(width = 800, height = 500) {
  const container = document.createElement('div');
  container.style.position = 'relative';
  Object.defineProperty(container, 'clientWidth', { value: width, configurable: true });
  Object.defineProperty(container, 'clientHeight', { value: height, configurable: true });
  document.body.appendChild(container);
  return container;
}

describe('chart renderers', () => {
  beforeEach(() => {
    document.body.innerHTML = '';

    Object.defineProperty(SVGElement.prototype, 'transform', {
      configurable: true,
      value: {
        baseVal: {
          consolidate: () => null,
        },
      },
    });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('renders organ bar chart', () => {
    const container = createContainer();
    organBarChart(container, {
      organs: [
        { key: 'ORGAN-I', name: 'Theoria', total_repos: 12, ci_coverage: 92 },
        { key: 'ORGAN-II', name: 'Poiesis', total_repos: 8, ci_coverage: 88 },
      ],
    });

    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelectorAll('rect').length).toBeGreaterThan(1);
  });

  it('renders classification donut chart', () => {
    const container = createContainer();
    classificationDonut(container, {
      classifications: { SUBSTANTIAL: 6, PARTIAL: 4, MINIMAL: 2 },
      total: 12,
    });

    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelectorAll('path').length).toBeGreaterThan(0);
    expect(container.textContent).toContain('12');
  });

  it('renders sprint timeline chart', () => {
    const container = createContainer();
    sprintTimeline(container, {
      sprints: [
        { name: 'S1', date: '2026-01-01', focus: 'feed integrity', deliverables: 'audit gate' },
        { name: 'S2', date: '2026-01-08', focus: 'metrics', deliverables: 'provenance panel' },
      ],
    });

    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelectorAll('circle').length).toBe(2);
  });

  it('renders code treemap chart', () => {
    const container = createContainer();
    codeTreemap(container, {
      organs: [
        { key: 'ORGAN-I', name: 'Theoria', total_repos: 12 },
        { key: 'ORGAN-II', name: 'Poiesis', total_repos: 8 },
      ],
    });

    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelectorAll('rect').length).toBeGreaterThan(1);
  });

  it('renders dependency graph in reduced-motion mode', () => {
    const container = createContainer();
    dependencyGraph(container, {
      nodes: [
        { id: 'a', name: 'Repo A', organ: 'ORGAN-I', organ_name: 'Theoria', tier: 'flagship' },
        { id: 'b', name: 'Repo B', organ: 'ORGAN-II', organ_name: 'Poiesis', tier: 'standard' },
      ],
      links: [{ source: 'a', target: 'b' }],
    });

    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelectorAll('circle').length).toBe(2);
    expect(container.querySelectorAll('line').length).toBeGreaterThan(0);
  });

  it('renders praxis sparklines chart', () => {
    const container = createContainer();
    praxisSparklines(container, {
      targets: [
        { key: 'coverage', label: 'Coverage', current: '18', target: '25', met: false },
        { key: 'a11y', label: 'A11y', current: '100', target: '100', met: true },
      ],
    });

    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelectorAll('rect').length).toBeGreaterThan(2);
  });

  it('renders flagship stacked chart', () => {
    const container = createContainer();
    flagshipStacked(container, {
      repos: [
        { repo: 'agentic-titan', org: 'ORGAN-IV', classification: 'SUBSTANTIAL', code_files: 180, test_files: 95 },
        { repo: 'recursive-engine', org: 'ORGAN-I', classification: 'SUBSTANTIAL', code_files: 160, test_files: 120 },
      ],
    });

    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelectorAll('rect').length).toBeGreaterThan(3);
  });

  it('renders organ navigator and expands/collapses an organ node', () => {
    const container = createContainer();
    const data = {
      organs: [
        {
          organ: 'ORGAN-I',
          label: 'Theoria',
          count: 2,
          color: '#5aa8ff',
          projects: [
            { slug: 'recursive-engine', title: 'Recursive Engine' },
            { slug: 'knowledge-base', title: 'Knowledge Base' },
          ],
        },
        {
          organ: 'ORGAN-II',
          label: 'Poiesis',
          count: 1,
          color: '#ff9f6e',
          projects: [{ slug: 'metasystem-master', title: 'Metasystem Master' }],
        },
      ],
    };

    organNavigatorChart(container, data);

    const nodeGroups = container.querySelectorAll('.organ-nodes > g');
    expect(nodeGroups.length).toBe(2);

    nodeGroups[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(container.querySelector('.project-nodes')).not.toBeNull();

    nodeGroups[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
