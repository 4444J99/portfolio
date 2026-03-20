# Exhaustive Todo List — Portfolio (2026-03-20)

State snapshot after the mega session (73 commits, 30+ issues closed).

---

## Immediate Code Tasks (no design/human dependencies)

- [ ] **#58** Fix date timezone shift in `toLocaleDateString` across all components — add `timeZone: 'UTC'` to prevent off-by-one date display
- [ ] **#59** Scriptable content sync from praxis-perpetua to portfolio — automate the data pipeline that currently requires manual `generate-data` runs
- [ ] **#60** OG image generation for pathos posts — extend the existing `src/pages/og/[...slug].png.ts` to handle the new pathos content collection
- [ ] Update omega auto-generated section in `~/Workspace/CLAUDE.md` from 4/17 → 7/17 (stale)
- [ ] Investigate `~/Workspace/4444J99/CLAUDE.md` "PERSONAL organ not found" errors in auto-generator
- [ ] Run `npm run generate-data` to refresh `projects.json` (flagged as 29.9 days stale by freshness check)
- [ ] Regenerate org landing pages (`npm run deploy:org-pages`) to reflect updated repo counts

## Visual Design (needs user feedback loop)

- [ ] **#52** Bento grid redesign — MUST be component-by-component, NOT a wrapper. Each section needs individual redesign for grid format. User must review in browser after each change. Research at `.claude/plans/2026-03-17-ux-redesign-research.md`
- [ ] **#21** Page-by-page visual refinement audit — open each page in browser, identify CSS issues, fix one at a time with visual verification

## Omega Acceleration (needs human action)

### This week (1-2 hours each)
- [ ] **#53/#16** Create Stripe account → Payment Link ("Consult — 60min — $150") → paste URL in consult CTA → flips criteria #9 + #10
- [ ] **#53** Enable GitHub Sponsors ($1/$5/$15 tiers) → flips #10 when first sponsor signs up
- [ ] **#53** Post on r/webdev "Showoff Saturday" with 3 specific feedback questions → works toward #7

### Next 2 weeks
- [ ] **#53** Write Dev.to article: "Portfolio with 461 Tests and a Quality Scorecard" → #7
- [ ] **#53** Post Show HN if r/webdev + Dev.to yield <3 feedback pieces → #7
- [ ] **#53** Schedule Twitter Space: "105 Repos, 1 Person, 0 Employees" → #11
- [ ] **#53** Create 3 truly-10-minute good-first-issues + post in r/learnprogramming → #12
- [ ] **#17** DM 3 friends for 20-min stranger test sessions (SUS questionnaire) → #2
- [ ] **#17** Post in Odin Project Discord for runbook tester → #4

### Ongoing
- [ ] **#53** Submit PlatformCon 2026 CFP → #14
- [ ] **#53** Create PodMatch profile → #14
- [ ] **#17** Find reciprocal bus-factor partner (developer friend) → #16

## Content Pipeline

- [ ] Integrate pathos content collection into site navigation (header, footer, or essays page)
- [ ] Wire `/validation` page into header nav if not already linked
- [ ] Monitor allowlist lifecycle workflow — currently 0 entries but new vulns can appear
- [ ] Quarterly: re-run `update-project-readmes.mjs --commit` to keep nav footers current
- [ ] Quarterly: re-run `deploy:org-pages` to refresh landing pages with new repo data

## Technical Debt

- [ ] `/omega` page has intermittent chunk resolution error in build output — investigate
- [ ] `sync-trust-metrics.mjs` line 27 reads `human-impact.json` without try/catch (only unguarded read)
- [ ] `projects.json` freshness — 29.9 days stale, needs `generate-data` run from sibling Python repo
- [ ] Dashboard triage buttons are non-functional (no backend handler) — noted in blind spots sweep
- [ ] 12 scout candidates stuck in triage since Feb 28 — pipeline works but is underutilized

## Quality Ratchet

Current phase: **W12** (0 hint budget, 45% coverage floors)
- Statements: 80.63% (floor: 45%) — well above
- Branches: 69.66% (floor: 32%)
- Functions: 70.03% (floor: 32%)
- Lines: 81.16% (floor: 45%)
- Test count: 461+
- Vulnerabilities: 0
- Lighthouse: advisory only (not blocking)

## Omega Scorecard: 7/17 Met

```
✓ #1  Soak test (30 days, 0 incidents)     Met 2026-03-18
✓ #3  Engagement baseline (30 days data)   Met 2026-03-18
✓ #5  Application submitted (Doris Duke)   Met 2026-02-24
✓ #6  AI-conductor essay published          Met 2026-02-12
✓ #8  ORGAN-III product live                Met 2026-02-28
✓ #13 Organic inbound link (LobeHub)        Met 2026-02-28
✓ #17 30+ days autonomous operation         Met 2026-03-18

◐ #15 Portfolio with external validation    In progress

✘ #2  Stranger test >=80%     → needs 3 people
✘ #4  Runbooks validated      → needs 1 person
✘ #7  >=3 external feedback   → needs community posts
✘ #9  revenue_status: live    → needs Stripe Payment Link
✘ #10 MRR >= operating costs  → needs $1/month (GitHub Sponsors)
✘ #11 >=2 salons/events       → needs Twitter Space + workshop
✘ #12 >=3 contributions       → needs contributor recruitment
✘ #14 >=1 recognition event   → needs CFP/publication acceptance
✘ #16 Bus factor >1           → needs second operator
```

## GitHub Issues Summary

**Open (8):** #16, #17, #21, #52, #53, #58, #59, #60
**Closed this session (30+):** #15, #18, #19, #20, #22, #23, #24, #25, #26, #27, #28, #29, #30, #31, #32, #33, #34, #35, #36, #41, #47, #54, #55, #56, #57
