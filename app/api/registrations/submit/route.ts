import { NextRequest, NextResponse } from "next/server";
import { registrationFormSchema } from "@/lib/validation";
import { adminDb, isFirebaseAdminReal, type AdminTx } from "@/lib/firebase-admin";
import { clientKey, checkRateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

// ~1MB Firestore document ceiling: multi-MB inline data URLs must go through
// /api/uploads/screenshot (Firebase Storage) instead.
const MAX_INLINE_SCREENSHOT_CHARS = 900_000;

export async function POST(req: NextRequest) {
  try {
    if (!checkRateLimit(clientKey(req, "submit"), 15, 60_000)) {
      return NextResponse.json(
        { error: "Too many submissions. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    const body = await req.json();

    // 1. Bot Honeypot Check
    if (body.honeypot && body.honeypot.length > 0) {
      return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
    }

    // 2. Validate payload schema
    const parseResult = registrationFormSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { teamType, teamName, domain, members, transactionId, utr, screenshotUrl } = parseResult.data;

    // 2b. Registration gate — organizer-controlled, no redeploy needed
    try {
      const settingsDoc = await adminDb
        .collection("settings")
        .doc("event")
        .get();
      if (settingsDoc.exists && settingsDoc.data()?.open === false) {
        return NextResponse.json(
          {
            error:
              "Registrations are currently closed. Please check the announcement for updates.",
          },
          { status: 403 }
        );
      }
    } catch {
      // Fail open on gate read errors in dev/mock mode; Firestore rules
      // remain the hard boundary in production.
    }

    // 2c. Inline screenshot guard — production Firestore docs cap at 1 MiB
    if (
      isFirebaseAdminReal() &&
      screenshotUrl.startsWith("data:") &&
      screenshotUrl.length > MAX_INLINE_SCREENSHOT_CHARS
    ) {
      return NextResponse.json(
        {
          error:
            "Payment screenshot is too large to submit inline. Please re-upload it (max 5MB) and try again.",
        },
        { status: 413 }
      );
    }

    // 3. Server-side trust boundary fee & member count recalculation
    const expectedMemberCount = teamType === "individual" ? 1 : teamType === "duo" ? 2 : 4;
    if (members.length !== expectedMemberCount) {
      return NextResponse.json(
        { error: "Member count mismatch for selected category" },
        { status: 400 }
      );
    }

    const totalAmount = expectedMemberCount * 300;

    // 4. Atomic Registration ID Generation (WOLF-2026-XXXXX)
    let registrationId = "";
    const counterRef = adminDb.collection("settings").doc("sequence");

    await adminDb.runTransaction(async (transaction: AdminTx) => {
      const doc = await transaction.get(counterRef);
      let nextSeq = 1;
      if (doc.exists) {
        const seq = doc.data()?.currentSequence;
        if (typeof seq === "number") nextSeq = seq + 1;
      }
      transaction.set(counterRef, { currentSequence: nextSeq }, { merge: true });
      registrationId = `WOLF-2026-${String(nextSeq).padStart(5, "0")}`;
    });

    // Fallback if transaction fallback fails
    if (!registrationId) {
      registrationId = `WOLF-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    }

    // 5. Generate Private Lookup Token
    const lookupToken = crypto.randomBytes(32).toString("hex");

    const now = new Date().toISOString();
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const hashedIp = crypto.createHash("sha256").update(clientIp).digest("hex").substring(0, 16);

    // 6. Write Registration Record
    const regData = {
      registrationId,
      lookupToken,
      teamName,
      teamType,
      memberCount: expectedMemberCount,
      domain,
      totalAmount,
      members,
      registrationStatus: "SUBMITTED",
      paymentStatus: "SUBMITTED",
      transactionId,
      utr,
      screenshotUrl,
      createdAt: now,
      updatedAt: now,
      createdByIp: hashedIp,
    };

    await adminDb.collection("registrations").doc(registrationId).set(regData);

    // 7. Write Payment Record
    const paymentId = `PAY-${registrationId}`;
    await adminDb.collection("payments").doc(paymentId).set({
      paymentId,
      registrationId,
      amount: totalAmount,
      transactionId,
      utr,
      screenshotUrl,
      status: "SUBMITTED",
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      registrationId,
      lookupToken,
      message: "Registration submitted successfully for verification",
    });
  } catch (error: unknown) {
    console.error("Registration Submit Error:", error);
    return NextResponse.json(
      { error: "Server error processing registration. Please try again." },
      { status: 500 }
    );
  }
}
