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

interface TreemapRoot {
  children: TreemapDatum[];
}

type TreemapNodeData = TreemapRoot | TreemapDatum;
type TreemapLeaf = d3.HierarchyRectangularNode<TreemapNodeData> & { data: TreemapDatum };

export default function codeTreemap(container: HTMLElement, data: { organs: OrganNode[] }) {
  const theme = getChartTheme();
  const tooltip = createTooltip(container);
  const width = 500;
  const height = 300;

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const rootData: TreemapRoot = {
    children: data.organs.map((organ) => ({ ...organ, value: organ.total_repos })),
  };
  const root = d3
    .hierarchy<TreemapNodeData>(rootData, (d) => ('children' in d ? d.children : undefined))
    .sum((d) => ('value' in d ? d.value : 0));

  d3.treemap<TreemapNodeData>()
    .size([width, height])
    .padding(3)
    .round(true)(root);

  const leaves = svg
    .selectAll<SVGGElement, TreemapLeaf>('g')
    .data(root.leaves() as TreemapLeaf[])
    .join('g')
    .attr('transform', (d) => `translate(${d.x0},${d.y0})`);

  leaves
    .append('rect')
    .attr('width', (d) => d.x1 - d.x0)
    .attr('height', (d) => d.y1 - d.y0)
    .attr('fill', (d) => organColors[d.data.key] || theme.fallback)
    .attr('opacity', 0.8)
    .attr('rx', 3)
    .style('cursor', 'pointer')
    .on('mousemove', (event, d) => {
      tooltip.show(`<strong>${d.data.name}</strong><br/>${d.data.total_repos} repos`, event as MouseEvent);
    })
    .on('mouseleave', () => tooltip.hide());

  leaves
    .append('text')
    .attr('x', 6)
    .attr('y', 16)
    .attr('fill', theme.labelDark)
    .style('font-size', '0.65rem')
    .style('font-weight', '600')
    .text((d) => {
      const w = d.x1 - d.x0;
      return w > 50 ? d.data.name : '';
    });
}
