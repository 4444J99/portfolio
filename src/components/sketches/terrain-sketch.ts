import type p5 from 'p5';
import { PALETTE, getTextColor } from './palette';

export default function terrainSketch(p: p5, container: HTMLElement) {
  let cols: number, rows: number;
  let terrain: number[][] = [];
  let flying = 0;
  const scl = 20;
  const isMobile = () => container.clientWidth < 768;

  p.setup = function () {
    p.createCanvas(container.clientWidth, container.clientHeight);
    p.frameRate(30);
    cols = Math.floor(p.width / scl) + 2;
    rows = Math.floor(p.height / scl) + 4;
    terrain = Array.from({ length: rows }, () => new Array(cols).fill(0));
  };

  p.draw = function () {
    p.clear();
    flying -= 0.02;

    let yoff = flying;
    for (let y = 0; y < rows; y++) {
      let xoff = 0;
      for (let x = 0; x < cols; x++) {
        terrain[y][x] = p.map(p.noise(xoff, yoff), 0, 1, -60, 60);
        xoff += 0.12;
      }
      yoff += 0.12;
    }

    p.push();
    p.translate(p.width / 2, p.height * 0.3);
    p.rotateX(p.PI / 3.2);
    p.translate(-p.width / 2, -p.height / 2);

    const spectrum = PALETTE.spectrum;
    for (let y = 0; y < rows - 1; y++) {
      p.beginShape(p.TRIANGLE_STRIP);
      for (let x = 0; x < cols; x++) {
        const elevation = terrain[y][x];
        const colorIdx = Math.floor(p.map(elevation, -60, 60, 0, spectrum.length - 1));
        const ci = p.constrain(colorIdx, 0, spectrum.length - 1);
        const [r, g, b] = spectrum[ci];
        p.fill(r, g, b, 50);
        p.stroke(255, 255, 255, 25);
        p.strokeWeight(0.5);
        p.vertex(x * scl, y * scl, terrain[y][x]);
        p.vertex(x * scl, (y + 1) * scl, terrain[y + 1][x]);
      }
      p.endShape();
    }
    p.pop();
  };

  p.windowResized = function () {
    p.resizeCanvas(container.clientWidth, container.clientHeight);
    cols = Math.floor(p.width / scl) + 2;
    rows = Math.floor(p.height / scl) + 4;
    terrain = Array.from({ length: rows }, () => new Array(cols).fill(0));
  };
}
