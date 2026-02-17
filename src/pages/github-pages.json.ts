import type { APIContext } from 'astro';
import pagesDirectory from '../data/github-pages.json';

export function GET(_context: APIContext) {
  return new Response(JSON.stringify(pagesDirectory, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
