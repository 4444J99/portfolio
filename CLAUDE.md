# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # Dev server at localhost:4321/portfolio/
npm run build          # Production build → dist/
npm run preview        # Preview production build
npm run generate-data  # Regenerate src/data/ from sibling repo (requires ../ingesting-organ-document-structure/)
npm run test           # Unit + integration tests (vitest)
npm run test:coverage  # Coverage report (V8)
npm run test:a11y      # Accessibility audit (axe-core, 33 pages)
npm run validate       # HTML validation + internal link check
npm run lighthouse     # Lighthouse CI performance budgets
npm run test:ci        # All quality gates chained
npm run generate-badges # Regenerate quality badges + metrics JSON
```

**Testing strategy:** Vitest runs unit tests for utilities, data integrity, component logic, and build output verification. Accessibility via axe-core on all built pages. Lighthouse CI enforces performance/a11y/SEO budgets. HTML validation and link checking catch structural issues. All gates run in CI on every push via `.github/workflows/quality.yml`.

## Architecture

**Astro 5** static site deployed to GitHub Pages at `https://4444j99.github.io/portfolio/`.

### Key Constraint: Base Path

All internal links and assets must account for the `/portfolio` base path configured in `astro.config.mjs`. Use relative paths or Astro's built-in path handling.

### Routing

Pages in `src/pages/` map directly to URLs (Astro file-based routing). There are 20 project case-study pages under `src/pages/projects/` plus top-level pages: index, about, resume, dashboard, essays, architecture, community, consult, products, and 404.

### Components

```
src/
├── layouts/
│   ├── Layout.astro              # Page shell: head + Header + main + Footer + scripts
│   └── ProjectLayout.astro       # Extends Layout with ProjectDetail wrapper (20 project pages)
├── components/
│   ├── head/                     # <head> partials (imported by Layout.astro)
│   │   ├── BaseMeta.astro, FaviconLinks.astro, SiteLinks.astro
│   │   ├── SEOMeta.astro, SchemaOrg.astro, FontFaces.astro
│   ├── scripts/                  # Client-side script components (end of <body>)
│   │   ├── SketchLifecycle.astro, ScrollReveal.astro
│   │   ├── ClientBootstrap.astro, ThemeRestore.astro (is:inline)
│   ├── home/                     # Index page section components
│   │   ├── HeroSection.astro     # View toggle, hero text, credentials, canvas
│   │   ├── ProjectGrid.astro     # Filter bars + organ groups + ProjectCard loop
│   │   └── IndexFilters.astro    # Client-side view toggle + filter chip logic
│   ├── dashboard/                # Dashboard page section components
│   │   ├── QualityGates.astro    # Quality cards, badges, timestamp
│   │   ├── OrganStatus.astro     # Organ card grid
│   │   ├── SprintTimeline.astro  # Timeline entries + chart
│   │   ├── PraxisTargets.astro   # Target cards + chart
│   │   └── FlagshipTable.astro   # Analysis charts + vivification table
│   ├── academic/                 # Technical writing (co-located styles)
│   │   ├── Cite.astro, References.astro, Figure.astro
│   │   ├── CodeStructure.astro, MermaidDiagram.astro
│   ├── sketches/
│   │   └── SketchContainer.astro
│   ├── Header.astro, Footer.astro, ProjectCard.astro, ProjectDetail.astro
│   └── StatGrid.astro           # Reusable stat display grid
├── utils/
│   ├── og-image.ts, paths.ts    # Base path + canonical URL helpers
├── data/
│   ├── schema-person.ts         # Schema.org person data
│   ├── organ-groups.ts          # Homepage project data by organ
│   └── ...JSON files
```

All components use **TypeScript Props interfaces** in the frontmatter and **component-scoped `<style>` blocks**.

### Layout

Two layouts: `Layout.astro` (page shell: head partials + Header + `<main>` + Footer + script components) and `ProjectLayout.astro` (wraps Layout with ProjectDetail for the 20 project case-study pages). Self-hosted fonts (Syne + Plus Jakarta Sans + JetBrains Mono variable woff2 in `public/fonts/`).

