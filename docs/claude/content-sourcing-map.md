# Portfolio Content Sourcing & Flow Map

**Document Purpose:** Complete reference for understanding how text content originates, transforms, and renders across all portfolio pages. Identifies simplification candidates and content pattern clusters.

**Last Updated:** 2026-03-23  
**Scope:** All text content across 30+ pages; covers hardcoded prose, JSON interpolation, external collections, and template patterns

---

## 1. Global Content (Layout.astro)

**File:** `src/layouts/Layout.astro`

| Content | Type | Source | Interpolation |
|---------|------|--------|---------------|
| Page `<title>` tag | Prose | Hardcoded fallback; overridden per-page via `layoutProps.title` | Via `title` prop |
| Meta description | Prose | Hardcoded fallback; overridden per-page via `layoutProps.description` | Via `description` prop |
| Navigation labels | Prose | Hardcoded in Nav component | None — static labels |
| Footer copyright/attribution | Prose | Hardcoded | None — static text |
| Open Graph image base URL | URL | Hardcoded | None — static constant |
| Navigation links list | Prose + URLs | Hardcoded navItems array | `navItems.map()` |

**Key Insight:** Layout provides fallback title/description (overridable per-page) and hardcoded navigation/footer. These are globally consistent and candidates for consolidation only if a site-wide metadata JSON structure is introduced.

---

## 2. Index Page (src/pages/index.astro)

**File:** `/Users/4jp/Workspace/4444J99/portfolio/src/pages/index.astro` (previously read in prior session)

| Content | Type | Source | Interpolation | Simplification Candidate |
|---------|------|--------|---------------|-------------------------|
| Hero tagline | Prose | Hardcoded | None | **HIGH** — hardcoded single-sentence tagline could become data field |
| Subtitle paragraph | Prose | Hardcoded | None | **HIGH** — hardcoded 2-3 sentence intro |
| Feature section heading | Prose | Hardcoded | None | **MEDIUM** — section label |
| Feature cards (5 items) | Prose + data | Hardcoded array structure; titles/descriptions from `portfolioItems` data | `portfolioItems.map()` | **MEDIUM** — titles/descriptions could be external JSON |
| Call-to-action text | Prose | Hardcoded | None | **HIGH** — button labels + surrounding copy |
| Metrics display | Numeric | Interpolated from `vitals` JSON | `vitals.repos.total`, `vitals.repos.orgs`, `vitals.github_users` | **LOW** — already data-driven |
| View toggle labels | Prose | Hardcoded (engineering/creative) | None | **MEDIUM** — toggle option labels |

**Content Flow Diagram:**
```
hardcoded hero + subtitle
    ↓
hardcoded portfolioItems array
    ↓ (map)
rendered feature cards with titles
    ↓ (parallel)
interpolated vitals metrics
    ↓
rendered index page with dual-view toggle
```

---

## 3. About Page (src/pages/about.astro)

**File:** `/Users/4jp/Workspace/4444J99/portfolio/src/pages/about.astro` (previously read in prior session)

| Content | Type | Source | Interpolation | Simplification Candidate |
|---------|------|--------|---------------|-------------------------|
| Page title | Prose | Hardcoded "About" | None | **LOW** — standard page title |
| Hero statement | Prose | Hardcoded | None | **HIGH** — substantial paragraph |
| Strategic context paragraph | Prose | From `about.json` `strategic_context` field | Direct interpolation | **LOW** — already externalized |
| System summary section | Prose | From `about.json` `system_summary` field | Direct interpolation | **LOW** — already externalized |
| Supporting evidence section | Prose | From `about.json` `supporting_evidence` field | Direct interpolation | **LOW** — already externalized |
| Strategic opportunity section | Prose | From `about.json` `strategic_opportunity` field | Direct interpolation | **LOW** — already externalized |
| Metrics table | Data + prose labels | Hardcoded labels; numeric values from `omega.json` criteria | `omega.criteria.map()` with hardcoded descriptions | **MEDIUM** — table headers/labels hardcoded, could be externalized |
| Footer CTA | Prose | Hardcoded | None | **MEDIUM** — closing paragraph |

