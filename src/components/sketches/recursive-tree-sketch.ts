import type p5 from 'p5';
import { PALETTE, type RGB } from './palette';

const DSL_FRAGMENTS = [
  'INVOKE myth.hero_journey',
  'BINDING outcome TO identity',
  'WHEN readiness EXCEEDS threshold',
  'INVOKE ritual.ceremony',
  'WITH depth: recursive',
  'BINDING self TO transform',
];

interface Branch {
  x: number;
  y: number;
  angle: number;
  length: number;
  depth: number;
  type: 'invoke' | 'binding' | 'when';
  growth: number;
  children: Branch[];
  recurseTarget: number | null;
}

export default function recursiveTreeSketch(p: p5, container: HTMLElement) {
  let branches: Branch[] = [];
  let flashText = '';
  let flashAlpha = 0;
  let time = 0;
  const isMobile = () => container.clientWidth < 768;

  p.setup = function () {
    p.createCanvas(container.clientWidth, container.clientHeight);
    p.frameRate(30);
    buildTree();
  };

  function buildTree() {
    branches = [];
    const rootX = p.width / 2;
    const rootY = p.height - 30;
    branches.push(createBranch(rootX, rootY, -p.HALF_PI, isMobile() ? 60 : 90, 0));
    growRecursive(branches[0], 0, isMobile() ? 4 : 6);
  }

  function createBranch(x: number, y: number, angle: number, length: number, depth: number): Branch {
    const types: ('invoke' | 'binding' | 'when')[] = ['invoke', 'binding', 'when'];
    return {
      x, y, angle, length, depth,
      type: types[depth % 3],
      growth: 0,
      children: [],
      recurseTarget: depth > 2 && Math.random() > 0.6 ? y + length * 0.5 : null,
    };
  }

  function growRecursive(branch: Branch, depth: number, maxDepth: number) {
    if (depth >= maxDepth) return;

    const endX = branch.x + Math.cos(branch.angle) * branch.length;
    const endY = branch.y + Math.sin(branch.angle) * branch.length;
    const childLen = branch.length * 0.72;

    const left = createBranch(endX, endY, branch.angle - 0.4 - Math.random() * 0.3, childLen, depth + 1);
    branch.children.push(left);
    growRecursive(left, depth + 1, maxDepth);

    const right = createBranch(endX, endY, branch.angle + 0.4 + Math.random() * 0.3, childLen, depth + 1);
    branch.children.push(right);
    growRecursive(right, depth + 1, maxDepth);

    if (Math.random() > 0.7 && depth > 1) {
      const recurse = createBranch(endX, endY, branch.angle + (Math.random() - 0.5) * 0.6, childLen * 0.8, depth + 1);
      recurse.recurseTarget = branch.y;
      branch.children.push(recurse);
    }
  }

  function typeColor(type: string): RGB {
    switch (type) {
      case 'invoke': return PALETTE.accent;
      case 'binding': return [120, 180, 200];
      case 'when': return [180, 140, 200];
      default: return PALETTE.muted;
    }
  }

  function drawBranch(branch: Branch, parentGrowth: number) {
    const effectiveGrowth = Math.min(branch.growth, parentGrowth);
    if (effectiveGrowth < 0.01) return;

    const len = branch.length * effectiveGrowth;
    let endX = branch.x + Math.cos(branch.angle) * len;
    let endY = branch.y + Math.sin(branch.angle) * len;

    if (branch.recurseTarget !== null && effectiveGrowth > 0.7) {
      const curveFactor = (effectiveGrowth - 0.7) / 0.3;
      endY = p.lerp(endY, branch.recurseTarget, curveFactor * 0.4);
    }

    const [r, g, b] = typeColor(branch.type);
    const alphaBase = Math.max(20, 80 - branch.depth * 10);
    const sway = Math.sin(time * 0.5 + branch.x * 0.01 + branch.depth) * 2;

    p.stroke(r, g, b, alphaBase + 30);
    p.strokeWeight(Math.max(0.5, 3 - branch.depth * 0.4));
    p.noFill();

    const swayX = endX + sway;
    const swayY = endY + sway * 0.5;
    p.line(branch.x, branch.y, swayX, swayY);

    if (effectiveGrowth > 0.9) {
      const pulse = Math.sin(time * 2 + branch.depth) * 0.3 + 0.7;
      p.noStroke();
      p.fill(r, g, b, 20 * pulse);
      p.circle(swayX, swayY, 12);
      p.fill(r, g, b, 50 * pulse);
      p.circle(swayX, swayY, 5);
    }

    if (branch.recurseTarget !== null && effectiveGrowth > 0.8) {
      p.stroke(r, g, b, 30);
      p.strokeWeight(0.5);
      const steps = 8;
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const px = p.lerp(swayX, branch.x, t);
        const py = p.lerp(swayY, branch.recurseTarget, t);
        p.point(px + Math.sin(t * p.PI) * 10, py);
      }
    }

    // Use computed endpoint positions for children
    const childStartX = swayX;
    const childStartY = swayY;
    branch.children.forEach((child) => {
      child.x = childStartX;
      child.y = childStartY;
      drawBranch(child, effectiveGrowth);
    });
  }

  function growAll(branch: Branch) {
    if (branch.growth < 1) {
      branch.growth = Math.min(1, branch.growth + 0.008);
    }
    branch.children.forEach(growAll);
  }

  function applyMouseInfluence(branch: Branch) {
    if (p.mouseX <= 0 || p.mouseX >= p.width || p.mouseY <= 0 || p.mouseY >= p.height) return;
    const mouseAngle = Math.atan2(p.mouseY - branch.y, p.mouseX - branch.x);
    branch.angle = p.lerp(branch.angle, branch.angle + (mouseAngle - branch.angle) * 0.02, 0.1);
    branch.children.forEach(applyMouseInfluence);
  }

  p.draw = function () {
    p.background(...PALETTE.bg);
    time = p.frameCount * 0.02;

    branches.forEach(growAll);
    branches.forEach(applyMouseInfluence);
    branches.forEach((b) => drawBranch(b, 1));

    // Legend
    p.noStroke();
    p.textFont('JetBrains Mono, monospace');
    p.textSize(isMobile() ? 8 : 9);
    p.textAlign(p.LEFT, p.CENTER);

    const legendX = 15;
    const legendY = p.height - 50;
    const items: [string, string][] = [['INVOKE', 'invoke'], ['BINDING', 'binding'], ['WHEN', 'when']];
    items.forEach(([label, type], i) => {
      const [r, g, b] = typeColor(type);
      p.fill(r, g, b, 150);
      p.circle(legendX, legendY + i * 14, 6);
      p.fill(...PALETTE.muted, 120);
      p.text(label, legendX + 10, legendY + i * 14);
    });

    // Flash text
    if (flashAlpha > 0) {
      p.fill(...PALETTE.accent, flashAlpha);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(isMobile() ? 10 : 13);
      p.text(flashText, p.width / 2, 30);
      flashAlpha -= 3;
    }
  };

  function handleClick() {
    if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return;
    flashText = DSL_FRAGMENTS[Math.floor(Math.random() * DSL_FRAGMENTS.length)];
    flashAlpha = 220;
    buildTree();
  }

  p.mousePressed = handleClick;
  p.touchStarted = function () {
    handleClick();
    return false;
  };

  p.windowResized = function () {
    p.resizeCanvas(container.clientWidth, container.clientHeight);
    buildTree();
  };
}
