# Plan: Replace CSS Background with Dynamic p5.js Spectrum Sketch

## Context

After several iterations (swatch grid, spiral PNG, conic gradient), the CSS-based background approaches all had issues — white edges, inflexible animation, and static patterns. The user wants a **p5.js sketch** as the full-screen background that:
- Shows **one dominant color at a time**, slowly shifting through the spectrum
- Is **dynamic and ever-changing** (generative, not a fixed image/gradient)
- Has a **lo-fi / pixelated** aesthetic
- **Never shows white** in the background

The portfolio already has 29 p5.js sketches loaded via `sketch-loader.ts` with lazy IntersectionObserver init. The spectrum colors exist in `PALETTE.spectrum` (13 RGB stops). This plan adds a 30th sketch that renders as a full-viewport background.

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/components/sketches/background-sketch.ts` | **CREATE** | The p5.js background sketch (36×24 pixel canvas, Perlin noise color field) |
| `src/components/sketches/sketch-loader.ts` | **MODIFY** | Register `'background'` module + add eager-init path for `#bg-canvas` |
| `src/layouts/Layout.astro` | **MODIFY** | Add `<div id="bg-canvas">` before `<slot />` |
| `src/styles/global.css` | **MODIFY** | Remove `body::before` spiral, add `#bg-canvas` styles + pixelated canvas + S/B/E filters |

**No changes needed** to `palette.ts` — `PALETTE.spectrum` already has the 13 colors.

---

## Change 1: Create `background-sketch.ts`

**New file**: `src/components/sketches/background-sketch.ts`

Core design:
- **36×24 pixel canvas** — renders at this tiny resolution, CSS `image-rendering: pixelated` scales up to viewport (each pixel ≈ 40px block on a 1440px screen)
- **Perlin noise color field**: `p.noise(x * SCALE, y * SCALE, frameCount * TIME_SCALE)` produces coherent organic variation
- **Color cycling**: `colorT` advances slowly through the 13 spectrum stops. Full cycle ≈ 2.5 minutes
- **Dominant color**: noise offset is small (±0.15 of spectrum range), so ~80% of pixels show the current color, ~20% show neighbors
- **`p.pixelDensity(1)`** prevents Retina doubling; **`p.noSmooth()`** disables antialiasing
- Direct pixel manipulation via `p.loadPixels()` / `p.updatePixels()` for maximum performance
- `canvas.style('width', '100%'); canvas.style('height', '100%')` makes the tiny canvas fill the container
- **No `windowResized` needed** — the canvas stays 36×24, CSS handles scaling

Performance: 864 pixels × 24fps = trivial. No GPU pressure.

## Change 2: Modify `sketch-loader.ts`

Two additions:

**a)** Add to the `sketchModules` registry:
```typescript
'background': () => import('./background-sketch'),
```

**b)** Add eager-init function for `#bg-canvas` (not IntersectionObserver — it's always visible):
```typescript
function initBackground() {
  const bg = document.getElementById('bg-canvas');
  if (!bg || initialized.has(bg)) return;
  initialized.add(bg);
  // ... same Promise.all([import('p5'), loader()]) pattern
  // ... same prefersReducedMotion warmup-then-freeze pattern
}
```

**c)** Restructure bottom init block to call `initBackground()` via `requestIdleCallback` (defers to avoid blocking LCP), then `observeSketches()` for content sketches.

## Change 3: Modify `Layout.astro`

Add background container div as first child of `<body>`:
```html
<body data-bg-mode="subtle">
  <div id="bg-canvas" aria-hidden="true"></div>
  <slot />
</body>
```
- `aria-hidden="true"` — decorative, screen readers skip it
- `data-bg-mode="subtle"` already exists on body

## Change 4: Modify `global.css`

**Remove** the entire `body::before` block (lines 80–115):
- The spiral PNG data URI, `image-rendering`, `filter: blur(40px)`, `@keyframes color-drift` — all gone

**Remove** `background: #111` from `html` rule (line 68)

**Add** `#bg-canvas` positioning and pixelation styles:
```css
html { background: #0a0a0b; }  /* dark fallback while p5 loads */

#bg-canvas {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
  transition: filter 0.5s ease;
}
#bg-canvas canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}
```

**Update** S/B/E filter selectors from `body[data-bg-mode]::before` to `body[data-bg-mode] #bg-canvas`:
```css
body[data-bg-mode="subtle"] #bg-canvas { filter: saturate(0.35) brightness(1.4); }
body[data-bg-mode="bold"] #bg-canvas { /* no filter — full colors */ }
body[data-bg-mode="extreme"] #bg-canvas { filter: saturate(1.6) contrast(1.15); }
```

These are the **same filter values** already in use — just retargeted from `::before` to `#bg-canvas`.

**Keep** the `prefers-reduced-motion` rule but retarget:
```css
@media (prefers-reduced-motion: reduce) {
  #bg-canvas canvas { animation: none !important; }
}
```

---

## Push Strategy

All 4 file operations via `gh api repos/4444J99/portfolio/contents/PATH --method PUT --input -`:
1. Create `background-sketch.ts` (no SHA needed — new file)
2. Modify `sketch-loader.ts` (fetch current SHA first)
3. Modify `Layout.astro` (fetch current SHA first)
4. Modify `global.css` (fetch current SHA first)

Steps 2–4 must deploy together for the background to render. Step 1 can go first.

## Verification

1. Wait for GitHub Pages deploy (~2 min)
2. Homepage loads with dark fallback, then p5 canvas appears with one dominant spectrum color
3. Color slowly shifts over ~12 seconds per stop
4. Perlin noise creates organic, ever-changing pixel patterns within the dominant color
5. Each pixel block is visibly chunky (lo-fi aesthetic)
6. No white anywhere — darkest pixels are dimmed spectrum colors, fallback is `#0a0a0b`
7. S/B/E mode toggle still works (if keyboard shortcut `b` exists, or via DevTools `document.body.dataset.bgMode = 'bold'`)
8. Header backdrop blur shows tinted glass effect over the colored canvas
9. `prefers-reduced-motion` freezes the canvas after ~2.5s warmup
