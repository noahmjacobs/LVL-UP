import { useState } from 'react';
import useGameStore from '../store/useGameStore';
import './History.css';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const TASK_LABELS = { diet:'Diet', workout1:'Workout 1', workout2:'Workout 2 (Outdoor)', water:'Water', read:'Read', photo:'Photo' };

export default function History() {
  const { history, currentDay } = useGameStore();
  const [selected, setSelected] = useState(null);

  const historyMap = {};
  history.forEach((entry) => { historyMap[entry.date] = entry; });

  // Build a 75-day calendar grid
  const today = new Date();
  const days = Array.from({ length: 75 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (currentDay - 2 - i));
    const dateStr = d.toISOString().split('T')[0];
    const entry = historyMap[dateStr];
    const dayNum = i + 1;
    const isFuture = dayNum >= currentDay;
    return { dayNum, dateStr, entry, isFuture };
  });

  return (
    <div className="history-screen">
      <div className="history-header">
        <h2 className="pixel" style={{ fontSize: 12 }}>CHALLENGE LOG</h2>
        <p className="pixel" style={{ fontSize: 8, color: 'var(--gray)', marginTop: 6 }}>75 TUFF Progress</p>
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
              onClick={() => !isFuture && entry && setSelected(selected?.dayNum === dayNum ? null : { dayNum, dateStr, entry })}
            >
              <span className="pixel cal-num">{dayNum}</span>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="history-detail card card--green fade-in">
          <div className="history-detail__head">
            <span className="pixel" style={{ fontSize: 10 }}>DAY {selected.dayNum}</span>
            <span className="pixel" style={{ fontSize: 8, color: 'var(--gray)' }}>{selected.dateStr}</span>
            <span className={`pixel history-badge ${selected.entry.completed ? 'history-badge--pass' : 'history-badge--fail'}`}>
              {selected.entry.completed ? '✓ PASS' : '✗ FAIL'}
            </span>
          </div>
          <hr className="px-divider" />
          {Object.entries(TASK_LABELS).map(([k, label]) => (
            <div key={k} className="history-task-row">
              <span>{selected.entry.tasks[k] ? '✅' : '❌'}</span>
              <span style={{ fontSize: 12, color: 'var(--white)' }}>{label}</span>
            </div>
          ))}
          <div className="history-task-row">
            <span>💧</span>
            <span style={{ fontSize: 12, color: 'var(--white)' }}>
              Water: {selected.entry.waterOz || 0} / 128 oz
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
