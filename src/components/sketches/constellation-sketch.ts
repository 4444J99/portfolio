import type p5 from 'p5';

interface Star {
  x: number;
  y: number;
  baseSize: number;
  phase: number;
  connections: number[];
}

export default function constellationSketch(p: p5, container: HTMLElement) {
  let stars: Star[] = [];
  const isMobile = () => container.clientWidth < 768;

  p.setup = function () {
    p.createCanvas(container.clientWidth, container.clientHeight);
    p.frameRate(30);
    initStars();
  };

  function initStars() {
    const count = isMobile() ? 12 : 24;
    stars = Array.from({ length: count }, (_) => ({
      x: 40 + Math.random() * (p.width - 80),
      y: 30 + Math.random() * (p.height - 60),
      baseSize: 2 + Math.random() * 3,
      phase: Math.random() * p.TWO_PI,
      connections: [],
    }));

    // Create constellation connections (nearest neighbors)
    stars.forEach((star, i) => {
      const distances = stars
        .map((other, j) => ({ j, d: p.dist(star.x, star.y, other.x, other.y) }))
        .filter((o) => o.j !== i)
        .sort((a, b) => a.d - b.d);

      const connectCount = 1 + Math.floor(Math.random() * 2);
      star.connections = distances.slice(0, connectCount).map((o) => o.j);
    });
  }

  p.draw = function () {
    p.clear();
    const time = p.frameCount * 0.02;

    // Draw connections with pulsing
    const drawnEdges = new Set<string>();
    stars.forEach((star, i) => {
      star.connections.forEach((j) => {
        const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
        if (drawnEdges.has(key)) return;
        drawnEdges.add(key);

        const other = stars[j];
        const pulse = Math.sin(time + star.phase + other.phase) * 0.3 + 0.7;

        p.stroke(255, 255, 255, 30 * pulse);
        p.strokeWeight(0.8);
        p.line(star.x, star.y, other.x, other.y);

        // Traveling pulse dot
        const t = (Math.sin(time * 0.8 + star.phase) * 0.5 + 0.5);
        const px = p.lerp(star.x, other.x, t);
        const py = p.lerp(star.y, other.y, t);
        p.noStroke();
        p.fill(255, 255, 255, 60 * pulse);
        p.circle(px, py, 2);
      });
    });

    // Draw stars
    stars.forEach((star) => {
      const pulse = Math.sin(time * 1.5 + star.phase) * 0.4 + 0.6;
      const size = star.baseSize * (1 + pulse * 0.5);

      // Glow
      p.noStroke();
      p.fill(255, 255, 255, 10 * pulse);
      p.circle(star.x, star.y, size * 6);

      // Core
      p.fill(255, 255, 255, 100 + pulse * 80);
      p.circle(star.x, star.y, size);

      // Twinkle cross
      p.stroke(255, 255, 255, 40 * pulse);
      p.strokeWeight(0.5);
      const crossSize = size * 2;
      p.line(star.x - crossSize, star.y, star.x + crossSize, star.y);
      p.line(star.x, star.y - crossSize, star.x, star.y + crossSize);
    });
  };

  p.windowResized = function () {
    p.resizeCanvas(container.clientWidth, container.clientHeight);
    initStars();
  };
}
