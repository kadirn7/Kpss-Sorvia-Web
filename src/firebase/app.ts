import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, indexedDBLocalPersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFirebaseClientConfig } from './config';

function createApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(getFirebaseClientConfig());
}

function createAuth(firebaseApp: FirebaseApp): Auth {
  try {
    return initializeAuth(firebaseApp, {
      persistence: indexedDBLocalPersistence,
    });
  } catch {
    // HMR (Hot Module Replacement) sırasında Auth zaten başlatılmış olabilir.
    return getAuth(firebaseApp);
  }
}

export const firebaseApp = createApp();
export const firebaseAuth = createAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
