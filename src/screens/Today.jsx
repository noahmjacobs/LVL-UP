import { useEffect, useMemo, useRef, useState } from 'react';
import useGameStore from '../store/useGameStore';
import PokemonSprite from '../components/PokemonSprite';
import { getPokemonTypeColor } from '../constants/pokemonTypes';
import { fadeOutTitleTheme } from '../audio';
import './Today.css';

const MONTHS   = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const DAY_ABBR = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

const HABITS = [
  { key: 'diet',     label: 'DIET',               defaultColor: '#FF8C00' },
  { key: 'workout1', label: 'WORKOUT 1',           defaultColor: '#39FF14' },
  { key: 'workout2', label: ['OUTDOOR', 'WORKOUT'], defaultColor: '#00E5FF' },
  { key: 'read',     label: 'READ',                defaultColor: '#FFD700' },
  { key: 'photo',    label: 'PHOTO',               defaultColor: '#BB44FF' },
  { key: 'water',    label: 'WATER',               defaultColor: '#4488FF' },
];

const COLOR_SWATCHES = [
  '#FF4444', '#FF8C00', '#FFD700',
  '#39FF14', '#00E5FF', '#4488FF',
  '#BB44FF', '#FF69B4', '#FFFFFF',
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
    currentDay, trainerName, getCurrentPokemon, pokemonChoice, partnerLine,
    habitColors, setHabitColor,
  } = useGameStore();

  useEffect(() => { fadeOutTitleTheme(); }, []);

  const scrollRef  = useRef(null);
  const dragging   = useRef(false);
  const dragStartX = useRef(0);
  const dragOrigin = useRef(0);

  const [editMode, setEditMode]       = useState(false);
  const [editingHabit, setEditingHabit] = useState(null); // habit key or null

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

  const historyMap = useMemo(() => {
    const map = {};
    history.forEach(h => { if (h.tasks) map[h.date] = h.tasks; });
    return map;
  }, [history]);

  const pokemon = getCurrentPokemon();
  // Use the displayed Pokémon's type color, not the active line's
  const displayChoice = partnerLine || pokemonChoice;
  const typeColor = getPokemonTypeColor(displayChoice);

  const handleLabelClick = (key) => {
    if (!editMode) return;
    setEditingHabit(key);
  };

  const handleColorPick = (color) => {
    if (editingHabit) {
      setHabitColor(editingHabit, color);
    }
    setEditingHabit(null);
  };

  const toggleEditMode = () => {
    setEditMode(prev => !prev);
    setEditingHabit(null);
  };

  // Resolve color: from store if set, otherwise from HABITS defaults
  const getHabitColor = (key) => {
    const habit = HABITS.find(h => h.key === key);
    return (habitColors && habitColors[key]) || habit?.defaultColor || '#39FF14';
  };

  const editingHabitDef = HABITS.find(h => h.key === editingHabit);

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
        {pokemon && <PokemonSprite name={pokemon} size="md" glow bounce glowColor={typeColor} />}
      </div>

      <div className="tracker-wrapper">

        {/* Fixed label column — lives outside the scroll container */}
        <div className="tracker-labels-col">
          {/* Corner: edit button lives here */}
          <div className="tracker-corner">
            <button
              className={`edit-btn${editMode ? ' edit-btn--active' : ''}`}
              onClick={toggleEditMode}
              title={editMode ? 'Done' : 'Edit colors'}
            >
              {editMode ? '✕' : '✏'}
            </button>
          </div>

          {HABITS.map(({ key, label }) => (
            <div
              key={key}
              className={`tracker-label-item pixel${editMode ? ' tracker-label-item--editable' : ''}`}
              onClick={() => handleLabelClick(key)}
            >
              {/* Color dot indicator in edit mode */}
              {editMode && (
                <span
                  className="label-color-dot"
                  style={{ background: getHabitColor(key) }}
                />
              )}
              {Array.isArray(label)
                ? label.map((line, i) => <span key={i} style={{ display: 'block' }}>{line}</span>)
                : label}
            </div>
          ))}
        </div>

        {/* Horizontally scrollable day grid */}
        <div
          className="tracker-scroll"
          ref={scrollRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
        >
          <div className="tracker-inner">

            <div className="tracker-header-row">
              {DAYS.map(({ date, dayName, dayNum, month, isToday, showMonth }) => (
                <div key={date} className={`tracker-day-hdr${isToday ? ' tracker-day-hdr--today' : ''}`}>
                  {showMonth && <span className="pixel tracker-month">{month}</span>}
                  <span className="pixel tracker-day-name">{dayName}</span>
                  <span className="pixel tracker-day-num-lbl">{dayNum}</span>
                </div>
              ))}
            </div>

            {HABITS.map(({ key }) => {
              const color = getHabitColor(key);
              return (
                <div key={key} className="tracker-row">
                  {DAYS.map(({ date }) => {
                    const cellState = historyMap[date]?.[key] ?? false; // false | true | 'rest'
                    const cellClass = cellState === true ? 'tracker-cell tracker-cell--done'
                                    : cellState === 'rest' ? 'tracker-cell tracker-cell--rest'
                                    : 'tracker-cell';
                    const cellStyle = cellState === true
                      ? { background: color, boxShadow: `0 0 6px ${color}44` }
                      : cellState === 'rest'
                      ? { background: `linear-gradient(135deg, ${color}88 50%, #1a1a1a 50%)`, borderColor: 'transparent' }
                      : undefined;
                    return (
                      <div
                        key={date}
                        className={cellClass}
                        style={cellStyle}
                        onClick={() => !editMode && toggleHistoryTask(date, key)}
                      />
                    );
                  })}
                </div>
              );
            })}

          </div>
        </div>

      </div>

      {/* Color picker popup */}
      {editingHabit && (
        <div className="color-picker-overlay" onClick={() => setEditingHabit(null)}>
          <div className="color-picker-popup" onClick={e => e.stopPropagation()}>
            <p className="pixel color-picker-title">
              {Array.isArray(editingHabitDef?.label)
                ? editingHabitDef.label.join(' ')
                : editingHabitDef?.label}
            </p>
            <div className="color-picker-swatches">
              {COLOR_SWATCHES.map(c => (
                <button
                  key={c}
                  className={`color-swatch${getHabitColor(editingHabit) === c ? ' color-swatch--selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => handleColorPick(c)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
