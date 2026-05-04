import { create } from 'zustand';
import {
  signInWithGoogle, signOut,
  saveProfile, saveChallenge, saveHistoryEntry, loadUser, updateProfileField,
} from '../firebase';
import { applyTheme, DEFAULT_THEME } from '../constants/themes';

const STAT_MAX       = 252;
const STAT_INCREMENT = 5;

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

const DEFAULT_HABIT_COLORS = {
  diet:     '#FF8C00',
  workout1: '#39FF14',
  workout2: '#00E5FF',
  read:     '#FFD700',
  photo:    '#BB44FF',
  water:    '#4488FF',
};

// ── New helpers ────────────────────────────────────────────────────────────────
const computeAvgStats = (stats) =>
  Object.values(stats).reduce((s, v) => s + v, 0) / Object.keys(stats).length;

const computeEvolutionStageFromStats = (stats) => {
  const avg = computeAvgStats(stats);
  if (avg >= 100) return 2;
  if (avg >= 50)  return 1;
  return 0;
};

// A streak day = all tasks are true or 'rest' (not false/missing)
const isStreakDay = (entry) => {
  if (!entry?.tasks) return false;
  return Object.values(entry.tasks).every(v => v === true || v === 'rest');
};

// startDate (YYYY-MM-DD): when provided, only count entries on/after that date.
// This resets stats to 0 when a new Pokémon is chosen.
// Compute stats for a single partner line — only entries where partnerName is in that line's forms
const computeStatsForChoice = (history, choice) => {
  const forms = new Set(EVOLUTION_LINES[choice] || [choice]);
  const stats = defaultStats();
  for (const h of history) {
    if (!h.tasks) continue;
    if (!forms.has(h.partnerName)) continue;
    if (h.tasks.diet === true)     stats.discipline  = Math.min(STAT_MAX, stats.discipline  + STAT_INCREMENT);
    if (h.tasks.read === true)     stats.focus       = Math.min(STAT_MAX, stats.focus       + STAT_INCREMENT);
    if (h.tasks.workout1 === true && h.tasks.workout2 === true)
                                   stats.energy      = Math.min(STAT_MAX, stats.energy      + STAT_INCREMENT);
    if (h.tasks.water === true)    stats.health      = Math.min(STAT_MAX, stats.health      + STAT_INCREMENT);
    if (h.tasks.photo === true)    stats.habits      = Math.min(STAT_MAX, stats.habits      + STAT_INCREMENT);
    if (Object.values(h.tasks).every(v => v === true))
                                   stats.consistency = Math.min(STAT_MAX, stats.consistency + STAT_INCREMENT);
  }
  return stats;
};

// Compute stats for every caught line at once
const computeAllLineStats = (history, caughtLines) => {
  const result = {};
  for (const choice of Object.keys(caughtLines)) {
    result[choice] = computeStatsForChoice(history, choice);
  }
  return result;
};