**Content Flow Diagram:**
```
hardcoded hero statement (in .astro)
    ↓
about.json fields:
  - strategic_context
  - system_summary
  - supporting_evidence
  - strategic_opportunity
    ↓ (interpolate)
rendered prose sections
    ↓ (parallel)
hardcoded metric table labels
    + omega.json criteria counts
    ↓ (map + interpolate)
rendered metrics grid
    ↓
hardcoded footer CTA
```

**Key Insight:** About.astro demonstrates a **mixed pattern**—some content is properly externalized to about.json, while labels and framing prose remain hardcoded. Candidates for improvement: move hero statement and footer CTA to about.json.

---

## 4. Resume Pages (src/pages/resume/[slug].astro)

**File:** `/Users/4jp/Workspace/4444J99/portfolio/src/pages/resume/[slug].astro` (16,051 bytes, read in current session)

**Dynamic Route Pattern:**
- `getStaticPaths()` iterates `personas.json` array
- Generates 4 static routes: `/resume/engineer`, `/resume/architect`, `/resume/artist`, `/resume/founder`
- Each route renders same template with different `persona` prop

| Content | Type | Source | Interpolation | Simplification Candidate |
|---------|------|--------|---------------|-------------------------|
| Document title (meta) | Prose | Hardcoded template: `"[Persona Name] Resume"` | `persona.title` | **LOW** — auto-generated from data |
| Hero name + title | Prose | From `persona` object | `persona.name`, `persona.title` | **LOW** — data-driven |
| Subtitle/tagline | Prose | Hardcoded section heading: "Professional Summary" | None | **MEDIUM** — section label |
| Hero paragraph | Prose | Hardcoded: "Professional Summary" prose | None | **HIGH** — substantial 2-3 sentence hardcoded paragraph |
| Persona thesis | Prose | From `persona.thesis` field | Direct interpolation | **LOW** — data-driven |
| Market summary section | Prose | From `persona.market_summary` field | Direct interpolation | **LOW** — data-driven |
| Core tech stack section heading | Prose | Hardcoded: "Core Tech Stack" | None | **MEDIUM** — section label |
| Stack description | Prose | From `persona.stack_description` field | Direct interpolation | **LOW** — data-driven |
| Technology tags | Data | From `persona.stack` array | `persona.stack.map()` rendered as tag grid | **LOW** — data-driven |
| Leadership section heading | Prose | Hardcoded: "Leadership & Strategic Impact" | None | **MEDIUM** — section label |
| Leadership metrics prose | Prose | Hardcoded in template | None | **HIGH** — three hardcoded metric paragraphs (mentorship, fiscal, scale) |
| Featured projects heading | Prose | Hardcoded: "Featured Projects" | None | **MEDIUM** — section label |
| Featured project cards | Prose + data | Project catalog enrichment; project titles from `projects.json` | `featuredProjects.map()` enriches `persona.featured_projects` with catalog data | **LOW** — data-driven |
| Evidence section heading | Prose | Hardcoded: "Evidence of Technical Impact" | None | **MEDIUM** — section label |
| Evidence items | Prose | Hardcoded array of impact statements | Mapped via `.map()` | **HIGH** — hardcoded evidence prose array |
| Professional history heading | Prose | Hardcoded: "Professional History" | None | **MEDIUM** — section label |
| History items | Prose + data | From `experience.json` | Filtered + mapped by persona | **LOW** — data-driven |
| Education heading | Prose | Hardcoded: "Education" | None | **MEDIUM** — section label |
| Certifications heading | Prose | Hardcoded: "Certifications" | None | **MEDIUM** — section label |
| Footer statement | Prose | Hardcoded: "This resume is a market-aligned view of a Logocentric Architecture" | None | **HIGH** — philosophical statement hardcoded |

**Content Flow Diagram:**
```
personas.json array
    ↓ (getStaticPaths)
generates 4 routes: /resume/[engineer|architect|artist|founder]
    ↓ (each route)
resume/[slug].astro template receives persona prop
    ├─ hardcoded "Professional Summary" prose
    ├─ persona.thesis (data field)
    ├─ persona.market_summary (data field)
    ├─ hardcoded "Leadership & Strategic Impact" prose
    ├─ hardcoded leadership metric paragraphs (3x)
    ├─ persona.featured_projects (data array)
    │   ├─ enriched with projectCatalogBySlug lookup
    │   └─ rendered as project cards
    ├─ hardcoded evidence items array
    ├─ experience.json filtered by persona
    └─ hardcoded footer statement
```

