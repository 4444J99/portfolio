export const ALLOWED_TAGS = ['h2', 'h3', 'p', 'strong', 'em', 'code', 'ul', 'li', 'br'];
export const ALLOWED_ATTRS = {
	h2: ['class'],
	p: ['class'],
};

export function escapeHtml(str) {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

export function sanitizeHtml(html) {
	return html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (tag, name, attrs) => {
		const lowerName = name.toLowerCase();
		if (!ALLOWED_TAGS.includes(lowerName)) return '';
		if (tag.startsWith('</')) return `</${lowerName}>`;
		const allowedAttrs = ALLOWED_ATTRS[lowerName] || [];
		const safeAttrs = (attrs.match(/\s[\w-]+="[^"]*"/g) || []).filter((attr) =>
			allowedAttrs.some((allowed) => attr.trimStart().startsWith(`${allowed}=`)),
		);
		return `<${lowerName}${safeAttrs.join('')}>`;
	});
}
