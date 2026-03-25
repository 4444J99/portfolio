---
name: project_security_allowlist
description: Security allowlist fully resolved 2026-03-24 — 0 vulns, 0 entries, #47 closed, #66 closed
type: project
---

Security allowlist is **fully resolved** as of 2026-03-24.

**Timeline:**
- 2026-03-15: 8 vulns allowlisted (undici + yauzl chain)
- 2026-03-15: @lhci/cli replaced → 8→6
- 2026-03-17: Self-healing workflow auto-removed 5 yauzl-chain entries → 6→1
- 2026-03-17: jsdom/cheerio/linkinator replaced with happy-dom → 1→0
- 2026-03-20: 5 new entries (h3 + fast-xml-parser chains)
- 2026-03-23: h3@1.15.10 published, h3 chain removed
- 2026-03-24: fast-xml-parser chain auto-removed by lifecycle workflow. Allowlist empty.

**Current state:** `.quality/security-allowlist.json` → `entries: []`. `npm audit` → 0 vulnerabilities. GitHub Issues #47 (closed), #66 (closed).

**Why:** Documents the full security-to-zero journey for future reference. The self-healing lifecycle workflow proved effective — both manual fixes and automated expiry worked correctly.

**How to apply:** If new vulns appear, follow the existing pattern: allowlist with 14-day TTL, create tracking issue, let lifecycle workflow auto-remove when upstream fixes land.
