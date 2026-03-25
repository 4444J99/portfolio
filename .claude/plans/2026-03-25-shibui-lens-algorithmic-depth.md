# The Shibui Lens — Algorithmic Depth Transformation

## Context

The current shibui implementation is manual carpentry: 162 hand-wrapped ShibuiContent blocks, 85 hand-annotated ShibuiTerm elements, entry text written per-paragraph. It works, but it doesn't scale — every new page needs manual wrapping, and the entry text quality varies with author fatigue.

The user's insight: design the **function**, not the furniture. A single transformation that converts any content through a depth lens, algorithmically. One source of truth, three presentations.

## Mathematical Model

```
Content(node) × Depth(d) → Rendered(node, d)

complexity(n) = avg(flesch_norm(n), domain_density(n), citation_density(n))
  where:
    flesch_norm    = 1 - (flesch_reading_ease / 100)   // 0=simple, 1=complex
    domain_density = domain_term_count / total_words    // TF-IDF detected
    citation_density = cite_count / paragraph_count     // Cite components

threshold(d):
    d = 0.0 (overview)  → 0.3  (show only simple content)
    d = 0.5 (standard)  → 1.0  (show all, with annotations)
    d = 1.0 (full)      → 1.0  (show all, clean reading)

visibility(n, d) = visible  if complexity(n) ≤ threshold(d)
                   hidden   if complexity(n) > threshold(d)

For visible complex nodes at overview:
    render(n, 0.0) = simplified(n)  // generated entry text
    render(n, 0.5) = n + annotations // terms highlighted
    render(n, 1.0) = n               // raw content
```

## Architecture: Rehype Plugin as the Lens

Instead of manual wrapping, a **custom rehype plugin** processes ALL HTML at build time:

```
.astro/.mdx source
    → Astro compile → raw HTML
    → rehype-shibui-lens (NEW) → depth-tagged HTML
    → browser renders based on data-shibui-depth
```

### The Plugin Does Three Things:

**1. Score** — Tag every `<p>` with `data-shibui-c="0.72"`
- Flesch-Kincaid readability (via `text-readability`, ~15KB, zero deps)
- Domain term density (via corpus TF-IDF, pre-computed)
- Citation density (count `<cite>`, `<sup>`, academic reference patterns)

**2. Annotate** — Wrap detected domain terms in `<span class="shibui-term">`
- Pre-computed domain vocabulary from TF-IDF across full corpus
- Each term gets a `data-definition` attribute (from a definitions dictionary)
- No manual ShibuiTerm wrapping needed

**3. Simplify** — Generate `data-shibui-entry` attribute on complex paragraphs
- Rule-based mechanical simplification (no LLM at build time):
  - Strip citation markup
  - Replace domain terms with their plain definitions
  - Shorten to first 2 sentences
  - Convert passive → active voice (basic heuristics)
- LLM enhancement available via `shibui:distill` as optional post-process

### CSS Rendering (replaces current manual visibility)

```css
/* Overview: hide complex blocks, show simplified entry text */
html[data-shibui-depth="overview"] p[data-shibui-c] {
    /* Threshold: complexity > 0.3 gets replaced */
}
html[data-shibui-depth="overview"] p[data-shibui-c]::before {
    content: attr(data-shibui-entry);  /* Show simplified version */
}

/* Standard: show everything, terms highlighted */
html[data-shibui-depth="standard"] .shibui-term {
    border-bottom: 2px dotted var(--accent);
}

/* Full: show everything clean */
html[data-shibui-depth="full"] .shibui-term {
    border-bottom: 1px dotted color-mix(in srgb, var(--accent) 40%, transparent);
}
```

**Note:** CSS `content: attr()` for entry text has limitations (no HTML, no line breaks). A more robust approach: the rehype plugin injects a hidden `<span class="shibui-entry">` sibling for each scored paragraph, and CSS toggles visibility. This is similar to current ShibuiContent but **generated automatically by the plugin, not hand-authored**.

## Implementation Plan

### Phase 1: Build the Vocabulary (1 script)

