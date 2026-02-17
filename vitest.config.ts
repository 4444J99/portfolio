import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/__tests__/**',
        'src/**/*.astro',
        'src/components/sketches/*-sketch.ts',
        'src/components/charts/*-chart.ts',
        'src/env.d.ts',
      ],
      thresholds: {
        statements: 6,
        branches: 5,
        functions: 3,
        lines: 6,
      },
    },
  },
});
