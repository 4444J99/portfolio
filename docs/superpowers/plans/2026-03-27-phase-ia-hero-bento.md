# Phase Ia: Hero Bento Grid — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 5-screenful vertical homepage with a 2-screenful bento grid. Phase Ia ships the above-fold hero cell, stat pills, controls cell, and 2 featured project cards.

**Architecture:** Purpose-built bento cell components replace existing full-width sections. No existing component is "jammed into" a grid cell — each cell is designed for the grid. The existing `data-portfolio-view` toggle mechanism is preserved. The current `index.astro`, `HeroSection.astro`, and stat grid are replaced; `ProjectGrid`, `PersonaCards`, and `ConsultCTA` are preserved below the bento grid for Phase Ib migration.

**Tech Stack:** Astro 5, CSS Grid (explicit column counts), existing design tokens from `global.css`, data from `vitals.json`

**Spec:** `docs/superpowers/specs/2026-03-26-alpha-omega-roadmap-design.md` (Phase I section)

**Prior art warning:** Two previous bento grid attempts failed and were reverted. Root cause: wrapping full-width components in grid cells. This plan creates NEW purpose-built components. Nothing is wrapped.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/home/BentoGrid.astro` | **CREATE** | Grid container with responsive column layout |
| `src/components/home/HeroBentoCell.astro` | **CREATE** | Name, title, stat pills, available badge |
| `src/components/home/ControlsBentoCell.astro` | **CREATE** | View toggle + depth control |
| `src/components/home/FeaturedBentoCard.astro` | **CREATE** | Featured project card (single-face, no flip) |
| `src/components/home/StatPill.astro` | **CREATE** | Compact metric display (number + label) |
| `src/pages/index.astro` | **MODIFY** | Replace hero + home-pair sections with bento grid |
| `src/styles/global.css` | **MODIFY** | Add bento grid tokens and responsive rules |
| `src/__tests__/bento-grid.test.ts` | **CREATE** | Unit tests for bento grid rendering |

**Preserved (not touched in Phase Ia):**
- `src/components/home/IndexFilters.astro` — stays below bento grid
- `src/components/home/ProjectGrid.astro` — stays below bento grid
- `src/components/home/PersonaCards.astro` — migrates in Phase Ib
- `src/components/home/ConsultCTA.astro` — migrates in Phase Ib
- `src/components/ProjectCard.astro` — flip card preserved for ProjectGrid

---

## Task 0: Pre-Flight Data Fixes

**Files:**
- Modify: `scripts/sync-vitals.mjs` (fix .mdx glob for essay count)
- Run: `npm run sync:vitals`

- [ ] **Step 1: Fix essay count in sync-vitals.mjs**

The script counts `.md` files but essays were renamed to `.mdx`. Update the glob pattern to `**/*.{md,mdx}`. Also: `automated_tests` counts test FILES (53), not test CASES (527). For stat pills, use the test case count from the vitest output or hardcode `527+` with a comment.

- [ ] **Step 2: Run sync and verify**

Run: `npm run sync:vitals && node -e "console.log(JSON.parse(require('fs').readFileSync('src/data/vitals.json','utf8')).logos.essays)"`
Expected: `49` (not `0`).

- [ ] **Step 3: Commit**

```bash
git add scripts/sync-vitals.mjs src/data/vitals.json src/data/trust-vitals.json src/data/landing.json
git commit -m "fix(data): count .mdx essays in sync-vitals, refresh vitals"
```

---

## Task 1: Add Bento Grid CSS Tokens

**Files:**
- Modify: `src/styles/global.css` (append after shibui section, before `html { font-size: 16px }`)

- [ ] **Step 1: Add bento grid CSS rules to global.css**

```css
/* --- Bento Grid Layout --- */
.bento-grid {
	display: grid;
	gap: var(--space-md);
	max-width: var(--max-width);
	margin: 0 auto;
	padding: var(--space-lg);
	grid-template-columns: 1fr;
}

@media (min-width: 768px) {
	.bento-grid {
		grid-template-columns: repeat(2, 1fr);
	}
}

@media (min-width: 1024px) {
	.bento-grid {
		grid-template-columns: repeat(4, 1fr);
	}
}

