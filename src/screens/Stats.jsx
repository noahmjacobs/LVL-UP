import useGameStore from '../store/useGameStore';
import RadarChart from '../components/RadarChart';
import PokemonSprite from '../components/PokemonSprite';
import './Stats.css';

const STAT_INFO = [
  { key: 'discipline', label: 'DISCIPLINE', desc: 'Following your diet. No alcohol, no cheat meals.' },
  { key: 'focus',      label: 'FOCUS',      desc: 'Reading 10 non-fiction pages daily.' },
  { key: 'energy',     label: 'ENERGY',     desc: 'Both workouts completed (indoor + outdoor).' },
  { key: 'health',     label: 'HEALTH',     desc: 'Drinking a full gallon of water (128 oz).' },
  { key: 'habits',     label: 'HABITS',     desc: 'Taking your daily progress photo.' },
  { key: 'consistency',label: 'CONSISTENCY',desc: 'Completing all 6 tasks every single day.' },
];

export default function Stats() {
  const { stats, currentDay, getCurrentPokemon, pokemonNickname, pokemonChoice, evolutionStage } = useGameStore();
  const pokemon = getCurrentPokemon();
  const nickname = pokemonNickname || pokemonChoice;
  const progressPct = Math.round(((currentDay - 1) / 75) * 100);

  return (
    <div className="stats-screen">
      <div className="stats-header">
        <div>
          <p className="pixel" style={{ fontSize: 8, color: 'var(--gray)' }}>STATS OVERVIEW</p>
          <p className="day-badge" style={{ marginTop: 6 }}>DAY {currentDay - 1} / 75</p>
        </div>
        {pokemon && (
          <div className="stats-sprite-wrap">
            <PokemonSprite name={pokemon} size="md" glow bounce />
            <p className="pixel" style={{ fontSize: 7, color: 'var(--yellow)', textAlign: 'center', marginTop: 4 }}>
              {nickname?.toUpperCase()}
            </p>
          </div>
        )}
      </div>

      {/* Challenge progress bar */}
      <div className="stats-challenge-bar">
        <div className="stats-challenge-bar__fill" style={{ width: `${progressPct}%` }} />
        <span className="stats-challenge-label pixel">{progressPct}% COMPLETE</span>
      </div>

      {/* Radar chart */}
      <RadarChart stats={stats} />

      {/* Stat breakdown */}
      <div className="stats-list">
        {STAT_INFO.map(({ key, label, desc }) => {
          const val = stats[key] || 0;
          return (
            <div key={key} className="stat-row card">
              <div className="stat-row__top">
                <span className="pixel stat-row__label">{label}</span>
                <span className="pixel stat-row__val" style={{ color: 'var(--green)' }}>
                  {val.toFixed(1)}
                </span>
              </div>
              <div className="stat-bar" style={{ marginTop: 8 }}>
                <div className="stat-bar__fill" style={{ width: `${val}%` }} />
              </div>
              <p className="stat-row__desc">{desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
