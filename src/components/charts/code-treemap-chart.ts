import * as d3 from 'd3';
import { getChartTheme, organColors } from './chart-theme';
import { createTooltip } from './chart-utils';

interface OrganNode {
  key: string;
  name: string;
  total_repos: number;
}

interface TreemapDatum extends OrganNode {
  value: number;
}

type TreemapLeaf = d3.HierarchyRectangularNode<TreemapDatum>;

export default function codeTreemap(container: HTMLElement, data: { organs: OrganNode[] }) {
  const theme = getChartTheme();
  const tooltip = createTooltip(container);
  const width = 500;
  const height = 300;

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const root = d3.hierarchy<TreemapDatum>({ children: data.organs.map(o => ({ ...o, value: o.total_repos })) } as d3.HierarchyNode<TreemapDatum>['data'])
    .sum(d => d.value || 0);

  d3.treemap<TreemapDatum>()
    .size([width, height])
    .padding(3)
    .round(true)(root);

  const leaves = svg.selectAll('g')
    .data(root.leaves())
    .join('g')
    .attr('transform', (d: TreemapLeaf) => `translate(${d.x0},${d.y0})`);

  leaves.append('rect')
    .attr('width', (d: TreemapLeaf) => d.x1 - d.x0)
    .attr('height', (d: TreemapLeaf) => d.y1 - d.y0)
    .attr('fill', (d: TreemapLeaf) => organColors[d.data.key] || '#888')
    .attr('opacity', 0.8)
    .attr('rx', 3)
    .style('cursor', 'pointer')
    .on('mousemove', (event: MouseEvent, d: TreemapLeaf) => {
      tooltip.show(`<strong>${d.data.name}</strong><br/>${d.data.total_repos} repos`, event);
    })
    .on('mouseleave', () => tooltip.hide());

  leaves.append('text')
    .attr('x', 6)
    .attr('y', 16)
    .attr('fill', 'rgba(0,0,0,0.7)')
    .style('font-size', '0.65rem')
    .style('font-weight', '600')
    .text((d: TreemapLeaf) => {
      const w = d.x1 - d.x0;
      return w > 50 ? d.data.name : '';
    });
}
