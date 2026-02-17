import * as d3 from 'd3';
import { getChartTheme, classificationColors } from './chart-theme';
import { createTooltip } from './chart-utils';

interface Target {
  key: string;
  label: string;
  current: string;
  target: string;
  met: boolean;
}

export default function praxisSparklines(container: HTMLElement, data: { targets: Target[] }) {
  const theme = getChartTheme();
  const tooltip = createTooltip(container);
  const width = 500;
  const rowH = 36;
  const height = data.targets.length * rowH + 20;

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const barW = 200;
  const barX = 230;

  data.targets.forEach((t, i) => {
    const y = i * rowH + 16;

    // Label
    svg.append('text')
      .attr('x', 0)
      .attr('y', y)
      .attr('fill', theme.textSecondary)
      .attr('dominant-baseline', 'middle')
      .style('font-size', '0.7rem')
      .style('text-transform', 'uppercase')
      .style('letter-spacing', '0.04em')
      .text(t.label);

    // Background bar
    svg.append('rect')
      .attr('x', barX)
      .attr('y', y - 6)
      .attr('width', barW)
      .attr('height', 12)
      .attr('rx', 6)
      .attr('fill', theme.border)
      .attr('opacity', 0.3);

    // Progress bar
    const pct = t.met ? 1 : Math.min(parseFloat(t.current) / parseFloat(t.target), 1) || 0.1;
    svg.append('rect')
      .attr('x', barX)
      .attr('y', y - 6)
      .attr('width', barW * pct)
      .attr('height', 12)
      .attr('rx', 6)
      .attr('fill', t.met ? classificationColors.SUBSTANTIAL : theme.accent);

    // Value text
    svg.append('text')
      .attr('x', barX + barW + 10)
      .attr('y', y)
      .attr('fill', t.met ? classificationColors.SUBSTANTIAL : theme.textMuted)
      .attr('dominant-baseline', 'middle')
      .style('font-size', '0.65rem')
      .style('font-family', 'var(--font-mono)')
      .text(t.met ? 'MET' : `${t.current} / ${t.target}`);

    // Hover hit area for tooltip
    svg.append('rect')
      .attr('x', barX)
      .attr('y', y - 10)
      .attr('width', barW)
      .attr('height', 20)
      .attr('fill', 'transparent')
      .style('cursor', 'pointer')
      .on('mousemove', (event: MouseEvent) => {
        const status = t.met ? 'Target met' : `${(pct * 100).toFixed(0)}% complete`;
        tooltip.show(`<strong>${t.label}</strong><br/>${t.current} / ${t.target} — ${status}`, event);
      })
      .on('mouseleave', () => tooltip.hide());
  });
}
