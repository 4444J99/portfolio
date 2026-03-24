# Shibui Content System — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Shibui depth interaction layer on two pilot pages (index hero + about), proving the three-state depth control with dual-layer content and inline annotations.

**Architecture:** An `is:inline` restore script (like ThemeRestore) sets `html[data-shibui-depth]` before first paint. Global CSS rules in `global.css` toggle layer visibility based on that attribute. A `<DepthControl>` component in the header cycles through three states. Content wrappers (`<ShibuiContent>`) hold both entry and elevated layers inline. `<ShibuiTerm>` provides inline annotation tooltips. All state persisted in localStorage with referral-based first-visit heuristic.

**Tech Stack:** Astro 5 components, CSS custom properties, vanilla TypeScript (no framework), localStorage, `astro:page-load` lifecycle.

**Spec:** `docs/superpowers/specs/2026-03-24-shibui-content-system-design.md`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/utils/shibui.ts` | Depth state management, referral heuristic, type exports |
| Create | `src/components/scripts/ShibuiRestore.astro` | Inline script: set `html[data-shibui-depth]` before first paint (FOUC prevention) |
| Create | `src/components/shibui/DepthControl.astro` | Concentric rings icon + click/keyboard cycling |
| Create | `src/components/shibui/ShibuiContent.astro` | Dual-layer content wrapper (entry + elevated) |
| Create | `src/components/shibui/ShibuiTerm.astro` | Inline annotation with tooltip |
| Create | `src/components/shibui/ShibuiGlint.astro` | Glint animation script (once per page) |
| Create | `src/utils/__tests__/shibui.test.ts` | Unit tests for shibui utility |
| Modify | `src/styles/global.css` | Add `--transition-slow`, shibui layer rules, glint keyframes |
| Modify | `src/layouts/Layout.astro` | Add ShibuiRestore + ShibuiGlint to `<body>` |
| Modify | `src/components/Header.astro` | Add DepthControl next to theme toggle |
| Modify | `src/components/home/HeroSection.astro` | Wrap hero text in ShibuiContent with entry variants |
| Modify | `src/pages/about.astro` | Wrap bio + organ map sections in ShibuiContent with entry variants |

---

## Task 1: Shibui Utility Module

**Files:**
- Create: `src/utils/shibui.ts`
- Create: `src/utils/__tests__/shibui.test.ts`

This is the brain of the system — types, state management, referral heuristic. Pure TypeScript, no DOM dependency in the core types (DOM access isolated to specific functions).

- [ ] **Step 1: Write failing tests for depth types and mapping**

```typescript
// src/utils/__tests__/shibui.test.ts
import { describe, it, expect } from 'vitest';
import {
  DEPTH_MAP,
  DEPTH_LABELS,
  type ShibuiDepth,
  depthToFloat,
  floatToDepth,
} from '@/utils/shibui';

describe('shibui depth mapping', () => {
  it('maps depth strings to float values', () => {
    expect(depthToFloat('overview')).toBe(0);
    expect(depthToFloat('standard')).toBe(0.5);
    expect(depthToFloat('full')).toBe(1);
  });

  it('maps float values back to depth strings', () => {
    expect(floatToDepth(0)).toBe('overview');
    expect(floatToDepth(0.5)).toBe('standard');
    expect(floatToDepth(1)).toBe('full');
  });

  it('DEPTH_MAP has exactly three entries', () => {
    expect(Object.keys(DEPTH_MAP)).toHaveLength(3);
  });

  it('DEPTH_LABELS provides human-readable names', () => {
    expect(DEPTH_LABELS.overview).toBe('Overview');
    expect(DEPTH_LABELS.standard).toBe('Standard');
    expect(DEPTH_LABELS.full).toBe('Full Depth');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/__tests__/shibui.test.ts -c .config/vitest.config.ts`
Expected: FAIL — module `@/utils/shibui` does not exist.

- [ ] **Step 3: Implement depth types and mapping**

```typescript
// src/utils/shibui.ts

/** Depth states — the three stops of the Shibui content system. */
export type ShibuiDepth = 'overview' | 'standard' | 'full';

/** String → float canonical mapping. */
export const DEPTH_MAP = {
  overview: 0,
  standard: 0.5,
  full: 1,
} as const satisfies Record<ShibuiDepth, number>;

/** Human-readable labels for each depth state. */
export const DEPTH_LABELS = {
  overview: 'Overview',
  standard: 'Standard',
  full: 'Full Depth',
} as const satisfies Record<ShibuiDepth, string>;

/** Ordered cycle for click-to-advance. */
export const DEPTH_CYCLE: ShibuiDepth[] = ['overview', 'standard', 'full'];

export function depthToFloat(d: ShibuiDepth): number {
  return DEPTH_MAP[d];
}

export function floatToDepth(f: number): ShibuiDepth {
  if (f <= 0.25) return 'overview';
  if (f <= 0.75) return 'standard';
  return 'full';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/__tests__/shibui.test.ts -c .config/vitest.config.ts`
Expected: PASS

- [ ] **Step 5: Write failing tests for cycle, storage functions, and read/write**

```typescript
// append to src/utils/__tests__/shibui.test.ts

import { nextDepth, STORAGE_KEY, readStoredDepth, writeStoredDepth } from '@/utils/shibui';

describe('shibui depth cycling', () => {
  it('cycles overview -> standard -> full -> overview', () => {
    expect(nextDepth('overview')).toBe('standard');
    expect(nextDepth('standard')).toBe('full');
    expect(nextDepth('full')).toBe('overview');
  });
});

describe('shibui storage key', () => {
  it('uses the correct localStorage key', () => {
    expect(STORAGE_KEY).toBe('shibui-depth');
  });
});

describe('shibui localStorage read/write', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when localStorage is empty', () => {
    expect(readStoredDepth()).toBeNull();
  });

  it('returns null when localStorage contains invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not json');
    expect(readStoredDepth()).toBeNull();
  });

  it('returns null when stored depth is not a valid state', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ depth: 'invalid' }));
    expect(readStoredDepth()).toBeNull();
  });

  it('reads a valid stored depth', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ depth: 'standard', version: 1 }));
    expect(readStoredDepth()).toBe('standard');
  });

  it('writeStoredDepth stores the correct JSON shape', () => {
    writeStoredDepth('full');
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.depth).toBe('full');
    expect(stored.version).toBe(1);
    expect(typeof stored.timestamp).toBe('number');
  });

  it('roundtrips through write then read', () => {
    writeStoredDepth('overview');
    expect(readStoredDepth()).toBe('overview');
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/utils/__tests__/shibui.test.ts -c .config/vitest.config.ts`
Expected: FAIL — `nextDepth` and `STORAGE_KEY` not exported.

- [ ] **Step 7: Implement cycle and storage key**

Add to `src/utils/shibui.ts`:

```typescript
export const STORAGE_KEY = 'shibui-depth';

/** Advance to the next depth state in the cycle. */
export function nextDepth(current: ShibuiDepth): ShibuiDepth {
  const idx = DEPTH_CYCLE.indexOf(current);
  return DEPTH_CYCLE[(idx + 1) % DEPTH_CYCLE.length];
}

/** Step depth in a direction (for arrow keys). Clamps at boundaries. */
export function stepDepth(current: ShibuiDepth, direction: 'deeper' | 'shallower'): ShibuiDepth {
  const idx = DEPTH_CYCLE.indexOf(current);
  if (direction === 'deeper') return DEPTH_CYCLE[Math.min(idx + 1, DEPTH_CYCLE.length - 1)];
  return DEPTH_CYCLE[Math.max(idx - 1, 0)];
}

/** Read stored depth from localStorage. Returns null if no preference stored. */
export function readStoredDepth(): ShibuiDepth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.depth && DEPTH_CYCLE.includes(parsed.depth)) {
        return parsed.depth as ShibuiDepth;
      }
    }
  } catch {
    // localStorage unavailable or corrupt — fall through
  }
  return null;
}

