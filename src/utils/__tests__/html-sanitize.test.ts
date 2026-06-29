import { describe, expect, it } from 'vitest';
import { ALLOWED_ATTRS, ALLOWED_TAGS, escapeHtml, sanitizeHtml } from '../../../lib/html-sanitize';

describe('escapeHtml', () => {
	it('escapes ampersands', () => {
		expect(escapeHtml('foo & bar')).toBe('foo &amp; bar');
	});

	it('escapes less-than', () => {
		expect(escapeHtml('a < b')).toBe('a &lt; b');
	});

	it('escapes greater-than', () => {
		expect(escapeHtml('a > b')).toBe('a &gt; b');
	});

	it('escapes double quotes', () => {
		expect(escapeHtml('foo "bar" baz')).toBe('foo &quot;bar&quot; baz');
	});

	it('escapes single quotes', () => {
		expect(escapeHtml("foo 'bar' baz")).toBe('foo &#039;bar&#039; baz');
	});

	it('handles all escape characters together', () => {
		expect(escapeHtml(`<script>alert("xss & 'injection'")</script>`)).toBe(
			'&lt;script&gt;alert(&quot;xss &amp; &#039;injection&#039;&quot;)&lt;/script&gt;',
		);
	});

	it('handles already-escaped content', () => {
		const escaped = escapeHtml('test&value');
		expect(escapeHtml(escaped)).toBe('test&amp;amp;value');
	});
});

describe('sanitizeHtml', () => {
	it('allows h2 tags', () => {
		expect(sanitizeHtml('<h2>Title</h2>')).toBe('<h2>Title</h2>');
	});

	it('allows h3 tags', () => {
		expect(sanitizeHtml('<h3>Subtitle</h3>')).toBe('<h3>Subtitle</h3>');
	});

	it('allows p tags', () => {
		expect(sanitizeHtml('<p>paragraph</p>')).toBe('<p>paragraph</p>');
	});

	it('allows strong tags', () => {
		expect(sanitizeHtml('<strong>bold</strong>')).toBe('<strong>bold</strong>');
	});

	it('allows em tags', () => {
		expect(sanitizeHtml('<em>italic</em>')).toBe('<em>italic</em>');
	});

	it('allows code tags', () => {
		expect(sanitizeHtml('<code>function</code>')).toBe('<code>function</code>');
	});

	it('allows ul and li tags', () => {
		expect(sanitizeHtml('<ul><li>item</li></ul>')).toBe('<ul><li>item</li></ul>');
	});

	it('allows br tags', () => {
		expect(sanitizeHtml('line<br>break')).toBe('line<br>break');
	});

	it('removes script tags but keeps content', () => {
		expect(sanitizeHtml('<script>alert("xss")</script>')).toBe('alert("xss")');
	});

	it('removes style tags but keeps content', () => {
		expect(sanitizeHtml('<style>body { color: red; }</style>')).toBe('body { color: red; }');
	});

	it('removes iframe tags', () => {
		expect(sanitizeHtml('<iframe src="evil.com"></iframe>')).toBe('');
	});

	it('removes img tags', () => {
		expect(sanitizeHtml('<img src="evil.jpg" />')).toBe('');
	});

	it('removes onclick attributes', () => {
		expect(sanitizeHtml('<p onclick="alert(1)">text</p>')).toBe('<p>text</p>');
	});

	it('allows class attribute on h2', () => {
		expect(sanitizeHtml('<h2 class="heading">Title</h2>')).toBe('<h2 class="heading">Title</h2>');
	});

	it('allows class attribute on p', () => {
		expect(sanitizeHtml('<p class="intro">intro</p>')).toBe('<p class="intro">intro</p>');
	});

	it('removes class attribute from non-whitelisted elements', () => {
		expect(sanitizeHtml('<div class="container">content</div>')).toBe('content');
	});

	it('removes id attributes from all tags', () => {
		expect(sanitizeHtml('<p id="main">text</p>')).toBe('<p>text</p>');
	});

	it('removes href attributes from all tags', () => {
		expect(sanitizeHtml('<p href="evil.com">text</p>')).toBe('<p>text</p>');
	});

	it('handles closing tags', () => {
		expect(sanitizeHtml('<h2>Title</h2></h2>')).toBe('<h2>Title</h2></h2>');
	});

	it('handles mixed allowed and disallowed tags', () => {
		const input = '<h2>Title</h2><script>alert(1)</script><p>paragraph</p>';
		expect(sanitizeHtml(input)).toBe('<h2>Title</h2>alert(1)<p>paragraph</p>');
	});

	it('preserves nested allowed tags', () => {
		expect(sanitizeHtml('<p>Text with <strong>bold</strong> and <em>italic</em>.</p>')).toBe(
			'<p>Text with <strong>bold</strong> and <em>italic</em>.</p>',
		);
	});

	it('handles multiple attributes and preserves only allowed ones', () => {
		expect(sanitizeHtml('<h2 class="title" id="main" onclick="evil()">Heading</h2>')).toBe(
			'<h2 class="title">Heading</h2>',
		);
	});

	it('handles self-closing tags', () => {
		expect(sanitizeHtml('<br/>')).toBe('<br>');
	});

	it('removes malformed tags', () => {
		expect(sanitizeHtml('<h2>Unclosed')).toBe('<h2>Unclosed');
	});
});

describe('constants', () => {
	it('exports ALLOWED_TAGS array', () => {
		expect(ALLOWED_TAGS).toContain('h2');
		expect(ALLOWED_TAGS).toContain('h3');
		expect(ALLOWED_TAGS).toContain('p');
		expect(ALLOWED_TAGS).toContain('strong');
		expect(ALLOWED_TAGS).toContain('em');
		expect(ALLOWED_TAGS).toContain('code');
		expect(ALLOWED_TAGS).toContain('ul');
		expect(ALLOWED_TAGS).toContain('li');
		expect(ALLOWED_TAGS).toContain('br');
	});

	it('exports ALLOWED_ATTRS mapping', () => {
		expect(ALLOWED_ATTRS.h2).toContain('class');
		expect(ALLOWED_ATTRS.p).toContain('class');
	});
});
