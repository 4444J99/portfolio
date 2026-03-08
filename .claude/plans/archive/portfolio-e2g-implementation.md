# Portfolio E2G Implementation Plan

> Evaluation-to-Growth findings → concrete implementation tasks
> Prioritized by impact and ordered by dependency

---

## Tier 1: Critical Impact (Address First)

### 1. Page Entrance Animations & Scroll Reveals
**Why:** The #1 gap between site ambition and execution. 32 generative sketches prove motion mastery, but page content is static.

**Implementation:**
- Add CSS `@keyframes` for fade-up entrance (opacity 0→1, translateY 20px→0)
- Use `IntersectionObserver` (single `is:inline` script in Layout.astro) to trigger `.revealed` class on elements with `data-reveal` attribute
- Apply staggered `animation-delay` (50ms increments) to hero text elements, stat cards, project cards, organ group headings
- Add `data-reveal` to: `.hero__label`, `.hero__title`, `.hero__sub`, `.hero__available`, `.card`, `.stat`, `.organ-group__heading`
- Respect `prefers-reduced-motion: reduce` — no animation, instant reveal

**Files:** `src/styles/global.css`, `src/layouts/Layout.astro` (add observer script), component files for `data-reveal` attributes

**Effort:** ~2-3 hours

---

### 2. Visual Hierarchy for Project Cards
**Why:** 20 identical gray cards create monotony. Flagship projects deserve visual weight.

