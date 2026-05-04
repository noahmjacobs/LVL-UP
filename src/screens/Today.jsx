import { useState, useEffect } from 'react';
import useGameStore from '../store/useGameStore';
import PokemonSprite from '../components/PokemonSprite';
import { fadeOutTitleTheme } from '../audio';
import './Today.css';

const MONTHS   = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const DAY_ABBR = ['MON','TUE','WED','THU','FRI','SAT','SUN'];

const HABITS = [
  { key: 'diet',     label: 'DIET',      color: '#FF8C00' },
  { key: 'workout1', label: 'WORKOUT 1', color: '#39FF14' },
  { key: 'workout2', label: 'WORKOUT 2', color: '#00E5FF' },
  { key: 'read',     label: 'READ',      color: '#FFD700' },
  { key: 'photo',    label: 'PHOTO',     color: '#BB44FF' },
  { key: 'water',    label: 'WATER',     color: '#4488FF' },
];

function toDateStr(d) {
  return d.toISOString().split('T')[0];
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatWeekRange(start) {
  const end = addDays(start, 6);
  const sm = MONTHS[start.getMonth()], em = MONTHS[end.getMonth()];
  return sm === em
    ? `${sm} ${start.getDate()} – ${end.getDate()}`
    : `${sm} ${start.getDate()} – ${em} ${end.getDate()}`;
}

export default function Today() {
  const {
    history, toggleHistoryTask,
    currentDay, trainerName,
    getCurrentPokemon, pokemonNickname, pokemonChoice,
  } = useGameStore();

  useEffect(() => { fadeOutTitleTheme(); }, []);

  const todayStr  = toDateStr(new Date());
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    const date = toDateStr(d);
    return { date, dayName: DAY_ABBR[i], dayNum: d.getDate(), isFuture: date > todayStr, isToday: date === todayStr };
  });

  const currentWeekStartStr = toDateStr(getWeekStart(new Date()));
  const canGoNext = toDateStr(weekStart) < currentWeekStartStr;

  const historyMap = {};
  history.forEach(h => { if (h.tasks) historyMap[h.date] = h.tasks; });

  const pokemon  = getCurrentPokemon();

  return (
    <div className="today-screen">

      <div className="today-header">
        <div>
          <p className="pixel" style={{ fontSize: 7, color: 'var(--gray)' }}>
            TRAINER {trainerName?.toUpperCase()}
          </p>
          <p className="pixel today-day-num">
            DAY <span style={{ color: 'var(--green)' }}>{currentDay}</span>
            <span className="today-day-total"> / 75</span>
          </p>
        </div>
        {pokemon && <PokemonSprite name={pokemon} size="md" glow bounce />}
      </div>

      <div className="today-week-nav">
        <button className="today-nav-btn" onClick={() => setWeekStart(w => addDays(w, -7))}>‹</button>
        <span className="pixel today-week-label">{formatWeekRange(weekStart)}</span>
        <button
          className={`today-nav-btn${!canGoNext ? ' today-nav-btn--disabled' : ''}`}
          onClick={() => canGoNext && setWeekStart(w => addDays(w, 7))}
        >›</button>
      </div>

      <div className="habit-grid">

        <div className="habit-row habit-row--header">
          <div className="habit-label-cell" />
          {weekDays.map(({ date, dayName, dayNum, isToday }) => (
            <div key={date} className={`habit-day-col${isToday ? ' habit-day-col--today' : ''}`}>
              <span className="pixel" style={{ fontSize: 6 }}>{dayName}</span>
              <span className="pixel" style={{ fontSize: 10, color: isToday ? 'var(--green)' : 'var(--white)' }}>{dayNum}</span>
            </div>
          ))}
        </div>

        {HABITS.map(({ key, label, color }) => (
          <div key={key} className="habit-row">
            <div className="habit-label-cell pixel">{label}</div>
            {weekDays.map(({ date, isFuture }) => {
              const done = !!(historyMap[date]?.[key]);
              return (
                <div
                  key={date}
                  className={`habit-cell${done ? ' habit-cell--done' : ''}${isFuture ? ' habit-cell--future' : ''}`}
                  style={done ? { background: color, boxShadow: `0 0 8px ${color}55` } : undefined}
                  onClick={isFuture ? undefined : () => toggleHistoryTask(date, key)}
                />
              );
            })}
          </div>
        ))}

      </div>
    </div>
  );
}