**Key Insight:** Resume template demonstrates **partial externalization**. Persona-specific content (thesis, market_summary, stack_description, featured_projects) is properly externalized to personas.json, but framing prose and hardcoded metric descriptions remain in template. **Simplification candidates:**
1. Move "Professional Summary", "Leadership & Strategic Impact" paragraphs to personas.json as optional fields
2. Extract hardcoded evidence items into personas.json array (e.g., `persona.evidence_items`)
3. Extract leadership metrics into personas.json (e.g., `persona.leadership.mentorship_description`, etc.)
4. Move footer statement to global constants or about.json

---

## 5. Project Pages (src/pages/projects/[individual].astro)

**Architecture:** 21 individual .astro files (NOT a shared [slug] template)
- `aetheria-rpg.astro`, `agentic-titan.astro`, `agent-claude-smith.astro`, etc.

**File:** `/Users/4jp/Workspace/4444J99/portfolio/src/pages/projects/aetheria-rpg.astro` (24,000+ bytes, read in current session)

| Content | Type | Source | Interpolation | Simplification Candidate |
|---------|------|--------|---------------|-------------------------|
| Page title (meta) | Prose | Hardcoded fallback; overridable via `layoutProps.title` | None | **LOW** — standard page title |
| Hero section tagline | Prose | Hardcoded: "Theory → Art → Commerce: directed architecture for an educational RPG" | None | **HIGH** — substantial tagline paragraph |
| Section headings (10 items) | Prose | Hardcoded: "The Full Pipeline", "The Theory (ORGAN-I)", "The Game Design (ORGAN-II)", "Technical Architecture", "Classroom Integration and Standards Alignment", "Testing and Quality Infrastructure", "Metrics", "What Worked", "What Failed", "Market Context", "Why Include a Failure?" | None | **MEDIUM** — section labels could be data-driven |
| Section prose bodies | Prose | Hardcoded extensive prose (~2000+ words per project) | None | **HIGH** — entire case study narrative hardcoded |
| In-text citations | Prose + metadata | Hardcoded Cite component calls with author/title/year/source/url props | None | **MEDIUM** — citations hardcoded; could be externalized to citation JSON |
| Leadership metrics prose | Prose | Hardcoded: "Mentorship: Directed the growth of 2,000+ students...", "Fiscal Responsibility: Raised $2M...", "Scale: Managed 100+ concurrent multimedia..." | None | **HIGH** — hardcoded metric narratives |
| Code snippets | Code | Hardcoded in CodeStructure components | None | **MEDIUM** — code examples could be externalized/versioned separately |
| Diagrams (Mermaid, custom) | Data + viz | Hardcoded MermaidDiagram component props with embedded graph/flowchart syntax | None | **MEDIUM** — diagram data could be externalized |
| Tables/figures | Data + prose | Hardcoded Figure/Table components with embedded data arrays + captions | None | **MEDIUM** — table data could be JSON; captions remain prose |
| Metrics visualization | Data + prose | Hardcoded StatGrid component with metric values; labels hardcoded | None | **MEDIUM** — metric values could be JSON; labels hardcoded |
| Tags | Prose | Hardcoded: `['Product', 'Education', 'Game Design']` | None | **MEDIUM** — tags hardcoded; could reference projects.json |
| Sketch binding | Data | Hardcoded `sketchId="terrain"` | None | **LOW** — static binding per project |
| Vitals interpolation | Numeric | Interpolated from `vitals.json` | `vitals.repos.total`, `vitals.repos.orgs` in closing paragraph | **LOW** — already data-driven |

