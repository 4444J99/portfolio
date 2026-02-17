import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import projectsData from '../data/projects.json';
import essaysData from '../data/essays.json';

interface ProjectItem {
  name: string;
  description: string;
  organ_name: string;
}

interface EssayItem {
  title: string;
  date: string;
  url: string;
  slug: string;
}

export function GET(context: APIContext) {
  const siteBase = 'https://4444j99.github.io/portfolio';

  const projectItems = (projectsData.projects as ProjectItem[]).map((p) => {
    const slug = p.name.replace(/--/g, '-').toLowerCase();
    return {
      title: p.name.split('--').map((w: string) =>
        w.charAt(0).toUpperCase() + w.slice(1)
      ).join(' — '),
      description: p.description,
      link: `${siteBase}/projects/${slug}/`,
      pubDate: new Date('2026-02-10'),
      categories: [p.organ_name],
    };
  });

  const essayItems = (essaysData.essays as EssayItem[]).map((e) => ({
    title: e.title,
    description: `Essay: ${e.title}`,
    link: e.url,
    pubDate: new Date(e.date),
    categories: ['Essay'],
  }));

  return rss({
    title: 'Anthony James Padavano — Portfolio',
    description: 'Creative technologist building autonomous creative systems and treating governance as artistic medium.',
    site: context.site?.toString() || siteBase,
    items: [...projectItems, ...essayItems].sort(
      (a, b) => b.pubDate.getTime() - a.pubDate.getTime()
    ),
    customData: '<language>en-us</language>',
  });
}
