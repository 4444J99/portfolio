import type p5 from 'p5';
import { PALETTE, getTextColor } from './palette';

export default function weaveSketch(p: p5, container: HTMLElement) {
  const isMobile = () => container.clientWidth < 768;
  let phase = 0;

  p.setup = function () {
    p.createCanvas(container.clientWidth, container.clientHeight);
    p.frameRate(30);
  };

  p.draw = function () {
    p.clear();
    phase += 0.008;

    const spacing = isMobile() ? 18 : 24;
    const threads = Math.ceil(p.width / spacing) + 2;
    const weftCount = Math.ceil(p.height / spacing) + 2;

    // Warp threads (vertical)
    for (let i = 0; i < threads; i++) {
      const x = i * spacing;
      const wave = Math.sin(phase + i * 0.3) * 4;

      p.stroke(255, 255, 255, 30);
      p.strokeWeight(1);
      p.noFill();
      p.beginShape();
      for (let y = 0; y < p.height; y += 4) {
        const weaveOffset = Math.sin(y * 0.15 + i * p.PI) * 3;
        p.vertex(x + wave + weaveOffset, y);
      }
      p.endShape();
    }

    // Weft threads (horizontal)
    for (let j = 0; j < weftCount; j++) {
      const y = j * spacing;
      const wave = Math.sin(phase * 0.7 + j * 0.4) * 4;

      p.stroke(255, 255, 255, 25);
      p.strokeWeight(1);
      p.noFill();
      p.beginShape();
      for (let x = 0; x < p.width; x += 4) {
        const weaveOffset = Math.sin(x * 0.15 + j * p.PI) * 3;
        p.vertex(x, y + wave + weaveOffset);
      }
      p.endShape();
    }

    // Highlight intersection nodes
    for (let i = 0; i < threads; i += 3) {
      for (let j = 0; j < weftCount; j += 3) {
        const x = i * spacing + Math.sin(phase + i * 0.3) * 4;
        const y = j * spacing + Math.sin(phase * 0.7 + j * 0.4) * 4;
        const pulse = Math.sin(phase * 2 + i + j) * 0.3 + 0.7;

        p.noStroke();
        p.fill(255, 255, 255, 30 * pulse);
        p.circle(x, y, 4);
      }
    }
  };

  p.windowResized = function () {
    p.resizeCanvas(container.clientWidth, container.clientHeight);
  };
}
