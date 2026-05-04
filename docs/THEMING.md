# Theming & Colors

**File:** `src/constants/themes.js`

---

## CSS Variables (global)

Defined in `src/App.css`. The `applyTheme()` function overwrites `--green` and `--green-dim` at runtime.

| Variable | Default | Description |
|----------|---------|-------------|
| `--bg` | `#0D0D0D` | App background |
| `--green` | `#39FF14` | Primary accent (overridden by theme) |
| `--green-dim` | `#1d6b00` | Dim accent for card borders (overridden by theme) |
| `--red` | `#FF4444` | Fail/error color |
| `--blue` | `#4488FF` | Info color |
| `--yellow` | `#FFD700` | Secondary highlight |
| `--gray` | `#666` | Subdued text |
| `--white` | `#F0F0F0` | Primary text |
| `--nav-h` | `60px` | NavBar height |

---

## Accent Themes

9 selectable accent colors. Each has an `id`, `label`, `accent` (bright), and `dim` (muted bg).

| ID | Label | Accent | Dim |
|----|-------|--------|-----|
| `green` | NEON | `#39FF14` | `#1d6b00` |
| `blue` | BLUE | `#4488FF` | `#1a3566` |
| `cyan` | CYAN | `#00E5FF` | `#005566` |
| `pink` | PINK | `#FF3399` | `#660038` |
| `orange` | ORANGE | `#FF8C00` | `#663800` |
| `yellow` | GOLD | `#FFD700` | `#665700` |
| `purple` | PURPLE | `#BB44FF` | `#4a0066` |
| `white` | WHITE | `#F0F0F0` | `#555555` |
| `gray` | GRAY | `#888888` | `#333333` |

`DEFAULT_THEME = 'green'`

### `applyTheme(id)`
Sets `--green` and `--green-dim` CSS variables on `document.documentElement`. Called on login, theme change, and on app mount.

### `getTheme(id)`
Returns the theme object for a given id, falling back to the first theme.

---

## Pokémon Type Colors

Used to color the Stats radar chart, stat bars/values, and sprite glow on Stats screen.  
Keyed by **base form / starter choice** (not evolved forms).

| Type | Color | Starters |
|------|-------|---------|
| Fire | `#FF6B35` | charmander, cyndaquil, torchic, chimchar, tepig, fennekin, litten, scorbunny, fuecoco |
| Water | `#4488FF` | squirtle, totodile, mudkip, piplup, oshawott, froakie, popplio, sobble, quaxly |
| Grass | `#48D050` | bulbasaur, chikorita, treecko, turtwig, snivy, chespin, rowlet, grookey, sprigatito |

### `getPokemonTypeColor(pokemonChoice)`
Returns type color for a given starter key. Falls back to `'#39FF14'` (neon green) if not found.

---

## Habit Colors

Per-habit row colors in the Today grid. Customizable by user via the edit mode color picker.

| Habit | Default Color |
|-------|---------------|
| diet | `#FF8C00` (orange) |
| workout1 | `#39FF14` (neon green) |
| workout2 | `#00E5FF` (cyan) |
| read | `#FFD700` (gold) |
| photo | `#BB44FF` (purple) |
| water | `#4488FF` (blue) |

`DEFAULT_HABIT_COLORS` in `useGameStore.js`.  
Stored in `habitColors` state, persisted to `profile.habitColors` in Firebase.  
Updated via `setHabitColor(habitKey, hexColor)`.

### Color Picker Swatches (Today.jsx)
```js
['#FF4444', '#FF8C00', '#FFD700',
 '#39FF14', '#00E5FF', '#4488FF',
 '#BB44FF', '#FF69B4', '#FFFFFF']
```

---

## Sprite Naming Convention

| Sprite type | File name pattern | Example |
|-------------|-------------------|---------|
| Normal | `{name}.gif` | `charizard.gif` |
| Shiny | `shiny{Name}.gif` | `shinyChaizard.gif` |

All sprites are in `public/sprites/`. Served at `/sprites/{name}.gif` (no import needed).

### Shiny sprites currently in `public/sprites/`
All shiny sprites exist as both `.gif` (animated) and `.png` (static). The code references `.gif`.

| Starter Line | Shiny files |
|---|---|
| Charmander | `shinycharmander.gif`, `shinycharmeleon.gif`, `shinycharizard.gif` |
| Squirtle | `shinysquirtle.gif`, `shinywartortle.gif`, `shinyblastoise.gif` |
| Bulbasaur | `shinybulbasaur.gif`, `shinyivysaur.gif`, `shinyvenusaur.gif` |
| Cyndaquil | `shinytyphlosion.gif` (final only) |
| Totodile | `shinyferaligatr.gif` (final only) |
| Chikorita | `shinymeganium.gif` (final only) |
| Torchic | `shinyblaziken.gif` (final only) |
| Mudkip | `shinyswampert.gif` (final only) |
| Treecko | `shinysceptile.gif` (final only) |
| Chimchar | `shinyinfernape.gif` (final only) |
| Piplup | `shinyempoleon.gif` (final only) |
| Oshawott | `shinysamurott.gif` (final only) |
| Tepig | `shinyemboar.gif` (final only) |
| Snivy | `shinyserperior.gif` (final only) |
| Torterra line | `shinytorterra.gif` (final only) |

**Note:** `shinymachop.gif` is also present but Machop is not a starter line — ignore it.  
**Note:** Gen 6–9 starters (Froakie, Fennekin, Chespin, Rowlet, Litten, Popplio, Grookey, Scorbunny, Sobble, Sprigatito, Fuecoco, Quaxly) do not yet have shiny sprites.

The shiny feature in code only uses the final-form sprite (e.g. `shinycharizard`). The mid/base shiny sprites are available but unused by the toggle mechanic.
