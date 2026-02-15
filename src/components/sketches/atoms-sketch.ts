import type p5 from 'p5';
import { PALETTE, getTextColor } from './palette';

interface Atom {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  splitTimer: number;
}

export default function atomsSketch(p: p5, container: HTMLElement) {
  let atoms: Atom[] = [];
  const isMobile = () => container.clientWidth < 768;
  const maxAtoms = isMobile() ? 50 : 100;

  p.setup = function () {
    p.createCanvas(container.clientWidth, container.clientHeight);
    p.frameRate(30);
    // Start with a few large atoms
    for (let i = 0; i < (isMobile() ? 4 : 8); i++) {
      atoms.push({
        x: p.width * 0.2 + Math.random() * p.width * 0.6,
        y: p.height * 0.2 + Math.random() * p.height * 0.6,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: 12 + Math.random() * 10,
        alpha: 180,
        splitTimer: 60 + Math.random() * 120,
      });
    }
  };

  p.draw = function () {
    p.clear();

    const toAdd: Atom[] = [];

    atoms.forEach((atom) => {
      atom.x += atom.vx;
      atom.y += atom.vy;

      // Bounce off walls
      if (atom.x < 0 || atom.x > p.width) atom.vx *= -1;
      if (atom.y < 0 || atom.y > p.height) atom.vy *= -1;
      atom.x = p.constrain(atom.x, 0, p.width);
      atom.y = p.constrain(atom.y, 0, p.height);

      // Split timer
      atom.splitTimer--;
      if (atom.splitTimer <= 0 && atom.size > 4 && atoms.length + toAdd.length < maxAtoms) {
        // Split into two smaller atoms
        const newSize = atom.size * 0.65;
        const angle = Math.random() * p.TWO_PI;
        const speed = 1 + Math.random();
        toAdd.push({
          x: atom.x + Math.cos(angle) * 5,
          y: atom.y + Math.sin(angle) * 5,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: newSize,
          alpha: 180,
          splitTimer: 80 + Math.random() * 160,
        });
        atom.size = newSize;
        atom.vx = -Math.cos(angle) * speed;
        atom.vy = -Math.sin(angle) * speed;
        atom.splitTimer = 80 + Math.random() * 160;
      }

      // Recombine: check proximity to other small atoms
      if (atom.size < 6) {
        atoms.forEach((other) => {
          if (other === atom || other.size >= 12) return;
          const d = p.dist(atom.x, atom.y, other.x, other.y);
          if (d < atom.size + other.size && Math.random() < 0.02) {
            atom.size = Math.min(22, atom.size + other.size * 0.5);
            other.alpha = 0; // mark for removal
          }
        });
      }

      // Fade tiny atoms slowly
      if (atom.size < 3) atom.alpha -= 0.5;

      // Draw
      p.noStroke();
      p.fill(255, 255, 255, atom.alpha * 0.1);
      p.circle(atom.x, atom.y, atom.size * 3);
      p.fill(255, 255, 255, atom.alpha * 0.5);
      p.circle(atom.x, atom.y, atom.size);
      p.fill(255, 255, 255, atom.alpha);
      p.circle(atom.x, atom.y, atom.size * 0.4);
    });

    atoms.push(...toAdd);
    atoms = atoms.filter((a) => a.alpha > 1);

    // Draw connection lines between close atoms
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const d = p.dist(atoms[i].x, atoms[i].y, atoms[j].x, atoms[j].y);
        if (d < 60) {
          const a = (1 - d / 60) * 20;
          p.stroke(255, 255, 255, a);
          p.strokeWeight(0.5);
          p.line(atoms[i].x, atoms[i].y, atoms[j].x, atoms[j].y);
        }
      }
    }
  };

  p.windowResized = function () {
    p.resizeCanvas(container.clientWidth, container.clientHeight);
  };
}
