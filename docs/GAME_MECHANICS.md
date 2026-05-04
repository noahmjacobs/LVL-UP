# Game Mechanics

## Overview
LVL UP is a gamified habit tracker for the **75 TUFF** challenge (75 Hard rules). Progress is tracked via a Pokémon RPG stat/evolution system.

---

## The 6 Daily Tasks

| Task Key   | Label              | Stat It Feeds  |
|------------|--------------------|----------------|
| `diet`     | Diet               | `discipline`   |
| `workout1` | Workout 1          | `energy` (both needed) |
| `workout2` | Outdoor Workout    | `energy` (both needed) |
| `water`    | Water (128 oz)     | `health`       |
| `read`     | Read 10 pages      | `focus`        |
| `photo`    | Progress photo     | `habits`       |

`consistency` gains +5 when **all 6 tasks** are `true` (not `'rest'`).

---

## Three-State Cells

Each task cell on the Today grid cycles through three states:

| State    | Value      | Visual                          | Counts for stats? | Counts for streak? |
|----------|------------|--------------------------------|-------------------|--------------------|
| Empty    | `false`    | Dark background                 | ❌                | ❌                 |
| Complete | `true`     | Solid habit color + glow        | ✅                | ✅                 |
| Rest     | `'rest'`   | Diagonal half-color gradient    | ❌                | ✅                 |

Toggle cycle: `false → true → 'rest' → false`

**Important:** `computeStatsFromHistory` uses strict `=== true` checks. `'rest'` is truthy in JS but does NOT increment stats.

---

## Stats System

- **6 stats:** `discipline`, `focus`, `energy`, `health`, `habits`, `consistency`
- **Max value:** 252 (STAT_MAX) — Pokémon EV cap reference
- **Increment:** +5 per qualifying day (STAT_INCREMENT)
- **Derived:** Stats are **recomputed from scratch** every time `toggleHistoryTask` runs via `computeStatsFromHistory(history)`. They are NOT stored cumulatively.

### Thresholds for Evolution

```
avg ≥ 50  → Evolution Stage 1 (mid form)
avg ≥ 100 → Evolution Stage 2 (final form)
avg ≥ 150 → Shiny unlocked (at final evo only)
```

`computeAvgStats(stats)` = sum of all 6 / 6

`computeEvolutionStageFromStats(stats)` returns 0, 1, or 2.

Evolution stage always uses `Math.max(s.evolutionStage, computedEvStage)` — it never goes backward.

---

## Streak System

A day counts for streak if **all tasks are `true` OR `'rest'`** (none are `false`).

```js
const isStreakDay = (entry) =>
  entry?.tasks && Object.values(entry.tasks).every(v => v === true || v === 'rest');
```

`computeStreak(history)` counts backward from today, stopping at the first non-streak day.

---

## currentDay Logic

`currentDay = totalCompletedDays + 1`

`totalCompletedDays` = count of history entries where `completed === true`  
`completed` = all 6 tasks are `true` (strict)

---

## Evolution System

### Stat-based (main mechanic)
Evolution is triggered inside `toggleHistoryTask` every time a cell is toggled:
1. Recompute stats from full history
2. Compute `computedEvStage` from avg
3. `evolutionStage = Math.max(s.evolutionStage, computedEvStage)`
4. If stage increased → show evolution cutscene, update nickname if it's still a default

### Legacy day-based (in `lockInDay`)
Still present for compatibility: evolves at Day 25 → stage 1, Day 50 → stage 2. This path is only triggered if user uses "Lock In" flow.

### Nickname auto-update on evolution
`isDefaultNickname(nickname, pokemonChoice)` returns `true` if the nickname matches ANY form name in the evolution line (case-insensitive). If true, nickname auto-updates to the new evolved form name.

---

## Pokédex / caughtLines

- `caughtLines: { [pokemonChoice]: highestStage }` — one entry per evolution LINE
- A line represents the SAME Pokémon growing (charmander → charmeleon → charizard = 1 entry)
- Updated on every `toggleHistoryTask` call
- `partnerLine: null | 'squirtle'` — which non-active line to display as "partner" in the UI. `null` means show current active line.

### Choosing a New Pokémon
Available when `evolutionStage === 2` (`canChooseNewPokemon = true`).  
`choosePokemon(choice)` resets `evolutionStage` to 0, adds the new line to `caughtLines` at stage 0, resets `shinyUnlocked`/`showShiny`.

**Blocked if the line is already in `caughtLines`** — each line can only be caught once, ever. The UI shows already-caught lines as dimmed with a "CAUGHT" badge.

**`partnerSince`** — set to today's date when `choosePokemon` is called. `computeStatsFromHistory` filters out any history entries before this date, so the new Pokémon's stats start at 0 and only accumulate from new task completions.

---

## Shiny System

- Unlocks when `evolutionStage === 2` AND `avgStats >= 150`
- `shinyUnlocked` flag saved to Firebase profile
- `showShiny` is a user toggle (☆ star in Pokédex entry for the current final-form)
- When shiny is active, `getCurrentPokemon()` returns `shiny${baseName}` (e.g. `shinyChaizard`)
- Sprite files: `public/sprites/shiny{Name}.gif` (currently only Gen 1 starters have shiny sprites)

---

## History Entry Structure

```js
{
  date: 'YYYY-MM-DD',
  tasks: { diet: true|false|'rest', workout1, workout2, water, read, photo },
  completed: boolean,       // all tasks === true
  partnerName: 'charizard', // which Pokémon form was active on first log of this day
  notes: {                  // optional per-task notes
    diet: 'Had chicken and rice',
    read: 'Finished chapter 3',
    // ...
  }
}
```

`partnerName` is set once on first log of the day: `existing?.partnerName || activePokemonName`. Retroactive edits don't overwrite it.
