# Academic Elevation Plan — Portfolio & Essays

## Context

The portfolio (Astro SSG) and public-process essays (Jekyll/GitHub Pages) currently contain strong content but lack academic rigor. The user — who holds an MFA in Creative Writing and BA in English Literature — wants every paragraph sourced with at least one citation and a visual element (diagram, p5.js animation, code structure, figure) between every paragraph. Different content locations (portfolio project pages, essays, case studies) demand different template/stylesheet definitions.

**Current inventory:**
- 20 portfolio project pages: 12 thin (~35 lines, 3 paragraphs), 2 medium (~95 lines, 6 paragraphs), 6 upgraded (~130-187 lines, 8-12 paragraphs)
- 10 essays in `organvm-v-logos/public-process` (Jekyll markdown, ~5,000 words each)
- 6 existing p5.js sketches, existing CSS design system with stat-grid/architecture-diagram/table patterns

**Estimated scope:** ~108 paragraphs across portfolio pages + ~500 paragraphs across essays = ~600+ citations and ~600+ visual elements needed.

---

## Phase 1: Component Infrastructure

**Goal:** Build the reusable Astro components and CSS that all subsequent content elevation depends on.

### 1A. Citation & References Components

**New file:** `src/components/academic/Cite.astro`
- Props: `id: number`, `author: string`, `title: string`, `source: string`, `year: string | number`, `url?: string`
- Renders superscript `[n]` with `<a href="#ref-n">` linking to bibliography
- Stores reference data as `data-*` attributes for the References component to collect

**New file:** `src/components/academic/References.astro`
- Props: `entries: Array<{ id, author, title, source, year, url? }>`
- Renders a numbered bibliography at page bottom
- Styled as `<section class="references">` with hanging indent, monospaced numbers

### 1B. Visual Break Components

**New file:** `src/components/academic/Figure.astro`
- Props: `src?: string`, `alt: string`, `caption: string`, `number?: number`
- Renders `<figure>` with `<figcaption>` — for static images, SVGs, diagrams
- When no `src`, renders children (slot) as figure content — allows inline SVG or HTML diagrams

**New file:** `src/components/academic/CodeStructure.astro`
- Props: `lang: string`, `caption: string`, `filename?: string`
- Renders annotated code block with filename header and caption below
- Uses existing `<pre><code>` styling + adds filename badge and caption

**New file:** `src/components/academic/MermaidDiagram.astro`
- Props: `caption: string`, `chart: string`
- Renders Mermaid syntax via client-side `mermaid.init()` (lazy-loaded like p5.js)
- Dark theme config matching portfolio palette (`--bg-primary`, `--accent`, etc.)
- Fallback: `<noscript>` shows the raw diagram text

### 1C. Academic Stylesheet

**Edit file:** `src/styles/global.css`

Add academic sections:
```css
/* --- Academic: Citations --- */
.cite { /* superscript styling */ }
.references { /* bibliography with hanging indent */ }
.references li { /* numbered entries */ }

/* --- Academic: Figures --- */
figure.academic-figure { /* bordered, captioned */ }
figcaption { /* italic, centered, muted text */ }

/* --- Academic: Code Structure --- */
.code-structure { /* filename header + caption footer */ }
.code-structure__filename { /* tab-like header badge */ }
.code-structure__caption { /* descriptive text below code */ }

/* --- Academic: Mermaid --- */
.mermaid-container { /* dark-themed container */ }

/* --- Academic: Visual Break spacing --- */
.prose figure, .prose .mermaid-container, .prose .code-structure,
.prose .sketch-container, .prose .architecture-diagram {
  margin: var(--space-2xl) 0;
}
```

### 1D. New Parametric p5.js Sketches

Add 4 new configurable sketch types to the sketch system:

| Sketch ID | Purpose | Configurable via |
|-----------|---------|-----------------|
| `network-graph` | Nodes + edges for dependency/architecture graphs | `data-nodes`, `data-edges` attributes |
| `flow-diagram` | Sequential pipeline/state machine flow | `data-stages` attribute |
| `data-bars` | Animated bar chart for metrics/comparisons | `data-values`, `data-labels` attributes |
| `particle-field` | Abstract particle emergence (for conceptual topics) | `data-density`, `data-behavior` attributes |

