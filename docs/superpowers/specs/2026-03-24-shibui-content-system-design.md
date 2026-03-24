# Shibui Content System — Design Specification

**Date**: 2026-03-24
**Status**: Draft (post-review v2)
**Review**: Spec reviewed 2026-03-24. 4 critical, 6 important issues resolved below.
**Author**: Anthony James Padavano + Claude
**Problem**: "I don't understand anything on this webpage" — consistent feedback across recruiters, engineers, family, and general visitors

## Executive Summary

The portfolio broadcasts at maximum domain specificity (Heideggerian Dasein, Peircean semiotics, epistemic engines) as the default surface. Visitors outside the author's domain receive noise, not signal. Seven independent audits converge on the same diagnosis: the site fails the stranger test.

**Shibui** (渋い) — a Japanese aesthetic where beauty is simple and subtle on the surface but holds rich, complex character underneath that reveals itself over time — is both the design philosophy and the name of this system.

The solution: a tiered content architecture where every prose element exists in two registers (entry + elevated), governed by a global depth control, with inline annotation affordances for term-level depth exploration. The surface is universally accessible. The depth rewards curiosity.

---

## 1. Foundational Laws

### Law 1 — Conservation of Meaning

No transformation between registers may lose semantic content. It may only change the encoding.

```
forall x: meaning(entry(x)) supseteq meaning(elevated(x)).core
```

The entry layer preserves all core claims — what the project does, why it matters, what was achieved. It sheds only the encoding: domain-specific terminology, academic citations, philosophical frameworks.

### Law 2 — Monotonic Depth Gradient

Complexity increases monotonically with depth. No deeper layer may be simpler than a shallower one.

```
forall x, d1 < d2: complexity(Display(x, d1)) <= complexity(Display(x, d2))
```

### Law 3 — Continuity of Transition

All transitions between depth states must be continuous. No jump cuts.

```
lim(d -> d0) Display(x, d) = Display(x, d0)
```

Cross-fades, morphs, expand/collapse — never a hard swap. The content breathes, not switches.

### Law 4 — Locality of Depth

The depth control is global, but depth affordances are local. A visitor at depth 0 can access depth 1.0 for a single term without changing global state.

```
GlobalDepth: d_g in {0, 0.5, 1}, persisted in localStorage
LocalDepth(term): d_l in {0, 1}, ephemeral
EffectiveDepth(x) = max(d_g, d_l(x))
```

### Law 5 — First-Contact Accessibility

On first visit (no stored preference), the system defaults to entry mode. The site must pass the stranger test at d=0.

```
d_g(first_visit) = referral_heuristic(document.referrer) ?? 0
forall pages: stranger_test(Display(page, 0)) = PASS
```

Referral heuristic: GitHub -> full (1.0), LinkedIn -> overview (0), Google -> standard (0.5), unknown -> overview (0).

---

## 2. Architecture Overview

### Content Unit Model

```typescript
interface ContentUnit {
  id: string;                    // "project.ai-conductor.model.p1"
  elevated: string;              // current text, verbatim
  entry: string;                 // distilled version, 1-3 sentences
  annotations?: Annotation[];    // term-level depth affordances
  depthFloor?: number;           // minimum depth to display (0-1)
}

interface Annotation {
  term: string;                  // matched text in elevated
  definition: string;            // plain-language explanation
  simpleAlt?: string;            // replacement text for entry mode
}
```

### Depth States

| State | d value | Label | What renders |
|-------|---------|-------|-------------|
| Overview | 0.0 | Entry text only | Universal language. Passes stranger test. |
| Standard | 0.5 | Entry + affordances | Entry text with expandable elevated sections and visible annotations |
| Full Depth | 1.0 | Elevated text | Current site behavior. Annotations on hover only. |

### State Machine

