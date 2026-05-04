import { useState } from 'react';
import './PokemonSprite.css';

const SPARKLE_COUNT = 8;

export default function PokemonSprite({ name, size = 'md', glow = false, bounce = false, glowColor, className = '', png = false }) {
  const [isPng, setIsPng] = useState(false);
  if (!name) return null;

  // Shiny wrapper + sparkles only when glow is requested and sprite is shiny
  const isShiny = glow && name.startsWith('shiny');

  // png prop forces static image (used for Pokédex thumbnails)
  const src = png ? `/sprites/${name}.png` : `/sprites/${name}.gif`;

  const handleError = (e) => {
    if (!e.target.src.endsWith('.png')) {
      e.target.src = `/sprites/${name}.png`;
      setIsPng(true);
    }
  };

  if (isShiny) {
    return (
      <div
        className={[
          'shiny-wrapper',
          `poke-sprite--${size}`,
          bounce ? 'poke-bounce' : '',
          className,
        ].filter(Boolean).join(' ')}
      >
        <img
          src={src}
          alt={name}
          className={['poke-sprite', 'poke-sprite--fill', 'sprite-glow-shiny', isPng ? 'poke-sprite--png' : ''].filter(Boolean).join(' ')}
          draggable={false}
          onError={handleError}
        />
        {Array.from({ length: SPARKLE_COUNT }, (_, i) => (
          <span key={i} className={`shiny-sparkle shiny-sparkle--${i + 1}`} aria-hidden="true">✦</span>
        ))}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={[
        'poke-sprite',
        `poke-sprite--${size}`,
        isPng  ? 'poke-sprite--png' : '',
        glow   ? 'sprite-glow'      : '',
        bounce ? 'poke-bounce'      : '',
        className,
      ].filter(Boolean).join(' ')}
      style={glowColor ? { '--glow-color': glowColor } : undefined}
      draggable={false}
      onError={handleError}
    />
  );
}
