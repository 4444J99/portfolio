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
      filter: (page) => !page.includes('/404'),
    }),
  ],
  vite: {
    build: {
      chunkSizeWarningLimit: 1200,
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
