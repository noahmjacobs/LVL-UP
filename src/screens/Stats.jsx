import useGameStore, { EVOLUTION_LINES } from '../store/useGameStore';
import RadarChart from '../components/RadarChart';
import PokemonSprite from '../components/PokemonSprite';
import { getPokemonTypeColor } from '../constants/themes';
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
  const { stats, getCurrentPokemon, pokemonNickname, pokemonChoice, partnerLine, caughtLines } = useGameStore();
  const pokemon = getCurrentPokemon();

  // Always use the displayed Pokémon's choice key for color and nickname
  const displayChoice = partnerLine || pokemonChoice;
  const typeColor = getPokemonTypeColor(displayChoice);

  // When a partner is displayed, show their form name; otherwise show the custom nickname
  const nickname = partnerLine !== null && caughtLines[partnerLine] !== undefined
    ? EVOLUTION_LINES[partnerLine]?.[caughtLines[partnerLine]] || partnerLine
    : (pokemonNickname || pokemonChoice);

  return (
    <div className="stats-screen">
      {pokemon && (
        <div className="stats-sprite-wrap">
          <PokemonSprite name={pokemon} size="lg" bounce />
          <p className="pixel" style={{ fontSize: 7, color: 'var(--yellow)', textAlign: 'center', marginTop: 6 }}>
            {nickname?.toUpperCase()}
          </p>
        </div>
      )}

      {/* Radar chart — colored by Pokémon type */}
      <RadarChart stats={stats} typeColor={typeColor} />

      {/* Stat breakdown */}
      <div className="stats-list">
        {STAT_INFO.map(({ key, label, desc }) => {
          const val = stats[key] || 0;
          return (
            <div key={key} className="stat-row card">
              <div className="stat-row__top">
                <span className="pixel stat-row__label">{label}</span>
                <span className="pixel stat-row__val" style={{ color: typeColor }}>
                  {Math.round(val)}<span style={{ fontSize: 7, color: 'var(--gray)' }}>/252</span>
                </span>
              </div>
              <div className="stat-bar" style={{ marginTop: 8 }}>
                <div className="stat-bar__fill" style={{ width: `${(val / 252) * 100}%`, background: typeColor }} />
              </div>
              <p className="stat-row__desc">{desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
