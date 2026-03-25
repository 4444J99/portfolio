---
name: feedback_lighthouse_ci
description: Lighthouse should NOT run on every push — only when it matters. User was frustrated by weeks of CI loops.
type: feedback
---

Do NOT run Lighthouse on every CI push. It wastes ~12 min and the user considers it pointless for non-visual changes.

**Why:** Lighthouse was broken for 3+ days (ETIMEDOUT) and the user was frustrated by repeated CI failures and notifications. Static portfolio site scores don't drift without code changes.

**How to apply:** Lighthouse now has three smart triggers:
1. `workflow_dispatch` — manual "check scores now"
2. Post-deploy in deploy.yml — auto-validate what shipped
3. Path-conditional on push — only when `src/pages/`, `src/components/`, `src/styles/`, `src/layouts/`, `astro.config.mjs`, or `packages/sketches/` change

Never add Lighthouse back to the daily schedule or unconditional push trigger. The programmatic API (not CLI shell-out) is the correct approach — see `scripts/lighthouse-ci.mjs`.
