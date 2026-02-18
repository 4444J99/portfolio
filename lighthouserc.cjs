/** @type {import('@lhci/cli').Config} */
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: [
        'http://localhost/index.html',
        'http://localhost/about/index.html',
        'http://localhost/dashboard/index.html',
        'http://localhost/resume/index.html',
        'http://localhost/projects/recursive-engine/index.html',
        'http://localhost/gallery/index.html',
        'http://localhost/consult/index.html',
        'http://localhost/architecture/index.html',
        'http://localhost/omega/index.html',
        'http://localhost/github-pages/index.html',
        'http://localhost/products/index.html',
        'http://localhost/community/index.html',
        'http://localhost/essays/index.html',
      ],
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.90 }],
        'categories:best-practices': ['warn', { minScore: 0.90 }],
        'categories:seo': ['warn', { minScore: 0.90 }],
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
