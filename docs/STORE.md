# Zustand Store — useGameStore.js

**File:** `src/store/useGameStore.js`

Single Zustand store for all app state. No persistence middleware — everything syncs directly to Firebase.

---

## Constants (module-level)

```js
STAT_MAX       = 252   // Pokémon EV cap, stat ceiling
STAT_INCREMENT = 5     // Points added per qualifying day

EVOLUTION_LINES = {
  charmander: ['charmander', 'charmeleon', 'charizard'],
  squirtle:   ['squirtle', 'wartortle', 'blastoise'],
  bulbasaur:  ['bulbasaur', 'ivysaur', 'venusaur'],
  // ... all 9 gens of starters (27 lines total)
}
```

---

## Pure Helper Functions (module-level)

These run outside the store and have no side effects.

### `computeAvgStats(stats)`
Returns the mean of all 6 stat values. Used to determine evolution stage and shiny unlock.

### `computeEvolutionStageFromStats(stats)`
Returns `0`, `1`, or `2` based on avg:
- `< 50` → 0
- `≥ 50` → 1  
- `≥ 100` → 2

### `isStreakDay(entry)`
Returns `true` if every task in `entry.tasks` is `true` or `'rest'` (no `false`).

### `computeStatsFromHistory(history, startDate?)`
Rebuilds all 6 stats from scratch by iterating the history array. Optional `startDate` (YYYY-MM-DD) skips any entries before that date — used to give each new Pokémon partner a fresh stat count. Uses strict `=== true` checks — `'rest'` cells do NOT count.

### `computeStreak(history)`
Counts consecutive streak days backward from today. A day is in the streak if `isStreakDay` returns true.

### `isDefaultNickname(nickname, pokemonChoice)`
Returns `true` if the nickname matches any form name in the evolution line (case-insensitive). Used to determine if nickname should auto-update on evolution.

### `defaultTasks()`
Returns `{ diet: false, workout1: false, workout2: false, water: false, read: false, photo: false }`.

### `defaultStats()`
Returns `{ discipline: 0, focus: 0, energy: 0, health: 0, habits: 0, consistency: 0 }`.

---

## State Shape

### Auth
| Field | Type | Description |
|-------|------|-------------|
| `uid` | `string\|null` | Firebase UID of logged-in user |
| `authLoading` | `boolean` | True while Firebase resolves auth on startup |

### Onboarding
| Field | Type | Description |
|-------|------|-------------|
| `isOnboarded` | `boolean` | Whether user completed onboarding |
| `trainerName` | `string` | Chosen trainer name |
| `pokemonChoice` | `string\|null` | The base form key of the CURRENT active line (e.g. `'charmander'`) |
| `pokemonNickname` | `string` | Display name for the active partner (kept in sync with `pokemonNicknames[pokemonChoice]`) |

### Navigation
| Field | Type | Values |
|-------|------|--------|
| `currentScreen` | `string` | `'title'` `'professor'` `'nameEntry'` `'starterSelect'` `'today'` `'stats'` `'history'` `'profile'` `'restart'` `'chooseNewPokemon'` |

### Challenge
| Field | Type | Description |
|-------|------|-------------|
| `currentDay` | `number` | `totalCompletedDays + 1` |
| `currentStreak` | `number` | Consecutive streak days |
| `totalCompletedDays` | `number` | History entries where `completed === true` |
| `totalRestarts` | `number` | How many times challenge was restarted |
| `longestStreak` | `number` | All-time best streak |
| `lastLockDate` | `string\|null` | ISO date of last locked day (legacy) |

### Today (legacy flow)
| Field | Type | Description |
|-------|------|-------------|
| `todayTasks` | `object` | `{ diet, workout1, workout2, water, read, photo }` each `boolean` |
| `waterOz` | `number` | Current water intake 0–128 |
| `isLockedIn` | `boolean` | Whether today is locked (legacy Lock In flow) |

### Stats
| Field | Type | Description |
|-------|------|-------------|
| `stats` | `object` | `{ discipline, focus, energy, health, habits, consistency }` each 0–252 |

### Theme & Appearance
| Field | Type | Description |
|-------|------|-------------|
| `themeColor` | `string` | Theme ID e.g. `'green'`, `'blue'` |
| `habitColors` | `object` | `{ diet, workout1, workout2, read, photo, water }` hex color per habit |

### Pokémon
| Field | Type | Description |
|-------|------|-------------|
| `evolutionStage` | `0\|1\|2` | Current stage of active line |
| `showEvolutionCutscene` | `boolean` | Triggers `<EvolutionCutscene>` overlay |
| `evolutionTarget` | `string\|null` | Name of Pokémon being evolved into (for cutscene) |
| `caughtLines` | `object` | `{ [pokemonChoice]: highestStage }` — one key per caught LINE |
| `partnerLine` | `string\|null` | Which non-active caught line to display; `null` = active line |
| `partnerSince` | `string\|null` | YYYY-MM-DD when current `pokemonChoice` was adopted. Stats only count from this date forward. |
| `shinyLines` | `object` | `{ [choice]: { unlocked: bool, show: bool } }` — per-line shiny state, preserved across partner switches |
| `pokemonNicknames` | `object` | `{ [choice]: string }` — per-line custom nickname, preserved across partner switches |
| `canChooseNewPokemon` | `boolean` | True when `evolutionStage === 2` |

