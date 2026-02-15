import type p5 from 'p5';
import { PALETTE, getTextColor } from './palette';

export default function terrainSketch(p: p5, container: HTMLElement) {
  let cols: number, rows: number;
  let terrain: number[][] = [];
  let flying = 0;
  const scl = 16;
  const isMobile = () => container.clientWidth < 768;

  p.setup = function () {
    p.createCanvas(container.clientWidth, container.clientHeight);
    p.frameRate(30);
    cols = Math.floor(p.width / scl) + 2;
    rows = Math.floor(p.height / scl) + 2;
    terrain = Array.from({ length: rows }, () => new Array(cols).fill(0));
  };

  p.draw = function () {
    p.clear();
    flying -= 0.01;

    // Generate Perlin noise terrain
    let yoff = flying;
    for (let y = 0; y < rows; y++) {
      let xoff = 0;
      for (let x = 0; x < cols; x++) {
        terrain[y][x] = p.noise(xoff, yoff);
        xoff += 0.08;
      }
      yoff += 0.08;
    }

    // Draw as isometric-style colored cells
    for (let y = 0; y < rows - 1; y++) {
      for (let x = 0; x < cols - 1; x++) {
        const elevation = terrain[y][x];
        const px = x * scl;
        const py = y * scl;

        // Apply pseudo-3D offset based on elevation
        const lift = elevation * 8;
        const drawY = py - lift;

        // Color by elevation band
        let alpha: number;
        if (elevation > 0.6) {
          alpha = 40 + elevation * 30; // peaks: brighter
        } else if (elevation > 0.4) {
          alpha = 20 + elevation * 15; // mid
        } else {
          alpha = 5 + elevation * 10; // valleys: subtle
        }

        p.noStroke();
        p.fill(255, 255, 255, alpha);
        p.rect(px, drawY, scl - 1, scl - 1);

        // Contour lines at elevation thresholds
        if (Math.abs(elevation - 0.4) < 0.02 || Math.abs(elevation - 0.6) < 0.02) {
          p.stroke(255, 255, 255, 35);
          p.strokeWeight(0.5);
          p.noFill();
          p.rect(px, drawY, scl - 1, scl - 1);
        }
      }
    }

    // Subtle grid overlay
    p.stroke(255, 255, 255, 6);
    p.strokeWeight(0.3);
    for (let x = 0; x < cols; x++) {
      p.line(x * scl, 0, x * scl, p.height);
    }
    for (let y = 0; y < rows; y++) {
      p.line(0, y * scl, p.width, y * scl);
    }
  };

  p.windowResized = function () {
    p.resizeCanvas(container.clientWidth, container.clientHeight);
    cols = Math.floor(p.width / scl) + 2;
    rows = Math.floor(p.height / scl) + 2;
    terrain = Array.from({ length: rows }, () => new Array(cols).fill(0));
  };
}
