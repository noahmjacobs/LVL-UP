# Firebase

**File:** `src/firebase.js`

No backend. The React app talks directly to Firebase Realtime Database. Auth via Firebase Auth (Google + Apple).

---

## Auth

Uses Firebase Auth with popup flow.

```js
signInWithGoogle()  // GoogleAuthProvider popup
signInWithApple()   // OAuthProvider('apple.com') popup
signOut()           // firebaseSignOut
```

`onAuthStateChanged` is subscribed in `App.jsx` and calls `handleAuthResolved(user)` in the store.

---

## Database Structure

All data lives under `users/{uid}/`:

```
users/
  {uid}/
    profile/
      trainerName          string
      pokemonChoice        string        ('charmander', 'squirtle', etc.)
      pokemonNickname      string        (active-line nickname, kept in sync)
      pokemonNicknames     object        ({ [choice]: string } — per-line nicknames)
      totalCompletedDays   number
      totalRestarts        number
      longestStreak        number
      themeColor           string        (theme id, e.g. 'green')
      habitColors          object        ({ diet, workout1, workout2, read, photo, water } hex strings)
      caughtLines          object        ({ [pokemonChoice]: highestStage })
      partnerLine          string|null
      partnerSince         string|null   (YYYY-MM-DD)
      shinyLines           object        ({ [choice]: { unlocked: bool, show: bool } })
      canChooseNewPokemon  boolean

    challenge/             (legacy — written by lockInDay, also written by toggleHistoryTask)
      currentDay           number
      currentStreak        number
      isLockedIn           boolean
      waterOz              number
      todayTasks           object
      stats                object
      evolutionStage       number
      lastLockDate         string|null

    history/
      {YYYY-MM-DD}/
        tasks              object   { diet, workout1, workout2, water, read, photo }
                                    values: true | false | 'rest'
        completed          boolean  (all tasks === true)
        partnerName        string   (which Pokémon form was active when first logged)
        notes              object   { [taskKey]: string }   (optional)
        day                number   (legacy, from lockInDay flow)
        waterOz            number   (legacy)
```

**Key design:** Stats and streak are NOT stored. They are always **recomputed from `history/`** on load and on every toggle. This prevents drift.

**Legacy fields:** `shinyUnlocked` and `showShiny` may still exist in old profiles — `loadSavedUser` migrates them to `shinyLines` automatically on first load and writes the new format back.

---

## Helper Functions

All keyed by Firebase UID.

```js
userRef(uid, path)                   // Returns a DB ref at users/{uid}/{path}
saveProfile(uid, data)               // set() the full profile object
updateProfileField(uid, field, value)// update() a single profile field
saveChallenge(uid, data)             // set() the full challenge object
saveHistoryEntry(uid, date, data)    // set() at history/{date}
loadUser(uid)                        // get() users/{uid}, returns null if not found
```

### When each is called

| Action | Firebase writes |
|--------|----------------|
| `completeOnboarding` | `saveProfile` + `saveChallenge` |
| `toggleHistoryTask` | `saveHistoryEntry` + `saveChallenge` + `saveProfile` (includes `shinyLines`, `pokemonNicknames`) |
| `setHabitColor` | `updateProfileField('habitColors', ...)` |
| `setThemeColor` | `updateProfileField('themeColor', ...)` |
| `setPartnerLine` | `updateProfileField('partnerLine', ...)` |
| `toggleShowShiny` | `updateProfileField('shinyLines', ...)` |
| `setPokemonNickname` | `updateProfileField('pokemonNickname', ...)` + `updateProfileField('pokemonNicknames', ...)` |
| `setHistoryNote` | `saveHistoryEntry` (with notes merged) |
| `lockInDay` | `saveHistoryEntry` + `saveProfile` + `saveChallenge` |
| `confirmRestart` | `saveProfile` + `saveChallenge` |
| `choosePokemon` | `saveProfile` (includes `shinyLines`, `pokemonNicknames`) |
| `logout` | none (just Firebase signOut) |

---

## Environment Variables

Set in `.env` locally, Railway dashboard in production:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_DATABASE_URL
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```
