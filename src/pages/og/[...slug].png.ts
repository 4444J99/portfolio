import type { APIRoute, GetStaticPaths } from 'astro';
import { generateOGImage } from '../../utils/og-image';

interface OGPage {
  slug: string;
  title: string;
  subtitle: string;
  accent?: string;
}

const pages: OGPage[] = [
  // Top-level pages
  { slug: 'index', title: 'Anthony James Padavano', subtitle: 'Creative technologist building autonomous creative systems' },
  { slug: 'about', title: 'About', subtitle: 'Artist-engineer treating governance as artistic medium' },
  { slug: 'resume', title: 'Resume', subtitle: 'Creative Technologist — Systems, AI, Generative Art' },
  { slug: 'dashboard', title: 'Dashboard', subtitle: 'System metrics across 91 repositories and 8 organs' },
  { slug: 'essays', title: 'Essays', subtitle: 'Public process essays on creative infrastructure' },
  { slug: 'architecture', title: 'System Architecture', subtitle: 'Dependency graph of the eight-organ system' },
  { slug: 'community', title: 'Community', subtitle: 'Collaborative infrastructure and open contribution' },
  { slug: 'consult', title: 'Consult', subtitle: 'Working together on creative technology projects' },
  { slug: 'products', title: 'Products', subtitle: 'Commerce applications and consumer experiences' },
  { slug: 'gallery', title: 'Gallery', subtitle: '29 generative art sketches built with p5.js' },
  // Project pages
  { slug: 'projects/aetheria-rpg', title: 'Aetheria Classroom RPG', subtitle: 'Gamified education platform', accent: '#c9a84c' },
  { slug: 'projects/agentic-titan', title: 'Agentic Titan', subtitle: 'Multi-agent orchestration — 9 topologies, 22 archetypes', accent: '#e87c7c' },
  { slug: 'projects/ai-conductor', title: 'AI-Conductor Model', subtitle: 'Human-AI co-creation methodology', accent: '#7c9bf5' },
  { slug: 'projects/ai-council', title: 'AI Council Coliseum', subtitle: 'Multi-agent deliberation framework', accent: '#e87c7c' },
  { slug: 'projects/block-warfare', title: 'TurfSynth AR', subtitle: 'Location-based AR strategy game', accent: '#c9a84c' },
  { slug: 'projects/community-infrastructure', title: 'Community Infrastructure', subtitle: 'Collaborative governance and contribution systems', accent: '#7ce8e8' },
  { slug: 'projects/distribution-strategy', title: 'Distribution Strategy', subtitle: 'Multi-channel content distribution pipeline', accent: '#e8c87c' },
  { slug: 'projects/eight-organ-system', title: 'The Eight-Organ System', subtitle: 'Governance as creative infrastructure — 91 repos, 8 orgs', accent: '#a0a0a0' },
  { slug: 'projects/generative-music', title: 'Generative Music System', subtitle: 'Algorithmic composition and audio synthesis', accent: '#e87c7c' },
  { slug: 'projects/knowledge-base', title: 'My Knowledge Base', subtitle: 'Personal knowledge management system', accent: '#7c9bf5' },
  { slug: 'projects/life-my-midst-in', title: 'in-midst-my-life', subtitle: 'Commerce and product experience', accent: '#c9a84c' },
  { slug: 'projects/linguistic-atomization', title: 'LingFrame', subtitle: 'Linguistic atomization framework', accent: '#7c9bf5' },
  { slug: 'projects/metasystem-master', title: 'Omni-Dromenon Engine', subtitle: 'Metasystem orchestration across TypeScript and Python', accent: '#e87c7c' },
  { slug: 'projects/narratological-lenses', title: 'Narratological Algorithmic Lenses', subtitle: 'Computational narrative analysis', accent: '#7c9bf5' },
  { slug: 'projects/orchestration-hub', title: 'Orchestration Hub', subtitle: 'Central governance and workflow coordination', accent: '#7ce8a6' },
  { slug: 'projects/org-architecture', title: 'Org Architecture', subtitle: 'Organization structure and community health', accent: '#7ce8e8' },
  { slug: 'projects/public-process', title: 'Public Process', subtitle: 'Essays on building systems in public', accent: '#c97ce8' },
  { slug: 'projects/recursive-engine', title: 'Recursive Engine (RE:GE)', subtitle: 'Symbolic operating system for myth and narrative', accent: '#7c9bf5' },
  { slug: 'projects/the-actual-news', title: 'The Actual News', subtitle: 'Media platform and news aggregation', accent: '#c9a84c' },
  { slug: 'projects/your-fit-tailored', title: 'Your Fit Tailored', subtitle: 'Personalized fashion and commerce', accent: '#c9a84c' },
];

export const getStaticPaths: GetStaticPaths = () => {
  return pages.map((page) => ({
    params: { slug: page.slug },
    props: page,
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { title, subtitle, accent } = props as OGPage;
  const png = await generateOGImage(title, subtitle, accent);

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
