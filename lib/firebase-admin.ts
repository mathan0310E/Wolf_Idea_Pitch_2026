import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
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
      "wolf-ideathon-2026";

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
  } catch (error) {
    console.warn("Firebase Admin operating in local mock store mode.");
  }
}

// In-memory mock store for dev / fallback when Firebase credentials are not provided
class MockFirestore {
  private collections: Map<string, Map<string, any>> = new Map();
  private sequence = 0;

  collection(name: string) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Map());
    }
    const store = this.collections.get(name)!;

    return {
      doc: (id: string) => ({
        get: async () => {
          const data = store.get(id);
          return {
            exists: !!data,
            data: () => data,
          };
        },
        set: async (data: any, options?: { merge?: boolean }) => {
          if (options?.merge) {
            const existing = store.get(id) || {};
            store.set(id, { ...existing, ...data });
          } else {
            store.set(id, data);
          }
        },
        update: async (data: any) => {
          const existing = store.get(id) || {};
          store.set(id, { ...existing, ...data });
        },
      }),
      add: async (data: any) => {
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

  async runTransaction(updateFunction: (transaction: any) => Promise<any>) {
    this.sequence += 1;
    const fakeTransaction = {
      get: async () => ({
        exists: true,
        data: () => ({ currentSequence: this.sequence - 1 }),
      }),
      set: (docRef: any, data: any) => {
        this.sequence = data.currentSequence || this.sequence;
      },
    };
    return await updateFunction(fakeTransaction);
  }
}

const mockStore = new MockFirestore();

const mockAuth = {
  verifyIdToken: async (token: string) => ({
    uid: "admin-uid-123",
    role: "admin",
    email: "admin@cyberwolf.in",
  }),
};

const mockStorage = {
  bucket: () => ({
    file: (path: string) => ({
      save: async () => {},
    }),
  }),
};

export const adminDb = isRealFirebase ? (getFirestore() as any) : (mockStore as any);
export const adminAuth = isRealFirebase ? (getAuth() as any) : (mockAuth as any);
export const adminStorage = isRealFirebase ? (getStorage() as any) : (mockStorage as any);