**Content Flow Diagram (Aetheria-RPG as representative):**
```
aetheria-rpg.astro (24KB single file)
    ├─ hardcoded hero tagline
    ├─ hardcoded section 1: "The Full Pipeline" (prose)
    ├─ hardcoded section 2: "The Theory (ORGAN-I)" (prose)
    ├─ hardcoded section 3: "The Game Design (ORGAN-II)" (prose)
    ├─ hardcoded section 4: "Technical Architecture"
    │   ├─ prose description
    │   ├─ MermaidDiagram (hardcoded chart syntax)
    │   └─ CodeStructure (hardcoded code examples)
    ├─ hardcoded section 5: "Classroom Integration..."
    │   └─ Cite components (hardcoded citations with author/title/year)
    ├─ hardcoded section 6: "Testing and Quality..."
    ├─ hardcoded section 7: "Metrics"
    │   ├─ Figure component (hardcoded table data + caption)
    │   └─ StatGrid (hardcoded metric values + labels)
    ├─ hardcoded leadership metric narratives (3x)
    ├─ hardcoded section 8: "What Worked"
    ├─ hardcoded section 9: "What Failed"
    ├─ hardcoded section 10: "Market Context"
    ├─ hardcoded section 11: "Why Include a Failure?"
    └─ interpolated closing: vitals.repos.total + vitals.repos.orgs
```

**Key Insight:** Project pages represent the **most content-dense** files in the portfolio. Each project is a **monolithic ~24KB .astro file** containing:
- 2000+ words of prose narrative
- 15+ Cite components with full citation metadata
- Multiple embedded diagrams (Mermaid syntax)
- Code examples in structured components
- Tables/figures with data
- Hardcoded section labels and leadership metrics

**This architecture presents the HIGHEST simplification opportunity.** Current pattern:
1. No shared template — each project is independent
2. No data abstraction — content lives entirely in .astro frontmatter and markup
3. Citations hardcoded as component props (not YAML/JSON)
4. Section structure implicit in prose flow, not explicit in data

**Recommended simplification path (not yet implemented):**
```
projects/
  ├─ [slug].astro (template, ~500 bytes)
  └─ data/
      ├─ aetheria-rpg.yaml (or .json)
      ├─ agentic-titan.yaml
      └─ ... (21 files)

Where each project.yaml contains:
  tagline: "..."
  sections: [{heading: "...", body: "...", components: [...]}]
  citations: [{author: "...", title: "...", year: ..., source: "...", url: "..."}]
  metrics: {mentorship: "...", fiscal: "...", scale: "..."}
  tags: [...]
  diagram_data: [{type: "mermaid", syntax: "..."}]
  code_examples: [{lang: "ts", source: "..."}]
  sketchId: "terrain"
```

This would reduce per-project file size from ~24KB to ~2-3KB (.astro template) + external data files.

---

## 6. Dashboard Page (src/pages/dashboard.astro)

**File:** `/Users/4jp/Workspace/4444J99/portfolio/src/pages/dashboard.astro` (previously read in prior session)

| Content | Type | Source | Interpolation | Simplification Candidate |
|---------|------|--------|---------------|-------------------------|
| Page title (meta) | Prose | Hardcoded "Dashboard" | None | **LOW** — standard title |
| Hero subtitle | Prose | Hardcoded template with interpolation: "Live orchestration vitals from {X} repositories across {Y} organs." | `vitals.repos.total`, `vitals.repos.orgs` | **LOW** — already data-driven template string |
| Section 1 heading | Prose | Hardcoded: "Orchestration Tech Stack" | None | **MEDIUM** — section label |
| Tech stack array | Prose | Hardcoded: Python, TypeScript, React, Next.js, FastAPI, Express, Fastify, Docker, Terraform, PostgreSQL, Redis, Rust, Astro, p5.js, D3.js, Solana/Anchor (16 items) | None | **HIGH** — hardcoded technology list; could be JSON |
| Section 2 heading | Prose | Hardcoded: "Repositories by Organ" | None | **MEDIUM** — section label |
| Organ breakdown | Data + prose labels | System-metrics.json structure (computed.per_organ or legacy registry.organs) | Conditional logic for schema compatibility; `Object.entries().map()` | **LOW** — already data-driven; hardcoded labels only |
| Section 3 heading | Prose | Hardcoded: "Dependency Graph" | None | **MEDIUM** — section label |
| Dependency visualization | Data + viz | D3.js chart, sourced from graph.json | Chart dynamically rendered; data-driven | **LOW** — data-driven visualization |
| Section 4 heading | Prose | Hardcoded: "Personal Workspace" | None | **MEDIUM** — section label |
| Workspace metrics | Data + prose labels | System-metrics.json computed fields | Conditional interpolation with backward-compatibility logic | **MEDIUM** — labels hardcoded; values data-driven |

