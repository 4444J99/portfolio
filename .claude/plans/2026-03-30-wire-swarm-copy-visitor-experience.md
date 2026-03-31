# Wire Swarm Copy Into Visitor Experience

## Context

Four sessions built the Shibui depth system infrastructure. Nothing is wired to the visitor's experience. The swarm generated copy sits in `scripts/swarm-output/gemini-copy/` — onboarding panel text, bridge button labels, hero variants, LinkedIn post. Every piece exists. None of it is live. A recruiter arriving today sees placeholder onboarding copy, generic "This section goes deeper →" bridge buttons (with a double-arrow CSS bug), and the same hero subtitle from before the depth system existed. One chance at the onboarding panel before localStorage locks it forever.

This plan wires the copy. No new infrastructure. No new components. Find-and-replace with surgical precision.

---

## Phase 1: Onboarding Panel — Two-Line Cards

**File:** `src/components/shibui/ShibuiOnboarding.astro`

### 1.1 Replace card descriptions (lines 20, 32, 45)

Current → New:

| Card | Current `card-desc` | New `card-desc` | New `card-audience` |
|------|-------------------|-----------------|-------------------|
| Overview | "Simple and clear. For quick browsing." | "Plain language. No jargon. Quick scan for busy readers." | "Recruiters. Hiring managers. Anyone who wants the gist in 30 seconds." |
| Standard | "Full text with highlighted concepts. For curious readers." | "Full text with highlighted concepts. Domain terms get inline definitions." | "Curious readers. Fellow engineers. Technical recruiters who want depth." |
| Full | "Everything, unfiltered. For specialists." | "Complete academic treatment. Full citations. No simplification." | "Fellow principals and staff engineers. Researchers. Anyone evaluating deep technical work." |

### 1.2 Add audience span element

After each `.shibui-onboarding__card-desc`, add:
```html
<span class="shibui-onboarding__card-audience">{audience text}</span>
```

### 1.3 Add CSS for `.shibui-onboarding__card-audience`

In the `<style is:global>` block, after `.shibui-onboarding__card-desc` rules (~line 240):
```css
.shibui-onboarding__card-audience {
  font-size: 0.7rem;
  color: var(--text-muted, #707070);
  font-style: italic;
  line-height: 1.4;
  text-align: center;
}
```

**Tests affected:** None. No tests reference onboarding copy.

---

## Phase 2: Hero Copy — Variant A

### 2.1 HeroBentoCell (above-fold homepage)

**File:** `src/components/home/HeroBentoCell.astro`

Replace engineering subtitle (line 30-32):
```
Current: "I design AI systems that manage themselves — building the infrastructure
         that lets teams scale without scaling headcount."
New:     "15 years building systems that build themselves. 105 repositories, 527 tests,
         270K words of docs — and now I build autonomous creative systems."
```

Note: Creative subtitle (line 33-34) stays unchanged.

### 2.2 HeroSection (depth-aware hero on deeper pages)

**File:** `src/components/home/HeroSection.astro`

**a)** Replace `engineeringTitle` constant (line 29-30):
```
Current: "AI Orchestration Architect building model-agnostic swarms and
          enterprise-grade distributed backends."
New:     "AI Orchestration Architect designing systems that orchestrate themselves.
          No micromanagement. Just systems that evolve."
```

**b)** Replace entry slot `<h1>` (line 52):
```
Current: "I design AI systems that manage themselves — building the infrastructure
          that lets teams scale without scaling headcount."
New:     "15 years building systems that build themselves. I design AI agents that
          orchestrate themselves — no micromanagement, just systems that evolve."
```

**Tests affected:** None. No tests reference hero copy strings.

---

## Phase 3: Bridge Button System Upgrade

### 3.1 Fix double-arrow bug + add label map

**File:** `src/components/shibui/DepthControl.astro` (lines 130-154)

**a)** Add label lookup map and helper inside `<script>`:
```typescript
const BRIDGE_LABELS: Record<string, string> = {
  architecture: 'See the architecture',
  evidence: 'Read the evidence',
  details: 'View technical details',
  implementation: 'Explore the implementation',
  code: 'Dive into the code',
  dataflow: 'Trace the data flow',
  system: 'Inspect the system',
  logic: 'Unpack the logic',
  analysis: 'Access the full analysis',
  spec: 'Open the specification',
};
const DEFAULT_BRIDGE = 'See the full picture';

function bridgeText(btn: HTMLButtonElement): string {
  const label = btn.dataset.shibuiBridgeLabel;
  return (label && BRIDGE_LABELS[label]) || DEFAULT_BRIDGE;
}
```

**b)** Change collapse text (line 138): replace `'This section goes deeper \u2192'` with `bridgeText(btn)` — no arrow in text since CSS `::after` handles it.