**Edit file:** `src/components/sketches/sketch-loader.ts` — Register 4 new modules
**New files:** `src/components/sketches/{network-graph,flow-diagram,data-bars,particle-field}-sketch.ts`

These are parametric: same sketch code with different `data-*` attributes produces different visuals per page. Combined with the existing 6 sketches = 10 sketch types total.

### 1E. Mermaid Lazy Loader

**New file:** `src/components/academic/mermaid-loader.ts`
- IntersectionObserver pattern (matching sketch-loader.ts)
- Dynamically imports `mermaid` only when a `.mermaid-container` enters viewport
- Configures dark theme: `{ theme: 'dark', themeVariables: { primaryColor: '#c9a84c', ... } }`

### Verification
- `npm run build` succeeds with all new components
- Citation superscripts link to correct reference entries
- Mermaid diagrams render in dark theme
- New p5.js sketches initialize via data attributes
- All components respect `prefers-reduced-motion`

---

## Phase 2: Template Definitions for 3 Contexts

**Goal:** Define how the academic components compose differently across content types.

### 2A. Portfolio Project Template

**Purpose:** Standard project pages (the 14 non-flagship pages)

**Structure pattern:**
```
<ProjectDetail>
  <h2>Section Title</h2>
  <p>Paragraph with inline <Cite> references.</p>
  <Figure | MermaidDiagram | CodeStructure | SketchContainer />
  <p>Next paragraph with citations.</p>
  <Figure | ... />
  ...
  <References entries={[...]} />
</ProjectDetail>
```

**Visual element distribution per page (~8-10 paragraphs):**
- 1 Mermaid diagram (architecture or flow)
- 1-2 code structures (implementation detail)
- 1 table or stat-grid (data/comparisons)
- 1-2 figures (conceptual diagrams)
- 0-1 p5.js sketches (only on pages with strong conceptual hook)

### 2B. Flagship Case Study Template

**Purpose:** The 6 upgraded pages that already have rich content

**Extends 2A with additional required sections:**
- Abstract/thesis statement (opening paragraph with bold claim + citation)
- Architecture diagram (ASCII or Mermaid — at least one)
- Stat-grid (quantitative results)
- Tradeoffs section (honest assessment)
- p5.js sketch (at least one interactive visualization)
- References section (minimum 8-12 sources per page)

### 2C. Jekyll Essay Template

**Purpose:** The 10 essays in `organvm-v-logos/public-process`

