import type p5 from 'p5';
import { PALETTE } from './palette';

const CHAMBERS = [
  { label: 'Theory', x: 0.15, successRate: 0.85 },
  { label: 'Art', x: 0.5, successRate: 0.78 },
  { label: 'Commerce', x: 0.85, successRate: 0.65 },
];

const FAILURE_REASONS = [
  'Onboarding too complex',
  'Free tier insufficient',
  'Wrong sales channel',
  'Content inconsistency',
  'Setup time: 2-3 hours',
  'Price point mismatch',
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  chamber: number;
  alive: boolean;
  success: boolean;
  settled: boolean;
  color: [number, number, number, number];
}

interface Sediment {
  x: number;
  y: number;
  reason: string;
  alpha: number;
}

export default function pipelineSketch(p: p5, container: HTMLElement) {
  let particles: Particle[] = [];
  let sediments: Sediment[] = [];
  let hoveredChamber = -1;
  let selectedSediment: { reason: string; alpha: number } | null = null;
  let spawnTimer = 0;
  const isMobile = () => container.clientWidth < 768;

  p.setup = function () {
    p.createCanvas(container.clientWidth, container.clientHeight);
    p.frameRate(30);
  };

  function chamberX(i: number): number {
    return CHAMBERS[i].x * p.width;
  }

  function chamberWidth(): number {
    return p.width * 0.22;
  }

  function strictness(): number {
    if (p.mouseY <= 0 || p.mouseY >= p.height) return 0.5;
    return p.mouseY / p.height;
  }

  p.draw = function () {
    p.background(...PALETTE.bg);
    const cw = chamberWidth();
    const chamberTop = p.height * 0.15;
    const chamberBottom = p.height * 0.65;
    const chamberH = chamberBottom - chamberTop;
    const gapBottom = p.height * 0.7;

    // Detect hover
    hoveredChamber = -1;
    if (p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height) {
      for (let i = 0; i < CHAMBERS.length; i++) {
        const cx = chamberX(i);
        if (Math.abs(p.mouseX - cx) < cw / 2 && p.mouseY > chamberTop && p.mouseY < chamberBottom) {
          hoveredChamber = i;
          break;
        }
      }
    }

    // Draw connections between chambers
    for (let i = 0; i < CHAMBERS.length - 1; i++) {
      const x1 = chamberX(i) + cw / 2;
      const x2 = chamberX(i + 1) - cw / 2;
      const cy = (chamberTop + chamberBottom) / 2;
      p.stroke(...PALETTE.border, 60);
      p.strokeWeight(1);
      p.noFill();
      p.line(x1, cy, x2, cy);
      p.fill(...PALETTE.border, 60);
      p.noStroke();
      p.triangle(x2, cy, x2 - 8, cy - 4, x2 - 8, cy + 4);
    }

    // Draw chambers
    CHAMBERS.forEach((chamber, i) => {
      const cx = chamberX(i);
      const isHovered = hoveredChamber === i;

      p.noFill();
      p.stroke(...PALETTE.border, isHovered ? 120 : 60);
      p.strokeWeight(isHovered ? 1.5 : 1);
      p.rect(cx - cw / 2, chamberTop, cw, chamberH, 6);

      // Gap at bottom
      const gapWidth = cw * 0.3 * (1 - strictness() * 0.5);
      p.fill(...PALETTE.bg);
      p.noStroke();
      p.rect(cx - gapWidth / 2, chamberBottom - 2, gapWidth, 6);

      // Label
      p.fill(...PALETTE.text, isHovered ? 220 : 100);
      p.noStroke();
      p.textFont('JetBrains Mono, monospace');
      p.textSize(isMobile() ? 9 : 11);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(chamber.label, cx, chamberTop - 12);

      // Roman numeral
      const numerals = ['I', 'II', 'III'];
      p.fill(...PALETTE.accent, isHovered ? 180 : 60);
      p.textSize(isMobile() ? 7 : 9);
      p.text(numerals[i], cx, chamberBottom + 14);

      if (isHovered) {
        const rate = Math.round(chamber.successRate * 100 * (0.8 + strictness() * 0.4));
        p.fill(...PALETTE.accent, 160);
        p.textSize(isMobile() ? 8 : 10);
        p.text(`${rate}% pass`, cx, chamberBottom + 28);
      }
    });

    // Spawn particles
    spawnTimer++;
    if (spawnTimer > (isMobile() ? 15 : 8)) {
      spawnTimer = 0;
      particles.push({
        x: chamberX(0) - cw / 2 - 20,
        y: (chamberTop + chamberBottom) / 2 + (Math.random() - 0.5) * chamberH * 0.6,
        vx: 1.5 + Math.random(),
        vy: (Math.random() - 0.5) * 0.5,
        chamber: 0,
        alive: true,
        success: true,
        settled: false,
        color: [...PALETTE.accent, 180],
      });
    }

    // Update + draw particles
    particles = particles.filter((pt) => pt.alive);
    if (particles.length > (isMobile() ? 60 : 120)) {
      particles = particles.slice(-(isMobile() ? 60 : 120));
    }

    particles.forEach((pt) => {
      if (pt.settled) return;

      pt.x += pt.vx;
      pt.y += pt.vy;

      for (let i = 0; i < CHAMBERS.length; i++) {
        const cx = chamberX(i);
        const inChamber = Math.abs(pt.x - cx) < cw / 2;

        if (inChamber && pt.chamber === i) {
          const gapWidth = cw * 0.3 * (1 - strictness() * 0.5);
          const atBottom = pt.y > chamberBottom - 10;
          const overGap = Math.abs(pt.x - cx) < gapWidth / 2;

          if (atBottom && overGap && Math.random() > CHAMBERS[i].successRate * (0.8 + strictness() * 0.4)) {
            pt.success = false;
            pt.vy = 1.5;
            pt.vx = (Math.random() - 0.5) * 0.5;
            pt.color = [...PALETTE.muted, 100];
          }

          if (pt.y < chamberTop + 5) pt.vy = Math.abs(pt.vy) * 0.5 + 0.3;
          if (pt.y > chamberBottom - 5 && pt.success) pt.vy = -Math.abs(pt.vy) * 0.5 - 0.3;

          break;
        }

        if (pt.x > cx + cw / 2 && pt.chamber === i && i < CHAMBERS.length - 1 && pt.success) {
          pt.chamber = i + 1;
        }
      }

      if (pt.x > p.width + 10) {
        pt.alive = false;
      }

      if (!pt.success && pt.y > gapBottom) {
        pt.settled = true;
        pt.vy = 0;
        pt.vx = 0;
        sediments.push({
          x: pt.x,
          y: Math.min(pt.y, p.height - 20),
          reason: FAILURE_REASONS[Math.floor(Math.random() * FAILURE_REASONS.length)],
          alpha: 80,
        });
        pt.alive = false;
      }

      p.noStroke();
      const [r, g, b, a] = pt.color;
      p.fill(r, g, b, a);
      p.circle(pt.x, pt.y, 4);
    });

    // Draw sediment
    sediments = sediments.slice(-50);
    sediments.forEach((sed) => {
      p.noStroke();
      p.fill(...PALETTE.muted, sed.alpha * 0.4);
      p.circle(sed.x, sed.y, 3);
    });

    // Show selected sediment reason
    if (selectedSediment && selectedSediment.alpha > 0) {
      p.fill(...PALETTE.text, selectedSediment.alpha * 2);
      p.noStroke();
      p.textFont('JetBrains Mono, monospace');
      p.textSize(isMobile() ? 9 : 11);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(selectedSediment.reason, p.width / 2, p.height - 10);
      selectedSediment.alpha -= 1.5;
    }

    // Metrics labels
    p.fill(...PALETTE.muted, 30);
    p.noStroke();
    p.textFont('JetBrains Mono, monospace');
    p.textSize(isMobile() ? 7 : 8);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('+23% engagement   |   41% month-6 retention', p.width / 2, p.height - 25);
  };

  function handleClick() {
    if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return;

    let nearestSed: Sediment | null = null;
    let nearestDist = 30;
    sediments.forEach((sed) => {
      const d = p.dist(p.mouseX, p.mouseY, sed.x, sed.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearestSed = sed;
      }
    });

    if (nearestSed) {
      selectedSediment = { reason: (nearestSed as Sediment).reason, alpha: 150 };
    }
  }

  p.mousePressed = handleClick;
  p.touchStarted = function () {
    handleClick();
    return false;
  };

  p.windowResized = function () {
    p.resizeCanvas(container.clientWidth, container.clientHeight);
    sediments = [];
  };
}
