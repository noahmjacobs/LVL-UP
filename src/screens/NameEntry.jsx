import { useState } from 'react';
import useGameStore from '../store/useGameStore';
import './NameEntry.css';

export default function NameEntry() {
  const { setTrainerName, goToScreen } = useGameStore();
  const [name, setName] = useState('');

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setTrainerName(trimmed);
    goToScreen('starterSelect');
  };

  return (
    <div className="name-screen">
      <div className="name-content fade-in">
        <p className="pixel name-prompt">What is your name,</p>
        <p className="pixel name-prompt" style={{ color: 'var(--white)' }}>Trainer?</p>

        <input
          className="pixel name-input"
          type="text"
          maxLength={16}
          placeholder="ENTER NAME..."
          value={name}
          onChange={(e) => setName(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          autoFocus
          autoComplete="off"
          autoCapitalize="characters"
        />

        <p className="name-hint" style={{ fontSize: 11, color: 'var(--gray)' }}>
          This name will identify your save.
        </p>

        <button
          className={`btn btn--full pixel${!name.trim() ? ' btn--disabled' : ''}`}
          onClick={submit}
          disabled={!name.trim()}
        >
          CONFIRM →
        </button>
      </div>
    </div>
  );
}
