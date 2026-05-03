import { useState } from 'react';
import useGameStore from '../store/useGameStore';
import PokemonSprite from '../components/PokemonSprite';
import './StarterSelect.css';

const STARTERS = [
  {
    id: 'charmander',
    label: 'CHARMANDER',
    color: '#FF6B35',
    desc: 'For those who burn with ambition',
    type: 'FIRE',
  },
  {
    id: 'squirtle',
    label: 'SQUIRTLE',
    color: '#4488FF',
    desc: 'For those who move with steady discipline',
    type: 'WATER',
  },
  {
    id: 'bulbasaur',
    label: 'BULBASAUR',
    color: '#39FF14',
    desc: 'For those who grow through consistency',
    type: 'GRASS',
  },
];

export default function StarterSelect() {
  const { setPokemonChoice, completeOnboarding, trainerName } = useGameStore();
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const confirm = async () => {
    if (!selected || confirmed) return;
    setConfirmed(true);
    setPokemonChoice(selected.id);
    await completeOnboarding();
  };

  return (
    <div className="starter-screen">
      <div className="starter-header fade-in">
        <p className="pixel" style={{ fontSize: 8, color: 'var(--gray)' }}>
          {trainerName}, choose your partner.
        </p>
        <h2 className="pixel starter-title">CHOOSE YOUR STARTER</h2>
      </div>

      <div className="starter-grid fade-in">
        {STARTERS.map((s) => (
          <div
            key={s.id}
            className={`starter-card${selected?.id === s.id ? ' starter-card--selected' : ''}`}
            style={{ '--accent': s.color }}
            onClick={() => setSelected(s)}
          >
            <PokemonSprite name={s.id} size="md" bounce={selected?.id === s.id} />
            <span className="pixel starter-name" style={{ color: s.color }}>{s.label}</span>
            <span className="starter-type pixel" style={{ background: s.color }}>{s.type}</span>
          </div>
        ))}
      </div>

      {selected && (
        <div className="starter-desc-box card card--green fade-in">
          <p className="pixel" style={{ fontSize: 9, lineHeight: 2 }}>
            ★ {selected.desc}
          </p>
        </div>
      )}

      <button
        className={`btn btn--full btn--solid pixel starter-confirm${!selected || confirmed ? ' btn--disabled' : ''}`}
        onClick={confirm}
        disabled={!selected || confirmed}
      >
        {confirmed ? 'STARTING...' : `I CHOOSE ${selected ? selected.label : '...'}!`}
      </button>
    </div>
  );
}
