# Next: Skip-to-Content Link + Prefetch

## Context

After the sitemap/README housekeeping, a thorough audit found the site in excellent shape — strong SEO, ARIA, keyboard nav, reduced-motion support, no dead code, no outdated deps, no CI issues. Two actionable items remain:

1. **Missing skip-to-content link** — WCAG 2.1 AA requires a mechanism to bypass repeated navigation. Every page has a `<main>` element but no skip link targets it.
2. **No prefetch** — Astro has built-in link prefetching (hover/viewport-based) that speeds up multi-page navigation with zero config. Not currently enabled.

---

## Task 1: Add skip-to-content link

### Files to modify
- `src/layouts/Layout.astro` — add skip link before `<slot />`
- `src/styles/global.css` — add `.skip-to-content` visually-hidden styles
- All 30 pages in `src/pages/` — add `id="main-content"` to each `<main>` tag

### Approach

**Layout.astro** — add skip link as first child of `<body>`, before `<div id="bg-canvas">`:
```html
<a href="#main-content" class="skip-to-content">Skip to main content</a>
```

**global.css** — standard skip-link pattern (visually hidden, appears on focus):
```css
.skip-to-content {
  position: absolute;
  left: -9999px;
  z-index: 999;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 2px solid var(--text-primary);
  text-decoration: none;
  font-weight: 600;
}
.skip-to-content:focus {
  left: var(--space-md);
  top: var(--space-md);
}
```

**All pages** — find-and-replace `<main>` → `<main id="main-content">` across all 30 page files (10 top-level + 20 project pages).

---

## Task 2: Enable Astro prefetch

### File to modify
- `astro.config.mjs` — add `prefetch: true`

### Approach

Astro's built-in prefetch (since v3.5) preloads linked pages on hover, making navigation feel near-instant. Single config line:

```js
export default defineConfig({
  site: 'https://4444j99.github.io',
  base: '/portfolio',
  prefetch: true,
  // ...rest
});
```

Default strategy is `hover` — prefetches when user hovers a link. No bundle size impact (uses native `<link rel="prefetch">`).

---

## Verification

1. `npm run build` — confirm clean build
2. Tab through the site in dev mode — skip link should appear on first Tab press and jump past the header
3. Check that navigation between pages triggers prefetch (Network tab shows prefetch requests on hover)
