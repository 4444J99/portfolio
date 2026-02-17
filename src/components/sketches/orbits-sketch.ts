import type p5 from 'p5';

interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  trail: { x: number; y: number }[];
}

export default function orbitsSketch(p: p5, container: HTMLElement) {
  let bodies: Body[] = [];
  const isMobile = () => container.clientWidth < 768;

  p.setup = function () {
    p.createCanvas(container.clientWidth, container.clientHeight);
    p.frameRate(30);
    initBodies();
  };

  function initBodies() {
    const cx = p.width / 2;
    const cy = p.height / 2;
    bodies = [];

    // Central body
    bodies.push({ x: cx, y: cy, vx: 0, vy: 0, mass: 200, trail: [] });

    // Orbiting bodies
    const orbitCount = isMobile() ? 4 : 6;
    for (let i = 0; i < orbitCount; i++) {
      const r = 50 + i * (isMobile() ? 25 : 30);
      const angle = (p.TWO_PI / orbitCount) * i;
      const speed = Math.sqrt(0.5 / r) * 8;
      bodies.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        vx: -Math.sin(angle) * speed,
        vy: Math.cos(angle) * speed,
        mass: 3 + Math.random() * 5,
        trail: [],
      });
    }
  }

  p.draw = function () {
    p.clear();
    const G = 0.5;

    // Physics update
    for (let i = 1; i < bodies.length; i++) {
      const b = bodies[i];
      const center = bodies[0];
      const dx = center.x - b.x;
      const dy = center.y - b.y;
      const dist = Math.max(20, Math.sqrt(dx * dx + dy * dy));
      const force = G * center.mass / (dist * dist);

      b.vx += (dx / dist) * force;
      b.vy += (dy / dist) * force;

      // Slight mutual attraction between orbiting bodies
      for (let j = 1; j < bodies.length; j++) {
        if (j === i) continue;
        const other = bodies[j];
        const ddx = other.x - b.x;
        const ddy = other.y - b.y;
        const dd = Math.max(15, Math.sqrt(ddx * ddx + ddy * ddy));
        const f = G * other.mass * 0.1 / (dd * dd);
        b.vx += (ddx / dd) * f;
        b.vy += (ddy / dd) * f;
      }

      b.x += b.vx;
      b.y += b.vy;

      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > (isMobile() ? 40 : 80)) b.trail.shift();
    }

    // Draw trails
    bodies.slice(1).forEach((b) => {
      p.noFill();
      p.beginShape();
      b.trail.forEach((t, i) => {
        const a = (i / b.trail.length) * 40;
        p.stroke(255, 255, 255, a);
        p.strokeWeight(0.8);
        p.vertex(t.x, t.y);
      });
      p.endShape();
    });

    // Draw bodies
    const center = bodies[0];
    p.noStroke();
    p.fill(255, 255, 255, 10);
    p.circle(center.x, center.y, 50);
    p.fill(255, 255, 255, 80);
    p.circle(center.x, center.y, 14);

    bodies.slice(1).forEach((b) => {
      p.noStroke();
      p.fill(255, 255, 255, 15);
      p.circle(b.x, b.y, b.mass * 3);
      p.fill(255, 255, 255, 140);
      p.circle(b.x, b.y, b.mass);
    });
  };

  p.windowResized = function () {
    p.resizeCanvas(container.clientWidth, container.clientHeight);
    initBodies();
  };
}
