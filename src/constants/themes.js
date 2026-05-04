// Pokémon type colors — keyed by starter (base form).
// All forms in an evolution line share the same type.
export const POKEMON_TYPE_COLORS = {
  // Fire
  charmander:  '#FF6B35',
  cyndaquil:   '#FF6B35',
  torchic:     '#FF6B35',
  chimchar:    '#FF6B35',
  tepig:       '#FF6B35',
  fennekin:    '#FF6B35',
  litten:      '#FF6B35',
  scorbunny:   '#FF6B35',
  fuecoco:     '#FF6B35',
  // Water
  squirtle:    '#4488FF',
  totodile:    '#4488FF',
  mudkip:      '#4488FF',
  piplup:      '#4488FF',
  oshawott:    '#4488FF',
  froakie:     '#4488FF',
  popplio:     '#4488FF',
  sobble:      '#4488FF',
  quaxly:      '#4488FF',
  // Grass
  bulbasaur:   '#48D050',
  chikorita:   '#48D050',
  treecko:     '#48D050',
  turtwig:     '#48D050',
  snivy:       '#48D050',
  chespin:     '#48D050',
  rowlet:      '#48D050',
  grookey:     '#48D050',
  sprigatito:  '#48D050',
};

export function getPokemonTypeColor(pokemonChoice) {
  return POKEMON_TYPE_COLORS[pokemonChoice] ?? '#39FF14';
}

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
