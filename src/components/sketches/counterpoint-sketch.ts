import type p5 from 'p5';
import { PALETTE } from './palette';

interface WavePoint {
  x: number;
  y: number;
}

interface Voice {
  phase: number;
  amplitude: number;
  frequency: number;
  color: [number, number, number];
  label: string;
}

export default function counterpointSketch(p: p5, container: HTMLElement) {
  const isMobile = () => container.clientWidth < 768;

  // Three layers
  const layers: Voice[] = [
    { phase: 0, amplitude: 0.2, frequency: 0.03, color: [201, 168, 76], label: 'Symbolic Engine' },
    { phase: 0.5, amplitude: 0.15, frequency: 0.02, color: [120, 180, 200], label: 'Sonification Bridge' },
    { phase: 1.0, amplitude: 0.25, frequency: 0.015, color: [180, 140, 200], label: 'Performance System' },
  ];

  let counterpointVoices: Voice[] = [];
  let lastSplitTime = 0;
  let eventPulses: { x: number; time: number; alpha: number }[] = [];
  let time = 0;

  p.setup = function () {
    p.createCanvas(container.clientWidth, container.clientHeight);
    p.frameRate(30);
  };

  function timeScale(): number {
    if (p.mouseX <= 0 || p.mouseX >= p.width) return 1;
    return 0.3 + (p.mouseX / p.width) * 1.7;
  }

  function recursiveDepth(): number {
    if (p.mouseY <= 0 || p.mouseY >= p.height) return 0;
    return Math.floor((1 - p.mouseY / p.height) * 3);
  }

  function generateWave(voice: Voice, yCenter: number, time: number): WavePoint[] {
    const points: WavePoint[] = [];
    const steps = isMobile() ? 80 : 150;
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * p.width;
      const t = time * timeScale();

      // Angular/stepped for symbolic, smooth for bridge, complex for performance
      let yOff: number;
      if (voice.label === 'Symbolic Engine') {
        // Angular stepped waveform
        const raw = Math.sin(x * voice.frequency + t + voice.phase);
        yOff = Math.round(raw * 4) / 4 * voice.amplitude * p.height;
      } else if (voice.label === 'Sonification Bridge') {
        // Smooth sine
        yOff = Math.sin(x * voice.frequency + t + voice.phase) * voice.amplitude * p.height;
      } else {
        // Complex: multiple harmonics
        yOff = (
          Math.sin(x * voice.frequency + t + voice.phase) * 0.5 +
          Math.sin(x * voice.frequency * 2.3 + t * 1.5 + voice.phase) * 0.3 +
          Math.sin(x * voice.frequency * 0.7 + t * 0.8 + voice.phase) * 0.2
        ) * voice.amplitude * p.height;
      }

      points.push({ x, y: yCenter + yOff });
    }
    return points;
  }

  function drawWave(points: WavePoint[], color: [number, number, number], alpha: number) {
    p.noFill();
    p.stroke(...color, alpha);
    p.strokeWeight(1.5);
    p.beginShape();
    points.forEach((pt) => p.vertex(pt.x, pt.y));
    p.endShape();

    // Subtle fill below
    p.fill(...color, alpha * 0.05);
    p.noStroke();
    p.beginShape();
    points.forEach((pt) => p.vertex(pt.x, pt.y));
    p.vertex(p.width, p.height);
    p.vertex(0, p.height);
    p.endShape(p.CLOSE);
  }

  p.draw = function () {
    p.background(...PALETTE.bg);
    time += 0.02;

    const layerHeight = p.height / 3;

    // Draw three main layers
    layers.forEach((voice, i) => {
      const yCenter = layerHeight * (i + 0.5);
      const points = generateWave(voice, yCenter, time);
      drawWave(points, voice.color, 150);

      // Layer label
      p.fill(...voice.color, 60);
      p.noStroke();
      p.textFont('JetBrains Mono, monospace');
      p.textSize(isMobile() ? 8 : 9);
      p.textAlign(p.LEFT, p.TOP);
      p.text(voice.label, 10, yCenter - layerHeight * 0.4);
    });

    // Counterpoint split on the bottom layer (~every 15s worth of frames)
    const splitInterval = 450; // ~15s at 30fps
    if (p.frameCount - lastSplitTime > splitInterval) {
      lastSplitTime = p.frameCount;
      const depth = Math.max(1, recursiveDepth() + 1);
      counterpointVoices = [];
      for (let v = 0; v < depth; v++) {
        counterpointVoices.push({
          phase: layers[2].phase + (v + 1) * 1.2,
          amplitude: layers[2].amplitude * (0.6 - v * 0.15),
          frequency: layers[2].frequency * (1 + (v + 1) * 0.3),
          color: [180 + v * 20, 140 - v * 20, 200],
          label: `Voice ${v + 1}`,
        });
      }
    }

    // Draw counterpoint voices (fade over time since split)
    const splitAge = (p.frameCount - lastSplitTime) / splitInterval;
    if (counterpointVoices.length > 0) {
      const fadeStart = 0.6;
      const alpha = splitAge > fadeStart
        ? Math.max(0, 1 - (splitAge - fadeStart) / (1 - fadeStart)) * 100
        : 100;

      const bottomCenter = layerHeight * 2.5;
      counterpointVoices.forEach((voice, vi) => {
        const offset = (vi - counterpointVoices.length / 2) * 15;
        const points = generateWave(voice, bottomCenter + offset, time);
        drawWave(points, voice.color, alpha);
      });
    }

    // Draw event pulses
    eventPulses = eventPulses.filter((ep) => ep.alpha > 0);
    eventPulses.forEach((ep) => {
      // Vertical pulse line propagating through all layers
      p.stroke(...PALETTE.accent, ep.alpha);
      p.strokeWeight(1);
      p.line(ep.x, 0, ep.x, p.height);

      // Ripple circles at each layer intersection
      layers.forEach((_, i) => {
        const yCenter = layerHeight * (i + 0.5);
        p.noFill();
        p.stroke(...PALETTE.accent, ep.alpha * 0.5);
        p.circle(ep.x, yCenter, (p.frameCount - ep.time) * 2);
      });

      ep.alpha -= 3;
    });

    // Interference zones: where waves overlap, draw subtle highlight
    const interferenceY = layerHeight;
    p.noStroke();
    p.fill(...PALETTE.accent, 5 + Math.sin(time * 2) * 3);
    p.rect(0, interferenceY - 10, p.width, 20);
    p.fill(...PALETTE.accent, 5 + Math.sin(time * 2 + 1) * 3);
    p.rect(0, interferenceY * 2 - 10, p.width, 20);
  };

  p.mousePressed = function () {
    if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return;

    eventPulses.push({
      x: p.mouseX,
      time: p.frameCount,
      alpha: 200,
    });
  };

  p.windowResized = function () {
    p.resizeCanvas(container.clientWidth, container.clientHeight);
  };
}
