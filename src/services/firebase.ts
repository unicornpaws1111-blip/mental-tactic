import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, Auth } from 'firebase/auth';

export interface FirebaseClientConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

const DEFAULT_FIREBASE_CONFIG: FirebaseClientConfig = {
  apiKey: 'AIzaSyA55tYoT1YQUtei2jq6sY7vFgysPTf4xyU',
  authDomain: 'mental-tactic.firebaseapp.com',
  projectId: 'mental-tactic',
  storageBucket: 'mental-tactic.firebasestorage.app',
  messagingSenderId: '971212569399',
  appId: '1:971212569399:web:6a50653c70474b4418f8b2',
};

let cachedFirebaseApp: FirebaseApp | null = null;

export function getFirebaseConfig(override?: FirebaseClientConfig): FirebaseClientConfig {
  return {
    apiKey: override?.apiKey || (import.meta.env.VITE_FIREBASE_API_KEY as string) || DEFAULT_FIREBASE_CONFIG.apiKey,
    authDomain: override?.authDomain || (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || DEFAULT_FIREBASE_CONFIG.authDomain,
    projectId: override?.projectId || (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || DEFAULT_FIREBASE_CONFIG.projectId,
    storageBucket: override?.storageBucket || (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || DEFAULT_FIREBASE_CONFIG.storageBucket,
    messagingSenderId: override?.messagingSenderId || (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
    appId: override?.appId || (import.meta.env.VITE_FIREBASE_APP_ID as string) || DEFAULT_FIREBASE_CONFIG.appId,
    measurementId: override?.measurementId || (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string) || '',
  };
}

export function isFirebaseConfigured(config?: FirebaseClientConfig): boolean {
  const cfg = getFirebaseConfig(config);
  return Boolean(cfg.apiKey && cfg.projectId);
}

export function initFirebase(override?: FirebaseClientConfig): FirebaseApp | null {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    cachedFirebaseApp = existingApps[0];
    return cachedFirebaseApp;
  }

  const cfg = getFirebaseConfig(override);
  if (!cfg.apiKey || !cfg.projectId) {
    return null;
  }

  try {
    cachedFirebaseApp = initializeApp({
      apiKey: cfg.apiKey,
      authDomain: cfg.authDomain || `${cfg.projectId}.firebaseapp.com`,
      projectId: cfg.projectId,
      storageBucket: cfg.storageBucket || `${cfg.projectId}.appspot.com`,
      messagingSenderId: cfg.messagingSenderId,
      appId: cfg.appId,
      measurementId: cfg.measurementId,
    });
    return cachedFirebaseApp;
  } catch (err) {
    console.error('Failed to initialize Firebase Web SDK:', err);
    return null;
  }
}

export function getFirebaseAuthInstance(override?: FirebaseClientConfig): Auth | null {
  const app = initFirebase(override);
  if (!app) return null;
  return getAuth(app);
}

export interface FirebaseSignInResult {
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
    avatar?: string;
    role?: 'admin' | 'member';
  };
}

/**
 * Initiates Google Sign-In with Firebase Authentication popup.
 * Returns the verified Firebase ID Token and user profile details.
 */
export async function signInWithGoogleFirebase(
  override?: FirebaseClientConfig
): Promise<FirebaseSignInResult> {
  const auth = getFirebaseAuthInstance(override);
  if (!auth) {
    throw new Error(
      'Firebase Authentication is not yet configured. Please configure your Firebase project credentials in environment variables.'
    );
  }

  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({
    prompt: 'select_account',
  });

  const result = await signInWithPopup(auth, provider);
  if (!result || !result.user) {
    throw new Error('Google authentication did not return a valid user profile.');
  }

  const idToken = await result.user.getIdToken();
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Google authentication succeeded but failed to retrieve an ID token.');
  }
  const fbUser = result.user;
  const user = {
    id: fbUser.uid,
    email: fbUser.email || '',
    username: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Member'),
    avatar: fbUser.photoURL || '',
    role: (fbUser.email && fbUser.email.toLowerCase() === 'admin@mentaltactic.com'
      ? 'admin'
      : 'member') as 'admin' | 'member',
  };

  return {
    token: idToken,
    user,
  };
}
