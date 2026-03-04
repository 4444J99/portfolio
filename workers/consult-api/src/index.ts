interface Env {
  AI?: Ai;
  CONSULT_DB?: D1Database;
  ALLOWED_ORIGINS?: string;
  LOG_HASH_SALT?: string;
}

interface ConsultRequestBody {
  challenge?: unknown;
  industry?: unknown;
  page?: unknown;
  requestId?: unknown;
}

interface ConsultSuccessResponse {
  ok: true;
  mode: 'ai' | 'fallback';
  analysisHtml: string;
  analysisText: string;
  requestId: string;
  durationMs: number;
  note?: string;
}

interface ConsultErrorResponse {
  ok: false;
  code: 'BAD_INPUT' | 'AI_TIMEOUT' | 'AI_ERROR' | 'INTERNAL';
  message: string;
  requestId: string;
}

interface FallbackOrgan {
  id: string;
  title: string;
  summary: string;
  capabilities: string[];
  repos: string[];
  keywords: string[];
}

const MODEL = '@cf/meta/llama-3.1-8b-instruct';
const AI_TIMEOUT_MS = 8000;
const MAX_CHALLENGE_LENGTH = 4000;
const DEFAULT_ALLOWED_ORIGINS = [
  'https://4444j99.github.io',
  'http://localhost:4321',
  'http://127.0.0.1:4321',
];

const SYSTEM_PROMPT = `You are the ORGANVM Capability Advisor.

Write a concise, high-signal capability analysis (300-500 words).
Use markdown with this shape:
1) One short opening acknowledgment.
2) 2-4 organ sections with "## ORGAN X — NAME".
3) A "## Recommended Next Steps" section with concrete actions.

Reference concrete capabilities and repositories from the eight-organ system:
- I THEORIA: recursive symbolic engines, ontology, knowledge graphs.
- II POIESIS: generative art, participatory performance, interactive installations.
- III ERGON: SaaS platforms, B2B data systems, gamified products.
- IV TAXIS: multi-agent orchestration, registry governance, promotion state machines.
- V LOGOS: technical writing, public process, methodology narratives.
- VI KOINONIA: facilitated community curriculum and adaptive learning pathways.
- VII KERYGMA: distribution strategy, audience segmentation, channel adaptation.
- META: cross-org governance and CI/CD orchestration.

Be specific, practical, and implementation-oriented.`;

const INDUSTRY_HINTS: Record<string, string[]> = {
  education: ['III', 'IV', 'VI'],
  arts: ['II', 'V', 'VII'],
  saas: ['III', 'IV'],
  media: ['V', 'VII', 'III'],
  nonprofit: ['VI', 'V', 'III'],
  research: ['I', 'IV', 'V'],
  gaming: ['II', 'III', 'IV'],
  finance: ['I', 'III', 'IV'],
  healthcare: ['III', 'IV', 'VI'],
  other: ['III', 'IV'],
};

const INDUSTRY_LABELS: Record<string, string> = {
  education: 'Education & EdTech',
  arts: 'Arts & Culture',
  saas: 'SaaS & B2B Software',
  media: 'Media & Publishing',
  nonprofit: 'Nonprofit & Social Impact',
  research: 'Research & Academia',
  gaming: 'Gaming & Interactive',
  finance: 'Finance & Data',
  healthcare: 'Healthcare & Wellness',
  other: 'Cross-domain',
};

