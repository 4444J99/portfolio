import type p5 from 'p5';
import { PALETTE, getTextColor } from './palette';

interface OpinionVector {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  angle: number;
  speed: number;
  length: number;
  alpha: number;
}

export default function deliberationSketch(p: p5, container: HTMLElement) {
  let vectors: OpinionVector[] = [];
  let consensusX: number, consensusY: number;
  let consensusPulse = 0;
  const isMobile = () => container.clientWidth < 768;

  p.setup = function () {
    p.createCanvas(container.clientWidth, container.clientHeight);
    p.frameRate(30);
    consensusX = p.width / 2;
    consensusY = p.height / 2;
    initVectors();
  };

  function initVectors() {
    const count = isMobile() ? 20 : 40;
    vectors = Array.from({ length: count }, () => {
      const edge = Math.floor(Math.random() * 4);
      let x: number, y: number;
      if (edge === 0) { x = Math.random() * p.width; y = -10; }
      else if (edge === 1) { x = p.width + 10; y = Math.random() * p.height; }
      else if (edge === 2) { x = Math.random() * p.width; y = p.height + 10; }
      else { x = -10; y = Math.random() * p.height; }
      return {
        x, y,
        targetX: consensusX + (Math.random() - 0.5) * 60,
        targetY: consensusY + (Math.random() - 0.5) * 60,
        angle: 0,
        speed: 0.3 + Math.random() * 0.5,
        length: isMobile() ? 15 : 25,
        alpha: 80 + Math.random() * 120,
      };
    });
  }

  p.draw = function () {
    p.clear();
    consensusPulse += 0.03;

    // Update consensus point (drifts slightly)
    consensusX = p.width / 2 + Math.sin(consensusPulse * 0.5) * 20;
    consensusY = p.height / 2 + Math.cos(consensusPulse * 0.7) * 15;

    vectors.forEach((v) => {
      const dx = v.targetX - v.x;
      const dy = v.targetY - v.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      v.angle = Math.atan2(dy, dx);

      if (dist > 3) {
        v.x += Math.cos(v.angle) * v.speed;
        v.y += Math.sin(v.angle) * v.speed;
      } else {
        // Arrived near consensus — respawn from edge
        const edge = Math.floor(Math.random() * 4);
        if (edge === 0) { v.x = Math.random() * p.width; v.y = -10; }
        else if (edge === 1) { v.x = p.width + 10; v.y = Math.random() * p.height; }
        else if (edge === 2) { v.x = Math.random() * p.width; v.y = p.height + 10; }
        else { v.x = -10; v.y = Math.random() * p.height; }
        v.targetX = consensusX + (Math.random() - 0.5) * 60;
        v.targetY = consensusY + (Math.random() - 0.5) * 60;
        v.speed = 0.3 + Math.random() * 0.5;
      }

      // Draw arrow
      const endX = v.x + Math.cos(v.angle) * v.length;
      const endY = v.y + Math.sin(v.angle) * v.length;
      p.stroke(255, 255, 255, v.alpha);
      p.strokeWeight(1.5);
      p.line(v.x, v.y, endX, endY);

      // Arrowhead
      const headLen = 5;
      p.fill(255, 255, 255, v.alpha);
      p.noStroke();
      p.triangle(
        endX, endY,
        endX - Math.cos(v.angle - 0.4) * headLen,
        endY - Math.sin(v.angle - 0.4) * headLen,
        endX - Math.cos(v.angle + 0.4) * headLen,
        endY - Math.sin(v.angle + 0.4) * headLen,
      );
    });

    // Consensus glow
    const pulse = Math.sin(consensusPulse * 2) * 0.3 + 0.7;
    p.noStroke();
    p.fill(255, 255, 255, 10 * pulse);
    p.circle(consensusX, consensusY, 80);
    p.fill(255, 255, 255, 25 * pulse);
    p.circle(consensusX, consensusY, 30);
    p.fill(255, 255, 255, 80 * pulse);
    p.circle(consensusX, consensusY, 8);
  };

  p.windowResized = function () {
    p.resizeCanvas(container.clientWidth, container.clientHeight);
    consensusX = p.width / 2;
    consensusY = p.height / 2;
    initVectors();
  };
}
