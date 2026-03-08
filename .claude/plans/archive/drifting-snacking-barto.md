# Autonomous LinkedIn Profile Update

## Context

Your portfolio site was just overhauled for job applications (simplified nav, LinkedIn links everywhere, "available for work" signal, skill filters, consistent data). The LinkedIn profile itself now needs to reflect that same professional narrative. The goal is to use `claude-in-chrome` browser automation to update the profile while you supervise, pulling content from the portfolio's CV YAML and page content.

**LinkedIn URL**: `https://www.linkedin.com/in/anthony-james-padavano-98a40a186/`
**Primary data source**: `resume/Anthony_James_Padavano_CV.yaml`

### Why Browser Automation (not API)

LinkedIn's API does **not** allow individual developers to edit profile fields. The only self-service permissions are read-only (`profile`, `email`) and social posting (`w_member_social`). The Profile Edit API exists but is restricted to approved partner programs (Talent/RSC integrations). Browser automation via `claude-in-chrome` is the only viable path.

Sources: [Getting Access](https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access), [Profile Edit API](https://learn.microsoft.com/en-us/linkedin/shared/integrations/people/profile-edit-api/positions), [Product Catalog](https://developer.linkedin.com/product-catalog)

---

## Approach: Three-Phase Architecture

**Snapshot** (read current state) → **Prepare** (compose all content locally) → **Execute** (browser automation to paste & save)

All content is pre-composed as plain text before any browser interaction begins. The browser phase becomes a pure "navigate, select-all, paste, save" operation — minimizing time in LinkedIn's fragile editor modals.

---

## Phase 1: Snapshot (Read Current State)

1. `tabs_context_mcp` → `tabs_create_mcp` to get a fresh tab
2. Navigate to LinkedIn profile, wait for React hydration (~5s)
3. Verify logged-in state (look for "Me" menu in navbar). **HALT if not logged in** — we never automate login
4. `get_page_text` to capture full current profile text as rollback reference
5. Screenshot the full profile (scroll through, capture 4-5 screenshots)

---

## Phase 2: Prepare Content

Compose all content in-agent before touching the browser. Sources:

| Section | Content | Source |
|---------|---------|--------|
| **Headline** | `Creative Technologist & Systems Architect · AI/ML, Multi-Agent Systems, Generative Art` | CV YAML + about.astro |
| **About** | ~850 chars: 10+ years narrative, eight-organ system (91 repos, 386K words), 17.5M views, $2M raised, certifications, "open to" CTA, portfolio link | CV YAML summary + system-metrics.json |
| **Featured** | Portfolio link: `https://4444j99.github.io/portfolio/` | — |
| **Experience** | 5 roles with quantified bullets (see below) | CV YAML lines 61-110 |
| **Education** | MFA Creative Writing (FAU, 2015-2018), BA English Lit (CUNY CSI, 2010-2014) | CV YAML |
| **Certifications** | Full-Stack Dev (Meta), UX Design (Google), Digital Marketing (Google), Project Mgmt (Google) | CV YAML |
| **Skills** | ~30 skills: Python, TypeScript, JavaScript, Go, Rust, React, Next.js, Node.js, FastAPI, Docker, etc. | CV YAML |

### Experience Details

**1. Creative Technologist** | Independent | 2021–Present
- Eight-organ orchestration system: 91 repos, 8 GitHub orgs, 82+ CI/CD workflows, ~386K words documentation
- recursive-engine: 1,254 tests, 85% coverage — symbolic OS translating epistemological frameworks into executable Python
- Generative art/music systems, interactive installations, AI-conductor human-AI co-creation workflow

**2. Digital Marketing Manager** | Miami Dade College Foundation | 2023–2024
- 32% increase in donor engagement, fundraising goals surpassed
- 38% website traffic growth, 22% improvement in donation conversions
- 28% increase in click-through rates via multimedia storytelling

**3. Multimedia Specialist** | AJP Media Arts | 2011–Present
- 17.5M+ views, $2M in client fundraising/revenue
- 290% ROI on key campaigns, 42% engagement increase on client websites
- 26% satisfaction increase, 35% retention improvement via UI/UX redesigns

**4. Instructor** | Miami Dade College, FAU, Nova Southeastern, et al. | 2015–Present
- 2,000+ students across 100+ composition courses, 85% above-average achievement
- 92% student approval rating, 97% course completion rate

**5. Project Manager** | Majestic Design | 2007–2018
- 50 commercial/residential projects, 90% on-time and within budget
- 25% increase in repeat business via 3D renderings and video walkthroughs

---

## Phase 3: Execute (Browser Automation)

### Execution Order (lowest risk / highest impact first)

1. **Headline** — single field, max impact, ~1-2 min
2. **About** — single text block, ~2-3 min
3. **Featured** — one link, ~2-3 min
4. **Experience** (5 roles) — multiple modals, ~15-20 min
5. **Education** (2 entries) — ~3-5 min
6. **Certifications** (4 entries) — ~5-8 min
7. **Skills** (30+ items) — highest risk (repetitive actions), ~15-25 min

If automation gets blocked at step 7, the critical sections (1-6) are already saved.

### Per-Section Pattern

```
find("edit button for [section]") → click → wait 3s → screenshot
read_page(filter: "interactive") to map form fields
triple-click or Cmd+A to select existing text
javascript_tool: navigator.clipboard.writeText(content) → Cmd+V to paste
find("save button") → click → wait 5s → screenshot to verify
```

For long text (About, Experience descriptions): **clipboard paste** via `javascript_tool` + Cmd+V. Character-by-character typing is too slow and looks robotic.

For company name fields: type name, wait 2s for autocomplete dropdown, screenshot to verify suggestion, click correct one or press Escape for freetext.

For date dropdowns: `find` the dropdown, click, then `find` and click the correct option.

### Anti-Detection Pacing

- **Variable delays**: 1.5-4s between actions (not fixed intervals)
- **Natural scrolling**: gradual scroll to elements, don't jump
- **Hover before click**: move cursor near target first
- **Session breaks**: 30-60s pause after completing Experience before starting Education
- **Single tab**: all work in one tab
- **No DOM manipulation**: only use `javascript_tool` for clipboard, never to modify LinkedIn's DOM directly

### Abort Conditions (HALT immediately)

- CAPTCHA or security challenge appears
- Account restriction warning
- 3+ consecutive section failures
- Session expired (redirected to login)

### Fallback Chain

If `find` can't locate an element:
1. Try `read_page(filter: "interactive")` to map all interactive elements
2. Try `computer(action: "screenshot")` and identify coordinates visually
3. If still stuck, skip section, log it, move to next

---

## Pre-Execution Checklist

Before starting Phase 3, confirm:
- [ ] LinkedIn is open and logged in within Chrome
- [ ] Claude-in-chrome extension is active and connected
- [ ] You're available to supervise (can dismiss CAPTCHAs if they appear)
- [ ] You accept the inherent risk of automated profile editing (LinkedIn may flag the account)
- [ ] Content from Phase 2 has been reviewed and approved

---

## Verification

After all sections updated:
1. Navigate to public profile view
2. Full screenshot series (scroll through entire profile)
3. `get_page_text` to capture final state
4. Compare against prepared content — confirm all sections match

---

## Key Files

| File | Role |
|------|------|
| `resume/Anthony_James_Padavano_CV.yaml` | Primary data source for all sections |
| `src/pages/about.astro` | Professional narrative, practice statement |
| `src/pages/resume.astro` | Rendered resume formatting reference |
| `src/data/system-metrics.json` | Quantified metrics (91 repos, 3,586 code files) |

---

## Estimated Duration

~45-70 minutes total (conservative pacing for anti-detection). Can be split across sessions if needed — checkpointing after each section means we can resume from any point.
