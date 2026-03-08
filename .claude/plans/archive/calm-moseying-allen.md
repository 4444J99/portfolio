# Lighthouse Coverage → 100%

## Context

Lighthouse CI currently audits 13 of 33 built pages (39%). The remaining 20 pages — 19 project case-study pages + the 404 page — are unaudited. This means regressions in performance, accessibility, SEO, or best-practices on those pages go undetected in CI.

## File to Modify

| File | Change |
|------|--------|
| `lighthouserc.cjs` | Add 20 URLs to the `url` array (19 project pages + 404) |

## Current URLs (13)

```
index, about, dashboard, resume, gallery, consult, architecture,
omega, github-pages, products, community, essays,
projects/recursive-engine
```

## URLs to Add (20)

```js
'http://localhost/404.html',
'http://localhost/projects/aetheria-rpg/index.html',
'http://localhost/projects/agentic-titan/index.html',
'http://localhost/projects/ai-conductor/index.html',
'http://localhost/projects/ai-council/index.html',
'http://localhost/projects/block-warfare/index.html',
'http://localhost/projects/community-infrastructure/index.html',
'http://localhost/projects/distribution-strategy/index.html',
'http://localhost/projects/eight-organ-system/index.html',
'http://localhost/projects/generative-music/index.html',
'http://localhost/projects/knowledge-base/index.html',
'http://localhost/projects/life-my-midst-in/index.html',
'http://localhost/projects/linguistic-atomization/index.html',
'http://localhost/projects/metasystem-master/index.html',
'http://localhost/projects/narratological-lenses/index.html',
'http://localhost/projects/orchestration-hub/index.html',
'http://localhost/projects/org-architecture/index.html',
'http://localhost/projects/public-process/index.html',
'http://localhost/projects/the-actual-news/index.html',
'http://localhost/projects/your-fit-tailored/index.html',
```

Result: 33/33 pages audited (100%).

## Verification

1. `npm run build` — confirm 33 pages built
2. `npm run lighthouse` — all 33 pages audited, all above thresholds (perf≥0.85, a11y≥0.90, bp≥0.90, seo≥0.90)
3. If any page fails thresholds, fix before committing
