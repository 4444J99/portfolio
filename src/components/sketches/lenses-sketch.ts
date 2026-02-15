import type p5 from 'p5';
import { PALETTE, getTextColor } from './palette';

interface Lens {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  hue: number;
}

export default function lensesSketch(p: p5, container: HTMLElement) {
  let lenses: Lens[] = [];
  const isMobile = () => container.clientWidth < 768;

  p.setup = function () {
    p.createCanvas(container.clientWidth, container.clientHeight);
    p.frameRate(30);
    const count = isMobile() ? 5 : 8;
    lenses = Array.from({ length: count }, (_, i) => ({
      x: p.width * 0.2 + Math.random() * p.width * 0.6,
      y: p.height * 0.2 + Math.random() * p.height * 0.6,
      radius: 30 + Math.random() * 50,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      hue: (i / count) * 360,
    }));
  };

  p.draw = function () {
    p.clear();
    const time = p.frameCount * 0.015;

    lenses.forEach((lens) => {
      lens.x += lens.vx;
      lens.y += lens.vy;

      if (lens.x - lens.radius < 0 || lens.x + lens.radius > p.width) lens.vx *= -1;
      if (lens.y - lens.radius < 0 || lens.y + lens.radius > p.height) lens.vy *= -1;

      lens.x = p.constrain(lens.x, lens.radius, p.width - lens.radius);
      lens.y = p.constrain(lens.y, lens.radius, p.height - lens.radius);
    });

    // Draw overlapping lenses
    lenses.forEach((lens, i) => {
      const pulse = Math.sin(time + i * 0.8) * 0.2 + 0.8;
      const r = lens.radius * pulse;

      // Outer glow
      p.noStroke();
      p.fill(255, 255, 255, 5);
      p.circle(lens.x, lens.y, r * 2.5);

      // Main circle
      p.fill(255, 255, 255, 15);
      p.circle(lens.x, lens.y, r * 2);

      // Inner ring
      p.noFill();
      p.stroke(255, 255, 255, 35 * pulse);
      p.strokeWeight(1);
      p.circle(lens.x, lens.y, r * 2);

      // Refraction ring
      p.stroke(255, 255, 255, 20 * pulse);
      p.strokeWeight(0.5);
      p.circle(lens.x, lens.y, r * 1.4);
    });

    // Draw intersection highlights
    for (let i = 0; i < lenses.length; i++) {
      for (let j = i + 1; j < lenses.length; j++) {
        const d = p.dist(lenses[i].x, lenses[i].y, lenses[j].x, lenses[j].y);
        const maxDist = lenses[i].radius + lenses[j].radius;
        if (d < maxDist) {
          const overlap = 1 - d / maxDist;
          const mx = (lenses[i].x + lenses[j].x) / 2;
          const my = (lenses[i].y + lenses[j].y) / 2;

          p.noStroke();
          p.fill(255, 255, 255, 30 * overlap);
          p.circle(mx, my, Math.min(lenses[i].radius, lenses[j].radius) * overlap * 2);

          // Bright point at intersection
          p.fill(255, 255, 255, 80 * overlap);
          p.circle(mx, my, 4);
        }
      }
    }
  };

  p.windowResized = function () {
    p.resizeCanvas(container.clientWidth, container.clientHeight);
  };
}
