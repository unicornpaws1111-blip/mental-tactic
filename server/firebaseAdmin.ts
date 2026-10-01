import { initializeApp as initAdminApp, getApps as getAdminApps, cert as adminCert, App as FirebaseAdminApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: FirebaseAdminApp | null = null;
let firestoreInstance: Firestore | null = null;
let firestoreAttempted = false;

export function initFirebaseAdmin(): FirebaseAdminApp | null {
  const existingApps = getAdminApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  const projectId = (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID ||
    'mental-tactic'
  ).trim();
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').trim();
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').trim();
  const serviceAccount = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();

  try {
    if (serviceAccount) {
      const parsed = JSON.parse(serviceAccount);
      adminApp = initAdminApp({
        credential: adminCert(parsed),
        projectId: parsed.project_id || projectId || undefined,
      });
      return adminApp;
    }

    if (clientEmail && privateKey) {
      adminApp = initAdminApp({
        credential: adminCert({
          projectId: projectId || undefined,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        projectId: projectId || undefined,
      });
      return adminApp;
    }

    if (projectId) {
      adminApp = initAdminApp({
        projectId,
      });
      return adminApp;
    }
  } catch (err) {
    console.error('Firebase Admin initialization error:', err);
  }

  return null;
}

export function getAdminFirestoreInstance(): Firestore | null {
  if (firestoreAttempted) return firestoreInstance;
  firestoreAttempted = true;

  const app = initFirebaseAdmin();
  if (!app) return null;

  try {
    firestoreInstance = getAdminFirestore(app);
    return firestoreInstance;
  } catch (err) {
    console.warn('Firestore instance could not be initialized:', err);
    firestoreInstance = null;
    return null;
  }
}

export { getAdminAuth };
