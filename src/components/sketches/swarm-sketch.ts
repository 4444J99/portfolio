import type p5 from 'p5';
import { PALETTE, getTextColor } from './palette';

interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export default function swarmSketch(p: p5, container: HTMLElement) {
  let boids: Boid[] = [];
  const isMobile = () => container.clientWidth < 768;

  p.setup = function () {
    p.createCanvas(container.clientWidth, container.clientHeight);
    p.frameRate(30);
    const count = isMobile() ? 40 : 80;
    boids = Array.from({ length: count }, () => ({
      x: Math.random() * p.width,
      y: Math.random() * p.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
    }));
  };

  function limit(vx: number, vy: number, max: number): [number, number] {
    const mag = Math.sqrt(vx * vx + vy * vy);
    if (mag > max) return [(vx / mag) * max, (vy / mag) * max];
    return [vx, vy];
  }

  p.draw = function () {
    p.clear();
    const neighborDist = isMobile() ? 50 : 70;
    const separationDist = 25;

    boids.forEach((boid) => {
      let sepX = 0, sepY = 0;
      let alignX = 0, alignY = 0;
      let cohX = 0, cohY = 0;
      let neighbors = 0;

      boids.forEach((other) => {
        if (other === boid) return;
        const d = p.dist(boid.x, boid.y, other.x, other.y);
        if (d < neighborDist) {
          alignX += other.vx;
          alignY += other.vy;
          cohX += other.x;
          cohY += other.y;
          neighbors++;
          if (d < separationDist) {
            sepX += boid.x - other.x;
            sepY += boid.y - other.y;
          }
        }
      });

      if (neighbors > 0) {
        alignX /= neighbors; alignY /= neighbors;
        cohX = cohX / neighbors - boid.x;
        cohY = cohY / neighbors - boid.y;
        boid.vx += alignX * 0.03 + cohX * 0.005 + sepX * 0.08;
        boid.vy += alignY * 0.03 + cohY * 0.005 + sepY * 0.08;
      }

      [boid.vx, boid.vy] = limit(boid.vx, boid.vy, 2.5);
      boid.x += boid.vx;
      boid.y += boid.vy;

      // Wrap edges
      if (boid.x < 0) boid.x = p.width;
      if (boid.x > p.width) boid.x = 0;
      if (boid.y < 0) boid.y = p.height;
      if (boid.y > p.height) boid.y = 0;
    });

    // Draw connections
    for (let i = 0; i < boids.length; i++) {
      for (let j = i + 1; j < boids.length; j++) {
        const d = p.dist(boids[i].x, boids[i].y, boids[j].x, boids[j].y);
        if (d < neighborDist) {
          const a = (1 - d / neighborDist) * 30;
          p.stroke(255, 255, 255, a);
          p.strokeWeight(0.5);
          p.line(boids[i].x, boids[i].y, boids[j].x, boids[j].y);
        }
      }
    }

    // Draw boids
    boids.forEach((boid) => {
      const angle = Math.atan2(boid.vy, boid.vx);
      p.push();
      p.translate(boid.x, boid.y);
      p.rotate(angle);
      p.noStroke();
      p.fill(255, 255, 255, 140);
      p.triangle(6, 0, -3, -2.5, -3, 2.5);
      p.pop();
    });
  };

  p.windowResized = function () {
    p.resizeCanvas(container.clientWidth, container.clientHeight);
  };
}
