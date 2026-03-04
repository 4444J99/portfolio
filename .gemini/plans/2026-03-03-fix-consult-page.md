# Plan: Fix Consult Page Interactivity

## Objective
Fix the "Consult" page which is reported as broken. The page uses Puter.js for AI-powered capability mapping.

## Identified Issues
1. **View Transitions Conflict**: The page's script ran at the top level of the component, which in an Astro View Transitions (ClientRouter) environment only runs once when the bundle is loaded. If the user navigates to `/consult` later, the DOM elements (like `#consult-form`) aren't bound because the script already executed (and likely crashed with a `null` reference if the user wasn't on the consult page initially).
2. **Brittle AI Interaction**: The `puter.ai.chat` call passed the system prompt in the options object, which is less robust than using a messages array.
3. **Simple Markdown Conversion**: The regex-based markdown-to-HTML conversion was very basic and could produce broken layout for common AI response patterns.

## Implementation Steps
- [x] **Wrap Initialization**: Use `astro:page-load` to ensure form binding and event listeners are re-attached on every navigation to the consult page.
- [x] **Harden AI Call**: Update `puter.ai.chat` to use an array of messages (`system` + `user`) for better instruction following.
- [x] **Improve Markdown Logic**: Refine the regex-based conversion to handle lists (both `*` and `-`) and paragraphs more reliably.
- [x] **Add Smoke Test**: Create `src/e2e/consult.smoke.spec.ts` to ensure the form remains interactive across navigations.

## Verification Results
- `npm run typecheck`: Passed.
- `npx playwright test src/e2e/consult.smoke.spec.ts`: Passed (verified form binding and loading state triggers after navigation).
