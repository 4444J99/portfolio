import type p5 from 'p5';

interface Trail {
  x: number;
  y: number;
  alpha: number;
}

export default function conductorSketch(p: p5, container: HTMLElement) {
  let trails: Trail[] = [];
  let angle = 0;
  let wavePhase = 0;
  const isMobile = () => container.clientWidth < 768;

  p.setup = function () {
    p.createCanvas(container.clientWidth, container.clientHeight);
    p.frameRate(30);
  };

  p.draw = function () {
    p.clear();
    const cx = p.width / 2;
    const cy = p.height * 0.45;
    const maxRadius = Math.min(p.width, p.height) * 0.32;

    angle += 0.025;
    wavePhase += 0.04;

    // Baton tip position — sweeping figure-8
    const tipX = cx + Math.sin(angle) * maxRadius;
    const tipY = cy + Math.sin(angle * 2) * maxRadius * 0.4;

    trails.push({ x: tipX, y: tipY, alpha: 220 });
    if (trails.length > (isMobile() ? 80 : 160)) trails.shift();

    // Draw wave trails emanating from baton path
    for (let w = 0; w < 3; w++) {
      p.noFill();
      p.beginShape();
      trails.forEach((t, i) => {
        const waveOffset = Math.sin(i * 0.15 + wavePhase + w * 2) * (12 + w * 8);
        const a = t.alpha * (0.3 - w * 0.08);
        p.stroke(255, 255, 255, a);
        p.strokeWeight(1.5 - w * 0.3);
        p.vertex(t.x, t.y + waveOffset);
      });
      p.endShape();
    }

    // Draw main trail
    p.noFill();
    p.beginShape();
    trails.forEach((t) => {
      p.stroke(255, 255, 255, t.alpha);
      p.strokeWeight(2);
      p.vertex(t.x, t.y);
      t.alpha *= 0.985;
    });
    p.endShape();

    // Baton tip glow
    p.noStroke();
    p.fill(255, 255, 255, 15);
    p.circle(tipX, tipY, 40);
    p.fill(255, 255, 255, 60);
    p.circle(tipX, tipY, 12);
    p.fill(255, 255, 255, 180);
    p.circle(tipX, tipY, 4);

    // Beat markers at cardinal points
    for (let i = 0; i < 4; i++) {
      const beatAngle = (p.TWO_PI / 4) * i - p.HALF_PI;
      const bx = cx + Math.cos(beatAngle) * maxRadius * 0.85;
      const by = cy + Math.sin(beatAngle) * maxRadius * 0.45;
      const pulse = Math.sin(angle * 4 + i * p.HALF_PI) * 0.5 + 0.5;
      p.fill(255, 255, 255, 20 + pulse * 40);
      p.circle(bx, by, 6 + pulse * 4);
    }
  };

  p.windowResized = function () {
    p.resizeCanvas(container.clientWidth, container.clientHeight);
    trails = [];
  };
}
