import type p5 from 'p5';
import { PALETTE, getTextColor } from './palette';

export default function octagonSketch(p: p5, container: HTMLElement) {
  const segments = 8;
  let rotations: number[] = [];
  let pulses: number[] = [];
  const isMobile = () => container.clientWidth < 768;

  p.setup = function () {
    p.createCanvas(container.clientWidth, container.clientHeight);
    p.frameRate(30);
    rotations = Array.from({ length: segments }, (_, i) => i * 0.1);
    pulses = Array.from({ length: segments }, () => Math.random() * p.TWO_PI);
  };

  p.draw = function () {
    p.clear();
    const cx = p.width / 2;
    const cy = p.height / 2;
    const maxR = Math.min(p.width, p.height) * 0.35;
    const time = p.frameCount * 0.015;

    // Outer glow rings
    for (let ring = 3; ring >= 0; ring--) {
      const r = maxR + ring * 15;
      p.noFill();
      p.stroke(255, 255, 255, 8 - ring * 2);
      p.strokeWeight(1);
      p.beginShape();
      for (let i = 0; i <= segments; i++) {
        const a = (p.TWO_PI / segments) * i + time * 0.2;
        p.vertex(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      p.endShape(p.CLOSE);
    }

    // Eight rotating segments
    for (let i = 0; i < segments; i++) {
      const baseAngle = (p.TWO_PI / segments) * i;
      const pulse = Math.sin(time * 1.5 + pulses[i]) * 0.5 + 0.5;
      rotations[i] += 0.003 + pulse * 0.002;

      const innerR = maxR * 0.25;
      const outerR = maxR * (0.7 + pulse * 0.15);
      const sweep = p.TWO_PI / segments * 0.85;
      const segAngle = baseAngle + rotations[i];

      // Segment fill
      p.noStroke();
      p.fill(255, 255, 255, 15 + pulse * 25);
      p.beginShape();
      p.vertex(cx + Math.cos(segAngle) * innerR, cy + Math.sin(segAngle) * innerR);
      for (let s = 0; s <= 8; s++) {
        const a = segAngle + (s / 8) * sweep;
        p.vertex(cx + Math.cos(a) * outerR, cy + Math.sin(a) * outerR);
      }
      p.vertex(cx + Math.cos(segAngle + sweep) * innerR, cy + Math.sin(segAngle + sweep) * innerR);
      p.endShape(p.CLOSE);

      // Segment outline
      p.noFill();
      p.stroke(255, 255, 255, 40 + pulse * 60);
      p.strokeWeight(1);
      p.beginShape();
      p.vertex(cx + Math.cos(segAngle) * innerR, cy + Math.sin(segAngle) * innerR);
      for (let s = 0; s <= 8; s++) {
        const a = segAngle + (s / 8) * sweep;
        p.vertex(cx + Math.cos(a) * outerR, cy + Math.sin(a) * outerR);
      }
      p.vertex(cx + Math.cos(segAngle + sweep) * innerR, cy + Math.sin(segAngle + sweep) * innerR);
      p.endShape(p.CLOSE);

      // Radial line from center
      p.stroke(255, 255, 255, 20);
      p.line(cx, cy, cx + Math.cos(segAngle + sweep / 2) * outerR, cy + Math.sin(segAngle + sweep / 2) * outerR);
    }

    // Center diamond
    const diamondSize = 8 + Math.sin(time * 2) * 3;
    p.noStroke();
    p.fill(255, 255, 255, 120);
    p.quad(cx, cy - diamondSize, cx + diamondSize, cy, cx, cy + diamondSize, cx - diamondSize, cy);
  };

  p.windowResized = function () {
    p.resizeCanvas(container.clientWidth, container.clientHeight);
  };
}
