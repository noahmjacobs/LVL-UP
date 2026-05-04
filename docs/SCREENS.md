# Screens

All screens live in `src/screens/`. Navigation is Zustand state (`currentScreen`), no React Router.

---

## Screen Routing (App.jsx)

```
'title'           → TitleScreen (login)
'professor'       → ProfessorIntro (onboarding step 1)
'nameEntry'       → NameEntry (onboarding step 2)
'starterSelect'   → StarterSelect (onboarding step 3)
'today'           → Today + NavBar
'stats'           → Stats + NavBar
'history'         → History + NavBar
'profile'         → Profile + NavBar
'restart'         → RestartScreen (full-screen, no NavBar)
'chooseNewPokemon'→ ChooseNewPokemon (full-screen, no NavBar)
```

Onboarding screens and `'restart'`/`'title'`/`'chooseNewPokemon'` do NOT show `<NavBar>`.

`showEvolutionCutscene` triggers `<EvolutionCutscene>` as an overlay on top of any screen.

---

## Today.jsx + Today.css

**The main habit grid tracker.**

### Layout
```
┌─────────────────────────────┐
│ Header: DAY X/75 + Pokémon  │
├────────┬────────────────────┤
│ Labels │ Scrollable Day Grid│
│ col    │ (horizontal scroll)│
└────────┴────────────────────┘
```

Fixed label column (`.tracker-labels-col`) is outside the scroll container so it stays pinned while the day columns scroll horizontally.

### Key Constants
- `HABITS` — array of `{ key, label, defaultColor }` for each of the 6 tasks
- `COLOR_SWATCHES` — 9 hex colors available in the color picker
- `DAYS_BACK = 89` — how many past days to show (90 total including today)
- `DAYS` — built once at module load; each item: `{ date, dayName, dayNum, month, isToday, showMonth }`

### State from Store
- `history` — full history array; converted to `historyMap[date][key]` for O(1) lookups
- `toggleHistoryTask(date, key)` — called on cell click
- `habitColors` + `setHabitColor` — per-habit custom colors
- `getCurrentPokemon()` — which sprite to show in header
- `pokemonChoice` + `partnerLine` — to compute `displayChoice = partnerLine || pokemonChoice`
- `typeColor = getPokemonTypeColor(displayChoice)` — passed as `glowColor` to `<PokemonSprite>`

### Cell Rendering Logic
```js
cellState = historyMap[date]?.[key] ?? false  // false | true | 'rest'

// false  → dark empty cell
// true   → solid habit color + glow box-shadow
// 'rest' → diagonal gradient (half color, half dark)
```
Clicking a cell in edit mode does nothing (edit mode is for color picking only).

### Sprite
`<PokemonSprite name={pokemon} size="md" glow bounce glowColor={typeColor} />`  
Type-color glow is applied. Shiny is handled automatically by `getCurrentPokemon()` returning `shiny${name}` when active.

### Edit Mode
- Toggle via ✏ button in the corner cell (`.tracker-corner`)
- In edit mode, label items are clickable → opens color picker popup
- Color dot indicator appears next to each label in edit mode
- Color picker overlay (`.color-picker-overlay`) shows 9 swatches; clicking picks color and closes

### Scroll Behavior
- `scrollRef` scrolls to rightmost (today) on mount
- Mouse drag to scroll: `onMouseDown`/`onMouseMove`/`onMouseUp` on `.tracker-scroll`

### CSS Variables
```css
--label-col-w: 72px
--cell-w: calc((min(100vw, 430px) - var(--label-col-w)) / 7)
```
7 cells visible at a time in the viewport.

---

## Stats.jsx + Stats.css

**Pokémon-style stat overview.**

### Displays
- Pokémon sprite centered at top (`size="lg"`, no glow, bounce only), nickname below
- Radar chart (spider chart) — interior and stroke colored by Pokémon type
- List of 6 stat rows, each with: label, value `/252`, progress bar, description

No day counter or progress bar — those belong on the History screen.

### Type Color
`getPokemonTypeColor(partnerLine || pokemonChoice)` — always uses the DISPLAYED Pokémon's type.  
Fire=#FF6B35, Water=#4488FF, Grass=#48D050. Passed to `<RadarChart>` and stat bar fills/values.

### Nickname
Uses `pokemonNicknames[displayChoice]`, falling back to the form name from `EVOLUTION_LINES`, then the choice key.  
`displayChoice = partnerLine || pokemonChoice`

### STAT_INFO
```js
{ key: 'discipline', label: 'DISCIPLINE', desc: 'Following your diet...' }
// ... 6 entries total
```

---

## History.jsx + History.css

**75-day calendar log with day detail + notes.**

### Layout
```
CHALLENGE LOG header
Challenge progress bar (X% COMPLETE)
Legend (green=complete, red=fail, gray=future)
10-column calendar grid (75 tiles)
Day detail card (shown when tile clicked)
Note editor modal (shown when editing a note)
```

### Progress Bar
- `completedThisRun` = history entries where `h.completed === true` AND `h.date >= partnerSince` (or all-time if `partnerSince` is null)
- `progressPct = Math.min(100, Math.round((completedThisRun / 75) * 100))`
- Only fully completed days (all 6 tasks `=== true`) count — partial/rest days do not

