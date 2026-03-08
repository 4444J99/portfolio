# Portfolio Project: Unwritten Conventions & House Style

This document synthesizes the actual patterns, architectural idioms, and conventions discovered across the portfolio codebase. Derived from reading 10+ components, 2 pages, API endpoints, configuration, and client-side initialization code.

---

## 1. Component Anatomy

### Props Handling Pattern

All components use **TypeScript interfaces as Props**, destructured in the component frontmatter:

```astro
---
interface Props {
  persona: {
    id: string;
    slug: string;
    title: string;
    subtitle: string;
    market_summary: string;
    stack: string[];
  };
}
const { persona } = Astro.props;
---
```

**Convention:**
- Props interface defined at the top of the `---` block
- Single destructuring assignment: `const { prop1, prop2 } = Astro.props`
- Nested object types inlined (not extracted to separate type files)
- No prop spreading (`{...props}`); explicit prop extraction only

**Examples:**
- `/src/components/resume/PersonaCard.astro` — persona-focused card with title/subtitle/stack
- `/src/components/dashboard/QualityScoreboard.astro` — metrics-driven dashboard panel
- `/src/components/home/ProjectCard.astro` — flip card with state management

### Responsive Design & Mobile-First Approach

**Breakpoint:** 768px (mobile threshold defined in `isMobile()` function in sketch-loader.ts)

**CSS patterns:**
- Use `clamp()` for fluid typography and spacing (e.g., `font-size: clamp(0.875rem, 2vw, 1.125rem)`)
- Flex layouts default to column on mobile, row on desktop
- Media queries are *minimal* — rely on flexbox wrapping and `clamp()`
- Grid layouts collapse from multi-column to 1fr on mobile (e.g., 2-panel to 1-panel)

**Example:**
```css
.scoreboard {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: var(--space-lg);
}

@media (max-width: 900px) {
  .scoreboard {
    grid-template-columns: 1fr;
  }
}
```

### Scoped Styling: BEM-like Naming + CSS Custom Properties

Every component has a `<style>` block (scoped to that component). **No utility classes; no CSS framework.**

**Naming convention:**
- Block: component or section name (e.g., `.persona-card`, `.quality-scoreboard`)
- Element: `__` separator (e.g., `.persona-card__title`, `.quality-scoreboard__pulse`)
- Modifier: `--` separator (e.g., `.pulse--success`, `.pulse--failure`)
- **Alternative for state/view toggles:** data attributes (e.g., `:global([data-portfolio-view="creative"]) .card__tags`)

**CSS Custom Properties (always used, never hardcoded values):**

```css
/* Colors */
--bg-primary: #0a0a0b
--bg-secondary: #1a1a1b
--bg-card: #181818
--border: #2a2a2a
--text-primary: #ffffff
--text-secondary: #b0b0b0
--text-muted: #707070
--accent: #d4a853 (gold)
--accent-hover: #c4463a (burnt sienna)
--accent-text: #d4a853

/* CMYK colors for persona cards */
--color-substantial: #f5d547 (yellow)
--color-minimal: #c4463a (red)
--color-crucial: #7c3aed (purple)
--color-emergent: #3b82f6 (blue)
--color-future: #10b981 (green)

/* Typography */
--font-heading: 'Syne', sans-serif
--font-body: 'Plus Jakarta Sans', sans-serif
--font-mono: 'JetBrains Mono', monospace

/* Spacing (Fibonacci-influenced rem scale) */
--space-2xs: 0.25rem
--space-xs: 0.5rem
--space-sm: 0.75rem
--space-md: 1rem
--space-lg: 1.5rem
--space-xl: 2rem
--space-2xl: 3rem
--space-3xl: 4rem
--space-4xl: 6rem

/* Layout */
--max-width: 1100px
--max-width-narrow: 740px
--radius-sm: 0.25rem
--radius-md: 0.5rem
--radius-lg: 1rem

/* Transitions */
--transition-fast: 150ms ease-out
--transition-base: 250ms ease-out
--transition-slow: 400ms ease-out
```

**Pattern examples:**

