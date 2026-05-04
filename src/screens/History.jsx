import { useMemo, useState } from 'react';
import useGameStore from '../store/useGameStore';
import PokemonSprite from '../components/PokemonSprite';
import './History.css';

const TASK_LABELS = {
  diet:     'Diet',
  workout1: 'Workout 1',
  workout2: 'Workout 2 (Outdoor)',
  water:    'Water',
  read:     'Read',
  photo:    'Photo',
};

// Build a 75-cell calendar grid anchored so that endDate = cell 75
function buildGrid(endDate, historyMap, currentDayOverride) {
  return Array.from({ length: 75 }, (_, i) => {
    let dateStr;
    if (endDate) {
      // Completed challenge: anchor cell 75 = endDate
      const d = new Date(endDate + 'T12:00:00');
      d.setDate(d.getDate() - (74 - i));
      dateStr = d.toISOString().split('T')[0];
    } else {
      // Current challenge: anchor using today + currentDay
      const today = new Date();
      today.setDate(today.getDate() - (currentDayOverride - 2 - i));
      dateStr = today.toISOString().split('T')[0];
    }
    const entry = historyMap[dateStr];
    const isFuture = endDate ? false : (i + 1) >= currentDayOverride;
    return { dayNum: i + 1, dateStr, entry, isFuture };
  });
}