const computeStreak = (history) => {
  const streakSet = new Set(history.filter(h => isStreakDay(h)).map(h => h.date));
  let streak = 0;
  const d = new Date(todayDate() + 'T12:00:00');
  while (true) {
    const str = d.toISOString().split('T')[0];
    if (streakSet.has(str)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
};

// Returns true if the nickname is still a default (matches any name in the evolution line)
const isDefaultNickname = (nickname, pokemonChoice) => {
  const line = EVOLUTION_LINES[pokemonChoice] || [];
  return line.map(n => n.toLowerCase()).includes((nickname || '').toLowerCase());
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
  stats:     defaultStats(),
  lineStats: {},   // { [choice]: statsObj } — per-line stats keyed by pokemonChoice

  // ── Theme ────────────────────────────────────────────────────────────────
  themeColor:   DEFAULT_THEME,
  habitColors:  { ...DEFAULT_HABIT_COLORS },

  // ── Pokémon ──────────────────────────────────────────────────────────────
  evolutionStage:        0,
  showEvolutionCutscene: false,
  evolutionTarget:       null,
  // caughtLines: { [pokemonChoice]: highestStage } — one entry per LINE, not per form
  caughtLines:           {},
  partnerLine:           null,   // null = show current active line, or a choice key e.g. 'squirtle'
  partnerSince:          null,   // YYYY-MM-DD when current pokemonChoice was adopted; stats only count from here
  // Per-line shiny state — preserved across partner switches
  shinyLines:            {},     // { [choice]: { unlocked: bool, show: bool } }
  // Per-line custom nicknames — preserved across partner switches
  pokemonNicknames:      {},     // { [choice]: string }
  canChooseNewPokemon:   false,  // true when evolutionStage === 2

  // ── History ──────────────────────────────────────────────────────────────
  history: [],

  // ── Computed ─────────────────────────────────────────────────────────────
  getCurrentPokemon() {
    const { pokemonChoice, evolutionStage, partnerLine, caughtLines, shinyLines } = get();
    let choice, stage;
    if (partnerLine !== null && caughtLines[partnerLine] !== undefined) {
      choice = partnerLine;
      stage  = caughtLines[partnerLine];
    } else {
      choice = pokemonChoice;
      stage  = evolutionStage;
    }
    if (!choice) return null;
    const baseName = EVOLUTION_LINES[choice]?.[stage];
    if (!baseName) return null;
    const lineShiny = shinyLines[choice];
    if (lineShiny?.unlocked && lineShiny?.show) return `shiny${baseName}`;
    return baseName;
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
      // New user — play pokéball intro, then onboarding
      set({ authLoading: false, currentScreen: 'pokeballIntro' });
    } else {
      set({ authLoading: false });
    }
  },

  loginWithGoogle: async () => {
    await signInWithGoogle();
    // onAuthStateChanged in App.jsx handles the rest
  },

  logout: async () => {
    await signOut();
    applyTheme(DEFAULT_THEME);
    set({
      uid: null, isOnboarded: false, trainerName: '',
      pokemonChoice: null, pokemonNickname: '',
      currentScreen: 'title', themeColor: DEFAULT_THEME,
      habitColors: { ...DEFAULT_HABIT_COLORS },
      currentDay: 1, currentStreak: 1, totalCompletedDays: 0,
      totalRestarts: 0, longestStreak: 0, lastLockDate: null,
      todayTasks: defaultTasks(), waterOz: 0, isLockedIn: false,
      stats: defaultStats(), evolutionStage: 0, history: [],
      caughtLines: {}, partnerLine: null, partnerSince: null,
      shinyLines: {}, pokemonNicknames: {}, canChooseNewPokemon: false,
    });
  },

  setHabitColor: async (habitKey, color) => {
    const { uid, habitColors } = get();
    const newColors = { ...habitColors, [habitKey]: color };
    set({ habitColors: newColors });
    if (uid) await updateProfileField(uid, 'habitColors', newColors);
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
  setPokemonNickname: async (name, targetChoice) => {
    const { uid, pokemonChoice, pokemonNicknames } = get();
    const choice = targetChoice || pokemonChoice;
    const newNicknames = { ...pokemonNicknames, [choice]: name };
    // Only update the compat single-string field when editing the active line
    const patch = { pokemonNicknames: newNicknames };
    if (choice === pokemonChoice) patch.pokemonNickname = name;
    set(patch);
    if (uid) {
      if (choice === pokemonChoice) await updateProfileField(uid, 'pokemonNickname', name);
      await updateProfileField(uid, 'pokemonNicknames', newNicknames);
    }
  },
  goToScreen:        (screen) => set({ currentScreen: screen }),

  completeOnboarding: async () => {
    const s = get();
    const initialLines = { [s.pokemonChoice]: 0 };
    set({ isOnboarded: true, currentScreen: 'today', caughtLines: initialLines });
    await saveProfile(s.uid, {
      trainerName:        s.trainerName,
      pokemonChoice:      s.pokemonChoice,
      pokemonNickname:    s.pokemonNickname || s.pokemonChoice,
      totalCompletedDays: 0,
      totalRestarts:      0,
      longestStreak:      0,
      caughtLines:        initialLines,
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

    const partnerSince     = profile.partnerSince || null;
    // Build a temp caughtLines map that always includes the current choice
    const allLines = profile.caughtLines
      ? { ...profile.caughtLines }
      : (profile.pokemonChoice ? { [profile.pokemonChoice]: 0 } : {});
    const recomputedLineStats = computeAllLineStats(historyArr, allLines);
    const recomputedStats     = recomputedLineStats[profile.pokemonChoice] || defaultStats();
    const totalCompleted   = historyArr.filter(h => h.completed).length;
    const recomputedStreak = computeStreak(historyArr);

    const savedTheme = profile.themeColor || DEFAULT_THEME;
    applyTheme(savedTheme);

    // Sync nickname to current evolution stage if user never customized it
    const computedEvStage = Math.max(
      challenge.evolutionStage || 0,
      computeEvolutionStageFromStats(recomputedStats)
    );
    const resolvedNickname = isDefaultNickname(profile.pokemonNickname, profile.pokemonChoice)
      ? (EVOLUTION_LINES[profile.pokemonChoice]?.[computedEvStage] || profile.pokemonNickname)
      : profile.pokemonNickname;

    set({
      isOnboarded:        true,
      trainerName:        profile.trainerName,
      pokemonChoice:      profile.pokemonChoice,
      pokemonNickname:    resolvedNickname,
      themeColor:         savedTheme,
      habitColors:        { ...DEFAULT_HABIT_COLORS, ...(profile.habitColors || {}) },
      totalCompletedDays: totalCompleted,
      totalRestarts:      profile.totalRestarts || 0,
      longestStreak:      Math.max(profile.longestStreak || 0, recomputedStreak),
      currentDay:         totalCompleted + 1,
      currentStreak:      recomputedStreak,
      isLockedIn:         false,
      waterOz:            0,
      todayTasks:         defaultTasks(),
      stats:              recomputedStats,
      lineStats:          recomputedLineStats,
      evolutionStage:     computedEvStage,
      lastLockDate:       null,
      history:            historyArr,
      currentScreen:      'today',
      // Migrate old caughtPokemon array → caughtLines dict
      caughtLines: (() => {
        if (profile.caughtLines) return profile.caughtLines;
        const lines = {};
        // Seed current line at computed stage
        if (profile.pokemonChoice) lines[profile.pokemonChoice] = 0;
        // Migrate old flat array if present
        for (const name of (profile.caughtPokemon || [])) {
          for (const [choice, line] of Object.entries(EVOLUTION_LINES)) {
            const idx = line.indexOf(name);
            if (idx >= 0 && (lines[choice] === undefined || lines[choice] < idx)) {
              lines[choice] = idx;
            }
          }
        }
        return lines;
      })(),
      partnerLine:        profile.partnerLine || null,
      partnerSince:       partnerSince,
      // Load per-line shiny state, migrating legacy global shinyUnlocked/showShiny if needed
      shinyLines: (() => {
        if (profile.shinyLines) return profile.shinyLines;
        // Migrate: old single-bool flags → per-line entry for current pokemon
        const lines = {};
        if (profile.pokemonChoice && profile.shinyUnlocked) {
          lines[profile.pokemonChoice] = { unlocked: true, show: profile.showShiny || false };
        }
        return lines;
      })(),
      // Load per-line nicknames, seeding from current nickname if not stored yet
      pokemonNicknames: (() => {
        if (profile.pokemonNicknames) return profile.pokemonNicknames;
        const nicks = {};
        if (profile.pokemonChoice) {
          nicks[profile.pokemonChoice] = resolvedNickname;
        }
        return nicks;
      })(),
      canChooseNewPokemon: profile.canChooseNewPokemon || false,
    });

    // If nickname was out of sync, write the corrected value back to Firebase
    if (resolvedNickname !== profile.pokemonNickname) {
      await updateProfileField(uid, 'pokemonNickname', resolvedNickname);
    }
    // First-time migration: persist pokemonNicknames to Firebase if it didn't exist
    if (!profile.pokemonNicknames && profile.pokemonChoice) {
      await updateProfileField(uid, 'pokemonNicknames', { [profile.pokemonChoice]: resolvedNickname });
    }

    return true;
  },

  // ── Habit grid toggle (new tracker model) ────────────────────────────────
  toggleHistoryTask: async (date, taskKey) => {
    const s = get();
    if (!s.uid || date > todayDate()) return;

    const idx = s.history.findIndex(h => h.date === date);
    const existing = idx >= 0 ? s.history[idx] : null;
    const oldTasks = existing?.tasks || defaultTasks();

    const oldVal = oldTasks[taskKey] ?? false;
    const newVal = oldVal === false ? true : oldVal === true ? 'rest' : false;
    const newTasks = { ...oldTasks, [taskKey]: newVal };
    const completed = Object.values(newTasks).every(v => v === true);

    // Record which Pokémon was active the first time this day was logged
    const activePokemonName = EVOLUTION_LINES[s.pokemonChoice]?.[s.evolutionStage] || s.pokemonChoice;
    const newEntry = {
      ...(existing || {}),
      date, tasks: newTasks, completed,
      partnerName: existing?.partnerName || activePokemonName,
    };

    const newHistory = idx >= 0
      ? s.history.map((h, i) => (i === idx ? newEntry : h))
      : [...s.history, newEntry].sort((a, b) => (a.date < b.date ? -1 : 1));

    // Compute stats per partner line, keyed by partnerName in each history entry
    const linesForStats    = { ...s.caughtLines, [s.pokemonChoice]: s.evolutionStage };
    const newLineStats     = computeAllLineStats(newHistory, linesForStats);
    const newStats         = newLineStats[s.pokemonChoice] || defaultStats();
    const totalCompletedDays = newHistory.filter(h => h.completed).length;
    const currentDay       = totalCompletedDays + 1;
    const currentStreak    = computeStreak(newHistory);
    const longestStreak    = Math.max(s.longestStreak, currentStreak);

    const avgStats          = computeAvgStats(newStats);
    const computedEvStage   = computeEvolutionStageFromStats(newStats);
    const evolutionStage    = Math.max(s.evolutionStage, computedEvStage);

    // Update caughtLines — one entry per line at its highest stage
    const newCaughtLines = { ...s.caughtLines };
    if (newCaughtLines[s.pokemonChoice] === undefined || evolutionStage > newCaughtLines[s.pokemonChoice]) {
      newCaughtLines[s.pokemonChoice] = evolutionStage;
    }

    // Shiny unlocks per-line at avg 150 when at final evo
    const lineWasUnlocked = s.shinyLines[s.pokemonChoice]?.unlocked || false;
    const lineNowUnlocked = lineWasUnlocked || (evolutionStage === 2 && avgStats >= 150);
    const newShinyLines   = {
      ...s.shinyLines,
      [s.pokemonChoice]: { unlocked: lineNowUnlocked, show: s.shinyLines[s.pokemonChoice]?.show || false },
    };
    const canChooseNewPokemon = evolutionStage === 2;

    let showEvolutionCutscene = s.showEvolutionCutscene;
    let evolutionTarget       = s.evolutionTarget;
    let pokemonNickname       = s.pokemonNickname;
    if (evolutionStage > s.evolutionStage) {
      showEvolutionCutscene = true;
      evolutionTarget = EVOLUTION_LINES[s.pokemonChoice][evolutionStage];
      // Only update the nickname if the user never customized it
      if (isDefaultNickname(s.pokemonNickname, s.pokemonChoice)) {
        pokemonNickname = evolutionTarget;
      }
    }

    // Also update per-line nicknames if the nickname auto-updated on evolution
    const newPokemonNicknames = { ...s.pokemonNicknames, [s.pokemonChoice]: pokemonNickname };

    set({ history: newHistory, stats: newStats, lineStats: newLineStats, totalCompletedDays, currentDay,
          currentStreak, longestStreak, evolutionStage, showEvolutionCutscene,
          evolutionTarget, pokemonNickname, caughtLines: newCaughtLines,
          shinyLines: newShinyLines, pokemonNicknames: newPokemonNicknames, canChooseNewPokemon });

    await saveHistoryEntry(s.uid, date, { tasks: newTasks, completed, partnerName: newEntry.partnerName });
    await saveChallenge(s.uid, {
      currentDay, currentStreak, isLockedIn: false, waterOz: 0,
      todayTasks: defaultTasks(), stats: newStats, evolutionStage, lastLockDate: null,
    });
    await saveProfile(s.uid, {
      trainerName: s.trainerName, pokemonChoice: s.pokemonChoice,
      pokemonNickname, totalCompletedDays,
      totalRestarts: s.totalRestarts, longestStreak, themeColor: s.themeColor,
      caughtLines: newCaughtLines, shinyLines: newShinyLines, pokemonNicknames: newPokemonNicknames,
      canChooseNewPokemon,
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

    let newEvStage      = s.evolutionStage;
    let showEvo         = false;
    let evoTarget       = null;
    let newNickname     = s.pokemonNickname;
    if (s.currentDay === 25 && newEvStage === 0) {
      newEvStage = 1; showEvo = true;
      evoTarget  = EVOLUTION_LINES[s.pokemonChoice][1];
      if (isDefaultNickname(s.pokemonNickname, s.pokemonChoice)) newNickname = evoTarget;
    } else if (s.currentDay === 50 && newEvStage === 1) {
      newEvStage = 2; showEvo = true;
      evoTarget  = EVOLUTION_LINES[s.pokemonChoice][2];
      if (isDefaultNickname(s.pokemonNickname, s.pokemonChoice)) newNickname = evoTarget;
    }

    const historyEntry = { day: s.currentDay, tasks: s.todayTasks, completed: true, waterOz: s.waterOz };

    set({
      currentDay: newDay, currentStreak: newStreak,
      totalCompletedDays: newTotal, longestStreak: newLongest,
      stats: newStats, evolutionStage: newEvStage,
      showEvolutionCutscene: showEvo, evolutionTarget: evoTarget,
      pokemonNickname: newNickname,
      isLockedIn: true, lastLockDate: today,
      history: [...s.history, { date: today, ...historyEntry }],
      todayTasks: defaultTasks(), waterOz: 0,
    });

    await saveHistoryEntry(s.uid, today, historyEntry);
    await saveProfile(s.uid, {
      trainerName:        s.trainerName,
      pokemonChoice:      s.pokemonChoice,
      pokemonNickname:    newNickname,
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

  // ── Choose a new starter after reaching final evolution ───────────────────
  choosePokemon: async (choice) => {
    const s = get();
    if (!s.canChooseNewPokemon) return;
    // Block any line already in the Pokédex — can never re-catch a line
    if (s.caughtLines[choice] !== undefined) return;
    const today = todayDate();
    // Add new line at stage 0; preserve all existing caught lines
    const newCaughtLines = { ...s.caughtLines, [choice]: 0 };
    // Preserve shiny state for old lines; initialize new line at unlocked:false
    const newShinyLines      = { ...s.shinyLines, [choice]: { unlocked: false, show: false } };
    // Preserve nicknames for old lines; initialize new line with starter name
    const newPokemonNicknames = { ...s.pokemonNicknames, [choice]: choice };
    // Preserve per-line stats for old lines; new line starts empty
    const newLineStats       = { ...s.lineStats, [choice]: defaultStats() };

    set({
      pokemonChoice: choice,
      pokemonNickname: choice,
      evolutionStage: 0,
      stats: defaultStats(),
      lineStats: newLineStats,
      canChooseNewPokemon: false,
      shinyLines: newShinyLines,
      pokemonNicknames: newPokemonNicknames,
      partnerLine: null,
      partnerSince: today,
      caughtLines: newCaughtLines,
      currentScreen: 'today',
    });
    await saveProfile(s.uid, {
      trainerName: s.trainerName,
      pokemonChoice: choice,
      pokemonNickname: choice,
      totalCompletedDays: s.totalCompletedDays,
      totalRestarts: s.totalRestarts,
      longestStreak: s.longestStreak,
      caughtLines: newCaughtLines,
      canChooseNewPokemon: false,
      shinyLines: newShinyLines,
      pokemonNicknames: newPokemonNicknames,
      partnerLine: null,
      partnerSince: today,
    });
    // Reset challenge so evolutionStage:0 is persisted — prevents stale value on reload
    await saveChallenge(s.uid, {
      currentDay: s.totalCompletedDays + 1,
      currentStreak: s.currentStreak,
      isLockedIn: false, waterOz: 0,
      todayTasks: defaultTasks(),
      stats: defaultStats(),
      evolutionStage: 0,
      lastLockDate: null,
    });
  },

  // Switch display partner to another caught line (null = back to current active)
  setPartnerLine: async (choice) => {
    const { uid } = get();
    set({ partnerLine: choice });
    if (uid) await updateProfileField(uid, 'partnerLine', choice);
  },

  toggleShowShiny: async (choice) => {
    const { uid, shinyLines } = get();
    const line = shinyLines[choice];
    if (!line?.unlocked) return;
    const newLine      = { ...line, show: !line.show };
    const newShinyLines = { ...shinyLines, [choice]: newLine };
    set({ shinyLines: newShinyLines });
    if (uid) await updateProfileField(uid, 'shinyLines', newShinyLines);
  },

  // ── History notes ─────────────────────────────────────────────────────────
  setHistoryNote: async (date, taskKey, note) => {
    const { uid, history } = get();
    if (!uid) return;
    const idx = history.findIndex(h => h.date === date);
    if (idx < 0) return;
    const entry = history[idx];
    const newNotes = { ...(entry.notes || {}), [taskKey]: note };
    const newEntry = { ...entry, notes: newNotes };
    const newHistory = history.map((h, i) => i === idx ? newEntry : h);
    set({ history: newHistory });
    await saveHistoryEntry(uid, date, { tasks: entry.tasks, completed: entry.completed, notes: newNotes });
  },

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