```astro
<style>
  .persona-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-xl);
    transition: all var(--transition-base);
  }

  .persona-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  .persona-card:focus-visible {
    outline: 0;
    box-shadow: 0 0 0 4px var(--accent);
  }

  .persona-card:nth-child(1) .persona-card__accent {
    border-bottom-color: var(--color-substantial);
  }
  .persona-card:nth-child(2) .persona-card__accent {
    border-bottom-color: var(--color-crucial);
  }
  /* etc. */
</style>
```

### Client-Side Interactivity: Singleton State Pattern

Components requiring state use a **singleton pattern** with a getState() function and localStorage persistence:

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

**Used by:**
- `IndexFilters.astro` — filter UI with skill/category dropdowns and view toggle
- `ProjectCard.astro` — flip card with hover state
- Search modal with Cmd+K hotkey

### View Transitions & Cleanup Pattern

Components using client-side scripts follow the **View Transition lifecycle**:

**astro:page-load** (after swap completes):
```typescript
document.addEventListener('astro:page-load', () => {
  initSketches();
  initCharts();
  initSearch();
});
```

**astro:before-swap** (before navigation away):
```typescript
document.addEventListener('astro:before-swap', () => {
  teardownPage(); // Disconnect observers, remove event listeners
});
```

**Pattern:** Use AbortController for cleanup:
```typescript
const controller = new AbortController();
window.addEventListener('resize', handler, { signal: controller.signal });
// Later:
document.addEventListener('astro:before-swap', () => {
  controller.abort(); // Removes all listeners at once
});
```

**Files:**
- `/src/components/scripts/SketchLifecycle.astro` — manages p5.js instances
- `/src/components/scripts/ClientBootstrap.astro` — initializes filters, search, theme
- `/src/components/sketches/sketch-loader.ts` — lazy-loading with IntersectionObserver

---

## 2. Page Anatomy

### Frontmatter Structure

Pages import components, data, and utilities in the frontmatter, then use component composition:

```astro
---
import { SKETCH_NAMES } from '@4444j99/sketches';
import HeroSection from '../components/home/HeroSection.astro';
import IndexFilters from '../components/home/IndexFilters.astro';
import ProjectGrid from '../components/home/ProjectGrid.astro';
import { organColorMap } from '../data/organ-colors';
import { categoryFilters, featuredNumbers, organGroups, skillFilters } from '../data/organ-groups';
import vitals from '../data/vitals.json';
import Layout from '../layouts/Layout.astro';
import { base } from '../utils/paths';

// Resolve slugs to full hrefs at build time
const resolvedGroups = organGroups.map((group) => ({
  ...group,
  projects: group.projects.map((p) => ({ ...p, href: `${base}projects/${p.slug}/` })),
}));
---
```

**Conventions:**
- Import statements in order: Astro utilities, then components (alphabetical), then data, then utilities
- Use `import` for static JSON data (processed at build time)
- Use dynamic imports for optional/lazy-loaded modules
- Resolve href and path values **at build time** (not in template)
- Use `{ base }` from `src/utils/paths` for all dynamic URLs to respect `/portfolio` base path

### Layout Composition

All pages wrap in `Layout.astro` with metadata and optional props:

```astro
<Layout 
  title="Anthony James Padavano — AI Orchestration Architect" 
  mainAttrs={{ "data-portfolio-view": "engineering" }}
  keywords={["AI Orchestration", "Systems Architect", ...]}
>
  <HeroSection resolvedGroups={resolvedGroups} />
  <ProjectGrid ... />
  {/* Other sections */}
</Layout>
```

**Layout.astro Props:**
- `title` (required) — page title for `<title>` and OG tags
- `description` (optional) — meta description; defaults to tagline
- `ogImage` (optional) — OG image URL; defaults to `/og/{slug}.png`
- `mainClass` (optional) — CSS class(es) for `<main>`
- `mainAttrs` (optional) — data attributes for `<main>` (e.g., `data-portfolio-view`)
- `schemaProject` (optional) — Schema.org microdata for projects
- `keywords` (optional) — array of SEO keywords

