export const PALETTE = {
  bg: [10, 10, 11] as const,
  accent: [201, 168, 76] as const,
  accentHover: [218, 184, 92] as const,
  text: [232, 230, 227] as const,
  muted: [107, 105, 102] as const,
  border: [42, 42, 48] as const,
  card: [22, 22, 26] as const,
};

export type SketchFactory = (p: any, container: HTMLElement) => void;
