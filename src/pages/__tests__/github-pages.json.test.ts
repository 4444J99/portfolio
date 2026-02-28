import { describe, it, expect } from 'vitest';
import { GET } from '../github-pages.json';

describe('github-pages.json.ts', () => {
  it('should return a JSON response with the pages directory', async () => {
    const context = {} as any;
    const response = GET(context);
    
    expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=300');
    
    const data = await response.json();
    expect(data).toHaveProperty('generatedAt');
    expect(data).toHaveProperty('repos');
  });
});
