---
name: feedback_memory_persistence
description: Memory MUST be persisted both locally AND in the repo — soul survives machine death
type: feedback
---

Memory files MUST exist in BOTH locations simultaneously:
1. `~/.claude/projects/.../memory/` (local — Claude Code reads from here)
2. `.claude/memory/` in the repo (remote — survives machine death)

**Why:** The user's rule: "persistent memory MUST be local & remote simultaneously; if the physical manifestation dies > soul persists." Memory that only exists locally is fragile. The repo is the soul's backup.

**How to apply:** On every session close that modifies memory, copy updated files to `.claude/memory/` in the repo and include in the commit. This is a close-out step alongside IRF updates and git push. IRF-APP-012 tracks automating this.
