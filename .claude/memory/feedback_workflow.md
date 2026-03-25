---
name: Workflow preferences — push to main, no PRs
description: User wants direct-to-main workflow, immediate pushes, no feature branches or PRs unless explicitly requested
type: feedback
---

Always push branches to origin immediately — user does not want local-only branches.
Merge feature branches into main and push when done — user wants one branch, not lingering feature branches.
Don't ask about PRs unless the user requests one — just merge and push.

**Why:** User works solo and values velocity over ceremony. PRs add friction without review benefit in a single-person project.

**How to apply:** After any commit, push to main immediately. Never create feature branches unless the user asks. Never suggest PRs.
