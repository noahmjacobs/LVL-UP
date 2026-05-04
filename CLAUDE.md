# LVL UP — CLAUDE.md

## What This App Is
Mobile-first web app for the 75 TUFF challenge (75 Hard rules). Gamified with Pokémon RPG progression — stats grow as you complete daily tasks, Pokémon evolves at avg stat 50 and 100. No mandatory restarts — challenge is open-ended, evolving your Pokémon is the goal.

Built as a **React + Vite web app** optimized for vertical mobile screens. Hosted on Railway via Docker/Nginx. Firebase Realtime Database for persistence (direct from client, no backend). Firebase Auth (Google + Apple) for identity.

---

## Documentation Index

Before reading/editing code, read the relevant doc first. These are the source of truth for how the code works.

| Doc | What it covers |
|-----|---------------|
| [`docs/GAME_MECHANICS.md`](docs/GAME_MECHANICS.md) | Stats, three-state cells, evolution, streaks, Pokédex, shiny, history entry structure |
| [`docs/STORE.md`](docs/STORE.md) | Full Zustand store: all state fields, every action, helper functions |
| [`docs/SCREENS.md`](docs/SCREENS.md) | Every screen component — layout, state, key logic |
| [`docs/FIREBASE.md`](docs/FIREBASE.md) | DB structure, auth flow, all helper functions, when each write fires |
| [`docs/COMPONENTS.md`](docs/COMPONENTS.md) | Reusable components: props, behavior |
| [`docs/THEMING.md`](docs/THEMING.md) | CSS variables, accent themes, Pokémon type colors, habit colors, sprite naming |

## ⚠️ DOC UPDATE RULE — MANDATORY

**After every code change, update the relevant docs.**

- Changed store state or an action → update `docs/STORE.md`
- Changed game logic (stats, evolution, streaks) → update `docs/GAME_MECHANICS.md`
- Changed a screen's layout or behavior → update `docs/SCREENS.md`
- Changed Firebase structure or helper functions → update `docs/FIREBASE.md`
- Changed a component's props or behavior → update `docs/COMPONENTS.md`
- Changed colors, themes, or sprite naming → update `docs/THEMING.md`

This is not optional. Stale docs cost more tokens than updating them.

---

## Architecture

**No backend.** The React app talks directly to Firebase Realtime Database via the Firebase JS SDK. Railway just serves the built `dist/` folder via Nginx.

```
User's browser/phone → Firebase Realtime Database (Auth + RTDB)
                     ↓
               Railway (Nginx serving Vite build)
```

### Auth
Firebase Auth (Google + Apple popup). UID is the DB key: `users/{uid}/...`  
`onAuthStateChanged` in App.jsx → `handleAuthResolved(user)` in store.

### Firebase Structure (summary — see `docs/FIREBASE.md` for full detail)
```
users/{uid}/
  profile/     ← trainer info, caughtLines, habitColors, themeColor, shiny flags
  challenge/   ← legacy lock-in data (still written, mostly superseded by history recompute)
  history/
    {YYYY-MM-DD}/  ← tasks (true|false|'rest'), completed, partnerName, notes
```

**Stats and streak are NOT stored.** Always recomputed from `history/` on load and on every toggle.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React 18 + Vite |
| State | Zustand (no persist middleware — syncs to Firebase directly) |
| Database | Firebase Realtime Database (JS SDK v9 modular) |
| Auth | Firebase Auth (Google + Apple) |
| Hosting | Railway via Docker + Nginx |
| Styling | Plain CSS (global `App.css` + per-screen CSS files) |
| Font | "Press Start 2P" (Google Fonts) — pixel art look |
| Charts | Pure SVG radar chart (no library) |
| Sprites | Animated GIFs in `public/sprites/` |

---

## Key Mechanics (quick reference — full detail in docs/)

- **STAT_MAX = 252, STAT_INCREMENT = 5** (flat per qualifying day)
- **Three-state cells:** `false → true → 'rest' → false`. `'rest'` counts for streak but NOT stats.
- **Evolution:** avg ≥ 50 → stage 1, avg ≥ 100 → stage 2. Never goes backward.
- **Shiny:** unlocks at avg ≥ 150 when at final evo. Toggle via ☆ star in Pokédex entry.
- **caughtLines:** `{ [pokemonChoice]: highestStage }` — one entry per evolution LINE, not per form.
- **Stats always recomputed from history** via `computeStatsFromHistory()` — never stored cumulatively.
- **27 starters** (9 gens × 3 types) available in `EVOLUTION_LINES`.

---

## File Structure

```
LVL-UP/
├── CLAUDE.md
├── docs/
│   ├── GAME_MECHANICS.md
│   ├── STORE.md
│   ├── SCREENS.md
│   ├── FIREBASE.md
│   ├── COMPONENTS.md
│   └── THEMING.md
├── Dockerfile
├── nginx.conf
├── package.json
├── vite.config.js
├── index.html
├── .env.example
├── .env                    ← gitignored
├── public/
│   └── sprites/            ← all .gif sprite files
└── src/
    ├── main.jsx
    ├── App.jsx             ← screen routing, auth subscription
    ├── App.css             ← global CSS vars + base styles
    ├── audio.js            ← title theme fade-out
    ├── firebase.js         ← Firebase init + all DB/auth helpers
    ├── constants/
    │   ├── themes.js       ← THEMES array, applyTheme(), POKEMON_TYPE_COLORS
    │   └── pokemonTypes.js ← (if exists) type lookup
    ├── store/
    │   └── useGameStore.js ← ALL state + actions (Zustand)
    ├── screens/
    │   ├── TitleScreen.jsx
    │   ├── ProfessorIntro.jsx
    │   ├── NameEntry.jsx
    │   ├── StarterSelect.jsx
    │   ├── Today.jsx + Today.css
    │   ├── Stats.jsx + Stats.css
    │   ├── History.jsx + History.css
    │   ├── Profile.jsx + Profile.css
    │   ├── RestartScreen.jsx
    │   └── ChooseNewPokemon.jsx
    └── components/
        ├── NavBar.jsx
        ├── PokemonSprite.jsx
        ├── RadarChart.jsx
        ├── TaskCard.jsx
        ├── WaterTracker.jsx
        └── EvolutionCutscene.jsx
```

---

## Visual Design

- **Background:** `#0D0D0D`
- **Cards:** `#111111`, `#1a1a1a`
- **Default accent (neon green):** `#39FF14` (overridden by theme)
- **Red (fail):** `#FF4444`
- **Yellow:** `#FFD700`
- **Pixel font:** `Press Start 2P` (headers, labels, stat numbers)
- **UI font:** system sans-serif / Inter (descriptions, body)
- **Max-width:** `430px` centered

---

## Deployment

### Local dev
```bash
npm install
cp .env.example .env   # fill in Firebase keys
npm run dev
```

### Railway
Uses `Dockerfile`. Builds Vite app, serves `dist/` with Nginx on port 80. Set all `VITE_*` env vars in Railway dashboard.

---

## Future Features (v2)
- Push notifications / reminders
- More Pokémon (legendaries as milestone rewards)
- Apple Health integration
- Custom challenge modes beyond 75 TUFF
- Multiple profiles / cross-device sync improvements
