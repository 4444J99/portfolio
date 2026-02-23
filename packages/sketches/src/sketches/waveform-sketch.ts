import type p5 from 'p5';

export default function waveformSketch(p: p5, container: HTMLElement) {
  const waveCount = 5;
  let phases: number[] = [];
  const isMobile = () => container.clientWidth < 768;

  p.setup = function () {
    p.createCanvas(container.clientWidth, container.clientHeight);
    p.frameRate(30);
    phases = Array.from({ length: waveCount }, (_, i) => i * 0.7);
  };

  p.draw = function () {
    p.clear();
    const time = p.frameCount * 0.02;
    const steps = isMobile() ? 100 : 200;

    for (let w = 0; w < waveCount; w++) {
      const freq = 0.8 + w * 0.6;
      const amp = p.height * (0.08 + w * 0.03);
      const yCenter = p.height * (0.25 + w * 0.12);
      const alpha = 200 - w * 30;

      p.noFill();
      p.stroke(124, 232, 232, alpha); // Organ VI Cyan
      p.strokeWeight(1.5 - w * 0.15);
      p.beginShape();

      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * p.width;
        const t = x / p.width * p.TWO_PI * freq;
        const y = yCenter + Math.sin(t + time + phases[w]) * amp
          + Math.sin(t * 2.3 + time * 1.4 + phases[w]) * amp * 0.3
          + Math.sin(t * 0.5 + time * 0.7) * amp * 0.2;
        p.vertex(x, y);
      }
      p.endShape();

      // Fill under wave with subtle gradient
      p.fill(124, 232, 232, 10 + w * 3);
      p.noStroke();
      p.beginShape();
      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * p.width;
        const t = x / p.width * p.TWO_PI * freq;
        const y = yCenter + Math.sin(t + time + phases[w]) * amp
          + Math.sin(t * 2.3 + time * 1.4 + phases[w]) * amp * 0.3
          + Math.sin(t * 0.5 + time * 0.7) * amp * 0.2;
        p.vertex(x, y);
      }
      p.vertex(p.width, p.height);
      p.vertex(0, p.height);
      p.endShape(p.CLOSE);

      phases[w] += 0.008 + w * 0.003;
    }

    // Center line
    p.stroke(255, 255, 255, 15);
    p.strokeWeight(0.5);
    p.line(0, p.height / 2, p.width, p.height / 2);
  };

  p.windowResized = function () {
    p.resizeCanvas(container.clientWidth, container.clientHeight);
  };
}