/** Write depth preference to localStorage. */
export function writeStoredDepth(depth: ShibuiDepth): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      depth,
      version: 1,
      timestamp: Date.now(),
    }));
  } catch {
    // localStorage unavailable — silently degrade
  }
}

/** Infer initial depth from document.referrer. Best-effort heuristic.
 *  Only called when no stored preference exists (true first visit). */
export function inferInitialDepth(referrer: string): ShibuiDepth {
  if (referrer.includes('github.com')) return 'full';
  if (referrer.includes('linkedin.com')) return 'overview';
  if (referrer.includes('google.com')) return 'standard';
  return 'overview';
}
```

- [ ] **Step 8: Run all shibui tests**

Run: `npx vitest run src/utils/__tests__/shibui.test.ts -c .config/vitest.config.ts`
Expected: PASS

- [ ] **Step 9: Write failing tests for inferInitialDepth**

```typescript
// append to src/utils/__tests__/shibui.test.ts

import { inferInitialDepth } from '@/utils/shibui';

describe('shibui referral heuristic', () => {
  it('returns full for GitHub referrals', () => {
    expect(inferInitialDepth('https://github.com/4444j99/portfolio')).toBe('full');
  });

  it('returns overview for LinkedIn referrals', () => {
    expect(inferInitialDepth('https://www.linkedin.com/in/someone')).toBe('overview');
  });

  it('returns standard for Google referrals', () => {
    expect(inferInitialDepth('https://www.google.com/')).toBe('standard');
  });

  it('returns overview for empty referrer', () => {
    expect(inferInitialDepth('')).toBe('overview');
  });

  it('returns overview for unknown referrers', () => {
    expect(inferInitialDepth('https://news.ycombinator.com/')).toBe('overview');
  });
});
```

- [ ] **Step 10: Run test to verify it passes (already implemented)**

Run: `npx vitest run src/utils/__tests__/shibui.test.ts -c .config/vitest.config.ts`
Expected: PASS (inferInitialDepth already implemented in step 7)

- [ ] **Step 11: Write failing tests for stepDepth**

```typescript
// append to src/utils/__tests__/shibui.test.ts

import { stepDepth } from '@/utils/shibui';

