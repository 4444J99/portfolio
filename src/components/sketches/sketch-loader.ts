import type p5 from 'p5';

const sketchModules: Record<string, () => Promise<{ default: (p: p5, container: HTMLElement) => void }>> = {
  'hero': () => import('./hero-sketch'),
  'organ-system': () => import('./organ-system-sketch'),
  'recursive-tree': () => import('./recursive-tree-sketch'),
  'counterpoint': () => import('./counterpoint-sketch'),
  'pipeline': () => import('./pipeline-sketch'),
  'token-stream': () => import('./token-stream-sketch'),
};

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const initialized = new Set<HTMLElement>();

function isMobile(): boolean {
  return window.innerWidth < 768;
}

function initSketch(container: HTMLElement) {
  if (initialized.has(container)) return;
  initialized.add(container);

  const sketchId = container.dataset.sketch;
  const height = container.dataset.height || '500px';
  const mobileHeight = container.dataset.mobileHeight || '350px';

  if (!sketchId || !sketchModules[sketchId]) return;

  container.style.height = isMobile() ? mobileHeight : height;

  const loader = sketchModules[sketchId];

  Promise.all([
    import('p5'),
    loader(),
  ]).then(([p5Module, sketchModule]) => {
    const P5 = p5Module.default;
    const sketchFn = sketchModule.default;

    new P5((p: p5) => {
      // Let the sketch set up its functions
      sketchFn(p, container);

      // For reduced motion: wrap draw to stop after first frame
      if (prefersReducedMotion && p.draw) {
        const originalDraw = p.draw.bind(p);
        p.draw = function () {
          originalDraw();
          p.noLoop();
        };
      }
    }, container);
  });
}

function observeSketches() {
  const containers = document.querySelectorAll<HTMLElement>('.sketch-container[data-sketch]');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            initSketch(entry.target as HTMLElement);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '200px' }
    );
    containers.forEach((c) => observer.observe(c));
  } else {
    containers.forEach(initSketch);
  }

  window.addEventListener('resize', () => {
    containers.forEach((container) => {
      const height = container.dataset.height || '500px';
      const mobileHeight = container.dataset.mobileHeight || '350px';
      container.style.height = isMobile() ? mobileHeight : height;
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', observeSketches);
} else {
  observeSketches();
}
