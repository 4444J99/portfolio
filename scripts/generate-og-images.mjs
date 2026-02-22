#!/usr/bin/env node
/**
 * Generate OG images (1200x630) for social sharing.
 * Uses canvas to create dark-themed branded images.
 *
 * Usage: node scripts/generate-og-images.mjs
 * Requires: npm install canvas (dev dependency)
 */

import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const ogDir = join(publicDir, 'og');
mkdirSync(ogDir, { recursive: true });

const pages = [
  { file: 'og-image.png', title: '4444j', subtitle: 'Creative Technologist' },
  { file: 'about.png', title: 'About', subtitle: 'Anthony James Padavano' },
  { file: 'resume.png', title: 'Resume', subtitle: 'Creative Technologist & Systems Architect' },
  { file: 'dashboard.png', title: 'Dashboard', subtitle: 'System Metrics — 91 Repositories' },
  { file: 'gallery.png', title: 'Gallery', subtitle: 'Generative Art Collection' },
  { file: 'essays.png', title: 'Essays', subtitle: 'Public Process — 28 Essays' },
];

const W = 1200;
const H = 630;

for (const page of pages) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0a0a0b';
  ctx.fillRect(0, 0, W, H);

  // Subtle grid pattern
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Accent line
  ctx.fillStyle = '#00BCD4';
  ctx.fillRect(80, 200, 4, 120);

  // Title
  ctx.fillStyle = '#e0e0e0';
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText(page.title, 110, 280);

  // Subtitle
  ctx.fillStyle = '#888888';
  ctx.font = '28px sans-serif';
  ctx.fillText(page.subtitle, 110, 330);

  // Footer branding
  ctx.fillStyle = '#444444';
  ctx.font = '18px monospace';
  ctx.fillText('4444j99.github.io/portfolio', 80, H - 50);

  // Accent dot
  ctx.fillStyle = '#E91E63';
  ctx.beginPath();
  ctx.arc(W - 100, 100, 6, 0, Math.PI * 2);
  ctx.fill();

  const buf = canvas.toBuffer('image/png');
  // Default OG image goes to public/ root; per-page images go to public/og/
  const dest = page.file === 'og-image.png'
    ? join(publicDir, page.file)
    : join(ogDir, page.file);
  writeFileSync(dest, buf);
  console.log(`Created ${page.file}`);
}

console.log('Done — OG images generated in public/ and public/og/');
