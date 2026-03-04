# Plan: Project-Wide Review & Critique (Evaluation-to-Growth)

## Objective
Perform a comprehensive project-wide review of the `portfolio` project using the `evaluation-to-growth` framework. Address identified weaknesses in the quality pipeline, particularly around PageSpeed Insights (PSI) quota issues and automation of quality artifacts.

## Key Files & Context
- `package.json`: Main entry point for scripts and dependencies.
- `README.md`, `GEMINI.md`, `CLAUDE.md`: Project documentation and mandates.
- `.quality/`: Directory containing all quality policies and metrics.
- `scripts/lighthouse-cloud.mjs`: Script for cloud-based Lighthouse audits.
- `scripts/generate-quality-summary.mjs`: Script that aggregates all metrics into a markdown report.
- `scripts/verify-quality-contracts.mjs`: Ensures metrics are fresh and valid.

## Implementation Steps

### 1. Phase 1: Evaluation (Critique & Analysis)
- [ ] **Critique**: Assess the current state of the project.
    - **Strengths**: Robust quality ratchet, clear organization, excellent documentation, high performance (100 LH).
    - **Weaknesses**: PSI API quota issues (429 errors), complexity of script ecosystem, some manual sync steps remaining.
- [ ] **Logic Check**: Verify consistency between policy JSONs and documentation.
- [ ] **Logos/Pathos/Ethos**: Evaluate the "professional rigor" signal and strategic impact of the "Operative Handbook".

### 2. Phase 2: Reinforcement (Synthesis & Refinement)
- [ ] **Refine Lighthouse Cloud**: Update `scripts/lighthouse-cloud.mjs` to handle 429 errors more gracefully, possibly by implementing a retry mechanism with backoff or a clearer "quota exceeded" status that doesn't necessarily fail the entire build if a local fallback is available.
- [ ] **Consolidate Quality Lifecycle**: Ensure all critical data syncs (`sync:vitals`, `sync:omega`, etc.) are correctly hooked into the build lifecycle to prevent stale data.

### 3. Phase 3: Risk Analysis (Blind Spots & Shatter Points)
- [ ] **Blind Spot**: Check if `green-run-history.json` is actually working. The quality summary shows it as "skipped".
- [ ] **Shatter Point**: The PSI API failure (`429`) is a shatter point for the "lighthouse:cloud" command.

### 4. Phase 4: Growth (Bloom & Evolve)
- [ ] **Bloom**: Propose a "Quality Scoreboard" or more detailed "Green Run" visualization on the `/dashboard` page.
- [ ] **Evolve**: Produce an updated `docs/evaluation-to-growth-report.md` reflecting the latest state and improvements.

## Verification & Testing
- [ ] Run `npm run verify:quality` to ensure all quality artifacts are fresh.
- [ ] Run `npm run typecheck:strict` to verify type-safe quality thresholds.
- [ ] Manually check `.quality/quality-summary.md` for completeness.
- [ ] Verify governance sync via `quality-governance.test.ts`.
