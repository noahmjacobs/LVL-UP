import { useEffect } from 'react';
import useGameStore from './store/useGameStore';

import ProfessorIntro   from './screens/ProfessorIntro';
import NameEntry        from './screens/NameEntry';
import StarterSelect    from './screens/StarterSelect';
import Today            from './screens/Today';
import Stats            from './screens/Stats';
import History          from './screens/History';
import Profile          from './screens/Profile';
import RestartScreen    from './screens/RestartScreen';
import NavBar           from './components/NavBar';
import EvolutionCutscene from './components/EvolutionCutscene';

const ONBOARDING = ['professor', 'nameEntry', 'starterSelect'];

export default function App() {
  const { currentScreen, isOnboarded, loadSavedUser, showEvolutionCutscene } = useGameStore();

  useEffect(() => {
    loadSavedUser();
  }, []);

  const inOnboarding = ONBOARDING.includes(currentScreen);

  return (
    <div className="app-shell">
      <div className="scanlines" />

      {currentScreen === 'professor'    && <ProfessorIntro />}
      {currentScreen === 'nameEntry'    && <NameEntry />}
      {currentScreen === 'starterSelect' && <StarterSelect />}
      {currentScreen === 'restart'       && <RestartScreen />}

      {!inOnboarding && currentScreen !== 'restart' && (
        <>
          <div className="screen">
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
