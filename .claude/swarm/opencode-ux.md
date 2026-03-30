# OpenCode Task: Depth Control Onboarding UX + Analytics

## Context

The portfolio at `/Users/4jp/Workspace/4444J99/portfolio/` has a content depth system (Shibui) with three modes: Overview (simple), Standard (annotated), Full (academic). The depth control is a gold pill button in the header that cycles through modes. Nobody finds it. The bridge buttons ("This section goes deeper →") are generic and uninformative.

Current implementation:
- Depth control: `src/components/shibui/DepthControl.astro` (button + SVG + label + tooltip)
- CSS: `src/styles/global.css` (lines 125-340, shibui section)
- Restore script: `src/components/scripts/ShibuiRestore.astro` (inline, prevents FOUC)
- Glint animation: `src/components/shibui/ShibuiGlint.astro`
- Layout: `src/layouts/Layout.astro` (includes DepthControl in header)

The site uses: Astro 5, scoped CSS with BEM, CSS custom properties from global.css, dark theme (#0a0a0b background, #d4a853 gold accent).

## File Boundary

ONLY touch files in these paths:
- `src/components/shibui/` (MODIFY — DepthControl, add onboarding component)
- `src/styles/global.css` (MODIFY — shibui CSS section only, lines 125-340)
- `src/layouts/Layout.astro` (MODIFY — add onboarding component inclusion)
- `src/components/scripts/` (MODIFY — add analytics snippet if needed)

DO NOT touch:
- `plugins/` (the rhetoric engine, the lens)
- `packages/`
- `.github/workflows/`
- `src/pages/` (any page content)
- `src/data/`
- `astro.config.mjs`
- Test files

## Task 1: First-Visit Onboarding Panel

Create `src/components/shibui/ShibuiOnboarding.astro`:

A dismissible overlay panel that appears on first visit (no localStorage preference set). Shows three cards explaining the depth modes. After choosing, saves preference to localStorage and dismisses.

Design:
- Centered modal overlay with backdrop blur
- Dark background (#181818) with gold border
- Three cards side by side (stack vertically on mobile)
- Each card: mode name, concentric rings icon (1/2/3 rings), 2-sentence description, "Choose" button
- Choosing a mode: sets `data-shibui-depth` on `<html>`, saves to localStorage, dismisses panel
- Panel uses `is:inline` script (must run before paint)
- Animate in: fade + scale from 0.95
- Respect `prefers-reduced-motion`

The panel title and card copy will come from Gemini's output — for now use placeholder text:
- Title: "Choose your reading depth"
- Overview: "Simple and clear. For quick browsing."
- Standard: "Full text with highlighted concepts. For curious readers."
- Full: "Everything, unfiltered. For specialists."

Include the component in `Layout.astro` alongside `ShibuiRestore`.

### localStorage Check

Only show if `localStorage.getItem('shibui-depth')` returns null. After first choice, never show again.

## Task 2: Contextual Bridge Buttons

Currently bridge buttons are `<button class="shibui-bridge">This section goes deeper →</button>` hardcoded in every .astro page.

Add a `data-shibui-bridge-label` attribute to each bridge button that the CSS/JS can use for contextual copy. For now, update the CSS to style the buttons more prominently:

- Show a faded preview of the first line of elevated text below the button (CSS `::after` pseudo-element reading from the next sibling's content, or JS-injected)
- Add a subtle arrow animation on hover
- Increase padding and visual weight

## Task 3: Plausible Analytics

Add a Plausible analytics snippet to `Layout.astro`:

```html
<script defer data-domain="4444j99.github.io" src="https://plausible.io/js/script.js"></script>
```

Also add custom event tracking for depth control interactions:

```js
// In DepthControl.astro script
plausible('Depth Change', { props: { from: currentDepth, to: newDepth } });
```

And bridge button clicks:

```js
// In DepthControl.astro bridge init
plausible('Bridge Click', { props: { section: content.dataset.unitId } });
```

Use `window.plausible` with a guard: `if (typeof plausible !== 'undefined')`.

## CSS Custom Properties Available

```
--bg-primary: #0a0a0b
--bg-card: #181818
--border: #2a2a2a
--text-primary: #fff
--text-secondary: #b0b0b0
--text-muted: #707070
--accent: #d4a853
--accent-hover: #c4463a
--font-heading: Syne
--font-body: Plus Jakarta Sans
--font-mono: JetBrains Mono
--space-xs through --space-4xl
--radius-sm: 0.25rem, --radius-md: 0.5rem, --radius-lg: 1rem
--transition-fast: 150ms, --transition-base: 250ms
--z-modal: 1000
```

## Verification

```bash
npm run build   # Must build 102 pages without errors
npm test        # Must pass 526 tests (don't add new tests, don't break existing)
npm run validate  # Links must still be valid
```
