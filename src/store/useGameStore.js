import { create } from 'zustand';
import {
  signInWithGoogle, signInWithApple, signOut,
  saveProfile, saveChallenge, saveHistoryEntry, loadUser, updateProfileField,
} from '../firebase';
import { applyTheme, DEFAULT_THEME } from '../constants/themes';

const STAT_MAX       = 252;
const STAT_INCREMENT = STAT_MAX / 75; // 3.36 per completed day — hits 252 at day 75

const EVOLUTION_LINES = {
  charmander: ['charmander', 'charmeleon', 'charizard'],
  squirtle:   ['squirtle',   'wartortle',  'blastoise'],
  bulbasaur:  ['bulbasaur',  'ivysaur',    'venusaur'],
  cyndaquil:  ['cyndaquil',  'quilava',    'typhlosion'],
  totodile:   ['totodile',   'croconaw',   'feraligatr'],
  chikorita:  ['chikorita',  'bayleef',    'meganium'],
  torchic:    ['torchic',    'combusken',  'blaziken'],
  mudkip:     ['mudkip',     'marshtomp',  'swampert'],
  treecko:    ['treecko',    'grovyle',    'sceptile'],
  chimchar:   ['chimchar',   'monferno',   'infernape'],
  piplup:     ['piplup',     'prinplup',   'empoleon'],
  turtwig:    ['turtwig',    'grotle',     'torterra'],
  snivy:      ['snivy',      'servine',    'serperior'],
  tepig:      ['tepig',      'pignite',    'emboar'],
  oshawott:   ['oshawott',   'dewott',     'samurott'],
  chespin:    ['chespin',    'quilladin',  'chesnaught'],
  fennekin:   ['fennekin',   'braixen',    'delphox'],
  froakie:    ['froakie',    'frogadier',  'greninja'],
  rowlet:     ['rowlet',     'dartrix',    'decidueye'],
  litten:     ['litten',     'torracat',   'incineroar'],
  popplio:    ['popplio',    'brionne',    'primarina'],
  grookey:    ['grookey',    'thwackey',   'rillaboom'],
  scorbunny:  ['scorbunny',  'raboot',     'cinderace'],
  sobble:     ['sobble',     'drizzile',   'inteleon'],
  sprigatito: ['sprigatito', 'floragato',  'meowscarada'],
  fuecoco:    ['fuecoco',    'crocalor',   'skeledirge'],
  quaxly:     ['quaxly',     'quaxwell',   'quaquaval'],
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

const computeStatsFromHistory = (history) => {
  const stats = defaultStats();
  for (const h of history) {
    if (!h.tasks) continue;
    if (h.tasks.diet)     stats.discipline  = Math.min(STAT_MAX,stats.discipline  + STAT_INCREMENT);
    if (h.tasks.read)     stats.focus       = Math.min(STAT_MAX,stats.focus       + STAT_INCREMENT);
    if (h.tasks.workout1 && h.tasks.workout2)
                          stats.energy      = Math.min(STAT_MAX,stats.energy      + STAT_INCREMENT);
    if (h.tasks.water)    stats.health      = Math.min(STAT_MAX,stats.health      + STAT_INCREMENT);
    if (h.tasks.photo)    stats.habits      = Math.min(STAT_MAX,stats.habits      + STAT_INCREMENT);
    if (Object.values(h.tasks).every(Boolean))
                          stats.consistency = Math.min(STAT_MAX,stats.consistency + STAT_INCREMENT);
  }
  return stats;
};

const computeStreak = (history) => {
  const completedSet = new Set(history.filter(h => h.completed).map(h => h.date));
  let streak = 0;
  const d = new Date(todayDate() + 'T12:00:00');
  while (true) {
    const str = d.toISOString().split('T')[0];
    if (completedSet.has(str)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
};

const useGameStore = create((set, get) => ({
  // ── Auth ─────────────────────────────────────────────────────────────────
  uid:         null,
  authLoading: true,  // true while Firebase resolves the session on app start

  // ── Onboarding ──────────────────────────────────────────────────────────
  isOnboarded:     false,
  trainerName:     '',
  pokemonChoice:   null,
  pokemonNickname: '',

  // ── Navigation ──────────────────────────────────────────────────────────
  currentScreen: 'title',

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

  // ── Theme ────────────────────────────────────────────────────────────────
  themeColor: DEFAULT_THEME,

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

  // ── Auth actions ──────────────────────────────────────────────────────────
  handleAuthResolved: async (firebaseUser) => {
    if (!firebaseUser) {
      set({ uid: null, authLoading: false, currentScreen: 'title' });
      return;
    }

    set({ uid: firebaseUser.uid });
    const hasData = await get().loadSavedUser(firebaseUser.uid);
    if (!hasData) {
      // New user — start onboarding
      set({ authLoading: false, currentScreen: 'professor' });
    } else {
      set({ authLoading: false });
    }
  },

  loginWithGoogle: async () => {
    await signInWithGoogle();
    // onAuthStateChanged in App.jsx handles the rest
  },

  loginWithApple: async () => {
    await signInWithApple();
  },

  logout: async () => {
    await signOut();
    applyTheme(DEFAULT_THEME);
    set({
      uid: null, isOnboarded: false, trainerName: '',
      pokemonChoice: null, pokemonNickname: '',
      currentScreen: 'title', themeColor: DEFAULT_THEME,
      currentDay: 1, currentStreak: 1, totalCompletedDays: 0,
      totalRestarts: 0, longestStreak: 0, lastLockDate: null,
      todayTasks: defaultTasks(), waterOz: 0, isLockedIn: false,
      stats: defaultStats(), evolutionStage: 0, history: [],
    });
  },

  setThemeColor: async (id) => {
    const { uid } = get();
    set({ themeColor: id });
    applyTheme(id);
    if (uid) await updateProfileField(uid, 'themeColor', id);
  },

  // ── Onboarding actions ────────────────────────────────────────────────────
  setTrainerName:    (name)   => set({ trainerName: name }),
  setPokemonChoice:  (choice) => set({ pokemonChoice: choice }),
  setPokemonNickname:(name)   => set({ pokemonNickname: name }),
  goToScreen:        (screen) => set({ currentScreen: screen }),

  completeOnboarding: async () => {
    const s = get();
    set({ isOnboarded: true, currentScreen: 'today' });
    await saveProfile(s.uid, {
      trainerName:        s.trainerName,
      pokemonChoice:      s.pokemonChoice,
      pokemonNickname:    s.pokemonNickname || s.pokemonChoice,
      totalCompletedDays: 0,
      totalRestarts:      0,
      longestStreak:      0,
    });
    await saveChallenge(s.uid, {
      currentDay: 1, currentStreak: 1,
      isLockedIn: false, waterOz: 0,
      todayTasks: defaultTasks(),
      stats: defaultStats(),
      evolutionStage: 0,
      lastLockDate: null,
    });
  },

  // ── Load saved user (called after auth resolves) ─────────────────────────
  loadSavedUser: async (uid) => {
    const data = await loadUser(uid);
    if (!data) return false;

    const { profile, challenge, history } = data;
    if (!profile || !challenge) return false;

    const historyArr = history
      ? Object.entries(history).map(([date, v]) => ({ date, ...v }))
      : [];

    const recomputedStats  = computeStatsFromHistory(historyArr);
    const totalCompleted   = historyArr.filter(h => h.completed).length;
    const recomputedStreak = computeStreak(historyArr);

    const savedTheme = profile.themeColor || DEFAULT_THEME;
    applyTheme(savedTheme);

    set({
      isOnboarded:        true,
      trainerName:        profile.trainerName,
      pokemonChoice:      profile.pokemonChoice,
      pokemonNickname:    profile.pokemonNickname,
      themeColor:         savedTheme,
      totalCompletedDays: totalCompleted,
      totalRestarts:      profile.totalRestarts || 0,
      longestStreak:      Math.max(profile.longestStreak || 0, recomputedStreak),
      currentDay:         totalCompleted + 1,
      currentStreak:      recomputedStreak,
      isLockedIn:         false,
      waterOz:            0,
      todayTasks:         defaultTasks(),
      stats:              recomputedStats,
      evolutionStage:     challenge.evolutionStage || 0,
      lastLockDate:       null,
      history:            historyArr,
      currentScreen:      'today',
    });
    return true;
  },

  // ── Habit grid toggle (new tracker model) ────────────────────────────────
  toggleHistoryTask: async (date, taskKey) => {
    const s = get();
    if (!s.uid || date > todayDate()) return;

    const idx = s.history.findIndex(h => h.date === date);
    const existing = idx >= 0 ? s.history[idx] : null;
    const oldTasks = existing?.tasks || defaultTasks();
    const newTasks = { ...oldTasks, [taskKey]: !oldTasks[taskKey] };
    const completed = Object.values(newTasks).every(Boolean);
    const newEntry  = { ...(existing || {}), date, tasks: newTasks, completed };

    const newHistory = idx >= 0
      ? s.history.map((h, i) => (i === idx ? newEntry : h))
      : [...s.history, newEntry].sort((a, b) => (a.date < b.date ? -1 : 1));

    const newStats         = computeStatsFromHistory(newHistory);
    const totalCompletedDays = newHistory.filter(h => h.completed).length;
    const currentDay       = totalCompletedDays + 1;
    const currentStreak    = computeStreak(newHistory);
    const longestStreak    = Math.max(s.longestStreak, currentStreak);

    const computedEvStage  = totalCompletedDays >= 50 ? 2 : totalCompletedDays >= 25 ? 1 : 0;
    const evolutionStage   = Math.max(s.evolutionStage, computedEvStage);
    let showEvolutionCutscene = s.showEvolutionCutscene;
    let evolutionTarget       = s.evolutionTarget;
    if (evolutionStage > s.evolutionStage) {
      showEvolutionCutscene = true;
      evolutionTarget = EVOLUTION_LINES[s.pokemonChoice][evolutionStage];
    }

    set({ history: newHistory, stats: newStats, totalCompletedDays, currentDay,
          currentStreak, longestStreak, evolutionStage, showEvolutionCutscene, evolutionTarget });

    await saveHistoryEntry(s.uid, date, { tasks: newTasks, completed });
    await saveChallenge(s.uid, {
      currentDay, currentStreak, isLockedIn: false, waterOz: 0,
      todayTasks: defaultTasks(), stats: newStats, evolutionStage, lastLockDate: null,
    });
    await saveProfile(s.uid, {
      trainerName: s.trainerName, pokemonChoice: s.pokemonChoice,
      pokemonNickname: s.pokemonNickname, totalCompletedDays,
      totalRestarts: s.totalRestarts, longestStreak, themeColor: s.themeColor,
    });
  },

  // ── Task toggling (legacy) ────────────────────────────────────────────────
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
    const today   = todayDate();

    if (!allDone) {
      await saveHistoryEntry(s.uid, today, {
        day: s.currentDay, tasks: s.todayTasks, completed: false, waterOz: s.waterOz,
      });
      set({ currentScreen: 'restart' });
      return;
    }

    const newStats = { ...s.stats };
    if (s.todayTasks.diet)                              newStats.discipline = Math.min(STAT_MAX,newStats.discipline + STAT_INCREMENT);
    if (s.todayTasks.read)                              newStats.focus      = Math.min(STAT_MAX,newStats.focus      + STAT_INCREMENT);
    if (s.todayTasks.workout1 && s.todayTasks.workout2) newStats.energy     = Math.min(STAT_MAX,newStats.energy     + STAT_INCREMENT);
    if (s.todayTasks.water)                             newStats.health     = Math.min(STAT_MAX,newStats.health     + STAT_INCREMENT);
    if (s.todayTasks.photo)                             newStats.habits     = Math.min(STAT_MAX,newStats.habits     + STAT_INCREMENT);
    newStats.consistency = Math.min(STAT_MAX,newStats.consistency + STAT_INCREMENT);

    const newDay     = s.currentDay + 1;
    const newStreak  = s.currentStreak + 1;
    const newTotal   = s.totalCompletedDays + 1;
    const newLongest = Math.max(s.longestStreak, newStreak);

    let newEvStage = s.evolutionStage;
    let showEvo    = false;
    let evoTarget  = null;
    if (s.currentDay === 25 && newEvStage === 0) {
      newEvStage = 1; showEvo = true;
      evoTarget  = EVOLUTION_LINES[s.pokemonChoice][1];
    } else if (s.currentDay === 50 && newEvStage === 1) {
      newEvStage = 2; showEvo = true;
      evoTarget  = EVOLUTION_LINES[s.pokemonChoice][2];
    }

    const historyEntry = { day: s.currentDay, tasks: s.todayTasks, completed: true, waterOz: s.waterOz };

    set({
      currentDay: newDay, currentStreak: newStreak,
      totalCompletedDays: newTotal, longestStreak: newLongest,
      stats: newStats, evolutionStage: newEvStage,
      showEvolutionCutscene: showEvo, evolutionTarget: evoTarget,
      isLockedIn: true, lastLockDate: today,
      history: [...s.history, { date: today, ...historyEntry }],
      todayTasks: defaultTasks(), waterOz: 0,
    });

    await saveHistoryEntry(s.uid, today, historyEntry);
    await saveProfile(s.uid, {
      trainerName:        s.trainerName,
      pokemonChoice:      s.pokemonChoice,
      pokemonNickname:    s.pokemonNickname,
      totalCompletedDays: newTotal,
      totalRestarts:      s.totalRestarts,
      longestStreak:      newLongest,
    });
    await saveChallenge(s.uid, {
      currentDay: newDay, currentStreak: newStreak,
      isLockedIn: true, waterOz: 0,
      todayTasks: defaultTasks(),
      stats: newStats, evolutionStage: newEvStage,
      lastLockDate: today,
    });
  },

  dismissEvolution: () => set({ showEvolutionCutscene: false, evolutionTarget: null }),

  // ── Restart ───────────────────────────────────────────────────────────────
  confirmRestart: async () => {
    const s = get();
    const newRestarts = s.totalRestarts + 1;

    set({
      currentDay: 1, currentStreak: 1,
      stats: defaultStats(), evolutionStage: 0,
      isLockedIn: false, todayTasks: defaultTasks(),
      waterOz: 0, lastLockDate: null,
      totalRestarts: newRestarts, currentScreen: 'today',
    });

    await saveProfile(s.uid, {
      trainerName:        s.trainerName,
      pokemonChoice:      s.pokemonChoice,
      pokemonNickname:    s.pokemonNickname,
      totalCompletedDays: s.totalCompletedDays,
      totalRestarts:      newRestarts,
      longestStreak:      s.longestStreak,
    });
    await saveChallenge(s.uid, {
      currentDay: 1, currentStreak: 1,
      isLockedIn: false, waterOz: 0,
      todayTasks: defaultTasks(),
      stats: defaultStats(), evolutionStage: 0,
      lastLockDate: null,
    });
  },
}));

export default useGameStore;
export { EVOLUTION_LINES };