### Styling

**No CSS framework.** One global stylesheet (`src/styles/global.css`, ~735 lines) defines the design system via CSS custom properties. Academic component styles are co-located in their `.astro` files.

- Colors: dark theme (`#0a0a0b` base), gold (`--accent: #d4a853`) / burnt sienna (`--accent-hover: #c4463a`) accent palette
- Typography: `--font-heading: 'Syne'` (display), `--font-body: 'Plus Jakarta Sans'`, `--font-mono: 'JetBrains Mono'`
- Spacing: Fibonacci-influenced rem scale (`--space-2xs` through `--space-4xl`)
- Border radius: `--radius-sm` (4px), `--radius-md` (8px), `--radius-lg` (16px), `--radius-xl` (24px)
- Layout: `--max-width: 1100px`, `--max-width-narrow: 740px`
- Responsive: 768px mobile breakpoint, `clamp()` fluid typography

Components add scoped styles on top of these tokens. Use existing custom properties rather than hardcoding values.

### p5.js Background

A full-page p5.js canvas (`#bg-canvas`, z-index -1, `pointer-events: none`) renders a generative art background. Three visual modes are controlled by `data-bg-mode` attribute on `<body>`: subtle, bold, extreme — each applies different CSS filter/saturation rules defined in `global.css`.

### Data Pipeline

`src/data/` contains JSON files (projects, essays, about, landing, graph, system-metrics) generated by `npm run generate-data` from a sibling repo. These are imported at build time by Astro pages. `src/data/schema-person.ts` exports structured Schema.org person data used by `SchemaOrg.astro`.

### CI/CD

Three GitHub Actions workflows in `.github/workflows/`:
- **deploy.yml** — builds and deploys to GitHub Pages on push to main (Node 22, `npm ci && npm run build`)
- **quality.yml** — runs all quality gates on push/PR: vitest, axe-core a11y, HTML validation, link check, Lighthouse CI
- **build-resume.yml** — renders resume YAML → PDF/DOCX via RenderCV + Pandoc, creates GitHub Release, auto-commits to `public/resume/`

## Conventions

- **TypeScript strict mode** via `astro/tsconfigs/strict`
- **ESM only** (`"type": "module"` in package.json)
- Astro directives: `class:list` for conditional classes, `is:inline` for client-side scripts that shouldn't be bundled
- Commit messages: imperative mood, conventional-ish prefixes (`feat:`, `fix:`, `chore:`)
- Accessibility: ARIA attributes on interactive elements, `prefers-reduced-motion` media query, semantic HTML
- `lodash-es` pinned to 4.17.23 in package.json overrides (prototype pollution fix)

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| astro | ^5.17.1 | Framework |
| p5 | 2.2.1 | Generative background canvas |
| d3 | 7.9.0 | Data visualizations |
| mermaid | 11.12.2 | Diagrams in project pages |
| vitest | 4.x | Test runner (dev) |
| @vitest/coverage-v8 | 4.x | Coverage via V8 (dev) |
| axe-core | 4.x | Accessibility auditing (dev) |
| @lhci/cli | 0.15.x | Lighthouse CI (dev) |
| html-validate | 10.x | HTML validation (dev) |

## Debugging

- **Styles not applying**: CSS is component-scoped by default. Shared styles go in `global.css`; use custom properties for values.
- **Base path issues**: All routes and assets live under `/portfolio`. Check relative paths.
- **Mobile menu broken**: Header uses `is:inline` script — check it's not accidentally bundled.
- **Build chunk warnings**: Vite chunk limit is 1200kB (set for p5.js). Monitor `npm run build` output.
- **Tests failing on build output**: Build-output and a11y tests require `npm run build` first. Run `npm run build && npm run test`.
- **Lighthouse fails locally**: Needs Chrome installed. CI uses `ubuntu-latest` which has Chrome. Check `lighthouserc.cjs` for score thresholds.
