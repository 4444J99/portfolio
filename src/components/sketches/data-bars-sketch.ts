import type p5 from 'p5';
import { PALETTE, getTextColor } from './palette';

interface Bar {
  label: string;
  value: number;
  currentHeight: number;
}

export default function dataBarsSketch(p: p5, container: HTMLElement) {
  let bars: Bar[] = [];
  let hoveredBar = -1;
  let maxValue = 100;
  const isMobile = () => container.clientWidth < 768;

  function parseData() {
    const valuesStr = container.dataset.values;
    const labelsStr = container.dataset.labels;

    const values = valuesStr ? valuesStr.split(',').map(Number) : [85, 67, 92, 45, 78];
    const labels = labelsStr ? labelsStr.split(',').map((s) => s.trim()) : values.map((_, i) => `#${i + 1}`);

    maxValue = Math.max(...values, 1);

    bars = values.map((value, i) => ({
      label: labels[i] || `#${i + 1}`,
      value,
      currentHeight: 0,
    }));
  }

  p.setup = function () {
    p.createCanvas(container.clientWidth, container.clientHeight);
    p.frameRate(30);
    parseData();
  };

  p.draw = function () {
    p.clear();
    if (bars.length === 0) return;

    const margin = isMobile() ? 30 : 50;
    const bottomY = p.height - margin;
    const topY = margin + 10;
    const chartHeight = bottomY - topY;
    const barGap = isMobile() ? 6 : 12;
    const totalBarWidth = p.width - margin * 2 - barGap * (bars.length - 1);
    const barWidth = Math.min(totalBarWidth / bars.length, isMobile() ? 40 : 60);
    const totalW = bars.length * barWidth + (bars.length - 1) * barGap;
    const startX = (p.width - totalW) / 2;

    // Baseline
    p.stroke(...PALETTE.border, 40);
    p.strokeWeight(1);
    p.line(startX - 10, bottomY, startX + totalW + 10, bottomY);

    // Gridlines
    for (let i = 0; i <= 4; i++) {
      const y = bottomY - (chartHeight * i) / 4;
      p.stroke(...PALETTE.border, 20);
      p.strokeWeight(0.5);
      p.line(startX - 10, y, startX + totalW + 10, y);
    }

    // Detect hover
    hoveredBar = -1;
    for (let i = 0; i < bars.length; i++) {
      const bx = startX + i * (barWidth + barGap);
      if (p.mouseX > bx && p.mouseX < bx + barWidth && p.mouseY > topY && p.mouseY < bottomY) {
        hoveredBar = i;
        break;
      }
    }

    // Draw bars
    bars.forEach((bar, i) => {
      const targetHeight = (bar.value / maxValue) * chartHeight;
      // Animate in
      bar.currentHeight = p.lerp(bar.currentHeight, targetHeight, 0.08);

      const bx = startX + i * (barWidth + barGap);
      const by = bottomY - bar.currentHeight;
      const isHovered = hoveredBar === i;

      // Bar body
      const [r, g, b] = PALETTE.accent;
      const alpha = isHovered ? 200 : 120;
      p.noStroke();
      p.fill(r, g, b, alpha);
      p.rect(bx, by, barWidth, bar.currentHeight, 3, 3, 0, 0);

      // Accent border on hover
      if (isHovered) {
        p.noFill();
        p.stroke(...PALETTE.accent, 200);
        p.strokeWeight(1);
        p.rect(bx, by, barWidth, bar.currentHeight, 3, 3, 0, 0);
      }

      // Label
      p.noStroke();
      p.fill(...getTextColor(), isHovered ? 200 : 100);
      p.textFont('JetBrains Mono, monospace');
      p.textSize(isMobile() ? 7 : 9);
      p.textAlign(p.CENTER, p.TOP);
      p.text(bar.label, bx + barWidth / 2, bottomY + 6);

      // Value on hover
      if (isHovered) {
        p.fill(...PALETTE.accent, 220);
        p.textSize(isMobile() ? 9 : 11);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.text(String(bar.value), bx + barWidth / 2, by - 6);
      }
    });
  };

  p.windowResized = function () {
    p.resizeCanvas(container.clientWidth, container.clientHeight);
    parseData();
  };
}