**c)** Change expand text (line 141): replace `'Show less \u2190'` with `'Show less'` — same reason.

### 3.2 Remove HTML arrows from all bridge buttons

**Files:** All 21 project pages + `HeroSection.astro` + `about.astro` (23 files)

Mechanical find-and-replace across all `.astro` files:
```
Old: >This section goes deeper &#8594;</button>
New: >This section goes deeper</button>
```

The CSS `::after { content: "\2192" }` (global.css line 441) already renders the arrow. Removing the HTML arrow fixes the double-arrow bug.

### 3.3 Add contextual labels to top 10 pages

Add `data-shibui-bridge-label="..."` to each bridge button in these pages, choosing label per section content:

| # | Page file | Buttons | Label assignment strategy |
|---|-----------|---------|--------------------------|
| 1 | `projects/recursive-engine.astro` | 8 | architecture, logic, system, spec |
| 2 | `projects/agentic-titan.astro` | 8 | system, implementation, architecture |
| 3 | `projects/eight-organ-system.astro` | 8 | architecture, system, spec |
| 4 | `projects/ai-conductor.astro` | 7 | system, dataflow, implementation |
| 5 | `projects/orchestration-hub.astro` | 6 | architecture, dataflow, system |
| 6 | `projects/metasystem-master.astro` | 7 | system, logic, architecture |
| 7 | `projects/org-architecture.astro` | 8 | architecture, spec, evidence |
| 8 | `projects/ai-council.astro` | 7 | logic, system, evidence |
| 9 | `home/HeroSection.astro` | 4 | evidence (all — hero bridges reveal proof) |
| 10 | `about.astro` | 6 | evidence, details, analysis |

Remaining 11 project pages get no labels — they use `DEFAULT_BRIDGE` ("See the full picture") via the JS fallback.

**Tests affected:** None. Adding `data-*` attributes and changing client-side JS text does not touch any tested surface. Manual verification required for expand/collapse behavior.

---

## Phase 4: Verification

### 4.1 Automated
```bash
npm run preflight    # lint + typecheck + build + test (496+ tests)
```

### 4.2 Manual checklist
1. Clear localStorage → verify two-line onboarding cards render with new copy
2. Choose each depth → verify dismiss works, localStorage persists
3. Homepage engineering subtitle shows Variant A text
4. Toggle Creative view → creative subtitle unchanged
5. Bridge buttons at overview depth show single arrow (not double)
6. Labeled page (e.g., recursive-engine) → bridge says "See the architecture" (not generic)
7. Unlabeled page → bridge says "See the full picture"
8. Click bridge to expand → text changes to "Show less"
9. Click bridge to collapse → contextual text returns
10. Navigate between pages → bridge state resets correctly

### 4.3 Visual review
Dev server screenshot of onboarding panel with new two-line cards — verify layout at desktop and mobile (640px breakpoint).

---

## Phase 5: External Actions (post-deploy, not code)

- **Plausible:** Script already loads (`Layout.astro:67`, domain `4444j99.github.io`). Verify account exists at plausible.io. If not, register. No code change needed.
- **LinkedIn:** Post content from `scripts/swarm-output/gemini-copy/linkedin-depth-system.md`. Manual paste.

---

## Files Modified (summary)

| File | Changes | Risk |
|------|---------|------|
| `src/components/shibui/ShibuiOnboarding.astro` | 3 desc replacements + 3 audience spans + CSS | None |
| `src/components/home/HeroBentoCell.astro` | 1 subtitle replacement | None |
| `src/components/home/HeroSection.astro` | 1 constant + 1 entry slot | None |
| `src/components/shibui/DepthControl.astro` | Label map + helper + collapse/expand text | Low (behavioral) |
| 21 project pages + about.astro + HeroSection.astro | Remove `&#8594;` from button text | None |
| 10 pages (subset above) | Add `data-shibui-bridge-label` attributes | None |

**Total blast radius:** Very low. No existing test references any changed string. Only behavioral risk is bridge expand/collapse cycle — verified manually.

---

## Execution Strategy

Phases 1 and 2 are independent — parallelizable via subagents. Phase 3 depends on neither but is the largest (23+ files). Phase 4 is sequential after all code changes. Phase 5 is post-deploy.

Recommended agent assignment:
- **Agent A:** Phase 1 (onboarding) + Phase 2 (hero) — 3 files, mechanical
- **Agent B:** Phase 3.1 (DepthControl JS) + Phase 3.2 (HTML arrow cleanup) — 24 files, mechanical
- **Main thread:** Phase 3.3 (contextual labels) — requires reading each page to assign labels
- **Main thread:** Phase 4 verification after all agents complete
