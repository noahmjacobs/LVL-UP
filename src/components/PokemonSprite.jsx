import './PokemonSprite.css';

export default function PokemonSprite({ name, size = 'md', glow = false, bounce = false, className = '' }) {
  if (!name) return null;
  const src = `/sprites/${name}.gif`;
  const classes = [
    'poke-sprite',
    `poke-sprite--${size}`,
    glow   ? 'sprite-glow'   : '',
    bounce ? 'poke-bounce'   : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <img
      src={src}
      alt={name}
      className={classes}
      draggable={false}
    />
  );
}
