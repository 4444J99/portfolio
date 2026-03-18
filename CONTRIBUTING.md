# Contributing

Thanks for your interest in contributing to the portfolio project.

## Quick Start

```bash
git clone <your-fork-url>
cd portfolio
npm install
npm run dev          # Dev server → localhost:4321/portfolio/
```

## Before Submitting

```bash
npm run lint         # Biome check (tabs, single quotes, trailing commas)
npm run build        # Full build chain
npm run test         # Vitest unit + integration tests
```

All three must pass before opening a PR.

## Code Style

- **Biome** for formatting (not Prettier/ESLint)
- Tabs, single quotes, trailing commas, line width 100
- BEM naming for CSS classes: `.block`, `.block__element`, `.block--modifier`
- All CSS values from custom properties (`var(--space-lg)`, `var(--accent)`)
- TypeScript strict mode, named exports, async/await

## Good First Issues

Check the [good first issue](https://github.com/4444J99/portfolio/labels/good%20first%20issue) label for beginner-friendly tasks.

## Commit Messages

Imperative mood, conventional prefixes:
- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation
- `chore:` — maintenance
- `refactor:` — restructuring without behavior change
- `test:` — test changes
