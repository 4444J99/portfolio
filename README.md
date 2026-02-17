# Portfolio — Anthony James Padavano

[![Live Site](https://img.shields.io/badge/Live-4444j99.github.io/portfolio-00BCD4?style=flat)](https://4444j99.github.io/portfolio/)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Quality Gates](https://github.com/4444j99/portfolio/actions/workflows/quality.yml/badge.svg)](https://github.com/4444j99/portfolio/actions/workflows/quality.yml)

Personal portfolio site showcasing 20 project case studies, an interactive p5.js generative hero, and an embedded resume — organized around an [eight-organ creative system](https://github.com/meta-organvm) spanning 91 repositories and 8 GitHub organizations.

**Live:** [4444j99.github.io/portfolio](https://4444j99.github.io/portfolio/)

![Portfolio Preview](public/images/portfolio-preview.png)

## Tech Stack

- **Framework:** [Astro](https://astro.build/) — static site generation with zero JS by default
- **Interactive:** [p5.js](https://p5js.org/) — generative art hero visualization
- **Visualizations:** [D3.js](https://d3js.org/) — 8 interactive data charts
- **Typography:** Jost + JetBrains Mono (self-hosted woff2)
- **Deployment:** GitHub Pages via GitHub Actions
- **Theme:** Dark (`#0a0a0b`) with cyan (`#00BCD4`) / magenta (`#E91E63`) accents

## Quality Infrastructure

Every push runs automated quality gates via [GitHub Actions](.github/workflows/quality.yml):

| Gate | Tool | Threshold |
|------|------|-----------|
| Unit & integration tests | [Vitest](https://vitest.dev/) | All pass |
| Accessibility audit | [axe-core](https://github.com/dequelabs/axe-core) | Zero critical/serious (31 pages) |
| Performance budgets | [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) | Perf ≥ 85, A11y ≥ 90, SEO ≥ 90 |
| HTML validation | [html-validate](https://html-validate.org/) | Zero errors |
| Link checking | Custom script | All internal links valid |

```bash
npm run test              # Unit + integration tests (vitest)
npm run test:coverage     # Coverage report (V8)
npm run test:a11y         # Accessibility audit (axe-core on all pages)
npm run validate          # HTML validation + internal link check
npm run lighthouse        # Lighthouse CI performance budgets
npm run test:ci           # All quality gates chained
```

## Structure

```
src/
├── components/       # Header, Footer, ProjectCard, SketchContainer, charts/
├── layouts/          # Base Layout with SEO/Schema.org
├── pages/
│   ├── index.astro        # Landing — organ-grouped project grid
│   ├── about.astro        # Professional bio + artist statement
│   ├── resume.astro       # Full resume with print CSS
│   ├── dashboard.astro    # System metrics, data viz, quality gates
│   ├── essays.astro       # Technical writing collection
│   ├── gallery.astro      # Generative art gallery (29 sketches)
│   ├── architecture.astro # System architecture overview
│   ├── community.astro    # Community & collaboration
│   ├── consult.astro      # Consulting services
│   ├── products.astro     # Products showcase
│   ├── 404.astro          # Custom 404 page
│   └── projects/          # 20 individual project pages
├── data/                  # JSON data + TypeScript types
├── scripts/               # Build scripts (OG images, a11y audit, validation)
└── styles/                # Global CSS design system
```

## Local Development

```bash
npm install
npm run dev          # http://localhost:4321/portfolio/
npm run build        # Build to ./dist/
npm run preview      # Preview production build
```

## License

[MIT](LICENSE)
