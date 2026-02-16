/**
 * Canonical organ color palette.
 * Keys use hyphenated format (ORGAN-I, ORGAN-II, etc.) matching chart-theme.ts.
 */
export const organColors: Record<string, string> = {
  'ORGAN-I': '#7c9bf5',
  'ORGAN-II': '#e87c7c',
  'ORGAN-III': '#7ce8a6',
  'ORGAN-IV': '#c9a84c',
  'ORGAN-V': '#c97ce8',
  'ORGAN-VI': '#7ce8e8',
  'ORGAN-VII': '#e8c87c',
  'META-ORGANVM': '#a0a0a0',
};

/**
 * Space-separated keys (ORGAN I, ORGAN II, etc.) used by index.astro
 * where project data uses space format.
 */
export const organColorMap: Record<string, string> = {
  'ORGAN I': '#7c9bf5',
  'ORGAN II': '#e87c7c',
  'ORGAN III': '#7ce8a6',
  'ORGAN IV': '#c9a84c',
  'ORGAN V': '#c97ce8',
  'ORGAN VI': '#7ce8e8',
  'ORGAN VII': '#e8c87c',
  'Meta': '#a0a0a0',
};
