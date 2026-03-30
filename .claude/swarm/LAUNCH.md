# Swarm Launch — 3 Parallel Agents

## Prerequisites

All agents work from the same HEAD. No branches needed — file boundaries are non-overlapping.

```bash
cd ~/Workspace/4444J99/portfolio
git status  # Must be clean
```

## Launch Order (simultaneous)

### Terminal 1: Gemini (copy generation)

```bash
# Gemini generates prose — no code edits, just markdown output
cat .claude/swarm/gemini-copy.md | gemini -m gemini-2.5-pro
# Or if using file input:
gemini -m gemini-2.5-pro < .claude/swarm/gemini-copy.md
```

Output goes to `scripts/swarm-output/gemini-copy/`. Review before integrating.

### Terminal 2: Codex (package extraction)

```bash
# Codex extracts the rhetoric engine into a standalone package
# Use the codex CLI or paste the prompt into the Codex web interface
cat .claude/swarm/codex-package.md
# Then run codex with the content of that file as the prompt
```

Touches: `packages/shibui-rhetoric/`, `plugins/shibui-rhetoric.mjs`, `plugins/rehype-shibui-lens.mjs`, `package.json`

### Terminal 3: OpenCode (UX improvements)

```bash
# OpenCode builds the onboarding UX and adds analytics
opencode
# Then paste the contents of .claude/swarm/opencode-ux.md as the prompt
```

Touches: `src/components/shibui/`, `src/styles/global.css`, `src/layouts/Layout.astro`

## File Boundary Map

```
Gemini:    scripts/swarm-output/gemini-copy/  (WRITE ONLY — new files)
Codex:     packages/shibui-rhetoric/          (CREATE)
           plugins/shibui-rhetoric.mjs        (MODIFY — re-export)
           plugins/rehype-shibui-lens.mjs     (MODIFY — import path)
           plugins/__tests__/                 (MOVE)
           package.json                       (MODIFY — workspace ref)
OpenCode:  src/components/shibui/             (MODIFY + CREATE)
           src/styles/global.css              (MODIFY — lines 125-340 only)
           src/layouts/Layout.astro           (MODIFY — add component)
           src/components/scripts/            (MODIFY — analytics)
```

Zero overlap. No merge conflicts expected.

## After All Complete

```bash
# Claude Code merges, reviews, runs full verification
npm run build && npm test && npm run validate
# If green: commit, push, deploy
```

## Conflict Resolution

If any agent touches a file outside its boundary:
1. Check if the change is necessary (build fix, import update)
2. If yes: accept it, note in commit message
3. If no: revert that file, keep the rest
