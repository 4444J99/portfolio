import type p5 from 'p5';
import { PALETTE, getTextColor } from './palette';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  label: string;
  radius: number;
}

interface Edge {
  from: number;
  to: number;
}

export default function networkGraphSketch(p: p5, container: HTMLElement) {
  let nodes: Node[] = [];
  let edges: Edge[] = [];
  let hoveredNode = -1;
  const isMobile = () => container.clientWidth < 768;

  function parseData() {
    const nodeData = container.dataset.nodes;
    const edgeData = container.dataset.edges;

    const labels = nodeData ? nodeData.split(',').map((s) => s.trim()) : ['A', 'B', 'C', 'D', 'E'];

    nodes = labels.map((label, i) => {
      const angle = (i / labels.length) * p.TWO_PI - p.HALF_PI;
      const rx = p.width * 0.3;
      const ry = p.height * 0.3;
      return {
        x: p.width / 2 + Math.cos(angle) * rx,
        y: p.height / 2 + Math.sin(angle) * ry,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        label,
        radius: isMobile() ? 18 : 24,
      };
    });

    if (edgeData) {
      edges = edgeData.split(';').map((e) => {
        const [from, to] = e.split('-').map(Number);
        return { from, to };
      });
    } else {
      edges = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (Math.random() < 0.4) edges.push({ from: i, to: j });
        }
      }
      // Ensure connectivity
      for (let i = 1; i < nodes.length; i++) {
        if (!edges.some((e) => e.from === i || e.to === i)) {
          edges.push({ from: 0, to: i });
        }
      }
    }
  }

  p.setup = function () {
    p.createCanvas(container.clientWidth, container.clientHeight);
    p.frameRate(30);
    parseData();
  };

  p.draw = function () {
    p.clear();

    // Gentle drift
    nodes.forEach((node) => {
      node.x += node.vx;
      node.y += node.vy;

      // Bounce off bounds
      const margin = 40;
      if (node.x < margin || node.x > p.width - margin) node.vx *= -1;
      if (node.y < margin || node.y > p.height - margin) node.vy *= -1;

      // Damping
      node.vx *= 0.998;
      node.vy *= 0.998;

      // Slight random perturbation
      node.vx += (Math.random() - 0.5) * 0.02;
      node.vy += (Math.random() - 0.5) * 0.02;
    });

    // Detect hover
    hoveredNode = -1;
    for (let i = 0; i < nodes.length; i++) {
      if (p.dist(p.mouseX, p.mouseY, nodes[i].x, nodes[i].y) < nodes[i].radius + 8) {
        hoveredNode = i;
        break;
      }
    }

    // Draw edges
    edges.forEach((edge) => {
      const a = nodes[edge.from];
      const b = nodes[edge.to];
      if (!a || !b) return;
      const isHighlighted = hoveredNode === edge.from || hoveredNode === edge.to;
      p.stroke(...PALETTE.border, isHighlighted ? 140 : 50);
      p.strokeWeight(isHighlighted ? 1.5 : 0.8);
      p.line(a.x, a.y, b.x, b.y);

      // Animated particle along edge
      const t = (p.frameCount * 0.008 + edge.from * 0.3) % 1;
      const px = p.lerp(a.x, b.x, t);
      const py = p.lerp(a.y, b.y, t);
      p.noStroke();
      p.fill(...PALETTE.accent, isHighlighted ? 120 : 40);
      p.circle(px, py, 3);
    });

    // Draw nodes
    nodes.forEach((node, i) => {
      const isHovered = hoveredNode === i;
      const r = node.radius + (isHovered ? 4 : 0);

      // Glow
      if (isHovered) {
        p.noStroke();
        p.fill(...PALETTE.accent, 20);
        p.circle(node.x, node.y, r * 3);
      }

      // Node circle
      p.fill(...PALETTE.card);
      p.stroke(...(isHovered ? PALETTE.accent : PALETTE.border), isHovered ? 200 : 80);
      p.strokeWeight(isHovered ? 1.5 : 1);
      p.circle(node.x, node.y, r * 2);

      // Label
      p.noStroke();
      p.fill(...getTextColor(), isHovered ? 240 : 160);
      p.textFont('JetBrains Mono, monospace');
      p.textSize(isMobile() ? 8 : 10);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(node.label, node.x, node.y);
    });
  };

  p.windowResized = function () {
    p.resizeCanvas(container.clientWidth, container.clientHeight);
    parseData();
  };
}