### Calendar Grid
- 75 tiles representing Days 1–75
- Built from `currentDay` and `historyMap` (date → entry)
- Tile states: `done` (green), `fail` (red), `future` (gray)
- Clicking a done/fail tile → `selectDay()` → shows detail card
- Clicking same tile again → deselects

### Day Detail Card
Shown when `selected && liveEntry`:
- Header: DAY number, date string, PASS/FAIL badge
- `liveEntry.partnerName` → `<PokemonSprite>` + name (shows which Pokémon was active that day)
- Task rows: ✅/❌ per task + note indicators
- Footer: "✎ NOTES" / "DONE" edit toggle button

### Notes Feature
**View mode (editMode = false):**
- ⓘ button appears on tasks that have a saved note
- Clicking ⓘ toggles an inline `note-popup` below that row

**Edit mode (editMode = true):**
- All task rows become clickable
- `✎` or `+` hint appears on each row
- Clicking a row → opens note editor modal

**Note Editor Modal:**
- Textarea (4 rows) with placeholder
- CANCEL → closes, discards
- SAVE → calls `setHistoryNote(date, taskKey, noteInput.trim())`

### State
```js
selected     // { dayNum, dateStr, entry } | null
editMode     // boolean
editingTask  // taskKey being edited | null
noteInput    // current textarea value
notePopup    // taskKey whose info popup is shown | null
```

`liveEntry = historyMap[selected.dateStr]` — always reads from live store so note saves reflect immediately without re-selecting.

### TASK_LABELS
```js
{ diet: 'Diet', workout1: 'Workout 1', workout2: 'Workout 2 (Outdoor)', water: 'Water', read: 'Read', photo: 'Photo' }
```

---

## Profile.jsx + Profile.css

**Trainer card, stats grid, Pokédex, theme/shiny controls.**

### Sections

#### Trainer Card
- Trainer name + current Pokémon sprite (glow = type color from `getPokemonTypeColor(displayChoice)`)
- Partner nickname (`pokemonNicknames[displayChoice]` with form-name fallback) + RENAME/SAVE button
- Evolution stage stars: `★★☆` etc. based on `displayStage`
- RENAME button is hidden when `partnerLine !== null` (can only rename your active Pokémon)

#### Stats Grid (2-column)
2 tiles: **CURRENT DAY**, **STREAK**

#### Pokédex (`caughtLines`)
- Renders `Object.entries(caughtLines).map(([choice, stage]) => ...)`
- Each entry shows `EVOLUTION_LINES[choice][stage]` — the current form of that LINE
- ALL entries are clickable (pointer cursor):
  - Clicking a non-active line: sets it as `partnerLine` (toggles off if already selected)
  - Clicking the active line (`pokemonChoice`): clears `partnerLine` (returns to active display)
- Currently displayed entry highlighted with `.pokedex-entry--active` (green border)
- `isDisplayed = (partnerLine === choice) || (!partnerLine && isCurrentLine)`
- **Shiny star button:** appears on **any** caught final-form (`stage === 2`) where `shinyLines[choice]?.unlocked === true`
  - `☆` when off, `★` (gold glow) when on
  - `onClick` → `toggleShowShiny(choice)` — passes the specific line's choice key
  - This means you can toggle shiny on old partner lines (e.g. emboar) even while a different Pokémon (e.g. piplup) is your active partner

#### `displayChoice` / `displayStage`
```js
const displayChoice = partnerLine || pokemonChoice;
const displayStage  = partnerLine !== null && caughtLines[partnerLine] !== undefined
  ? caughtLines[partnerLine]
  : evolutionStage;
```

#### Nickname display
```js
const displayNickname = pokemonNicknames[displayChoice]
  || EVOLUTION_LINES[displayChoice]?.[displayStage]
  || displayChoice;
```
Reads from the per-line `pokemonNicknames` map so both the active Pokémon's custom name and any old partner's custom name are shown correctly.

#### Choose New Partner Button
Only shown if `canChooseNewPokemon`. Routes to `'chooseNewPokemon'` screen.

#### Footer Quote
Static inspirational quote card.

#### Accent Color Button
Opens theme picker overlay (`.theme-overlay`). 9 color swatches in a 3-column grid. Calls `setThemeColor(id)`.

#### Sign Out
Calls `logout()` action.

---

## RestartScreen.jsx

Shown when `currentScreen === 'restart'`. Sad animation, challenge restart confirmation. Calls `confirmRestart()`.

---

## ChooseNewPokemon.jsx

Available when `evolutionStage === 2`. Full-screen starter picker showing all 27 starters (9 gens × 3 types). Checks `caughtLines[choice] !== undefined` — any previously caught line is dimmed with a "CAUGHT" badge and is not selectable. Selecting a new one calls `choosePokemon(choice)`.

---

## Onboarding Screens

### TitleScreen.jsx
Login screen. Google + Apple sign-in buttons. Calls `loginWithGoogle()` / `loginWithApple()`.

### ProfessorIntro.jsx
Professor Oak–style intro. Just a narrative screen, advances to `'nameEntry'`.

### NameEntry.jsx
Text input for trainer name. Calls `setTrainerName(name)`.

### StarterSelect.jsx
Gen 1 starter picker (Charmander, Squirtle, Bulbasaur). Calls `setPokemonChoice(choice)` then `completeOnboarding()`.
