# Portfolio — Anthony James Padavano

[![Live Site](https://img.shields.io/badge/Live-4444j99.github.io/portfolio-c9a84c?style=flat)](https://4444j99.github.io/portfolio/)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Personal portfolio site showcasing 16 project case studies, an interactive p5.js generative hero, and an embedded resume — organized around an [eight-organ creative system](https://github.com/meta-organvm) spanning 78 repositories and 8 GitHub organizations.

**Live:** [4444j99.github.io/portfolio](https://4444j99.github.io/portfolio/)

![Portfolio Preview](public/images/portfolio-preview.png)

## Tech Stack

- **Framework:** [Astro](https://astro.build/) — static site generation with zero JS by default
- **Interactive:** [p5.js](https://p5js.org/) — generative art hero visualization
- **Typography:** Inter + JetBrains Mono via Google Fonts
- **Deployment:** GitHub Pages via GitHub Actions
- **Theme:** Dark (`#0a0a0b`) with gold accent (`#c9a84c`)

## Structure

```
src/
├── components/       # Header, Footer, ProjectCard, SketchContainer
├── layouts/          # Base Layout with SEO/Schema.org
├── pages/
│   ├── index.astro   # Landing — organ-grouped project grid
│   ├── about.astro   # Professional bio + artist statement
│   ├── resume.astro  # Full resume with print CSS
│   └── projects/     # 16 individual project pages
├── scripts/          # p5.js sketch files
└── styles/           # Global CSS
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
