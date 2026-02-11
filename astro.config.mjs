// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://4444j99.github.io',
  base: '/portfolio',
  vite: {
    build: {
      chunkSizeWarningLimit: 1200,
    },
  },
});