describe('shibui directional stepping', () => {
  it('steps deeper from overview to standard', () => {
    expect(stepDepth('overview', 'deeper')).toBe('standard');
  });

  it('steps deeper from standard to full', () => {
    expect(stepDepth('standard', 'deeper')).toBe('full');
  });

  it('clamps at full when stepping deeper', () => {
    expect(stepDepth('full', 'deeper')).toBe('full');
  });

  it('steps shallower from full to standard', () => {
    expect(stepDepth('full', 'shallower')).toBe('standard');
  });

  it('clamps at overview when stepping shallower', () => {
    expect(stepDepth('overview', 'shallower')).toBe('overview');
  });
});
```

- [ ] **Step 12: Run test to verify it passes**

Run: `npx vitest run src/utils/__tests__/shibui.test.ts -c .config/vitest.config.ts`
Expected: PASS

- [ ] **Step 13: Commit**

```bash
git add src/utils/shibui.ts src/utils/__tests__/shibui.test.ts
git commit -m "feat(shibui): add depth state utility module with types, cycling, storage, and referral heuristic"
```

---

## Task 2: Global CSS — Shibui Layer Rules

**Files:**
- Modify: `src/styles/global.css` (add after `:root` block, ~line 82)

Adds the `--transition-slow` token, shibui layer visibility rules, annotation styling, and glint keyframes. All rules are CSS-only — they activate when `html[data-shibui-depth]` is set by the restore script (Task 3).

- [ ] **Step 1: Add `--transition-slow` token to `:root`**

In `src/styles/global.css`, inside the `:root` block, after line 73 (`--transition-base: 250ms ease;`), add:

```css
	--transition-slow: 400ms ease;

	/* Z-index scale (used by shibui tooltips, dropdowns) */
	--z-dropdown: 100;
```

- [ ] **Step 2: Add shibui layer visibility rules**

After the light theme `:root` override block (after the `}` that closes the light theme rules), add a new section:

```css
/* --- Shibui Content System ---
   Depth-dependent layer visibility.
   Default (no JS / no attribute): elevated text visible (current behavior).
   JS sets html[data-shibui-depth] to activate the layer system.
*/

/* Base: both layers present, elevated visible by default (no-JS fallback) */
.shibui-content__entry {
	display: none;
}

.shibui-content__elevated {
	display: inline;
}

/* Overview: entry visible, elevated hidden */
html[data-shibui-depth="overview"] .shibui-content__entry {
	display: inline;
}

html[data-shibui-depth="overview"] .shibui-content__elevated {
	visibility: hidden;
	height: 0;
	overflow: hidden;
	position: absolute;
}

/* Standard: entry visible, elevated available via local expand */
html[data-shibui-depth="standard"] .shibui-content__entry {
	display: inline;
}

html[data-shibui-depth="standard"] .shibui-content__elevated {
	visibility: hidden;
	height: 0;
	overflow: hidden;
	position: absolute;
}

/* Standard + locally expanded: elevated revealed */
html[data-shibui-depth="standard"] .shibui-content[data-shibui-expanded] .shibui-content__elevated {
	visibility: visible;
	height: auto;
	overflow: visible;
	position: static;
	animation: shibui-reveal var(--transition-slow) ease-in-out;
}

/* Full: elevated visible, entry hidden */
html[data-shibui-depth="full"] .shibui-content__entry {
	display: none;
}

html[data-shibui-depth="full"] .shibui-content__elevated {
	display: inline;
}

/* Reveal animation — palimpsest: rises from below */
@keyframes shibui-reveal {
	from {
		clip-path: inset(100% 0 0 0);
		opacity: 0.6;
	}
	to {
		clip-path: inset(0);
		opacity: 1;
	}
}

/* Shibui term annotations */
.shibui-term {
	position: relative;
	cursor: help;
	border-bottom: 1px dotted var(--accent);
}

.shibui-term__definition {
	display: none;
	position: absolute;
	bottom: calc(100% + 4px);
	left: 50%;
	transform: translateX(-50%) translateY(-4px);
	background: var(--bg-card);
	border: 1px solid var(--border);
	border-radius: var(--radius-sm);
	padding: var(--space-xs) var(--space-sm);
	font-size: 0.85rem;
	color: var(--text-secondary);
	max-width: 300px;
	white-space: normal;
	z-index: var(--z-dropdown);
	opacity: 0;
	pointer-events: none;
}

.shibui-term:hover .shibui-term__definition,
.shibui-term:focus .shibui-term__definition {
	display: block;
	opacity: 1;
	transform: translateX(-50%) translateY(0);
	transition: opacity var(--transition-fast), transform var(--transition-fast);
}

/* Annotation glint — single-pass shimmer on page load */
@keyframes shibui-glint {
	0% {
		background-position: -200% center;
	}
	100% {
		background-position: 200% center;
	}
}

.shibui-term--glint {
	background-image: linear-gradient(
		105deg,
		transparent 40%,
		rgba(212, 168, 83, 0.15) 50%,
		transparent 60%
	);
	background-size: 200% 100%;
	animation: shibui-glint 600ms ease-in-out 1 forwards;
}

/* Reduced motion: kill all shibui animations */
@media (prefers-reduced-motion: reduce) {
	@keyframes shibui-reveal {
		from { opacity: 1; clip-path: inset(0); }
		to { opacity: 1; clip-path: inset(0); }
	}

	.shibui-term--glint {
		animation: none;
		background-image: none;
	}
}

/* Depth control icon */
.depth-control {
	background: none;
	border: none;
	cursor: pointer;
	padding: var(--space-xs);
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--text-muted);
	transition: color var(--transition-fast);
}

.depth-control:hover,
.depth-control:focus-visible {
	color: var(--accent);
}

.depth-control__tooltip {
	display: none;
	position: absolute;
	bottom: calc(100% + 8px);
	left: 50%;
	transform: translateX(-50%);
	background: var(--bg-card);
	border: 1px solid var(--border);
	border-radius: var(--radius-sm);
	padding: var(--space-2xs) var(--space-sm);
	font-size: 0.75rem;
	color: var(--text-secondary);
	white-space: nowrap;
	z-index: var(--z-dropdown);
	pointer-events: none;
}

.depth-control:hover .depth-control__tooltip,
.depth-control:focus-visible .depth-control__tooltip {
	display: block;
}

