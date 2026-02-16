import * as d3 from 'd3';
import { getChartTheme, organColors } from './chart-theme';
import { createTooltip } from './chart-utils';

interface Node {
  id: string;
  name: string;
  organ: string;
  organ_name: string;
  tier: string;
}

interface Link {
  source: string;
  target: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

export default function dependencyGraph(container: HTMLElement, data: GraphData) {
  const theme = getChartTheme();
  const tooltip = createTooltip(container);
  const width = 600;
  const height = 400;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  // Only show nodes that have links (to keep the graph readable)
  const linkedIds = new Set<string>();
  data.links.forEach(l => { linkedIds.add(l.source); linkedIds.add(l.target); });
  const nodes = data.nodes.filter(n => linkedIds.has(n.id));
  const links = data.links.filter(l => nodes.find(n => n.id === l.source) && nodes.find(n => n.id === l.target));

  const simulation = d3.forceSimulation(nodes as any)
    .force('link', d3.forceLink(links as any).id((d: any) => d.id).distance(80))
    .force('charge', d3.forceManyBody().strength(-120))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collide', d3.forceCollide(20));

  const link = svg.selectAll('line')
    .data(links)
    .join('line')
    .attr('stroke', theme.border)
    .attr('stroke-width', 1)
    .attr('opacity', 0.5);

  const node = svg.selectAll('circle')
    .data(nodes)
    .join('circle')
    .attr('r', (d: any) => d.tier === 'flagship' ? 8 : 5)
    .attr('fill', (d: any) => organColors[d.organ] || '#888')
    .attr('stroke', 'rgba(0,0,0,0.3)')
    .attr('stroke-width', 1)
    .style('cursor', 'pointer')
    .on('mousemove', (event: MouseEvent, d: any) => {
      tooltip.show(`<strong>${d.name}</strong><br/>${d.organ_name} · ${d.tier}`, event);
    })
    .on('mouseleave', () => tooltip.hide())
    .call(d3.drag<SVGCircleElement, any>()
      .on('start', (event, d: any) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', (event, d: any) => { d.fx = event.x; d.fy = event.y; })
      .on('end', (event, d: any) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
    );

  simulation.on('tick', () => {
    link
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y);

    node
      .attr('cx', (d: any) => d.x)
      .attr('cy', (d: any) => d.y);
  });

  // For reduced motion: run simulation to completion instantly
  if (prefersReduced) {
    simulation.stop();
    for (let i = 0; i < 300; i++) simulation.tick();
    simulation.on('tick', null);
    link.attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y);
    node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);
  }
}
