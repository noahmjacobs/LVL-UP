import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, update, onValue, off } from 'firebase/database';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

export { db, ref, set, get, update, onValue, off };

// ── Helpers ──────────────────────────────────────────────────────────────────

export function userRef(trainerName, path = '') {
  const base = `users/${trainerName}`;
  return ref(db, path ? `${base}/${path}` : base);
}

export async function saveProfile(trainerName, data) {
  await set(userRef(trainerName, 'profile'), data);
}

export async function saveChallenge(trainerName, data) {
  await set(userRef(trainerName, 'challenge'), data);
}

export async function saveHistoryEntry(trainerName, date, data) {
  await set(userRef(trainerName, `history/${date}`), data);
}

export async function loadUser(trainerName) {
  const snap = await get(userRef(trainerName));
  return snap.exists() ? snap.val() : null;
}