/* Section depth bridge (Overview mode only) */
.shibui-bridge {
	display: none;
	color: var(--text-muted);
	font-size: 0.85rem;
	cursor: pointer;
	border: none;
	background: none;
	padding: var(--space-xs) 0;
	transition: color var(--transition-fast);
}

.shibui-bridge:hover {
	color: var(--accent);
}

html[data-shibui-depth="overview"] .shibui-bridge,
html[data-shibui-depth="standard"] .shibui-bridge {
	display: block;
}

html[data-shibui-depth="standard"] .shibui-content[data-shibui-expanded] + .shibui-bridge {
	display: none;
}
```

- [ ] **Step 3: Verify CSS parses without errors**

Run: `npm run build 2>&1 | head -30`
Expected: Build succeeds (CSS is valid).

- [ ] **Step 4: Commit**

```bash
git add src/styles/global.css
git commit -m "feat(shibui): add depth layer CSS rules, glint animation, and annotation styles to global.css"
```

---

## Task 3: Shibui Restore Script (FOUC Prevention)

**Files:**
- Create: `src/components/scripts/ShibuiRestore.astro`
- Modify: `src/layouts/Layout.astro`

Follows the exact pattern of `ThemeRestore.astro` — an `is:inline` script that runs before first paint. Sets `html[data-shibui-depth]` from localStorage or referral heuristic.

- [ ] **Step 1: Create ShibuiRestore.astro**

```astro
<!-- src/components/scripts/ShibuiRestore.astro -->
<script is:inline>
  // Shibui depth restore — must be inline to avoid FOUC (runs before first paint).
  // Mirrors ThemeRestore.astro pattern.
  (function() {
    var STORAGE_KEY = 'shibui-depth';
    var VALID = ['overview', 'standard', 'full'];

    function readDepth() {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          var parsed = JSON.parse(raw);
          if (parsed && VALID.indexOf(parsed.depth) !== -1) return parsed.depth;
        }
      } catch(e) {}
      return null;
    }

    function inferFromReferrer() {
      var ref = document.referrer || '';
      if (ref.indexOf('github.com') !== -1) return 'full';
      if (ref.indexOf('linkedin.com') !== -1) return 'overview';
      if (ref.indexOf('google.com') !== -1) return 'standard';
      return 'overview';
    }

    var stored = readDepth();
    var depth = stored || inferFromReferrer();
    document.documentElement.dataset.shibuiDepth = depth;

    // Toggle aria-hidden to match depth (eliminates timing gap before DepthControl init)
    var showEntry = depth !== 'full';
    var entries = document.querySelectorAll('[data-shibui-layer="entry"]');
    var elevateds = document.querySelectorAll('[data-shibui-layer="elevated"]');
    for (var i = 0; i < entries.length; i++) entries[i].setAttribute('aria-hidden', showEntry ? 'false' : 'true');
    for (var j = 0; j < elevateds.length; j++) elevateds[j].setAttribute('aria-hidden', showEntry ? 'true' : 'false');

    // Persist if this was a first visit inference
    if (!stored) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          depth: depth,
          version: 1,
          timestamp: Date.now()
        }));
      } catch(e) {}
    }
  })();
</script>
```

- [ ] **Step 2: Add ShibuiRestore to Layout.astro**

In `src/layouts/Layout.astro`, add the import at the top (after ThemeRestore import, ~line 16):

```astro
import ShibuiRestore from '../components/scripts/ShibuiRestore.astro';
```

Then add `<ShibuiRestore />` immediately after `<ThemeRestore />` (~line 75), so it runs early:

```astro
  <ThemeRestore />
  <ShibuiRestore />
```

- [ ] **Step 3: Verify no FOUC — dev server check**

Run: `npm run dev` and open `http://localhost:4321/portfolio/` in browser.
Expected: Page loads without flash. `<html>` element has `data-shibui-depth="overview"` (first visit, no referrer in dev).

- [ ] **Step 4: Commit**

```bash
git add src/components/scripts/ShibuiRestore.astro src/layouts/Layout.astro
git commit -m "feat(shibui): add ShibuiRestore inline script for FOUC-free depth initialization"
```

---

## Task 4: DepthControl Component

**Files:**
- Create: `src/components/shibui/DepthControl.astro`
- Modify: `src/components/Header.astro`

The concentric rings icon. Three states: outer ring (overview), outer+middle (standard), outer+middle+dot (full). Click cycles forward, arrow keys step directionally. Tooltip on hover shows current state.

- [ ] **Step 1: Create DepthControl.astro**

