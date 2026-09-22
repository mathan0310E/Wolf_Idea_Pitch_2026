import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

let isRealFirebase = false;

if (!getApps().length) {
  try {
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
      ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const projectId =
      process.env.FIREBASE_ADMIN_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      "wolf-idea-pitch-2026";

                    if (privateKey && clientEmail && !privateKey.includes("YourFirebaseKey")) {
      const storageBucketEnv = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
      const storageBucket =
        storageBucketEnv || `${projectId}.appspot.com`;
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `[firebase-admin] real storageBucket = ` +
            `"${storageBucket}" (source: ${storageBucketEnv ? "env" : "fallback"})`
        );
      }
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket,
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

// The Admin service account may belong to a different Firebase project than
// the values surfaced to the browser (NEXT_PUBLIC_FIREBASE_*). A bucket name
// copied from the wrong project makes `file.save()` fail with a confusing
// "The specified bucket does not exist" (HTTP 404). This resolver probes each
// candidate bucket against the Admin SDK's own project and returns the first
// that actually exists, so uploads work regardless of which project the Admin
// key is bound to.
export async function resolveStorageBucketName(): Promise<string> {
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "wolf-idea-pitch-2026";
  const candidates = Array.from(
    new Set(
      [
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        `${projectId}.firebasestorage.app`,
        `${projectId}.appspot.com`,
      ].filter((v): v is string => Boolean(v))
    )
  );
  const storage = getStorage();
  for (const name of candidates) {
    try {
      await storage.bucket(name).getMetadata();
      if (process.env.NODE_ENV !== "production") {
        console.log(`[firebase-admin] resolved live Storage bucket: "${name}"`);
      }
      return name;
    } catch (e: unknown) {
      if (process.env.NODE_ENV !== "production") {
        const msg = e instanceof Error ? e.message : String(e);
        console.log(`[firebase-admin] bucket probe failed for "${name}": ${msg}`);
      }
    }
  }
  // Nothing resolved — return the first candidate so the caller's error names
  // the bucket it attempted (and surfaces the real "bucket does not exist").
  return candidates[0];
}

// ---------------------------------------------------------------------------
// Production misconfiguration guard.
// A production deployment WITHOUT Firebase Admin credentials must never fall
// back to the in-memory mock store silently:
//   - mockAuth.verifyIdToken rejects every token (admin stays locked out)
//   - registration / upload routes return 503 instead of faking success
// Dev (`next dev`) keeps the mock so the app is testable without secrets.
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

const mockAuth = {
  verifyIdToken: async (_token: string) => {
    if (prodMisconfigured) {
      // Never accept tokens in a misconfigured production deployment.
      throw new Error("prod-misconfigured: Firebase Admin credentials missing");
    }
    return {
      uid: "admin-uid-123",
      role: "admin",
      email: "admin@cyberwolf.in",
    };
  },
};

const mockStorage = {
  bucket: () => ({
    file: (_path: string) => ({
      save: async () => {},
    }),
  }),
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
export const adminStorage = (
  isRealFirebase ? getStorage() : mockStorage
) as unknown as {
  bucket: (name?: string) => {
    file: (path: string) => {
      save: (
        buffer: Uint8Array,
        options?: { metadata?: { contentType?: string } }
      ) => Promise<void>;
      getSignedUrl: (options: {
        action: string;
        expires: string;
      }) => Promise<[string]>;
    };
  };
};
