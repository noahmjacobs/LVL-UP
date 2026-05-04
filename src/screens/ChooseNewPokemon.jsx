import { useState } from 'react';
import useGameStore from '../store/useGameStore';
import PokemonSprite from '../components/PokemonSprite';
import { getPokemonTypeColor, getPokemonType } from '../constants/pokemonTypes';
import './StarterSelect.css';

const ALL_STARTERS = [
  { gen: 'GEN I',   starters: [
    { id: 'charmander', label: 'CHARMANDER' },
    { id: 'squirtle',   label: 'SQUIRTLE'   },
    { id: 'bulbasaur',  label: 'BULBASAUR'  },
  ]},
  { gen: 'GEN II',  starters: [
    { id: 'cyndaquil', label: 'CYNDAQUIL' },
    { id: 'totodile',  label: 'TOTODILE'  },
    { id: 'chikorita', label: 'CHIKORITA' },
  ]},
  { gen: 'GEN III', starters: [
    { id: 'torchic', label: 'TORCHIC' },
    { id: 'mudkip',  label: 'MUDKIP'  },
    { id: 'treecko', label: 'TREECKO' },
  ]},
  { gen: 'GEN IV',  starters: [
    { id: 'chimchar', label: 'CHIMCHAR' },
    { id: 'piplup',   label: 'PIPLUP'   },
    { id: 'turtwig',  label: 'TURTWIG'  },
  ]},
  { gen: 'GEN V',   starters: [
    { id: 'snivy',    label: 'SNIVY'    },
    { id: 'tepig',    label: 'TEPIG'    },
    { id: 'oshawott', label: 'OSHAWOTT' },
  ]},
  { gen: 'GEN VI',  starters: [
    { id: 'chespin',  label: 'CHESPIN'  },
    { id: 'fennekin', label: 'FENNEKIN' },
    { id: 'froakie',  label: 'FROAKIE'  },
  ]},
  { gen: 'GEN VII', starters: [
    { id: 'rowlet',  label: 'ROWLET'  },
    { id: 'litten',  label: 'LITTEN'  },
    { id: 'popplio', label: 'POPPLIO' },
  ]},
  { gen: 'GEN VIII', starters: [
    { id: 'grookey',   label: 'GROOKEY'   },
    { id: 'scorbunny', label: 'SCORBUNNY' },
    { id: 'sobble',    label: 'SOBBLE'    },
  ]},
  { gen: 'GEN IX',  starters: [
    { id: 'sprigatito', label: 'SPRIGATITO' },
    { id: 'fuecoco',    label: 'FUECOCO'    },
    { id: 'quaxly',     label: 'QUAXLY'     },
  ]},
];

export default function ChooseNewPokemon() {
  const { choosePokemon, caughtLines, goToScreen } = useGameStore();
  const [selected,  setSelected]  = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [openGen,   setOpenGen]   = useState('GEN I');

  const confirm = async () => {
    if (!selected || confirmed) return;
    setConfirmed(true);
    await choosePokemon(selected.id);
  };

  return (
    <div className="starter-screen">
      <div className="starter-header fade-in">
        <p className="pixel" style={{ fontSize: 8, color: 'var(--gray)' }}>
          Your Pokémon reached its final form!
        </p>
        <h2 className="pixel starter-title">CHOOSE NEW PARTNER</h2>
        <p className="pixel" style={{ fontSize: 7, color: 'var(--gray)', marginTop: 8, lineHeight: 2 }}>
          Your caught Pokémon stay in your Pokédex.
        </p>
      </div>

      {ALL_STARTERS.map(({ gen, starters }) => (
        <div key={gen} className="starter-gen-section">
          <button
            className="starter-gen-header pixel"
            onClick={() => setOpenGen(prev => prev === gen ? null : gen)}
          >
            <span>{gen}</span>
            <span className="starter-gen-arrow">{openGen === gen ? '▲' : '▼'}</span>
          </button>
          {openGen === gen && (
            <div className="starter-grid fade-in">
              {starters.map((s) => {
                const color = getPokemonTypeColor(s.id);
                const type  = getPokemonType(s.id).toUpperCase();
                const isCaught = caughtLines[s.id] !== undefined;
                return (
                  <div
                    key={s.id}
                    className={`starter-card${selected?.id === s.id ? ' starter-card--selected' : ''}${isCaught ? ' starter-card--current' : ''}`}
                    style={{ '--accent': color, opacity: isCaught ? 0.4 : 1 }}
                    onClick={() => !isCaught && setSelected(s)}
                  >
                    <div className="starter-sprite-wrap">
                      <PokemonSprite name={s.id} size="md" bounce={selected?.id === s.id} />
                    </div>
                    <span className="pixel starter-name" style={{ color }}>{s.label}</span>
                    {isCaught && <span className="pixel starter-type" style={{ background: '#333', fontSize: 5 }}>CAUGHT</span>}
                    {!isCaught && <span className="starter-type pixel" style={{ background: color }}>{type}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <button
        className={`btn btn--full btn--solid pixel starter-confirm${!selected || confirmed ? ' btn--disabled' : ''}`}
        onClick={confirm}
        disabled={!selected || confirmed}
        style={{ marginTop: 8 }}
      >
        {confirmed ? 'SWITCHING...' : selected ? `CHOOSE ${selected.label}!` : 'SELECT A PARTNER'}
      </button>

      <button
        className="btn btn--full pixel"
        style={{ fontSize: 7, marginTop: 8 }}
        onClick={() => goToScreen('profile')}
      >
        BACK TO PROFILE
      </button>
    </div>
  );
}
