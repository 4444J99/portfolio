# Fix p5.js Animated Background Not Rendering

## Context

The animated p5.js background on the live portfolio site (`4444j99.github.io/portfolio/`) shows a solid dark/black background instead of the spectrum color animation. The background was introduced in commits `862a40c`–`be58ee0` and has not been modified since. Build succeeds, deployment is current (SHA `908e4ab`), and all JS assets load correctly from GitHub Pages.

**Root cause hypothesis**: A silent runtime error during p5 initialization — all Promise chains in `sketch-loader.ts` lack `.catch()` handlers, so any error is swallowed as an unhandled promise rejection. The user never sees what went wrong.

## Investigation Summary

Verified working:
- All 30 sketch files exist
- Build succeeds cleanly (Astro v5.17.1, p5 v2.2.1)
- HTML has `<div id="bg-canvas">` + `<script type="module">` properly linked
- p5 v2 exports default constructor, supports instance mode
- JS module chain: Layout script → sketch-loader chunk → lazy-loads p5 (1MB) + individual sketches
- Live site serves correct files (verified via WebFetch)
- CSS positioning correct (`position: fixed; inset: 0; z-index: -1`)

## Plan

### Step 1: Add error handling to sketch-loader.ts

**File**: `/Users/4jp/Workspace/portfolio/src/components/sketches/sketch-loader.ts`

Add `.catch(err => console.error(...))` to all three Promise.all chains:

1. **`initSketch()`** (line 65–98): Add `.catch(err => console.error('[sketch]', sketchId, err))`
2. **`initBackground()`** (line 153–175): Add `.catch(err => console.error('[bg-sketch]', err))`
3. General: wrap the `new P5(...)` call in a try-catch inside each `.then()` for more granular error reporting

### Step 2: Test locally — reproduce the issue

Run `npm run dev` in the portfolio repo and open `http://localhost:4321/portfolio/` in Chrome. Check the browser DevTools console for errors. This will reveal the exact runtime error.

### Step 3: Fix the root cause

Based on the error from Step 2, fix the underlying issue. Most likely candidates:

- **p5 v2 API change**: If a method like `loadPixels()`, `updatePixels()`, or `noise()` behaves differently, update the sketch code
- **Module loading failure**: If the dynamic import fails, add retry logic or preload the module
- **Canvas creation conflict**: p5 v2's `#_setup()` creates a default 100x100 canvas before the user's `setup()` runs — if the old canvas isn't properly cleaned up, it could interfere

### Step 4: Rebuild and deploy

1. Run `npm run build` to verify clean build
2. Commit the fix
3. Push to trigger GitHub Pages deployment
4. Verify on live site

## Files to Modify

- `/Users/4jp/Workspace/portfolio/src/components/sketches/sketch-loader.ts` — add error handling
- `/Users/4jp/Workspace/portfolio/src/components/sketches/background-sketch.ts` — if p5 v2 API fix needed

## Verification

1. `npm run dev` → open in browser → check for animated color background
2. `npm run build` → verify clean build with no errors
3. After deploy: visit `https://4444j99.github.io/portfolio/` and confirm animated background renders
4. Check multiple pages (index, about, resume) since Layout.astro applies the background globally
