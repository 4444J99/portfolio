import type p5 from 'p5';
import { PALETTE, type RGB } from './palette';

interface WavePoint {
  x: number;
  y: number;
}

interface Voice {
  phase: number;
  amplitude: number;
  frequency: number;
  color: RGB;
  label: string;
}

export default function counterpointSketch(p: p5, container: HTMLElement) {
  const isMobile = () => container.clientWidth < 768;

  const defaultLabels = ['Symbolic Engine', 'Sonification Bridge', 'Performance System'];
  const voicesStr = container.dataset.voices;
  const voiceLabels = voicesStr ? voicesStr.split(',').map((s) => s.trim()) : defaultLabels;

  const voiceColors: RGB[] = [
    [201, 168, 76],
    [120, 180, 200],
    [180, 140, 200],
  ];

  const layers: Voice[] = voiceLabels.map((label, i) => ({
    phase: i * 0.5,
    amplitude: 0.15 + (i % 2) * 0.1,
    frequency: 0.03 - i * 0.005,
    color: voiceColors[i % voiceColors.length],
    label,
  }));

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

  function generateWave(voice: Voice, yCenter: number, t: number): WavePoint[] {
    const points: WavePoint[] = [];
    const steps = isMobile() ? 80 : 150;
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * p.width;
      const ts = t * timeScale();

      let yOff: number;
      const voiceIdx = layers.indexOf(voice);
      if (voiceIdx % 3 === 0) {
        // Quantized wave (stepped)
        const raw = Math.sin(x * voice.frequency + ts + voice.phase);
        yOff = Math.round(raw * 4) / 4 * voice.amplitude * p.height;
      } else if (voiceIdx % 3 === 1) {
        // Smooth sine wave
        yOff = Math.sin(x * voice.frequency + ts + voice.phase) * voice.amplitude * p.height;
      } else {
        // Complex harmonic wave
        yOff = (
          Math.sin(x * voice.frequency + ts + voice.phase) * 0.5 +
          Math.sin(x * voice.frequency * 2.3 + ts * 1.5 + voice.phase) * 0.3 +
          Math.sin(x * voice.frequency * 0.7 + ts * 0.8 + voice.phase) * 0.2
        ) * voice.amplitude * p.height;
      }

      points.push({ x, y: yCenter + yOff });
    }
    return points;
  }

  function drawWave(points: WavePoint[], color: RGB, alpha: number) {
    p.noFill();
    p.stroke(...color, alpha);
    p.strokeWeight(1.5);
    p.beginShape();
    points.forEach((pt) => p.vertex(pt.x, pt.y));
    p.endShape();

    p.fill(...color, alpha * 0.05);
    p.noStroke();
    p.beginShape();
    points.forEach((pt) => p.vertex(pt.x, pt.y));
    p.vertex(p.width, p.height);
    p.vertex(0, p.height);
    p.endShape(p.CLOSE);
  }

  p.draw = function () {
    p.clear();
    time += 0.02;

    const layerHeight = p.height / layers.length;

    // Draw main layers
    layers.forEach((voice, i) => {
      const yCenter = layerHeight * (i + 0.5);
      const points = generateWave(voice, yCenter, time);
      drawWave(points, voice.color, 150);

      p.fill(...voice.color, 60);
      p.noStroke();
      p.textFont('JetBrains Mono, monospace');
      p.textSize(isMobile() ? 8 : 9);
      p.textAlign(p.LEFT, p.TOP);
      p.text(voice.label, 10, yCenter - layerHeight * 0.4);
    });

    // Counterpoint split
    const splitInterval = 450;
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

    // Draw counterpoint voices
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
      p.stroke(...PALETTE.accent, ep.alpha);
      p.strokeWeight(1);
      p.line(ep.x, 0, ep.x, p.height);

      layers.forEach((_, i) => {
        const yCenter = layerHeight * (i + 0.5);
        p.noFill();
        p.stroke(...PALETTE.accent, ep.alpha * 0.5);
        const rippleSize = Math.min((p.frameCount - ep.time) * 2, 80);
        p.circle(ep.x, yCenter, rippleSize);
      });

      ep.alpha -= 3;
    });

    // Interference zones
    p.noStroke();
    p.fill(...PALETTE.accent, 5 + Math.sin(time * 2) * 3);
    p.rect(0, layerHeight - 10, p.width, 20);
    p.fill(...PALETTE.accent, 5 + Math.sin(time * 2 + 1) * 3);
    p.rect(0, layerHeight * 2 - 10, p.width, 20);
  };

  function handleClick() {
    if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return;
    eventPulses.push({
      x: p.mouseX,
      time: p.frameCount,
      alpha: 200,
    });
  }

  p.mousePressed = handleClick;
  (p as p5 & { touchStarted?: () => boolean | void }).touchStarted = function () {
    handleClick();
    return false;
  };

  p.windowResized = function () {
    p.resizeCanvas(container.clientWidth, container.clientHeight);
  };
}