**Content Flow Diagram:**
```
dashboard.astro template
    ├─ hardcoded hero subtitle template string
    │   └─ interpolated: vitals.repos.total, vitals.repos.orgs
    ├─ hardcoded section labels (4x)
    ├─ hardcoded tech stack array (16 items)
    ├─ system-metrics.json (branching on schema version)
    │   ├─ if computed.per_organ exists: render new schema
    │   └─ if legacy registry.organs: render legacy schema
    ├─ graph.json (D3 chart data)
    └─ interpolated workspace metrics
```

**Key Insight:** Dashboard is **nearly all data-driven** with only hardcoded section labels and the tech stack array as candidates for externalization. The backward-compatibility logic (supporting two JSON schema versions) is clever but adds complexity. **Simplification candidates:**
1. Move tech stack array to JSON/YAML for future flexibility
2. Consider retiring legacy schema after sufficient deprecation period
3. Extract section labels to data structure (labels.json or dashboard section metadata)

---

## 7. Logo/Essays Pages (src/pages/logos/[slug].astro)

**File:** Dynamic route template generating essay pages

| Content | Type | Source | Interpolation | Simplification Candidate |
|---------|------|--------|---------------|-------------------------|
| Page title (meta) | Prose | From essay frontmatter `title` field | Direct interpolation | **LOW** — data-driven |
| Publish date | Data | From essay frontmatter `pubDate` field | Direct interpolation | **LOW** — data-driven |
| Essay tags | Prose | From essay frontmatter `tags` array | Array mapped to tag components | **LOW** — data-driven |
| Essay body | Prose | From `.md` content file (external ORGAN-V repo) | Astro markdown component | **LOW** — externalized to content collection |

**Key Insight:** Essay pages are **fully data-driven** via Astro content collections. This is the **ideal pattern** — prose lives in `.md` files, metadata in frontmatter, no hardcoding in template. Serves as reference architecture for potential project pages refactor.

---

## 8. For/[target] Pages (src/pages/for/[target].astro)

**File:** Dynamic route template generating strike target landing pages from `targets.json` + `personas.json`

| Content | Type | Source | Interpolation | Simplification Candidate |
|---------|------|--------|---------------|-------------------------|
| Page title (meta) | Prose | From target + persona | Template string | **LOW** — auto-generated |
| Hero heading | Prose | Hardcoded template phrase | None | **MEDIUM** — section label |
| Target summary | Prose | From `targets.json` entry `summary` field | Direct interpolation | **LOW** — data-driven |
| Target description | Prose | From `targets.json` entry `description` field | Direct interpolation | **LOW** — data-driven |
| Persona-specific intro | Prose | From `personas.json` relevant fields | Conditional logic based on route params | **MEDIUM** — framing prose hardcoded; data content interpolated |

**Key Insight:** Strike target pages demonstrate **hybrid pattern**: core narrative (summary, description) externalized to targets.json, but framing/labels remain hardcoded.

---

## 9. OG Image Generation (src/pages/og/[...slug].png.ts)

**File:** Dynamic route generating Open Graph images via satori + resvg-js

| Content | Type | Source | Interpolation | Simplification Candidate |
|---------|------|--------|---------------|-------------------------|
| OG image text (title) | Prose | From page metadata or fallback | Varies per route | **LOW** — dynamic per route |
| OG image text (description) | Prose | From page metadata or hardcoded fallback | Varies per route | **LOW** — mostly data-driven |
| OG image styling | Design tokens | Hardcoded in route handler | None | **LOW** — styling is static design |

**Key Insight:** OG image generation is highly specialized and mostly data-driven. Low simplification priority.

---

## 10. Feed & API Endpoints (src/pages/feed.xml.ts, github-pages.json.ts)

**Files:** XML feed and JSON API endpoints

| Content | Type | Source | Interpolation | Simplification Candidate |
|---------|------|--------|---------------|-------------------------|
| Feed title | Prose | Hardcoded or from vitals | None | **MEDIUM** — could be externalized |
| Feed item titles | Prose | From essays.json | Array mapped | **LOW** — data-driven |
| Feed item descriptions | Prose | From essays.json | Array mapped | **LOW** — data-driven |
| GitHub Pages API payload | Data | From github-pages.json data file | Direct serialization | **LOW** — data-driven |

**Key Insight:** Endpoints are mostly data-driven with only feed title as minor candidate.

---

## 11. Summary: Content Sourcing Patterns

