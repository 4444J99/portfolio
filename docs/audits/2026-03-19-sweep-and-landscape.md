# Architecture Audit: Blind Spots, Competitive Landscape, Source Pool

Date: 2026-03-19

---

## Issue #30: Blind Spots Sweep

### 1. Empty/Malformed JSON Data Files

**Current protection:** `data-integrity.test.ts` validates 8 of 24 JSON files in `src/data/`:
- projects.json, essays.json, graph.json, targets.json, vitals.json, system-metrics.json, landing.json, about.json

**Unvalidated files (16):**
- experience.json, personas.json, ontology.json, operative-log.json, scout-candidates.json
- quality-metrics.json, quality-metrics-baseline.json, trust-vitals.json, omega.json
- github-pages.json, github-pages-curation.json, workspace-health.json
- case-study-organvm.json, governance-sample.json, rss-meta.json, human-impact.json

**Risk assessment:** Low-to-medium. Astro's static build imports JSON at build time -- if a file is malformed JSON, the build itself fails with a parse error (an implicit guard). Empty arrays/objects would produce empty pages rather than crashes.

### 2. Pages That Break on Missing Data Files

**Hard dependencies (build fails if file is missing):**
- `index.astro` -- vitals.json, personas.json
- `dashboard.astro` -- vitals.json, system-metrics.json, quality-metrics.json, graph.json
- `about.astro` -- vitals.json
- `philosophy.astro` -- vitals.json, ontology.json
- `for/[target].astro` -- targets.json, personas.json, experience.json
- `resume/[slug].astro` -- personas.json, experience.json
- `essays.astro` -- essays.json
- `architecture.astro` -- graph.json, vitals.json
- `github-pages.astro` -- github-pages.json, vitals.json
- Multiple project pages -- vitals.json

**Finding:** Every page that imports JSON will cause a build failure if the file is missing. This is acceptable -- the build chain (`generate-data`, `sync:vitals`, etc.) is responsible for producing these files. The sequential build chain in `package.json` line 23 ensures scripts run before `astro build`.

### 3. Defensive Coding Patterns

**Good patterns found:**
- `dashboard.astro` uses optional chaining + fallbacks extensively (`typedMetrics.flagship_vivification?.repos || []`, `typedMetrics.registry?.organs || {}`)
- `[target].astro` line 23: explicit `throw new Error()` if persona not found for a target
- `[slug].astro` line 23 (resume): throws if featured project slug not in catalog
- `sync-trust-metrics.mjs`: wraps every data source read in try/catch with graceful fallbacks
- `scout-agent.mjs`: handles gemini CLI unavailability with `[DRAFT]` fallback
- `strike-new.mjs`: same `[DRAFT]` fallback pattern

**Blind spots identified:**
- `index.astro` accesses `vitals.substance.code_files.toLocaleString()` without optional chaining -- if `vitals.substance` were missing, this would throw at build time. However, `sync-trust-metrics.mjs` always produces a complete structure, so this is theoretical.
- `about.astro` accesses `vitals.repos.total`, `vitals.repos.orgs`, `vitals.logos.words` directly -- same pattern, same low risk.
- `for/[target].astro` line 14: `personas.find()` can return `undefined`, but line 23 guards it with a throw. The gap: if `targets.json` references a `persona_id` that does not exist in `personas.json`, the build breaks with a clear error. This is correct behavior.
- `ScoutTriage.astro`: destructures `candidates` and `last_scout` from scout-candidates.json without fallback. If the file had `{"candidates": null}`, this would crash the build.

### 4. Build Chain Error Paths

- The build chain is fully sequential: `generate-badges && sync:vitals && sync:omega && sync:identity && astro build && pagefind`. Any failure halts the chain (correct).
- `generate-data` depends on a sibling Python repo (`../ingesting-organ-document-structure/`). If that repo is not present, the script fails. This is documented but has no fallback.
- `sync-trust-metrics.mjs` reads `human-impact.json` without try/catch on line 27 -- if that file is missing or malformed, the entire vitals sync fails and the build chain halts. Every other read in the same script is wrapped in try/catch.

### 5. Actual Code Issues Found

**No critical bugs found.** The architecture is well-defended for a static site. The data integrity tests cover the most important files, and the build chain's sequential nature means failures propagate correctly.

**Minor improvements possible (not blocking):**
- The `human-impact.json` read in `sync-trust-metrics.mjs` line 27 should be wrapped in try/catch like every other read in that file
- `data-integrity.test.ts` could cover personas.json and experience.json since they drive the resume/strike dynamic routes

---

## Issue #29: Competitive Landscape Analysis

### Comparison Sites

| Site | Stack | Layout | Content Density | Navigation | Unique Feature |
|------|-------|--------|-----------------|------------|----------------|
| **brittanychiang.com** | React (Gatsby->Next) | Single-page scroll, left-anchored nav | Medium -- projects, experience, about in one flow | Sticky sidebar nav with scroll indicators | Spotlight cursor effect, minimal but polished |
| **joshwcomeau.com** | Next.js + MDX | Blog-first, course landing pages | High -- interactive tutorials, deep articles | Top nav, category filters | Interactive code playgrounds embedded in posts, 3D CSS demos |
| **leerob.io** | Next.js (App Router) | Ultra-minimal blog | Low -- short posts, link aggregation | Simple top nav | Dashboard with real metrics (Vercel analytics), guestbook |
| **cassidoo.co** | Static/simple | Newsletter-centric landing page | Low -- personality-driven, links out | Minimal, almost a link-in-bio page | Newsletter prominence, authentic voice, meme integration |
| **overreacted.io** | Gatsby | Pure blog, zero portfolio elements | Medium -- long-form technical essays only | Archive list | Deep technical writing quality, no self-promotion |

