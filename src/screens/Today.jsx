import { useState, useEffect } from 'react';
import useGameStore from '../store/useGameStore';
import TaskCard from '../components/TaskCard';
import WaterTracker from '../components/WaterTracker';
import PokemonSprite from '../components/PokemonSprite';
import { fadeOutTitleTheme } from '../audio';
import './Today.css';

const TASKS = [
  { key: 'diet',     title: 'DIET',          subtitle: 'No alcohol, no cheat meals' },
  { key: 'workout1', title: 'WORKOUT 1',      subtitle: '45 min — any location' },
  { key: 'workout2', title: 'WORKOUT 2',      subtitle: '45 min — outdoors' },
  { key: 'read',     title: 'READ 10 PAGES',  subtitle: 'Non-fiction only, no audiobooks' },
  { key: 'photo',    title: 'PROGRESS PHOTO', subtitle: 'Daily check-in snapshot' },
];

export default function Today() {
  const {
    currentDay, trainerName, todayTasks, isLockedIn,
    toggleTask, lockInDay, getCurrentPokemon,
    stats, pokemonNickname, pokemonChoice,
  } = useGameStore();

  useEffect(() => { fadeOutTitleTheme(); }, []);

  const [locking, setLocking] = useState(false);
  const currentPokemon = getCurrentPokemon();
  const completedCount = Object.values(todayTasks).filter(Boolean).length;
  const allDone = completedCount === 6;

  const handleLockIn = async () => {
    if (locking || isLockedIn) return;
    setLocking(true);
    await lockInDay();
    setLocking(false);
  };

  const progressPct = (completedCount / 6) * 100;

  return (
    <div className="today-screen">
      {/* Header */}
      <div className="today-header">
        <div>
          <p className="pixel" style={{ fontSize: 8, color: 'var(--gray)' }}>TRAINER {trainerName}</p>
          <h1 className="pixel today-day">DAY {currentDay} <span style={{ color: 'var(--gray)', fontSize: 14 }}>/ 75</span></h1>
        </div>
        <div className="today-sprite-wrap">
          {currentPokemon && (
            <PokemonSprite name={currentPokemon} size="sm" bounce glow />
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="today-progress">
        <div className="today-progress__bar">
          <div className="today-progress__fill" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="pixel" style={{ fontSize: 8, color: 'var(--gray)' }}>
          {completedCount}/6 TASKS
        </span>
      </div>

      {/* Locked banner */}
      {isLockedIn && (
        <div className="today-locked-banner card card--green fade-in">
          <span className="pixel" style={{ fontSize: 9 }}>✅ DAY {currentDay - 1} COMPLETE! Come back tomorrow.</span>
        </div>
      )}

      {/* Task list */}
      <div className="today-tasks">
        {TASKS.map((t) => (
          <TaskCard
            key={t.key}
            icon={t.icon}
            title={t.title}
            subtitle={t.subtitle}
            checked={todayTasks[t.key]}
            onToggle={() => toggleTask(t.key)}
            locked={isLockedIn}
          />
        ))}
        <WaterTracker />
      </div>

      {/* Lock In button */}
      {!isLockedIn && (
        <div className="today-footer">
          {!allDone && (
            <p className="today-warning pixel">
              ⚠ Missing tasks = Day 1 restart
            </p>
          )}
          <button
            className={`btn btn--full pixel today-lockin${allDone ? ' btn--solid' : ' btn--red'}`}
            onClick={handleLockIn}
            disabled={locking}
          >
            {locking ? 'LOCKING IN...' : allDone ? '🔒 LOCK IN DAY' : '⚠ LOCK IN (INCOMPLETE)'}
          </button>
        </div>
      )}
    </div>
  );
}
