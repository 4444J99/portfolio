const { readdirSync, statSync } = require('node:fs');
const { join } = require('node:path');

function collectHtmlUrls(dir, base = '') {
	const urls = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const rel = base ? `${base}/${entry.name}` : entry.name;
		if (entry.isDirectory()) {
			urls.push(...collectHtmlUrls(join(dir, entry.name), rel));
		} else if (entry.name.endsWith('.html')) {
			urls.push(`http://localhost/${rel}`);
		}
	}
	return urls.sort();
}

const distDir = join(__dirname, '..', 'dist');
let urls;
try {
	urls = collectHtmlUrls(distDir);
} catch {
	// dist/ may not exist yet during install; fall back to index only
	urls = ['http://localhost/index.html'];
}

/** @type {import('@lhci/cli').Config} */
module.exports = {
	ci: {
		collect: {
			staticDistDir: './dist',
			url: urls,
			numberOfRuns: 1,
		},
		assert: {
			assertions: {
				'categories:performance': ['error', { minScore: 0.9 }],
				'categories:accessibility': ['error', { minScore: 0.91 }],
				'categories:best-practices': ['error', { minScore: 0.93 }],
				'categories:seo': ['error', { minScore: 0.92 }],
				'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
				'largest-contentful-paint': ['warn', { maxNumericValue: 3000 }],
				'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
			},
		},
		upload: {
			target: 'filesystem',
			outputDir: '.lighthouseci',
		},
	},
};
