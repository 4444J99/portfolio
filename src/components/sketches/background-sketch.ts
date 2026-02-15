import type p5 from 'p5';
import { PALETTE } from './palette';

const COLS = 36;
const ROWS = 24;
const NOISE_SCALE = 0.12;
const TIME_SCALE = 0.003;
const COLOR_SPEED = 0.0035; // full spectrum cycle ≈ 2.5 min at 24fps
const SPREAD = 3.0; // noise maps to ±1.5 spectrum stops

export default function backgroundSketch(p: p5, container: HTMLElement) {
  const spectrum = PALETTE.spectrum;
  const len = spectrum.length;
  let baseT = 0;

  p.setup = () => {
    const canvas = p.createCanvas(COLS, ROWS);
    canvas.style('width', '100%');
    canvas.style('height', '100%');
    p.pixelDensity(1);
    p.noSmooth();
    p.frameRate(24);
  };

  p.draw = () => {
    baseT += COLOR_SPEED;
    p.loadPixels();

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const n = p.noise(x * NOISE_SCALE, y * NOISE_SCALE, p.frameCount * TIME_SCALE);
        const offset = (n - 0.5) * SPREAD;
        let t = (baseT + offset) % len;
        if (t < 0) t += len;

        const idx0 = Math.floor(t) % len;
        const idx1 = (idx0 + 1) % len;
        const frac = t - Math.floor(t);

        const c0 = spectrum[idx0];
        const c1 = spectrum[idx1];

        const r = c0[0] + (c1[0] - c0[0]) * frac;
        const g = c0[1] + (c1[1] - c0[1]) * frac;
        const b = c0[2] + (c1[2] - c0[2]) * frac;

        // Dim to 65–85% to keep colors rich, never white
        const dim = 0.65 + n * 0.2;

        const px = (y * COLS + x) * 4;
        p.pixels[px] = r * dim;
        p.pixels[px + 1] = g * dim;
        p.pixels[px + 2] = b * dim;
        p.pixels[px + 3] = 255;
      }
    }

    p.updatePixels();
  };
}
