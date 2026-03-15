// Representative sample of page archetypes (6 pages instead of all ~50).
// Median of 3 runs smooths CI runner variance. ~3 min on GitHub Actions free runners.
const urls = [
	'http://localhost/index.html', // landing (p5.js canvas — heavier JS payload)
	'http://localhost/about/index.html', // content page
	'http://localhost/dashboard/index.html', // data-heavy
	'http://localhost/projects/orchestration-hub/index.html', // project detail
	'http://localhost/gallery/index.html', // media-heavy
	'http://localhost/consult/index.html', // interactive form
];

/** @type {import('@lhci/cli').Config} */
module.exports = {
	ci: {
		collect: {
			staticDistDir: './dist',
			url: urls,
			numberOfRuns: 3,
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
