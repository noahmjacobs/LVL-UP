export const THEMES = [
  { id: 'green',  label: 'NEON',   accent: '#39FF14', dim: '#1d6b00' },
  { id: 'blue',   label: 'BLUE',   accent: '#4488FF', dim: '#1a3566' },
  { id: 'cyan',   label: 'CYAN',   accent: '#00E5FF', dim: '#005566' },
  { id: 'pink',   label: 'PINK',   accent: '#FF3399', dim: '#660038' },
  { id: 'orange', label: 'ORANGE', accent: '#FF8C00', dim: '#663800' },
  { id: 'yellow', label: 'GOLD',   accent: '#FFD700', dim: '#665700' },
  { id: 'purple', label: 'PURPLE', accent: '#BB44FF', dim: '#4a0066' },
  { id: 'white',  label: 'WHITE',  accent: '#F0F0F0', dim: '#555555' },
  { id: 'gray',   label: 'GRAY',   accent: '#888888', dim: '#333333' },
];

export const DEFAULT_THEME = 'green';

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function applyTheme(id) {
  const { accent, dim } = getTheme(id);
  document.documentElement.style.setProperty('--green', accent);
  document.documentElement.style.setProperty('--green-dim', dim);
}