**Implementation:**
- Add `featured` boolean prop to `ProjectCard.astro`
- Featured cards: span 2 grid columns, get a colored left border (organ accent color), larger title size, bolder background
- Pass organ accent color via CSS variable (`--organ-color`) from the organ group to child cards
- Define organ colors in `index.astro` frontmatter (reuse dashboard's `organColors` map)
- Apply `--organ-color` as left-border or top-border accent on cards within each organ group

**Files:** `src/components/ProjectCard.astro`, `src/pages/index.astro`, `src/styles/global.css`

**Effort:** ~2 hours

---

### 3. Add Visual Evidence to Project Pages
**Why:** The site is 100% text description with zero visual proof. Most critical credibility gap.

**Options (user decision):**
- **Option A — Screenshots/Architecture Diagrams:** Add a `public/images/projects/` folder with 1-2 images per project. Use `<Figure>` component to embed them.
- **Option B — GitHub Badges:** Embed CI status badges, coverage badges, language breakdowns from GitHub Shields API. Lightweight, auto-updating, verifiable.
- **Option C — Both** (recommended): Lead with a hero image or architecture diagram, add GitHub badges in a "Status" bar.

**Files:** `src/components/ProjectDetail.astro` (add image/badge slot), individual project pages, `public/images/`

**Effort:** ~4 hours for implementation + time sourcing images

---

### 4. Surface the S/B/E Toggle
**Why:** The site's most innovative UX feature is invisible in the footer.

**Implementation:**
- Add a compact S/B/E toggle to the Header (right side, near nav links)
- Three small circular buttons (S/B/E) with a subtle indicator for active state
- Remove or simplify the footer toggle (or keep as secondary)
- On mobile: include in hamburger menu

**Files:** `src/components/Header.astro`, `src/styles/global.css`

**Effort:** ~1 hour

---

## Tier 2: High Impact

### 5. Fix Homepage Data Sourcing
**Why:** Stats are hardcoded while dashboard uses JSON. Maintenance drift risk.

**Implementation:**
- Import `system-metrics.json` in `index.astro` frontmatter
- Replace hardcoded stat values with `metrics.code_substance.total_code_files.toLocaleString()`, etc.
- Remove duplicated data from frontmatter organGroups (or better: import from a shared data file)

**Files:** `src/pages/index.astro`

**Effort:** ~30 minutes

---

### 6. Fix Hero Toggle → Full Experience Differentiation
**Why:** Toggle creates expectation of two views but only swaps hero text + stats.

**Options (user decision):**
- **Option A — Remove toggle:** Serve one unified narrative. Simplify.
- **Option B — Deepen toggle:** Engineering view reorders by skills, hides organ names, shows tech stack per card. Creative view shows organ narrative, hides skill filters, leads with artistic vision.
- **Option C — Separate landing pages:** `/portfolio/` (creative) and `/portfolio/engineering/` (technical). Different card ordering, different hero, shared components.

**Files:** `src/pages/index.astro`, potentially new page

**Effort:** Option A: 30 min. Option B: 3-4 hours. Option C: 4-5 hours.

---

### 7. Fix ProjectDetail.astro Base Path Regex
**Why:** The regex `/\/\?$/` doesn't match trailing slash correctly — it matches `/` + optional `?`.

**Fix:** Change line 12 from:
```js
const base = import.meta.env.BASE_URL.replace(/\/\?$/, '/');
```
to:
```js
const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
```

**Files:** `src/components/ProjectDetail.astro`

**Effort:** 1 minute

---

### 8. Sketch Lazy Loading
**Why:** 32 p5.js sketches + background canvas on every page. No lazy loading means potential performance issues on low-end devices.

**Implementation:**
- Modify `sketch-loader.ts` to use `IntersectionObserver` before initializing sketch instances
- Only create p5 instance when sketch container enters viewport
- Add a placeholder/loading state (subtle gradient animation) before sketch loads
- Consider `requestIdleCallback` for non-visible sketches

**Files:** `src/components/sketches/sketch-loader.ts`

**Effort:** ~2 hours

---

## Tier 3: Polish & Enhancement

### 9. Express the Full Color Palette
**Why:** Five accent colors defined, only cyan used. Per-organ coloring would reinforce the organ metaphor visually.

**Implementation:**
- Assign each organ a signature accent from the existing palette
- Apply as card border, heading accent, or tag background within organ groups
- Use CSS variables scoped to organ group containers (e.g., `style="--organ-accent: var(--accent-purple)"`)

**Files:** `src/pages/index.astro`, `src/styles/global.css`

**Effort:** ~1 hour

---

### 10. Generative Art Gallery Page
**Why:** 32 sketches is itself a portfolio piece. Currently only accessible embedded in project pages.

**Implementation:**
- New page: `src/pages/gallery.astro`
- Grid of SketchContainers with labels, one per sketch
- Filterable by sketch type or organ
- Link from nav

**Files:** New `src/pages/gallery.astro`, `src/components/Header.astro` (nav link)

**Effort:** ~3 hours

---

### 11. Dashboard D3 Visualizations
**Why:** D3 is a dependency. Dashboard has stat grids but no charts.

**Implementation:**
- Add a repo-per-organ bar chart (horizontal, D3)
- Add a test-distribution pie/donut chart
- Add a sprint timeline as a proper D3 timeline (replacing the current flex layout)
- Interactive: hover to see details

**Files:** New chart components in `src/components/charts/`, `src/pages/dashboard.astro`

**Effort:** ~4-6 hours

---

### 12. OG Images & Social Sharing
**Why:** No project-specific social previews. Sharing a project link shows generic metadata.

**Implementation:**
- Generate OG images per page (use Satori or static images)
- Add `og:image` meta tags in Layout.astro, parameterized per page

**Files:** `src/layouts/Layout.astro`, `public/og/` directory

**Effort:** ~3 hours

---

## Quick Wins (< 30 min each)

- [ ] Add credentials to homepage hero ("MFA, Meta Full-Stack, Google UX/PM" as small badge row)
- [ ] Add "17.5M+ views, $2M raised" to About page or homepage hero
- [ ] Add GitHub profile link badge to header
- [ ] Smooth transition when toggling S/B/E modes (add `transition: filter 0.8s ease` to body mode change)
- [ ] Add `rel="me"` to all social links for IndieWeb verification
- [ ] Add `<meta name="theme-color">` that changes per S/B/E mode

---

## Dependency Graph

```
Tier 1.7 (regex fix) → independent, do first
Tier 1.1 (entrance animations) → independent, foundational
Tier 1.4 (surface toggle) → independent
Tier 1.2 (card hierarchy) → benefits from 9 (color palette)
Tier 1.3 (visual evidence) → independent, requires sourcing images
Tier 2.5 (data sourcing) → independent
Tier 2.6 (hero toggle) → decision needed before implementation
Tier 2.8 (lazy loading) → independent
Tier 3.9 (colors) → feeds into 1.2
Tier 3.10 (gallery) → independent
Tier 3.11 (D3 dashboard) → independent
Tier 3.12 (OG images) → benefits from 1.3
```

---

## Summary

| Finding | Status | Priority |
|---------|--------|----------|
| Static page content (no animations) | Not implemented | Critical |
| Identical project cards | Not addressed | Critical |
| Zero visual evidence | Not addressed | Critical |
| S/B/E toggle buried in footer | UX issue | Critical |
| Hardcoded homepage stats | Bug | High |
| Hero toggle under-delivers | Design gap | High |
| ProjectDetail regex bug | Bug | High |
| Sketch lazy loading | Performance | High |
| Color palette underused | Polish | Medium |
| No generative art gallery | Enhancement | Medium |
| No D3 visualizations on dashboard | Enhancement | Medium |
| No OG images | SEO | Medium |