**Layout provides:**
- Head metadata (BaseMeta, SEOMeta, SchemaOrg, SiteLinks, Favicons, FontFaces)
- View Transition router (`<ClientRouter />`)
- Skip-to-content link
- Persistent background canvas (`#bg-canvas` with `transition:persist`)
- Header and Footer
- Back-to-top button
- Client-side lifecycle scripts (SketchLifecycle, ScrollReveal, ClientBootstrap, ThemeRestore)

**Files:**
- `/src/pages/index.astro` — homepage
- `/src/pages/about.astro` — about page
- `/src/pages/projects/[slug].astro` — project detail pages (dynamic route)
- `/src/pages/resume/[slug].astro` — persona-specific resume pages
- `/src/pages/for/[target].astro` — persona-targeted application landing pages

### Dynamic Routes

Astro uses file-based routing with `[param]` syntax for dynamic routes:

```astro
---
// src/pages/projects/[slug].astro
import { projectCatalog } from '../../data/project-catalog';

export async function getStaticPaths() {
  return projectCatalog.map((project) => ({
    params: { slug: project.slug },
    props: { project },
  }));
}

interface Props {
  project: ProjectType;
}
const { project } = Astro.props;
---
```

**Pattern:**
- Define `getStaticPaths()` returning array of `{ params, props }`
- Define Props interface matching the shape of props passed
- Destructure from `Astro.props`
- Pages are generated at **build time** for all static routes

### API Endpoints (Feed, JSON Data)

API endpoints are TypeScript files exporting a `GET` function:

```typescript
// src/pages/feed.xml.ts
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';

export function GET(context: APIContext) {
  const siteBase = 'https://4444j99.github.io/portfolio/';
  const items = [...projectItems, ...essayItems].sort(
    (a, b) => b.pubDate.getTime() - a.pubDate.getTime(),
  );
  
  return rss({
    title: 'Anthony James Padavano — Portfolio',
    description: '...',
    site: context.site?.toString() || siteBase,
    items,
    customData: '<language>en-us</language>',
  });
}
```

**Files:**
- `/src/pages/feed.xml.ts` — RSS feed combining projects and essays
- `/src/pages/github-pages.json.ts` — GitHub Pages index API
- `/src/pages/og/[...slug].png.ts` — OG image generation at build time

---

## 3. Client-Side Initialization Patterns

### IntersectionObserver Lazy-Loading

Components (sketches, charts) use **IntersectionObserver with 200px rootMargin** to defer initialization until near-viewport:

```typescript
// From sketch-loader.ts
if ('IntersectionObserver' in window) {
  sketchObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          deferInit(entry.target as HTMLElement);
          sketchObserver?.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '200px' }, // Pre-render 200px before entering viewport
  );
  containers.forEach((c) => sketchObserver!.observe(c));
}
```

**Pattern:** Observe elements, defer initialization when intersecting, unobserve after init completes.

### Concurrency Throttling

Concurrent initializations (p5.js sketches) are throttled to prevent memory spikes:

```typescript
const MAX_CONCURRENT = 4;
let activeInits = 0;
const initQueue: HTMLElement[] = [];

function initSketch(container: HTMLElement) {
  if (activeInits >= MAX_CONCURRENT) {
    if (!initQueue.includes(container)) initQueue.push(container);
    return;
  }
  doInitSketch(container);
}

function processQueue() {
  while (activeInits < MAX_CONCURRENT && initQueue.length > 0) {
    const next = initQueue.shift()!;
    doInitSketch(next);
  }
}

function doInitSketch(container: HTMLElement) {
  activeInits++;
  // ... initialize, then:
  // .finally(() => {
  //   activeInits--;
  //   processQueue();
  // })
}
```

### RequestIdleCallback for Deferred Initialization

After-the-fold sketches and background canvas defer to browser idle time:

```typescript
function deferInit(container: HTMLElement) {
  const rect = container.getBoundingClientRect();
  const aboveFold = rect.top < window.innerHeight;

  if (aboveFold && 'requestIdleCallback' in window) {
    window.requestIdleCallback(() => initSketch(container), { timeout: 2000 });
  } else {
    initSketch(container);
  }
}
```

