# Pathos — Excavated Conversations

**Date:** 2026-03-19
**Status:** APPROVED
**Scope:** New content section on portfolio for unredacted conversation artifacts

## Summary

Add a "Pathos" section to the portfolio — the emotional/experiential counterpart to "Logos" (essays). Pathos displays excavated human-AI conversation artifacts from real working sessions, published in the Artifex/Mercurius dialogue format defined by `SOP--conversation-to-content-pipeline.md`.

## Design Decisions

- **Name:** Pathos (completing the Aristotelian triad: Logos=reason, Pathos=emotion, Ethos=the portfolio itself)
- **Nav placement:** Under "Explore" dropdown, immediately after "Logos"
- **Content approach:** New Astro content collection at `src/content/pathos/`
- **Style:** Minimal, text-forward. No sketch accents. Words carry weight.
- **Content source:** Posts copied from `praxis-perpetua/content-pipeline/posts/` into portfolio content dir

## Files

1. `src/content.config.ts` — add pathos collection with schema
2. `src/content/pathos/trash-and-church.md` — first post with frontmatter
3. `src/pages/pathos/index.astro` — listing page
4. `src/pages/pathos/[slug].astro` — detail page with dialogue rendering
5. `src/components/Header.astro` — add Pathos to Explore dropdown

## Schema

```typescript
{
  title: string,
  hookLine: string,
  date: date,
  context: string,
  voices: { human: string, ai: string },
  artifacts: [{ label: string, url: string, type: 'repo' | 'system' | 'artifact' }],
  tags: string[],
}
```

## Labyrinth Strategy

Each post's `artifacts` array links to repos, live systems, and architecture pages that provide evidence for claims in the conversation. This surrounding context defends any vulnerability the text contains — per the SOP's "Labyrinth Test."
