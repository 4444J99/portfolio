import type p5 from 'p5';
import { PALETTE } from './palette';

const ORGANS = [
  { name: 'I Theoria', x: 0.12, y: 0.5, repos: 18 },
  { name: 'II Poiesis', x: 0.28, y: 0.25, repos: 27 },
  { name: 'III Ergon', x: 0.44, y: 0.5, repos: 21 },
  { name: 'IV Taxis', x: 0.56, y: 0.25, repos: 9 },
  { name: 'V Logos', x: 0.68, y: 0.5, repos: 2 },
  { name: 'VI Koinonia', x: 0.78, y: 0.25, repos: 3 },
  { name: 'VII Kerygma', x: 0.88, y: 0.5, repos: 4 },
  { name: 'VIII Meta', x: 0.5, y: 0.82, repos: 2 },
];

const EDGES: [number, number][] = [
  [0, 1], [1, 2], [3, 0], [3, 1], [3, 2],
  [7, 3], [4, 7], [5, 4], [6, 5],
];

const MAX_FLOW_PARTICLES = 80;

interface RepoParticle {
  organ: number;
  angle: number;
  dist: number;
  speed: number;
  size: number;
}

interface FlowParticle {
  edge: number;
  pos: number;
  speed: number;
}

export default function organSystemSketch(p: p5, container: HTMLElement) {
  let repoParticles: RepoParticle[] = [];
  let flowParticles: FlowParticle[] = [];
  let hoveredOrgan = -1;
  const isMobile = () => container.clientWidth < 768;

  p.setup = function () {
    p.createCanvas(container.clientWidth, container.clientHeight);
    p.frameRate(30);
    initParticles();
  };

  function initParticles() {
    repoParticles = [];
    flowParticles = [];

    const particleScale = isMobile() ? 0.5 : 1;
    ORGANS.forEach((organ, i) => {
      const count = Math.round(organ.repos * particleScale);
      for (let j = 0; j < count; j++) {
        repoParticles.push({
          organ: i,
          angle: Math.random() * p.TWO_PI,
          dist: 20 + Math.random() * 25,
          speed: 0.005 + Math.random() * 0.01,
          size: 2 + Math.random() * 2,
        });
      }
    });

    const flowCount = isMobile() ? 15 : 30;
    for (let i = 0; i < flowCount; i++) {
      flowParticles.push({
        edge: Math.floor(Math.random() * EDGES.length),
        pos: Math.random(),
        speed: 0.005 + Math.random() * 0.008,
      });
    }
  }

  function organPos(i: number): [number, number] {
    return [ORGANS[i].x * p.width, ORGANS[i].y * p.height];
  }

  p.draw = function () {
    p.background(...PALETTE.bg);
    const time = p.frameCount * 0.02;
    const nodeRadius = isMobile() ? 22 : 32;

    // Detect hover
    hoveredOrgan = -1;
    if (p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height) {
      for (let i = 0; i < ORGANS.length; i++) {
        const [ox, oy] = organPos(i);
        if (p.dist(p.mouseX, p.mouseY, ox, oy) < nodeRadius + 15) {
          hoveredOrgan = i;
          break;
        }
      }
    }

    // Draw edges
    EDGES.forEach(([from, to]) => {
      const [fx, fy] = organPos(from);
      const [tx, ty] = organPos(to);
      const isHighlighted = hoveredOrgan === from || hoveredOrgan === to;

      p.stroke(...PALETTE.border, isHighlighted ? 120 : 50);
      p.strokeWeight(isHighlighted ? 1.5 : 0.8);
      p.noFill();
      p.line(fx, fy, tx, ty);

      // Arrowhead
      const angle = Math.atan2(ty - fy, tx - fx);
      const headLen = 8;
      const ax = tx - Math.cos(angle) * (nodeRadius + 5);
      const ay = ty - Math.sin(angle) * (nodeRadius + 5);
      p.fill(...PALETTE.border, isHighlighted ? 140 : 60);
      p.noStroke();
      p.triangle(
        ax, ay,
        ax - Math.cos(angle - 0.4) * headLen,
        ay - Math.sin(angle - 0.4) * headLen,
        ax - Math.cos(angle + 0.4) * headLen,
        ay - Math.sin(angle + 0.4) * headLen,
      );
    });

    // Draw flow particles
    flowParticles.forEach((fp) => {
      const [from, to] = EDGES[fp.edge];
      const [fx, fy] = organPos(from);
      const [tx, ty] = organPos(to);
      const x = p.lerp(fx, tx, fp.pos);
      const y = p.lerp(fy, ty, fp.pos);

      const isEdgeHighlighted = hoveredOrgan === from || hoveredOrgan === to;
      p.noStroke();
      p.fill(...PALETTE.accent, isEdgeHighlighted ? 160 : 60);
      p.circle(x, y, 3);

      fp.pos += fp.speed;
      if (fp.pos > 1) {
        fp.pos = 0;
        fp.edge = Math.floor(Math.random() * EDGES.length);
      }
    });

    // Cap flow particles
    if (flowParticles.length > MAX_FLOW_PARTICLES) {
      flowParticles = flowParticles.slice(-MAX_FLOW_PARTICLES);
    }

    // Draw repo particles orbiting organs
    repoParticles.forEach((rp) => {
      const [ox, oy] = organPos(rp.organ);
      const isOrgHighlighted = hoveredOrgan === rp.organ;
      const x = ox + Math.cos(rp.angle) * rp.dist;
      const y = oy + Math.sin(rp.angle) * rp.dist;

      p.noStroke();
      p.fill(...PALETTE.accent, isOrgHighlighted ? 180 : 40);
      p.circle(x, y, rp.size);
      rp.angle += rp.speed;
    });

    // Draw organ nodes
    ORGANS.forEach((organ, i) => {
      const [ox, oy] = organPos(i);
      const isHovered = hoveredOrgan === i;
      const pulse = 1 + Math.sin(time * 1.5 + i * 0.8) * 0.08;
      const r = nodeRadius * pulse;

      p.noStroke();
      p.fill(...PALETTE.accent, isHovered ? 25 : 10);
      p.circle(ox, oy, r * 3);
      p.fill(...PALETTE.accent, isHovered ? 120 : 50);
      p.circle(ox, oy, r);
      p.fill(...PALETTE.text, isHovered ? 100 : 40);
      p.circle(ox, oy, r * 0.4);

      if (isHovered) {
        p.fill(...PALETTE.text, 220);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(isMobile() ? 9 : 11);
        p.textFont('JetBrains Mono, monospace');
        p.text(organ.name, ox, oy - r - 10);
        p.textSize(isMobile() ? 8 : 10);
        p.fill(...PALETTE.muted, 180);
        p.text(`${organ.repos} repos`, ox, oy + r + 12);
      }
    });

    // Bottom label
    p.fill(...PALETTE.muted, 30 + Math.sin(time * 0.3) * 15);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(isMobile() ? 8 : 10);
    p.textFont('JetBrains Mono, monospace');
    p.text('I \u2192 II \u2192 III  (no back-edges)', p.width / 2, p.height - 20);
  };

  function handleClick() {
    if (hoveredOrgan < 0) return;
    EDGES.forEach(([from], ei) => {
      if (from === hoveredOrgan) {
        for (let i = 0; i < 5; i++) {
          flowParticles.push({
            edge: ei,
            pos: 0,
            speed: 0.015 + Math.random() * 0.01,
          });
        }
      }
    });
  }

  p.mousePressed = handleClick;
  p.touchStarted = function () {
    // On touch, update mouseX/mouseY-based hover detection first
    if (p.touches.length > 0) {
      const touch = p.touches[0] as { x: number; y: number };
      p.mouseX = touch.x;
      p.mouseY = touch.y;
      // Re-detect hover for the tap position
      hoveredOrgan = -1;
      for (let i = 0; i < ORGANS.length; i++) {
        const [ox, oy] = organPos(i);
        const nodeRadius = isMobile() ? 22 : 32;
        if (p.dist(touch.x, touch.y, ox, oy) < nodeRadius + 15) {
          hoveredOrgan = i;
          break;
        }
      }
    }
    handleClick();
    return false;
  };

  p.windowResized = function () {
    p.resizeCanvas(container.clientWidth, container.clientHeight);
    initParticles();
  };
}
