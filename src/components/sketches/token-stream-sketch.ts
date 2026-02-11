import type p5 from 'p5';
import { PALETTE } from './palette';

const PHASES = [
  { label: 'Context', x: 0.08, width: 0.18 },
  { label: 'Generation', x: 0.3, width: 0.28 },
  { label: 'Review', x: 0.62, width: 0.15 },
  { label: 'Validation', x: 0.8, width: 0.18 },
];

interface Token {
  x: number;
  y: number;
  vx: number;
  phase: number;
  width: number;
  height: number;
  verified: boolean | null;
  alpha: number;
}

export default function tokenStreamSketch(p: p5, container: HTMLElement) {
  let tokens: Token[] = [];
  let tokenCounter = 0;
  let spawnTimer = 0;
  let selectedInfo: { verified: boolean; alpha: number } | null = null;
  let zoomPhase = -1;
  const isMobile = () => container.clientWidth < 768;

  p.setup = function () {
    p.createCanvas(container.clientWidth, container.clientHeight);
    p.frameRate(30);
  };

  function phaseX(i: number): number {
    return PHASES[i].x * p.width;
  }

  function phaseWidth(i: number): number {
    return PHASES[i].width * p.width;
  }

  function riverY(phase: number): { top: number; bottom: number } {
    const cx = p.height * 0.5;
    let halfHeight: number;

    switch (phase) {
      case 0: halfHeight = p.height * 0.12; break;
      case 1: halfHeight = p.height * 0.25; break;
      case 2: halfHeight = p.height * 0.08; break;
      case 3: halfHeight = p.height * 0.12; break;
      default: halfHeight = p.height * 0.12;
    }

    return { top: cx - halfHeight, bottom: cx + halfHeight };
  }

  p.draw = function () {
    p.background(...PALETTE.bg);
    const time = p.frameCount * 0.02;

    // Detect zoom phase from mouse X
    zoomPhase = -1;
    if (p.mouseX > 0 && p.mouseX < p.width) {
      for (let i = 0; i < PHASES.length; i++) {
        const px = phaseX(i);
        const pw = phaseWidth(i);
        if (p.mouseX >= px && p.mouseX <= px + pw) {
          zoomPhase = i;
          break;
        }
      }
    }

    // Draw river banks per phase
    PHASES.forEach((phase, i) => {
      const px = phaseX(i);
      const pw = phaseWidth(i);
      const { top, bottom } = riverY(i);
      const isZoomed = zoomPhase === i;

      p.noStroke();
      p.fill(...PALETTE.card, isZoomed ? 60 : 30);
      p.rect(px, top, pw, bottom - top, 4);

      p.stroke(...PALETTE.border, isZoomed ? 80 : 40);
      p.strokeWeight(0.5);
      p.line(px, top, px + pw, top);
      p.line(px, bottom, px + pw, bottom);

      p.fill(...PALETTE.text, isZoomed ? 180 : 60);
      p.noStroke();
      p.textFont('JetBrains Mono, monospace');
      p.textSize(isMobile() ? 8 : 10);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(phase.label, px + pw / 2, top - 12);

      if (i === 2) {
        p.fill(...PALETTE.accent, 30 + Math.sin(time * 2) * 15);
        p.textSize(isMobile() ? 6 : 8);
        p.text('human bottleneck', px + pw / 2, bottom + 12);
      }
    });

    // Spawn tokens
    spawnTimer++;
    if (spawnTimer > (isMobile() ? 12 : 6)) {
      spawnTimer = 0;
      const { top, bottom } = riverY(0);
      tokens.push({
        x: phaseX(0) - 5,
        y: p.lerp(top + 5, bottom - 5, Math.random()),
        vx: 0.8 + Math.random() * 0.6,
        phase: 0,
        width: isMobile() ? 6 : 10,
        height: isMobile() ? 4 : 6,
        verified: null,
        alpha: 200,
      });
      tokenCounter++;
    }

    // Update + draw tokens
    tokens = tokens.filter((t) => t.x < p.width + 20 && t.alpha > 0);
    if (tokens.length > (isMobile() ? 80 : 150)) {
      tokens = tokens.slice(-(isMobile() ? 80 : 150));
    }

    tokens.forEach((token) => {
      token.x += token.vx;

      // Determine current phase
      for (let i = PHASES.length - 1; i >= 0; i--) {
        if (token.x >= phaseX(i)) {
          token.phase = i;
          break;
        }
      }

      // Fit within river banks
      const { top, bottom } = riverY(token.phase);
      token.y = p.constrain(token.y, top + 3, bottom - 3);
      const center = (top + bottom) / 2;
      token.y = p.lerp(token.y, center + (Math.random() - 0.5) * (bottom - top) * 0.6, 0.02);

      // Speed adjustments per phase
      if (token.phase === 1) token.vx = p.lerp(token.vx, 1.2, 0.02);
      if (token.phase === 2) token.vx = p.lerp(token.vx, 0.4, 0.05);
      if (token.phase === 3) token.vx = p.lerp(token.vx, 0.9, 0.02);

      // Review decision
      if (token.phase >= 2 && token.verified === null) {
        token.verified = Math.random() > 0.15;
      }

      // Token color
      let r: number, g: number, b: number;
      if (token.verified === null) {
        [r, g, b] = PALETTE.muted;
      } else if (token.verified) {
        [r, g, b] = PALETTE.accent;
      } else {
        [r, g, b] = [180, 80, 80];
      }

      p.noStroke();
      p.fill(r, g, b, token.alpha * 0.8);
      p.rect(token.x, token.y, token.width, token.height, 1);
    });

    // Running counter
    const displayCount = Math.min(tokenCounter * 15, 289000);
    const countStr = displayCount >= 289000 ? '289K' : `${Math.floor(displayCount / 1000)}K`;
    p.fill(...PALETTE.accent, 60);
    p.noStroke();
    p.textFont('JetBrains Mono, monospace');
    p.textSize(isMobile() ? 10 : 14);
    p.textAlign(p.RIGHT, p.BOTTOM);
    p.text(`${countStr} tokens`, p.width - 15, p.height - 10);

    // Selected token info
    if (selectedInfo && selectedInfo.alpha > 0) {
      const statusText = selectedInfo.verified
        ? 'Factual: VERIFIED'
        : 'Hallucinated: flagged';
      const [sr, sg, sb] = selectedInfo.verified ? PALETTE.accent : [180, 80, 80] as [number, number, number];
      p.fill(sr, sg, sb, selectedInfo.alpha);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(isMobile() ? 10 : 13);
      p.text(statusText, p.width / 2, p.height * 0.12);
      selectedInfo.alpha -= 3;
    }
  };

  function handleClick() {
    if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return;

    let nearest: Token | null = null;
    let nearDist = 15;
    tokens.forEach((t) => {
      if (t.phase >= 2 && t.verified !== null) {
        const d = p.dist(p.mouseX, p.mouseY, t.x + t.width / 2, t.y + t.height / 2);
        if (d < nearDist) {
          nearDist = d;
          nearest = t;
        }
      }
    });

    if (nearest) {
      const found = nearest as Token;
      selectedInfo = { verified: found.verified!, alpha: 220 };
    }
  }

  p.mousePressed = handleClick;
  p.touchStarted = function () {
    handleClick();
    return false;
  };

  p.windowResized = function () {
    p.resizeCanvas(container.clientWidth, container.clientHeight);
  };
}
