# House Style

Annotated code patterns governing the portfolio codebase.

## Standard Astro Component

```astro
---
// 1. Props interface at top
interface Props {
  title: string;
  metrics: { label: string; value: number }[];
  variant?: 'compact' | 'full';
}

// 2. Single destructure with defaults
const { title, metrics, variant = 'full' } = Astro.props;
---

<!-- 3. Semantic HTML with BEM class names -->
<section class="scoreboard">
  <h2 class="scoreboard__title">{title}</h2>
  <ul class="scoreboard__list">
    {metrics.map((m) => (
      <li class="scoreboard__item">
        <span class="scoreboard__label">{m.label}</span>
        <span class="scoreboard__value">{m.value}</span>
      </li>
    ))}
  </ul>
</section>

<!-- 4. Scoped style block — all values from custom properties -->
<style>
  .scoreboard {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-xl);
  }
  .scoreboard__title {
    font-family: var(--font-heading);
    font-size: clamp(1.25rem, 3vw, 1.75rem);
    color: var(--accent-text);
    margin-bottom: var(--space-md);
  }
  .scoreboard__list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }
  .scoreboard__item {
    display: flex;
    justify-content: space-between;
    padding: var(--space-xs) 0;
    border-bottom: 1px solid var(--border);
  }
  .scoreboard__label {
    color: var(--text-secondary);
  }
  .scoreboard__value {
    font-family: var(--font-mono);
    color: var(--text-primary);
  }

  @media (min-width: 768px) {
    .scoreboard__list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-md);
    }
  }
</style>
```

**Key rules**:
- No utility classes, no CSS framework
- BEM: `.block`, `.block__element`, `.block--modifier`
- Mobile-first: base styles are mobile, `@media (min-width: 768px)` for desktop
- Fluid typography via `clamp(min, preferred, max)` — minimize media queries
- Hover effects: `translateY(-4px)`, `box-shadow`, `var(--transition-base)`
- Focus: `*:focus-visible { box-shadow: 0 0 0 4px var(--accent); }`

## Client-Side Script Pattern

```astro
<!-- In a component or page -->
<script is:inline>
  // View transition lifecycle
  document.addEventListener('astro:page-load', () => {
    const controller = new AbortController();
    const { signal } = controller;

    // Initialize with AbortController for cleanup
    const button = document.querySelector('[data-action="toggle"]');
    button?.addEventListener('click', handleToggle, { signal });

    window.addEventListener('resize', handleResize, { signal });

    // Teardown on navigation
    document.addEventListener('astro:before-swap', () => {
      controller.abort(); // Removes all listeners at once
    }, { once: true });
  });

  function handleToggle(e) {
    const view = e.target.dataset.view;
    document.querySelector('main')?.setAttribute('data-portfolio-view', view);
    localStorage.setItem('portfolio-filters', JSON.stringify({ portfolioView: view }));
  }

  function handleResize() {
    // Respond to viewport changes
  }
</script>
```

**Key rules**:
- `is:inline` prevents Astro bundling — script runs as-is in the browser
- `astro:page-load` for init (fires on both initial load and view transitions)
- `astro:before-swap` with `{ once: true }` for teardown
- AbortController removes all event listeners in one call
- State persisted to localStorage, rendered via data attributes + CSS

## Singleton State Pattern

```typescript
// src/components/home/index-filters-state.ts
interface FilterState {
  skillFilter: string | null;
  categoryFilter: string | null;
  portfolioView: 'engineering' | 'creative';
}

const STATE_KEY = 'portfolio-filters';
const defaultState: FilterState = {
  skillFilter: null,
  categoryFilter: null,
  portfolioView: 'engineering',
};

export function getState(): FilterState {
  const stored = localStorage.getItem(STATE_KEY);
  return stored ? JSON.parse(stored) : defaultState;
}

export function setState(updates: Partial<FilterState>) {
  const current = getState();
  const next = { ...current, ...updates };
  localStorage.setItem(STATE_KEY, JSON.stringify(next));
  return next;
}
```

## Adding a New p5.js Sketch

1. Create sketch file in `packages/sketches/src/` (e.g., `nova.mjs`):

```javascript
import { PALETTE } from '../palette.mjs';

export function nova(p) {
  let particles = [];

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.background(PALETTE.bg);
  };

  p.draw = () => {
    p.background(PALETTE.bg + '08'); // Fade trail
    // ... drawing logic using PALETTE colors
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
}
```

2. Register in `packages/sketches/src/index.mjs`:
```javascript
export { nova } from './nova.mjs';
```

3. Add to the `SketchName` type in `packages/sketches/src/types.d.ts`:
```typescript
export type SketchName = 'atoms' | 'conductor' | /* ... */ | 'nova';
```

4. Run tests: `npm run test:sketches`

5. Use in a page via `data-sketch="nova"` attribute on a container element, or bind to a persona via `sketchId` in `personas.json`.

