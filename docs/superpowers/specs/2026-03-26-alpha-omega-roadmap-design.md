# Alpha → Omega: Portfolio Transformation Roadmap

**Date**: 2026-03-26
**Status**: Draft v2 (post-review)
**Author**: Anthony James Padavano + Claude
**Reviews**: Absorber (21 expansions), Critic (8 gaps + timeline correction), Contrarian (distribution thesis — rejected as primary strategy but distribution folded into Phase IV-B)
**Problem**: Real human feedback — smart people don't understand the complex version. The front door needs rebuilding. The depth system needs to be visible. The content needs to convert in 7 seconds.

---

## Executive Summary

Seven phases from current state to: stranger test passes, omega 17/17, gets hired, system runs itself. Ordered by conversion impact. Timelines tripled from initial estimates per critic review.

**Prior art warning**: Two previous bento grid attempts both failed and were reverted. This spec addresses why: prior attempts wrapped existing full-width components in grid cells. This design builds purpose-built bento cells from scratch. No existing component is "jammed into" a grid cell — each cell is a new component designed for the grid format.

---

## Phase I: Bento Grid Homepage

**Goal**: Compress 5 screenfuls into 2. Embed proof metrics above the fold. Kill the long scroll.

**Sessions**: 5-7 (broken into three independently shippable sub-phases)

### The 21-Project Problem

The current homepage renders 21 projects across 8 organ groups. 21 projects cannot fit in 2 viewports. Resolution: **the homepage shows the top 6-8 projects as bento cells. A "See all 21 projects →" link navigates to a dedicated `/projects/` index page** (which does not currently exist and will be created).

The filter system (`IndexFilters.astro`, 248 lines) and organ group accordions migrate to the `/projects/` index page, not the homepage bento grid.

### The Dual-View Toggle Decision

The engineering/creative toggle survives but is SIMPLIFIED for the bento grid:
- **Homepage**: Toggle switches stat pills and card tag display (engineering tags vs creative tags). Hero text stays unified (the Shibui entry text is audience-neutral by design).
- **`/projects/` index page**: Toggle controls the full filter system with organ groups, skill filters, and category filters (migrated from current homepage).
- The toggle becomes a bento cell (1×1) rather than text embedded in the hero.

### Component Decomposition

No existing component is reused as a bento cell. All cells are purpose-built:

| Cell | Component | Content | Grid span |
|------|-----------|---------|-----------|
| Hero | `HeroBentoCell.astro` | Name, title, 4-6 stat pills, "available" badge | 3-col, 1 row |
| Controls | `ControlsBentoCell.astro` | View toggle pill + depth control rings | 1-col, 1 row |
| Featured project (×2) | `FeaturedBentoCard.astro` | Title, one-line impact, 2-3 tags, organ color border | 2-col, 2 rows |
| Standard project (×4-6) | `BentoCard.astro` | Title, organ color border | 1-col, 1 row |
| Persona links | `PersonaBentoCell.astro` | 4 role titles as compact links | 1-col, 2 rows |
| CTA | `CTABentoCell.astro` | "Let's work together" + consult link | 2-col, 1 row |

The flip card (`ProjectCard.astro`, 515 lines) is **deprecated for the homepage**. It remains available for the `/projects/` index page if needed. The bento card is single-face: title + impact + tags. Click morphs to detail page (Phase II). No flip interaction — view transitions ARE the progressive disclosure.

### Stat Pill Content

**Engineering view**: `116 Repos` · `2,000+ Tests` · `85% Coverage` · `104 CI Passing` · `15 Years`
**Creative view**: `740K Words` · `48 Essays` · `8 Organs` · `30 Sketches` · `15 Years`

"15 Years" appears in both views. It is the single most differentiating number.

### Bento Card Impact Text

The one-line impact text on each bento card IS entry-level content. **Phase III's simplification pipeline should produce this text.** Until Phase III ships, impact text is hand-authored (the persona system's `market_summary` pattern).

Format: 1 claim per sentence. Numbers first. Maximum 15 words. Present tense for capability.

### The Hero Canvas Decision

The hero-specific `SketchContainer` (480px) is **removed from the homepage**. The global `#bg-canvas` (z-index -1, full-page) provides ambient visual interest. The hero sketch moves to the `/about` page where it has room to breathe. This saves ~200ms of LCP time on the homepage.

