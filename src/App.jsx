import { useEffect } from 'react';
import useGameStore from './store/useGameStore';
import { auth, onAuthStateChanged } from './firebase';
import { applyTheme } from './constants/themes';

import TitleScreen      from './screens/TitleScreen';
import ProfessorIntro   from './screens/ProfessorIntro';
import NameEntry        from './screens/NameEntry';
import StarterSelect    from './screens/StarterSelect';
import Today            from './screens/Today';
import Stats            from './screens/Stats';
import History          from './screens/History';
import Profile          from './screens/Profile';
import RestartScreen    from './screens/RestartScreen';
import ChooseNewPokemon from './screens/ChooseNewPokemon';
import NavBar           from './components/NavBar';
import EvolutionCutscene from './components/EvolutionCutscene';

const ONBOARDING = ['professor', 'nameEntry', 'starterSelect'];

export default function App() {
  const { currentScreen, authLoading, handleAuthResolved, showEvolutionCutscene, themeColor } = useGameStore();

  useEffect(() => { applyTheme(themeColor); }, [themeColor]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      handleAuthResolved(user);
    });
    return unsub;
  }, []);

  if (authLoading) {
    return (
      <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p className="pixel" style={{ fontSize: 10, color: 'var(--green)' }}>
          LOADING<span className="blink">...</span>
        </p>
      </div>
    );
  }

  const inOnboarding = ONBOARDING.includes(currentScreen);

  return (
    <div className="app-shell">
      <div className="scanlines" />

      {currentScreen === 'title'        && <TitleScreen />}
      {currentScreen === 'professor'    && <ProfessorIntro />}
      {currentScreen === 'nameEntry'    && <NameEntry />}
      {currentScreen === 'starterSelect' && <StarterSelect />}
      {currentScreen === 'restart'           && <RestartScreen />}
      {currentScreen === 'chooseNewPokemon'  && (
        <div className="screen">
          <ChooseNewPokemon />
        </div>
      )}

      {!inOnboarding && currentScreen !== 'restart' && currentScreen !== 'title' && currentScreen !== 'chooseNewPokemon' && (
        <>
          <div className={`screen${currentScreen === 'today' ? ' screen--immersive' : ''}`}>
            {currentScreen === 'today'   && <Today />}
            {currentScreen === 'stats'   && <Stats />}
            {currentScreen === 'history' && <History />}
            {currentScreen === 'profile' && <Profile />}
          </div>
          <NavBar />
        </>
      )}

      {showEvolutionCutscene && <EvolutionCutscene />}
    </div>
  );
}
