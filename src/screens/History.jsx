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

export default function History() {
  const { history, currentDay, partnerSince, setHistoryNote } = useGameStore();

  const [selected,     setSelected]     = useState(null);   // { dayNum, dateStr, entry }
  const [editMode,     setEditMode]     = useState(false);
  const [editingTask,  setEditingTask]  = useState(null);   // taskKey being edited
  const [noteInput,    setNoteInput]    = useState('');
  const [notePopup,    setNotePopup]    = useState(null);   // taskKey whose note is shown

  const historyMap = useMemo(() => {
    const map = {};
    history.forEach((entry) => { map[entry.date] = entry; });
    return map;
  }, [history]);

  // Build a 75-day calendar grid
  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 75 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (currentDay - 2 - i));
      const dateStr = d.toISOString().split('T')[0];
      const entry = historyMap[dateStr];
      const dayNum = i + 1;
      const isFuture = dayNum >= currentDay;
      return { dayNum, dateStr, entry, isFuture };
    });
  }, [history, currentDay, historyMap]);

  const selectDay = (dayNum, dateStr, entry) => {
    if (selected?.dayNum === dayNum) {
      setSelected(null);
      setEditMode(false);
    } else {
      setSelected({ dayNum, dateStr, entry });
      setEditMode(false);
    }
    setNotePopup(null);
  };

  // Keep selected in sync with live history (notes update etc.)
  const liveEntry = selected ? historyMap[selected.dateStr] : null;

  const openNoteEditor = (taskKey) => {
    if (!editMode) return;
    const existing = liveEntry?.notes?.[taskKey] || '';
    setNoteInput(existing);
    setEditingTask(taskKey);
    setNotePopup(null);
  };

  const saveNote = async () => {
    if (!editingTask || !selected) return;
    await setHistoryNote(selected.dateStr, editingTask, noteInput.trim());
    setEditingTask(null);
    setNoteInput('');
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setNoteInput('');
  };

  // Only count fully completed days (all 6 tasks true) since current partner was adopted
  const progressPct = useMemo(() => {
    const completedThisRun = history.filter(h =>
      h.completed && (!partnerSince || h.date >= partnerSince)
    ).length;
    return Math.min(100, Math.round((completedThisRun / 75) * 100));
  }, [history, partnerSince]);

  return (
    <div className="history-screen">
      <div className="history-header">
        <h2 className="pixel" style={{ fontSize: 12 }}>CHALLENGE LOG</h2>
        <p className="pixel" style={{ fontSize: 8, color: 'var(--gray)', marginTop: 6 }}>75 TUFF Progress</p>
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

      <div className="history-grid">
        {days.map(({ dayNum, dateStr, entry, isFuture }) => {
          const state = isFuture ? 'future' : entry ? (entry.completed ? 'done' : 'fail') : 'future';
          return (
            <div
              key={dayNum}
              className={`cal-tile cal-tile--${state}${selected?.dayNum === dayNum ? ' cal-tile--active' : ''}`}
              onClick={() => !isFuture && entry && selectDay(dayNum, dateStr, entry)}
            >
              <span className="pixel cal-num">{dayNum}</span>
            </div>
          );
        })}
      </div>

      {selected && liveEntry && (
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
                {editMode && (
                  <span className="note-edit-hint pixel">{hasNote ? '✎' : '+'}</span>
                )}

                {/* Inline note popup */}
                {notePopup === k && hasNote && (
                  <div className="note-popup" onClick={(e) => e.stopPropagation()}>
                    <p className="note-popup__text">{liveEntry.notes[k]}</p>
                    <button className="note-popup__close pixel" onClick={() => setNotePopup(null)}>✕</button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Edit toggle button — bottom right */}
          <div className="history-detail__footer">
            <button
              className={`history-edit-btn pixel${editMode ? ' history-edit-btn--active' : ''}`}
              onClick={() => { setEditMode(prev => !prev); setNotePopup(null); }}
            >
              {editMode ? 'DONE' : '✎ NOTES'}
            </button>
          </div>
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
