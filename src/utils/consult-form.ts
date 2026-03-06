/**
 * Consult form utilities: fallback analysis, markdown conversion, and HTML sanitization.
 * Used by the AI Capability Advisor on the consult page.
 */

export interface OrganProfile {
	id: string;
	title: string;
	summary: string;
	capabilities: string[];
	repos: string[];
	keywords: string[];
}

export interface RenderAnalysis {
	mode: 'ai' | 'fallback';
	html: string;
	note?: string;
	requestId: string;
	source: 'worker' | 'local-fallback';
	durationMs?: number;
}

const ALLOWED_TAGS = ['h2', 'h3', 'p', 'strong', 'em', 'code', 'ul', 'li', 'br'];
const ALLOWED_ATTRS: Record<string, string[]> = {
	h2: ['class'],
	p: ['class'],
};

export const INDUSTRY_LABELS: Record<string, string> = {
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

export const INDUSTRY_ORGAN_HINTS: Record<string, string[]> = {
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

export const ORGAN_PROFILES: OrganProfile[] = [
	{
		id: 'I',
		title: 'THEORIA',
		summary: 'Theory, ontology, and recursive analysis infrastructure.',
		capabilities: [
			'Recursive symbolic engines for narrative and requirements modeling.',
			'Computational ontology design for complex domain vocabularies.',
			'Knowledge graph construction for long-horizon reasoning.',
		],
		repos: ['auto-revision-epistemic-engine', 'call-function--ontological', 'organon-noumenon'],
		keywords: ['ontology', 'knowledge graph', 'semantic', 'analysis', 'taxonomy', 'classification'],
	},
	{
		id: 'II',
		title: 'POIESIS',
		summary: 'Generative art, real-time performance, and experiential interfaces.',
		capabilities: [
			'Audience-participatory performance systems with real-time feedback loops.',
			'Interactive installations and generative media tooling.',
			'AI-human collaborative creative production pipelines.',
		],
		repos: ['metasystem-master', 'universal-waveform-explorer', 'showcase-portfolio'],
		keywords: [
			'art',
			'creative',
			'installation',
			'music',
			'experience',
			'interactive',
			'performance',
		],
	},
	{
		id: 'III',
		title: 'ERGON',
		summary: 'Product architecture, platform delivery, and commercial systems.',
		capabilities: [
			'SaaS platform architecture with subscription and operations workflows.',
			'B2B data aggregation pipelines and API delivery systems.',
			'Gamified learning and social-product implementation patterns.',
		],
		repos: ['public-record-data-scrapper', 'classroom-rpg-aetheria', 'gamified-coach-interface'],
		keywords: ['saas', 'platform', 'product', 'b2b', 'subscription', 'workflow', 'pipeline'],
	},
	{
		id: 'IV',
		title: 'TAXIS',
		summary: 'Orchestration, agent governance, and quality-controlled automation.',
		capabilities: [
			'Multi-agent orchestration with topology and role constraints.',
			'Registry-driven dependency governance across large repo surfaces.',
			'Automated auditing and promotion state-machine enforcement.',
		],
		repos: ['agentic-titan', 'orchestration-start-here', 'registry-v2.json'],
		keywords: ['agent', 'orchestration', 'automation', 'governance', 'compliance', 'coordination'],
	},
	{
		id: 'V',
		title: 'LOGOS',
		summary: 'Public process, documentation strategy, and narrative execution.',
		capabilities: [
			'Long-form technical writing and transparent methodology publication.',
			'Decision-led sprint narratives and implementation runbooks.',
			'Editorial systems for sustained knowledge dissemination.',
		],
		repos: ['public-process', 'portfolio', 'case-studies-methodology'],
		keywords: ['documentation', 'writing', 'narrative', 'content', 'editorial', 'publishing'],
	},
	{
		id: 'VI',
		title: 'KOINONIA',
		summary: 'Community curriculum design and collaborative sense-making.',
		capabilities: [
			'Facilitated reading groups and structured collaborative learning.',
			'Adaptive syllabi aligned to domain and team maturity.',
			'Community operating models for sustained participation.',
		],
		repos: ['community-infrastructure', 'reading-groups', 'curriculum-ops'],
		keywords: ['community', 'curriculum', 'learning', 'cohort', 'workshop', 'education'],
	},
	{
		id: 'VII',
		title: 'KERYGMA',
		summary: 'Distribution systems, audience segmentation, and outreach loops.',
		capabilities: [
			'Channel-specific publication and adaptation strategies.',
			'Audience segmentation and demand-shaping content programs.',
			'POSSE-style distribution pipelines for owned-media resilience.',
		],
		repos: ['distribution-engine', 'newsletter-integration', 'audience-segmentation'],
		keywords: ['marketing', 'distribution', 'audience', 'newsletter', 'reach', 'acquisition'],
	},
];

export function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

export function sanitizeHtml(html: string): string {
	return html.replace(
		/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g,
		(tag: string, name: string, attrs: string) => {
			const lowerName = name.toLowerCase();
			if (!ALLOWED_TAGS.includes(lowerName)) return '';
			if (tag.startsWith('</')) return `</${lowerName}>`;
			const allowedAttrs = ALLOWED_ATTRS[lowerName] || [];
			const safeAttrs = (attrs.match(/\s[\w-]+="[^"]*"/g) || []).filter((attr: string) =>
				allowedAttrs.some((allowed: string) => attr.trimStart().startsWith(`${allowed}=`)),
			);
			return `<${lowerName}${safeAttrs.join('')}>`;
		},
	);
}

export function markdownToHtml(markdown: string): string {
	const safeText = escapeHtml(markdown);
	let html = safeText
		.replace(/^### (.+)$/gm, '<h3>$1</h3>')
		.replace(/^## (.+)$/gm, '<h2 class="organ-heading">$1</h2>')
		.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
		.replace(/\*(.+?)\*/g, '<em>$1</em>')
		.replace(/`(.+?)`/g, '<code>$1</code>')
		.replace(/^[*-] (.+)$/gm, '<li>$1</li>');
	html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);
	html = html
		.split(/\n\n+/)
		.map((block) => {
			if (block.startsWith('<h') || block.startsWith('<ul')) return block;
			return `<p>${block.replace(/\n/g, '<br>')}</p>`;
		})
		.join('');
	return sanitizeHtml(html);
}

export function titleCaseIndustry(industry: string): string {
	return INDUSTRY_LABELS[industry] ?? industry;
}

function scoreOrgans(challenge: string, industry: string): OrganProfile[] {
	const normalized = challenge.toLowerCase();
	const industryHints = new Set(INDUSTRY_ORGAN_HINTS[industry] || []);
	const scored = ORGAN_PROFILES.map((organ) => {
		let score = 0;
		if (industryHints.has(organ.id)) score += 3;
		for (const keyword of organ.keywords) {
			if (normalized.includes(keyword)) score += 2;
		}
		return { organ, score };
	}).sort((a, b) => b.score - a.score);

	const selected = scored
		.filter((entry) => entry.score > 0)
		.slice(0, 3)
		.map((entry) => entry.organ);

	if (selected.length > 0) return selected;
	return ORGAN_PROFILES.filter((organ) => ['IV', 'III', 'II'].includes(organ.id));
}

export function buildFallbackAnalysis(
	challenge: string,
	industry: string,
	note: string,
	requestId: string,
): RenderAnalysis {
	const selectedOrgans = scoreOrgans(challenge, industry);
	const challengePreview = challenge.length > 240 ? `${challenge.slice(0, 237)}...` : challenge;
	const industryLabel = industry ? titleCaseIndustry(industry) : 'cross-domain';

	let html = `<p>${escapeHtml(`You are working on a ${industryLabel} challenge. Based on the details you provided, the highest-leverage path is to combine orchestration and product execution with targeted organ capabilities.`)}</p>`;
	html += `<p><strong>Challenge signal:</strong> ${escapeHtml(challengePreview)}</p>`;

	for (const organ of selectedOrgans) {
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
	html += '<li>Prioritize one pilot slice with measurable delivery outcomes in 2-3 weeks.</li>';
	html +=
		'<li>Map that slice to the listed organ capabilities and lock a governance workflow before implementation.</li>';
	html +=
		'<li>Email <code>padavano.anthony@gmail.com</code> with your challenge context for an architecture review.</li>';
	html += '</ul>';

	return {
		mode: 'fallback',
		html: sanitizeHtml(html),
		note,
		requestId,
		source: 'local-fallback',
	};
}
