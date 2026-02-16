import * as d3 from 'd3';

export function createTooltip(container: HTMLElement) {
  const tip = d3.select(container)
    .append('div')
    .attr('class', 'chart-tooltip')
    .style('position', 'absolute')
    .style('pointer-events', 'none')
    .style('opacity', '0')
    .style('background', 'rgba(0,0,0,0.8)')
    .style('backdrop-filter', 'blur(8px)')
    .style('border', '1px solid rgba(255,255,255,0.15)')
    .style('border-radius', '6px')
    .style('padding', '6px 10px')
    .style('font-size', '0.75rem')
    .style('color', '#e8e6e3')
    .style('white-space', 'nowrap')
    .style('z-index', '10')
    .style('transition', 'opacity 0.15s ease');

  return {
    show(html: string, event: MouseEvent) {
      const rect = container.getBoundingClientRect();
      tip.html(html)
        .style('opacity', '1')
        .style('left', `${event.clientX - rect.left + 12}px`)
        .style('top', `${event.clientY - rect.top - 10}px`);
    },
    hide() {
      tip.style('opacity', '0');
    },
  };
}

export function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
