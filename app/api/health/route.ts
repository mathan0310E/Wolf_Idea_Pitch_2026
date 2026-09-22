import { NextResponse } from "next/server";
import { isFirebaseAdminReal } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "wolf-idea-pitch",
    database: isFirebaseAdminReal() ? "firebase" : "mock",
    time: new Date().toISOString(),
  });
}
