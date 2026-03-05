# Implementation Plan: Evaluation to Growth (2026-03-04)

## Goal Description
Implement the recommendations from the recent Evaluation-to-Growth assessment (`docs/evaluation-to-growth-report-v2.md`). The primary goals are to reduce local maintenance overhead by abstracting quality scripts and to make the narrative more accessible to non-technical audiences while retaining its core engineering rigor.

## Proposed Changes

### 1. Abstract Quality Scripts into `@4444j99/quality-ratchet-kit`
Many of the standalone Node scripts in the `scripts/` directory should be migrated into the local package `packages/quality-ratchet-kit`.
- **Identify mature scripts:** Audit files such as `scripts/check-quality-deltas.mjs`, `scripts/verify-quality-contracts.mjs`, and `scripts/check-bundle-budgets.mjs`.
- **Relocate logic:** Move the core logic of these scripts to `packages/quality-ratchet-kit/src/`.
- **Update package.json:** Update the portfolio's `package.json` to call the CLI binary provided by the `quality-ratchet-kit` package instead of raw Node scripts.

### 2. Safeguard External API Dependencies (Offline Mode)
The build and quality pipeline relies on external APIs (e.g., PageSpeed Insights for Lighthouse).
- **Implement fallback:** Add a degraded/fallback mechanism in `scripts/lighthouse-cloud.mjs` (or its equivalent in the ratchet kit) to bypass external API checks if a timeout or `429 Too Many Requests` occurs, preventing CI blockade.

### 3. Accessible Narrative Adjustments
The homepage and operative handbook use esoteric terminology ("Organ V", "Kerygma") that might confuse HR screens.
- **Update `src/pages/index.astro`:** Add brief, plain-English subtitles or tooltips (e.g., `<Tooltip text="The central portfolio repository">Organ V</Tooltip>`) to explain the system architecture immediately to new visitors.
- **Audit PDF Resumes:** Ensure the PDFs generated in `public/resume/` using `scripts/orchestrate-resume-pdfs.mjs` have proper plain-text extraction (no overlapping text blocks confusing ATS scanners).

## Verification Plan

### Automated Tests
- Run `npm run test:quality-ratchet-kit` to ensure migrated scripts still pass their core unit tests.
- Run `npm run quality:local` to verify the main portfolio pipeline remains completely green after abstracting the scripts and implementing the API backoff logic.
- Run `npm run test:a11y:runtime` (Playwright) to verify any UI changes made to `src/pages/index.astro` (like tooltips) don't violate accessibility standards.

### Manual Verification
- Render the `npm run dev` environment locally and visually inspect the new layout/text adjustments on the homepage.
- Extract text from a generated PDF resume (using a tool like `pdftotext` or simply copy-pasting from Preview) to manually verify that Applicant Tracking Systems (ATS) will read the correct, sequential plain text without weird line breaks.
