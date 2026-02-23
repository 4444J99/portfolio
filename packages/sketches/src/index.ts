// Palette
export { PALETTE, getTextColor } from './palette';
export type { RGB } from './palette';

// Sketch names (for programmatic access)
export const SKETCH_NAMES = [
  'atoms',
  'background',
  'blocks',
  'conductor',
  'constellation',
  'counterpoint',
  'data-bars',
  'deliberation',
  'flow-diagram',
  'hero',
  'hierarchy',
  'kaleidoscope',
  'lenses',
  'network-graph',
  'octagon',
  'orbits',
  'organ-system',
  'particle-field',
  'pipeline',
  'recursive-tree',
  'routing',
  'scatter',
  'spiral',
  'swarm',
  'terrain',
  'ticker',
  'token-stream',
  'typewriter',
  'waveform',
  'weave',
] as const;

export type SketchName = typeof SKETCH_NAMES[number];
