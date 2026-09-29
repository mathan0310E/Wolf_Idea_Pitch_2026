import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

let isRealFirebase = false;

if (getApps().length) {
  // Re-entry (e.g. dev hot-reload re-runs this module while the firebase-admin
  // package stays cached): the app was already initialized above, so creds are
  // real. Without this branch the flag would reset to false and health would
  // wrongly report "mock" until a full server restart.
  isRealFirebase = true;
} else {
  try {
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
      ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim();
    if (!projectId) {
      throw new Error(
        "[FATAL CONFIG] Firebase Admin project ID is missing. Set FIREBASE_ADMIN_PROJECT_ID in .env."
      );
    }

    if (privateKey && clientEmail && !privateKey.includes("YourFirebaseKey")) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      isRealFirebase = true;
    }
  } catch {
    console.warn("Firebase Admin operating in local mock store mode.");
  }
}

export function isFirebaseAdminReal(): boolean {
  return isRealFirebase;
}

// ---------------------------------------------------------------------------
// Production misconfiguration guard.
// A production deployment WITHOUT Firebase Admin credentials must never fall
// back to the in-memory mock store silently:
//   - mockAuth.verifyIdToken rejects every token (admin stays locked out)
//   - registration / upload routes return 503 instead of faking success
// Dev (`next dev`) keeps the mock store so non-admin flows are testable
// without secrets, but admin authorization is NEVER mocked.
// ---------------------------------------------------------------------------
const prodMisconfigured = process.env.NODE_ENV === "production" && !isRealFirebase;
if (prodMisconfigured) {
  console.error(
    "[FATAL CONFIG] Firebase Admin credentials are missing in production. " +
      "Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL and " +
      "FIREBASE_ADMIN_PRIVATE_KEY. Admin APIs will reject every request and " +
      "data routes return 503 until this is fixed."
  );
}

export function isProdMisconfigured(): boolean {
  return prodMisconfigured;
}

// In-memory mock store for dev / fallback when Firebase credentials are not provided
type MockDocData = Record<string, unknown>;

interface MockDocRef {
  get: () => Promise<{ exists: boolean; data: () => MockDocData | undefined }>;
  set: (data: MockDocData, options?: { merge?: boolean }) => Promise<void>;
  update: (data: MockDocData) => Promise<void>;
  delete: () => Promise<void>;
}

interface MockTx {
  get: () => Promise<{ exists: boolean; data: () => MockDocData }>;
  set: (docRef: unknown, data: MockDocData) => void;
}

class MockFirestore {
  private collections: Map<string, Map<string, MockDocData>> = new Map();
  private sequence = 0;

  collection(name: string) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Map());
    }
    const store = this.collections.get(name)!;

    const doc = (id: string): MockDocRef => ({
      get: async () => {
        const data = store.get(id);
        return {
          exists: !!data,
          data: () => data,
        };
      },
      set: async (data: MockDocData, options?: { merge?: boolean }) => {
        if (options?.merge) {
          const existing = store.get(id) || {};
          store.set(id, { ...existing, ...data });
        } else {
          store.set(id, data);
        }
      },
      update: async (data: MockDocData) => {
        const existing = store.get(id) || {};
        store.set(id, { ...existing, ...data });
      },
      delete: async () => {
        store.delete(id);
      },
    });

    return {
      doc,
      add: async (data: MockDocData) => {
        const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        store.set(id, data);
        return { id };
      },
      orderBy: () => ({
        get: async () => ({
          docs: Array.from(store.values()).map((data) => ({
            data: () => data,
          })),
        }),
      }),
      get: async () => ({
        docs: Array.from(store.values()).map((data) => ({
          data: () => data,
        })),
      }),
    };
  }

  async runTransaction<T>(updateFunction: (transaction: MockTx) => Promise<T>): Promise<T> {
    this.sequence += 1;
    const seq = this.sequence;
    const fakeTransaction: MockTx = {
      get: async () => ({
        exists: true,
        data: () => ({ currentSequence: seq - 1 }),
      }),
      set: (_docRef: unknown, data: MockDocData) => {
        if (typeof data.currentSequence === "number") {
          this.sequence = data.currentSequence;
        }
      },
    };
    return await updateFunction(fakeTransaction);
  }
}

const mockStore = new MockFirestore();

// SECURITY: there is NO admin bypass in any environment.
// Without real Firebase Admin credentials no ID token can be verified, so
// every admin request is rejected (see requireAdmin -> 503/401). Allowing a
// "mock admin" here previously let any Bearer token administer the event in
// dev, which is exactly the dev-login path that was removed.
// Administer the event with a real Firebase project plus the ADMIN_EMAILS
// allowlist (see FIREBASE_SETUP.md).
const mockAuth = {
  verifyIdToken: async (): Promise<never> => {
    throw new Error(
      prodMisconfigured
        ? "prod-misconfigured: Firebase Admin credentials missing"
        : "firebase-admin-unconfigured: admin authorization requires real Firebase Admin credentials"
    );
  },
};

type AdminDb = Firestore | MockFirestore;

// Minimal transaction shim used by the submit route so the Admin SDK
// Firestore type and the mock store type stay compatible.
export type AdminTx = {
  get: (ref: unknown) => Promise<{ exists: boolean; data: () => { currentSequence?: number } | undefined }>;
  set: (ref: unknown, data: Record<string, unknown>, opts?: { merge?: boolean }) => void;
};

export const adminDb = (isRealFirebase
  ? getFirestore()
  : mockStore) as unknown as AdminDb & {
  runTransaction: <T>(
    fn: (tx: AdminTx) => Promise<T>
  ) => Promise<T>;
};
export const adminAuth = (isRealFirebase ? getAuth() : mockAuth) as unknown as {
  verifyIdToken: (token: string) => Promise<{ uid?: string; email?: string; role?: string }>;
};