```
          +------------------+
          |                  |
 +--------v--------+  click  +---------------------+  click  +--------------+
 |    OVERVIEW      |-------->|     STANDARD        |-------->|  FULL DEPTH  |
 |    d = 0.0       |        |     d = 0.5         |        |    d = 1.0   |
 |  entry text      |<-------|  entry + affordances |<-------|elevated text |
 +------------------+  click +---------------------+  click +--------------+
          |                           |                            |
          |         LOCAL EXPAND (any mode)                        |
          |    click term -> show definition tooltip               |
          |    click section -> expand elevated inline             |
          +--------------------------------------------------------+
```

---

## 3. Phased Implementation (Decoupled)

**Critical amendment from Architect persona review**: The depth interaction layer MUST be decoupled from content externalization. Phase 1 works with existing inline content.

### Phase 1: Interaction Layer (ships first)

Works with existing `.astro` pages. No content extraction required.

1. **DepthControl component** — concentric rings icon in nav, cycles through three states
2. **`data-shibui-*` attributes** — added to existing content elements inline
3. **CSS layer system** — `html[data-shibui-depth]` selectors control visibility (placed on `<html>` to be consistent with theme system pattern; `<main>` is used for view-specific state like `data-portfolio-view`)
4. **localStorage persistence** — depth preference + referral heuristic for first visit
5. **Annotation component** — `<ShibuiTerm>` for inline term definitions
6. **Pilot pages**: `index.astro` (hero + taglines) and `about.astro` (bio + organ map)

Content at this phase: entry text written inline in the `.astro` files alongside elevated text, wrapped in `data-shibui-layer` spans.

### Phase 2: Content Pipeline

After Phase 1 proves the interaction model on 2-3 pages:

1. **Extraction script** — `npm run shibui:extract` parses .astro prose into YAML
2. **Distillation script** — `npm run shibui:distill` generates entry layer via LLM
3. **Annotation script** — `npm run shibui:annotate` generates term definitions
4. **Human review** — all generated content reviewed before merge
5. **Migration** — project pages converted from inline to YAML-driven

### Phase 3: Full Rollout

All pages converted. Content collection schema enforces completeness. Data integrity tests validate both layers.

---

## 4. Component Design

### DepthControl (nav element)