**Background sketch:** Scheduled after LCP (Largest Contentful Paint):
```typescript
function scheduleBackgroundInit() {
  const startInit = () => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => initBackground(), { timeout: 3000 });
    } else {
      setTimeout(initBackground, 100);
    }
  };

  if ('PerformanceObserver' in window) {
    const po = new PerformanceObserver(() => {
      po.disconnect();
      startInit();
    });
    po.observe({ type: 'largest-contentful-paint', buffered: true });
  } else {
    setTimeout(initBackground, 200);
  }
}
```

### Reduced Motion Support

All animated components respect `prefers-reduced-motion: reduce`:

```typescript
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let prefersReducedMotion = motionQuery.matches;
motionQuery.addEventListener('change', (e) => {
  prefersReducedMotion = e.matches;
});

// In sketch initialization:
if (prefersReducedMotion && p.draw) {
  const originalDraw = p.draw.bind(p);
  let warmupFrames = 60;
  p.draw = () => {
    originalDraw();
    warmupFrames--;
    if (warmupFrames <= 0) {
      p.noLoop(); // Stop animation, show static frame
    }
  };
}
```

### View Transition Cleanup

Sketch instances are torn down **per-page** to avoid memory leaks, but background canvas persists:

```typescript
// teardownPage() keeps #bg-canvas instance
export function teardownPage() {
  const bg = document.getElementById('bg-canvas');
  const bgInstance = bg ? instances.get(bg) : undefined;

  // Remove non-background instances
  instances.forEach((instance, el) => {
    if (el !== bg) {
      try {
        instance.remove();
      } catch {
        /* already removed */
      }
    }
  });
  instances.clear();

  // Preserve background instance
  if (bg && bgInstance) {
    instances.set(bg, bgInstance);
  }
}

// reinitPage() re-observes per-page sketches
export function reinitPage() {
  if (shouldBootBackground()) {
    scheduleBackgroundInit();
  }
  observeSketches();
}
```

---

## 4. Import Conventions

### Workspace Packages (file: Protocol)

Three local npm packages imported via `file:` protocol in `package.json`:

```json
"dependencies": {
  "@4444j99/quality-ratchet-kit": "file:packages/quality-ratchet-kit",
  "@4444j99/sketches": "file:packages/sketches",
  "@meta-organvm/github-pages-index-core": "file:packages/github-pages-index-core"
}
```

**Usage:**
```typescript
import { SKETCH_NAMES } from '@4444j99/sketches';
import { QualityRatchet } from '@4444j99/quality-ratchet-kit';
import { indexGitHubPages } from '@meta-organvm/github-pages-index-core';
```

**Convention:** Workspace packages use scoped names:
- `@4444j99/*` — personal portfolio utilities
- `@meta-organvm/*` — cross-organ shared infrastructure

### Path Aliases

Astro automatically provides `@` alias mapping to `src/`:

```typescript
import { base } from '@/utils/paths';
import { organColorMap } from '@/data/organ-colors';
```

**Convention:** Use `@/` for imports within `src/`, absolute paths for workspace package imports.

### Data Imports

JSON data files are imported directly and processed at build time:

```typescript
import vitals from '../data/vitals.json';
import essaysData from '../data/essays.json';
import { projectCatalog } from '../data/project-catalog';
import { projectIndex } from '../data/project-index';
```

**Files are located at:**
- `src/data/*.json` — generated by `npm run generate-data` from `../ingesting-organ-document-structure/`
- `src/data/*.ts` — TypeScript modules exporting data structures

**Base Path Handling:**

All dynamic URLs must account for `/portfolio` base path. Use the helper from `src/utils/paths`:

```typescript
import { base } from '../utils/paths';

const href = `${base}projects/${slug}/`; // Resolves to /portfolio/projects/slug/
```

**Files:**
- `/src/utils/paths.ts` — exports `base`, `canonicalBase`, `pathRelative()`
- `/src/data/organ-groups.ts` — project grouping by organ
- `/src/data/organ-colors.ts` — color mappings for organs
- `/src/data/personas.json` — career persona definitions
- `/src/data/targets.json` — recruitment target records

### Barrel Files (Re-exports)

