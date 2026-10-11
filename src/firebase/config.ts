export type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

function requiredEnv(name: string): string {
  const value = import.meta.env[name]?.trim();
  if (!value) {
    throw new Error(
      `${name} eksik. web/.env.local dosyasını web/.env.example şablonuna göre doldur.`
    );
  }
  return value;
}

export function getFirebaseClientConfig(): FirebaseClientConfig {
  return {
    apiKey: requiredEnv('VITE_FIREBASE_API_KEY'),
    authDomain: requiredEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: requiredEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: requiredEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: requiredEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: requiredEnv('VITE_FIREBASE_APP_ID'),
  };
}

export function isFirebaseConfigured(): boolean {
  try {
    getFirebaseClientConfig();
    return true;
  } catch {
    return false;
  }
}
