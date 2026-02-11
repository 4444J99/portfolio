import type p5 from 'p5';
import { PALETTE } from './palette';

const ORGAN_NAMES = [
  'Theoria', 'Poiesis', 'Ergon', 'Taxis',
  'Logos', 'Koinonia', 'Kerygma', 'Meta',
];

interface Organ {
  baseX: number;
  baseY: number;
  radius: number;
  phase: number;
  speed: number;
  labelAlpha: number;
  labelDir: number;
}

interface Particle {
  pos: number; // 0-1 along filament
  speed: number;
  from: number;
  to: number;
  alpha: number;
}

export default function heroSketch(p: p5, container: HTMLElement) {
  let organs: Organ[] = [];
  let particles: Particle[] = [];
  let filaments: [number, number][] = [];
  const isMobile = () => container.clientWidth < 768;

  p.setup = function () {
    const canvas = p.createCanvas(container.clientWidth, container.clientHeight);
    canvas.style('display', 'block');
    p.frameRate(30);

    initOrgans();
    initFilaments();
  };

  function initOrgans() {
    organs = [];
    const cx = p.width / 2;
    const cy = p.height / 2;
    const ringRadius = Math.min(p.width, p.height) * 0.3;

    for (let i = 0; i < 8; i++) {
      const angle = (p.TWO_PI / 8) * i - p.HALF_PI;
      organs.push({
        baseX: cx + Math.cos(angle) * ringRadius,
        baseY: cy + Math.sin(angle) * ringRadius,
        radius: isMobile() ? 18 : 28,
        phase: (p.TWO_PI / 8) * i,
        speed: 0.008 + Math.random() * 0.004,
        labelAlpha: 0,
        labelDir: 1,
      });
    }
  }

  function initFilaments() {
    filaments = [];
    // Connect adjacent organs + some cross-connections
    for (let i = 0; i < 8; i++) {
      filaments.push([i, (i + 1) % 8]);
      if (i < 4) filaments.push([i, i + 4]);
    }
    // Seed initial particles
    const count = isMobile() ? 20 : 40;
    for (let i = 0; i < count; i++) {
      const f = filaments[Math.floor(Math.random() * filaments.length)];
      particles.push({
        pos: Math.random(),
        speed: 0.003 + Math.random() * 0.005,
        from: f[0],
        to: f[1],
        alpha: 80 + Math.random() * 120,
      });
    }
  }

  p.draw = function () {
    p.background(...PALETTE.bg);

    const time = p.frameCount * 0.02;
    const mx = p.mouseX;
    const my = p.mouseY;
    const mouseInCanvas = mx > 0 && mx < p.width && my > 0 && my < p.height;

    // Draw filaments
    filaments.forEach(([from, to]) => {
      const a = organs[from];
      const b = organs[to];
      const ax = a.baseX + Math.sin(time + a.phase) * 3;
      const ay = a.baseY + Math.cos(time + a.phase) * 3;
      const bx = b.baseX + Math.sin(time + b.phase) * 3;
      const by = b.baseY + Math.cos(time + b.phase) * 3;

      p.stroke(...PALETTE.border, 60);
      p.strokeWeight(1);
      p.noFill();

      // Curved filament
      const cpx = (ax + bx) / 2 + Math.sin(time * 0.5) * 15;
      const cpy = (ay + by) / 2 + Math.cos(time * 0.5) * 15;
      p.bezier(ax, ay, cpx, cpy - 20, cpx, cpy + 20, bx, by);
    });

    // Draw particles along filaments
    particles.forEach((pt) => {
      const a = organs[pt.from];
      const b = organs[pt.to];
      const ax = a.baseX + Math.sin(time + a.phase) * 3;
      const ay = a.baseY + Math.cos(time + a.phase) * 3;
      const bx = b.baseX + Math.sin(time + b.phase) * 3;
      const by = b.baseY + Math.cos(time + b.phase) * 3;

      const t = pt.pos;
      const x = p.lerp(ax, bx, t);
      const y = p.lerp(ay, by, t);

      p.noStroke();
      p.fill(...PALETTE.accent, pt.alpha * 0.6);
      p.circle(x, y, 3);

      pt.pos += pt.speed;
      if (pt.pos > 1) {
        pt.pos = 0;
        const f = filaments[Math.floor(Math.random() * filaments.length)];
        pt.from = f[0];
        pt.to = f[1];
      }
    });

    // Draw organs
    organs.forEach((organ, i) => {
      const breathScale = 1 + Math.sin(time * 1.5 + organ.phase) * 0.12;
      const ox = organ.baseX + Math.sin(time + organ.phase) * 3;
      const oy = organ.baseY + Math.cos(time + organ.phase) * 3;

      // Mouse proximity effect
      let proximity = 0;
      if (mouseInCanvas) {
        const d = p.dist(mx, my, ox, oy);
        proximity = Math.max(0, 1 - d / 150);
      }

      const r = organ.radius * breathScale * (1 + proximity * 0.3);

      // Outer glow
      p.noStroke();
      p.fill(...PALETTE.accent, 15 + proximity * 30);
      p.circle(ox, oy, r * 3);

      // Inner glow
      p.fill(...PALETTE.accent, 30 + proximity * 40);
      p.circle(ox, oy, r * 2);

      // Core
      p.fill(...PALETTE.accent, 80 + proximity * 100);
      p.circle(ox, oy, r);

      // Bright center
      p.fill(...PALETTE.text, 60 + proximity * 80);
      p.circle(ox, oy, r * 0.4);

      // Label: fade based on proximity or slow cycle
      let targetAlpha = proximity > 0.3 ? 200 : 0;
      // Slow cycle: each organ label fades in/out
      const cycleAlpha = Math.sin(time * 0.3 + organ.phase * 2) * 0.5 + 0.5;
      if (proximity < 0.3) {
        targetAlpha = cycleAlpha > 0.8 ? (cycleAlpha - 0.8) * 5 * 140 : 0;
      }

      organ.labelAlpha = p.lerp(organ.labelAlpha, targetAlpha, 0.08);

      if (organ.labelAlpha > 5) {
        p.fill(...PALETTE.text, organ.labelAlpha);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(isMobile() ? 9 : 11);
        p.textFont('Inter, sans-serif');
        p.text(ORGAN_NAMES[i], ox, oy + r + 14);
      }
    });

    // Center label
    p.fill(...PALETTE.muted, 40 + Math.sin(time * 0.5) * 20);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(isMobile() ? 10 : 12);
    p.textFont('JetBrains Mono, monospace');
    const centerPulse = Math.sin(time * 0.5) * 0.5 + 0.5;
    p.fill(...PALETTE.muted, 30 + centerPulse * 30);
    p.text('ORGANVM', p.width / 2, p.height / 2);
  };

  p.mousePressed = function () {
    if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return;

    // Find nearest organ and send pulse
    let nearest = 0;
    let nearestDist = Infinity;
    organs.forEach((organ, i) => {
      const d = p.dist(p.mouseX, p.mouseY, organ.baseX, organ.baseY);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    });

    // Spawn burst of particles from nearest organ
    const count = isMobile() ? 6 : 12;
    for (let i = 0; i < count; i++) {
      const outgoing = filaments.filter(([from]) => from === nearest || filaments.filter(([_, to]) => to === nearest));
      const f = filaments.filter(([from, to]) => from === nearest || to === nearest);
      if (f.length > 0) {
        const fil = f[Math.floor(Math.random() * f.length)];
        particles.push({
          pos: fil[0] === nearest ? 0 : 1,
          speed: fil[0] === nearest ? 0.01 + Math.random() * 0.01 : -(0.01 + Math.random() * 0.01),
          from: fil[0],
          to: fil[1],
          alpha: 200,
        });
      }
    }
  };

  p.windowResized = function () {
    p.resizeCanvas(container.clientWidth, container.clientHeight);
    initOrgans();
  };
}