### History
| Field | Type | Description |
|-------|------|-------------|
| `history` | `array` | `[{ date, tasks, completed, partnerName, notes? }]` sorted by date |

---

## Actions

### Auth Actions

#### `handleAuthResolved(firebaseUser)`
Called by `onAuthStateChanged` in App.jsx. If user exists → `loadSavedUser`. If no user → go to `'title'` screen.

#### `loginWithGoogle()` / `loginWithApple()`
Triggers Firebase popup auth. `onAuthStateChanged` handles post-login state.

#### `logout()`
Signs out of Firebase, resets all store state to defaults, goes to `'title'`.

### Onboarding Actions

#### `setTrainerName(name)` / `setPokemonChoice(choice)`
Simple setters used during onboarding screens.

#### `setPokemonNickname(name)` (async)
Updates `pokemonNickname` and `pokemonNicknames[pokemonChoice]` in state. Persists both `pokemonNickname` and `pokemonNicknames` to Firebase via `updateProfileField`.

#### `goToScreen(screen)`
Simple setter: `set({ currentScreen: screen })`.

#### `completeOnboarding()`
Sets `isOnboarded: true`, saves profile + challenge to Firebase, inits `caughtLines: { [pokemonChoice]: 0 }`.

### Data Loading

#### `loadSavedUser(uid)`
Called after auth resolves. Reads all Firebase data, **recomputes stats and streak from scratch**, applies theme, migrates old `caughtPokemon` array → `caughtLines` dict if needed. Returns `true` if data exists, `false` if new user.

**Shiny migration:** If `profile.shinyLines` doesn't exist yet (old data), reads legacy `profile.shinyUnlocked` and `profile.showShiny` and synthesizes `shinyLines: { [pokemonChoice]: { unlocked, show } }`.

**Nickname migration:** If `profile.pokemonNicknames` doesn't exist yet (old data), seeds `pokemonNicknames: { [pokemonChoice]: resolvedNickname }` and writes it back to Firebase.

Also **syncs the nickname to the current evolution stage** on load: if `pokemonNickname` is still a default name (matches any form in the evolution line via `isDefaultNickname`), it updates it to the name of the current evolved form and writes back to Firebase.

### Core Toggle

#### `toggleHistoryTask(date, taskKey)` ⭐ Main action
Toggles a cell in the habit grid. Three-state cycle: `false → true → 'rest' → false`.

1. Find/create history entry for that date
2. Compute new tasks object
3. Set `completed` (all tasks `=== true`)
4. Set `partnerName` from current active Pokémon (only on first log)
5. Recompute stats from history via `computeStatsFromHistory(newHistory, partnerSince)`
6. Recompute streak, `totalCompletedDays`, `currentDay`
7. Compute evolution stage; trigger cutscene if evolved
8. Update `caughtLines` and per-line shiny state in `shinyLines[pokemonChoice]`
9. Update `pokemonNicknames[pokemonChoice]` if nickname auto-updated on evolution
10. Persist to Firebase: history entry + challenge + profile (including `shinyLines`, `pokemonNicknames`)

### Appearance

#### `setHabitColor(habitKey, color)`
Updates `habitColors[habitKey]` in state and Firebase profile.

#### `setThemeColor(id)`
Updates `themeColor`, calls `applyTheme(id)` to update CSS vars, saves to Firebase.

### Pokémon Actions

#### `choosePokemon(choice)` (only if `canChooseNewPokemon`)
Picks a new starter after reaching final evo. Guards against re-selecting any line already in `caughtLines`. Resets `evolutionStage: 0`, `stats: defaultStats()`, `partnerLine: null`. Sets `partnerSince: today`. Adds the new line to `caughtLines` at stage 0. **Preserves `shinyLines` for all previously caught lines** (only adds `{ [choice]: { unlocked: false, show: false } }` for the new line). Saves full profile to Firebase.

#### `setPartnerLine(choice | null)`
Switch display partner. `null` = back to active line. Saves to Firebase.

#### `toggleShowShiny(choice)` (async)
Toggles `shinyLines[choice].show` for the specified line (if that line has `unlocked: true`). Updates `shinyLines` in state and saves the full `shinyLines` map to Firebase via `updateProfileField`.

#### `getCurrentPokemon()` — Computed getter
Returns the sprite name to display. Priority:
1. If `partnerLine !== null` → use that line at its highest stage from `caughtLines`
2. Otherwise → use `pokemonChoice` at `evolutionStage`
3. If `shinyLines[choice].unlocked && shinyLines[choice].show` → prefix with `shiny`

### Notes

#### `setHistoryNote(date, taskKey, note)`
Adds/updates a note on a specific task for a history entry. Saves to Firebase.

### Legacy

#### `toggleTask(taskKey)` / `setWaterOz(oz)` / `lockInDay()` / `confirmRestart()`
Old lock-in flow. `lockInDay` still handles day-based evolution (Day 25, Day 50) and writes history. `confirmRestart` resets day/streak/stats but preserves history and `totalCompletedDays`.

#### `dismissEvolution()`
Hides the evolution cutscene.

---

## Exports

```js
export default useGameStore;
export { EVOLUTION_LINES };  // used by Profile.jsx for Pokédex rendering
```
