# LVL UP — CLAUDE.md

## What This App Is
Mobile-first web app for the 75 TUFF challenge (75 Hard rules). Gamified with Pokémon RPG progression — your stats grow as you complete daily tasks, and your Pokémon partner evolves at Day 26 and Day 51. Miss a day → restart from Day 1, Pokémon de-evolves.

Built as a **React + Vite web app** optimized for vertical mobile screens. Hosted on Railway via Docker/Nginx. Firebase Realtime Database for persistence (direct from client, no backend).

PRD: `/Users/noahjacobs/Downloads/LVL_UP_PRD.md`

---

## Architecture

**No backend.** The React app talks directly to Firebase Realtime Database via the Firebase JS SDK. Railway just serves the built `dist/` folder via Nginx.

```
User's browser/phone → Firebase Realtime Database
                     ↓
               Railway (Nginx serving Vite build)
```

### Auth
No auth system. User picks a trainer name during onboarding → stored in `localStorage` → used as the DB key: `users/{trainerName}/...`

### Firebase Structure
```
users/
  {trainerName}/
    profile: { trainerName, pokemonChoice, pokemonNickname, totalCompletedDays, totalRestarts, longestStreak }
    challenge: { currentDay, currentStreak, isLockedIn, waterOz, todayTasks, stats, evolutionStage, lastLockDate }
    history/
      {YYYY-MM-DD}: { day, tasks, completed, waterOz }
```

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React 18 + Vite |
| State | Zustand (persisted to Firebase + localStorage) |
| Database | Firebase Realtime Database (JS SDK v9 modular) |
| Hosting | Railway via Docker + Nginx |
| Styling | Plain CSS (global `App.css` + per-screen CSS files) |
| Font | "Press Start 2P" (Google Fonts) — pixel art look |
| Charts | Pure SVG radar chart (no library) |
| Sprites | Animated GIFs stored locally in `public/sprites/` |

---

## Firebase Config

Config lives in `src/firebase.js`. Values come from environment variables:

```js
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
```

Set these in a `.env` file locally (see `.env.example`). In Railway, set them as environment variables in the Railway dashboard.

---

## Sprite System

All sprites are **local GIF files** in `public/sprites/`. Referenced as `/sprites/{name}.gif` (no import needed — Vite serves `public/` at root).

### Pokémon Lines
| Starter | Mid (Day 26) | Final (Day 51) |
|---------|-------------|----------------|
| charmander | charmeleon | charizard |
| squirtle | wartortle | blastoise |
| bulbasaur | ivysaur | venusaur |

### Sprite Map (in code)
```js
const EVOLUTION_LINES = {
  charmander: ['charmander', 'charmeleon', 'charizard'],
  squirtle:   ['squirtle', 'wartortle', 'blastoise'],
  bulbasaur:  ['bulbasaur', 'ivysaur', 'venusaur'],
};
// evolutionStage: 0 = starter, 1 = mid, 2 = final
// currentPokemon = EVOLUTION_LINES[pokemonChoice][evolutionStage]
```

Shiny variants (`shiny{Name}.gif`) are stored but not yet wired up — reserved for a future "Pokédex collection" feature where completing a full 75-day run unlocks that line permanently.

---

## Game State (Zustand Store)

`src/store/useGameStore.js`

```js
{
  // Onboarding
  isOnboarded: false,
  trainerName: '',
  pokemonChoice: null,       // 'charmander' | 'squirtle' | 'bulbasaur'
  pokemonNickname: '',

  // Navigation
  currentScreen: 'professor', // professor | nameEntry | starterSelect | today | stats | history | profile | restart

  // Challenge
  currentDay: 1,
  currentStreak: 1,
  totalCompletedDays: 0,
  totalRestarts: 0,
  longestStreak: 0,
  lastLockDate: null,        // ISO date string of last locked day

  // Today
  todayTasks: { diet, workout1, workout2, water, read, photo },
  waterOz: 0,
  isLockedIn: false,

  // Stats (each 0–100, +1.35 per completed day for the relevant task)
  stats: { discipline, focus, energy, health, habits, consistency },

  // Pokémon
  evolutionStage: 0,         // 0 | 1 | 2
  showEvolutionCutscene: false,
  evolutionTarget: null,     // name of Pokémon being evolved into

  // History
  history: [],               // [{ date, day, tasks, completed, waterOz }]
}
```