```astro
---
// src/components/shibui/DepthControl.astro
// Concentric rings depth control — cycles through overview/standard/full.
// Visual: outer ring always visible, middle ring at standard+, inner dot at full.
---

<div class="depth-control-wrap" style="position: relative;">
  <p class="sr-only" aria-live="polite" data-shibui-announce></p>
  <button
    class="depth-control"
    aria-label="Content depth: Overview"
    title="Content depth"
    data-shibui-control
  >
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      {/* Outer ring — always visible */}
      <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.2" class="depth-control__ring depth-control__ring--outer" />
      {/* Middle ring — visible at standard + full */}
      <circle cx="10" cy="10" r="5.5" stroke="currentColor" stroke-width="1.2" class="depth-control__ring depth-control__ring--middle" opacity="0.25" />
      {/* Inner dot — visible at full only */}
      <circle cx="10" cy="10" r="2" fill="currentColor" class="depth-control__ring depth-control__ring--inner" opacity="0.15" />
    </svg>
    <span class="depth-control__tooltip" role="tooltip">Depth: Overview</span>
  </button>
</div>

<script>
  import { nextDepth, stepDepth, readStoredDepth, writeStoredDepth, DEPTH_LABELS, type ShibuiDepth } from '../../utils/shibui';

  function initDepthControl() {
    const btn = document.querySelector<HTMLButtonElement>('[data-shibui-control]');
    if (!btn) return;

    const tooltip = btn.querySelector<HTMLSpanElement>('.depth-control__tooltip');
    const middleRing = btn.querySelector<SVGCircleElement>('.depth-control__ring--middle');
    const innerDot = btn.querySelector<SVGCircleElement>('.depth-control__ring--inner');
    const announce = document.querySelector<HTMLElement>('[data-shibui-announce]');

    function getCurrentDepth(): ShibuiDepth {
      return (document.documentElement.dataset.shibuiDepth as ShibuiDepth) || 'overview';
    }

    function applyDepth(depth: ShibuiDepth) {
      document.documentElement.dataset.shibuiDepth = depth;
      writeStoredDepth(depth);

      // Update visual state of rings
      if (middleRing) middleRing.setAttribute('opacity', depth === 'overview' ? '0.25' : '1');
      if (innerDot) innerDot.setAttribute('opacity', depth === 'full' ? '1' : '0.15');

      // Update ARIA + tooltip + live region announcement
      const label = DEPTH_LABELS[depth];
      btn.setAttribute('aria-label', `Content depth: ${label}`);
      if (tooltip) tooltip.textContent = `Depth: ${label}`;
      if (announce) announce.textContent = `Content depth changed to ${label}`;

      // Toggle aria-hidden on shibui content layers
      document.querySelectorAll<HTMLElement>('.shibui-content__entry').forEach(el => {
        el.setAttribute('aria-hidden', depth === 'full' ? 'true' : 'false');
      });
      document.querySelectorAll<HTMLElement>('.shibui-content__elevated').forEach(el => {
        el.setAttribute('aria-hidden', depth === 'full' ? 'false' : 'true');
      });
    }

    // Initialize visual state from current attribute
    applyDepth(getCurrentDepth());

    btn.addEventListener('click', () => {
      applyDepth(nextDepth(getCurrentDepth()));
    });

    btn.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        applyDepth(stepDepth(getCurrentDepth(), 'deeper'));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        applyDepth(stepDepth(getCurrentDepth(), 'shallower'));
      }
    });
  }

  // Local expand: clicking a bridge button toggles `data-shibui-expanded` on its sibling ShibuiContent
  function initBridgeExpanders() {
    document.querySelectorAll<HTMLButtonElement>('.shibui-bridge').forEach(btn => {
      btn.addEventListener('click', () => {
        const content = btn.previousElementSibling as HTMLElement | null;
        if (content?.classList.contains('shibui-content')) {
          const expanded = content.hasAttribute('data-shibui-expanded');
          if (expanded) {
            content.removeAttribute('data-shibui-expanded');
            btn.textContent = 'This section goes deeper \u2192';
          } else {
            content.setAttribute('data-shibui-expanded', '');
            btn.textContent = 'Show less \u2190';
            // Toggle aria-hidden on the elevated layer
            const elevated = content.querySelector('[data-shibui-layer="elevated"]');
            if (elevated) elevated.setAttribute('aria-hidden', 'false');
          }
        }
      });
    });
  }

  // Initialize on page load and view transitions
  document.addEventListener('astro:page-load', () => {
    initDepthControl();
    initBridgeExpanders();
  });
</script>
```

- [ ] **Step 2: Add DepthControl to Header.astro**

In `src/components/Header.astro`, add the import at the top (after Search import, ~line 3):

```astro
import DepthControl from './shibui/DepthControl.astro';
```

Then add `<DepthControl />` immediately before the theme-toggle button (~line 165), so it sits next to the theme control:

```astro
      <Search />
      <DepthControl />
      <button class="theme-toggle" ...>
```

- [ ] **Step 3: Verify in dev server**

Run: `npm run dev`. Navigate to any page. The concentric rings icon should appear in the header next to the theme toggle. Clicking it should cycle through states and the `html` element's `data-shibui-depth` attribute should update.

- [ ] **Step 4: Commit**

```bash
git add src/components/shibui/DepthControl.astro src/components/Header.astro
git commit -m "feat(shibui): add DepthControl component with concentric rings icon to header"
```

---

## Task 5: ShibuiContent and ShibuiTerm Components

**Files:**
- Create: `src/components/shibui/ShibuiContent.astro`
- Create: `src/components/shibui/ShibuiTerm.astro`

The dual-layer wrapper and inline annotation components. These are the building blocks that page authors use.

- [ ] **Step 1: Create ShibuiContent.astro**

```astro
---
// src/components/shibui/ShibuiContent.astro
// Dual-layer content wrapper. Renders both entry and elevated layers;
// CSS in global.css controls which is visible based on html[data-shibui-depth].

interface Props {
  /** Stable content unit ID, e.g. "about.bio.p1" */
  id: string;
}

const { id } = Astro.props;
---

<div class="shibui-content" data-unit-id={id}>
  <span class="shibui-content__entry" data-shibui-layer="entry" aria-hidden="true">
    <slot name="entry" />
  </span>
  <span class="shibui-content__elevated" data-shibui-layer="elevated">
    <slot name="elevated" />
  </span>
</div>
```