const ORGANS: FallbackOrgan[] = [
  {
    id: 'I',
    title: 'THEORIA',
    summary: 'Theory, ontology, and recursive analysis infrastructure.',
    capabilities: [
      'Recursive symbolic engines for requirement and narrative modeling.',
      'Computational ontology construction for domain alignment.',
      'Knowledge graph structures for long-horizon reasoning.',
    ],
    repos: ['auto-revision-epistemic-engine', 'call-function--ontological', 'organon-noumenon'],
    keywords: ['ontology', 'knowledge graph', 'taxonomy', 'semantic', 'classification', 'analysis'],
  },
  {
    id: 'II',
    title: 'POIESIS',
    summary: 'Generative art, performance systems, and interactive media.',
    capabilities: [
      'Real-time participatory performance frameworks.',
      'Interactive installation and generative media tooling.',
      'AI-human collaborative creative pipelines.',
    ],
    repos: ['metasystem-master', 'universal-waveform-explorer', 'showcase-portfolio'],
    keywords: ['art', 'creative', 'installation', 'music', 'interactive', 'performance'],
  },
  {
    id: 'III',
    title: 'ERGON',
    summary: 'Product architecture, platform delivery, and commercial systems.',
    capabilities: [
      'SaaS architecture and subscription operations patterns.',
      'B2B data ingestion and API productization workflows.',
      'Gamified product and education platform implementation.',
    ],
    repos: ['public-record-data-scrapper', 'classroom-rpg-aetheria', 'gamified-coach-interface'],
    keywords: ['saas', 'platform', 'product', 'b2b', 'subscription', 'pipeline', 'workflow'],
  },
  {
    id: 'IV',
    title: 'TAXIS',
    summary: 'Orchestration, governance, and quality-enforced automation.',
    capabilities: [
      'Multi-agent orchestration with role and topology controls.',
      'Registry-driven dependency governance at scale.',
      'Automated audits and promotion-state enforcement.',
    ],
    repos: ['agentic-titan', 'orchestration-start-here', 'registry-v2.json'],
    keywords: ['agent', 'orchestration', 'governance', 'automation', 'compliance', 'coordination'],
  },
  {
    id: 'V',
    title: 'LOGOS',
    summary: 'Public process, strategic narrative, and technical documentation.',
    capabilities: [
      'Long-form technical writing and methodology publication.',
      'Decision narratives and implementation runbooks.',
      'Editorial systems for sustained public process.',
    ],
    repos: ['public-process', 'portfolio', 'case-studies-methodology'],
    keywords: ['documentation', 'narrative', 'writing', 'content', 'editorial', 'publishing'],
  },
  {
    id: 'VI',
    title: 'KOINONIA',
    summary: 'Community operating models and adaptive curriculum systems.',
    capabilities: [
      'Facilitated cohorts, salons, and reading groups.',
      'Adaptive syllabi aligned to stakeholder maturity.',
      'Community-driven collaborative sense-making infrastructure.',
    ],
    repos: ['community-infrastructure', 'reading-groups', 'curriculum-ops'],
    keywords: ['community', 'curriculum', 'learning', 'cohort', 'workshop', 'education'],
  },
  {
    id: 'VII',
    title: 'KERYGMA',
    summary: 'Distribution systems, channel adaptation, and audience growth.',
    capabilities: [
      'Channel-specific publication and adaptation workflows.',
      'Audience segmentation and campaign design strategy.',
      'POSSE-style distribution with owned-media resilience.',
    ],
    repos: ['distribution-engine', 'newsletter-integration', 'audience-segmentation'],
    keywords: ['distribution', 'audience', 'marketing', 'newsletter', 'acquisition', 'reach'],
  },
];

const ALLOWED_TAGS = ['h2', 'h3', 'p', 'strong', 'em', 'code', 'ul', 'li', 'br'];
const ALLOWED_ATTRS: Record<string, string[]> = {
  h2: ['class'],
  p: ['class'],
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const origin = request.headers.get('Origin');
    const corsHeaders = getCorsHeaders(env, origin);
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      return jsonResponse({ ok: true, service: 'consult-api' }, 200, corsHeaders);
    }

    if (request.method !== 'POST' || url.pathname !== '/api/consult') {
      return jsonResponse({ ok: false, code: 'INTERNAL', message: 'Not found.' }, 404, corsHeaders);
    }

    const requestId = crypto.randomUUID();
    const startedAt = Date.now();
    const userAgent = request.headers.get('user-agent') || '';
    const clientIp = request.headers.get('CF-Connecting-IP') || '';

    try {
      const body = await request.json() as ConsultRequestBody;
      const challenge = typeof body.challenge === 'string' ? body.challenge.trim() : '';
      const industry = normalizeIndustry(body.industry);
      const page = typeof body.page === 'string' ? body.page.slice(0, 512) : '';
      const incomingRequestId = typeof body.requestId === 'string' ? body.requestId.trim() : '';
      const effectiveRequestId = incomingRequestId || requestId;

      if (challenge.length < 20 || challenge.length > MAX_CHALLENGE_LENGTH) {
        const errorBody: ConsultErrorResponse = {
          ok: false,
          code: 'BAD_INPUT',
          message: `Challenge must be between 20 and ${MAX_CHALLENGE_LENGTH} characters.`,
          requestId: effectiveRequestId,
        };
        ctx.waitUntil(
          logConsult(env, {
            id: effectiveRequestId,
            challenge,
            industry,
            mode: 'error',
            statusCode: 400,
            errorCode: errorBody.code,
            model: null,
            latencyMs: Date.now() - startedAt,
            ip: clientIp,
            userAgent,
            analysisPreview: '',
            page,
          }),
        );
        return jsonResponse(errorBody, 400, corsHeaders);
      }

      const aiOutput = await runAiWithFallback(challenge, industry, env);
      const durationMs = Date.now() - startedAt;

      const responseBody: ConsultSuccessResponse = {
        ok: true,
        mode: aiOutput.mode,
        analysisHtml: aiOutput.analysisHtml,
        analysisText: aiOutput.analysisText,
        requestId: effectiveRequestId,
        durationMs,
        note: aiOutput.note,
      };

      ctx.waitUntil(
        logConsult(env, {
          id: effectiveRequestId,
          challenge,
          industry,
          mode: aiOutput.mode,
          statusCode: 200,
          errorCode: null,
          model: aiOutput.mode === 'ai' ? MODEL : null,
          latencyMs: durationMs,
          ip: clientIp,
          userAgent,
          analysisPreview: trimForStorage(aiOutput.analysisText, 512),
          page,
        }),
      );

      return jsonResponse(responseBody, 200, corsHeaders);
    } catch (error) {
      const responseBody: ConsultErrorResponse = {
        ok: false,
        code: 'INTERNAL',
        message: 'Unable to process consultation request.',
        requestId,
      };
      ctx.waitUntil(
        logConsult(env, {
          id: requestId,
          challenge: '',
          industry: null,
          mode: 'error',
          statusCode: 500,
          errorCode: 'INTERNAL',
          model: null,
          latencyMs: Date.now() - startedAt,
          ip: clientIp,
          userAgent,
          analysisPreview: trimForStorage(String(error), 512),
          page: '',
        }),
      );
      return jsonResponse(responseBody, 500, corsHeaders);
    }
  },
};