### Stat Mapping
| Stat | Task |
|------|------|
| discipline | diet (no cheat/alcohol) |
| focus | read 10 pages |
| energy | both workouts completed |
| health | 1 gallon water (128oz) |
| habits | progress photo |
| consistency | all 6 tasks completed |

Each stat gains +1.35 per day completed (75 × 1.35 = 101.25, effectively caps at 100).

### Day Lock Logic
When user taps "Lock In":
1. Check all 6 tasks complete
2. If yes → increment day, add +1.35 to all relevant stats, save to history, check for evolution (Day 26 or 51), save to Firebase
3. If no → can still lock in partial day but it counts as a failed day → trigger restart prompt

### Restart Logic
- Reset: currentDay=1, currentStreak=1, all stats=0, evolutionStage=0, isLockedIn=false, todayTasks all false, waterOz=0
- Increment totalRestarts
- History is preserved (red tiles stay)
- Show sad animation on RestartScreen

---

## App Screens

All screens live in `src/screens/`. Navigation is Zustand state (`currentScreen`), no React Router.

| Screen | Component | When Shown |
|--------|-----------|------------|
| Professor Intro | `ProfessorIntro.jsx` | First launch, step 1 |
| Name Entry | `NameEntry.jsx` | First launch, step 2 |
| Starter Select | `StarterSelect.jsx` | First launch, step 3 |
| Today | `Today.jsx` | Main app (default after onboarding) |
| Stats | `Stats.jsx` | Bottom nav: Stats tab |
| History | `History.jsx` | Bottom nav: History tab |
| Profile | `Profile.jsx` | Bottom nav: Profile tab |
| Restart | `RestartScreen.jsx` | After confirmed missed day |

---

## Visual Design

- **Background:** `#0D0D0D`
- **Cards:** `#111111`, `#1a1a1a`
- **Neon green accent:** `#39FF14`
- **Red (fail):** `#FF4444`
- **Blue:** `#4488FF`
- **Yellow:** `#FFD700`
- **Pixel font:** `Press Start 2P` (headers, labels, numbers)
- **UI font:** `Inter` or system sans-serif (body text, descriptions)
- **Max-width:** `430px` centered — vertical mobile feel on desktop too
- **Borders:** `2px solid` with neon green or dark color

---

## File Structure

```
LVL-UP/
├── CLAUDE.md
├── Dockerfile
├── nginx.conf
├── package.json
├── vite.config.js
├── index.html
├── .env.example
├── .env                    ← gitignored, real Firebase keys
├── public/
│   └── sprites/
│       ├── charmander.gif
│       ├── charmeleon.gif
│       ├── charizard.gif
│       ├── squirtle.gif
│       ├── wartortle.gif
│       ├── blastoise.gif
│       ├── bulbasaur.gif
│       ├── ivysaur.gif
│       ├── venusaur.gif
│       ├── shinycharmander.gif
│       ├── shinysquirtle.gif
│       └── shinybulbasaur.gif
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── App.css
    ├── firebase.js
    ├── store/
    │   └── useGameStore.js
    ├── screens/
    │   ├── ProfessorIntro.jsx
    │   ├── NameEntry.jsx
    │   ├── StarterSelect.jsx
    │   ├── Today.jsx
    │   ├── Stats.jsx
    │   ├── History.jsx
    │   ├── Profile.jsx
    │   └── RestartScreen.jsx
    └── components/
        ├── NavBar.jsx
        ├── PokemonSprite.jsx
        ├── RadarChart.jsx
        ├── TaskCard.jsx
        ├── WaterTracker.jsx
        └── EvolutionCutscene.jsx
```

---

## Deployment

### Local dev
```bash
npm install
cp .env.example .env   # fill in Firebase keys
npm run dev
```

### Railway
Railway uses the `Dockerfile`. It builds the Vite app and serves `dist/` with Nginx on port 80. Set all `VITE_*` environment variables in the Railway dashboard.

---

## Future Features (v2)
- **Pokédex Collection:** Each completed 75-day run permanently logs that evolutionary line. Pick a new starter next run. Shiny sprites unlock after completing the full challenge.
- Cloud accounts / cross-device sync (currently just one trainer name = one DB key)
- Push notifications / reminders
- More Pokémon (other Gen 1 starters, legendaries as rewards)
- Apple Health integration
- Custom challenge modes beyond 75 TUFF
