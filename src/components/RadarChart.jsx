import './RadarChart.css';

const CX = 160;
const CY = 160;
const R  = 120;
const LABELS = [
  { key: 'discipline', label: 'DISCIPLINE' },
  { key: 'focus',      label: 'FOCUS'      },
  { key: 'energy',     label: 'ENERGY'     },
  { key: 'health',     label: 'HEALTH'     },
  { key: 'habits',     label: 'HABITS'     },
  { key: 'consistency',label: 'CONSISTENCY'},
];

function pt(angle, r) {
  const rad = (angle - 90) * (Math.PI / 180);
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

function hexPath(r) {
  return LABELS.map((_, i) => pt(i * 60, r)).map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ') + 'Z';
}

function dataPath(stats) {
  return LABELS.map(({ key }, i) => {
    const val = Math.max(0, Math.min(252, stats[key] || 0));
    return pt(i * 60, R * (val / 252));
  }).map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ') + 'Z';
}

export default function RadarChart({ stats }) {
  return (
    <div className="radar-wrap">
      <svg viewBox="0 0 320 320" className="radar-svg">
        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <g key={scale}>
            <path d={hexPath(R * scale)} fill="none" stroke="#222" strokeWidth="1" />
            <text
              x={CX + 3}
              y={CY - R * scale + 8}
              fill="#444"
              fontSize="6"
              fontFamily="'Press Start 2P', monospace"
            >
              {Math.round(252 * scale)}
            </text>
          </g>
        ))}
        {/* Spokes */}
        {LABELS.map((_, i) => {
          const [x, y] = pt(i * 60, R);
          return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="#222" strokeWidth="1" />;
        })}
        {/* Data fill */}
        <path d={dataPath(stats)} fill="rgba(57,255,20,0.15)" stroke="var(--green)" strokeWidth="2" />
        {/* Data points */}
        {LABELS.map(({ key }, i) => {
          const val = Math.max(0, Math.min(100, stats[key] || 0));
          const [x, y] = pt(i * 60, R * (val / 100));
          return <circle key={key} cx={x} cy={y} r="4" fill="var(--green)" />;
        })}
        {/* Labels */}
        {LABELS.map(({ label }, i) => {
          const [x, y] = pt(i * 60, R + 26);
          const anchor = x < CX - 5 ? 'end' : x > CX + 5 ? 'start' : 'middle';
          return (
            <text key={label} x={x} y={y} textAnchor={anchor} fill="#aaa" fontSize="7" fontFamily="'Press Start 2P', monospace">
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
