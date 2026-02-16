import * as d3 from 'd3';
import { getChartTheme, organColors } from './chart-theme';
import { createTooltip } from './chart-utils';

interface OrganData {
  key: string;
  name: string;
  total_repos: number;
  ci_coverage: number;
}

export default function organBarChart(container: HTMLElement, data: { organs: OrganData[] }) {
  const theme = getChartTheme();
  const tooltip = createTooltip(container);
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };
  const width = 500;
  const height = 260;
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand<string>()
    .domain(data.organs.map(d => d.key))
    .range([0, innerW])
    .padding(0.25);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data.organs, d => d.total_repos) || 30])
    .nice()
    .range([innerH, 0]);

  // Bars
  g.selectAll('rect')
    .data(data.organs)
    .join('rect')
    .attr('x', d => x(d.key)!)
    .attr('y', d => y(d.total_repos))
    .attr('width', x.bandwidth())
    .attr('height', d => innerH - y(d.total_repos))
    .attr('fill', d => organColors[d.key] || theme.fallback)
    .attr('rx', 3)
    .style('cursor', 'pointer')
    .on('mousemove', (event, d) => {
      tooltip.show(`<strong>${d.name}</strong><br/>${d.total_repos} repos, ${d.ci_coverage} CI`, event);
    })
    .on('mouseleave', () => tooltip.hide());

  // X axis
  g.append('g')
    .attr('transform', `translate(0,${innerH})`)
    .call(d3.axisBottom(x).tickFormat(d => d.replace('ORGAN-', '').replace('META-ORGANVM', 'META')))
    .call(g => g.select('.domain').attr('stroke', theme.border))
    .call(g => g.selectAll('.tick line').remove())
    .call(g => g.selectAll('.tick text').attr('fill', theme.textMuted).style('font-size', '0.7rem'));

  // Y axis
  g.append('g')
    .call(d3.axisLeft(y).ticks(5))
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('.tick line').attr('stroke', theme.border).attr('x2', innerW).attr('opacity', 0.3))
    .call(g => g.selectAll('.tick text').attr('fill', theme.textMuted).style('font-size', '0.7rem'));
}
