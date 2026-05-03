import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get } from 'firebase/database';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app            = initializeApp(firebaseConfig);
const db             = getDatabase(app);
const auth           = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const appleProvider  = new OAuthProvider('apple.com');

export { db, auth, ref, set, get, onAuthStateChanged };

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signInWithApple() {
  const result = await signInWithPopup(auth, appleProvider);
  return result.user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

// ── Database helpers (keyed by Firebase UID) ─────────────────────────────────

export function userRef(uid, path = '') {
  const base = `users/${uid}`;
  return ref(db, path ? `${base}/${path}` : base);
}

export async function saveProfile(uid, data) {
  await set(userRef(uid, 'profile'), data);
}

export async function saveChallenge(uid, data) {
  await set(userRef(uid, 'challenge'), data);
}

export async function saveHistoryEntry(uid, date, data) {
  await set(userRef(uid, `history/${date}`), data);
}

export async function loadUser(uid) {
  const snap = await get(userRef(uid));
  return snap.exists() ? snap.val() : null;
}
