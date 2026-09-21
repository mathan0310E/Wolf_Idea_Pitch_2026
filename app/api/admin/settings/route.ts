import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import { event } from "@/config/event";

/**
 * Registration gate + public announcement.
 * GET  — public: { open, announcement } (powers the register-page gate)
 * PUT  — admin-only: { open: boolean, announcement: string }
 * Persisted in Firestore settings/event so the organizer can open/close
 * registrations without a redeploy. Falls back to config/event.ts defaults.
 */

interface EventSettings {
  open: boolean;
  announcement: string;
}

async function readSettings(): Promise<EventSettings> {
  const fallback: EventSettings = {
    open: event.registration.open,
    announcement: event.registration.announcement,
  };
  try {
    const doc = await adminDb.collection("settings").doc("event").get();
    if (!doc.exists) return fallback;
    const data = doc.data() as Partial<EventSettings> | undefined;
    return {
      open: typeof data?.open === "boolean" ? data.open : fallback.open,
      announcement:
        typeof data?.announcement === "string" && data.announcement.length > 0
          ? data.announcement
          : fallback.announcement,
    };
  } catch {
    return fallback;
  }
}

export async function GET() {
  const settings = await readSettings();
  return NextResponse.json({ success: true, settings });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const { open, announcement } = body as {
      open?: unknown;
      announcement?: unknown;
    };

    if (typeof open !== "boolean") {
      return NextResponse.json(
        { error: "Field 'open' must be a boolean." },
        { status: 400 }
      );
    }
    if (
      typeof announcement !== "string" ||
      announcement.trim().length === 0 ||
      announcement.length > 500
    ) {
      return NextResponse.json(
        { error: "Announcement must be 1–500 characters." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    await adminDb.collection("settings").doc("event").set(
      { open, announcement: announcement.trim(), updatedAt: now },
      { merge: true }
    );

    await adminDb.collection("auditLogs").add({
      actorUid: auth.admin.uid,
      action: open ? "REGISTRATION_OPENED" : "REGISTRATION_CLOSED",
      targetId: "settings/event",
      after: { open, announcement: announcement.trim() },
      timestamp: now,
    });

    return NextResponse.json({
      success: true,
      settings: { open, announcement: announcement.trim() },
    });
  } catch (error) {
    console.error("Admin Settings Update Error:", error);
    return NextResponse.json(
      { error: "Failed to save settings." },
      { status: 500 }
    );
  }
}
