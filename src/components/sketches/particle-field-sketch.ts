import type p5 from 'p5';
import { PALETTE } from './palette';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export default function particleFieldSketch(p: p5, container: HTMLElement) {
  let particles: Particle[] = [];
  const isMobile = () => container.clientWidth < 768;

  function getDensity(): number {
    const d = container.dataset.density;
    if (d === 'high') return isMobile() ? 60 : 120;
    if (d === 'low') return isMobile() ? 15 : 30;
    return isMobile() ? 30 : 60; // medium default
  }

  function getBehavior(): string {
    return container.dataset.behavior || 'drift';
  }

  function spawnParticle(): Particle {
    const behavior = getBehavior();
    let vx = 0;
    let vy = 0;

    switch (behavior) {
      case 'converge':
        // Move toward center
        vx = (p.width / 2 - Math.random() * p.width) * 0.002;
        vy = (p.height / 2 - Math.random() * p.height) * 0.002;
        break;
      case 'rise':
        vx = (Math.random() - 0.5) * 0.3;
        vy = -(0.3 + Math.random() * 0.5);
        break;
      case 'orbit':
        vx = (Math.random() - 0.5) * 0.8;
        vy = (Math.random() - 0.5) * 0.8;
        break;
      default: // drift
        vx = (Math.random() - 0.5) * 0.4;
        vy = (Math.random() - 0.5) * 0.4;
    }

    const maxLife = 120 + Math.random() * 180;
    return {
      x: Math.random() * p.width,
      y: behavior === 'rise' ? p.height + 10 : Math.random() * p.height,
      vx,
      vy,
      size: 1 + Math.random() * 3,
      alpha: 0,
      life: 0,
      maxLife,
    };
  }

  p.setup = function () {
    p.createCanvas(container.clientWidth, container.clientHeight);
    p.frameRate(30);

    const count = getDensity();
    for (let i = 0; i < count; i++) {
      const pt = spawnParticle();
      pt.life = Math.random() * pt.maxLife; // stagger initial states
      particles.push(pt);
    }
  };

  p.draw = function () {
    p.background(...PALETTE.bg);
    const behavior = getBehavior();
    const targetCount = getDensity();

    // Maintain particle count
    while (particles.length < targetCount) {
      particles.push(spawnParticle());
    }

    particles.forEach((pt) => {
      pt.life++;

      // Fade in and out
      const fadeIn = Math.min(pt.life / 30, 1);
      const fadeOut = Math.max((pt.maxLife - pt.life) / 30, 0);
      pt.alpha = Math.min(fadeIn, fadeOut) * 160;

      if (behavior === 'orbit') {
        // Gentle orbital motion around center
        const cx = p.width / 2;
        const cy = p.height / 2;
        const dx = pt.x - cx;
        const dy = pt.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        // Tangential velocity
        pt.vx += (-dy / dist) * 0.01;
        pt.vy += (dx / dist) * 0.01;
        // Slight pull toward center
        pt.vx -= dx * 0.00002;
        pt.vy -= dy * 0.00002;
        // Damping
        pt.vx *= 0.999;
        pt.vy *= 0.999;
      }

      pt.x += pt.vx;
      pt.y += pt.vy;

      // Recycle dead particles
      if (pt.life >= pt.maxLife || pt.x < -20 || pt.x > p.width + 20 || pt.y < -20 || pt.y > p.height + 20) {
        Object.assign(pt, spawnParticle());
        return;
      }

      // Draw
      p.noStroke();
      const useAccent = pt.size > 2;
      if (useAccent) {
        p.fill(...PALETTE.accent, pt.alpha * 0.6);
      } else {
        p.fill(...PALETTE.text, pt.alpha * 0.4);
      }
      p.circle(pt.x, pt.y, pt.size);
    });

    // Draw connections for nearby particles
    const connectionDist = isMobile() ? 60 : 80;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const d = p.dist(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
        if (d < connectionDist) {
          const alpha = (1 - d / connectionDist) * 25 * Math.min(particles[i].alpha, particles[j].alpha) / 160;
          p.stroke(...PALETTE.border, alpha * 160);
          p.strokeWeight(0.5);
          p.line(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
        }
      }
    }
  };

  p.windowResized = function () {
    p.resizeCanvas(container.clientWidth, container.clientHeight);
  };
}
