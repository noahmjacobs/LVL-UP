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

### `computeStatsFromHistory(history)`
Rebuilds all 6 stats from scratch by iterating the full history array. Uses strict `=== true` checks — `'rest'` cells do NOT count. Called every time a cell is toggled so stats always reflect actual data.

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
| `pokemonChoice` | `string\|null` | The base form key (e.g. `'charmander'`) — the CURRENT active line |
| `pokemonNickname` | `string` | Display name for partner, may differ from form name if renamed |

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
| `shinyUnlocked` | `boolean` | Whether shiny is unlocked (avg ≥ 150 at final evo) |
| `showShiny` | `boolean` | User toggle for shiny display |
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

#### `setTrainerName(name)` / `setPokemonChoice(choice)` / `setPokemonNickname(name)`
Simple setters used during onboarding screens.

#### `goToScreen(screen)`
Simple setter: `set({ currentScreen: screen })`.

#### `completeOnboarding()`
Sets `isOnboarded: true`, saves profile + challenge to Firebase, inits `caughtLines: { [pokemonChoice]: 0 }`.

### Data Loading

#### `loadSavedUser(uid)`
Called after auth resolves. Reads all Firebase data, **recomputes stats and streak from scratch**, applies theme, migrates old `caughtPokemon` array → `caughtLines` dict if needed. Returns `true` if data exists, `false` if new user.

Also **syncs the nickname to the current evolution stage** on load: if `pokemonNickname` is still a default name (matches any form in the evolution line via `isDefaultNickname`), it updates it to the name of the current evolved form. This fixes the case where a Pokémon evolved between sessions and the nickname was never updated. If the corrected nickname differs from the saved one, it's written back to Firebase immediately via `updateProfileField`.

### Core Toggle

#### `toggleHistoryTask(date, taskKey)` ⭐ Main action
Toggles a cell in the habit grid. Three-state cycle: `false → true → 'rest' → false`.

1. Find/create history entry for that date
2. Compute new tasks object
3. Set `completed` (all tasks `=== true`)
4. Set `partnerName` from current active Pokémon (only on first log)
5. Recompute stats from full history via `computeStatsFromHistory`
6. Recompute streak, `totalCompletedDays`, `currentDay`
7. Compute evolution stage; trigger cutscene if evolved
8. Update `caughtLines`, `shinyUnlocked`, `canChooseNewPokemon`
9. Update nickname if still default and evolved
10. Persist to Firebase: history entry + challenge + profile

### Appearance

#### `setHabitColor(habitKey, color)`
Updates `habitColors[habitKey]` in state and Firebase profile.

#### `setThemeColor(id)`
Updates `themeColor`, calls `applyTheme(id)` to update CSS vars, saves to Firebase.

### Pokémon Actions

#### `choosePokemon(choice)` (only if `canChooseNewPokemon`)
Picks a new starter after reaching final evo. Resets `evolutionStage: 0`, `shinyUnlocked: false`, `showShiny: false`, `partnerLine: null`. Adds the new line to `caughtLines`.

#### `setPartnerLine(choice | null)`
Switch display partner. `null` = back to active line.

#### `toggleShowShiny()`
Toggle `showShiny` if `shinyUnlocked`. Saved to Firebase.

#### `getCurrentPokemon()` — Computed getter
Returns the sprite name to display. Priority:
1. If `partnerLine !== null` → use that line at its highest stage
2. Otherwise → use `pokemonChoice` at `evolutionStage`
3. If `showShiny && shinyUnlocked` → prefix with `shiny`

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
