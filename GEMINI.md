# Portfolio — Gemini CLI Context

This project is a high-performance, quality-ratcheted personal portfolio for Anthony James Padavano, built with Astro 5 and TypeScript. It features a sophisticated design system, generative p5.js backgrounds, and D3.js data visualizations.

## Project Overview

- **Purpose:** Professional portfolio showcasing 20+ case studies, interactive art, and system metrics.
- **Core Framework:** **Astro 5** (Static Site Generation).
- **Interactive Layers:** **p5.js** (Generative background/gallery) and **D3.js** (Interactive data charts).
- **Organization:** Structured around an "Eight-Organ System" (Theoria, Poiesis, Ergon, Taxis, Logos, Koinonia, Kerygma, Meta).
- **Key Constraint:** Deployed to GitHub Pages at the **`/portfolio`** base path. All internal links and assets must be relative or handled via Astro's path utilities.

## Tech Stack

- **Frontend:** Astro 5, TypeScript, Vanilla CSS (Design Tokens).
- **Data:** JSON-driven architecture (`src/data/`), often synced from sibling repositories.
- **Visualization:** D3.js for charts, p5.js for generative art.
- **Search:** Pagefind (static search index generated at build time).
- **Runtime Environment:** Node.js >= 22.

## Building and Running

### Development
```bash
npm install
npm run dev          # Local dev server at localhost:4321/portfolio/
```

### Production
```bash
npm run build        # Build → dist/ (includes Pagefind indexing)
npm run preview      # Preview production build
```

### Data Management
```bash
npm run generate-data  # Regenerate local data from sibling repos
npm run sync:vitals    # Sync performance/trust metrics
npm run sync:github-pages # Sync external GitHub Pages index
```

## Quality & Testing Pipeline

This project enforces a rigorous **Quality Ratchet** system via the `.quality/` directory and custom scripts.

### Core Testing Commands
- **Unit/Integration:** `npm run test` (Vitest).
- **Coverage:** `npm run test:coverage` (Phase-based floors in `ratchet-policy.json`).
- **Accessibility:** `npm run test:a11y` (Static) and `npm run test:a11y:runtime` (Playwright + axe).
- **E2E/Smoke:** `npm run test:e2e:smoke` (Playwright).
- **Security:** `npm run test:security` (npm audit + custom allowlist contracts).
- **Performance:** `npm run lighthouse` (Local CI) or `npm run lighthouse:cloud` (PSI API).
- **Budgets:** `npm run test:perf:budgets` (Enforces route + chunk gzip size limits).

### Deployment Gate
Deployments only trigger via GitHub Actions (`deploy.yml`) after the full `quality.yml` workflow passes successfully.

## Development Conventions

- **Design System:** No CSS frameworks. Use CSS custom properties in `src/styles/global.css`.
- **Spacing:** Fibonacci-influenced scale (`--space-2xs` to `--space-5xl`).
- **Styling:** Component-scoped `<style>` blocks in `.astro` files.
- **TypeScript:** Strict mode enabled. Use Props interfaces for all components.
- **ESM:** The project is ESM-only (`"type": "module"`).
- **View Transitions:** Uses Astro's `<ClientRouter />`. Use `astro:page-load` for initialization and `astro:before-swap` for teardown.
- **Commit Messages:** Imperative mood with conventional prefixes (`feat:`, `fix:`, `chore:`, `docs:`).

## Architecture & Directory Structure

- `src/components/`: Reusable Astro components (grouped by category like `charts/`, `dashboard/`).
- `src/data/`: JSON datasets and corresponding TypeScript types.
- `src/pages/`: File-based routing (note the `/portfolio` base path requirement).
- `src/styles/`: Global design system and theme variables.
- `scripts/`: Custom build and quality automation (JS/MJS and some Python).
- `.quality/`: Policy JSONs and metric artifacts for the ratchet system.
- `packages/`: Local workspace packages (e.g., `github-pages-index-core`).

## Governance Note
`quality-governance.test.ts` ensures that `README.md` threshold documentation stays in sync with the JSON policies in `.quality/`. Updates to one require updates to the other to pass CI.