## Adding a New D3 Chart

1. Create chart module in `src/components/charts/` (e.g., `timeline-chart.ts`):

```typescript
import * as d3 from 'd3';
import { chartTheme } from './chart-theme';

export function renderTimelineChart(container: HTMLElement, data: TimelineData[]) {
  const { colors, fonts, spacing } = chartTheme();
  const svg = d3.select(container).append('svg');
  // ... D3 rendering using theme tokens
}
```

2. Register in `src/components/charts/chart-loader.ts`:
```typescript
const chartModules = {
  // ... existing charts
  timeline: () => import('./timeline-chart'),
};
```

3. Use in a component:
```astro
<div data-chart="timeline" data-chart-config={JSON.stringify(config)}></div>
```

The `chart-loader.ts` handles dynamic import and initialization via IntersectionObserver.

## Dynamic Route Pattern

```astro
---
// src/pages/for/[target].astro
import targets from '../../data/targets.json';
import personas from '../../data/personas.json';
import Layout from '../../layouts/Layout.astro';
import { base } from '../../utils/paths';

export async function getStaticPaths() {
  return targets.targets.map((target) => ({
    params: { target: target.slug },
    props: {
      target,
      persona: personas.find((p) => p.id === target.persona_id),
    },
  }));
}

interface Props {
  target: typeof targets.targets[0];
  persona: typeof personas[0];
}
const { target, persona } = Astro.props;
---

<Layout title={`${target.company} — ${target.role}`}>
  <!-- Page content using target and persona data -->
</Layout>
```

**Rules**:
- `getStaticPaths()` generates all routes at build time
- Props passed through `getStaticPaths` match the `Props` interface
- All links use `${base}` prefix for correct routing

## Page Layout Composition

```astro
<Layout
  title="Page Title"
  description="Optional meta description"
  mainAttrs={{ "data-portfolio-view": "engineering" }}
  keywords={["keyword1", "keyword2"]}
>
  <SectionComponent data={data} />
  <AnotherSection />
</Layout>
```

**Layout.astro provides**: Head metadata (BaseMeta, SEOMeta, SchemaOrg, Favicons, FontFaces), `<ClientRouter />` for view transitions, skip-to-content link, persistent `#bg-canvas` (`transition:persist`), Header, Footer, back-to-top button, client lifecycle scripts (SketchLifecycle, ScrollReveal, ClientBootstrap, ThemeRestore).

## CSS Custom Property Catalog

Full set defined in `src/styles/global.css`. Reference only — never hardcode.

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0a0a0b` | Page background |
| `--bg-secondary` | `#1a1a1b` | Section backgrounds |
| `--bg-card` | `#181818` | Card/panel backgrounds |
| `--border` | `#2a2a2a` | All borders |
| `--text-primary` | `#ffffff` | Headings, primary text |
| `--text-secondary` | `#b0b0b0` | Body text, labels |
| `--text-muted` | `#707070` | Tertiary text, captions |
| `--accent` | `#d4a853` | Gold — links, highlights, focus rings |
| `--accent-hover` | `#c4463a` | Burnt sienna — hover states |
| `--success` | `#10b981` | Positive indicators |
| `--failure` | `#ef4444` | Error indicators |
| `--warning` | `#f59e0b` | Warning indicators |

### Persona/CMYK Colors
| Token | Value | Semantic |
|-------|-------|----------|
| `--color-substantial` | `#f5d547` | Yellow |
| `--color-minimal` | `#c4463a` | Red |
| `--color-crucial` | `#7c3aed` | Purple |
| `--color-emergent` | `#3b82f6` | Blue |
| `--color-future` | `#10b981` | Green |

### Typography
| Token | Value |
|-------|-------|
| `--font-heading` | Syne, sans-serif |
| `--font-body` | Plus Jakarta Sans, sans-serif |
| `--font-mono` | JetBrains Mono, monospace |
| `--text-xs` through `--text-2xl` | 0.75rem through 1.5rem |

### Spacing (Fibonacci-influenced)
| Token | Value |
|-------|-------|
| `--space-2xs` | 0.25rem (4px) |
| `--space-xs` | 0.5rem (8px) |
| `--space-sm` | 0.75rem (12px) |
| `--space-md` | 1rem (16px) |
| `--space-lg` | 1.5rem (24px) |
| `--space-xl` | 2rem (32px) |
| `--space-2xl` | 3rem (48px) |
| `--space-3xl` | 4rem (64px) |
| `--space-4xl` | 6rem (96px) |

### Z-Index
| Token | Value | Usage |
|-------|-------|-------|
| `--z-hidden` | -1 | Background canvas |
| `--z-base` | 0 | Default |
| `--z-dropdown` | 100 | Dropdowns, menus |
| `--z-sticky` | 200 | Sticky header |
| `--z-modal` | 1000 | Modals, overlays |
| `--z-tooltip` | 1100 | Tooltips |
