import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "wolf-idea-pitch-2026.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "wolf-idea-pitch-2026",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "wolf-idea-pitch-2026.appspot.com",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:1234567890:web:demo",
};

// Loud production warning — placeholder Firebase config silently breaks
// every client auth call. Do not throw: the prod build must stay portable;
// the runtime failure surfaces in the browser console and in /api/health.
if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_FIREBASE_API_KEY === undefined) {
  console.error(
    "[FATAL CONFIG] NEXT_PUBLIC_FIREBASE_API_KEY is missing in production. " +
      "Client-side Firebase auth (admin login, registration) will fail."
  );
}

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
