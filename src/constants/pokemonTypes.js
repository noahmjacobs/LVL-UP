export const TYPE_COLORS = {
  normal:   '#A8A878',
  fire:     '#FF6B35',
  water:    '#4488FF',
  grass:    '#39FF14',
  electric: '#F8D030',
  ice:      '#98D8D8',
  fighting: '#C03028',
  poison:   '#A040A0',
  ground:   '#E0C068',
  flying:   '#90C0FF',
  psychic:  '#F85888',
  bug:      '#A8B820',
  rock:     '#B8A038',
  ghost:    '#705898',
  dragon:   '#7038F8',
  dark:     '#705848',
  steel:    '#B8B8D0',
  fairy:    '#EE99AC',
};

// Primary type for each Pokémon in the app
export const POKEMON_PRIMARY_TYPE = {
  // Charmander line
  charmander:  'fire',
  charmeleon:  'fire',
  charizard:   'fire',
  // Squirtle line
  squirtle:    'water',
  wartortle:   'water',
  blastoise:   'water',
  // Bulbasaur line (primary type is Grass)
  bulbasaur:   'grass',
  ivysaur:     'grass',
  venusaur:    'grass',
  // Cyndaquil line
  cyndaquil:   'fire',
  quilava:     'fire',
  typhlosion:  'fire',
  // Totodile line
  totodile:    'water',
  croconaw:    'water',
  feraligatr:  'water',
  // Chikorita line
  chikorita:   'grass',
  bayleef:     'grass',
  meganium:    'grass',
  // Torchic line
  torchic:     'fire',
  combusken:   'fire',
  blaziken:    'fire',
  // Mudkip line
  mudkip:      'water',
  marshtomp:   'water',
  swampert:    'water',
  // Treecko line
  treecko:     'grass',
  grovyle:     'grass',
  sceptile:    'grass',
  // Chimchar line
  chimchar:    'fire',
  monferno:    'fire',
  infernape:   'fire',
  // Piplup line
  piplup:      'water',
  prinplup:    'water',
  empoleon:    'water',
  // Turtwig line
  turtwig:     'grass',
  grotle:      'grass',
  torterra:    'grass',
  // Snivy line
  snivy:       'grass',
  servine:     'grass',
  serperior:   'grass',
  // Tepig line
  tepig:       'fire',
  pignite:     'fire',
  emboar:      'fire',
  // Oshawott line
  oshawott:    'water',
  dewott:      'water',
  samurott:    'water',
};

export function getPokemonTypeColor(pokemonName) {
  const type = POKEMON_PRIMARY_TYPE[pokemonName?.toLowerCase()];
  return TYPE_COLORS[type] ?? '#39FF14';
}

export function getPokemonType(pokemonName) {
  return POKEMON_PRIMARY_TYPE[pokemonName?.toLowerCase()] ?? 'normal';
}