/* Cell span utilities */
.bento-cell--span-2 { grid-column: span 2; }
.bento-cell--span-3 { grid-column: span 3; }
.bento-cell--span-full { grid-column: 1 / -1; }
.bento-cell--row-2 { grid-row: span 2; }

@media (max-width: 767px) {
	.bento-cell--span-2,
	.bento-cell--span-3,
	.bento-cell--span-full {
		grid-column: span 1;
	}
	.bento-cell--row-2 {
		grid-row: span 1;
	}
}

/* Base bento cell styling */
.bento-cell {
	background: var(--bg-card);
	border: 1px solid var(--border);
	border-radius: var(--radius-lg);
	padding: var(--space-lg);
	transition:
		border-color var(--transition-fast),
		background var(--transition-fast);
}

.bento-cell:hover {
	border-color: var(--border-hover, rgba(255, 255, 255, 0.15));
}

/* Clickable bento cell (project cards) */
a.bento-cell {
	text-decoration: none;
	color: inherit;
	display: block;
}

a.bento-cell:hover {
	background: color-mix(in srgb, var(--bg-card) 90%, var(--accent) 10%);
	border-color: color-mix(in srgb, var(--accent) 30%, transparent);
}

a.bento-cell:focus-visible {
	outline: 2px solid var(--accent);
	outline-offset: 2px;
}

/* Hero cell — no card styling, transparent bg */
.bento-cell--hero {
	background: transparent;
	border: none;
	padding: var(--space-xl) var(--space-lg);
}

/* Stat pill row */
.stat-pills {
	display: flex;
	flex-wrap: wrap;
	gap: var(--space-xs);
	margin-top: var(--space-md);
}

.stat-pill {
	display: inline-flex;
	align-items: baseline;
	gap: var(--space-2xs);
	font-family: var(--font-mono);
	font-size: 0.8rem;
	color: var(--text-secondary);
	background: color-mix(in srgb, var(--accent) 8%, transparent);
	border: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
	border-radius: var(--radius-sm);
	padding: var(--space-2xs) var(--space-sm);
}

.stat-pill__value {
	color: var(--accent);
	font-weight: 600;
}

/* Featured card organ border */
.bento-card--featured {
	border-left: 3px solid var(--organ-color, var(--accent));
}
```

- [ ] **Step 2: Verify no CSS conflicts**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "feat(bento): add bento grid CSS tokens and responsive rules"
```

---

## Task 2: Create StatPill Component

**Files:**
- Create: `src/components/home/StatPill.astro`

- [ ] **Step 1: Create StatPill component**

```astro
---
// src/components/home/StatPill.astro
// Compact metric display: value + label in a pill.

interface Props {
	value: string;
	label: string;
}

const { value, label } = Astro.props;
---

<span class="stat-pill">
	<span class="stat-pill__value">{value}</span>
	<span class="stat-pill__label">{label}</span>
</span>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/StatPill.astro
git commit -m "feat(bento): create StatPill component"
```

---

## Task 3: Create HeroBentoCell Component

**Files:**
- Create: `src/components/home/HeroBentoCell.astro`
- Reference: `src/components/home/HeroSection.astro` (for data patterns, NOT to wrap)
- Reference: `src/data/vitals.json` (for stat values)

- [ ] **Step 1: Create HeroBentoCell**

This replaces the HeroSection's text content as a bento cell. No canvas, no split grid. Pure text + stats.