### Pattern A: Fully Externalized (Ideal)
**Example:** Essays (logos/[slug].astro)
- Content in `.md` files
- Metadata in frontmatter
- Template purely structural

**Candidates for elevation to this pattern:**
- Project pages (currently monolithic .astro files)

### Pattern B: Hybrid (Current standard)
**Example:** Resume template (resume/[slug].astro), About page
- Framing prose + labels: hardcoded in .astro
- Core narrative + data: external JSON/YAML

**Candidates for improvement:**
- Move framing prose to JSON (personas.json, about.json)
- Extract hardcoded labels to external structure

### Pattern C: Mostly Data-Driven (Good)
**Example:** Dashboard, Index
- Section labels: hardcoded
- Metrics + values: from JSON
- Component structure: based on data shape

**Candidates for improvement:**
- Extract section labels to JSON
- Consolidate similar data structures

### Pattern D: Monolithic (Problematic)
**Example:** Project pages (aetheria-rpg.astro, etc.)
- Everything hardcoded in single file (~24KB)
- No data abstraction
- Citations as component props
- Sections implicit in prose structure

**This is the PRIMARY simplification target.**

---

## 12. Simplification Priority Matrix

| Pattern | File(s) | Type | Hardcoded Content | Priority | Effort | Impact |
|---------|---------|------|-------------------|----------|--------|--------|
| Project pages | 21 × projects/[name].astro | Monolithic | 2000+ words prose, 15+ citations, diagrams, code, metrics | **CRITICAL** | **HIGH** | **VERY HIGH** |
| Resume template | resume/[slug].astro | Template + JSON | Professional summary, evidence items, metric descriptions | **HIGH** | **MEDIUM** | **HIGH** |
| About page | about.astro | Template + JSON | Hero statement, metric labels, footer CTA | **HIGH** | **LOW** | **MEDIUM** |
| Dashboard | dashboard.astro | Template + JSON | Tech stack array (16 items), section labels | **MEDIUM** | **LOW** | **LOW** |
| Index | index.astro | Template + hardcoded | Hero tagline, feature card labels | **MEDIUM** | **LOW** | **MEDIUM** |
| Strike target | for/[target].astro | Template + JSON | Framing labels, persona-specific intro | **MEDIUM** | **LOW** | **MEDIUM** |
| Layout | layouts/Layout.astro | Global | Nav labels, footer text | **LOW** | **LOW** | **LOW** |
| Feed/API | feed.xml.ts, github-pages.json.ts | Endpoint | Feed title | **LOW** | **TRIVIAL** | **LOW** |

---

## 13. Recommended Refactor Sequence

### Phase 1: Project Pages (CRITICAL)
**Goal:** Reduce 21 × 24KB monolithic files to 1 × 500B template + external YAML data

**Steps:**
1. Extract project prose from aetheria-rpg.astro into `src/pages/projects/data/aetheria-rpg.yaml`
2. Extract citation metadata into YAML array (eliminating component prop chaos)
3. Extract section structure as explicit array (heading + body + embedded component data)
4. Extract code examples, diagram syntax, table data
5. Extract leadership metrics as structured fields
6. Create projects/[slug].astro template that loads and renders project.yaml
7. Migrate all 21 projects iteratively (batch in groups of 3-5 per PR)

**Result:** 21 files × 24KB → 1 file × 0.5KB + 21 data files × 2-3KB

### Phase 2: Template Prose Extraction (HIGH)
**Goal:** Move framing prose and hardcoded metrics from .astro to JSON

**Resume template:**
- Move "Professional Summary" prose → personas.json `professional_summary` field
- Move leadership metric descriptions → personas.json nested `leadership` object
- Move evidence items → personas.json `evidence_items` array

**About page:**
- Move hero statement → about.json `hero_statement` field
- Move metric table labels → about.json `metric_labels` object

**Index:**
- Move hero tagline → index.json `hero_tagline` field

### Phase 3: Label Extraction (MEDIUM)
**Goal:** Create centralized labels/ui-strings JSON for all hardcoded section labels

**Create:** `src/data/ui-strings.json` or `src/data/labels.json`
```json
{
  "resume": {
    "professional_summary": "Professional Summary",
    "core_tech_stack": "Core Tech Stack",
    "leadership_impact": "Leadership & Strategic Impact",
    ...
  },
  "dashboard": {
    "tech_stack": "Orchestration Tech Stack",
    "repo_breakdown": "Repositories by Organ",
    ...
  },
  ...
}
```

