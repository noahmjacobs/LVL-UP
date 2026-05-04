import { useEffect, useRef } from 'react';
import useGameStore from '../store/useGameStore';
import PokemonSprite from '../components/PokemonSprite';
import { fadeOutTitleTheme } from '../audio';
import './Today.css';

const MONTHS   = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const DAY_ABBR = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

const HABITS = [
  { key: 'diet',     label: 'DIET',      color: '#FF8C00' },
  { key: 'workout1', label: 'WORKOUT 1', color: '#39FF14' },
  { key: 'workout2', label: 'WORKOUT 2', color: '#00E5FF' },
  { key: 'read',     label: 'READ',      color: '#FFD700' },
  { key: 'photo',    label: 'PHOTO',     color: '#BB44FF' },
  { key: 'water',    label: 'WATER',     color: '#4488FF' },
];

const DAYS_BACK = 89;

function toDateStr(d) {
  return d.toISOString().split('T')[0];
}

function buildDays() {
  const today = new Date();
  const todayStr = toDateStr(today);
  return Array.from({ length: DAYS_BACK + 1 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (DAYS_BACK - i));
    const date = toDateStr(d);
    return {
      date,
      dayName: DAY_ABBR[d.getDay()],
      dayNum: d.getDate(),
      month: MONTHS[d.getMonth()],
      isToday: date === todayStr,
      showMonth: d.getDate() === 1 || i === 0,
    };
  });
}

const DAYS = buildDays();

export default function Today() {
  const {
    history, toggleHistoryTask,
    currentDay, trainerName, getCurrentPokemon,
  } = useGameStore();

  useEffect(() => { fadeOutTitleTheme(); }, []);

  const scrollRef  = useRef(null);
  const dragging   = useRef(false);
  const dragStartX = useRef(0);
  const dragOrigin = useRef(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  const onMouseDown = (e) => {
    dragging.current   = true;
    dragStartX.current = e.clientX;
    dragOrigin.current = scrollRef.current.scrollLeft;
  };
  const onMouseMove = (e) => {
    if (!dragging.current) return;
    e.preventDefault();
    scrollRef.current.scrollLeft = dragOrigin.current - (e.clientX - dragStartX.current);
  };
  const stopDrag = () => { dragging.current = false; };

  const historyMap = {};
  history.forEach(h => { if (h.tasks) historyMap[h.date] = h.tasks; });

  const pokemon = getCurrentPokemon();

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

      <div
        className="tracker-scroll"
        ref={scrollRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
      >
        <div className="tracker-inner">

          {/* Day header row */}
          <div className="tracker-row tracker-header-row">
            <div className="tracker-sticky-col" />
            {DAYS.map(({ date, dayName, dayNum, month, isToday, showMonth }) => (
              <div key={date} className={`tracker-day-hdr${isToday ? ' tracker-day-hdr--today' : ''}`}>
                {showMonth && <span className="pixel tracker-month">{month}</span>}
                <span className="pixel tracker-day-name">{dayName}</span>
                <span className="pixel tracker-day-num-lbl">{dayNum}</span>
              </div>
            ))}
          </div>

          {/* Habit rows */}
          {HABITS.map(({ key, label, color }) => (
            <div key={key} className="tracker-row">
              <div className="tracker-sticky-col tracker-label pixel">{label}</div>
              {DAYS.map(({ date }) => {
                const done = !!(historyMap[date]?.[key]);
                return (
                  <div
                    key={date}
                    className={`tracker-cell${done ? ' tracker-cell--done' : ''}`}
                    style={done ? { background: color, boxShadow: `0 0 6px ${color}44` } : undefined}
                    onClick={() => toggleHistoryTask(date, key)}
                  />
                );
              })}
            </div>
          ))}

        </div>
      </div>

    </div>
  );
}
