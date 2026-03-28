# Alpha → Omega: The Full Roadmap

**Date**: 2026-03-25
**Status**: Phase I shipped. Phases II-VII designed.
**Finish line**: Stranger test passes + Omega 17/17 + Hired + System runs itself.

---

## Current State (Alpha)

| Dimension | Value |
|---|---|
| Shibui lens | Deployed. 4,456 paragraphs scored, 309 terms annotated, 1,471 entry texts generated |
| Rhetorical engine | F1-F5 shipped. 100+ transformation rules from vox governance |
| Manual wrapping | 162 ShibuiContent blocks coexisting with algorithmic lens |
| Depth modes | 3 visual modes (Overview/Standard/Full) with gold pill control |
| Homepage | 5-screenful vertical scroll (hero → cards → grid → stats → CTA) |
| Omega | 7/17 criteria met (41%) |
| Tests | 527 vitest + 22 rhetoric (549 total) |
| Quality phase | W12 (highest tier) |
| Deploy | GitHub Pages, CI green, auto-deploy on quality pass |

---

## Phase I: Rhetorical Foundation — SHIPPED

Five transformation functions grounded in linguistic theory:
- F1: Complexity Reduction (Chomsky's TG)
- F2: Term Substitution (hypernym chains)
- F3: Information Density (Shannon entropy + vox AP-01 through AP-11)
- F4: Register Shift (Halliday's SFL + vox register matrix)
- F5: Coherence Preservation (RST nucleus/satellite)

Integrated into `plugins/shibui-rhetoric.mjs`, replacing naive `generateEntry()`.

---

## Phase II: Lens Refinement

**Goal**: Improve the algorithmic lens output quality until it matches or exceeds hand-authored entry text.

### II-A: Vocabulary Expansion
- Expand vocabulary.json from 141 → 300+ definitions
- Source: mine existing ShibuiTerm annotations + generate definitions for top TF-IDF terms
- Add hypernym chains: each term gets `simpleTerm` field (the accessible alternative)
- Script: `shibui-expand-vocab.mjs` — LLM-assisted definition generation with human review

### II-B: Entry Text Quality Validation
- Use the 162 hand-authored entry texts as a gold-standard test corpus
- For each: run `simplify()` on the corresponding elevated text
- Compare algorithmically-generated vs hand-authored (BLEU score, length ratio, information preservation)
- Target: ≥0.6 BLEU against hand-authored on average
- Identify worst-performing paragraphs → tune F1-F5 parameters

### II-C: Sentence Length Optimization
- vox governance target: 10-40 words per sentence
- Add sentence splitting for >40 word sentences (compound → two simple)
- Add sentence merging for <10 word fragments
- Integrate as F1.5 between complexity reduction and term substitution

### II-D: Anti-Flattening Guard (INV-07)
- The simplification pipeline must NOT flatten dimensionality
- After simplification, verify: does the entry text still contain the core claim?
- Implement `f6_antiFlattening(original, simplified)` — rejects simplified text that loses the nucleus
- If rejected: fall back to F5 nucleus-only (no F3/F4 transforms)

### Deliverables
- Enhanced vocabulary.json (300+ definitions)
- BLEU validation script
- F1.5 sentence length optimizer
- F6 anti-flattening guard
- Tuned F1-F5 parameters

### Dependencies
- Phase I (shipped)

### Effort
- ~2 sessions

---

## Phase III: Bento Grid Homepage

**Goal**: Compress the homepage from 5 screenfuls to 2. The single highest-impact visual change.

### III-A: Layout Architecture
- Replace vertical stack (hero → persona cards → project grid → stats → CTA) with 2D bento grid
- Above-fold viewport 1: hero text + proof metrics + view toggle + 2 featured project cards
- Below-fold viewport 2: remaining project cards + stat pills + CTA
- Grid bleeds across fold boundary (no "illusion of completeness")

```
Viewport 1 (above fold):
┌──────────────────────┬──────────┐
│ Hero: name, title,   │ Depth    │
│ tagline, proof stats  │ Control  │
│ (repos, tests, years) │ + View   │
├──────────┬───────────┤ Toggle   │
│ Featured │ Featured  ├──────────┤
│ Project  │ Project   │ Persona  │
│ Card 1   │ Card 2    │ Quick    │
│ (large)  │ (large)   │ Links    │
├──────────┴───────────┴──────────┤
│ ... grid continues below fold ...│

Viewport 2 (below fold, still in 74% zone):
├──────────┬─────┬──────────┬─────┤
│ Project  │Stat │ Project  │Stat │
│ Card 3   │Pill │ Card 4   │Pill │
├──────────┼─────┼──────────┼─────┤
│ CTA /    │Proj │ Project  │Proj │
│ Consult  │ 5   │ Card 6   │ 7   │
└──────────┴─────┴──────────┴─────┘
```

### III-B: Bento Cell Components
- `BentoGrid.astro` — CSS grid container with auto-fit columns
- `BentoCell.astro` — individual cell with span controls
- `BentoProjectCard.astro` — project thumbnail + title + one-line impact + tech tags
- `BentoStatPill.astro` — compact metric (e.g., "105 repos", "527 tests")
- `BentoHero.astro` — hero content compressed into grid cell

### III-C: Mobile Degradation
- Below 768px: single column, cards stack vertically
- Bento becomes a dense list — still compact, not scrolly
- Stat pills inline as horizontal scroll strip

### III-D: Depth-Aware Bento
- At Overview: project cards show entry-level descriptions
- At Standard: cards show full descriptions with term highlights
- At Full: cards show full descriptions, clean reading
- The shibui lens already handles this — card descriptions are `<p>` elements tagged by the lens

### Dependencies
- None (can run in parallel with Phase II)

### Effort
- ~2-3 sessions

### GitHub Issue
- #52 (existing)

---

## Phase IV: Spatial Navigation

**Goal**: View transitions turn page navigation into spatial morphing. The portfolio feels like an app, not a website.

### IV-A: Card-to-Page Morph
- Add `view-transition-name` to each project card thumbnail
- On click: card morphs into the project page hero area
- Back navigation: reverse morph to grid position
- Uses Astro's built-in cross-document view transitions (zero JS)

### IV-B: Persistent Navigation Rail
- Replace hamburger menu with a compact sidebar/rail
- `transition:persist` keeps it fixed during navigation
- Depth control moves to the rail (always visible)
- Rail shows current section context (breadcrumb-like)

### IV-C: Sibling Navigation
- Project → Project navigation uses horizontal slide transition
- PrismNav component (already exists) gets `view-transition-name`
- Sibling links morph: "Next: AI Council" slides in from right

### IV-D: Reduced Motion
- All transitions respect `prefers-reduced-motion`
- Instant swaps replace morphs
- No animation, same spatial logic

### Dependencies
- Phase III (bento grid provides the card elements to morph)

### Effort
- ~1-2 sessions

---

## Phase V: Stranger Test

**Goal**: Validate that a recruiter landing from LinkedIn understands the value in 7 seconds.

### V-A: Stranger Test Protocol
- Recruit 5 participants (2 recruiters, 2 engineers, 1 general)
- Each visits the portfolio cold (no briefing)
- Record: time to first meaningful action, scroll depth, depth control usage
- Score: can they answer "what does this person do?" after 30 seconds?
- Target: ≥80% correct identification

### V-B: Heatmap Installation
- Install Microsoft Clarity (free, privacy-respecting)
- Track: scroll depth, click patterns, rage clicks, dead clicks
- Record session replays for qualitative analysis
- Run for 30 days post-redesign

### V-C: A/B Testing
- Variant A: current site (control)
- Variant B: bento grid + depth lens (treatment)
- Measure: bounce rate, time on site, pages per session, CTA clicks
- Run via URL parameter (`?variant=b`) or cookie-based split

### V-D: Iteration
- Review stranger test results → identify failure points
- Tune entry text quality (Phase II feedback loop)
- Adjust bento layout (Phase III feedback loop)
- Re-run stranger test until ≥80%

### Dependencies
- Phase III (bento grid) + Phase II (lens refinement)

### Effort
- ~1 session setup + 2-4 weeks data collection + 1 session analysis

### Omega Criteria Addressed
- H1: Stranger test score ≥80% (criterion 4)
- H5: Portfolio with external validation (criterion 15, in_progress → met)

---

## Phase VI: Revenue + Community + Recognition

**Goal**: Fill the remaining omega criteria that aren't code work.

### VI-A: Revenue Activation (H3)
- Stripe integration for ORGAN-III products (issue #16)
- Consult worker (already built: `workers/consult-api/`) wired to payment flow
- Mark revenue_status: live in omega scorecard
- Calculate MRR floor

### VI-B: Community Events (H4)
- Host 2 salon/reading-group events (GitHub Discussions + Discord)
- Document event outcomes in community-infrastructure repo
- Seed 5 good-first-issues across repos for external contributions
- Track: ≥3 external contributions

### VI-C: Recognition Events (H5)
- Submit conference proposal (1 pending)
- Follow up on grant applications (NLnet, Creative Capital)
- Track: ≥1 recognition event (accepted talk, grant award, feature)

### VI-D: Runbook Validation (H1)
- Write operational runbooks for deployment, incident response, content updates
- Have second operator validate (bus factor >1)

### Dependencies
- Phase V (stranger test validates the portfolio works before seeking recognition)

### Effort
- Ongoing (not session-bounded, real-world events)

### Omega Criteria Addressed
- H1: Runbooks validated (criterion 5)
- H3: Revenue live (criterion 10), MRR (criterion 11)
- H4: Events (criterion 12), contributions (criterion 13)
- H5: Recognition (criterion 16), bus factor (criterion 17)

---

## Phase VII: Perpetual Rebirth

**Goal**: The system runs itself. Zero-maintenance content adaptation. Domus Semper Palingenesis.

### VII-A: Auto-Depth on Publish
- When new content is committed, the rehype lens processes it automatically
- No manual ShibuiContent wrapping needed — the lens IS the depth system
- New essays get depth treatment at build time with zero author effort
- Vocabulary auto-expands: new TF-IDF terms trigger definition generation

### VII-B: Quality Self-Monitoring
- Scheduled CI run (daily 9:17 UTC, already configured)
- Add: shibui lens quality metrics to CI artifacts
- Track: average complexity score, term coverage, entry text BLEU score
- Alert: if average complexity increases (content drift toward jargon)

### VII-C: Drift Detection
- Monthly comparison: current entry text vs previous month
- Flag: pages where complexity increased >0.1 since last measurement
- Auto-regenerate entry text for drifted pages
- Store complexity history in `.quality/shibui-metrics.json`

### VII-D: Automated Vocabulary Maintenance
- LaunchAgent or cron: re-run `shibui-build-vocab.mjs` weekly
- Diff new vocabulary against current: flag new terms needing definitions
- LLM-assisted definition generation for new terms
- Human review gate: definitions queued in PR, not auto-merged

### VII-E: Self-Healing Deploy
- chezmoi + domus daemon already auto-apply dotfile changes
- Portfolio deploy: quality.yml success → deploy.yml triggers automatically
- Add: rollback on Lighthouse regression (performance gate)
- Add: deploy notification to Slack/Discord

### Dependencies
- Phase II (lens quality must be high enough to trust automated output)

### Effort
- ~1-2 sessions for automation scripts + ongoing maintenance

---

## Dependency Graph

```
Phase I (SHIPPED) ──┬──→ Phase II (Lens Refinement)
                    │         │
                    │         ├──→ Phase V (Stranger Test)
                    │         │         │
                    ├──→ Phase III (Bento Grid) ──→ Phase IV (Spatial Nav)
                    │         │                         │
                    │         └────────→ Phase V ───────┘
                    │                         │
                    │                    Phase VI (Revenue/Community)
                    │                         │
                    └──→ Phase VII (Perpetual Rebirth) ←──┘
```

**Critical path**: I → III → IV → V → VI
**Parallel track**: I → II → V (lens refinement can run alongside bento work)

---

## Omega Scorecard Projection

| Phase | Criteria Addressed | Running Total |
|---|---|---|
| Current | 7/17 | 7/17 (41%) |
| Phase V | +2 (stranger test, external validation) | 9/17 (53%) |
| Phase VI-A | +2 (revenue live, MRR) | 11/17 (65%) |
| Phase VI-B | +2 (events, contributions) | 13/17 (76%) |
| Phase VI-C/D | +4 (recognition, bus factor, runbooks) | 17/17 (100%) |

---

## Session Persistence Contract

This document IS the roadmap. Any session can:
1. Read this file to know where we are
2. Check the "Current State" section for what's shipped
3. Pick up the next phase in dependency order
4. Update the "Status" field at the top when phases complete

Nothing is lost between sessions. The roadmap persists in the repo.

---

*Last updated: 2026-03-25 by Session S36*
