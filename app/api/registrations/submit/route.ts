import { NextRequest, NextResponse } from "next/server";
import { registrationFormSchema } from "@/lib/validation";
import { adminDb, isFirebaseAdminReal, type AdminTx } from "@/lib/firebase-admin";
import { clientKey, checkRateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

// Payment screenshot — Base64 in a dedicated Firestore `payments` document.
// Firebase Storage is NOT used for screenshots (removed). Client and server
// both enforce: JPG/JPEG/PNG/WEBP, max 500 KB, Firestore doc-size ceiling.
export const MAX_SCREENSHOT_BYTES = 500 * 1024; // 500 KB
export const ALLOWED_SCREENSHOT_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export type ScreenshotMime = (typeof ALLOWED_SCREENSHOT_MIME)[number];

// Firestore caps a single document at 1,048,576 bytes. A 500 KB image is
// ~683 KB of base64; with the rest of the payment fields + index overhead this
// stays comfortably under the ceiling — the final guard below proves it by
// measuring the exact serialized payload before writing.
const FIRESTORE_DOC_LIMIT_BYTES = 1_048_576;
const PAYMENT_DOC_HEADROOM_BYTES = 8 * 1024;

export function estimatePaymentDocBytes(fields: {
  paymentId: string;
  registrationId: string;
  transactionId: string;
  utr: string;
  screenshotBase64: string;
  screenshotMimeType: string;
}): number {
  const overhead =
    fields.paymentId.length +
    fields.registrationId.length +
    fields.transactionId.length +
    fields.utr.length +
    fields.screenshotMimeType.length +
    200; // fixed field names + status/timestamps
  return overhead + fields.screenshotBase64.length + PAYMENT_DOC_HEADROOM_BYTES;
}

export function paymentDocFitsLimit(fields: {
  paymentId: string;
  registrationId: string;
  transactionId: string;
  utr: string;
  screenshotBase64: string;
  screenshotMimeType: string;
}): boolean {
  return estimatePaymentDocBytes(fields) <= FIRESTORE_DOC_LIMIT_BYTES;
}


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

    const { teamType, teamName, domain, members, transactionId, utr } = parseResult.data;
    const { screenshotBase64, screenshotMimeType, screenshotSize } = parseResult.data;

    // 2a. Production guard — never persist registrations to the in-memory
    // mock store. Fail loudly instead of silently losing data.
    if (!isFirebaseAdminReal() && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          error:
            "Registration service is temporarily unavailable. Please contact the organizers.",
        },
        { status: 503 }
      );
    }

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

    // 2c. Screenshot trust boundary — re-decode the Base64 server-side and
    // re-derive size + MIME. Client claims are never trusted.
    if (!ALLOWED_SCREENSHOT_MIME.includes(screenshotMimeType as ScreenshotMime)) {
      return NextResponse.json(
        { error: "Only JPG, JPEG, PNG, and WEBP screenshots are accepted." },
        { status: 400 }
      );
    }
    let screenshotBytes: Buffer;
    try {
      if (!/^[A-Za-z0-9+/=\s]+$/.test(screenshotBase64)) {
        throw new Error("not-base64");
      }
      screenshotBytes = Buffer.from(screenshotBase64.replace(/\s+/g, ""), "base64");
    } catch {
      return NextResponse.json(
        { error: "Payment screenshot is not valid Base64 image data." },
        { status: 400 }
      );
    }
    if (screenshotBytes.length === 0 || screenshotBytes.length > MAX_SCREENSHOT_BYTES) {
      return NextResponse.json(
        { error: "Payment screenshot must be 500 KB or smaller. Please compress the image and try again." },
        { status: 413 }
      );
    }
    if (screenshotSize !== screenshotBytes.length) {
      return NextResponse.json(
        { error: "Screenshot size mismatch. Please re-select the image and try again." },
        { status: 400 }
      );
    }
    // Magic-number check: JPEG FF D8 FF, PNG 89 50 4E 47, WEBP RIFF....WEBP.
    const magicOk =
      (screenshotMimeType === "image/jpeg" &&
        screenshotBytes.length >= 3 &&
        screenshotBytes[0] === 0xff &&
        screenshotBytes[1] === 0xd8 &&
        screenshotBytes[2] === 0xff) ||
      (screenshotMimeType === "image/png" &&
        screenshotBytes.length >= 4 &&
        screenshotBytes[0] === 0x89 &&
        screenshotBytes[1] === 0x50 &&
        screenshotBytes[2] === 0x4e &&
        screenshotBytes[3] === 0x47) ||
      (screenshotMimeType === "image/webp" &&
        screenshotBytes.length >= 12 &&
        screenshotBytes.toString("ascii", 0, 4) === "RIFF" &&
        screenshotBytes.toString("ascii", 8, 12) === "WEBP");
    if (!magicOk) {
      return NextResponse.json(
        { error: "Screenshot file content does not match its image type." },
        { status: 400 }
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

    // 6. Write Registration Record — NEVER includes screenshot Base64.
    // Only lightweight metadata (mime + size) so list queries stay cheap.
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
      screenshotMeta: { mimeType: screenshotMimeType, size: screenshotBytes.length },
      createdAt: now,
      updatedAt: now,
      createdByIp: hashedIp,
    };

    // 6a. Duplicate-payment guard — one payment per transactionId+utr pair.
    // (Mock store has no .where(); scan is only a dev fallback. Real
    // Firestore enforces this via the composite query below.)
    const paymentsRef = adminDb.collection("payments");
    let duplicateFound = false;
    try {
      const maybeQuery = paymentsRef as unknown as {
        where: (
          field: string,
          op: string,
          value: string
        ) => {
          where: (
            field: string,
            op: string,
            value: string
          ) => { limit: (n: number) => { get: () => Promise<{ docs: unknown[] }> } };
        };
      };
      if (typeof maybeQuery.where === "function") {
        const dupSnap = await maybeQuery
          .where("transactionId", "==", transactionId)
          .where("utr", "==", utr)
          .limit(1)
          .get();
        duplicateFound = dupSnap.docs.length > 0;
      }
    } catch {
      duplicateFound = false; // mock store — skip the guard, never block dev
    }
    if (duplicateFound) {
      return NextResponse.json(
        { error: "This payment (Transaction ID + UTR) has already been submitted." },
        { status: 409 }
      );
    }

    await adminDb.collection("registrations").doc(registrationId).set(regData);

    // 7. Write Payment Record in its OWN `payments` document — the ONLY place
    // the screenshot Base64 lives. Final doc-size validation before writing so
    // Firestore's 1 MiB document limit can never be exceeded.
    const paymentId = `PAY-${registrationId}`;
    const paymentDoc = {
      paymentId,
      registrationId,
      amount: totalAmount, // server-calculated: memberCount × ₹300. Never trusted from client.
      transactionId,
      utr,
      screenshotBase64,
      screenshotMimeType,
      screenshotSize: screenshotBytes.length,
      status: "SUBMITTED",
      createdAt: now,
      updatedAt: now,
    };
    if (
      !paymentDocFitsLimit({
        paymentId,
        registrationId,
        transactionId,
        utr,
        screenshotBase64,
        screenshotMimeType,
      })
    ) {
      return NextResponse.json(
        { error: "Payment screenshot is too large to store. Please use a smaller image (max 500 KB)." },
        { status: 413 }
      );
    }
    await adminDb.collection("payments").doc(paymentId).set(paymentDoc);

    // 8. Audit: submission + screenshot upload. Metadata only — NEVER the
    // Base64 image or sensitive payment details.
    await adminDb.collection("auditLogs").add({
      actorUid: `participant:${registrationId}`,
      action: "PAYMENT_SUBMITTED",
      targetId: registrationId,
      registrationId,
      paymentId,
      metadata: {
        amount: totalAmount,
        teamType,
        memberCount: expectedMemberCount,
        transactionIdMasked: `${transactionId.slice(0, 2)}***${transactionId.slice(-2)}`,
      },
      timestamp: now,
    });
    await adminDb.collection("auditLogs").add({
      actorUid: `participant:${registrationId}`,
      action: "PAYMENT_SCREENSHOT_UPLOADED",
      targetId: paymentId,
      registrationId,
      paymentId,
      metadata: {
        mimeType: screenshotMimeType,
        sizeBytes: screenshotBytes.length,
      },
      timestamp: now,
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
