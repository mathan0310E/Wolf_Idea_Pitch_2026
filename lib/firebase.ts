import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Client config comes ONLY from environment variables (.env.local locally,
// Vercel env in production). No Firebase values are hardcoded in source.
// NOTE: callers MUST pass process.env.NEXT_PUBLIC_* via static member access.
// Turbopack only inlines NEXT_PUBLIC vars referenced as process.env.X into the
// client bundle; dynamic process.env[name] is NOT inlined and crashes hydration.
function requiredEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `[FATAL CONFIG] ${name} is missing. Set it in .env.local (local) or Vercel env (production).`
    );
  }
  return value;
}
const firebaseConfig = {
  apiKey: requiredEnv("NEXT_PUBLIC_FIREBASE_API_KEY", process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: requiredEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
    projectId: requiredEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  messagingSenderId:
    requiredEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: requiredEnv("NEXT_PUBLIC_FIREBASE_APP_ID", process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  // measurementId is optional (JS SDK v7.20.0+) — only sent when set in env.
  ...(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    ? { measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID }
    : {}),
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
export default app;
