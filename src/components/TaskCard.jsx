import './TaskCard.css';

export default function TaskCard({ icon, title, subtitle, checked, onToggle, locked }) {
  return (
    <div
      className={`task-card${checked ? ' task-card--done' : ''}${locked ? ' task-card--locked' : ''}`}
      onClick={!locked ? onToggle : undefined}
    >
      <span className="task-card__icon">{icon}</span>
      <div className="task-card__text">
        <span className="task-card__title pixel">{title}</span>
        {subtitle && <span className="task-card__sub">{subtitle}</span>}
      </div>
      <div className={`px-check${checked ? ' px-check--checked' : ''}`} />
    </div>
  );
}
