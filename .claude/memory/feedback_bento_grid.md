---
name: Bento grid — don't wrap full-width components in grid cells
description: Two bento grid attempts broke the homepage layout. Components designed for full-width can't be jammed into grid cells without redesigning them individually.
type: feedback
---

Two attempts at a bento grid homepage BOTH failed and were reverted:
1. First attempt: wrapped HeroSection (8-col) + PersonaCards (4-col) in a 12-col grid. Hero text wrapped badly, persona cards overflowed, massive gaps everywhere.
2. Second attempt: same approach with original components as grid cells. Still broke because the components have internal padding, margins, and widths designed for full-width flow.

**Why:** The user said "it literally looks awful" and showed screenshots proving it. Full-width components can't be jammed into grid cells — each component needs to be purpose-built for the grid format.

**What worked:** CSS-only pairing — using `display: grid; grid-template-columns: 1fr 1fr;` on wrapper divs to put stats+personas side-by-side and CTA+contact side-by-side. No component rewrites, just layout adjustments with `:global()` overrides.

**How to apply:** If the user asks for bento again, do NOT wrap existing components. Either (a) create new purpose-built components from scratch, or (b) use CSS pairing on small groups. Each change needs visual review before shipping — don't generate blind.
