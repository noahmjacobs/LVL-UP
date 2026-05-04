import { useState } from 'react';
import useGameStore from '../store/useGameStore';
import PokemonSprite from '../components/PokemonSprite';
import { getPokemonTypeColor } from '../constants/pokemonTypes';
import './Profile.css';

export default function Profile() {
  const {
    trainerName, pokemonChoice, pokemonNickname, setPokemonNickname,
    currentDay, currentStreak, totalCompletedDays, totalRestarts,
    longestStreak, stats, getCurrentPokemon, evolutionStage, logout,
  } = useGameStore();

  const [editing, setEditing] = useState(false);
  const [nickDraft, setNickDraft] = useState(pokemonNickname || pokemonChoice || '');
  const pokemon = getCurrentPokemon();
  const glowColor = getPokemonTypeColor(pokemon);
  const overallProgress = Math.round(
    (Object.values(stats).reduce((a, b) => a + b, 0) / (6 * 100)) * 100
  );

  const saveNick = () => {
    setPokemonNickname(nickDraft.trim() || pokemonChoice);
    setEditing(false);
  };

  return (
    <div className="profile-screen">
      {/* Trainer card */}
      <div className="profile-card card card--green">
        <div className="profile-trainer-row">
          <div>
            <p className="pixel" style={{ fontSize: 8, color: 'var(--gray)' }}>TRAINER</p>
            <h2 className="pixel profile-name">{trainerName}</h2>
          </div>
          {pokemon && <PokemonSprite name={pokemon} size="md" glow glowColor={glowColor} />}
        </div>

        <hr className="px-divider" />

        {/* Partner nickname */}
        <div className="profile-nick-row">
          <span className="pixel" style={{ fontSize: 8, color: 'var(--gray)' }}>PARTNER:</span>
          {editing ? (
            <input
              className="pixel profile-nick-input"
              value={nickDraft}
              maxLength={12}
              autoFocus
              onChange={(e) => setNickDraft(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && saveNick()}
            />
          ) : (
            <span className="pixel profile-nick">{pokemonNickname || pokemonChoice}</span>
          )}
          <button
            className="btn profile-nick-btn pixel"
            onClick={editing ? saveNick : () => setEditing(true)}
          >
            {editing ? 'SAVE' : 'RENAME'}
          </button>
        </div>

        <div className="profile-evo-tag pixel">
          EVO STAGE: {'★'.repeat(evolutionStage + 1)}{'☆'.repeat(2 - evolutionStage)}
        </div>
      </div>

      {/* Stats grid */}
      <div className="profile-stats-grid">
        {[
          { label: 'CURRENT DAY',    val: currentDay,         color: 'var(--green)' },
          { label: 'STREAK',         val: currentStreak,      color: 'var(--yellow)' },
          { label: 'DAYS COMPLETED', val: totalCompletedDays, color: 'var(--blue)' },
          { label: 'RESTARTS',       val: totalRestarts,      color: 'var(--red)' },
          { label: 'BEST STREAK',    val: longestStreak,      color: 'var(--yellow)' },
          { label: 'OVERALL',        val: `${overallProgress}%`, color: 'var(--green)' },
        ].map(({ label, val, color }) => (
          <div key={label} className="profile-stat-tile card">
            <span className="pixel profile-stat-val" style={{ color }}>{val}</span>
            <span className="pixel profile-stat-label">{label}</span>
          </div>
        ))}
      </div>

      <div className="profile-footer card">
        <p className="pixel" style={{ fontSize: 8, color: 'var(--gray)', textAlign: 'center', lineHeight: 2 }}>
          "It does not matter how slowly you go,<br />as long as you do not stop."
        </p>
      </div>

      <button className="btn btn--red btn--full pixel" style={{ fontSize: 8 }} onClick={logout}>
        SIGN OUT
      </button>
    </div>
  );
}
