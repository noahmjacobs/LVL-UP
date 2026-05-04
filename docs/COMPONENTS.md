# Components

All reusable components live in `src/components/`.

---

## NavBar.jsx

Bottom navigation bar. 4 tabs: TODAY, STATS, LOG, PROFILE.  
Calls `goToScreen(screen)` on tab click.  
Highlights active tab based on `currentScreen`.  
Not shown during onboarding, restart, title, or chooseNewPokemon screens.

---

## PokemonSprite.jsx

Renders a Pokémon sprite GIF from `public/sprites/{name}.gif`.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | required | Sprite name (e.g. `'charizard'`, `'shinycharizard'`) |
| `size` | `'xs'`\|`'sm'`\|`'md'`\|`'lg'` | `'md'` | Controls rendered size |
| `glow` | `boolean` | `false` | Adds CSS drop-shadow glow |
| `glowColor` | `string` | `'var(--green)'` | Color of the glow (ignored for shiny sprites) |
| `bounce` | `boolean` | `false` | Adds CSS bounce animation |
| `png` | `boolean` | `false` | Forces static `.png` instead of animated `.gif` (used for Pokédex thumbnails) |

Sprite URL pattern: `/sprites/${name}.gif`. Falls back to `.png` on error.

### Shiny detection
When `glow === true` AND `name.startsWith('shiny')`, the component switches into shiny mode:
- Renders a **wrapper `<div>`** (`.shiny-wrapper`) sized by the `size` prop
- The `<img>` inside gets `.sprite-glow-shiny` (white + gold pulsing `drop-shadow`, defined in `App.css`)
- 8 `<span>` sparkle elements (`.shiny-sparkle--1` through `--8`) are rendered inside the wrapper, each with a `✦` character, gold color + text-shadow, staggered `animation-delay`, and a float-up-and-fade keyframe animation
- `bounce` is applied to the wrapper div so sparkles move with the sprite

For non-shiny sprites with `glow`, uses `.sprite-glow` with `--glow-color` CSS variable (type color or default green).

Pokédex thumbnail entries in Profile.jsx use `size="xs"` with no `glow` prop, so they never trigger the shiny wrapper.

---

## RadarChart.jsx

Pure SVG radar/spider chart for the 6 stats. No external library.

### Props
| Prop | Type | Description |
|------|------|-------------|
| `stats` | `object` | `{ discipline, focus, energy, health, habits, consistency }` |
| `typeColor` | `string` | Fill and stroke color (from `getPokemonTypeColor`) |

- 6 axes arranged in a hexagon
- Interior fill: `typeColor + '26'` (10% opacity)
- Stroke: `typeColor`
- Max value assumed to be 252

---

## EvolutionCutscene.jsx

Full-screen overlay triggered when `showEvolutionCutscene === true`.  
Shows animation of Pokémon evolving into `evolutionTarget`.  
Calls `dismissEvolution()` when user taps to continue.

---

## TaskCard.jsx

Card component for a single task in legacy Today screen flows. (Less used now that Today is a grid tracker.)

Props: `taskKey`, `done`, `onToggle`, `label`, `description`

---

## WaterTracker.jsx

Water intake tracker component (0–128 oz). Used in legacy lock-in flow.  
Reads `waterOz` from store, calls `setWaterOz(oz)`.
