# Progressive Disclosure Pattern Analysis — Portfolio Site

## Objective
Identify and catalog existing progressive disclosure, accordion, collapsible, tab, and "show more" patterns in the Astro portfolio site that could be reused for content density management.

## Status
✅ Completed: Comprehensive codebase search and pattern analysis

## Key Findings

### No Existing Progressive Disclosure Patterns
- **Result**: Zero accordion, collapsible, details/summary, or expandable patterns found in codebase
- **Search scope**: 5 major pages + ScrollReveal component
- **Grep searches**: Searched for accordion, collapsible, expand, disclosure, details, summary, toggle, reveal patterns — all returned no matches

### Pages Analyzed & Content Density Approaches

#### gallery.astro (42 sketches)
- **Approach**: Client-side filtering with `data-filter` buttons
- **Pattern**: Show/hide via `display: none` CSS
- **Event cleanup**: AbortController pattern for listener cleanup
- **Progressive disclosure**: None (all items rendered upfront)
- **ARIA**: aria-pressed for button states, aria-live for filter status

#### essays.astro (multiple essays)
- **Approach**: Simple flat list, all content visible
- **Pattern**: Grid layout with hover states
- **Progressive disclosure**: None

#### architecture.astro
- **Approach**: Interactive D3 visualizations + edge table
- **Pattern**: ChartContainer components
- **Progressive disclosure**: None (all graph and table data visible)

#### resume.astro
- **Approach**: Persona gateway with card selection
- **Pattern**: PersonaCard components linking to persona-specific pages
- **Progressive disclosure**: None on gateway (detail pages handle persona-specific content)

#### omega.astro (17 criteria)
- **Approach**: All criteria cards visible in sequence
- **Pattern**: Color-coded left borders by status, progress bar
- **Progressive disclosure**: None (all 17 criteria visible)

### Reusable Patterns Already in Codebase

#### 1. Scroll-Triggered Reveal Animation
- **File**: src/components/scripts/ScrollReveal.astro
- **Pattern**: IntersectionObserver with data-reveal attribute
- **Behavior**: Applies .revealed class when element intersects viewport
- **Accessibility**: Respects prefers-reduced-motion
- **Details**:
  - rootMargin: 50px bottom
  - threshold: 0.1
  - Runs on astro:page-load events for view transition support

#### 2. Event Cleanup Pattern (AbortController)
- **File**: src/pages/gallery.astro
- **Pattern**: AbortController for event listener cleanup between navigation
- **Use case**: Prevents memory leaks when page transitions via Astro ClientRouter
- **Example**:
  ```typescript
  const controller = new AbortController();
  button.addEventListener('click', handler, { signal: controller.signal });
  // On astro:before-swap: controller.abort()
  ```

#### 3. Client-Side Filtering with State
- **File**: src/pages/gallery.astro
- **Pattern**: data-filter buttons toggle visibility with display CSS
- **ARIA support**: aria-pressed states, aria-live status region
- **Behavior**: Updates accessible text for screen readers on filter change

#### 4. Stagger Animation Pattern
- **File**: gallery.astro, other pages using data-reveal
- **Pattern**: CSS calc on custom properties for timing
- **Details**: --stagger-index used with CSS animation-delay
- **Effect**: Sequential reveal when elements intersect

## Candidates for Progressive Disclosure Implementation

### High Priority (Dense Content)
1. **resume.astro** — Currently links out to persona pages; could embed progressive disclosure on gateway
2. **omega.astro** — 17 criteria could be grouped by horizon and collapsed/expanded
3. **architecture.astro** — Edge list table could be paginated or collapsible by organ

### Medium Priority
4. **essays.astro** — Could add category/date-based filters or expand/collapse by category
5. **gallery.astro** — Already filters; could add progressive loading of sketches

## Implementation Recommendations

### Reuse These Existing Patterns
- **Scroll reveal**: Use data-reveal + IntersectionObserver for fade-in on expand
- **Event cleanup**: Use AbortController for any interactive disclosure toggles
- **Stagger timing**: Leverage existing --stagger-index CSS pattern
- **ARIA states**: Model on gallery.astro's aria-pressed + aria-live pattern

### New Patterns Needed
- **Accordion component**: No existing accordion; would need new component
- **Details/summary element**: Could wrap in `<details>` with Astro scoped styles
- **Toggle button state**: Extend aria-pressed pattern to aria-expanded
- **Collapse animation**: CSS transition on max-height or clip-path for smooth collapse

### Design System Integration
- Use existing CSS custom properties (--space-*, --transition-fast, etc.)
- Color-code disclosure states using --accent, --text-primary, --border values
- Ensure animations respect prefers-reduced-motion (already in ScrollReveal)

## Next Steps (Pending User Direction)

- [ ] Create reusable Accordion.astro component based on design system
- [ ] Create DisclosureButton.astro component with aria-expanded management
- [ ] Update omega.astro to group criteria by horizon with collapsible sections
- [ ] Update resume.astro to add progressive disclosure on gateway
- [ ] Write tests for disclosure toggle behavior + ARIA state changes
- [ ] Document pattern in code comments and project README

## Files Referenced

**Read-only analysis completed on:**
- src/pages/gallery.astro
- src/pages/essays.astro
- src/pages/architecture.astro
- src/pages/resume.astro
- src/pages/omega.astro
- src/components/scripts/ScrollReveal.astro

**No modifications made** (plan mode — read-only exploration only)

---

**Date**: 2026-02-22
**Status**: Analysis Complete • Awaiting implementation direction