**Visual**: Three concentric rings icon using `--accent` gold (#d4a853).
- Overview: outer ring only
- Standard: outer + middle ring
- Full Depth: outer + middle + inner dot

**Behavior**: Click cycles states. Hover tooltip shows current state name. Keyboard: Enter/Space to cycle, announced via `aria-live`.

**No text labels at rest.** The icon speaks first; words on demand. This IS Shibui.

### Shibui Content Wrapper

```html
<div class="shibui-content" data-unit-id="..." data-depth-floor="0">
  <span class="shibui-content__entry" data-shibui-layer="entry">
    <!-- simplified text -->
  </span>
  <span class="shibui-content__elevated" data-shibui-layer="elevated" aria-hidden="true">
    <!-- original text with annotation spans -->
  </span>
</div>
```

**Note**: Uses `<div>` with BEM class (not a custom element) to match existing codebase conventions. No Web Components are used in this project.

**Dual-render CSS strategy**: Both layers exist in the DOM for SEO indexing. The inactive layer uses `visibility: hidden; height: 0; overflow: hidden; position: absolute` at rest (hidden from layout, still indexable). During transitions, the incoming layer is temporarily positioned absolute over the outgoing layer, enabling the `clip-path` reveal animation without layout shift. The `aria-hidden` attribute is toggled by JS to ensure screen readers only announce the active layer.

CSS controls visibility via `html[data-shibui-depth]`.

**JavaScript dependency**: The depth switching requires JavaScript. Default CSS state (no JS loaded) shows **elevated text only** (current site behavior — graceful degradation). When JS initializes, it reads localStorage/referrer, sets `html[data-shibui-depth]`, and toggles `aria-hidden`. This means: without JS, site works exactly as it does today. With JS, Shibui layers activate. The `<noscript>` tag is not needed — the CSS default handles the no-JS case.

### ShibuiTerm (inline annotation)

```html
<span class="shibui-term" tabindex="0" role="button" aria-expanded="false">
  <span class="shibui-term__text">epistemic engine</span>
  <span class="shibui-term__definition" role="tooltip">
    A symbolic computing system that processes self-referential structures
  </span>
</span>
```

**Visual**: Subtle dotted underline in `--accent`. Gold glint animation on page load (single pass `@keyframes glint` via `background-position` shift on linear-gradient). Hover/focus reveals tooltip.

---

## 5. Animation & Transitions

### Layer Cross-fade

- **Method**: `clip-path: inset(100% 0 0 0)` to `clip-path: inset(0)` — elevated text rises from below like unearthing a palimpsest
- **Duration**: `var(--transition-normal)` (350ms) — note: `--transition-slow` does not exist in `global.css`. If a 400ms token is needed, add `--transition-slow: 400ms ease` to `global.css` as a prerequisite.
- **Easing**: ease-in-out
- **Stagger**: 50ms per paragraph for multi-paragraph sections

### Design Token Dependencies

The following tokens are confirmed to exist in `global.css`:
- `--transition-fast` (150ms), `--transition-normal` (350ms), `--transition-base` (250ms)
- `--accent` (#d4a853), `--text-muted`, `--bg-card`, `--border`

The following tokens are referenced in CLAUDE.md but do **not** currently exist in `global.css` and may need to be added during implementation:
- `--transition-slow` (if 400ms duration is desired)
- `--shadow-sm` through `--shadow-2xl` (for tooltip shadow)
- `--z-dropdown` (for tooltip z-index — use a literal value or add the token)

### Annotation Glint

- **Trigger**: Once per page, on first `astro:page-load` for that page. Uses a `data-shibui-glinted` attribute on `<html>` or a `Set<string>` tracking glinted page paths, to prevent re-triggering on view transition navigations back to the same page.
- **Method**: `background-position` shift on subtle `linear-gradient(105deg, transparent 40%, rgba(212,168,83,0.15) 50%, transparent 60%)`
- **Duration**: 600ms, no repeat
- **Color**: `--accent` (#d4a853) at 15% opacity

### Tooltip Reveal

- **Method**: `transform: translateY(-4px)` + `opacity: 0 -> 1`
- **Duration**: `var(--transition-fast)` (150ms)

### Reduced Motion

All animations: `duration: 0ms`. Transitions become instant swaps. Glint disabled entirely.

---

## 6. localStorage Schema

```typescript
interface ShibuiPreference {
  depth: 'overview' | 'standard' | 'full';
  version: 1;
  timestamp: number;
}

// Key: 'shibui-depth'
// Default: { depth: inferFromReferrer(), version: 1, timestamp: Date.now() }
```

### Referral Heuristic

```typescript
/** Only called when localStorage has no existing 'shibui-depth' key.
 *  After first run, result is persisted and this function is never called again.
 *
 *  Known limitations (best-effort):
 *  - Google often sends empty or origin-only referrer (Referrer-Policy: no-referrer)
 *  - LinkedIn mobile in-app browser may strip referrer entirely
 *  - After first internal navigation, document.referrer = own site
 *
 *  All edge cases fall through to 'overview' (safest default per Law 5).
 */
function inferInitialDepth(): ShibuiDepth {
  // Guard: only run on true first visit
  if (localStorage.getItem('shibui-depth')) return null; // caller uses stored value

  const ref = document.referrer;
  if (ref.includes('github.com')) return 'full';
  if (ref.includes('linkedin.com')) return 'overview';
  if (ref.includes('google.com')) return 'standard';
  return 'overview';
}
```

---

## 7. SEO & Accessibility

- Both layers render in HTML — search engines index elevated text (richer keywords)
- Inactive layer: `visibility: hidden; height: 0; overflow: hidden; position: absolute` + `aria-hidden="true"` — hidden from layout and assistive tech, still indexable by search crawlers
- Active layer: normal flow, `aria-hidden="false"`
- `aria-live="polite"` on content regions announces depth changes to screen readers
- Annotation tooltips use `role="tooltip"` with `aria-describedby`
- Depth control: keyboard navigable. Arrow keys are bidirectional (Left = shallower, Right = deeper). Enter/Space cycle forward. This matches slider semantics.
- **No `<noscript>` needed**: Default CSS shows elevated-only (current behavior). JS activates depth system on load.
- **No CLS**: Inactive layer is `position: absolute` (removed from flow). During transitions, both layers briefly coexist with the incoming layer absolute-positioned over the outgoing, then the outgoing is collapsed.

---

## 8. Quality Integration

### New Test Assertions

```typescript
// Content completeness
test('all shibui units have entry and elevated text');
test('entry text is shorter than elevated');
test('no orphaned shibui unit references');
test('annotation terms match elevated text');

// Accessibility
test('depth control is keyboard accessible');
test('tooltips have aria-describedby');
test('layer transitions respect prefers-reduced-motion');
```

### Governance Coupling

If shibui content YAML files are added (Phase 2+), `quality-governance.test.ts` validates consistency between layers.

---

## 9. Migration Priority

| Priority | Pages | Rationale |
|----------|-------|-----------|
| P0 | `index.astro` (hero, taglines, stat labels) | First 7.4 seconds. Highest bounce risk. |
| P0 | `about.astro` (bio, organ map, practice) | Second most-visited. Must pass stranger test. |
| P1 | 21 project pages | Bulk of content. AI distillation tractable. |
| P1 | `resume.astro` + `resume/[slug].astro` | Recruiter-facing. Must work at d=0. |
| P2 | `dashboard.astro`, `omega.astro` | Internal metrics. Lower visitor traffic. |
| P2 | `for/[target].astro` | Strike pages already audience-targeted. |
| P3 | `logos/[slug].astro` | Essays intentionally elevated. Annotations only. |

---

## 10. Mathematical Model

### Definitions

- `C` = set of all Content Units
- `d in {0, 0.5, 1}` = global depth state
- `L(c)` = set of locally expanded content units
- `R(c, d)` = rendered output

### Axioms

```
A1 (Completeness):       forall c in C: exists entry(c) AND exists elevated(c)
A2 (Non-emptiness):      forall c in C: |entry(c)| > 0 AND |elevated(c)| > 0
A3 (Compression):        forall c in C: |entry(c)| <= |elevated(c)|
                         (weak inequality: atomic units like stat labels may have identical entry/elevated)
A4 (Meaning):            forall c in C: claims(entry(c)) supseteq claims(elevated(c)).core
A5 (Shibui threshold):   exists minimum granularity g: |elevated(c)| < g implies entry(c) = elevated(c)
                         (content units below threshold are exempt from dual-layer requirement — e.g., "117 repos")
```

### Canonical Depth Mapping

The localStorage stores string enums; the math model uses floats. The canonical mapping:

```
DEPTH_MAP = { 'overview': 0, 'standard': 0.5, 'full': 1.0 }
DEPTH_MAP_INVERSE = { 0: 'overview', 0.5: 'standard', 1.0: 'full' }
```

All code uses string keys for storage/attributes and float values for comparisons.

### Rendering Function

```
R(c, d, L) =
  | d = 0   AND c not in L  ->  entry(c)
  | d = 0   AND c in L      ->  entry(c) + elevated(c)           // local expand
  | d = 0.5 AND c not in L  ->  entry(c) + affordances(elevated(c))
  | d = 0.5 AND c in L      ->  elevated(c) + expanded_annotations(c)  // local expand at standard = jump to full for that unit
  | d = 1   AND c not in L  ->  elevated(c) + hover_annotations(c)
  | d = 1   AND c in L      ->  elevated(c) + expanded_annotations(c)
```

Note: At d=0.5, local expand applies `EffectiveDepth = max(0.5, 1) = 1.0` per Law 4, so the unit renders at Full Depth while global state remains Standard.

### Transition Function

```
T(R_old, R_new, t) = {
  opacity: lerp(1, 0, t) for R_old
  clip-path: lerp(inset(100% 0 0 0), inset(0), t) for R_new
  t in [0, 1] over 400ms ease-in-out
}
```

### Invariants (Test-Enforced)

```
I1: forall c in C, forall d: R(c, d) renders without error
I2: forall c in C: claims(entry(c)) INTERSECT claims(elevated(c)).core != empty
I3: |{c in C : NOT exists entry(c)}| = 0
I4: forall a in annotations(c): a.term in elevated(c)
```

---

## 11. Stress Test Results (Three Personas)

### The Stranger (zero-context visitor)

**Issue raised**: If entry layer feels complete, depth is never discovered.
**Resolution**: Depth indicators — gold glint on annotated terms, concentric rings icon in nav, "This section goes deeper ->" bridge text in muted color at section ends in Overview mode.

### The Architect (staff-level engineer evaluating for hire)

**Issue raised**: Feature is a trojan horse for content extraction refactor. Decouple them.
**Resolution**: Phase 1 works with existing inline content via `data-shibui-*` attributes. No YAML migration required. Content externalization is Phase 2, independent workstream.

**Issue raised**: Default-to-overview penalizes expert visitors.
**Resolution**: Referral-aware heuristic. GitHub -> Full Depth, LinkedIn -> Overview, unknown -> Overview.

### The Aesthete (the author's own design sensibility)

**Issue raised**: Segmented toggle is functional but not Shibui.
**Resolution**: Concentric rings icon (no text labels at rest). Clip-path reveal transitions (palimpsest metaphor). Gold glint on annotations. The UI embodies the aesthetic, not just enables it.

---

## 12. Content Example

### Before (current site, about.astro bio):

> I'm Anthony James Padavano — an AI Orchestration Architect and strategic producer based in New York City. I bridge the gap between high-level rhetorical theory and production-grade system design.

### After (Shibui system, d=0 Overview):

> I'm Anthony James Padavano — I design systems where AI and humans work together to build things at scale. Based in New York City, I combine 15 years of production, education, and engineering into large-scale technical projects managed by AI agents.

### After (Shibui system, d=0.5 Standard):

> I'm Anthony James Padavano — I design systems where AI and humans work together to build things at scale. Based in New York City, I combine 15 years of production, education, and engineering into large-scale technical projects managed by AI agents.
>
> [Expand: Full version ->]
> _"I bridge the gap between high-level <span class="shibui-term">rhetorical theory</span> and production-grade system design."_

### After (Shibui system, d=1.0 Full Depth):

> I'm Anthony James Padavano — an AI Orchestration Architect and strategic producer based in New York City. I bridge the gap between high-level <span class="shibui-term">rhetorical theory</span> and production-grade system design.

(Current text, unchanged, with annotation on hover for "rhetorical theory")

---

## 13. Composition with Existing Systems

### Engineering/Creative View Toggle

The homepage has a `data-portfolio-view` toggle (Engineering/Creative) that swaps hero text, stats, and project card visibility. Adding Shibui creates a second axis:

```
Content(page, view, depth) = view in {engineering, creative} x depth in {overview, standard, full}
```

The two systems are **orthogonal**: view selects *which* content (engineering stats vs. creative stats), depth selects *how* that content is expressed (entry vs. elevated). At d=0 Overview, both engineering and creative views show their respective content in simplified language. This means entry text must be authored for each view variant on the homepage (2 x hero, 2 x stats labels). Other pages (about, projects, resume) do not have the view toggle, so they only need one entry variant.

### Per-Page Depth Floors

Some pages should enforce a minimum depth. Mechanism: `data-shibui-page-floor` attribute on `<main>`:

```html
<!-- logos/[slug].astro — essays are intentionally elevated -->
<main data-shibui-page-floor="full">
```

When `page-floor` is set, the depth control still renders but the floor is respected:

```
EffectivePageDepth = max(page_floor, global_depth)
```

The depth control visually indicates when a floor is active (e.g., Overview and Standard stops are dimmed/disabled on essay pages).

---

## 14. Open Questions

1. **Depth control placement**: Nav bar (persistent) vs. floating button (less chrome)?
2. **Analytics**: Track depth preference distribution to measure stranger-test effectiveness?
3. **Naming**: "Shibui" as the internal system name — does it leak to UI, or is the user-facing concept unnamed?
