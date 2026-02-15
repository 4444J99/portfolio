import type p5 from 'p5';
import { PALETTE, getTextColor } from './palette';

interface ScatterParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  trail: { x: number; y: number }[];
}

export default function scatterSketch(p: p5, container: HTMLElement) {
  let particles: ScatterParticle[] = [];
  let burstTimer = 0;
  const isMobile = () => container.clientWidth < 768;

  p.setup = function () {
    p.createCanvas(container.clientWidth, container.clientHeight);
    p.frameRate(30);
  };

  function burst() {
    const cx = p.width / 2;
    const cy = p.height / 2;
    const count = isMobile() ? 12 : 25;
    for (let i = 0; i < count; i++) {
      const angle = (p.TWO_PI / count) * i + (Math.random() - 0.5) * 0.3;
      const speed = 1.5 + Math.random() * 3;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 200,
        size: 2 + Math.random() * 3,
        trail: [],
      });
    }
  }

  p.draw = function () {
    p.clear();

    burstTimer++;
    if (burstTimer > (isMobile() ? 90 : 60)) {
      burstTimer = 0;
      burst();
    }

    particles.forEach((pt) => {
      pt.trail.push({ x: pt.x, y: pt.y });
      if (pt.trail.length > 12) pt.trail.shift();

      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vx *= 0.985;
      pt.vy *= 0.985;
      pt.alpha *= 0.98;

      // Draw trail
      pt.trail.forEach((t, i) => {
        const a = (i / pt.trail.length) * pt.alpha * 0.3;
        p.noStroke();
        p.fill(255, 255, 255, a);
        p.circle(t.x, t.y, pt.size * 0.5);
      });

      // Draw particle
      p.noStroke();
      p.fill(255, 255, 255, pt.alpha);
      p.circle(pt.x, pt.y, pt.size);
    });

    // Clean up faded particles
    particles = particles.filter((pt) => pt.alpha > 2);
    if (particles.length > (isMobile() ? 100 : 200)) {
      particles = particles.slice(-200);
    }

    // Center source indicator
    const pulse = Math.sin(p.frameCount * 0.05) * 0.3 + 0.7;
    p.noStroke();
    p.fill(255, 255, 255, 15 * pulse);
    p.circle(p.width / 2, p.height / 2, 30);
    p.fill(255, 255, 255, 40 * pulse);
    p.circle(p.width / 2, p.height / 2, 8);
  };

  p.windowResized = function () {
    p.resizeCanvas(container.clientWidth, container.clientHeight);
    particles = [];
  };
}
