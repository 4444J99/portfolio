import type p5 from 'p5';
import { PALETTE, getTextColor } from './palette';

interface HubNode {
  x: number;
  y: number;
  label: string;
  connections: number[];
}

interface Message {
  from: number;
  to: number;
  progress: number;
  speed: number;
}

export default function routingSketch(p: p5, container: HTMLElement) {
  let hubs: HubNode[] = [];
  let messages: Message[] = [];
  let spawnTimer = 0;
  const isMobile = () => container.clientWidth < 768;

  p.setup = function () {
    p.createCanvas(container.clientWidth, container.clientHeight);
    p.frameRate(30);
    initHubs();
  };

  function initHubs() {
    const cx = p.width / 2;
    const cy = p.height / 2;
    const r = Math.min(p.width, p.height) * 0.3;
    const labels = ['HUB', 'A', 'B', 'C', 'D', 'E'];
    const count = isMobile() ? 5 : 6;

    hubs = [{ x: cx, y: cy, label: 'HUB', connections: [] }];
    for (let i = 1; i < count; i++) {
      const angle = (p.TWO_PI / (count - 1)) * (i - 1) - p.HALF_PI;
      hubs.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        label: labels[i] || String.fromCharCode(64 + i),
        connections: [0], // all connect to hub
      });
      hubs[0].connections.push(i);
    }
  }

  p.draw = function () {
    p.clear();

    // Spawn messages
    spawnTimer++;
    if (spawnTimer > (isMobile() ? 20 : 12)) {
      spawnTimer = 0;
      const from = 1 + Math.floor(Math.random() * (hubs.length - 1));
      let to = 1 + Math.floor(Math.random() * (hubs.length - 1));
      if (to === from) to = 0; // route through hub
      messages.push({
        from,
        to: 0, // first leg: to hub
        progress: 0,
        speed: 0.02 + Math.random() * 0.02,
      });
    }

    // Draw paths
    hubs[0].connections.forEach((ci) => {
      const hub = hubs[0];
      const node = hubs[ci];
      p.stroke(255, 255, 255, 20);
      p.strokeWeight(1);
      p.line(hub.x, hub.y, node.x, node.y);

      // Dashed effect
      const steps = 10;
      for (let s = 0; s < steps; s += 2) {
        const t1 = s / steps;
        const t2 = (s + 1) / steps;
        p.stroke(255, 255, 255, 30);
        p.line(
          p.lerp(hub.x, node.x, t1), p.lerp(hub.y, node.y, t1),
          p.lerp(hub.x, node.x, t2), p.lerp(hub.y, node.y, t2),
        );
      }
    });

    // Update and draw messages
    messages.forEach((msg) => {
      msg.progress += msg.speed;

      const from = hubs[msg.from];
      const to = hubs[msg.to];
      const x = p.lerp(from.x, to.x, msg.progress);
      const y = p.lerp(from.y, to.y, msg.progress);

      p.noStroke();
      p.fill(255, 255, 255, 180);
      p.circle(x, y, 5);
      p.fill(255, 255, 255, 40);
      p.circle(x, y, 12);
    });

    // Route messages through hub
    messages = messages.filter((msg) => {
      if (msg.progress >= 1) {
        if (msg.to === 0) {
          // Arrived at hub — pick a destination
          const dest = 1 + Math.floor(Math.random() * (hubs.length - 1));
          msg.from = 0;
          msg.to = dest;
          msg.progress = 0;
          return true;
        }
        return false; // arrived at destination
      }
      return true;
    });

    if (messages.length > (isMobile() ? 20 : 40)) {
      messages = messages.slice(-40);
    }

    // Draw hub nodes
    hubs.forEach((hub, i) => {
      const isCenter = i === 0;
      const size = isCenter ? (isMobile() ? 18 : 24) : (isMobile() ? 10 : 14);
      const pulse = Math.sin(p.frameCount * 0.04 + i) * 0.2 + 0.8;

      p.noStroke();
      p.fill(255, 255, 255, 10 * pulse);
      p.circle(hub.x, hub.y, size * 3);
      p.fill(255, 255, 255, isCenter ? 80 : 50);
      p.circle(hub.x, hub.y, size);
      p.fill(255, 255, 255, isCenter ? 180 : 120);
      p.circle(hub.x, hub.y, size * 0.4);

      // Label
      const textRGB = getTextColor();
      p.fill(...textRGB, 80);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(isMobile() ? 7 : 9);
      p.textFont('JetBrains Mono, monospace');
      p.text(hub.label, hub.x, hub.y + size + 8);
    });
  };

  p.windowResized = function () {
    p.resizeCanvas(container.clientWidth, container.clientHeight);
    initHubs();
    messages = [];
  };
}
