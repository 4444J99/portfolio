export { organColors } from '../../data/organ-colors';

export const classificationColors: Record<string, string> = {
  'SUBSTANTIAL': '#7ce8a6',
  'PARTIAL': '#c9a84c',
  'MINIMAL': '#e87c7c',
  'SKELETON': '#a0a0a0',
};

export function getChartTheme() {
  const style = getComputedStyle(document.body);
  return {
    textPrimary: style.getPropertyValue('--text-primary').trim() || '#e8e6e3',
    textSecondary: style.getPropertyValue('--text-secondary').trim() || '#a09e9b',
    textMuted: style.getPropertyValue('--text-muted').trim() || '#8a8884',
    border: style.getPropertyValue('--border').trim() || 'rgba(255,255,255,0.25)',
    accent: style.getPropertyValue('--accent').trim() || '#00BCD4',
    bgCard: style.getPropertyValue('--bg-card').trim() || 'rgba(255,255,255,0.12)',
    strokeDark: 'rgba(0,0,0,0.3)',
    labelDark: 'rgba(0,0,0,0.7)',
    fallback: '#888',
  };
}
