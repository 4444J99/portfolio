import type p5 from 'p5';

export default function spiralSketch(p: p5, container: HTMLElement) {
  let growth = 0;
  const phi = (1 + Math.sqrt(5)) / 2; // golden ratio
  const isMobile = () => container.clientWidth < 768;

  p.setup = function () {
    p.createCanvas(container.clientWidth, container.clientHeight);
    p.frameRate(30);
  };

  p.draw = function () {
    p.clear();
    const cx = p.width * 0.45;
    const cy = p.height * 0.55;
    const time = p.frameCount * 0.01;
    growth = Math.min(growth + 0.003, 1);

    const maxAngle = growth * 6 * p.TWO_PI;
    const maxR = Math.min(p.width, p.height) * 0.4;
    const steps = isMobile() ? 200 : 400;

    // Draw golden spiral
    p.noFill();
    p.stroke(255, 255, 255, 60);
    p.strokeWeight(1.5);
    p.beginShape();
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * maxAngle;
      const r = Math.pow(phi, t / p.TWO_PI) * 3;
      if (r > maxR) break;
      const x = cx + Math.cos(t + time * 0.3) * r;
      const y = cy + Math.sin(t + time * 0.3) * r;
      p.vertex(x, y);
    }
    p.endShape();

    // Draw Fibonacci nodes
    const fibNums = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
    fibNums.forEach((n, i) => {
      const angle = n * 2.4; // golden angle in radians
      const r = Math.sqrt(n) * (maxR * 0.12) * growth;
      if (r > maxR) return;
      const x = cx + Math.cos(angle + time * 0.3) * r;
      const y = cy + Math.sin(angle + time * 0.3) * r;

      const pulse = Math.sin(time * 2 + i) * 0.3 + 0.7;

      // Glow
      p.noStroke();
      p.fill(255, 255, 255, 10 * pulse);
      p.circle(x, y, 20);

      // Node
      p.fill(255, 255, 255, 80 + pulse * 60);
      p.circle(x, y, 4 + i * 0.3);

      // Connect to spiral center
      p.stroke(255, 255, 255, 15);
      p.strokeWeight(0.5);
      p.line(cx, cy, x, y);
    });

    // Center point
    p.noStroke();
    p.fill(255, 255, 255, 120);
    p.circle(cx, cy, 6);
  };

  p.windowResized = function () {
    p.resizeCanvas(container.clientWidth, container.clientHeight);
    growth = 0;
  };
}
