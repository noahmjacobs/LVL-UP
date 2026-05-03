import useGameStore from '../store/useGameStore';
import './WaterTracker.css';

const TOTAL = 128;
const STEP  = 8;

export default function WaterTracker() {
  const { waterOz, setWaterOz, isLockedIn } = useGameStore();
  const pct = Math.min(1, waterOz / TOTAL);

  return (
    <div className="water-tracker card">
      <div className="water-tracker__header">
        <span className="pixel" style={{ fontSize: 9, color: 'var(--blue)' }}>💧 WATER INTAKE</span>
        <span className="pixel" style={{ fontSize: 10, color: waterOz >= TOTAL ? 'var(--green)' : 'var(--white)' }}>
          {waterOz} / {TOTAL} oz
        </span>
      </div>

      {/* Pokéball fill visual */}
      <div className="pokeball-wrap">
        <div className="pokeball">
          <div className="pokeball__top">
            <div className="pokeball__water" style={{ height: `${pct * 50}%` }} />
          </div>
          <div className="pokeball__band" />
          <div className="pokeball__bottom">
            <div className="pokeball__water" style={{ height: `${Math.max(0, (pct - 0.5) * 2 * 50)}%` }} />
          </div>
          <div className="pokeball__button" />
        </div>
        <div className="pixel" style={{ fontSize: 8, color: 'var(--gray)', marginTop: 6 }}>
          {Math.round(pct * 100)}%
        </div>
      </div>

      {/* Increment buttons */}
      {!isLockedIn && (
        <div className="water-tracker__controls">
          <button
            className="btn water-btn"
            onClick={() => setWaterOz(waterOz - STEP)}
            disabled={waterOz <= 0}
          >-8 oz</button>
          <button
            className="btn water-btn btn--solid"
            onClick={() => setWaterOz(waterOz + STEP)}
            disabled={waterOz >= TOTAL}
          >+8 oz</button>
          <button
            className="btn water-btn"
            onClick={() => setWaterOz(TOTAL)}
            disabled={waterOz >= TOTAL}
          >FULL</button>
        </div>
      )}
    </div>
  );
}
