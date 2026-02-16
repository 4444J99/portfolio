import * as d3 from 'd3';
import { getChartTheme, classificationColors } from './chart-theme';
import { createTooltip } from './chart-utils';

interface ClassificationData {
  classifications: Record<string, number>;
  total: number;
}

export default function classificationDonut(container: HTMLElement, data: ClassificationData) {
  const theme = getChartTheme();
  const tooltip = createTooltip(container);
  const size = 260;
  const radius = size / 2;
  const innerRadius = radius * 0.55;

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${size} ${size}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g').attr('transform', `translate(${radius},${radius})`);

  const entries = Object.entries(data.classifications).filter(([, v]) => v > 0);
  const pie = d3.pie<[string, number]>().value(d => d[1]).sort(null);
  const arc = d3.arc<d3.PieArcDatum<[string, number]>>().innerRadius(innerRadius).outerRadius(radius - 4);

  g.selectAll('path')
    .data(pie(entries))
    .join('path')
    .attr('d', arc)
    .attr('fill', d => classificationColors[d.data[0]] || theme.fallback)
    .attr('stroke', theme.strokeDark)
    .attr('stroke-width', 1)
    .style('cursor', 'pointer')
    .on('mousemove', (event, d) => {
      tooltip.show(`<strong>${d.data[0]}</strong>: ${d.data[1]}`, event);
    })
    .on('mouseleave', () => tooltip.hide());

  // Center text
  g.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '-0.2em')
    .attr('fill', theme.textPrimary)
    .style('font-size', '1.5rem')
    .style('font-weight', '700')
    .text(data.total);

  g.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '1.2em')
    .attr('fill', theme.textMuted)
    .style('font-size', '0.65rem')
    .style('text-transform', 'uppercase')
    .style('letter-spacing', '0.08em')
    .text('audited');
}
