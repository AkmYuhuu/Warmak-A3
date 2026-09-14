import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Env ${name} kosong. Isi di .env.local (lihat .env.local untuk daftar).`
    );
  }
  return value;
}

const firebaseConfig = {
  apiKey: requiredEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: requiredEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: requiredEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: requiredEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: requiredEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: requiredEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db: Firestore = getFirestore(app);
