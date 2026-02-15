import type p5 from 'p5';
import { PALETTE, getTextColor } from './palette';

interface TreeNode {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  children: TreeNode[];
  depth: number;
  growth: number;
}

export default function hierarchySketch(p: p5, container: HTMLElement) {
  let root: TreeNode;
  let allNodes: TreeNode[] = [];
  const isMobile = () => container.clientWidth < 768;

  p.setup = function () {
    p.createCanvas(container.clientWidth, container.clientHeight);
    p.frameRate(30);
    buildTree();
  };

  function buildTree() {
    const maxDepth = isMobile() ? 3 : 4;
    root = createNode(p.width / 2, 30, 0, maxDepth);
    allNodes = [];
    flattenTree(root);
    layoutTree(root, 30, p.width - 30);
  }

  function createNode(x: number, y: number, depth: number, maxDepth: number): TreeNode {
    const node: TreeNode = {
      x, y, targetX: x, targetY: y,
      children: [], depth, growth: 0,
    };
    if (depth < maxDepth) {
      const childCount = depth === 0 ? 3 : (1 + Math.floor(Math.random() * 2));
      for (let i = 0; i < childCount; i++) {
        node.children.push(createNode(x, y, depth + 1, maxDepth));
      }
    }
    return node;
  }

  function layoutTree(node: TreeNode, left: number, right: number) {
    const levelHeight = (p.height - 60) / (isMobile() ? 4 : 5);
    node.targetY = 30 + node.depth * levelHeight;
    node.targetX = (left + right) / 2;

    if (node.children.length > 0) {
      const childWidth = (right - left) / node.children.length;
      node.children.forEach((child, i) => {
        layoutTree(child, left + i * childWidth, left + (i + 1) * childWidth);
      });
    }
  }

  function flattenTree(node: TreeNode) {
    allNodes.push(node);
    node.children.forEach(flattenTree);
  }

  p.draw = function () {
    p.clear();

    // Animate growth
    allNodes.forEach((node) => {
      node.growth = Math.min(1, node.growth + 0.015);
      node.x = p.lerp(node.x, node.targetX, 0.05);
      node.y = p.lerp(node.y, node.targetY, 0.05);
    });

    // Draw edges
    function drawEdges(node: TreeNode) {
      node.children.forEach((child) => {
        const progress = Math.min(node.growth, child.growth);
        if (progress < 0.1) return;

        const midY = (node.y + child.y) / 2;
        p.noFill();
        p.stroke(255, 255, 255, 40 * progress);
        p.strokeWeight(1);
        // Right-angle connector
        p.line(node.x, node.y, node.x, midY);
        p.line(node.x, midY, child.x, midY);
        p.line(child.x, midY, child.x, child.y);

        drawEdges(child);
      });
    }
    drawEdges(root);

    // Draw nodes
    allNodes.forEach((node) => {
      if (node.growth < 0.1) return;
      const size = node.depth === 0 ? 14 : (10 - node.depth);
      const pulse = Math.sin(p.frameCount * 0.03 + node.depth * 2 + node.targetX * 0.01) * 0.2 + 0.8;

      p.noStroke();
      p.fill(255, 255, 255, 10 * pulse * node.growth);
      p.circle(node.x, node.y, size * 3);
      p.fill(255, 255, 255, (50 + node.depth * 10) * node.growth);
      p.circle(node.x, node.y, size);
    });
  };

  p.windowResized = function () {
    p.resizeCanvas(container.clientWidth, container.clientHeight);
    buildTree();
  };
}
