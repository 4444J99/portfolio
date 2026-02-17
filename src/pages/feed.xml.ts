import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import essaysData from '../data/essays.json';
import { projectCatalog } from '../data/project-catalog';

interface EssayItem {
  title: string;
  date: string;
  url: string;
}

export function GET(context: APIContext) {
  const siteBase = 'https://4444j99.github.io/portfolio/';
  const fallbackProjectDate = new Date('2026-02-10T00:00:00.000Z');

  const projectItems = projectCatalog.map((project) => {
    const pubDate = project.publishedAt ? new Date(project.publishedAt) : fallbackProjectDate;
    return {
      title: project.title,
      description: project.summary,
      link: `${siteBase}projects/${project.slug}/`,
      pubDate,
      categories: [project.organ, ...project.tags],
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