### What This Portfolio Does Better

- **Data-driven transparency:** Live dashboard with real metrics from 91+ repos. No competitor shows this level of operational transparency. Lee Robinson has basic analytics; this has a full operative dashboard with quality gates, sprint timelines, and dependency graphs.
- **Multi-persona system:** 4 tailored resume views + company-targeted strike pages. No competitor has anything equivalent -- they present a single identity.
- **Generative art integration:** 30 named p5.js sketches as page backgrounds and persona-bound visuals. Josh Comeau has interactive demos but they are educational, not identity-expressing.
- **Systems architecture as content:** The portfolio itself demonstrates the architecture it describes. The eight-organ system, governance traces, and quality ratchet are visible artifacts, not just claims.
- **Dual view mode:** Engineering/creative toggle on the homepage. No competitor offers this.

### What Competitors Do Better

- **Content marketing / SEO:** Josh Comeau and Dan Abramov drive massive organic traffic through educational content. This portfolio has essays but they are system-documentation, not tutorials. No competitor-attracting content funnel exists.
- **Simplicity and approachability:** Brittany Chiang's single-page layout is instantly scannable by recruiters in 10 seconds. This portfolio requires investment to understand. Cassidy Williams proves personality alone can be a differentiator.
- **Interactive learning:** Josh Comeau's embedded code playgrounds and interactive visualizations teach concepts. This portfolio's p5.js sketches are aesthetic, not pedagogical.
- **Load performance:** Brittany Chiang and Lee Robinson are sub-100KB pages. This portfolio bundles p5.js, D3, Mermaid, Cytoscape, and KaTeX -- even with manual chunks, the total payload is significantly larger.
- **Blog/newsletter funnel:** Cassidy Williams and Josh Comeau both have email lists that drive return visits. This portfolio has RSS but no newsletter capture.
- **Social proof:** Lee Robinson shows Vercel employment. Brittany Chiang's site is referenced as a template by thousands. This portfolio has metrics but no external testimonials or employer logos.

### Strategic Positioning

This portfolio occupies a unique niche: it is more of an **operational command center** than a traditional portfolio. The closest analog is not a developer portfolio but an open-source project dashboard. The trade-off is complexity vs. scannability. For staff/director-level roles where depth matters, this is an advantage. For quick recruiter scans, it is a liability.

---

## Issue #32: Source Pool Expansion

### Current State

**Personas (4):**
1. AI Systems Engineer -- swarm orchestration, AI safety
2. Systems Architect -- backend, DSL design, governance
3. Creative Technologist -- generative art, narratology, p5.js
4. Technical PM -- DevEx, strategic delivery, platform governance

**Targets (4):** Palantir, OpenAI, Anthropic, Vercel

**Scout Candidates (12):** 3 per persona, all in "triage" status. Last scout: 2026-02-28. Companies: Anthropic (3), Vercel (2), Palantir (2), OpenAI (3), IDEO (1). Status: all untouched since discovery.

### Infrastructure Assessment

The scout/strike pipeline has three stages:
1. **Scout** (`scout-agent.mjs`): Uses gemini CLI to discover candidates per persona. Writes to `scout-candidates.json`.
2. **Triage** (manual via dashboard UI): "Promote to Strike" / "Ignore" buttons exist in `ScoutTriage.astro` but appear to be client-side only -- no backend handler found.
3. **Strike** (`strike-new.mjs`): Promotes a candidate to `targets.json`, generates AI intro, creates OG image, and builds a `/for/[target]` landing page.

### Source Pool Expansion Assessment

**What "source pool expansion" means in context:** Increasing the diversity and volume of companies and roles in the scout/target pipeline -- more industries, more role types, more geographic markets.

**Current limitations:**
- Only 4 companies in active targets, all Big Tech / AI-adjacent
- Scout candidates are also concentrated in the same companies (Anthropic, OpenAI, Palantir, Vercel, IDEO)
- The scout agent's prompts are hard-coded to search for roles matching existing persona titles -- it will not discover roles outside the current persona definitions
- No industry diversification: missing fintech, health tech, defense/gov tech, media/entertainment, climate tech, developer tools (beyond Vercel)
- No mid-market or growth-stage companies -- all targets are large/established

**Infrastructure sufficiency:**
- The pipeline itself is sound: scout -> triage -> strike -> landing page is a complete workflow
- The persona system is flexible enough to support expansion -- adding a new persona to `personas.json` automatically generates resume pages and scout prompts
- The triage UI buttons in the dashboard are non-functional (no backend handler) -- promoting candidates requires running `strike:new` manually
- The `gemini` CLI dependency for AI-generated content is fragile -- if unavailable, intros fall back to `[DRAFT]` placeholders

**Recommendations (not implemented, documentation only):**
- Add 2-3 more industry verticals to scout prompts (fintech, gov tech, developer tools)
- Consider a 5th persona for "Platform Engineer" or "Developer Experience Lead" to broaden role matching
- The 12 triage candidates have been sitting since Feb 28 -- the pipeline works but is not being actively cycled
- The triage-to-strike promotion should be scriptable without the gemini CLI dependency (allow manual intro text)