### Grid CSS

Explicit column counts, NOT `auto-fit` (which failed in prior attempts):

```css
.bento-grid {
  display: grid;
  gap: var(--space-md);
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--space-lg);
}

/* Desktop (≥1024px): 4 columns */
@media (min-width: 1024px) {
  .bento-grid { grid-template-columns: repeat(4, 1fr); }
}

/* Tablet (768-1023px): 2 columns */
@media (min-width: 768px) and (max-width: 1023px) {
  .bento-grid { grid-template-columns: repeat(2, 1fr); }
  .bento-cell--featured { grid-column: span 2; grid-row: span 1; }
}

/* Mobile (<768px): 1 column */
@media (max-width: 767px) {
  .bento-grid { grid-template-columns: 1fr; }
}
```

No `span 2` on mobile. Featured cards lose the 2×2 treatment and become standard-height. Stat pills merge into the hero cell on mobile as a horizontal scroll row.

### Hover and Focus

- Background: `--bg-card` → `--bg-card-hover` on hover (already defined)
- Border: `--border` → `--border-hover` on hover (already defined)
- Organ color: left border intensifies on featured cards
- No scale transform (causes layout shift in CSS Grid)
- Focus-visible: 2px solid `--accent` with 2px offset

### Accessibility

- Grid container: `<main>` child, `role="region"`, `aria-label="Portfolio overview"`
- Cards: `<article>` with `aria-labelledby` pointing to title (not `<div>`)
- Keyboard: Tab flows left-to-right, top-to-bottom. No `order` reordering.
- DOM order = visual order (placement via `grid-column`/`grid-row`, not `order`)
- Reduced motion: morph animations (Phase II) disabled; instant crossfade at 0ms

### Scroll Reveal Decision

`data-reveal` scroll animations are **removed from the bento grid**. Most content is above the fold — reveal animations would fire immediately on load, creating a jarring cascade. Reveal animations remain on detail pages where content is below the fold.

### Sub-phases

**Ia (shippable): Static bento with hero + stat pills + 2 featured cards**
- New: `HeroBentoCell`, `ControlsBentoCell`, `FeaturedBentoCard`, bento grid CSS
- The minimum that changes the above-fold experience
- 2-3 sessions

**Ib (shippable): Full project cards + persona links + CTA**
- New: `BentoCard`, `PersonaBentoCell`, `CTABentoCell`
- Create `/projects/` index page with migrated filters
- 2-3 sessions

**Ic (shippable): Polish, responsive testing, visual regression**
- Add Playwright visual snapshot tests (1920×1080, 1280×720, 768×1024, 375×812)
- E2E test: load → switch view → verify stats change → click card → verify navigation
- Fix responsive edge cases from Ia/Ib
- 1-2 sessions

### Pre-wiring for Phase II

During Phase I implementation, add `transition:name={`project-${slug}`}` to every bento card title. This is inert without Phase II's matching target elements but avoids re-touching cards later. Zero cost.

### LinkedIn Headline Consistency

Before shipping Phase I: verify LinkedIn headline matches portfolio hero title. If LinkedIn says "AI Orchestration Architect" and the portfolio hero says the same, continuity is maintained. This costs zero code and is the highest-ROI action in the roadmap.

---

## Phase II: View Transitions + Spatial Navigation

**Goal**: Navigation feels like an app. Cards morph into detail pages.

**Sessions**: 2-3

### What Morphs

| Source (bento card) | Destination (project page) | `transition:name` |
|---------------------|---------------------------|-------------------|
| Card title (`h3`) | ProjectDetail title (`h2`) | `project-${slug}` |
| Organ color border | ProjectDetail header border | `project-border-${slug}` |

Tags, impact text, and sketches do NOT morph (content differs between source and destination).

### Transition Types

- **Forward (grid → detail)**: `morph` on title, `fade` on everything else. 300ms.
- **Back (detail → grid)**: Reverse morph. Native Astro behavior.
- **Sibling (detail → detail)**: `slide` — outgoing slides left, incoming slides right.
- **Home (any → home)**: `fade` — no morph, destination is the grid.

### Nav Rail

**Desktop**: Left sidebar, persistent via `transition:persist`. Contains: logo, primary nav links, view toggle, depth control. Width: ~200px. The bento grid's `max-width` accounts for this.

