import useGameStore from '../store/useGameStore';
import './NavBar.css';

const TABS = [
  { id: 'today',   label: 'TODAY'   },
  { id: 'stats',   label: 'STATS'   },
  { id: 'history', label: 'LOG'     },
  { id: 'profile', label: 'TRAINER' },
];

export default function NavBar() {
  const { currentScreen, goToScreen } = useGameStore();
  return (
    <nav className="navbar">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`navbar__tab${currentScreen === tab.id ? ' navbar__tab--active' : ''}`}
          onClick={() => goToScreen(tab.id)}
        >
          <span className="navbar__label pixel">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
