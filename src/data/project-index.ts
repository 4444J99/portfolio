/** Lightweight index for cross-linking between project pages. */
export interface ProjectEntry {
  slug: string;
  title: string;
  tags: string[];
}

export const projectIndex: ProjectEntry[] = [
  { slug: 'aetheria-rpg', title: 'Aetheria Classroom RPG', tags: ['Product', 'Education', 'Game Design'] },
  { slug: 'agentic-titan', title: 'Agentic Titan', tags: ['Orchestration', 'AI', 'Python'] },
  { slug: 'ai-conductor', title: 'AI-Conductor Model', tags: ['AI', 'Process', 'Methodology'] },
  { slug: 'ai-council', title: 'AI Council Coliseum', tags: ['Art', 'AI'] },
  { slug: 'block-warfare', title: 'TurfSynth AR (My Block Warfare)', tags: ['Commerce', 'Game'] },
  { slug: 'community-infrastructure', title: 'Community Infrastructure', tags: ['Community', 'Education'] },
  { slug: 'distribution-strategy', title: 'Distribution Strategy', tags: ['Marketing', 'Distribution'] },
  { slug: 'eight-organ-system', title: 'The Eight-Organ System', tags: ['Systems', 'Governance', 'Architecture'] },
  { slug: 'generative-music', title: 'Generative Music System', tags: ['Art', 'Audio', 'Performance'] },
  { slug: 'knowledge-base', title: 'My Knowledge Base', tags: ['Theory', 'Knowledge'] },
  { slug: 'life-my-midst-in', title: 'in-midst-my-life', tags: ['Commerce', 'Product'] },
  { slug: 'linguistic-atomization', title: 'LingFrame — Linguistic Atomization Framework', tags: ['Theory', 'Language'] },
  { slug: 'metasystem-master', title: 'Omni-Dromenon Engine (Metasystem Master)', tags: ['Art', 'TypeScript', 'Python', 'Architecture'] },
  { slug: 'narratological-lenses', title: 'Narratological Algorithmic Lenses', tags: ['Theory', 'Narrative'] },
  { slug: 'orchestration-hub', title: 'Orchestration Hub', tags: ['Governance', 'Python', 'Systems'] },
  { slug: 'org-architecture', title: 'Org Architecture & Community Health', tags: ['Systems', 'Community'] },
  { slug: 'public-process', title: 'Public Process', tags: ['Essays', 'Transparency'] },
  { slug: 'recursive-engine', title: 'Recursive Engine (RE:GE)', tags: ['Theory', 'Python', 'DSL'] },
  { slug: 'the-actual-news', title: 'The Actual News', tags: ['Commerce', 'Media'] },
  { slug: 'your-fit-tailored', title: 'Your Fit Tailored', tags: ['Commerce', 'Product'] },
];
