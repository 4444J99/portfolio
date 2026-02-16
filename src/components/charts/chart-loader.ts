type ChartInit = (container: HTMLElement, data: Record<string, unknown>) => void;

const chartModules: Record<string, () => Promise<{ default: ChartInit }>> = {
  'organ-bar': () => import('./organ-bar-chart'),
  'classification-donut': () => import('./classification-donut-chart'),
  'sprint-timeline': () => import('./sprint-timeline-chart'),
  'code-treemap': () => import('./code-treemap-chart'),
  'dependency-graph': () => import('./dependency-graph-chart'),
  'praxis-sparklines': () => import('./praxis-sparklines-chart'),
  'flagship-stacked': () => import('./flagship-stacked-chart'),
};

const initialized = new Set<HTMLElement>();

function initChart(container: HTMLElement) {
  if (initialized.has(container)) return;
  initialized.add(container);

  const chartId = container.dataset.chart;
  if (!chartId || !chartModules[chartId]) return;

  const dataEl = container.querySelector('script[type="application/json"]');
  const data = dataEl ? JSON.parse(dataEl.textContent || '{}') : JSON.parse(container.dataset.chartData || '{}');

  chartModules[chartId]().then((mod) => {
    mod.default(container, data);
  }).catch((err) => {
    console.error('[chart]', chartId, 'load error:', err);
  });
}

function observeCharts() {
  const containers = document.querySelectorAll<HTMLElement>('[data-chart]');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            initChart(entry.target as HTMLElement);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '200px' }
    );
    containers.forEach((c) => observer.observe(c));
  } else {
    containers.forEach(initChart);
  }
}

// Re-render charts when S/B/E mode changes
function watchModeChanges() {
  const observer = new MutationObserver(() => {
    initialized.forEach((container) => {
      const svg = container.querySelector('svg');
      if (svg) {
        // Remove old chart and re-init
        svg.remove();
        container.querySelectorAll('.chart-tooltip').forEach(t => t.remove());
        initialized.delete(container);
        initChart(container);
      }
    });
  });

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-bg-mode'],
  });
}

function init() {
  observeCharts();
  watchModeChanges();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
