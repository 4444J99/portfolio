---
name: shibui_content_system
description: The Shibui depth system — three-level content complexity control (Overview/Standard/Full Depth) shipped 2026-03-24
type: project
---

Shibui Content System shipped Phase 1 on 2026-03-24. Named after the Japanese aesthetic of understated beauty with hidden depth.

**What it does:** Global three-state depth control (Overview/Standard/Full Depth) that toggles between simplified and elevated prose. Concentric rings icon in the header. localStorage persistence. Referral-aware first-visit default (GitHub→Full, LinkedIn→Overview).

**Why:** "I don't understand anything on this webpage" was consistent feedback from recruiters, family, and engineers unfamiliar with the domain vocabulary. Seven independent audits converged on the same diagnosis.

**Phase 1 scope (shipped):**
- Utility module: `src/utils/shibui.ts` (21 tests)
- CSS: layer rules in `global.css` with `html[data-shibui-depth]`
- Components: `ShibuiRestore.astro` (FOUC prevention), `DepthControl.astro`, `ShibuiContent.astro`, `ShibuiTerm.astro`, `ShibuiGlint.astro`
- Pilot pages: index hero (both engineering + creative views) and about (bio + organ map)

**Phase 2 (not yet started):**
- Content extraction to YAML
- AI distillation pipeline (`shibui:distill`)
- Project page migration (21 pages)
- Resume page migration
- Per-page depth floors (`data-shibui-page-floor`)

**How to apply:** When adding new content pages, wrap prose in `<ShibuiContent>` with entry/elevated slots. Use `<ShibuiTerm>` for inline term annotations. Add bridge buttons after each ShibuiContent block.

**Spec:** `docs/superpowers/specs/2026-03-24-shibui-content-system-design.md`
**Plan:** `docs/superpowers/plans/2026-03-24-shibui-phase-1.md`