**Note**: Always renders as `<div>` (no dynamic tag — Astro's support for dynamic HTML elements is fragile). The `aria-hidden` defaults show elevated=visible (no-JS fallback). The `ShibuiRestore` inline script toggles `aria-hidden` attributes at the same time it sets the depth attribute, eliminating the timing gap between FOUC-prevention and DepthControl initialization.

- [ ] **Step 2: Create ShibuiTerm.astro**

```astro
---
// src/components/shibui/ShibuiTerm.astro
// Inline annotation for domain-specific terms.
// Renders a dotted-underlined term with a tooltip definition on hover/focus.

interface Props {
  /** The term being annotated (displayed inline) */
  term: string;
  /** Plain-language definition shown in tooltip */
  definition: string;
}

const { term, definition } = Astro.props;
---

<span class="shibui-term" tabindex="0" role="button" aria-expanded="false" aria-describedby={`shibui-def-${term.toLowerCase().replace(/\s+/g, '-')}`}>
  <span class="shibui-term__text">{term}</span>
  <span class="shibui-term__definition" role="tooltip" id={`shibui-def-${term.toLowerCase().replace(/\s+/g, '-')}`}>
    {definition}
  </span>
</span>
```

- [ ] **Step 3: Verify components render without error**

Create a quick smoke test — temporarily add to any page:

```astro
<ShibuiContent id="test.smoke">
  <span slot="entry">Simple version of the text.</span>
  <span slot="elevated">Complex, domain-specific version with <ShibuiTerm term="epistemic engine" definition="A symbolic computing system that processes self-referential structures" /> references.</span>
</ShibuiContent>
```

Run: `npm run dev` — verify both layers render, clicking depth control toggles them.

Remove the smoke test after verification.

- [ ] **Step 4: Commit**

```bash
git add src/components/shibui/ShibuiContent.astro src/components/shibui/ShibuiTerm.astro
git commit -m "feat(shibui): add ShibuiContent dual-layer wrapper and ShibuiTerm annotation components"
```

---

## Task 6: Glint Animation Script

**Files:**
- Create: `src/components/shibui/ShibuiGlint.astro`
- Modify: `src/layouts/Layout.astro`

Triggers the gold glint animation on `.shibui-term` elements once per page. Uses a `Set` to track glinted paths, preventing re-trigger on view transition navigations.

- [ ] **Step 1: Create ShibuiGlint.astro**

```astro
<!-- src/components/shibui/ShibuiGlint.astro -->
<script>
  const glintedPages = new Set<string>();

  function triggerGlint() {
    const path = window.location.pathname;
    if (glintedPages.has(path)) return;
    glintedPages.add(path);

    // Slight delay so the page has settled after view transition
    requestAnimationFrame(() => {
      document.querySelectorAll<HTMLElement>('.shibui-term').forEach((el, i) => {
        // Stagger glint across terms
        setTimeout(() => {
          el.classList.add('shibui-term--glint');
          // Remove class after animation completes so it doesn't replay
          el.addEventListener('animationend', () => {
            el.classList.remove('shibui-term--glint');
          }, { once: true });
        }, i * 80);
      });
    });
  }

  document.addEventListener('astro:page-load', triggerGlint);
</script>
```

- [ ] **Step 2: Add ShibuiGlint to Layout.astro**

In `src/layouts/Layout.astro`, import and add after `ShibuiRestore`:

```astro
import ShibuiGlint from '../components/shibui/ShibuiGlint.astro';
```

```astro
  <ShibuiRestore />
  <ShibuiGlint />
```

- [ ] **Step 3: Commit**

```bash
git add src/components/shibui/ShibuiGlint.astro src/layouts/Layout.astro
git commit -m "feat(shibui): add ShibuiGlint animation script with per-page dedup"
```

---

## Task 7: Pilot — HeroSection.astro (Index Page)

**Files:**
- Modify: `src/components/home/HeroSection.astro`

Wrap the hero titles and subtitles in `ShibuiContent` with entry variants. The engineering/creative views are orthogonal — each view gets its own entry text.

**Important**: The existing `<abbr>` elements in the hero sub already function as proto-annotations. Replace them with `<ShibuiTerm>` components.

- [ ] **Step 1: Add imports**

At the top of `HeroSection.astro`, add:

```astro
import ShibuiContent from '../shibui/ShibuiContent.astro';
import ShibuiTerm from '../shibui/ShibuiTerm.astro';
```

- [ ] **Step 2: Wrap engineering hero title in ShibuiContent**

Replace the engineering title constant and its rendering. The current `engineeringTitle` is:
> "AI Orchestration Architect building model-agnostic swarms and enterprise-grade distributed backends."

Entry version:
> "I design AI systems that manage themselves — building the infrastructure that lets teams scale without scaling headcount."

Replace the engineering `<h1>` block with:

```astro
<ShibuiContent id="hero.engineering.title">
  <span slot="entry">
    <h1 class="hero__title" data-reveal style="animation-delay: 100ms">
      I design AI systems that manage themselves — building the infrastructure that lets teams scale without scaling headcount.
    </h1>
  </span>
  <span slot="elevated">
    <h1 class="hero__title hero__title--animated" data-reveal style="animation-delay: 100ms">
      {splitWords(engineeringTitle).map((word, i) => (
        <span class="hero__word" style={`animation-delay: ${100 + i * 40}ms`}>{word}&nbsp;</span>
      ))}
    </h1>
  </span>
</ShibuiContent>
```

- [ ] **Step 3: Wrap engineering hero subtitle in ShibuiContent**

Replace the current engineering subtitle `<p class="hero__sub">` block. The existing elevated text uses `<abbr>` elements. Replace them with `<ShibuiTerm>` and add an entry layer:

```astro
<ShibuiContent id="hero.engineering.sub">
  <span slot="entry">
    <p class="hero__sub" data-reveal style="animation-delay: 200ms">
      <strong>Translating complex requirements into resilient software.</strong><br/>
      15 years of strategic delivery. Lead Architect for a {vitals.repos.total}-repo ecosystem. {vitals.substance.automated_tests.toLocaleString()} automated tests and {vitals.substance.ci_coverage_pct}% coverage.
    </p>
  </span>
  <span slot="elevated">
    <p class="hero__sub" data-reveal style="animation-delay: 200ms">
      <strong>Translating complex requirements into resilient software.</strong><br/>
      15 years of strategic delivery. Lead Architect for a {vitals.repos.total}-repo <ShibuiTerm term="orchestration ecosystem" definition="A unified portfolio architecture spanning multiple organizations and systems" />. Expert in <ShibuiTerm term="autonomous governance" definition="Self-regulating CI/CD and deployment pipelines" />, <ShibuiTerm term="multi-agent topologies" definition="The arrangement and communication patterns between autonomous AI agents" />, and <ShibuiTerm term="hexagonal reliability" definition="Architecture pattern where core logic is isolated from external dependencies via adapter layers" />. {vitals.substance.automated_tests.toLocaleString()} tests and {vitals.substance.ci_coverage_pct}% coverage across the production fleet.
    </p>
  </span>
</ShibuiContent>
```

- [ ] **Step 3b: Add bridge text after each ShibuiContent block**

After each `</ShibuiContent>`, add a bridge button for Overview/Standard modes:

```astro
<button class="shibui-bridge" type="button">This section goes deeper &#8594;</button>
```

This is the affordance that tells Overview visitors that more content exists (Stranger persona requirement from spec).

- [ ] **Step 4: Wrap creative hero title and subtitle similarly**

Apply the same pattern to the creative view. Entry version of creative title:
> "Combining code, storytelling, and system design to build creative projects that sustain themselves."

Entry version of creative subtitle:
> "Directing the intersection of writing and code. Coordinating {vitals.repos.total} repositories and {vitals.repos.orgs} organizations. ~{Math.floor(vitals.logos.words / 1000)}K words of planning and documentation."

- [ ] **Step 5: Verify in dev server**

Run: `npm run dev`. Navigate to homepage. Click the depth control to cycle through Overview/Standard/Full. Verify:
- Overview: simplified hero text, no jargon
- Standard: simplified text with expandable sections
- Full: current site behavior with ShibuiTerm tooltips
- Engineering/Creative toggle still works independently at all depth levels

- [ ] **Step 6: Run existing tests**

Run: `npm run test`
Expected: All existing tests pass (no regressions).

- [ ] **Step 7: Commit**

```bash
git add src/components/home/HeroSection.astro
git commit -m "feat(shibui): pilot depth layers on homepage hero section (engineering + creative views)"
```

---

## Task 8: Pilot — about.astro

**Files:**
- Modify: `src/pages/about.astro`

Wrap the bio section and organ map in `ShibuiContent`. The about page is the second-highest traffic page and the primary target for the stranger test.

- [ ] **Step 1: Add imports**

At the top of `about.astro` frontmatter:

```astro
import ShibuiContent from '../components/shibui/ShibuiContent.astro';
import ShibuiTerm from '../components/shibui/ShibuiTerm.astro';
```

- [ ] **Step 2: Wrap bio paragraphs**

The bio section has 3 paragraphs. Wrap the first paragraph in ShibuiContent:

Current elevated text (paragraph 1):
> "I'm Anthony James Padavano — an AI Orchestration Architect and strategic producer based in New York City. I bridge the gap between high-level rhetorical theory and production-grade system design."

Entry text:
> "I'm Anthony James Padavano — I design systems where AI and humans work together to build things at scale. Based in New York City, I combine 15 years of production, education, and engineering into large-scale technical projects."

```astro
<ShibuiContent id="about.bio.p1">
  <span slot="entry">
    <p>
      I'm Anthony James Padavano — I design systems where AI and humans work together to build things at scale. Based in New York City, I combine 15 years of production, education, and engineering into large-scale technical projects.
    </p>
  </span>
  <span slot="elevated">
    <p>
      I'm Anthony James Padavano — an AI Orchestration Architect and strategic producer based in New York City. I bridge the gap between high-level <ShibuiTerm term="rhetorical theory" definition="The study of how communication persuades and constructs meaning — here applied to system architecture as a form of argumentation" /> and production-grade system design.
    </p>
  </span>
</ShibuiContent>
```

- [ ] **Step 3: Wrap bio paragraph 2**

Current elevated:
> "For 15 years, I have operated in high-consequence environments where storytelling and systems collide. My career spans a decade of multimedia production (17.5M+ views, $2M raised), large-scale project management in the construction industry, and over 100 courses delivered in higher education. I treat code, culture, and governance as a single, unified architectural medium."

Entry:
> "My career spans multimedia production (17.5M+ views, $2M raised), large-scale project management in construction, and 100+ university courses. I bring the same structured thinking to software that I developed managing real-world projects with budgets, teams, and deadlines."

- [ ] **Step 4: Wrap bio paragraph 3**

Current elevated:
> "I hold an MFA in Creative Writing from Florida Atlantic University and a BA in English Literature from CUNY. I am a Meta-certified Full-Stack Developer and hold Google Professional Certificates in Project Management, UX Design, and Digital Marketing. Today, I direct the orchestration of autonomous agent swarms and the automated governance of massive technical ecosystems. I am not a manual coder; I am an AI-Native Architect who directs machines to build the safe, scalable creative infrastructure of the future."

Entry:
> "MFA in Creative Writing (FAU), BA in English Literature (CUNY). Meta-certified Full-Stack Developer. Google-certified in Project Management, UX Design, and Digital Marketing. I specialize in directing AI to build and maintain large technical systems — not writing every line by hand, but designing the systems that write and test themselves."

- [ ] **Step 5: Wrap the organ map section**

The "Eight-Organ System" section uses specialized vocabulary. Wrap the introductory paragraphs and simplify the organ descriptions:

Entry version of organ map intro:
> "Most portfolios are a flat list of projects. Mine is organized like a living system — {vitals.repos.total} repositories across {vitals.repos.orgs} organizations, each handling a different function."

Entry version of organ descriptions (replace Latin names with functions):
```
I    Theory — Foundational concepts and frameworks
II   Art — Generative art and creative coding
III  Products — Commercial tools and deployed software
IV   Orchestration — Automation, governance, AI agents
V    Writing — Essays, documentation, public thinking
VI   Community — Reading groups, workshops, learning
VII  Distribution — Sharing work across platforms
∞    Meta — The system that manages itself
```

Add `<ShibuiTerm>` annotations on the elevated organ names (Theoria, Poiesis, Ergon, Taxis, Logos, Koinonia, Kerygma).

- [ ] **Step 5b: Add bridge text after each ShibuiContent block**

After each `</ShibuiContent>` in the about page, add:

```astro
<button class="shibui-bridge" type="button">This section goes deeper &#8594;</button>
```

- [ ] **Step 6: Verify in dev server**

Run: `npm run dev`. Navigate to `/portfolio/about/`. Cycle through depth levels. Verify:
- Overview: stranger-friendly language, no Latin/Greek terms, clear credentials
- Standard: entry text with expandable elevated sections
- Full: current site content with annotation tooltips on specialized terms

- [ ] **Step 7: Run tests**

Run: `npm run test`
Expected: All tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/pages/about.astro
git commit -m "feat(shibui): pilot depth layers on about page — bio, credentials, and organ map"
```

---

## Task 9: Integration Verification

**Files:**
- No new files. Verification only.

End-to-end check that the full system works across pages, view transitions, and edge cases.

- [ ] **Step 1: Run full test suite**

```bash
npm run test
```

Expected: All tests pass. No regressions.

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck:strict
```

Expected: No new type errors or hints.

- [ ] **Step 3: Run lint**

```bash
npm run lint:fix
```

Expected: Clean or auto-fixed.

- [ ] **Step 4: Run build**

```bash
npm run build
```

Expected: Build succeeds. No new chunk size warnings.

- [ ] **Step 5: Run preflight**

```bash
npm run preflight
```

Expected: All gates pass.

- [ ] **Step 6: Manual verification matrix**

| Scenario | Expected |
|----------|----------|
| First visit (no localStorage) | Overview mode, concentric rings show outer ring only |
| Click depth control once | Standard mode, middle ring visible |
| Click depth control again | Full Depth, inner dot visible |
| Click again | Back to Overview |
| Arrow Right on depth control | Deeper |
| Arrow Left on depth control | Shallower |
| Navigate index -> about | Depth preference persists |
| View transition (back/forward) | No FOUC, depth stays |
| Hover ShibuiTerm at Full Depth | Tooltip appears |
| Reduced motion enabled | No glint, no transition animations |
| Mobile viewport (< 768px) | Depth control accessible in mobile nav |
| Engineering/Creative toggle at Overview | Both views show entry text |
| Light theme | All shibui styles work (check tooltip bg) |

- [ ] **Step 7: Commit verification notes**

No code changes — just verify everything works. If any issue found, fix and commit individually.

---

## Task 10: Final Commit and Summary

- [ ] **Step 1: Review all changes**

```bash
git log --oneline -10
```

Verify commit history is clean and atomic.

- [ ] **Step 2: Push to main**

```bash
git push origin main
```

- [ ] **Step 3: Verify CI passes**

Monitor `quality.yml` workflow. Verify all jobs pass. If deploy triggers, verify live site.

- [ ] **Step 4: Run post-deploy smoke if deployed**

```bash
node scripts/post-deploy-smoke.mjs
```

---

## Summary of Deliverables

| Deliverable | Files |
|-------------|-------|
| Utility module | `src/utils/shibui.ts` + tests |
| CSS system | Additions to `src/styles/global.css` |
| FOUC prevention | `src/components/scripts/ShibuiRestore.astro` |
| Depth control | `src/components/shibui/DepthControl.astro` |
| Content wrapper | `src/components/shibui/ShibuiContent.astro` |
| Annotation component | `src/components/shibui/ShibuiTerm.astro` |
| Glint animation | `src/components/shibui/ShibuiGlint.astro` |
| Layout integration | Modified `Layout.astro`, `Header.astro` |
| Pilot: homepage | Modified `HeroSection.astro` |
| Pilot: about | Modified `about.astro` |

**Not in scope (Phase 2):**
- Content extraction to YAML
- AI distillation pipeline
- Project page migration
- Resume page migration
- Content collection schema
- Per-page depth floors (`data-shibui-page-floor`) — must be added before essay pages (logos/) can be migrated, since essays should lock to Full Depth. The CSS and JS plumbing for page floors is deferred until a page that needs it is migrated.
