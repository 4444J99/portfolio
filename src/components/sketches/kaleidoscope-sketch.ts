import type p5 from 'p5';
import { PALETTE, getTextColor } from './palette';

export default function kaleidoscopeSketch(p: p5, container: HTMLElement) {
  const symmetry = 8;
  let shapes: { angle: number; dist: number; size: number; rotSpeed: number; sides: number }[] = [];
  const isMobile = () => container.clientWidth < 768;

  p.setup = function () {
    p.createCanvas(container.clientWidth, container.clientHeight);
    p.frameRate(30);
    const count = isMobile() ? 6 : 12;
    shapes = Array.from({ length: count }, (_, i) => ({
      angle: (Math.random() * p.TWO_PI) / symmetry,
      dist: 20 + Math.random() * Math.min(p.width, p.height) * 0.3,
      size: 8 + Math.random() * 20,
      rotSpeed: 0.005 + Math.random() * 0.01,
      sides: 3 + Math.floor(Math.random() * 4),
    }));
  };

  function polygon(cx: number, cy: number, r: number, sides: number, rot: number) {
    p.beginShape();
    for (let i = 0; i < sides; i++) {
      const a = (p.TWO_PI / sides) * i + rot;
      p.vertex(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    p.endShape(p.CLOSE);
  }

  p.draw = function () {
    p.clear();
    const cx = p.width / 2;
    const cy = p.height / 2;
    const time = p.frameCount * 0.01;

    shapes.forEach((shape) => {
      shape.angle += shape.rotSpeed;

      for (let s = 0; s < symmetry; s++) {
        const baseAngle = (p.TWO_PI / symmetry) * s + shape.angle;

        for (let mirror = 0; mirror < 2; mirror++) {
          const mirrorAngle = mirror === 0 ? baseAngle : -baseAngle + (p.TWO_PI / symmetry) * s * 2;
          const sx = cx + Math.cos(mirrorAngle) * shape.dist;
          const sy = cy + Math.sin(mirrorAngle) * shape.dist;

          const pulse = Math.sin(time * 2 + shape.dist * 0.01) * 0.3 + 0.7;

          // Fill
          p.noStroke();
          p.fill(255, 255, 255, 12 * pulse);
          polygon(sx, sy, shape.size, shape.sides, time + shape.angle);

          // Outline
          p.noFill();
          p.stroke(255, 255, 255, 40 * pulse);
          p.strokeWeight(0.8);
          polygon(sx, sy, shape.size, shape.sides, time + shape.angle);
        }
      }
    });

    // Center jewel
    const centerPulse = Math.sin(time * 3) * 0.3 + 0.7;
    p.noStroke();
    p.fill(255, 255, 255, 20 * centerPulse);
    p.circle(cx, cy, 30);
    p.fill(255, 255, 255, 80 * centerPulse);
    p.circle(cx, cy, 8);
  };

  p.windowResized = function () {
    p.resizeCanvas(container.clientWidth, container.clientHeight);
  };
}
