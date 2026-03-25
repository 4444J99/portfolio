---
name: feedback_session_logging
description: Claude session transcripts MUST be persisted remotely — privately, for posterity
type: feedback
---

Claude Code session transcripts (JSONL files in `~/.claude/projects/`) MUST be backed up remotely. Currently local-only — 146MB across 22 sessions for portfolio alone.

**Why:** "Nothing is allowed to be local only." Session transcripts are institutional memory — they record every decision, every tool call, every reasoning chain. If the machine dies, decades of context vanish. The user explicitly requires remote persistence "privately, but for posterity."

**How to apply:** Needs a private remote destination. NOT the portfolio repo (public). Options to evaluate:
1. Private git repo (`4444J99/claude-sessions`) with Git LFS for large JSONL files
2. Domus integration — chezmoi manages machine state, sessions are machine state
3. Periodic archive to private storage (Backblaze B2 already running)
4. Automated sync via launchd agent (pattern: `com.4jp.claude-session-sync.plist`)

Cross-references: IRF-APP-012 (memory persistence SOP), SpecStory skills (specstory-organize, specstory-session-summary) for prior art on session management.