**Different technology, different approach:**
- Citations: kramdown footnote syntax `[^1]` → `[^1]: Author, "Title," Source, Year. URL`
- Visual elements: Mermaid fenced code blocks (````mermaid`), HTML `<figure>` tags, code blocks
- No Astro components available — pure markdown + HTML + Jekyll includes

**Required changes to Jekyll site:**
- Add `mermaid.js` script tag to Jekyll layout (via `_includes/head-custom.html` or equivalent)
- Add academic CSS to Jekyll stylesheet for footnote styling, figure captions, code annotations
- Each essay gets: footnotes per paragraph + visual elements (Mermaid diagrams, code blocks, HTML figures)

---

## Phase 3: Flagship Case Study Elevation (6 pages)

**Goal:** Elevate the 6 already-upgraded pages to full academic standard. These are highest-impact.

**Pages and their current state:**

| Page | Lines | Current Elements | Needed |
|------|-------|-----------------|--------|
| `eight-organ-system.astro` | 187 | p5.js, table, ASCII, stat-grid, tradeoffs | Add citations (10-12), Mermaid diagram, 3-4 more visual breaks |
| `agentic-titan.astro` | 172 | p5.js, table, stat-grid, tradeoffs | Add citations (10-12), code structure, Mermaid flow, 3-4 more visual breaks |
| `recursive-engine.astro` | 147 | p5.js, code block, stat-grid, tradeoffs | Add citations (8-10), architecture Mermaid, 3-4 more visual breaks |
| `ai-conductor.astro` | 129 | p5.js, table, stat-grid, tradeoffs | Add citations (8-10), process Mermaid, code structure, 2-3 more visual breaks |
| `metasystem-master.astro` | 160 | ASCII diagram, table, stat-grid, tradeoffs | Add citations (8-10), p5.js or Mermaid, code structure, 2-3 more visual breaks |
| `orchestration-hub.astro` | 160 | ASCII diagram, table, stat-grid, tradeoffs | Add citations (8-10), Mermaid flow, code structure, 2-3 more visual breaks |

**Citation sources per domain:**
- **Systems architecture:** Conway's Law, Fred Brooks "Mythical Man-Month", Martin Fowler's patterns, Donella Meadows "Thinking in Systems"
- **Governance/orchestration:** Elinor Ostrom "Governing the Commons", James C. Scott "Seeing Like a State", Christopher Alexander "Pattern Language"
- **Generative art:** Casey Reas & Ben Fry "Processing", Manovich "Software Takes Command", Galanter "Generative Art Theory"
- **AI/agents:** Russell & Norvig "AIMA", Wooldridge "Multi-Agent Systems", Minsky "Society of Mind"
- **Creative practice:** Csikszentmihalyi "Creativity", Donald Schön "The Reflective Practitioner"
- **Software engineering:** Gamma et al. "Design Patterns", Fowler "Refactoring", McConnell "Code Complete"
- **Self-referential:** Link to actual repo READMEs, registry JSON, CI workflow runs

Each page import statement adds:
```astro
import Cite from '../../components/academic/Cite.astro';
import References from '../../components/academic/References.astro';
import Figure from '../../components/academic/Figure.astro';
import CodeStructure from '../../components/academic/CodeStructure.astro';
import MermaidDiagram from '../../components/academic/MermaidDiagram.astro';
```

### Verification
- `npm run build` succeeds (all 6 pages)
- Every paragraph has at least one `<Cite>` element
- Every paragraph has a visual element after it (or before the next paragraph)
- References section at bottom of each page renders correctly
- Superscript numbers link to correct entries

---

## Phase 4: Thin + Medium Page Elevation (14 pages)

**Goal:** Expand thin pages from ~3 paragraphs to 8-10 paragraphs each with citations and visual elements, then apply academic template to medium pages.

### 4A. Thin Page Expansion (12 pages)

Each page currently has ~3 paragraphs ("The Idea", "How It Works", "Why It Matters"). Expand to:
1. **Abstract** — Bold thesis with citation
2. **Problem Space** — What gap this addresses, with literature reference
3. **Architecture** — Technical approach, with Mermaid diagram
4. **Implementation** — Code structure showing key design patterns
5. **Key Design Decision** — Tradeoff analysis with citation
6. **Results / State** — Current status, metrics if available
7. **Related Work** — How this connects to other projects + external references
8. **References** — Bibliography (6-8 sources per page)

**Pages:** ai-council, block-warfare, life-my-midst-in, linguistic-atomization, org-architecture, the-actual-news, your-fit-tailored, knowledge-base, narratological-lenses, community-infrastructure, public-process, distribution-strategy

**Source material for expansion:** Each page links to a GitHub repo. Read the repo README via `gh api repos/{owner}/{repo}/readme` for architecture details, metrics, and technical content to cite.

### 4B. Medium Page Elevation (2 pages)

`generative-music.astro` and `aetheria-rpg.astro` already have 6+ paragraphs. Add:
- Citations to each existing paragraph
- Visual elements between paragraphs
- References section

### Verification
- All 20 project pages have `<References>` component
- No page has consecutive paragraphs without a visual break
- `npm run build` succeeds

---

## Phase 5: Essay Elevation (10 essays)

**Goal:** Add academic citations and visual elements to all 10 meta-system essays.

### 5A. Jekyll Site Infrastructure

**Push via GitHub API to `organvm-v-logos/public-process`:**
- Add mermaid.js to Jekyll layout (script tag or `_includes/head-custom.html`)
- Add academic CSS for footnotes, figures, code annotations
- Test locally if possible or validate via GitHub Pages build

### 5B. Essay Content Elevation

For each of 10 essays (~5,000 words, ~30 paragraphs each):
- Add kramdown footnotes: `[^n]` per paragraph → `[^n]: Full citation` at bottom
- Add visual elements between sections: Mermaid code blocks, HTML figures, code snippets
- Visual density target: 1 visual per 2-3 paragraphs (essays are denser text than portfolio pages)

**Essays and their citation domains:**

| Essay | Primary Citation Domain |
|-------|----------------------|
| 01 — How We Orchestrate Eight Organs | Organizational theory, systems thinking |
| 02 — Governance as Creative Practice | Ostrom, Alexander, institutional design |
| 03 — Meta-System as Portfolio Asset | Career theory, signaling, portfolio theory |
| 04 — Building in Public | Open source culture, transparency research |
| 05 — Five Years Autonomous Creative | Creative practice, autonomy, economic theory |
| 06 — Testing the Meta-System | Software testing, verification, formal methods |
| 07 — Documentation-Implementation Gap | Technical writing, knowledge management |
| 08 — Bronze to Platinum | Quality assurance, maturity models (CMMI) |
| 09 — AI Conductor Methodology | HCI, human-AI collaboration, prompt engineering |
| 10 — Uniform Quality at Scale | Standardization, manufacturing quality (Deming) |

### 5C. Push Updated Essays

Use `gh api repos/organvm-v-logos/public-process/contents/essays/meta-system/{filename} -X PUT` for each essay.

### Verification
- GitHub Pages rebuild succeeds
- Footnotes render correctly on https://organvm-v-logos.github.io/public-process/
- Mermaid diagrams render in dark theme
- RSS feed still valid

---

## Execution Order & Dependencies

```
Phase 1 (Infrastructure) ─── must complete first
    │
    ├──▶ Phase 2 (Templates) ─── defines patterns for all later phases
    │        │
    │        ├──▶ Phase 3 (6 Flagships) ─── highest impact, do first
    │        │
    │        ├──▶ Phase 4 (14 Remaining) ─── bulk content work
    │        │
    │        └──▶ Phase 5 (10 Essays) ─── different tech stack, independent
```

Phase 3, 4, and 5 can execute in parallel once Phase 2 is done.

## Execution Constraints

- `public/` in global gitignore → `git add -f` for public/ files
- `GIT_LFS_SKIP_PUSH=1` needed for 4444J99 repo pushes
- `metasystem-master` uses `master` branch, not `main`
- 16GB RAM → avoid spawning many parallel processes
- Portfolio uses `base: '/portfolio'` → all internal links need this prefix
- Essays are in a separate repo (`organvm-v-logos/public-process`) — push via GitHub API
- Creating bespoke p5.js sketches for every visual break is impractical — use parametric sketches + Mermaid + code structures + figures for variety

## Critical File Paths

| File | Purpose |
|------|---------|
| `~/Workspace/portfolio/src/components/academic/Cite.astro` | NEW — Citation superscript |
| `~/Workspace/portfolio/src/components/academic/References.astro` | NEW — Bibliography |
| `~/Workspace/portfolio/src/components/academic/Figure.astro` | NEW — Captioned figure |
| `~/Workspace/portfolio/src/components/academic/CodeStructure.astro` | NEW — Annotated code block |
| `~/Workspace/portfolio/src/components/academic/MermaidDiagram.astro` | NEW — Mermaid renderer |
| `~/Workspace/portfolio/src/components/academic/mermaid-loader.ts` | NEW — Lazy Mermaid init |
| `~/Workspace/portfolio/src/components/sketches/sketch-loader.ts` | EDIT — Register 4 new sketches |
| `~/Workspace/portfolio/src/components/sketches/*-sketch.ts` | NEW — 4 parametric sketches |
| `~/Workspace/portfolio/src/styles/global.css` | EDIT — Academic CSS sections |
| `~/Workspace/portfolio/src/pages/projects/*.astro` | EDIT — All 20 project pages |
| Remote: `organvm-v-logos/public-process/essays/meta-system/*.md` | EDIT — All 10 essays |
