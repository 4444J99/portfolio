import type p5 from 'p5';

const sketchModules: Record<string, () => Promise<{ default: (p: p5, container: HTMLElement) => void }>> = {
  'hero': () => import('./hero-sketch'),
  'organ-system': () => import('./organ-system-sketch'),
  'recursive-tree': () => import('./recursive-tree-sketch'),
  'counterpoint': () => import('./counterpoint-sketch'),
  'pipeline': () => import('./pipeline-sketch'),
  'token-stream': () => import('./token-stream-sketch'),
  'network-graph': () => import('./network-graph-sketch'),
  'flow-diagram': () => import('./flow-diagram-sketch'),
  'data-bars': () => import('./data-bars-sketch'),
  'particle-field': () => import('./particle-field-sketch'),
};

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let prefersReducedMotion = motionQuery.matches;
motionQuery.addEventListener('change', (e) => { prefersReducedMotion = e.matches; });

const initialized = new Set<HTMLElement>();

function isMobile(): boolean {
  return window.innerWidth < 768;
}

let resizeTimer: ReturnType<typeof setTimeout> | null = null;

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
      sketchFn(p, container);

      // For reduced motion: render a fully-grown static frame then stop
      if (prefersReducedMotion && p.draw) {
        const originalDraw = p.draw.bind(p);
        // Run draw multiple times silently to let state build up, then stop
        let warmupFrames = 60; // simulate ~2s of animation
        p.draw = function () {
          originalDraw();
          warmupFrames--;
          if (warmupFrames <= 0) {
            p.noLoop();
          }
        };

        // Allow click interactions to trigger a single redraw
        const originalMousePressed = p.mousePressed?.bind(p);
        if (originalMousePressed) {
          p.mousePressed = function () {
            originalMousePressed();
            p.redraw();
          };
        }
      }
    }, container);
  });
}

function deferInit(container: HTMLElement) {
  // Defer above-the-fold sketches to avoid blocking LCP
  const rect = container.getBoundingClientRect();
  const aboveFold = rect.top < window.innerHeight;

  if (aboveFold && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => initSketch(container), { timeout: 2000 });
  } else {
    initSketch(container);
  }
}

function observeSketches() {
  const containers = document.querySelectorAll<HTMLElement>('.sketch-container[data-sketch]');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            deferInit(entry.target as HTMLElement);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '200px' }
    );
    containers.forEach((c) => observer.observe(c));
  } else {
    containers.forEach(deferInit);
  }

  window.addEventListener('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      containers.forEach((container) => {
        const height = container.dataset.height || '500px';
        const mobileHeight = container.dataset.mobileHeight || '350px';
        container.style.height = isMobile() ? mobileHeight : height;
      });
    }, 100);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', observeSketches);
} else {
  observeSketches();
}