async function runAiWithFallback(
  challenge: string,
  industry: string | null,
  env: Env,
): Promise<{ mode: 'ai' | 'fallback'; analysisHtml: string; analysisText: string; note?: string }> {
  if (!env.AI) {
    const fallback = buildDeterministicFallback(challenge, industry);
    return {
      mode: 'fallback',
      analysisHtml: fallback.analysisHtml,
      analysisText: fallback.analysisText,
      note: 'Workers AI binding is unavailable. Showing deterministic capability mapping.',
    };
  }

  const userPrompt = industry
    ? `Industry: ${industry}\n\nChallenge: ${challenge}`
    : challenge;

  try {
    const aiRawResult = await withTimeout(
      env.AI.run(MODEL, {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 900,
        temperature: 0.35,
      }),
      AI_TIMEOUT_MS,
    );

    const aiText = extractAiText(aiRawResult);
    if (!aiText) {
      throw new Error('AI response was empty.');
    }

    return {
      mode: 'ai',
      analysisHtml: markdownToHtml(aiText),
      analysisText: aiText,
    };
  } catch (error) {
    const fallback = buildDeterministicFallback(challenge, industry);
    const note = (error instanceof Error && error.message === 'AI_TIMEOUT')
      ? 'Workers AI timed out. Showing deterministic capability mapping.'
      : 'Workers AI is unavailable right now. Showing deterministic capability mapping.';
    return {
      mode: 'fallback',
      analysisHtml: fallback.analysisHtml,
      analysisText: fallback.analysisText,
      note,
    };
  }
}

function buildDeterministicFallback(
  challenge: string,
  industry: string | null,
): { analysisHtml: string; analysisText: string } {
  const selected = scoreOrgans(challenge, industry);
  const challengePreview = trimForStorage(challenge, 260);
  const industryLabel = industry ? (INDUSTRY_LABELS[industry] || industry) : 'cross-domain';

  let html = `<p>${escapeHtml(`You are working on a ${industryLabel} challenge. The strongest immediate move is a combined architecture and orchestration approach with focused delivery slices.`)}</p>`;
  html += `<p><strong>Challenge signal:</strong> ${escapeHtml(challengePreview)}</p>`;

  for (const organ of selected) {
    html += `<h2 class="organ-heading">ORGAN ${escapeHtml(organ.id)} — ${escapeHtml(organ.title)}</h2>`;
    html += `<p>${escapeHtml(organ.summary)}</p>`;
    html += '<ul>';
    for (const capability of organ.capabilities) {
      html += `<li>${escapeHtml(capability)}</li>`;
    }
    html += '</ul>';
    html += `<p><strong>Key repos:</strong> <code>${escapeHtml(organ.repos.join(', '))}</code></p>`;
  }

  html += '<h2 class="organ-heading">Recommended Next Steps</h2>';
  html += '<ul>';
  html += '<li>Scope one pilot slice with measurable outcomes over 2-3 weeks.</li>';
  html += '<li>Map responsibilities to the selected organs before implementation starts.</li>';
  html += '<li>Email <code>padavano.anthony@gmail.com</code> with your context for a direct architecture review.</li>';
  html += '</ul>';

  const sanitized = sanitizeHtml(html);
  return {
    analysisHtml: sanitized,
    analysisText: sanitized.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  };
}

