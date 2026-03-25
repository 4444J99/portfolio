---
name: Deploy must work every time — user frustration with broken pipeline
description: User expressed strong frustration multiple times about portfolio not updating after pushes. Never let deploy break silently.
type: feedback
---

The user has been burned MULTIPLE times by the deploy pipeline failing silently. Pushes go through, CI runs, but the site doesn't update — and there's no notification.

**Why:** Dependabot merged an Astro major version bump that broke 6 things. Each fix revealed another issue. The user had to ask "why isn't it updating?" repeatedly.

**How to apply:**
1. After ANY push, verify CI passes AND deploy triggers. Don't assume.
2. If CI fails, fix it IMMEDIATELY — don't move on to other work.
3. After fixing, run `node scripts/post-deploy-smoke.mjs` to verify the live site updated.
4. Never merge Dependabot PRs with major version bumps without running `npm run preflight` first.
5. The user's command "commit all > push > source returned improved" means: stage everything, commit, push, and VERIFY THE LIVE SITE UPDATED.