Component groups often use index files for cleaner imports:

```typescript
// src/components/home/index.ts
export { default as HeroSection } from './HeroSection.astro';
export { default as IndexFilters } from './IndexFilters.astro';
export { default as ProjectGrid } from './ProjectGrid.astro';
```

**Convention:** Only used for frequently-imported groups. Most single-use components are imported directly.

---

## 5. CSS Design System

### Complete Custom Property Palette

All values defined in `src/styles/global.css` (791 lines). **Never hardcode colors, spacing, typography, or transitions.**

#### Color System

```css
/* Base */
--bg-primary: #0a0a0b;
--bg-secondary: #1a1a1b;
--bg-card: #181818;
--border: #2a2a2a;

/* Text */
--text-primary: #ffffff;
--text-secondary: #b0b0b0;
--text-muted: #707070;

/* Accents */
--accent: #d4a853; /* Gold */
--accent-hover: #c4463a; /* Burnt sienna */
--accent-text: #d4a853;

/* Semantic (CMYK palette for personas) */
--color-substantial: #f5d547; /* Yellow */
--color-minimal: #c4463a; /* Red */
--color-crucial: #7c3aed; /* Purple */
--color-emergent: #3b82f6; /* Blue */
--color-future: #10b981; /* Green */

/* Success/failure states */
--success: #10b981;
--failure: #ef4444;
--warning: #f59e0b;
--pending: #8b5cf6;
```

#### Typography System

```css
--font-heading: 'Syne', sans-serif;
--font-body: 'Plus Jakarta Sans', sans-serif;
--font-mono: 'JetBrains Mono', monospace;

--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;

--line-height-tight: 1.4;
--line-height-normal: 1.6;
--line-height-relaxed: 1.8;

--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

#### Spacing System (Fibonacci-Influenced)

```css
--space-2xs: 0.25rem; /* 4px */
--space-xs: 0.5rem; /* 8px */
--space-sm: 0.75rem; /* 12px */
--space-md: 1rem; /* 16px */
--space-lg: 1.5rem; /* 24px */
--space-xl: 2rem; /* 32px */
--space-2xl: 3rem; /* 48px */
--space-3xl: 4rem; /* 64px */
--space-4xl: 6rem; /* 96px */
```

#### Layout Constants

```css
--max-width: 1100px;
--max-width-narrow: 740px;

--radius-sm: 0.25rem;
--radius-md: 0.5rem;
--radius-lg: 1rem;

