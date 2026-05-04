import { useState, useEffect } from 'react';
import useGameStore, { EVOLUTION_LINES } from '../store/useGameStore';
import PokemonSprite from '../components/PokemonSprite';
import { getPokemonTypeColor } from '../constants/pokemonTypes';
import { THEMES } from '../constants/themes';
import './Profile.css';

export default function Profile() {
  const {
    trainerName, pokemonChoice, pokemonNickname, pokemonNicknames, setPokemonNickname,
    currentDay, currentStreak, getCurrentPokemon, evolutionStage, logout,
    themeColor, setThemeColor,
    caughtLines, partnerLine, setPartnerLine,
    shinyLines, toggleShowShiny,
    canChooseNewPokemon, goToScreen,
  } = useGameStore();

  // Derived display values — computed before hooks so they're available in deps/callbacks
  const displayChoice = partnerLine || pokemonChoice;
  const displayStage  = partnerLine !== null && caughtLines[partnerLine] !== undefined
    ? caughtLines[partnerLine]
    : evolutionStage;
  const glowColor = getPokemonTypeColor(displayChoice);

  // Nickname: use per-line stored nickname; fall back to form name, then choice key
  const displayNickname = (() => {
    const stored = pokemonNicknames[displayChoice];
    if (stored) return stored;
    const stage = displayChoice === pokemonChoice ? displayStage : caughtLines[displayChoice] ?? 0;
    return EVOLUTION_LINES[displayChoice]?.[stage] || displayChoice;
  })();

  const [editing, setEditing] = useState(false);
  const [nickDraft, setNickDraft] = useState('');
  const [showThemePicker, setShowThemePicker] = useState(false);

  // Reset draft whenever the displayed line changes
  useEffect(() => {
    setNickDraft(displayNickname || '');
    setEditing(false);
  }, [displayChoice]);

  const pokemon = getCurrentPokemon();
  const saveNick = () => {
    setPokemonNickname(nickDraft.trim() || displayChoice, displayChoice);
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
            <span className="pixel profile-nick">{displayNickname}</span>
          )}
          <button
            className="btn profile-nick-btn pixel"
            onClick={editing ? saveNick : () => { setNickDraft(displayNickname || ''); setEditing(true); }}
          >
            {editing ? 'SAVE' : 'RENAME'}
          </button>
        </div>

        <div className="profile-evo-tag pixel">
          EVO STAGE: {'★'.repeat(displayStage + 1)}{'☆'.repeat(2 - displayStage)}
        </div>
      </div>

      {/* Stats grid */}
      <div className="profile-stats-grid">
        {[
          { label: 'CURRENT DAY',  val: currentDay,    color: 'var(--green)'  },
          { label: 'STREAK',       val: currentStreak, color: 'var(--yellow)' },
        ].map(({ label, val, color }) => (
          <div key={label} className="profile-stat-tile card">
            <span className="pixel profile-stat-val" style={{ color }}>{val}</span>
            <span className="pixel profile-stat-label">{label}</span>
          </div>
        ))}
      </div>

      {/* Pokédex — one card per evolution LINE at its current stage */}
      {Object.keys(caughtLines).length > 0 && (
        <div className="pokedex-section card">
          <p className="pixel" style={{ fontSize: 8, color: 'var(--gray)', marginBottom: 12 }}>POKÉDEX</p>
          <div className="pokedex-grid">
            {Object.entries(caughtLines).map(([choice, stage]) => {
              const name = EVOLUTION_LINES[choice]?.[stage];
              if (!name) return null;
              const isCurrentLine = choice === pokemonChoice;
              const isDisplayed   = (partnerLine === choice) || (!partnerLine && isCurrentLine);
              // Shiny star appears on any caught final-form that has shiny unlocked
              const lineShiny     = shinyLines[choice];
              const canShine      = !!lineShiny?.unlocked && stage === 2;
              const spriteName    = (canShine && lineShiny?.show) ? `shiny${name}` : name;

              return (
                <div
                  key={choice}
                  className={`pokedex-entry${isDisplayed ? ' pokedex-entry--active' : ''}`}
                  onClick={() => {
                    if (isCurrentLine) {
                      // Clicking active line: clear any partner so active is shown
                      if (partnerLine !== null) setPartnerLine(null);
                    } else {
                      setPartnerLine(partnerLine === choice ? null : choice);
                    }
                  }}
                >
                  {canShine && (
                    <button
                      className={`pokedex-shiny-star${lineShiny?.show ? ' pokedex-shiny-star--on' : ''}`}
                      title={lineShiny?.show ? 'Shiny ON' : 'Toggle shiny'}
                      onClick={(e) => { e.stopPropagation(); toggleShowShiny(choice); }}
                    >
                      {lineShiny?.show ? '★' : '☆'}
                    </button>
                  )}
                  <PokemonSprite name={spriteName} size="xs" png />
                  <span className="pixel pokedex-name">{name.toUpperCase()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {canChooseNewPokemon && (
        <button
          className="btn btn--full pixel choose-new-btn"
          style={{ fontSize: 7 }}
          onClick={() => goToScreen('chooseNewPokemon')}
        >
          ✦ CHOOSE NEW PARTNER
        </button>
      )}

      <div className="profile-footer card">
        <p className="pixel" style={{ fontSize: 8, color: 'var(--gray)', textAlign: 'center', lineHeight: 2 }}>
          "It does not matter how slowly you go,<br />as long as you do not stop."
        </p>
      </div>

      <button
        className="btn btn--full pixel profile-theme-btn"
        style={{ fontSize: 8 }}
        onClick={() => setShowThemePicker(true)}
      >
        <span
          className="profile-theme-dot"
          style={{ background: THEMES.find((t) => t.id === themeColor)?.accent }}
        />
        ACCENT COLOR
      </button>

      {showThemePicker && (
        <div className="theme-overlay" onClick={() => setShowThemePicker(false)}>
          <div className="theme-popup card" onClick={(e) => e.stopPropagation()}>
            <p className="pixel" style={{ fontSize: 8, color: 'var(--gray)', marginBottom: 14 }}>CHOOSE ACCENT</p>
            <div className="theme-popup-grid">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  className={`profile-theme-swatch${themeColor === t.id ? ' profile-theme-swatch--active' : ''}`}
                  style={{ background: t.accent }}
                  onClick={() => { setThemeColor(t.id); setShowThemePicker(false); }}
                >
                  <span className="pixel theme-swatch-label">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <button className="btn btn--red btn--full pixel" style={{ fontSize: 8 }} onClick={logout}>
        SIGN OUT
      </button>
    </div>
  );
}