export default function History() {
  const { history, currentDay, gymBadges, setHistoryNote } = useGameStore();

  const [selected,      setSelected]      = useState(null);
  const [editMode,      setEditMode]      = useState(false);
  const [editingTask,   setEditingTask]   = useState(null);
  const [noteInput,     setNoteInput]     = useState('');
  const [notePopup,     setNotePopup]     = useState(null);
  const [openChallenge, setOpenChallenge] = useState(null); // badge number of expanded prev challenge

  const historyMap = useMemo(() => {
    const map = {};
    history.forEach((entry) => { map[entry.date] = entry; });
    return map;
  }, [history]);

  // Current challenge: 75-cell grid using currentDay as anchor
  const currentDays = useMemo(
    () => buildGrid(null, historyMap, currentDay),
    [history, currentDay, historyMap]
  );

  // Progress bar: purely based on currentDay (days completed in this 75 Hard)
  const progressPct = Math.min(100, Math.round(((currentDay - 1) / 75) * 100));

  const selectDay = (dayNum, dateStr, entry) => {
    if (selected?.dayNum === dayNum && selected?.dateStr === dateStr) {
      setSelected(null);
      setEditMode(false);
    } else {
      setSelected({ dayNum, dateStr, entry });
      setEditMode(false);
    }
    setNotePopup(null);
  };

  const liveEntry = selected ? historyMap[selected.dateStr] : null;

  const openNoteEditor = (taskKey) => {
    if (!editMode) return;
    setNoteInput(liveEntry?.notes?.[taskKey] || '');
    setEditingTask(taskKey);
    setNotePopup(null);
  };

  const saveNote = async () => {
    if (!editingTask || !selected) return;
    await setHistoryNote(selected.dateStr, editingTask, noteInput.trim());
    setEditingTask(null);
    setNoteInput('');
  };

  const cancelEdit = () => { setEditingTask(null); setNoteInput(''); };

  // Sorted previous challenges (oldest first)
  const prevBadges = useMemo(
    () => [...(gymBadges || [])].sort((a, b) => a.number - b.number),
    [gymBadges]
  );

  const renderGrid = (days, label) => (
    <div className="history-grid">
      {days.map(({ dayNum, dateStr, entry, isFuture }) => {
        const state = isFuture ? 'future' : entry ? (entry.completed ? 'done' : 'fail') : 'future';
        const isActive = selected?.dayNum === dayNum && selected?.dateStr === dateStr;
        return (
          <div
            key={`${label}-${dayNum}`}
            className={`cal-tile cal-tile--${state}${isActive ? ' cal-tile--active' : ''}`}
            onClick={() => !isFuture && entry && selectDay(dayNum, dateStr, entry)}
          >
            <span className="pixel cal-num">{dayNum}</span>
          </div>
        );
      })}
    </div>
  );

  const renderDetail = () => {
    if (!selected || !liveEntry) return null;
    return (
      <div className="history-detail card card--green fade-in">
        <div className="history-detail__head">
          <span className="pixel" style={{ fontSize: 10 }}>DAY {selected.dayNum}</span>
          <span className="pixel" style={{ fontSize: 8, color: 'var(--gray)' }}>{selected.dateStr}</span>
          <span className={`pixel history-badge ${liveEntry.completed ? 'history-badge--pass' : 'history-badge--fail'}`}>
            {liveEntry.completed ? '✓ PASS' : '✗ FAIL'}
          </span>
        </div>
        <hr className="px-divider" />

        {liveEntry.partnerName && (
          <div className="history-partner-row">
            <PokemonSprite name={liveEntry.partnerName} size="xs" />
            <span className="pixel" style={{ fontSize: 7, color: 'var(--gray)' }}>
              {liveEntry.partnerName.toUpperCase()}
            </span>
          </div>
        )}

        {Object.entries(TASK_LABELS).map(([k, label]) => {
          const hasNote = !!(liveEntry.notes?.[k]?.trim());
          return (
            <div
              key={k}
              className={`history-task-row${editMode ? ' history-task-row--editable' : ''}`}
              onClick={() => openNoteEditor(k)}
            >
              <span>{liveEntry.tasks[k] ? '✅' : '❌'}</span>
              <span style={{ fontSize: 12, color: 'var(--white)', flex: 1 }}>{label}</span>
              {hasNote && !editMode && (
                <button
                  className="note-info-btn"
                  onClick={(e) => { e.stopPropagation(); setNotePopup(notePopup === k ? null : k); }}
                >
                  ⓘ
                </button>
              )}
              {editMode && <span className="note-edit-hint pixel">{hasNote ? '✎' : '+'}</span>}
              {notePopup === k && hasNote && (
                <div className="note-popup" onClick={(e) => e.stopPropagation()}>
                  <p className="note-popup__text">{liveEntry.notes[k]}</p>
                  <button className="note-popup__close pixel" onClick={() => setNotePopup(null)}>✕</button>
                </div>
              )}
            </div>
          );
        })}

        <div className="history-detail__footer">
          <button
            className={`history-edit-btn pixel${editMode ? ' history-edit-btn--active' : ''}`}
            onClick={() => { setEditMode(prev => !prev); setNotePopup(null); }}
          >
            {editMode ? 'DONE' : '✎ NOTES'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="history-screen">
      <div className="history-header">
        <h2 className="pixel" style={{ fontSize: 12 }}>CHALLENGE LOG</h2>
        <p className="pixel" style={{ fontSize: 8, color: 'var(--gray)', marginTop: 6 }}>
          75 TUFF — ROUND {prevBadges.length + 1}
        </p>
      </div>

      <div className="history-challenge-bar">
        <div className="history-challenge-bar__fill" style={{ width: `${progressPct}%` }} />
        <span className="history-challenge-label pixel">{progressPct}% COMPLETE</span>
      </div>

      <div className="history-legend">
        <span className="legend-dot legend-dot--green" /><span>Complete</span>
        <span className="legend-dot legend-dot--red" /><span>Failed</span>
        <span className="legend-dot legend-dot--gray" /><span>Future</span>
      </div>

      {renderGrid(currentDays, 'current')}
      {renderDetail()}

      {/* Previous 75 Hard challenges — collapsible */}
      {prevBadges.length > 0 && (
        <div className="prev-challenges">
          {[...prevBadges].reverse().map((badge) => {
            const isOpen = openChallenge === badge.number;
            const prevDays = buildGrid(badge.endDate, historyMap);
            return (
              <div key={badge.number} className="prev-challenge-section">
                <button
                  className="prev-challenge-header pixel"
                  onClick={() => {
                    setOpenChallenge(isOpen ? null : badge.number);
                    setSelected(null);
                    setEditMode(false);
                  }}
                >
                  <span>75 HARD #{badge.number}</span>
                  <span style={{ color: 'var(--gray)', fontSize: 6 }}>
                    {badge.startDate} → {badge.endDate}
                  </span>
                  <span className="prev-challenge-arrow">{isOpen ? '▲' : '▼'}</span>
                </button>
                {isOpen && (
                  <div className="fade-in">
                    {renderGrid(prevDays, `badge-${badge.number}`)}
                    {renderDetail()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Note editor modal */}
      {editingTask && (
        <div className="note-editor-overlay" onClick={cancelEdit}>
          <div className="note-editor-popup" onClick={(e) => e.stopPropagation()}>
            <p className="pixel note-editor-title">{TASK_LABELS[editingTask]}</p>
            <textarea
              className="note-editor-input"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Add your notes here..."
              autoFocus
              rows={4}
            />
            <div className="note-editor-actions">
              <button className="pixel note-editor-cancel" onClick={cancelEdit}>CANCEL</button>
              <button className="pixel note-editor-save" onClick={saveNote}>SAVE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
