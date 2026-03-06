# Implementation Plan - Evaluation to Growth: Test Suite & Skeletons

## 1. 🔍 Analysis & Context
*   **Objective:** Conduct a project-wide review using the evaluation-to-growth protocol and implement a plan to give incomplete skeletons/stubs "meat & full-breath" by closing critical test coverage gaps.
*   **Affected Files:**
    *   `src/components/sketches/__tests__/sketch-loader.test.ts`
    *   `src/components/charts/__tests__/chart-loader.test.ts`
    *   `src/components/academic/__tests__/mermaid-loader.test.ts`
    *   `src/pages/__tests__/feed.xml.test.ts`
    *   `src/pages/og/__tests__/slug.png.test.ts`
    *   `src/utils/__tests__/architecture-data.test.ts`
*   **Key Dependencies:** Vitest, jsdom, p5.js (mocked), D3.js (mocked).
*   **Risks/Unknowns:** Mocking dynamic imports (`import('p5')`) and async scheduling (`requestIdleCallback`, `IntersectionObserver`) in jsdom can be tricky. Careful global stubbing is required to avoid test flakiness.

---

## 2. 📋 Checklist
- [ ] Step 1: Implement Comprehensive Tests for `sketch-loader.ts` (Target: >80% coverage)
- [ ] Step 2: Implement Comprehensive Tests for `chart-loader.ts` (Target: >80% coverage)
- [ ] Step 3: Implement Comprehensive Tests for `mermaid-loader.ts` (Target: >80% coverage)
- [ ] Step 4: Patch Edge Case Coverage in `feed.xml.ts` and `[...slug].png.ts`
- [ ] Step 5: Verify the complete test suite execution and coverage metrics.

---

## 3. 📝 Step-by-Step Implementation Details

### Step 1: Implement Comprehensive Tests for `sketch-loader.ts`
*   **Goal:** Replace the current static "stub" tests with robust runtime behavior validation, covering the async import queue, intersection observation, and fallback error handling.
*   **Action:**
    *   Modify `src/components/sketches/__tests__/sketch-loader.test.ts`.
    *   Add mocks for `requestIdleCallback` (executing immediately) and `PerformanceObserver`.
    *   Write tests to validate `initSketches` triggering `IntersectionObserver` logic.
    *   Write tests to validate the `initQueue` concurrency limit (`MAX_CONCURRENT = 4`).
    *   Write tests to cover the `.catch()` block when a sketch module fails to load (validating `showFallback` DOM manipulation).
    *   Write tests for `pauseSketch` and `resumeSketch` modifying `data-paused` attributes.
*   **Verification:** `npm run test -- run src/components/sketches/__tests__/sketch-loader.test.ts --coverage` yields >80% statement coverage.

### Step 2: Implement Comprehensive Tests for `chart-loader.ts`
*   **Goal:** Ensure the dynamic import and chart rendering logic is fully tested.
*   **Action:**
    *   Modify `src/components/charts/__tests__/chart-loader.test.ts`.
    *   Simulate intersection events to trigger `loadChart`.
    *   Mock the dynamic import of chart renderers (e.g., `../bar-chart`, `../line-chart`).
    *   Test window resize debouncing logic.
*   **Verification:** `npm run test -- run src/components/charts/__tests__/chart-loader.test.ts --coverage` yields >80% coverage.

### Step 3: Implement Comprehensive Tests for `mermaid-loader.ts`
*   **Goal:** Validate lazy initialization of Mermaid diagrams.
*   **Action:**
    *   Modify `src/components/academic/__tests__/mermaid-loader.test.ts`.
    *   Provide a mock DOM element with `.mermaid` class.
    *   Simulate the intersection observer callback.
    *   Mock the dynamic `mermaid` module import and its `run()` function.
*   **Verification:** `npm run test -- run src/components/academic/__tests__/mermaid-loader.test.ts --coverage` yields >80% coverage.

### Step 4: Patch Edge Case Coverage in Utilities and Pages
*   **Goal:** Close small missing lines in highly tested files.
*   **Action:**
    *   Modify `src/pages/__tests__/feed.xml.test.ts` to include tests for edge cases (e.g. missing metadata or empty collections) triggering branches on lines 21-43.
    *   Modify `src/pages/og/__tests__/slug.png.test.ts` to cover the fallback branch on line 102.
    *   Modify `src/utils/__tests__/architecture-data.test.ts` to test lines 52-53 (likely error handling or missing values).
*   **Verification:** Respective test files achieve 100% statement and branch coverage.

---

## 4. 🧪 Testing Strategy
*   **Unit Tests:** Vitest will be used exclusively. Mock `IntersectionObserver`, `requestIdleCallback`, and dynamic `import()` thoroughly.
*   **Integration Tests:** The interaction between the loader utilities and DOM nodes will be verified within the jsdom environment.
*   **Manual Verification:** Run `npm run test:coverage` and verify that `All files` coverage exceeds 75% statement coverage and the previously flagged files are green.

## 5. ✅ Success Criteria
*   `sketch-loader.ts` coverage > 80%.
*   `chart-loader.ts` coverage > 80%.
*   `mermaid-loader.ts` coverage > 80%.
*   Project-wide coverage is demonstrably improved and passes the CI ratchet policy.
*   No "stubbed" tests remain for these core visual pipelines; they validate actual DOM/async behavior.
