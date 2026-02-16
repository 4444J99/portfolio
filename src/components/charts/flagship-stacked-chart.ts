import * as d3 from 'd3';
import { getChartTheme, classificationColors } from './chart-theme';
import { createTooltip } from './chart-utils';

interface Repo {
  repo: string;
  org: string;
  classification: string;
  code_files: number;
  test_files: number;
}

export default function flagshipStacked(container: HTMLElement, data: { repos: Repo[] }) {
  const theme = getChartTheme();
  const tooltip = createTooltip(container);
  const margin = { top: 20, right: 20, bottom: 60, left: 50 };
  const width = 500;
  const height = 280;
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand<string>()
    .domain(data.repos.map(d => d.repo))
    .range([0, innerW])
    .padding(0.2);

  const maxVal = d3.max(data.repos, d => d.code_files + d.test_files) || 300;
  const y = d3.scaleLinear().domain([0, maxVal]).nice().range([innerH, 0]);

  // Code files bars
  g.selectAll('.bar-code')
    .data(data.repos)
    .join('rect')
    .attr('class', 'bar-code')
    .attr('x', d => x(d.repo)!)
    .attr('y', d => y(d.code_files + d.test_files))
    .attr('width', x.bandwidth())
    .attr('height', d => innerH - y(d.code_files))
    .attr('fill', theme.accent)
    .attr('opacity', 0.8)
    .attr('rx', 2)
    .style('cursor', 'pointer')
    .on('mousemove', (event, d) => {
      tooltip.show(`<strong>${d.repo}</strong><br/>Code: ${d.code_files}, Tests: ${d.test_files}<br/>${d.classification}`, event);
    })
    .on('mouseleave', () => tooltip.hide());

  // Test files bars (stacked on top)
  g.selectAll('.bar-test')
    .data(data.repos)
    .join('rect')
    .attr('class', 'bar-test')
    .attr('x', d => x(d.repo)!)
    .attr('y', d => y(d.code_files + d.test_files))
    .attr('width', x.bandwidth())
    .attr('height', d => innerH - y(d.test_files))
    .attr('fill', classificationColors.SUBSTANTIAL)
    .attr('opacity', 0.8)
    .attr('rx', 2)
    .style('cursor', 'pointer')
    .on('mousemove', (event, d) => {
      tooltip.show(`<strong>${d.repo}</strong><br/>Code: ${d.code_files}, Tests: ${d.test_files}`, event);
    })
    .on('mouseleave', () => tooltip.hide());

  // X axis
  g.append('g')
    .attr('transform', `translate(0,${innerH})`)
    .call(d3.axisBottom(x).tickFormat(d => d.length > 15 ? d.slice(0, 14) + '…' : d))
    .call(g => g.select('.domain').attr('stroke', theme.border))
    .call(g => g.selectAll('.tick line').remove())
    .call(g => g.selectAll('.tick text')
      .attr('fill', theme.textMuted)
      .style('font-size', '0.55rem')
      .attr('transform', 'rotate(-35)')
      .style('text-anchor', 'end'));

  // Y axis
  g.append('g')
    .call(d3.axisLeft(y).ticks(5))
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('.tick line').attr('stroke', theme.border).attr('x2', innerW).attr('opacity', 0.3))
    .call(g => g.selectAll('.tick text').attr('fill', theme.textMuted).style('font-size', '0.65rem'));

  // Legend
  const legend = svg.append('g').attr('transform', `translate(${margin.left}, ${height - 10})`);
  [{ label: 'Code', color: theme.accent }, { label: 'Tests', color: classificationColors.SUBSTANTIAL }].forEach((item, i) => {
    legend.append('rect').attr('x', i * 80).attr('y', -6).attr('width', 10).attr('height', 10).attr('fill', item.color).attr('rx', 2);
    legend.append('text').attr('x', i * 80 + 14).attr('y', 3).attr('fill', theme.textMuted).style('font-size', '0.6rem').text(item.label);
  });
}
