# Consult Flow Fix Plan (Implemented)

## Objective

Repair the consult page so public visitors on GitHub Pages can submit a challenge and always receive a useful analysis.

## Decided Architecture

- Frontend: `src/pages/consult.astro`
  - Remove browser-side Puter dependency.
  - Call configurable API endpoint via `PUBLIC_CONSULT_API_BASE`.
  - Enforce request timeout.
  - Render deterministic fallback analysis if API is unavailable.
- Backend: Cloudflare Worker at `workers/consult-api`
  - Endpoint: `POST /api/consult`.
  - Primary response path: Workers AI model inference.
  - Backup response path: deterministic capability mapping fallback.
  - Data logging: Cloudflare D1 `consult_logs` table.

## Response Contract

Success:

```json
{
  "ok": true,
  "mode": "ai|fallback",
  "analysisHtml": "<p>...</p>",
  "analysisText": "plain text",
  "requestId": "uuid",
  "durationMs": 100
}
```

Error:

```json
{
  "ok": false,
  "code": "BAD_INPUT|AI_TIMEOUT|AI_ERROR|INTERNAL",
  "message": "error details",
  "requestId": "uuid"
}
```

## D1 Logging Schema

- `id`, `created_at`, `industry`, `challenge`, `mode`, `status_code`, `error_code`, `model`,
  `latency_ms`, `ip_hash`, `user_agent`, `analysis_preview`, `page`.

## Validation

- Update Playwright consult smoke test to verify post-submit recovery and visible output/error state.
- Keep deterministic fallback active when API env var is not configured, so behavior is resilient in local and production edge cases.
