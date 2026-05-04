import { useState } from 'react';
import './PokemonSprite.css';

export default function PokemonSprite({ name, size = 'md', glow = false, bounce = false, glowColor, className = '' }) {
  const [isPng, setIsPng] = useState(false);
  if (!name) return null;

  const classes = [
    'poke-sprite',
    `poke-sprite--${size}`,
    isPng  ? 'poke-sprite--png' : '',
    glow   ? 'sprite-glow'      : '',
    bounce ? 'poke-bounce'      : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <img
      src={`/sprites/${name}.gif`}
      alt={name}
      className={classes}
      style={glowColor ? { '--glow-color': glowColor } : undefined}
      draggable={false}
      onError={(e) => {
        if (!e.target.src.endsWith('.png')) {
          e.target.src = `/sprites/${name}.png`;
          setIsPng(true);
        }
      }}
    />
  );
}
