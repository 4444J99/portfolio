export type RGB = [number, number, number];

export const PALETTE = {
  // Drawing colors for transparent canvas overlay
  white: [255, 255, 255] as RGB,
  black: [0, 0, 0] as RGB,
  text: [255, 255, 255] as RGB,
  muted: [200, 200, 200] as RGB,
  border: [255, 255, 255] as RGB,
  card: [0, 0, 0] as RGB,

  // Legacy accent mappings (still used by existing sketches)
  accent: [255, 255, 255] as RGB,
  accentHover: [255, 255, 255] as RGB,
  accentYellow: [255, 255, 255] as RGB,
  purple: [200, 200, 255] as RGB,
  green: [200, 255, 200] as RGB,

  // In Colour spectrum (for new sketches that want specific hues)
  spectrum: [
    [255, 225, 0], [255, 136, 0], [255, 34, 0], [255, 0, 102],
    [204, 0, 153], [102, 0, 204], [34, 0, 170], [0, 85, 221],
    [0, 153, 255], [0, 187, 221], [0, 153, 119], [0, 153, 51], [136, 204, 0],
  ] as RGB[],
};

/** Get text color for sketch overlays */
export function getTextColor(): RGB {
  return [255, 255, 255];
}
