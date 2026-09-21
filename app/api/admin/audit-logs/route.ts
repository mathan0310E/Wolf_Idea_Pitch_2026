import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import { type QueryDocumentSnapshot, type DocumentData } from "firebase-admin/firestore";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  try {
    const snapshot = await adminDb.collection("auditLogs").orderBy("timestamp", "desc").get();
    const docs = snapshot.docs;
    docs.sort((a, b) =>
      String(b.data().timestamp || "").localeCompare(String(a.data().timestamp || ""))
    );
    const logs = docs.filter((doc): doc is QueryDocumentSnapshot<DocumentData, DocumentData> => "id" in doc).map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error("Failed to load audit logs:", error);
    return NextResponse.json({ success: false, error: "Failed to load audit logs." }, { status: 500 });
  }
}