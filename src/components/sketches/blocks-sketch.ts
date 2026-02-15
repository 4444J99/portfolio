import type p5 from 'p5';
import { PALETTE, getTextColor } from './palette';

interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
  vy: number;
  settled: boolean;
  alpha: number;
}

export default function blocksSketch(p: p5, container: HTMLElement) {
  let blocks: Block[] = [];
  let spawnTimer = 0;
  const isMobile = () => container.clientWidth < 768;

  p.setup = function () {
    p.createCanvas(container.clientWidth, container.clientHeight);
    p.frameRate(30);
  };

  function spawnBlock() {
    const w = 20 + Math.random() * 40;
    const h = 15 + Math.random() * 25;
    blocks.push({
      x: Math.random() * (p.width - w),
      y: -h,
      w, h,
      vy: 1 + Math.random() * 1.5,
      settled: false,
      alpha: 160 + Math.random() * 60,
    });
  }

  p.draw = function () {
    p.clear();

    spawnTimer++;
    if (spawnTimer > (isMobile() ? 25 : 15)) {
      spawnTimer = 0;
      spawnBlock();
    }

    // Remove blocks that are too old (below visible)
    blocks = blocks.filter((b) => b.y < p.height + 10);
    if (blocks.length > (isMobile() ? 40 : 80)) blocks = blocks.slice(-80);

    blocks.forEach((block) => {
      if (!block.settled) {
        block.vy += 0.08; // gravity
        block.y += block.vy;

        // Check collision with floor
        if (block.y + block.h >= p.height) {
          block.y = p.height - block.h;
          block.vy = 0;
          block.settled = true;
        }

        // Check collision with other settled blocks
        for (const other of blocks) {
          if (other === block || !other.settled) continue;
          if (
            block.x < other.x + other.w &&
            block.x + block.w > other.x &&
            block.y + block.h > other.y &&
            block.y < other.y
          ) {
            block.y = other.y - block.h;
            block.vy = 0;
            block.settled = true;
            break;
          }
        }
      }

      // Fade settled blocks over time
      if (block.settled) {
        block.alpha = Math.max(0, block.alpha - 0.15);
      }

      // Draw
      p.noStroke();
      p.fill(255, 255, 255, block.alpha * 0.15);
      p.rect(block.x, block.y, block.w, block.h, 2);

      p.noFill();
      p.stroke(255, 255, 255, block.alpha * 0.6);
      p.strokeWeight(1);
      p.rect(block.x, block.y, block.w, block.h, 2);
    });

    // Clean up fully faded blocks
    blocks = blocks.filter((b) => b.alpha > 1);
  };

  p.windowResized = function () {
    p.resizeCanvas(container.clientWidth, container.clientHeight);
    blocks = [];
  };
}