**Mobile**: Bottom bar with 4-5 icons. Replaces current hamburger menu.

**Decision**: Phase I must include a placeholder column for the nav rail from the start (the critic's coupling observation). The bento grid at desktop is actually 3 content columns + 1 nav rail column.

### Browser Fallback

Astro's `<ClientRouter />` handles fallback automatically. Without View Transition API support, standard page loads with `transition:animate="fade"`. No polyfill needed. The `transition:persist` on `#bg-canvas` works via Astro's client-side router even without native API support.

### p5.js Sketch Init Timing

Risk: detail page sketch starts initializing during the 300ms morph, causing a visual flash. Fix: delay per-page sketch init by 400ms (morph + 100ms buffer) using `requestAnimationFrame` in `reinitPage()`.

---

## Phase III: Lens Refinement — Rhetorical Algorithm Integration

**Goal**: Replace mechanical entry text with rhetorically-grounded simplification.

**Sessions**: 8-12 (broken into four sub-phases; only IIIa needed before stranger test)

### Sub-phases

**IIIa (shippable, 2 sessions): Improve mechanical simplification**
- Better sentence selection: keep topic sentences (first sentence of each paragraph)
- Flesch threshold: only simplify paragraphs scoring > 0.5 complexity (currently > 0.3)
- Strip parenthetical qualifications: `(Author, Year)`, `— which means ...`, etc.
- Preserve BUT/THEREFORE transitions (naive regex check)
- This is sufficient for the stranger test

**IIIb (shippable, 2-3 sessions): Port 2 scoring algorithms**
- Necessity scoring (from narratological-algorithmic-lenses): JS port, ~100 lines
- Entropy scoring (from linguistic-atomization-framework): JS port, ~50 lines
- Integrate into rehype-shibui-lens as additional scoring dimensions
- Weight: `complexity = flesch(0.3) + domain_density(0.2) + citation(0.1) + necessity(0.2) + entropy(0.2)`

**IIIc (shippable, 2-3 sessions): LLM integration**
- `shibui:distill-v2` script using gemini CLI with rhetorical constraints
- Prompt includes: complexity score, necessity score, target register (from transformation matrix), must-preserve invariants
- Three-tier fallback: (1) cached LLM result from previous build, (2) improved mechanical simplification from IIIa, (3) original text unchanged
- Build NEVER fails due to LLM unavailability

**IIId (2-4 sessions): Full rhetorical pipeline**
- Port remaining algorithms (causal binding, information economy, reorderability)
- Import register transformation matrix from vox--architectura-gubernatio as JSON
- Voice constitution rules as heuristic scorer
- Vocabulary expansion from 141 to ~300 definitions
- `bento_impact` output mode: single sentence, ≤15 words, numbers-first — feeds Phase I card text

### Shibui System Ownership

Clear rule: **Pages with manual ShibuiContent blocks are exempt from the rehype lens for those specific paragraphs** (the skip logic at line 211 already does this). Both systems produce the same visual output — the CSS classes and depth control work identically for manual and algorithmic content. Long-term convergence: as the algorithmic lens quality improves, manual blocks can be removed. No deadline — manual blocks are not technical debt, they're high-quality seed content.

---

## Phase IV: Stranger Test + Distribution

**Sessions**: 1 code + 2-4 weeks external

### IV-A: Stranger Test Protocol

**Recording**: Screen recording + think-aloud (standard UX protocol). Without recording, self-reported comprehension is unreliable.

**Task design**: Each participant gets a scenario matching their background:
- Recruiter: "You're hiring a Staff Engineer for AI infrastructure. Evaluate this candidate."
- Engineer: "You're considering this person as a tech lead on your team. What do they bring?"
- Non-technical: "A friend sent you this link. What does this person do?"

**Scoring** (weighted by funnel stage):
- 40%: Can they articulate what you do in one sentence?
- 30%: Can they find a relevant project in 30 seconds?
- 20%: Do they understand the depth control without instruction?
- 10%: Would they contact this person?

**Sample size**: 5 minimum (Nielsen's discount usability). Recruit from communities where participants could become ongoing followers (r/webdev, Dev.to, Hacker News) — dual value as testing AND community seeding for omega criteria.

**Run BEFORE and AFTER the bento grid**: 2 participants on the current site as baseline, then 3-5 on the bento version. Without a baseline, you cannot prove the redesign improved anything.

### IV-B: Distribution (folded from contrarian review)

The contrarian's core point is valid: the portfolio needs TRAFFIC, not just layout improvements. Distribution is not an alternative to the engineering work — it's a parallel workstream.

- Expand strike targets from 4 to 15-20
- Repost top 5 essays to dev.to / Medium / LinkedIn Articles (POSSE)
- Submit 3-5 conference proposals
- These actions happen IN PARALLEL with Phases I-III, not after

---

## Phase V: Revenue + Community

**Sessions**: 3-5 (split into independent tracks)

### V-A: Revenue (2-3 sessions)
- Stripe integration for Consult API worker
- Mark ORGAN-III products with `revenue_status: live`
- Track MRR (criterion is "live", not "profitable")

### V-B: Community (1-2 sessions + external time)
- Host 2+ salon/reading group events via GitHub Discussions
- Seed good-first-issues for external contributions
- Document event outcomes
- Stranger test participants invited as community seed

---

## Phase VI: Recognition

**Sessions**: External time (3-12 months)

- Conference proposals submitted (Phase IV-B)
- Grant follow-ups (NLnet, Creative Capital)
- Second operator validates runbooks (bus factor >1)
- Press/media tracked on portfolio press page

---

## Phase VII: Perpetual Rebirth

**Sessions**: 1-2

### Already deployed
- Shibui lens processes new pages automatically
- Quality ratchet enforces floors
- Dependabot handles dependencies
- Security drift monitor on schedule
- Runtime error telemetry
- Push → quality gates → auto-deploy

### Remaining
- Scheduled data refresh (weekly GitHub Actions cron for `sync:vitals`, `sync:omega`, `generate-data`)
- Stale data detection (if `vitals.json` > 14 days old, build emits warning)
- Automated persona relevance check (CI fails if persona `featured_projects` references a nonexistent slug)
- Content quality scoring history (`content-quality-scores.json` output during build → diff against baseline for drift detection)

---

## Dependency Graph

```
Phase Ia (Hero bento) ──┐
Phase Ib (Full bento) ──┤
Phase Ic (Polish) ──────┼── Phase IV-A (Stranger Test) ──┐
                        │                                 ├── Phase VI (Recognition)
Phase II (Transitions) ─┘                                 │
                                                          │
Phase IIIa (Mechanical) ── before IV-A ──────────────────┘
Phase IIIb-d (Rhetorical) ── parallel, non-blocking

Phase IV-B (Distribution) ── starts immediately, runs parallel to everything

Phase V-A (Revenue) ── independent
Phase V-B (Community) ── feeds from IV-A participants

Phase VII (Perpetual) ── after all above ── OMEGA
```

**Critical path to hired**: Ia → Ib → IIIa → IV-A → distribution + applications
**Parallel enrichment**: II, IIIb-d, V run alongside without blocking the critical path

---

## Revised Timeline

| Phase | Sessions | Cumulative |
|-------|----------|------------|
| Ia: Hero bento | 2-3 | 2-3 |
| Ib: Full bento | 2-3 | 4-6 |
| Ic: Polish + tests | 1-2 | 5-8 |
| II: View transitions | 2-3 | 7-11 |
| IIIa: Mechanical lens | 2 | 9-13 |
| IIIb-d: Full rhetoric | 6-10 | 15-23 |
| IV: Stranger test + distribution | 1 + external | 16-24 |
| V: Revenue + community | 3-5 | 19-29 |
| VII: Perpetual rebirth | 1-2 | 20-31 |

**To hired (critical path only)**: ~9-13 sessions + external time
**To omega 17/17**: ~20-31 sessions + 3-12 months external

---

## Open Questions

1. **Nav rail vs top nav**: Left sidebar steals horizontal space from the grid. Top sticky nav preserves grid width. Recommendation: top sticky (simpler, no grid coupling). Decision needed before Phase I.
2. **Project selection for homepage**: Which 6-8 projects appear on the bento homepage? Recommendation: the 2 featured + 4-6 highest-traffic from analytics. Or: persona-driven — each persona's top 2 projects.
3. **Stranger test recruitment**: UsabilityHub (paid, fast), or community recruitment (free, slower, dual-value)?
4. **Distribution timeline**: Start essay reposting immediately (before Phase I ships) or wait for the bento version? Recommendation: start immediately — the current site is adequate for essay distribution.
