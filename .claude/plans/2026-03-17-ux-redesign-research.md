# UX Redesign Research: High-Density, Attention-Holding Portfolio

**Date**: 2026-03-17
**Purpose**: Peer-reviewed and authoritative UX/design research to inform a complete portfolio redesign — from "very vertical" to "minimalist yet dense, hiding and revealing in layers."

---

## 1. Scroll Fatigue and Attention Loss

### Key Findings

**NNGroup eyetracking data (2018 study)**: Users spend approximately **57% of their page-viewing time above the fold** — a significant shift from the 2010 finding of 80%, but still a majority. The remaining time drops off sharply: **74% of viewing time occurs in the first two screenfuls** (up to ~2160px). Beyond that, attention is sparse.

**The Illusion of Completeness**: When the initial viewport appears visually "complete" — a full hero, a clear section boundary — users assume there is nothing more and stop scrolling. This is the single biggest threat to a long vertical page: if any section *looks* like a natural ending, everything below it dies.

**Cognitive resource trade-off**: The more mental effort users spend *navigating* (scrolling, orienting, finding their place), the fewer cognitive resources remain for *processing* the content itself. Scroll fatigue is not just physical — it is attentional.

**Information foraging theory**: Users behave like animals foraging for food. They follow "information scent" — cues that signal relevant content ahead. If scent drops (e.g., a section looks irrelevant), they abandon the page entirely rather than scroll further.

### Actionable Patterns

- **Kill the long scroll**. The current architecture (Hero -> PersonaCards -> ProjectGrid -> Stats -> ConsultCTA -> Contact) is a single vertical river. Every section below the fold competes with decreasing attention.
- **Use the first 2160px ruthlessly**. If 74% of viewing time happens there, the portfolio's entire value proposition must be communicated within roughly two screenfuls.
- **Break the illusion of completeness**. Design visual "bleeding" across section boundaries — partial cards, continuation cues, asymmetric layouts that signal "there is more."
- **Provide strong information scent**. Every navigation element and section header must telegraph what the user will find if they engage.