--container-padding: var(--space-xl);
```

#### Transitions

```css
--transition-fast: 150ms ease-out;
--transition-base: 250ms ease-out;
--transition-slow: 400ms ease-out;
```

### Responsive Breakpoints

**Mobile-first approach with single breakpoint:**

```css
/* Mobile by default */
.component {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

/* Desktop (768px and up) */
@media (min-width: 768px) {
  .component {
    flex-direction: row;
    gap: var(--space-xl);
  }
}

/* Larger screens (900px+) */
@media (min-width: 900px) {
  .component {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
  }
}
```

### Fluid Typography with clamp()

Instead of discrete font sizes, use CSS `clamp()` for smooth scaling:

```css
h1 {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  line-height: var(--line-height-tight);
}

p {
  font-size: clamp(0.875rem, 2vw, 1.125rem);
  line-height: var(--line-height-normal);
}
```

**Pattern:** `clamp(min, preferred, max)` scales smoothly between breakpoints without media queries.

### Shadow & Elevation System

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-base: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.15);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.2);
--shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.3);
```

### Z-Index System

```css
--z-hidden: -1;
--z-base: 0;
--z-dropdown: 100;
--z-sticky: 200;
--z-modal: 1000;
--z-tooltip: 1100;
```

### Utility Patterns (No CSS Framework)

Common utility-like patterns using CSS custom properties:

```css
/* Container and max-width limiting */
.container {
  width: 100%;
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding);
}

/* Flex center */
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Visually hidden (for sr-only) */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border-width: 0;
}

/* Focus visible (consistent across all interactive elements) */
*:focus-visible {
  outline: 0;
  box-shadow: 0 0 0 4px var(--accent);
}
```

---

## 6. Dual Portfolio View Pattern

The portfolio supports two views: **engineering** (primary) and **creative** (secondary). Switching is controlled via data attribute and client-side state.

### View Switching Mechanism

**State management** (`src/components/home/index-filters-state.ts`):
```typescript
const STATE_KEY = 'portfolio-filters';
export function setState(updates: Partial<FilterState>) {
  const current = getState();
  const next = { ...current, ...updates };
  localStorage.setItem(STATE_KEY, JSON.stringify(next));
  return next;
}
```

**Toggle UI** (IndexFilters.astro):
```astro
<div class="toggle">
  <button 
    class:list={["toggle__btn", { "toggle__btn--active": view === 'engineering' }]}
    data-view="engineering"
  >
    Engineering
  </button>
  <button 
    class:list={["toggle__btn", { "toggle__btn--active": view === 'creative' }]}
    data-view="creative"
  >
    Creative
  </button>
</div>
```

**JavaScript listener:**
```typescript
document.querySelectorAll('[data-view]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    const view = (e.target as HTMLElement).dataset.view as 'engineering' | 'creative';
    setState({ portfolioView: view });
    document.querySelector('main')?.setAttribute('data-portfolio-view', view);
    // Re-render filtered projects
  });
});
```

### Conditional Content Visibility

Components use **data attributes on `<main>`** to control visibility:

```astro
<!-- In Layout.astro -->
<main data-portfolio-view="engineering">
  <slot />
</main>
```

**In components:**
```css
/* Show only in engineering view */
:global([data-portfolio-view="engineering"]) .card__tags--engineering {
  display: flex;
}

/* Hide in engineering view */
:global([data-portfolio-view="engineering"]) .card__tags--creative {
  display: none;
}

/* Show only in creative view */
:global([data-portfolio-view="creative"]) .card__tags--creative {
  display: flex;
}

:global([data-portfolio-view="creative"]) .card__tags--engineering {
  display: none;
}
```

**Advantage:** No component re-rendering; instant CSS-driven view switch with localStorage persistence.

---

## 7. Key Architectural Patterns

### Component Lifecycle in View Transitions

1. **Initial load (astro:page-load):**
   - Bootstrap client state (filters, theme)
   - Observe sketches/charts with IntersectionObserver
   - Initialize only visible elements
   - Defer off-screen elements via requestIdleCallback

2. **Navigation away (astro:before-swap):**
   - Teardown per-page instances (sketches, charts)
   - Remove event listeners via AbortController
   - Preserve #bg-canvas via transition:persist

3. **New page loaded (astro:page-load again):**
   - Reinitialize per-page sketches
   - Re-observe new chart containers
   - Background canvas continues uninterrupted

### Data Loading at Build Time

All data processing happens **at build time**, not runtime:

- `npm run generate-data` — Python script from sibling repo, writes to `src/data/`
- `npm run sync:vitals` — fetches GitHub API metrics, writes JSON
- `npm run sync:omega` — updates maturity scorecard
- All Astro pages read these JSON files with static imports
- **No async data fetching in .astro components**

### CSS-Driven Interactivity

Prefer CSS-driven state changes over DOM manipulation:

- **View toggling:** Data attributes + `:global()` selectors (no re-render)
- **Card flips:** CSS transitions on `:hover` and `:focus-visible`
- **Hover effects:** `translateY()`, opacity, box-shadow with `var(--transition-base)`
- **Loading states:** CSS animations on `.pulse` class

---

## 8. Common Idioms & Edge Cases

### Handling Base Path in Links

**Always use the `base` helper:**
```typescript
import { base } from '@/utils/paths';

// WRONG:
const href = `/projects/${slug}/`;

// RIGHT:
const href = `${base}projects/${slug}/`;
// Resolves to: /portfolio/projects/slug/
```

### Managing p5.js Instances

p5.js instances are stored in a Map to prevent memory leaks:

```typescript
const instances = new Map<HTMLElement, p5>();

// On teardown:
instances.forEach((instance) => {
  try {
    instance.remove();
  } catch {
    /* already removed */
  }
});
instances.clear();
```

### Chart Re-rendering on View Change

Charts subscribe to the view state and redraw on toggle:

```typescript
function observeViewToggle(chart: ChartInstance) {
  const handleViewChange = () => {
    chart.updateTheme(getViewTheme());
    chart.redraw();
  };
  document.addEventListener('portfolio-view-changed', handleViewChange);
  return () => document.removeEventListener('portfolio-view-changed', handleViewChange);
}
```

### Accessibility: Focus Management

All interactive elements support keyboard navigation:

```css
*:focus-visible {
  outline: 0;
  box-shadow: 0 0 0 4px var(--accent);
}
```

**Semantic HTML:**
- Use `<button>` for actions, `<a>` for navigation
- Provide `aria-label` for icon-only buttons
- Use `sr-only` for hidden context

---

## 9. Build & Deployment

### Production Build Pipeline

```bash
npm run build
# Runs in sequence:
# 1. npm run generate-badges (quality metrics)
# 2. npm run sync:vitals (GitHub metrics)
# 3. npm run sync:omega (maturity scorecard)
# 4. npm run sync:identity (persona data)
# 5. astro build (static HTML generation to dist/)
# 6. npx pagefind --site dist (full-text search indexing)
```

### Chunk Configuration

`astro.config.mjs` manually chunks large vendors to prevent code-splitting overhead:

```javascript
export default defineConfig({
  vite: {
    build: {
      chunkSizeWarningLimit: 1800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/p5')) return 'vendor-p5';
            if (id.includes('node_modules/mermaid')) return 'vendor-mermaid';
            if (id.includes('node_modules/cytoscape')) return 'vendor-cytoscape';
            if (id.includes('node_modules/katex')) return 'vendor-katex';
          },
        },
      },
    },
  },
});
```

### GitHub Pages Deployment

- Site URL: `https://4444j99.github.io/portfolio/`
- Base path: `/portfolio` (required for all URLs)
- Deployment gated by `quality.yml` success
- `deploy.yml` workflow builds and pushes to `gh-pages` branch

---

## 10. Testing Conventions

### Vitest Configuration

Located at `.config/vitest.config.ts` (not project root):

```typescript
export default mergeConfig(
  getViteConfig(),
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['src/test/setup.ts'],
      coverage: {
        provider: 'v8',
        exclude: ['.astro/**', 'packages/**/node_modules/**'],
      },
    },
  })
);
```

### Test File Location

Tests live alongside source:
- `src/components/__tests__/ComponentName.test.ts`
- `src/data/__tests__/data-integrity.test.ts`
- `scripts/__tests__/script-name.test.ts`

### Test Utilities

Canvas API stubs in `src/test/setup.ts` for headless testing:

```typescript
global.HTMLCanvasElement.prototype.getContext = () => ({
  fillStyle: '',
  fillRect: () => {},
  // ... other mocks
});
```

---

## Summary Table: Unwritten House Style

| Aspect | Pattern |
|--------|---------|
| **Components** | TypeScript Props interface, scoped `<style>`, BEM naming |
| **Props** | Destructured from `Astro.props`, type-safe interfaces |
| **Responsive** | Mobile-first, 768px breakpoint, clamp() for fluid sizing |
| **Colors** | CSS custom properties only, never hardcoded |
| **Spacing** | Fibonacci scale (`--space-*`), no hardcoded pixel values |
| **State** | Singleton pattern + localStorage persistence |
| **Cleanup** | AbortController for event listeners, teardownPage() for p5/D3 |
| **View Transitions** | astro:page-load (init) → astro:before-swap (teardown) |
| **Imports** | Workspace packages (file:), path aliases (@/), data imports |
| **Base Path** | Always use `${base}` for dynamic URLs to respect `/portfolio` |
| **Animations** | CSS transitions with `var(--transition-*)`, respect prefers-reduced-motion |
| **Build** | Static generation + manual chunk configuration for vendors |
| **Accessibility** | Semantic HTML, focus-visible styling, sr-only for hidden text |

---

This document captures the actual, unwritten conventions that govern the portfolio codebase. Use these patterns as a reference when adding new components, pages, or features.
