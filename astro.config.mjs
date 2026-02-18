// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://4444j99.github.io',
  base: '/portfolio',
  // Keep navigation transitions but avoid eager cross-route prefetch bursts on heavy pages.
  prefetch: false,
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404') && !page.includes('/og/'),
    }),
  ],
  vite: {
    build: {
      // Runtime policy is enforced by gzip budget gates in scripts/check-bundle-budgets.mjs.
      // Keep this warning threshold high enough to avoid contradictory CI noise.
      chunkSizeWarningLimit: 1800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/p5')) return 'vendor-p5';
            if (id.includes('node_modules/mermaid')) return 'vendor-mermaid';
            if (id.includes('node_modules/cytoscape')) return 'vendor-cytoscape';
            if (id.includes('node_modules/katex')) return 'vendor-katex';
          },
        },
      },
    },
  },
});