function scoreOrgans(challenge: string, industry: string | null): FallbackOrgan[] {
  const normalized = challenge.toLowerCase();
  const industryBoosts = new Set((industry && INDUSTRY_HINTS[industry]) ? INDUSTRY_HINTS[industry] : []);

  const scored = ORGANS.map((organ) => {
    let score = 0;
    if (industryBoosts.has(organ.id)) score += 3;
    for (const keyword of organ.keywords) {
      if (normalized.includes(keyword)) score += 2;
    }
    return { organ, score };
  }).sort((a, b) => b.score - a.score);

  const selected = scored
    .filter((row) => row.score > 0)
    .slice(0, 3)
    .map((row) => row.organ);

  if (selected.length > 0) return selected;
  return ORGANS.filter((organ) => ['IV', 'III', 'II'].includes(organ.id));
}

function normalizeIndustry(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (Object.prototype.hasOwnProperty.call(INDUSTRY_HINTS, normalized)) {
    return normalized;
  }
  return 'other';
}

function getCorsHeaders(env: Env, origin: string | null): Headers {
  const configuredOrigins = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : DEFAULT_ALLOWED_ORIGINS;
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return new Headers({
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  });
}

function jsonResponse(payload: unknown, status: number, corsHeaders: Headers): Response {
  const headers = new Headers(corsHeaders);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(payload), { status, headers });
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: number | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('AI_TIMEOUT')), timeoutMs) as unknown as number;
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

function extractAiText(raw: unknown): string {
  if (typeof raw === 'string') return raw.trim();
  if (!raw || typeof raw !== 'object') return '';

  const record = raw as Record<string, unknown>;
  if (typeof record.response === 'string') return record.response.trim();
  if (typeof record.result === 'string') return record.result.trim();

  const resultObj = record.result as Record<string, unknown> | undefined;
  if (resultObj && typeof resultObj.response === 'string') return resultObj.response.trim();

  const contentArray = record.content as Array<{ text?: unknown }> | undefined;
  if (Array.isArray(contentArray)) {
    const merged = contentArray
      .map((chunk) => typeof chunk.text === 'string' ? chunk.text : '')
      .join('')
      .trim();
    if (merged) return merged;
  }

  return '';
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function markdownToHtml(markdown: string): string {
  const safe = escapeHtml(markdown);
  let html = safe
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="organ-heading">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\`(.+?)\`/g, '<code>$1</code>')
    .replace(/^[*-] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (chunk) => `<ul>${chunk}</ul>`);
  html = html.split(/\n\n+/).map((chunk) => {
    if (chunk.startsWith('<h') || chunk.startsWith('<ul')) return chunk;
    return `<p>${chunk.replace(/\n/g, '<br>')}</p>`;
  }).join('');
  return sanitizeHtml(html);
}

function sanitizeHtml(html: string): string {
  return html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (tag: string, name: string, attrs: string) => {
    const lowerName = name.toLowerCase();
    if (!ALLOWED_TAGS.includes(lowerName)) return '';
    if (tag.startsWith('</')) return `</${lowerName}>`;
    const allowedAttrs = ALLOWED_ATTRS[lowerName] || [];
    const safeAttrs = (attrs.match(/\s[\w-]+="[^"]*"/g) || [])
      .filter((attr) => allowedAttrs.some((allowed) => attr.trimStart().startsWith(`${allowed}=`)));
    return `<${lowerName}${safeAttrs.join('')}>`;
  });
}

function trimForStorage(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

async function hashIp(ip: string, salt: string): Promise<string | null> {
  if (!ip) return null;
  const data = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function logConsult(
  env: Env,
  payload: {
    id: string;
    challenge: string;
    industry: string | null;
    mode: 'ai' | 'fallback' | 'error';
    statusCode: number;
    errorCode: string | null;
    model: string | null;
    latencyMs: number;
    ip: string;
    userAgent: string;
    analysisPreview: string;
    page: string;
  },
): Promise<void> {
  if (!env.CONSULT_DB) return;
  try {
    const ipHash = await hashIp(payload.ip, env.LOG_HASH_SALT || 'portfolio-consult');
    await env.CONSULT_DB
      .prepare(`
        INSERT INTO consult_logs (
          id,
          created_at,
          industry,
          challenge,
          mode,
          status_code,
          error_code,
          model,
          latency_ms,
          ip_hash,
          user_agent,
          analysis_preview,
          page
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
      `)
      .bind(
        payload.id,
        new Date().toISOString(),
        payload.industry,
        payload.challenge,
        payload.mode,
        payload.statusCode,
        payload.errorCode,
        payload.model,
        payload.latencyMs,
        ipHash,
        trimForStorage(payload.userAgent, 512),
        payload.analysisPreview,
        payload.page,
      )
      .run();
  } catch (error) {
    console.error('consult log write failed', error);
  }
}