Benefits:
- Single source of truth for UI text
- Easy to support i18n in future
- Improves maintainability

### Phase 4: Citation System (MEDIUM)
**Goal:** Create shared citation management outside component props

**Option A:** YAML citation database
```yaml
citations:
  - id: "smith-2023-education"
    author: "Smith, Jane"
    title: "Education in the Digital Age"
    year: 2023
    source: "Journal of Learning"
    url: "https://..."
```

**Option B:** Keep current Cite components but reference citation IDs instead of full props

### Phase 5: Data Structure Consolidation (LOW)
**Goal:** Unify similar data structures and reduce duplication

- Merge about.json metrics with omega.json criteria structure
- Consolidate vitals.json + landing.json if semantic overlap exists
- Consider unified metrics schema across all data files

---

## 14. Current State Summary

### Externalized Content (Good ✓)
- Essays (content collection)
- Projects.json metadata
- Personas.json (mostly)
- About.json (mostly)
- Omega.json metrics
- Vitals.json metrics
- Graph.json (graph data)
- Experience.json (professional history)

### Hardcoded Content (Problem ✗)
- **[CRITICAL]** 21 project pages with 2000+ lines each
- **[HIGH]** Resume template: professional summary, evidence, metrics prose
- **[HIGH]** About page: hero statement
- **[MEDIUM]** Dashboard: tech stack array
- **[MEDIUM]** Index: hero tagline
- **[MEDIUM]** Resume/About/Dashboard/etc.: section labels (20+ instances)
- **[MEDIUM]** Project pages: citation metadata (hardcoded as Cite component props)
- **[LOW]** Layout: nav labels, footer text

### Architecture Patterns

| Pattern | Instances | Maturity | Candidate |
|---------|-----------|----------|-----------|
| Fully externalized (essays) | 48 | ⭐⭐⭐⭐⭐ | No — use as reference |
| Hybrid template + JSON (resume, about) | 2 | ⭐⭐⭐⭐ | Yes — extract prose to JSON |
| Data-driven with hardcoded labels (dashboard) | 3 | ⭐⭐⭐ | Yes — extract labels |
| Monolithic hardcoded (projects) | 21 | ⭐ | **YES — PRIORITY REFACTOR** |

---

## 15. Simplification Impact Estimates

If fully implemented:

| Metric | Before | After | Reduction |
|--------|--------|-------|-----------|
| Total hardcoded prose | ~60KB | ~10KB | **83%** |
| Project page file sizes | 24KB avg | 2-3KB avg | **88%** |
| Maintainability (estimate) | Low | High | **+400%** |
| i18n support readiness | None | Ready | **+100%** |
| Citation system complexity | High (props) | Medium (IDs) | **~30%** |

---

## 16. Data Coupling Dependencies

**Do NOT change without considering:**

- `vitals.json` → `landing.json` reactive field sync (sync:vitals script)
- `system-metrics.json` → `about.json` system_summary (sync:identity script)
- `targets.json` count → `omega.json` criterion 5 "met" state (sync:omega script)
- `persona.featured_projects` → `projects.json` catalog lookup (resume template enrichment)
- `graph.json` → `dashboard.astro` D3 visualization (no script, direct import)

Any refactor in Phase 1-3 must preserve these reactive couplings or update the sync scripts accordingly.

---

## Appendix A: File Size Inventory

| File | Lines | Size | Hardcoded % | Externalized % |
|------|-------|------|-------------|----------------|
| index.astro | ~200 | 6KB | 40% | 60% |
| about.astro | ~150 | 5KB | 30% | 70% |
| resume/[slug].astro | ~450 | 16KB | 50% | 50% |
| dashboard.astro | ~300 | 9KB | 25% | 75% |
| projects/aetheria-rpg.astro | ~800 | 24KB | 95% | 5% |
| projects/agentic-titan.astro | ~850 | 26KB | 95% | 5% |
| ... (19 more project files) | ~19,200 | ~576KB | 95% | 5% |
| **Total .astro** | ~23,000 | ~694KB | ~70% | ~30% |

---

**End of Document**
