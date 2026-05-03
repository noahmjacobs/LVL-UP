import { useState, useEffect } from 'react';
import useGameStore from '../store/useGameStore';
import PokemonSprite from './PokemonSprite';
import './EvolutionCutscene.css';

export default function EvolutionCutscene() {
  const { evolutionTarget, pokemonChoice, evolutionStage, pokemonNickname, dismissEvolution } = useGameStore();
  const [phase, setPhase] = useState('flash'); // flash | reveal

  const prevStage  = evolutionStage - 1;
  const prevPokemon = useGameStore.getState().getEvolutionLines()[pokemonChoice]?.[prevStage];
  const nickname   = pokemonNickname || pokemonChoice;

  useEffect(() => {
    const t = setTimeout(() => setPhase('reveal'), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="evo-overlay">
      <div className="evo-content fade-in">
        <p className="pixel evo-text">
          {phase === 'flash' ? `What?!` : `${nickname.toUpperCase()} evolved!`}
        </p>

        <div className="evo-sprites">
          {phase === 'flash' ? (
            <PokemonSprite name={prevPokemon} size="xl" className="evo-flash" />
          ) : (
            <PokemonSprite name={evolutionTarget} size="xl" glow bounce />
          )}
        </div>

        {phase === 'reveal' && (
          <>
            <p className="pixel evo-name" style={{ color: 'var(--yellow)' }}>
              ★ {evolutionTarget?.toUpperCase()} ★
            </p>
            <button className="btn btn--solid evo-btn pixel" onClick={dismissEvolution}>
              AWESOME!
            </button>
          </>
        )}
      </div>
    </div>
  );
}
