import { NextRequest, NextResponse } from "next/server";
import { statusLookupSchema } from "@/lib/validation";
import { adminDb } from "@/lib/firebase-admin";
import { clientKey, checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    if (!checkRateLimit(clientKey(req, "status"), 30, 60_000)) {
      return NextResponse.json(
        { error: "Too many lookups. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parseResult = statusLookupSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid registration ID or lookup token format" },
        { status: 400 }
      );
    }

    const { registrationId, lookupToken } = parseResult.data;

    const doc = await adminDb.collection("registrations").doc(registrationId).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Registration record not found" },
        { status: 404 }
      );
    }

    const data = doc.data();

    // Verify lookup token match
    if (data?.lookupToken !== lookupToken) {
      return NextResponse.json(
        { error: "Invalid lookup token for this registration ID" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      registration: {
        registrationId: data.registrationId,
        teamName: data.teamName,
        teamType: data.teamType,
        memberCount: data.memberCount,
        domain: data.domain,
        totalAmount: data.totalAmount,
        members: data.members,
        registrationStatus: data.registrationStatus,
        paymentStatus: data.paymentStatus,
        transactionId: data.transactionId,
        utr: data.utr,
        rejectionReason: data.rejectionReason,
        createdAt: data.createdAt,
      },
    });
  } catch (error: unknown) {
    console.error("Status Lookup Error:", error);
    return NextResponse.json(
      { error: "Server error checking registration status" },
      { status: 500 }
    );
  }
}
