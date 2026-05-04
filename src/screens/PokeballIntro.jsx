import { useEffect, useState } from 'react';
import useGameStore from '../store/useGameStore';
import { playTitleTheme } from '../audio';
import './PokeballIntro.css';

// Order: Ultra Ball → Great Ball → Poké Ball
const BALLS = [
  { src: '/sprites/ultraball.png', alt: 'Ultra Ball' },
  { src: '/sprites/greatball.png', alt: 'Great Ball' },
  { src: '/sprites/pokeball.png',  alt: 'Poké Ball'  },
];

// Timings (ms)
const PASS_DURATION  = 850;   // how long each pass-through ball animates
const BALL_INTERVAL  = 950;   // gap between balls appearing
const FINAL_START    = BALL_INTERVAL * 2;       // when pokéball begins (1900ms)
const FINAL_DURATION = 1400;                    // pokéball zoom duration
const FLASH_START    = FINAL_START + FINAL_DURATION - 200;  // overlap flash slightly
const NAV_START      = FLASH_START + 350;       // navigate once flash is bright

export default function PokeballIntro() {
  const { goToScreen } = useGameStore();

  // phase: 0 = ultra, 1 = great, 2 = pokeball, 3 = all done
  const [phase, setPhase] = useState(0);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    playTitleTheme(); // ensure music is playing through the intro
    const t1 = setTimeout(() => setPhase(1), BALL_INTERVAL);
    const t2 = setTimeout(() => setPhase(2), BALL_INTERVAL * 2);
    const t3 = setTimeout(() => setFlash(true), FLASH_START);
    const t4 = setTimeout(() => goToScreen('professor'), NAV_START);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, []);

  const isFinal = phase === 2;
  const ball    = BALLS[Math.min(phase, 2)];

  return (
    <div className="pokeball-intro">
      <img
        key={phase}
        src={ball.src}
        alt={ball.alt}
        className={`intro-ball ${isFinal ? 'intro-ball--final' : 'intro-ball--pass'}`}
        style={{ animationDuration: isFinal ? `${FINAL_DURATION}ms` : `${PASS_DURATION}ms` }}
      />
      {flash && <div className="intro-flash" />}
    </div>
  );
}
