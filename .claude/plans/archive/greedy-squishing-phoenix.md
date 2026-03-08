# Plan: Consolidate Two Portfolio Directories

## Context

Two clones of the same `4444J99/portfolio` GitHub repo exist locally:

| | Dir 1 (MASTER) | Dir 2 (Current working) |
|---|---|---|
| **Path** | `/Users/4jp/Workspace/4444J99/portfolio` | `/Users/4jp/Workspace/portfolio` |
| **Remote** | `https://github.com/4444J99/portfolio.git` | `git@github.com:4444J99/portfolio.git` |
| **Local HEAD** | `c89c085` (24 commits) | `41c3a5f` (137 commits) |
| **origin/main** | `41c3a5f` (after fetch) | `41c3a5f` |
| **Uncommitted** | Clean | Clean |
| **Local-only state** | `node_modules/`, `intake/` (just README.md) | `.venv/`, `node_modules/`, `intake/` (emergency-help/, multimedia-specialist.pdf, MET4/, reports) |

**Key finding:** Both repos point to the same GitHub remote. Dir 2 is the actively developed clone (137 commits, all features). Dir 1 is a stale shallow/partial clone — its 24 local commits are a strict subset already present in origin. After `git fetch`, Dir 1's `origin/main` matches Dir 2's HEAD exactly. Dir 1 has **zero** local commits not on origin.

The gitignored `intake/` content in Dir 2 is the only non-repo state that matters — it contains the emergency-help extraction output (92 files), `multimedia-specialist.pdf`, MET4 materials, and research reports.

---

## Step 1: Fast-forward Dir 1 to match origin

```bash
cd /Users/4jp/Workspace/4444J99/portfolio
git pull --ff-only origin main
```

This brings MASTER from `c89c085` → `41c3a5f` (113 commits fast-forward). No merge needed — Dir 1 has zero divergent commits.

## Step 2: Copy gitignored intake content from Dir 2 → Dir 1

```bash
# Copy intake files that aren't tracked by git
cp -R /Users/4jp/Workspace/portfolio/intake/emergency-help \
      /Users/4jp/Workspace/4444J99/portfolio/intake/

cp /Users/4jp/Workspace/portfolio/intake/multimedia-specialist.pdf \
   /Users/4jp/Workspace/4444J99/portfolio/intake/

# Copy any other intake materials
cp /Users/4jp/Workspace/portfolio/intake/auto_resume_research_report.md \
   /Users/4jp/Workspace/portfolio/intake/github_professionalization_report.md \
   /Users/4jp/Workspace/4444J99/portfolio/intake/

# Copy MET4 if it exists
cp -R /Users/4jp/Workspace/portfolio/intake/MET4 \
      /Users/4jp/Workspace/4444J99/portfolio/intake/ 2>/dev/null || true
```

## Step 3: Copy .venv from Dir 2 → Dir 1

```bash
cp -R /Users/4jp/Workspace/portfolio/.venv \
      /Users/4jp/Workspace/4444J99/portfolio/
```

## Step 4: Install node_modules in Dir 1

```bash
cd /Users/4jp/Workspace/4444J99/portfolio
npm install
```

(Faster than copying `node_modules/` — ensures correct platform binaries.)

## Step 5: Verify Dir 1 is fully operational

```bash
cd /Users/4jp/Workspace/4444J99/portfolio
git log --oneline -3                    # Should show 41c3a5f at HEAD
ls intake/emergency-help/README.md      # Should exist
.venv/bin/python --version              # Should show 3.14.x
npm run build                           # Should build successfully (optional)
```

## Step 6: Update Claude Code project config

Rename the existing Claude project config directory so future sessions at the MASTER path inherit the conversation history and memory:

```bash
mv /Users/4jp/.claude/projects/-Users-4jp-Workspace-portfolio \
   /Users/4jp/.claude/projects/-Users-4jp-Workspace-4444J99-portfolio
```

## Step 7: Remove Dir 2

After confirming Dir 1 is complete:

```bash
rm -rf /Users/4jp/Workspace/portfolio
```

## Step 8: Symlink

```bash
ln -s /Users/4jp/Workspace/4444J99/portfolio /Users/4jp/Workspace/portfolio
```

This preserves the old path for any hardcoded references (e.g., in `scripts/extract_emergency_help.py` output paths).

---

## Files Modified/Created

| Location | Action |
|----------|--------|
| Dir 1 git state | Fast-forward 113 commits |
| Dir 1 `intake/` | Copied from Dir 2 (gitignored) |
| Dir 1 `.venv/` | Copied from Dir 2 (gitignored) |
| Dir 1 `node_modules/` | Fresh install (gitignored) |
| `~/.claude/projects/` config | Renamed path |
| Dir 2 | Deleted |

---

## Verification

1. `git -C /Users/4jp/Workspace/4444J99/portfolio log --oneline -1` → `41c3a5f`
2. `ls /Users/4jp/Workspace/4444J99/portfolio/intake/emergency-help/VERIFICATION_REPORT.md` → exists
3. `git -C /Users/4jp/Workspace/4444J99/portfolio status` → clean
4. `test ! -d /Users/4jp/Workspace/portfolio/.git` → Dir 2 git repo gone (or is symlink)