```astro
---
// src/components/home/HeroBentoCell.astro
// Above-fold hero: name, title, proof metrics, available badge.
// Dual-view aware via data-hero-view attributes.

import StatPill from './StatPill.astro';
import { SKETCH_NAMES } from '@4444j99/sketches';
import vitals from '../../data/vitals.json';
import { base } from '../../utils/paths';

const wordsK = Math.floor(vitals.logos.words / 1000);
const sketchCount = SKETCH_NAMES.length;
---

<div class="bento-cell bento-cell--hero bento-cell--span-3">
	<p class="hero-bento__available">
		<span class="hero-bento__pulse" aria-hidden="true"></span>
		Available for work
	</p>

	<h1 class="hero-bento__name">Anthony James Padavano</h1>

	<p class="hero-bento__title" data-hero-view="engineering">
		AI Orchestration Architect
	</p>
	<p class="hero-bento__title" data-hero-view="creative">
		Creative Systems Designer
	</p>

	<p class="hero-bento__subtitle" data-hero-view="engineering">
		I design AI systems that manage themselves — building the infrastructure that lets teams scale without scaling headcount.
	</p>
	<p class="hero-bento__subtitle" data-hero-view="creative">
		I build creative infrastructure where governance is the art — treating organizational design as an aesthetic medium.
	</p>

	<div class="stat-pills" data-stats-view="engineering">
		<StatPill value={String(vitals.repos.total)} label="Repos" />
		<StatPill value={`${vitals.substance.automated_tests.toLocaleString()}+`} label="Tests" />
		<StatPill value={`${vitals.substance.ci_coverage_pct}%`} label="Coverage" />
		<StatPill value={String(vitals.substance.ci_passing)} label="CI Passing" />
		<StatPill value="15" label="Years" />
	</div>

	<div class="stat-pills" data-stats-view="creative">
		<StatPill value={`${wordsK}K`} label="Words" />
		<StatPill value={String(vitals.logos.essays)} label="Essays" />
		<StatPill value={String(vitals.repos.orgs)} label="Organs" />
		<StatPill value={String(sketchCount)} label="Sketches" />
		<StatPill value="15" label="Years" />
	</div>

	<div class="hero-bento__actions">
		<a href={`${base}resume/`} class="hero-bento__cta">View Resume</a>
		<a href={`${base}consult/`} class="hero-bento__cta hero-bento__cta--secondary">Start a Conversation</a>
	</div>
</div>

<style>
	.hero-bento__available {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--success);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin-bottom: var(--space-md);
	}

	.hero-bento__pulse {
		width: 8px;
		height: 8px;
		background: var(--success);
		border-radius: 50%;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.4; }
	}

	.hero-bento__name {
		font-family: var(--font-heading);
		font-size: clamp(2rem, 5vw, 3.5rem);
		line-height: 1.05;
		letter-spacing: -0.03em;
		margin-bottom: var(--space-xs);
	}

	.hero-bento__title {
		font-family: var(--font-heading);
		font-size: clamp(1.1rem, 2.5vw, 1.5rem);
		color: var(--accent);
		margin-bottom: var(--space-sm);
	}

	.hero-bento__subtitle {
		font-size: 1.05rem;
		line-height: 1.5;
		color: var(--text-secondary);
		max-width: 600px;
		margin-bottom: var(--space-md);
	}

	.hero-bento__actions {
		display: flex;
		gap: var(--space-sm);
		margin-top: var(--space-lg);
	}

	.hero-bento__cta {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		padding: var(--space-xs) var(--space-md);
		border-radius: var(--radius-sm);
		text-decoration: none;
		transition: all var(--transition-fast);
	}

	.hero-bento__cta:first-child {
		background: var(--accent);
		color: var(--bg-primary);
	}

	.hero-bento__cta:first-child:hover {
		background: var(--accent-hover);
	}

	.hero-bento__cta--secondary {
		border: 1px solid var(--border);
		color: var(--text-secondary);
	}

	.hero-bento__cta--secondary:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	/* Dual-view: hide inactive view elements */
	:global([data-portfolio-view="creative"]) [data-hero-view="engineering"],
	:global([data-portfolio-view="creative"]) [data-stats-view="engineering"] {
		display: none;
	}

	:global([data-portfolio-view="engineering"]) [data-hero-view="creative"],
	:global([data-portfolio-view="engineering"]) [data-stats-view="creative"] {
		display: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.hero-bento__pulse { animation: none; opacity: 1; }
	}
</style>
```

- [ ] **Step 2: Build check**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/HeroBentoCell.astro
git commit -m "feat(bento): create HeroBentoCell with stat pills and dual-view"
```

---

## Task 4: Create ControlsBentoCell Component

**Files:**
- Create: `src/components/home/ControlsBentoCell.astro`
- Reference: `src/components/shibui/DepthControl.astro` (imported, not reimplemented)

- [ ] **Step 1: Create ControlsBentoCell**

```astro
---
// src/components/home/ControlsBentoCell.astro
// Bento cell containing the view toggle and depth control.

import DepthControl from '../shibui/DepthControl.astro';
---

