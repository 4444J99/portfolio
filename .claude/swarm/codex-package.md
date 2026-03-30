# Codex Task: Extract shibui-rhetoric as Standalone Package

## Context

The portfolio at `/Users/4jp/Workspace/4444J99/portfolio/` has a rhetorical text transformation engine at `plugins/shibui-rhetoric.mjs`. It contains five linguistically-grounded functions that simplify academic prose:

- F1: Complexity Reduction (flatten embedded clauses)
- F2: Term Substitution (replace domain terms with definitions)
- F3: Information Density Control (keep high-info sentences, drop filler)
- F4: Register Shift (academic → conversational)
- F5: Coherence Preservation (keep nucleus claims, compress satellites)

Tests are at `plugins/__tests__/shibui-rhetoric.test.mjs` (22 tests, Node built-in test runner).

The engine is currently consumed by `plugins/rehype-shibui-lens.mjs` via a direct import.

## Task

Extract `shibui-rhetoric.mjs` into a workspace package at `packages/shibui-rhetoric/` so it can be:
1. Published independently to npm
2. Used by other projects in the ORGANVM system
3. Tested in isolation

## File Boundary

ONLY touch files in these paths:
- `packages/shibui-rhetoric/` (CREATE — the new package)
- `plugins/shibui-rhetoric.mjs` (MODIFY — replace with re-export wrapper)
- `plugins/rehype-shibui-lens.mjs` (MODIFY — update import path)
- `plugins/__tests__/shibui-rhetoric.test.mjs` (MOVE to package)
- `package.json` (MODIFY — add workspace reference)

DO NOT touch:
- `src/` (any component, page, or style)
- `astro.config.mjs`
- `.github/workflows/`
- `src/styles/global.css`
- Any other plugin file

## Package Structure

```
packages/shibui-rhetoric/
├── package.json
├── README.md
├── index.mjs          # Main entry: exports all functions + simplify()
├── src/
│   ├── f1-complexity.mjs
│   ├── f2-substitution.mjs
│   ├── f3-density.mjs
│   ├── f4-register.mjs
│   ├── f5-coherence.mjs
│   └── compose.mjs    # The simplify() composition
└── test/
    └── rhetoric.test.mjs  # Moved from plugins/__tests__/
```

## package.json

```json
{
  "name": "@4444j99/shibui-rhetoric",
  "version": "0.1.0",
  "type": "module",
  "main": "index.mjs",
  "exports": {
    ".": "./index.mjs"
  },
  "scripts": {
    "test": "node --test test/rhetoric.test.mjs"
  }
}
```

## Requirements

1. All 22 existing tests must pass after extraction
2. `plugins/shibui-rhetoric.mjs` becomes a thin re-export:
   ```js
   export { simplify, f1_complexityReduction, f2_termSubstitution, ... } from '@4444j99/shibui-rhetoric';
   ```
3. `plugins/rehype-shibui-lens.mjs` import unchanged (it imports from `./shibui-rhetoric.mjs` which re-exports)
4. Add workspace reference in root `package.json`:
   ```json
   "@4444j99/shibui-rhetoric": "file:packages/shibui-rhetoric"
   ```
5. `npm run build` must still work after changes
6. Write a README.md with: what it does, the 5 functions, usage example, the linguistic theory behind each

## Verification

```bash
cd packages/shibui-rhetoric && node --test test/rhetoric.test.mjs
cd ../.. && npm run build && npm test
```
