import { useState } from 'react';
import useGameStore from '../store/useGameStore';
import PokemonSprite from '../components/PokemonSprite';
import { getPokemonTypeColor, getPokemonType } from '../constants/pokemonTypes';
import { fadeOutTitleTheme } from '../audio';
import './StarterSelect.css';

const GEN1 = [
  { id: 'charmander', label: 'CHARMANDER', desc: 'For those who burn with ambition' },
  { id: 'squirtle',   label: 'SQUIRTLE',   desc: 'For those who move with steady discipline' },
  { id: 'bulbasaur',  label: 'BULBASAUR',  desc: 'For those who grow through consistency' },
];

const GEN2 = [
  { id: 'cyndaquil', label: 'CYNDAQUIL', desc: 'For those who ignite from within' },
  { id: 'totodile',  label: 'TOTODILE',  desc: 'For those who adapt and overcome' },
  { id: 'chikorita', label: 'CHIKORITA', desc: 'For those who bloom under pressure' },
];

const GEN3 = [
  { id: 'torchic', label: 'TORCHIC', desc: 'For those who fight with everything they have' },
  { id: 'mudkip',  label: 'MUDKIP',  desc: 'For those who push through any terrain' },
  { id: 'treecko', label: 'TREECKO', desc: 'For those who stay cool under pressure' },
];

const GEN4 = [
  { id: 'chimchar', label: 'CHIMCHAR', desc: 'For those who channel raw energy into results' },
  { id: 'piplup',   label: 'PIPLUP',   desc: 'For those who lead with pride and precision' },
  { id: 'turtwig',  label: 'TURTWIG',  desc: 'For those who are built for the long game' },
];

const GEN5 = [
  { id: 'snivy',    label: 'SNIVY',    desc: 'For those who move with quiet confidence' },
  { id: 'tepig',    label: 'TEPIG',    desc: 'For those who never stop charging forward' },
  { id: 'oshawott', label: 'OSHAWOTT', desc: 'For those who are sharper than they look' },
];


const withColors = (list) => list.map((s) => ({
  ...s,
  color: getPokemonTypeColor(s.id),
  type: getPokemonType(s.id).toUpperCase(),
}));

const GENS = [
  { label: 'GEN I',    starters: withColors(GEN1) },
  { label: 'GEN II',   starters: withColors(GEN2) },
  { label: 'GEN III',  starters: withColors(GEN3) },
  { label: 'GEN IV',   starters: withColors(GEN4) },
  { label: 'GEN V',    starters: withColors(GEN5) },
];

function GenSection({ label, starters, open, onToggle, selected, onSelect, spriteSize = 'md' }) {
  return (
    <div className="starter-gen-section">
      <button className="starter-gen-header pixel" onClick={onToggle}>
        <span>{label}</span>
        <span className="starter-gen-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="starter-grid fade-in">
          {starters.map((s) => (
            <div
              key={s.id}
              className={`starter-card${selected?.id === s.id ? ' starter-card--selected' : ''}`}
              style={{ '--accent': s.color }}
              onClick={() => onSelect(s)}
            >
              <div className="starter-sprite-wrap">
                <PokemonSprite name={s.id} size={spriteSize} bounce={selected?.id === s.id} />
              </div>
              <span className="pixel starter-name" style={{ color: s.color }}>{s.label}</span>
              <span className="starter-type pixel" style={{ background: s.color }}>{s.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StarterSelect() {
  const { setPokemonChoice, completeOnboarding, trainerName } = useGameStore();
  const [selected, setSelected]   = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [openGen, setOpenGen] = useState('GEN I');

  const toggle = (label) => setOpenGen((prev) => (prev === label ? null : label));

  const confirm = async () => {
    if (!selected || confirmed) return;
    setConfirmed(true);
    fadeOutTitleTheme();
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

      {GENS.map(({ label, starters, spriteSize: genSpriteSize }) => (
        <GenSection
          key={label}
          label={label}
          starters={starters}
          open={openGen === label}
          onToggle={() => toggle(label)}
          selected={selected}
          onSelect={setSelected}
          spriteSize={genSpriteSize}
        />
      ))}

      {selected && (
        <div className="starter-desc-box card fade-in" style={{ borderColor: selected.color }}>
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