<div class="bento-cell controls-cell">
	<div class="controls-cell__view-toggle">
		<span class="controls-cell__label">View</span>
		<div class="bento-view-toggle" role="radiogroup" aria-label="Portfolio view">
			<button class="bento-view-toggle__btn bento-view-toggle__btn--active" data-bento-view="engineering" role="radio" aria-checked="true">
				Engineering
			</button>
			<button class="bento-view-toggle__btn" data-bento-view="creative" role="radio" aria-checked="false">
				Creative
			</button>
		</div>
	</div>

	<div class="controls-cell__depth">
		<span class="controls-cell__label">Depth</span>
		<DepthControl />
	</div>
</div>

<style>
	.controls-cell {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		justify-content: center;
	}

	.controls-cell__label {
		font-family: var(--font-mono);
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--text-muted);
		display: block;
		margin-bottom: var(--space-2xs);
	}

	.view-toggle {
		display: flex;
		background: var(--bg-primary);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.view-toggle__btn {
		flex: 1;
		padding: var(--space-2xs) var(--space-sm);
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.03em;
		border: none;
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.view-toggle__btn--active {
		background: color-mix(in srgb, var(--accent) 15%, transparent);
		color: var(--accent);
	}

	.view-toggle__btn:hover:not(.view-toggle__btn--active) {
		color: var(--text-secondary);
	}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/ControlsBentoCell.astro
git commit -m "feat(bento): create ControlsBentoCell with view toggle and depth control"
```

---

## Task 5: Create FeaturedBentoCard Component

**Files:**
- Create: `src/components/home/FeaturedBentoCard.astro`
- Reference: `src/components/ProjectCard.astro` (for data shape, NOT to wrap)

- [ ] **Step 1: Create FeaturedBentoCard**

Single-face card. No flip. Click navigates to project page. Pre-wired `transition:name` for Phase II.

```astro
---
// src/components/home/FeaturedBentoCard.astro
// Featured project card for bento grid. Single-face, no flip.
// Click navigates to detail page. transition:name pre-wired for Phase II morph.

import { base } from '../../utils/paths';

interface Props {
	title: string;
	tagline: string;
	slug: string;
	tags: string[];
	skills: string[];
	organ: string;
	organColor: string;
}

const { title, tagline, slug, tags, skills, organ, organColor } = Astro.props;
const href = `${base}projects/${slug}/`;
---

<a
	href={href}
	class="bento-cell bento-cell--span-2 bento-cell--row-2 bento-card--featured"
	style={`--organ-color: ${organColor}`}
	data-skills={skills.join(',')}
	data-tags={tags.join(',')}
>
	<span class="featured-card__organ">{organ}</span>
	<h2 class="featured-card__title" transition:name={`project-${slug}`}>{title}</h2>
	<p class="featured-card__tagline">{tagline}</p>
	<div class="featured-card__tags" data-tags-view="engineering">
		{skills.slice(0, 3).map((s) => <span class="featured-card__tag">{s}</span>)}
	</div>
	<div class="featured-card__tags" data-tags-view="creative">
		{tags.slice(0, 3).map((t) => <span class="featured-card__tag">{t}</span>)}
	</div>
	<span class="featured-card__arrow" aria-hidden="true">→</span>
</a>

<style>
	.featured-card__organ {
		font-family: var(--font-mono);
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--organ-color, var(--accent));
		display: block;
		margin-bottom: var(--space-sm);
	}

	.featured-card__title {
		font-family: var(--font-heading);
		font-size: clamp(1.3rem, 2.5vw, 1.8rem);
		line-height: 1.15;
		letter-spacing: -0.02em;
		margin-bottom: var(--space-sm);
	}

	.featured-card__tagline {
		font-size: 0.95rem;
		line-height: 1.5;
		color: var(--text-secondary);
		margin-bottom: var(--space-lg);
	}

	.featured-card__tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2xs);
		margin-top: auto;
	}

	.featured-card__tag {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		padding: var(--space-2xs) var(--space-xs);
		background: color-mix(in srgb, var(--organ-color, var(--accent)) 10%, transparent);
		border: 1px solid color-mix(in srgb, var(--organ-color, var(--accent)) 20%, transparent);
		border-radius: var(--radius-sm);
		color: var(--text-muted);
	}

	.featured-card__arrow {
		position: absolute;
		bottom: var(--space-lg);
		right: var(--space-lg);
		font-size: 1.5rem;
		color: var(--text-muted);
		transition: transform var(--transition-fast);
	}

	:global(a.bento-cell):hover .featured-card__arrow {
		transform: translateX(4px);
		color: var(--accent);
	}

	/* Position relative for arrow positioning */
	:global(a.bento-cell.bento-card--featured) {
		position: relative;
		display: flex;
		flex-direction: column;
	}

	/* Dual-view tag switching */
	:global([data-portfolio-view="creative"]) [data-tags-view="engineering"] { display: none; }
	:global([data-portfolio-view="engineering"]) [data-tags-view="creative"] { display: none; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/FeaturedBentoCard.astro
git commit -m "feat(bento): create FeaturedBentoCard with organ color and transition:name"
```

---

## Task 6: Create BentoGrid Container

**Files:**
- Create: `src/components/home/BentoGrid.astro`

- [ ] **Step 1: Create BentoGrid wrapper**

```astro
---
// src/components/home/BentoGrid.astro
// Responsive bento grid container. Wraps bento cells.
---

<section class="bento-grid" aria-label="Portfolio overview">
	<slot />
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/BentoGrid.astro
git commit -m "feat(bento): create BentoGrid container component"
```

---

## Task 7: Wire Bento Grid into index.astro

**Files:**
- Modify: `src/pages/index.astro`
- Reference: all new bento components

This is the key integration step. The bento grid replaces the hero section and home-pair stats. The ProjectGrid, PersonaCards, and ConsultCTA remain BELOW the bento grid for now (Phase Ib migrates them).

- [ ] **Step 1: Read current index.astro to understand exact structure**

Run: Read `src/pages/index.astro` — note the import list, the Layout wrapper, the `mainAttrs`, and the section ordering.

- [ ] **Step 2: Update index.astro**

Replace the HeroSection and `.home-pair` stats section with the bento grid. Keep ProjectGrid and everything below it. The concrete structure:

```astro
---
// NEW imports (add alongside existing)
import BentoGrid from '../components/home/BentoGrid.astro';
import ControlsBentoCell from '../components/home/ControlsBentoCell.astro';
import FeaturedBentoCard from '../components/home/FeaturedBentoCard.astro';
import HeroBentoCell from '../components/home/HeroBentoCell.astro';
// REMOVE: import HeroSection from '../components/home/HeroSection.astro';
// KEEP all other existing imports (ProjectGrid, PersonaCards, ConsultCTA, etc.)

// Featured project selection (add after existing organGroups resolution)
const allProjects = resolvedGroups.flatMap((g) =>
	g.projects.map((p) => ({ ...p, organ: g.name, organColor: organColorMap[g.organ] || 'var(--accent)' })),
);
const featured = allProjects.filter((p) => featuredNumbers.has(p.number)).slice(0, 2);
---

{/* REPLACE: HeroSection and .home-pair stats with bento grid */}
<BentoGrid>
	<HeroBentoCell />
	<ControlsBentoCell />
	{featured.map((p) => (
		<FeaturedBentoCard
			title={p.title}
			tagline={p.tagline}
			slug={p.slug}
			tags={p.tags}
			skills={p.skills}
			organ={p.organ}
			organColor={p.organColor}
		/>
	))}
</BentoGrid>

{/* KEEP: Everything from ProjectGrid downward stays unchanged */}
```

Remove the `<HeroSection>` rendering and the `.home-pair` div containing the stat grid. Keep `.home-pair--bottom` (ConsultCTA + contact section).

- [ ] **Step 3: Build and verify**

Run: `npm run build 2>&1 | tail -10`
Expected: 102 pages built, no errors.

- [ ] **Step 4: Dev server visual check**

Run: `npm run dev`
Visit: `http://localhost:4321/portfolio/`
Verify: bento grid renders above the fold with hero, controls, and 2 featured cards. ProjectGrid still renders below.

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(bento): wire hero bento grid into homepage above ProjectGrid"
```

---

## Task 8: Wire View Toggle Client-Side Logic

**Files:**
- Modify: `src/components/home/ControlsBentoCell.astro` (add inline script)
- Reference: `src/components/home/IndexFilters.astro` (for existing toggle logic patterns)

The view toggle in ControlsBentoCell needs client-side JavaScript to:
- Toggle `main[data-portfolio-view]` attribute
- Switch active button styling
- Persist to localStorage
- Coordinate with IndexFilters (which still controls the ProjectGrid below)

- [ ] **Step 1: Add client script to ControlsBentoCell**

Add a `<script>` block (Astro module script, not `is:inline`) that:
- Reads initial view from `main[data-portfolio-view]` (set by IndexFilters on load)
- Binds click handlers to toggle buttons
- On click: updates `main[data-portfolio-view]`, toggles `--active` class, updates `aria-checked`, writes to localStorage
- Does NOT duplicate IndexFilters logic — it sets the same `data-portfolio-view` attribute that IndexFilters reads

- [ ] **Step 2: Test dual-view switching**

Run dev server. Click Engineering → Creative toggle. Verify:
- Hero title changes
- Stat pills switch
- Featured card tags switch
- ProjectGrid below (if still visible) also switches

- [ ] **Step 3: Commit**

```bash
git add src/components/home/ControlsBentoCell.astro
git commit -m "feat(bento): add view toggle client-side logic to ControlsBentoCell"
```

---

## Task 9: Tests

**Files:**
- Create: `src/__tests__/bento-grid.test.ts`

- [ ] **Step 1: Write tests**

Tests should verify:
1. Bento grid renders with correct number of cells
2. Stat pills display correct values from vitals.json
3. Featured cards have correct `transition:name` attributes
4. Dual-view data attributes are present
5. Accessibility: grid has `aria-label`, cards are `<article>` or `<a>` with accessible names

Use the existing test pattern from `src/__tests__/a11y.test.ts` — parse built HTML with happy-dom, run assertions on DOM structure.

- [ ] **Step 2: Run tests**

Run: `npx vitest run src/__tests__/bento-grid.test.ts -c .config/vitest.config.ts`
Expected: All tests pass.

- [ ] **Step 3: Run full test suite**

Run: `npm test`
Expected: 527+ tests pass (new tests add to count).

- [ ] **Step 4: Commit**

```bash
git add src/__tests__/bento-grid.test.ts
git commit -m "test(bento): add bento grid rendering and a11y tests"
```

---

## Task 10: Lint, Build, Preflight

- [ ] **Step 1: Lint fix**

Run: `npm run lint:fix`
Expected: No errors. Biome may autofix formatting.

- [ ] **Step 2: Full build**

Run: `npm run build`
Expected: 102 pages, shibui-lens post-processing, pagefind indexing. No errors.

- [ ] **Step 3: Preflight**

Run: `npm run preflight`
Expected: All tests pass. No regressions.

- [ ] **Step 4: Final commit and push**

```bash
git add -A
git commit -m "feat(bento): Phase Ia complete — hero bento grid with stat pills and featured cards

Replaces the 5-screenful vertical hero with a 2-viewport bento grid:
- HeroBentoCell: name, title, proof metrics (stat pills), available badge
- ControlsBentoCell: view toggle (engineering/creative) + depth control
- FeaturedBentoCard: 2 featured projects with organ color, transition:name pre-wired
- StatPill: compact metric display (number + label)
- BentoGrid: responsive CSS Grid container (4-col desktop, 2-col tablet, 1-col mobile)

Dual-view toggle preserved. ProjectGrid remains below bento for Phase Ib migration.
Hero canvas removed from homepage (global bg-canvas sufficient).
No existing components wrapped — all cells purpose-built.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"

git push origin main
```

---

## Verification Checklist

After all tasks complete, verify:

- [ ] Homepage loads with bento grid above the fold
- [ ] Name, title, and ≥3 stat pills visible without scrolling (1080p desktop)
- [ ] View toggle switches hero title, subtitle, stat pills, and card tags
- [ ] Depth control is visible in the controls cell
- [ ] 2 featured project cards render with organ color border
- [ ] Clicking a featured card navigates to the correct project page
- [ ] Mobile (375px): single column, all cells stack, stat pills scroll horizontally
- [ ] Tablet (768px): 2-column grid, featured cards span full width
- [ ] Desktop (1024px+): 4-column grid, featured cards span 2 columns
- [ ] ProjectGrid still renders below the bento grid (Phase Ib migration pending)
- [ ] All 527+ tests pass
- [ ] Build: 102 pages, no errors
- [ ] Lighthouse performance: no regression from current score
