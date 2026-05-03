import { useState } from 'react';
import useGameStore from '../store/useGameStore';
import PokemonSprite from '../components/PokemonSprite';
import './RestartScreen.css';

export default function RestartScreen() {
  const { pokemonChoice, pokemonNickname, confirmRestart, totalRestarts } = useGameStore();
  const [confirmed, setConfirmed] = useState(false);
  const nickname = pokemonNickname || pokemonChoice;

  const handleRestart = async () => {
    if (confirmed) return;
    setConfirmed(true);
    await confirmRestart();
  };

  return (
    <div className="restart-screen">
      <div className="restart-content fade-in">
        <p className="pixel restart-label" style={{ color: 'var(--red)' }}>CHALLENGE FAILED</p>

        <div className="restart-sprite">
          {pokemonChoice && (
            <PokemonSprite name={pokemonChoice} size="xl" className="restart-droop" />
          )}
          <div className="restart-bubble pixel">...</div>
        </div>

        <div className="restart-text card card--red">
          <p className="pixel" style={{ fontSize: 11, lineHeight: 2.2, textAlign: 'center' }}>
            Day 1. Again.<br />
            <span style={{ color: 'var(--gray)', fontSize: 9 }}>
              The grind never stops.
            </span>
          </p>
          {nickname && (
            <p className="pixel" style={{ fontSize: 8, color: 'var(--gray)', textAlign: 'center', marginTop: 8 }}>
              {nickname.toUpperCase()} will be waiting.
            </p>
          )}
        </div>

        <p className="pixel" style={{ fontSize: 7, color: 'var(--gray)', textAlign: 'center' }}>
          Restart #{totalRestarts + 1}
        </p>

        <button
          className={`btn btn--red btn--full pixel restart-btn${confirmed ? ' btn--disabled' : ''}`}
          onClick={handleRestart}
          disabled={confirmed}
        >
          {confirmed ? 'RESETTING...' : 'START OVER — DAY 1'}
        </button>
      </div>
    </div>
  );
}