**`scripts/shibui-build-vocab.mjs`**
- Read all 49 essays + 21 project pages
- Tokenize, remove stopwords
- Compute TF-IDF across corpus
- Output: `src/data/shibui/vocabulary.json`
  ```json
  {
    "terms": {
      "epistemic": { "idf": 3.2, "definition": "Related to knowledge and how we know things" },
      "ontological": { "idf": 2.8, "definition": "..." },
      ...
    }
  }
  ```
- Definitions: hand-curated dictionary for top ~200 terms (the 85 existing ShibuiTerm definitions are a start)
- Dependency: `tiny-tfidf` or inline implementation (~50 lines)

### Phase 2: Build the Rehype Plugin (the lens itself)

**`plugins/rehype-shibui-lens.mjs`**
- Reads `vocabulary.json` at init
- For each `<p>` element in the HTML AST:
  1. Extract text content
  2. Compute complexity score (readability + domain density + citation density)
  3. Add `data-shibui-c="0.72"` attribute
  4. Scan text for vocabulary terms → wrap in `<span class="shibui-term" data-definition="...">`
  5. If complexity > 0.3: generate entry text → inject `<span class="shibui-entry">...</span>` sibling
- Register in `astro.config.mjs` as rehype plugin

### Phase 3: Replace CSS System

**`src/styles/global.css` (shibui section rewrite)**
- Complexity-threshold CSS: `[data-shibui-c]` selectors
- Entry text toggling via `.shibui-entry` visibility
- Term annotation styling per depth
- Bridge buttons become automatic (generated by plugin for high-complexity blocks)
- Animation system stays as-is (palimpsest reveal, glint, tooltips)

### Phase 4: Migration — Remove Manual Wrapping

- The rehype plugin makes ShibuiContent/ShibuiTerm components **obsolete** for new content
- Existing manual wrapping can be left in place (backward compatible) or stripped
- New pages/essays automatically get depth treatment with zero author effort
- `shibui:distill` becomes an optional LLM enhancement for entry text quality

## Files to Create/Modify

| File | Action |
|------|--------|
| `scripts/shibui-build-vocab.mjs` | **CREATE** — TF-IDF vocabulary extraction |
| `plugins/rehype-shibui-lens.mjs` | **CREATE** — the core lens plugin |
| `src/data/shibui/vocabulary.json` | **CREATE** — term definitions dictionary |
| `astro.config.mjs` | **MODIFY** — register rehype plugin |
| `src/styles/global.css` | **MODIFY** — complexity-threshold CSS rules |
| `src/components/scripts/ShibuiRestore.astro` | **MODIFY** — update for new DOM structure |
| `src/components/shibui/DepthControl.astro` | **MODIFY** — update aria logic |
| `package.json` | **MODIFY** — add `text-readability` dev dependency |

## What This Replaces

| Manual (current) | Algorithmic (proposed) |
|-------------------|----------------------|
| 162 hand-wrapped ShibuiContent blocks | Rehype plugin auto-wraps every `<p>` |
| 85 hand-annotated ShibuiTerm elements | TF-IDF detects and wraps terms automatically |
| Entry text written per paragraph | Rule-based simplification + optional LLM |
| Per-page migration sessions | Zero-effort on new content |
| ShibuiContent.astro component | Obsolete (plugin generates equivalent DOM) |
| ShibuiTerm.astro component | Obsolete (plugin generates equivalent DOM) |

## Backward Compatibility

The existing ShibuiContent/ShibuiTerm markup is valid HTML — the rehype plugin can SKIP elements that are already wrapped (detect existing `data-shibui-layer` attributes). This means:
- Existing pages keep working immediately
- New pages get automatic treatment
- Over time, manual wrapping can be removed as the algorithmic version proves itself

## Verification

1. `npm run shibui:build-vocab` — generates vocabulary.json
2. `npm run build` — rehype plugin processes all pages
3. Check built HTML: every `<p>` should have `data-shibui-c`, domain terms should be wrapped
4. Dev server: toggle depth control — Overview shows simplified text, Standard shows annotated, Full shows clean
5. `npm test` — existing 527 tests should still pass
6. `npm run test:a11y` — no new violations
