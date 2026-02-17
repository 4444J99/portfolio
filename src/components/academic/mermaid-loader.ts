const initialized = new Set<HTMLElement>();
let observer: IntersectionObserver | null = null;

function initMermaid(container: HTMLElement) {
  if (initialized.has(container)) return;
  initialized.add(container);

  import('mermaid').then((mermaid) => {
    mermaid.default.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        primaryColor: '#c9a84c',
        primaryBorderColor: '#2a2a30',
        primaryTextColor: '#e8e6e3',
        lineColor: '#3a3a42',
        secondaryColor: '#16161a',
        tertiaryColor: '#111113',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '13px',
      },
    });

    const chart = container.dataset.chart || container.textContent || '';
    const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;

    mermaid.default.render(id, chart).then(({ svg }) => {
      container.innerHTML = svg;
    }).catch((err) => {
      console.error('[mermaid] render error:', err);
    });
  }).catch((err) => {
    console.error('[mermaid] load error:', err);
  });
}

function observeMermaid() {
  const containers = document.querySelectorAll<HTMLElement>('.mermaid[data-chart]');

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            initMermaid(entry.target as HTMLElement);
            observer?.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '200px' }
    );
    containers.forEach((c) => observer!.observe(c));
  } else {
    containers.forEach(initMermaid);
  }
}

export function teardown() {
  initialized.clear();
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

// View Transition lifecycle
document.addEventListener('astro:before-swap', () => teardown());
document.addEventListener('astro:page-load', () => observeMermaid());