### Sources
- [NNGroup: Scrolling and Attention](https://www.nngroup.com/articles/scrolling-and-attention/)
- [NNGroup: Scrolling and Attention (Original Research)](https://www.nngroup.com/articles/scrolling-and-attention-original-research/)
- [NNGroup: Illusion of Completeness](https://www.nngroup.com/videos/illusion-completeness/)
- [NNGroup: The Fold Manifesto](https://www.nngroup.com/articles/page-fold-manifesto/)
- [IxDF: Information Scent](https://www.interaction-design.org/literature/article/web-user-behaviour-directed-by-information-scent)

---

## 2. Progressive Disclosure Patterns

### Key Findings

**Core principle**: Progressive disclosure reduces cognitive load by showing only essential information initially, then revealing complexity on demand. It is the direct antidote to the "very vertical" problem — the same information density exists, but it is *layered* rather than *stacked*.

**Pattern taxonomy for portfolios**:

| Pattern | Best For | Risk |
|---------|----------|------|
| **Tabs** | Switching between orthogonal views (engineering/creative, by organ, by skill) | Content hidden behind inactive tabs gets zero engagement unless labels have strong scent |
| **Accordions** | FAQ-style or detail expansion within a list | Users rarely open more than 2-3; poor for primary content |
| **Hover/click reveals** | Supplementary detail on cards (tech stack, metrics, role) | Mobile has no hover; must degrade to tap |
| **Modals/overlays** | Deep-dive into a project without leaving the page | Disrupts spatial context; must be lightweight |
| **Inline expansion** | "Read more" within a project card | Best balance of context preservation and density |
| **View switching** | Already exists (`data-portfolio-view` engineering/creative toggle) | Users must discover the toggle; default view carries 90%+ of impressions |

**Discoverability is the central challenge**. Hiding content is easy; ensuring users *know it exists* and *can find it* is the hard part. Clear labels, visual affordances (chevrons, "+", subtle animations on load), and predictable locations are essential.

**Card sorting insight**: The best progressive disclosure hierarchies are derived from user research (card sorting, task analysis), not designer intuition. For a portfolio: what does a hiring manager want first? Title, company, impact metric. Second? Tech stack, team size, timeline. Third? Detailed narrative, architecture diagrams.

### Actionable Patterns

- **Bento grid with expandable cards**: Each project is a compact cell showing title + one-line impact + thumbnail. Click/tap expands inline or morphs into a detail view via view transition. This replaces the current vertical ProjectGrid.
- **Tabbed project filtering**: The existing `IndexFilters` (skill filters, category filters) could become persistent tabs above the grid, not a scroll-past section.
- **Hover reveals for tech stacks**: On desktop, hovering a project card reveals the tech stack, key metrics, and a "View case study" CTA. On mobile, this is always visible in a compact form.
- **The dual view toggle is already progressive disclosure** — lean into it harder. Make the toggle prominent and persistent (sticky header or floating pill).

### Sources
- [IxDF: Progressive Disclosure](https://ixdf.org/literature/topics/progressive-disclosure)
- [UXmatters: Designing for Progressive Disclosure](https://www.uxmatters.com/mt/archives/2020/05/designing-for-progressive-disclosure.php)
- [LogRocket: Progressive Disclosure Types and Use Cases](https://blog.logrocket.com/ux-design/progressive-disclosure-ux-types-use-cases/)
- [UXPin: What is Progressive Disclosure?](https://www.uxpin.com/studio/blog/what-is-progressive-disclosure/)
- [Shopify: Progressive Disclosure](https://www.shopify.com/partners/blog/progressive-disclosure)

---

## 3. Information Density Without Clutter

### Key Findings

**Tufte's data-ink ratio**: Maximize the proportion of visual elements that convey information; eliminate everything that does not. In web terms: every pixel should either communicate data or provide necessary breathing room. Decorative borders, redundant labels, and excessive whitespace between logically grouped items all reduce the data-ink ratio.

**"Busy" vs. "dense" is a design quality problem**: The aversion to high-density interfaces is really an aversion to *poorly designed* dense interfaces. When people say a design is "cluttered," they are reacting to a lack of clear visual hierarchy — not to the quantity of information.

**Linear's approach**: Linear achieves extreme information density by:
1. Reducing visual noise in chrome (sidebar, tabs, headers) through muted colors and tight spacing
2. Using a single accent color for interactive/active states
3. Making whitespace *functional* (separating logical groups) rather than *decorative*
4. Progressive disclosure via keyboard shortcuts and contextual menus

**Stripe's approach**: Content-focused layout with generous padding and subtle gradient backgrounds. Color combinations shift between pages while maintaining brand consistency. Information appears dense because typography carries the hierarchy — not boxes, borders, or heavy visual separators.

**Apple's approach**: Extreme reduction — one idea per viewport, massive typography, product-as-hero. Apple achieves density *across pages* rather than within them: each page is sparse, but the navigation system connects dozens of dense product pages.

**The synthesis**: The best modern sites combine minimalism (at the surface) with density (available on demand). Progressive disclosure is the bridge.

### Actionable Patterns

- **Apply Tufte to the current stats section**: The stat grid (Code Files, Test Files, CI Passing, etc.) is already high data-ink. But the surrounding sections have low density. The hero takes a full viewport to say one thing.
- **Adopt the Linear sidebar model**: A persistent, compact navigation rail (not a hamburger menu) that lets users jump to any section instantly, removing the need to scroll to find things.
- **Use typography as hierarchy** (Stripe model): Replace heavy section dividers and card borders with typographic weight differences. The existing `--font-heading` (Syne) vs `--font-body` (Plus Jakarta Sans) distinction is a strong foundation.
- **Consider the bento grid for the homepage**: Instead of hero -> cards -> grid -> stats -> CTA (5 vertical sections), compress into a 2-3 screenful bento layout where projects, stats, and persona cards coexist in a single dense grid.

### Sources
- [Tufte's Data-Ink Ratio Principles](https://jtr13.github.io/cc19/tuftes-principles-of-data-ink.html)
- [LogRocket: Balancing Information Density](https://blog.logrocket.com/balancing-information-density-in-web-development/)
- [CAWEB: Minimalism vs Density in UI/UX](https://mastercaweb.unistra.fr/en/actualites/ux-ui-design-en/minimalism-versus-density-in-ui-and-ux/)
- [Linear: How We Redesigned the UI](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [Linear: A Calmer Interface](https://linear.app/now/behind-the-latest-design-refresh)
- [925 Studios: Linear Design Breakdown](https://www.925studios.co/blog/linear-design-breakdown)

---

## 4. Above-the-Fold Impact

### Key Findings

**57% of time above the fold** (NNGroup 2018). But within that first viewport, attention is not evenly distributed: **more than 65% of above-fold viewing time concentrates in the top half of the viewport**. On SERPs, the top half captures 75%+ of viewing time.

**Bounce rate correlation**: Pages with weak initial content have bounce rates **35% higher** than those with strong, clear value propositions in the first screen.

**The 7.4-second resume scan**: Eye-tracking studies (TheLadders, 2018) show recruiters spend an average of **7.4 seconds** on initial resume review, scanning in an F-pattern. Portfolio websites likely get a similar or shorter window.

**Speed matters as much as content**: Conversion rates drop **4.42% for every additional second of load time**. 53% of mobile users abandon sites loading over 3 seconds. The first viewport must be both *meaningful* and *fast*.

**F-pattern scanning**: Recruiters (and by extension, hiring managers viewing portfolios) scan across the top line, then down the left margin, then across a shorter second line. Content placement should follow this pattern.

### Actionable Patterns

- **The current hero must do more work**. Right now: `HeroSection` -> `PersonaCards` -> `ProjectGrid`. The hero should communicate: (1) who you are, (2) what you do, (3) proof of substance — all within the first viewport.
- **Embed stats in the hero**. The stat grid currently sits 3+ screens down. Move key proof points (105 repos, 1000+ tests, 15 years) into the hero area as compact, glanceable figures alongside the title.
- **Optimize LCP aggressively**. The p5.js background canvas (`#bg-canvas`) initializes on page load. If it delays first paint, it hurts the critical 7-second window. Consider deferring canvas init to after LCP.
- **F-pattern alignment**: Place name/title top-left, key navigation top-right, proof points in a horizontal band, then project grid below. This matches the natural scan pattern.

### Sources
- [NNGroup: Scrolling and Attention](https://www.nngroup.com/articles/scrolling-and-attention/)
- [think.design: Above the Fold in 2026](https://think.design/blog/above-the-fold-vs-below-the-fold-does-it-matter-in-2024/)
- [Invespcro: Above The Fold Best Practices](https://www.invespcro.com/blog/above-the-fold/)
- [Semrush: Above the Fold](https://www.semrush.com/blog/above-the-fold/)
- [TheLadders Eye-Tracking Study (2018)](https://www.theladders.com/static/images/basicSite/pdfs/TheLadders-EyeTracking-StudyC2.pdf)
- [HR Dive: 7-Second Resume Scan](https://www.hrdive.com/news/eye-tracking-study-shows-recruiters-look-at-resumes-for-7-seconds/541582/)

---

## 5. View Transitions and Spatial UI

### Key Findings

**View Transitions API is now Baseline**: As of late 2025, cross-document view transitions work in Chrome 126+, Safari 18.2+, and Firefox 144+. This means Astro's MPA architecture can achieve SPA-like morph animations *without any client-side JavaScript routing*.

**Astro's integration**: Astro automatically assigns `view-transition-name` to matching elements across pages. With `transition:persist`, elements like the background canvas survive navigation. With `transition:name`, specific elements (a project card thumbnail) can morph into the detail page hero image.

**Zero-JS view transitions**: Astro supports cross-document view transitions that require zero JavaScript. The browser handles the animation natively. This is a major architectural advantage for the portfolio: app-like feel with static site performance.

**Cognitive load reduction**: View transitions reduce perceived loading latency and help users maintain spatial context during navigation. Instead of a full page reload (disorientating), elements morph and slide (continuous, spatial).

**Bento-to-detail morph**: The most powerful pattern for portfolios: a project card in a bento grid morphs (via `view-transition-name`) into the full project page. The user perceives continuous motion, not a page change. This turns "clicking a link" into "zooming into a layer."

### Actionable Patterns

- **The portfolio already uses `transition:persist` for the background canvas** — this is correct and should be preserved.
- **Add `transition:name` to project cards**: Each project card's thumbnail should share a `view-transition-name` with the corresponding project page hero. On click, the card morphs into the page.
- **Use view transition types for different navigation contexts**: Forward navigation (grid -> detail) uses a zoom/morph; back navigation uses a reverse morph; sibling navigation (project -> project) uses a slide.
- **Persistent navigation rail**: With `transition:persist` on a sidebar/nav element, navigation can remain fixed while the content area transitions. This gives an "app shell" feel.
- **Consider replacing scroll with navigation**: Instead of scrolling from Hero to ProjectGrid to Stats, make each a *page* connected by view transitions. The user clicks/navigates between dense, focused viewports rather than scrolling past sparse vertical sections.

### Sources
- [Astro Docs: View Transitions](https://docs.astro.build/en/guides/view-transitions/)
- [Chrome for Developers: Astro View Transitions](https://developer.chrome.com/blog/astro-view-transitions)
- [Chrome for Developers: Cross-Document View Transitions](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document)
- [Chrome for Developers: View Transitions in 2025](https://developer.chrome.com/blog/view-transitions-in-2025)
- [Astro: Zero-JS View Transitions](https://astro.build/blog/future-of-astro-zero-js-view-transitions/)
- [MDN: View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)

---

## 6. Dark Theme Portfolio Best Practices

### Key Findings

**Typography carries more hierarchy burden in dark mode**. Shadows and borders lose subtlety on dark backgrounds, so the type system must be strong. If typography hierarchy is weak, users feel "lost" even with a correct palette.

**Font weight adjustment**: Overly bright text + thin fonts create "edge glow" that blurs letterforms at small sizes, increasing misread risk. Use **slightly thicker font weights for small text** in dark themes. Avoid ultra-thin weights entirely.

**Contrast requirements**: WCAG AA requires 4.5:1 for normal text. In dark mode, the background must be dark enough to achieve at least 15.8:1 between the surface and the lightest text on the highest elevation. The portfolio's `--bg-primary: #0a0a0b` is very dark — good for contrast, but be careful with `--text-muted: #707070` which may fail contrast checks against dark backgrounds.

**Accent color discipline**: In dark UIs, saturated colors feel brighter and pull attention disproportionately. Use **one main accent** and vary its brightness for states (default, hover, selected) rather than introducing multiple competing accents. The portfolio's gold (`--accent: #d4a853`) + burnt sienna (`--accent-hover: #c4463a`) is two accents — consider whether the second is necessary or if gold brightness variants alone suffice.

**Gold psychology**: Gold conveys quality, prestige, wisdom, and craftsmanship. On dark backgrounds it reads as "premium." It is an excellent choice for an engineering portfolio seeking director-level roles.

**Burnt sienna psychology**: Warmth, earthiness, approachability. It softens the coldness of dark + gold. As a hover state it signals "this is interactive and human, not corporate."

**Card-based vs. list-based in dark themes**: Cards work well in dark themes because the `--bg-card` elevation creates natural grouping through subtle luminance differences. Lists require more explicit separators (borders or rules) which can feel heavy in dark mode. The bento grid (mixed card sizes) is particularly effective in dark themes because the varied cell sizes create rhythm without needing explicit dividers.

### Actionable Patterns

- **Audit `--text-muted: #707070`** against `--bg-primary: #0a0a0b`. The contrast ratio is approximately 4.3:1 — which *fails* WCAG AA for normal text. Bump to `#787878` or higher.
- **Increase body font weight one step for text under 14px**. If Plus Jakarta Sans is used at 400 weight for small labels, try 500.
- **Lean into the bento grid for dark theme**: Mixed-size cards with `--bg-card: #181818` will create a visually rich, layered surface. Use subtle `--border: #2a2a2a` only where needed, not on every card.
- **Limit accent colors to one hue family**. Consider making hover states a brighter gold rather than introducing sienna. Or: use sienna only for destructive/warning actions to give it semantic meaning.
- **Leverage the dark canvas**: The p5.js background on `#0a0a0b` is a strength. Generative art on dark backgrounds is inherently dramatic. Keep it but ensure it does not compete with foreground content — reduce opacity or saturation when content is overlaid.

### Sources
- [Toptal: Principles of Dark UI Design](https://www.toptal.com/designers/ui/dark-ui-design)
- [WebPortfolios.dev: Best Color Palettes for Developer Portfolios](https://www.webportfolios.dev/blog/best-color-palettes-for-developer-portfolio)
- [Influencers Time: Dark Mode UX Design for Comfort and Clarity](https://www.influencers-time.com/designing-dark-mode-for-ux-comfort-and-cognitive-ease/)
- [Influencers Time: Dark Mode Design Principles - Usability](https://www.influencers-time.com/designing-effective-dark-mode-beyond-aesthetics-to-usability/)
- [Vev: Dark Mode Website Color Palette Ideas](https://www.vev.design/blog/dark-mode-website-color-palette/)

---

## 7. Portfolio-Specific Conversion Research

### Key Findings

**The recruiter path** (from OpenDoors Careers research): Recruiters follow a consistent sequence: (1) decide whether to click the link, (2) judge visual craft in seconds, (3) scan the hero for fit, (4) skim work for clarity and story, (5) check "About" if still interested. The visual appearance is the first gate and it happens in seconds.

**The 7.4-second window**: Hiring managers scan resumes for 7.4 seconds (TheLadders eyetracking). Portfolio sites likely get less, because there is no obligation to review them (unlike a resume in an applicant tracking system). The first viewport must pass the "is this worth my time?" test instantly.

**Bounce rate benchmarks**: Short visits (under 30 seconds) indicate confusion or expectation mismatch. For portfolio sites, if a hiring manager lands from a LinkedIn link and sees a generic developer site with no clear differentiation, they bounce. The differentiation must be immediate and specific.

**Developer-specific expectations**: Developers (and technical hiring managers) bounce when they expect technical depth and land on marketing fluff. The portfolio must signal engineering substance immediately — real metrics, real architecture, real code quality indicators.

**Analytics tools for portfolio optimization**: Hotjar and Microsoft Clarity (both free) provide heatmaps and session recordings. This data can validate redesign decisions post-launch.

**Cards excel for browsing, lists for comparison**: NNGroup research shows card layouts drive higher engagement in browse-oriented contexts (like portfolios) but are worse for comparison tasks. Since hiring managers browse first, then compare later (against other candidates), the portfolio should optimize for *browsing engagement* on the landing page and *comparison-friendly detail* on project pages.

### Actionable Patterns

- **First viewport must signal differentiation**: "AI Orchestration Architect" + 105 repos + 15 years + specific system name (ORGANVM) — this is not generic. But it must all be visible *above the fold*, not revealed through scrolling.
- **Embed credibility metrics in the hero**: Move the stat grid (or a compact version) into the first viewport. Numbers like "105 repos", "1,400+ automated tests" are unusual and attention-grabbing for a hiring manager.
- **Use cards for the project grid, tables for detail pages**: Bento cards for browsing the project list; structured, scannable layout (closer to a table/list) for individual case study pages.
- **Install Clarity/Hotjar post-redesign**: Validate scroll depth, click patterns, and engagement time. Run A/B tests between the current vertical layout and the new bento layout.
- **Optimize the LinkedIn -> portfolio path**: Most hiring managers will arrive from LinkedIn. Ensure the landing page matches expectations set by the LinkedIn profile headline and summary.

### Sources
- [OpenDoors Careers: How Recruiters Look at Portfolios](https://blog.opendoorscareers.com/p/how-recruiters-and-hiring-managers-actually-look-at-your-portfolio)
- [HR Dive: 7-Second Resume Scan](https://www.hrdive.com/news/eye-tracking-study-shows-recruiters-look-at-resumes-for-7-seconds/541582/)
- [NNGroup: Card View vs. List View](https://www.nngroup.com/videos/card-view-vs-list-view/)
- [NNGroup: Cards Component Definition](https://www.nngroup.com/articles/cards-component/)
- [WebDesigner Depot: Cards vs Lists](https://webdesignerdepot.com/cards-vs-lists-how-they-impact-ux/)

---

## 8. Bento Grid — The Convergent Pattern

All seven research areas point toward a single convergent design pattern: the **bento grid with progressive disclosure and view transitions**. This section synthesizes the research.

### Why Bento Grid Solves the Problem

| Current Problem | Bento Grid Solution | Research Basis |
|----------------|---------------------|----------------|
| Very vertical, scroll-dependent | Dense 2D grid fits more in 2 screenfuls | NNGroup: 74% of time in first 2 screens |
| Attention drops below fold | Key content visible without scrolling | 57% of time above fold |
| Sections feel like natural endings | Grid cells bleed across the fold; no clear "ending" | Illusion of Completeness research |
| Low information density per viewport | Multiple projects + stats + CTA visible simultaneously | Tufte: maximize data-ink ratio |
| Detail requires page navigation | Cards expand inline or morph via view transitions | Progressive disclosure + View Transitions API |
| Engineering/creative views are hidden | View toggle is a first-class grid element, not a hidden control | Discoverability research |

### Bento Grid Market Validation

67% of top 100 SaaS websites on ProductHunt use bento-style layouts (2025 analysis). Apple, Linear, Notion, Vercel, and Stripe all use variations. The pattern is mainstream enough that users have mental models for it, yet distinctive enough (especially in the portfolio space) to differentiate.

### Architecture Mapping

```
Current Architecture (vertical):
  Hero → PersonaCards → ProjectGrid → Stats → CTA → Contact
  [~5-6 screenfuls of vertical scroll]

Proposed Architecture (bento + layers):
  Viewport 1 (above fold):
    ┌─────────────────────┬──────────┐
    │ Hero text + stats   │ View     │
    │ (name, title, proof │ toggle   │
    │  metrics inline)    │ [eng/cre]│
    ├──────────┬──────────┼──────────┤
    │ Featured │ Featured │ Quick    │
    │ project  │ project  │ nav /    │
    │ card 1   │ card 2   │ persona  │
    │ (large)  │ (large)  │ links    │
    ├──────────┴──────────┴──────────┤
    │ ... grid bleeds below fold ... │

  Viewport 2 (below fold, still in 74% zone):
    ├──────────┬─────┬──────────┬────┤
    │ Project  │ Proj│ Project  │Stat│
    │ card 3   │  4  │ card 5   │pill│
    ├──────────┼─────┼──────────┤    │
    │ CTA /    │ Proj│ Project  │    │
    │ Contact  │  6  │ card 7   │    │
    └──────────┴─────┴──────────┴────┘

  Project detail (view transition morph):
    Card click → card morphs into full case study page
    Back → reverse morph to grid position
```

### CSS Implementation Notes

The bento grid maps cleanly to the existing CSS custom properties:

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-md);
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--space-lg);
}

.bento-grid__cell--featured {
  grid-column: span 2;
  grid-row: span 2;
}

.bento-grid__cell--stat {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
}
```

Mobile (below 768px): single column, cards stack vertically but remain compact. The grid degrades gracefully — bento becomes a dense list.

### Sources (Bento Grid specific)
- [Senorit: Bento Grid Design Trend 2025](https://senorit.de/en/blog/bento-grid-design-trend-2025)
- [Stan Vision: Bento UI Grid Design Trend](https://www.stan.vision/journal/revolutionizing-ui-ux-in-2024-with-bento-ui-grid-design-trend)
- [WriterDock: Bento Grids & Beyond](https://writerdock.in/blog/bento-grids-and-beyond-7-ui-trends-dominating-web-design-2026)
- [Landdding: Bento Grid Design Guide](https://landdding.com/blog/blog-bento-grid-design-guide)
- [Mockuuups: Best Bento Grid Examples](https://mockuuups.studio/blog/post/best-bento-grid-design-examples/)

---

## Summary: Top 10 Research-Backed Recommendations

1. **Compress the homepage from ~5 screenfuls to ~2** using a bento grid layout
2. **Embed proof metrics in the hero** (repos, tests, years) — do not bury them below the fold
3. **Add view-transition-name to project cards** for morph-to-detail-page navigation
4. **Replace vertical scrolling with progressive disclosure** — expandable cards, tabs, hover reveals
5. **Make the engineering/creative toggle a prominent, persistent UI element** — not a hidden control
6. **Audit dark theme contrast** — `--text-muted` likely fails WCAG AA; increase to `#787878`+
7. **Increase body font weight at small sizes** to counter dark-mode edge glow
8. **Use one accent hue family** (gold variations) for most states; reserve sienna for semantic meaning
9. **Add persistent navigation** (rail or sticky tabs) to eliminate scroll-to-find behavior
10. **Install analytics post-launch** (Clarity/Hotjar) to validate with real hiring manager behavior data

---

*This research document will inform the subsequent UX redesign plan.*
