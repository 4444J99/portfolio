import { describe, it, expect } from 'vitest';
import { schemaPerson } from '../schema-person';

describe('schemaPerson', () => {
  it('has @type Person', () => {
    expect(schemaPerson['@type']).toBe('Person');
  });

  it('has a non-empty name', () => {
    expect(typeof schemaPerson.name).toBe('string');
    expect(schemaPerson.name.length).toBeGreaterThan(0);
  });

  it('sameAs is an array of valid URL strings', () => {
    expect(Array.isArray(schemaPerson.sameAs)).toBe(true);
    expect(schemaPerson.sameAs.length).toBeGreaterThan(0);
    for (const url of schemaPerson.sameAs) {
      expect(() => new URL(url)).not.toThrow();
    }
  });

  it('alumniOf is a non-empty array of organizations', () => {
    expect(Array.isArray(schemaPerson.alumniOf)).toBe(true);
    expect(schemaPerson.alumniOf.length).toBeGreaterThan(0);
    for (const org of schemaPerson.alumniOf) {
      expect(org['@type']).toBe('CollegeOrUniversity');
      expect(typeof org.name).toBe('string');
    }
  });

  it('knowsAbout is a non-empty array of strings', () => {
    expect(Array.isArray(schemaPerson.knowsAbout)).toBe(true);
    expect(schemaPerson.knowsAbout.length).toBeGreaterThan(0);
    for (const topic of schemaPerson.knowsAbout) {
      expect(typeof topic).toBe('string');
    }
  });

  it('hasCredential is a non-empty array with valid structure', () => {
    expect(Array.isArray(schemaPerson.hasCredential)).toBe(true);
    expect(schemaPerson.hasCredential.length).toBeGreaterThan(0);
    for (const cred of schemaPerson.hasCredential) {
      expect(cred['@type']).toBe('EducationalOccupationalCredential');
      expect(typeof cred.name).toBe('string');
      expect(cred.recognizedBy['@type']).toBe('Organization');
    }
  });
});
