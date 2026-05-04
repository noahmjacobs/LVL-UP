import { useState, useEffect } from 'react';
import useGameStore from '../store/useGameStore';
import './ProfessorIntro.css';

const LINES = [
  "Welcome to LVL UP.",
  "The world is full of challenges.",
  "But few are worthy of a true trainer.",
  "75 days. 6 tasks. No excuses.",
  "Your journey begins today.",
];

export default function ProfessorIntro() {
  const { goToScreen } = useGameStore();
  const [lineIdx, setLineIdx]   = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [done, setDone]          = useState(false);

  useEffect(() => {
    if (lineIdx >= LINES.length) { setDone(true); return; }
    const line = LINES[lineIdx];
    let i = 0;
    setDisplayed('');
    const t = setInterval(() => {
      i++;
      setDisplayed(line.slice(0, i));
      if (i >= line.length) clearInterval(t);
    }, 38);
    return () => clearInterval(t);
  }, [lineIdx]);

  const advance = () => {
    if (!done) {
      if (displayed.length < LINES[lineIdx].length) {
        setDisplayed(LINES[lineIdx]);
      } else {
        setLineIdx((n) => n + 1);
      }
    } else {
      goToScreen('nameEntry');
    }
  };

  return (
    <div className="prof-screen" onClick={advance}>
      <div className="prof-silhouette">
        <img src="/sprites/profoak.png" alt="Professor Oak" className="prof-body" draggable={false} />
      </div>

      <div className="prof-textbox card">
        <p className="pixel prof-line">
          {displayed}
          {!done && <span className="blink">▌</span>}
        </p>
        {(displayed.length === LINES[lineIdx]?.length || done) && (
          <span className="pixel prof-next blink">▼</span>
        )}
      </div>

      <p className="prof-tap pixel">TAP TO CONTINUE</p>
    </div>
  );
}
