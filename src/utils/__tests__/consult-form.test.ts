import { describe, expect, it } from 'vitest';
import {
    buildFallbackAnalysis,
    escapeHtml,
    markdownToHtml,
    ORGAN_PROFILES,
    sanitizeHtml,
    titleCaseIndustry
} from '../consult-form';

describe('escapeHtml', () => {
  it('escapes ampersand', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('escapes quotes', () => {
    expect(escapeHtml('"hello" \'world\'')).toBe('&quot;hello&quot; &#039;world&#039;');
  });

  it('returns empty string unchanged', () => {
    expect(escapeHtml('')).toBe('');
  });
});

describe('sanitizeHtml', () => {
  it('allows h2, h3, p, strong, em, code, ul, li, br', () => {
    const html = '<h2>Title</h2><p>Text</p><strong>bold</strong><em>italics</em><code>code</code><ul><li>item</li></ul><br>';
    expect(sanitizeHtml(html)).toContain('<h2>');
    expect(sanitizeHtml(html)).toContain('<p>');
  });

  it('strips disallowed tags', () => {
    expect(sanitizeHtml('<script>evil</script><p>safe</p>')).not.toContain('script');
    expect(sanitizeHtml('<script>evil</script><p>safe</p>')).toContain('<p>');
  });
});

describe('markdownToHtml', () => {
  it('converts ## headings', () => {
    expect(markdownToHtml('## Hello')).toContain('<h2');
    expect(markdownToHtml('## Hello')).toContain('Hello');
  });

  it('converts ### headings', () => {
    expect(markdownToHtml('### Sub')).toContain('<h3');
  });

  it('converts **bold** and *italic*', () => {
    expect(markdownToHtml('**bold**')).toContain('<strong>bold</strong>');
    expect(markdownToHtml('*italic*')).toContain('<em>italic</em>');
  });

  it('converts `code`', () => {
    expect(markdownToHtml('`code`')).toContain('<code>code</code>');
  });

  it('converts list items', () => {
    const html = markdownToHtml('- item1\n- item2');
    expect(html).toContain('<li>');
    expect(html).toContain('<ul>');
  });

  it('sanitizes injected HTML', () => {
    expect(markdownToHtml('<script>alert(1)</script>')).not.toContain('<script>');
  });
});

describe('titleCaseIndustry', () => {
  it('returns label for known industry', () => {
    expect(titleCaseIndustry('education')).toBe('Education & EdTech');
    expect(titleCaseIndustry('arts')).toBe('Arts & Culture');
  });

  it('returns input for unknown industry', () => {
    expect(titleCaseIndustry('unknown')).toBe('unknown');
  });
});

describe('buildFallbackAnalysis', () => {
  it('returns RenderAnalysis shape', () => {
    const result = buildFallbackAnalysis('I need a SaaS platform', 'saas', 'Test note', 'req-1');
    expect(result.mode).toBe('fallback');
    expect(result.source).toBe('local-fallback');
    expect(result.requestId).toBe('req-1');
    expect(result.note).toBe('Test note');
    expect(typeof result.html).toBe('string');
  });

  it('includes organ sections in HTML', () => {
    const result = buildFallbackAnalysis('SaaS platform with automation', 'saas', '', 'req-2');
    expect(result.html).toContain('ORGAN');
    expect(result.html).toContain('Recommended Next Steps');
  });

  it('truncates long challenges to 240 chars', () => {
    const longChallenge = 'a'.repeat(300);
    const result = buildFallbackAnalysis(longChallenge, '', '', 'req-3');
    expect(result.html).toContain('...');
  });

  it('uses cross-domain when industry is empty', () => {
    const result = buildFallbackAnalysis('generic challenge', '', '', 'req-4');
    expect(result.html).toContain('cross-domain');
  });
});

describe('ORGAN_PROFILES', () => {
  it('has 7 organ profiles', () => {
    expect(ORGAN_PROFILES).toHaveLength(7);
  });

  it('each organ has required fields', () => {
    for (const organ of ORGAN_PROFILES) {
      expect(organ.id).toBeTruthy();
      expect(organ.title).toBeTruthy();
      expect(organ.summary).toBeTruthy();
      expect(Array.isArray(organ.capabilities)).toBe(true);
      expect(Array.isArray(organ.repos)).toBe(true);
      expect(Array.isArray(organ.keywords)).toBe(true);
    }
  });
});
