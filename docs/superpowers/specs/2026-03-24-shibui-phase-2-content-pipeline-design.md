# Shibui Phase 2: Content Pipeline — Design Specification

**Date**: 2026-03-24
**Status**: Draft
**Depends on**: Phase 1 (shipped 2026-03-24)
**Problem**: 21 project pages need entry-level text. Manual authoring is intractable at ~40+ paragraphs.

## Architecture

Sidecar YAML files per project page store entry text and annotations. The elevated text stays inline in .astro files. Migration wraps paragraphs in ShibuiContent with entry from YAML.

```
shibui:extract → YAML (structure + elevated text)
shibui:distill → YAML (+ entry text via gemini CLI)
shibui:annotate → YAML (+ term definitions via gemini CLI)
human review → edit YAML
shibui:validate → schema check (in build chain)
migration → wrap .astro paragraphs in ShibuiContent
```

## Data Format

```yaml
# src/data/shibui/projects/{slug}.yaml
page: projects/{slug}
title: "Project Title"
tagline: "One-line tagline"
sections:
  - heading: "Section Heading"
    units:
      - id: "{slug}.{heading-slug}.p{n}"
        elevated_preview: "First 80 chars of elevated text for reference..."
        entry: >
          Simplified text. Preserves all claims, removes jargon.
          Targets 40-60% length reduction.
        annotations:
          - term: "domain term"
            definition: "Plain-language definition"
```

- `elevated_preview` is read-only reference text (not rendered) — helps human reviewers see what's being simplified
- `entry` is the rendered entry text
- `annotations` map to `<ShibuiTerm>` components in the elevated layer

## Scripts

### shibui:extract (scripts/shibui-extract.mjs)

Reads each .astro file in src/pages/projects/, extracts:
- ProjectLayout props (title, tagline)
- h2 headings → section boundaries
- p tag content → paragraph text (stripped of HTML/Astro tags)

Outputs YAML per project to src/data/shibui/projects/. Skips existing files (idempotent). Does not overwrite human-edited YAML.

### shibui:distill (scripts/shibui-distill.mjs)

Manual command (NOT in build chain). For each YAML unit with empty entry field:
- Calls gemini CLI with Conservation of Meaning prompt
- Writes generated entry text back
- Falls back to [DRAFT] marker if gemini unavailable
- Rate limits: 1 call per 2 seconds

Distillation prompt constraints:
- Preserve all factual claims (numbers, outcomes, what was built)
- Preserve proper nouns (project names, technologies)
- Never add information not in elevated text
- Write in first person where source uses first person
- Maintain conversational portfolio tone, not technical summary
- Use active voice, concrete verbs, specific numbers
- Target 40-60% length reduction
- Flag uncertainty with [REVIEW] markers

### shibui:annotate (scripts/shibui-annotate.mjs)

Manual command. For each YAML unit, identifies domain-specific terms and generates definitions. Targets: proper nouns, philosophical terms, system-specific vocabulary (organs, promotion states, etc.).

### shibui:validate (scripts/shibui-validate.mjs)

Runs in build chain. Validates all YAML files against expected structure:
- Required fields present
- No [DRAFT] or [REVIEW] markers in committed entry text
- Unit IDs are unique across all files
- annotations.term values are non-empty strings

## Quality Integration

### Data integrity test additions

```typescript
test('shibui YAML files have no DRAFT markers', ...);
test('shibui YAML files have no REVIEW markers', ...);
test('shibui unit IDs are globally unique', ...);
test('shibui YAML files match expected schema', ...);
```

### Build chain addition

After sync:identity, before astro build:
```
generate-badges → sync:vitals → sync:omega → sync:identity → shibui:validate → astro build → pagefind
```

## Migration Pattern

Per-page, agent-assisted (not automated):
1. Import shibui YAML in frontmatter
2. Import ShibuiContent + ShibuiTerm
3. Wrap each p tag in ShibuiContent (entry from YAML, elevated keeps current text)
4. Add bridge buttons
5. Replace abbr elements with ShibuiTerm using annotation data

## Scope

Phase 2A (this spec): Extract + Distill + Annotate + Validate scripts
Phase 2B (separate): Migrate project pages (batched, agent-driven)

## Open Questions Resolved

- YAML location: src/data/shibui/projects/ (matches existing data pattern)
- Build integration: validate-only in build chain; distill/annotate are manual
- Voice: distillation prompt includes first-person/conversational constraints
