import { describe, it, expect } from 'vitest';
import { projectIndex } from '../project-index';

describe('projectIndex', () => {
  it('has at least 10 projects', () => {
    expect(projectIndex.length).toBeGreaterThanOrEqual(10);
  });

  it('has unique slugs', () => {
    const slugs = projectIndex.map(p => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('every entry has a non-empty slug', () => {
    for (const p of projectIndex) {
      expect(p.slug).toBeTruthy();
      expect(typeof p.slug).toBe('string');
    }
  });

  it('every entry has a non-empty title', () => {
    for (const p of projectIndex) {
      expect(p.title).toBeTruthy();
      expect(typeof p.title).toBe('string');
    }
  });

  it('every entry has at least one tag', () => {
    for (const p of projectIndex) {
      expect(Array.isArray(p.tags)).toBe(true);
      expect(p.tags.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('slugs are URL-safe (lowercase, alphanumeric, hyphens)', () => {
    for (const p of projectIndex) {
      expect(p.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('tags are non-empty strings without leading/trailing whitespace', () => {
    for (const p of projectIndex) {
      for (const tag of p.tags) {
        expect(tag.trim()).toBe(tag);
        expect(tag.length).toBeGreaterThan(0);
      }
    }
  });
});
