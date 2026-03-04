# Plan: Market-Aligned Resume System (MARS)

This plan implements a "Dual Narrative Layering" and "Signal Translation" system for the portfolio, addressing the gap between high-concept polymathic work and role-specific hiring requirements.

## 1. Core Objectives
- Create dedicated narrative pages for specific job roles (Software Engineer, Product Engineer, Full-Stack).
- Map existing projects to these roles using "Signal Engineering" (outcomes, impact metrics, tech keywords).
- Maintain the "Visionary Polymath" identity as a secondary layer for collaborators and deep-dives.
- Improve ATS and recruiter legibility by providing clear, tailored entry points.

## 2. Feature Identification
- **Role-Specific Pages:** Distinct URLs for each persona.
- **Persona Switcher:** UI component to toggle between "Engineering" and "Visionary" views.
- **Market Data Layer:** Role-specific project descriptions and impact statements.
- **Signal Translation:** Re-weighting project importance based on the active persona.

## 3. Implementation Steps

### Phase 1: Data Modeling
1. **Create `src/data/market-personas.json`**:
   - Define metadata for each role:
     - `slug`: (e.g., `software-engineer`)
     - `title`: (e.g., "Software Engineer — Backend Focus")
     - `summary`: Role-aligned career summary.
     - `core_keywords`: Primary tech stack tags.
2. **Update `src/data/projects.json`**:
   - Add `market_narratives` field to key projects.
   - Map project outcomes to specific roles.

### Phase 2: Component Development
1. **`src/components/resume/PersonaSwitcher.astro`**:
   - A sticky or header-based navigation to switch between resume views.
2. **`src/components/resume/MarketResumeItem.astro`**:
   - A specialized project display component that prioritizes impact and tech stack.
3. **`src/components/resume/MarketResumeTemplate.astro`**:
   - A reusable template for role-based pages, integrating the header, summary, and filtered projects.

### Phase 3: Page Implementation
1. **`src/pages/resume/software-engineer.astro`**:
   - Focus: Python, TS, Architecture, Testing.
   - Featured: `Agentic Titan`, `Recursive Engine`, `UCC Scraper`.
2. **`src/pages/resume/product-engineer.astro`**:
   - Focus: AI Systems, Product Strategy, Delivery.
   - Featured: `Agentic Titan`, `AI-Conductor`, `Aetheria RPG`.
3. **`src/pages/resume/full-stack-engineer.astro`**:
   - Focus: Next.js, FastAPI, Hexagonal Architecture.
   - Featured: `in-midst-my-life`, `UCC Scraper`, `Metasystem Master`.
4. **Update `src/pages/resume.astro`**:
   - Repurpose as the "Visionary Polymath" resume.
   - Add the `PersonaSwitcher` to link to tailored views.

### Phase 4: Content Authoring (Signal Translation)
- Draft impact statements for each project tailored to the role.
- *Example (Software Engineer)*: "Built a model-agnostic multi-agent swarm architecture in Python with 1,095+ tests (adversarial, chaos, e2e)."
- *Example (Product Engineer)*: "Designed a self-organizing system for autonomous task completion across 9 topologies, optimizing for LLM orchestration efficiency."

## 4. Verification & Quality Gates
- **Link Check:** Ensure all personas are inter-linked correctly.
- **SEO/Meta:** Verify page titles and descriptions are optimized for each role.
- **A11y:** Ensure the switcher is keyboard-accessible.
- **Mobile:** Check layout on small screens.

## 5. Prioritization
- **High:** Data layer, Basic role pages, Switcher.
- **Medium:** Detailed market narratives, SEO optimization.
- **Low:** Specialized PDF downloads for each persona.
