import * as d3 from 'd3';
import { getChartTheme } from './chart-theme';
import { createTooltip } from './chart-utils';

interface Sprint {
  name: string;
  date: string;
  focus: string;
  deliverables: string;
}

export default function sprintTimeline(container: HTMLElement, data: { sprints: Sprint[] }) {
  const theme = getChartTheme();
  const tooltip = createTooltip(container);
  const margin = { top: 20, right: 20, bottom: 30, left: 20 };
  const width = 700;
  const height = 120;
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const parseDate = d3.timeParse('%Y-%m-%d');
  const dates = data.sprints.map(s => parseDate(s.date)!);
  const extent = d3.extent(dates) as [Date, Date];

  const x = d3.scaleTime()
    .domain([d3.timeDay.offset(extent[0], -1), d3.timeDay.offset(extent[1], 1)])
    .range([0, innerW]);

  // Axis
  g.append('line')
    .attr('x1', 0).attr('x2', innerW)
    .attr('y1', innerH / 2).attr('y2', innerH / 2)
    .attr('stroke', theme.border)
    .attr('stroke-width', 1);

  // Sprint markers
  data.sprints.forEach((sprint, i) => {
    const date = parseDate(sprint.date)!;
    const cx = x(date);

    g.append('circle')
      .attr('cx', cx)
      .attr('cy', innerH / 2)
      .attr('r', 5)
      .attr('fill', theme.accent)
      .attr('stroke', theme.strokeDark)
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mousemove', (event) => {
        tooltip.show(`<strong>${sprint.name}</strong><br/>${sprint.focus} — ${sprint.deliverables}`, event);
      })
      .on('mouseleave', () => tooltip.hide());

    // Show every other label to avoid overlap
    if (i % 2 === 0) {
      g.append('text')
        .attr('x', cx)
        .attr('y', innerH / 2 - 14)
        .attr('text-anchor', 'middle')
        .attr('fill', theme.textMuted)
        .style('font-size', '0.55rem')
        .style('font-family', 'var(--font-mono)')
        .text(sprint.name);
    }
  });
}
