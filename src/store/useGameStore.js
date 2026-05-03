import { create } from 'zustand';
import { saveProfile, saveChallenge, saveHistoryEntry, loadUser } from '../firebase';

const STAT_INCREMENT = 1.35;

const EVOLUTION_LINES = {
  charmander: ['charmander', 'charmeleon', 'charizard'],
  squirtle:   ['squirtle',   'wartortle',  'blastoise'],
  bulbasaur:  ['bulbasaur',  'ivysaur',    'venusaur'],
};

const defaultTasks = () => ({
  diet: false, workout1: false, workout2: false,
  water: false, read: false, photo: false,
});

const defaultStats = () => ({
  discipline: 0, focus: 0, energy: 0,
  health: 0, habits: 0, consistency: 0,
});

const todayDate = () => new Date().toISOString().split('T')[0];

const useGameStore = create((set, get) => ({
  // ── Onboarding ──────────────────────────────────────────────────────────
  isOnboarded:    false,
  trainerName:    '',
  pokemonChoice:  null,
  pokemonNickname: '',

  // ── Navigation ──────────────────────────────────────────────────────────
  currentScreen: 'professor',

  // ── Challenge ───────────────────────────────────────────────────────────
  currentDay:         1,
  currentStreak:      1,
  totalCompletedDays: 0,
  totalRestarts:      0,
  longestStreak:      0,
  lastLockDate:       null,

  // ── Today ────────────────────────────────────────────────────────────────
  todayTasks: defaultTasks(),
  waterOz:    0,
  isLockedIn: false,

  // ── Stats ────────────────────────────────────────────────────────────────
  stats: defaultStats(),

  // ── Pokémon ──────────────────────────────────────────────────────────────
  evolutionStage:        0,
  showEvolutionCutscene: false,
  evolutionTarget:       null,

  // ── History ──────────────────────────────────────────────────────────────
  history: [],

  // ── Computed ─────────────────────────────────────────────────────────────
  getCurrentPokemon() {
    const { pokemonChoice, evolutionStage } = get();
    if (!pokemonChoice) return null;
    return EVOLUTION_LINES[pokemonChoice][evolutionStage];
  },

  getEvolutionLines: () => EVOLUTION_LINES,

  // ── Onboarding actions ────────────────────────────────────────────────────
  setTrainerName: (name) => set({ trainerName: name }),
  setPokemonChoice: (choice) => set({ pokemonChoice: choice }),
  setPokemonNickname: (name) => set({ pokemonNickname: name }),
  goToScreen: (screen) => set({ currentScreen: screen }),

  completeOnboarding: async () => {
    const s = get();
    set({ isOnboarded: true, currentScreen: 'today' });
    localStorage.setItem('lvlup_trainer', s.trainerName);
    await saveProfile(s.trainerName, {
      trainerName:    s.trainerName,
      pokemonChoice:  s.pokemonChoice,
      pokemonNickname: s.pokemonNickname || s.pokemonChoice,
      totalCompletedDays: 0,
      totalRestarts: 0,
      longestStreak: 0,
    });
    await saveChallenge(s.trainerName, {
      currentDay: 1, currentStreak: 1,
      isLockedIn: false, waterOz: 0,
      todayTasks: defaultTasks(),
      stats: defaultStats(),
      evolutionStage: 0,
      lastLockDate: null,
    });
  },

  // ── Load saved user (on app start) ───────────────────────────────────────
  loadSavedUser: async () => {
    const savedName = localStorage.getItem('lvlup_trainer');
    if (!savedName) return false;

    const data = await loadUser(savedName);
    if (!data) return false;

    const { profile, challenge, history } = data;
    const historyArr = history
      ? Object.entries(history).map(([date, v]) => ({ date, ...v }))
      : [];

    // Check if today was already locked in
    const today = todayDate();
    const alreadyLockedToday = challenge?.lastLockDate === today;

    set({
      isOnboarded:        true,
      trainerName:        profile.trainerName,
      pokemonChoice:      profile.pokemonChoice,
      pokemonNickname:    profile.pokemonNickname,
      totalCompletedDays: profile.totalCompletedDays || 0,
      totalRestarts:      profile.totalRestarts || 0,
      longestStreak:      profile.longestStreak || 0,
      currentDay:         challenge.currentDay || 1,
      currentStreak:      challenge.currentStreak || 1,
      isLockedIn:         alreadyLockedToday,
      waterOz:            alreadyLockedToday ? (challenge.waterOz || 0) : 0,
      todayTasks:         alreadyLockedToday ? (challenge.todayTasks || defaultTasks()) : defaultTasks(),
      stats:              challenge.stats || defaultStats(),
      evolutionStage:     challenge.evolutionStage || 0,
      lastLockDate:       challenge.lastLockDate || null,
      history:            historyArr,
      currentScreen:      'today',
    });
    return true;
  },

  // ── Task toggling ─────────────────────────────────────────────────────────
  toggleTask: (taskKey) => {
    const { isLockedIn, todayTasks } = get();
    if (isLockedIn) return;
    set({ todayTasks: { ...todayTasks, [taskKey]: !todayTasks[taskKey] } });
  },

  setWaterOz: (oz) => {
    const { isLockedIn } = get();
    if (isLockedIn) return;
    const capped = Math.min(Math.max(0, oz), 128);
    set((s) => ({
      waterOz: capped,
      todayTasks: { ...s.todayTasks, water: capped >= 128 },
    }));
  },

  // ── Lock in the day ───────────────────────────────────────────────────────
  lockInDay: async () => {
    const s = get();
    if (s.isLockedIn) return;

    const allDone = Object.values(s.todayTasks).every(Boolean);
    const today = todayDate();

    if (!allDone) {
      // Incomplete day → trigger restart
      await saveHistoryEntry(s.trainerName, today, {
        day: s.currentDay, tasks: s.todayTasks, completed: false, waterOz: s.waterOz,
      });
      set({ currentScreen: 'restart' });
      return;
    }

    // ── Full day completed ──
    const newStats = { ...s.stats };
    if (s.todayTasks.diet)                             newStats.discipline  = Math.min(100, newStats.discipline  + STAT_INCREMENT);
    if (s.todayTasks.read)                             newStats.focus       = Math.min(100, newStats.focus       + STAT_INCREMENT);
    if (s.todayTasks.workout1 && s.todayTasks.workout2) newStats.energy     = Math.min(100, newStats.energy      + STAT_INCREMENT);
    if (s.todayTasks.water)                            newStats.health      = Math.min(100, newStats.health      + STAT_INCREMENT);
    if (s.todayTasks.photo)                            newStats.habits      = Math.min(100, newStats.habits      + STAT_INCREMENT);
    newStats.consistency = Math.min(100, newStats.consistency + STAT_INCREMENT);

    const newDay    = s.currentDay + 1;
    const newStreak = s.currentStreak + 1;
    const newTotal  = s.totalCompletedDays + 1;
    const newLongest = Math.max(s.longestStreak, newStreak);

    // Check evolution
    let newEvStage = s.evolutionStage;
    let showEvo    = false;
    let evoTarget  = null;
    if (s.currentDay === 25 && newEvStage === 0) {
      newEvStage = 1;
      showEvo    = true;
      evoTarget  = EVOLUTION_LINES[s.pokemonChoice][1];
    } else if (s.currentDay === 50 && newEvStage === 1) {
      newEvStage = 2;
      showEvo    = true;
      evoTarget  = EVOLUTION_LINES[s.pokemonChoice][2];
    }

    const historyEntry = { day: s.currentDay, tasks: s.todayTasks, completed: true, waterOz: s.waterOz };

    set({
      currentDay:         newDay,
      currentStreak:      newStreak,
      totalCompletedDays: newTotal,
      longestStreak:      newLongest,
      stats:              newStats,
      evolutionStage:     newEvStage,
      showEvolutionCutscene: showEvo,
      evolutionTarget:    evoTarget,
      isLockedIn:         true,
      lastLockDate:       today,
      history:            [...s.history, { date: today, ...historyEntry }],
      todayTasks:         defaultTasks(),
      waterOz:            0,
    });

    await saveHistoryEntry(s.trainerName, today, historyEntry);
    await saveProfile(s.trainerName, {
      trainerName:        s.trainerName,
      pokemonChoice:      s.pokemonChoice,
      pokemonNickname:    s.pokemonNickname,
      totalCompletedDays: newTotal,
      totalRestarts:      s.totalRestarts,
      longestStreak:      newLongest,
    });
    await saveChallenge(s.trainerName, {
      currentDay:    newDay,
      currentStreak: newStreak,
      isLockedIn:    true,
      waterOz:       0,
      todayTasks:    defaultTasks(),
      stats:         newStats,
      evolutionStage: newEvStage,
      lastLockDate:  today,
    });
  },

  dismissEvolution: () => set({ showEvolutionCutscene: false, evolutionTarget: null }),

  // ── Restart ───────────────────────────────────────────────────────────────
  confirmRestart: async () => {
    const s = get();
    const newRestarts = s.totalRestarts + 1;

    set({
      currentDay:    1,
      currentStreak: 1,
      stats:         defaultStats(),
      evolutionStage: 0,
      isLockedIn:    false,
      todayTasks:    defaultTasks(),
      waterOz:       0,
      lastLockDate:  null,
      totalRestarts: newRestarts,
      currentScreen: 'today',
    });

    await saveProfile(s.trainerName, {
      trainerName:        s.trainerName,
      pokemonChoice:      s.pokemonChoice,
      pokemonNickname:    s.pokemonNickname,
      totalCompletedDays: s.totalCompletedDays,
      totalRestarts:      newRestarts,
      longestStreak:      s.longestStreak,
    });
    await saveChallenge(s.trainerName, {
      currentDay: 1, currentStreak: 1,
      isLockedIn: false, waterOz: 0,
      todayTasks: defaultTasks(),
      stats: defaultStats(),
      evolutionStage: 0,
      lastLockDate: null,
    });
  },
}));

export default useGameStore;
export { EVOLUTION_LINES };
