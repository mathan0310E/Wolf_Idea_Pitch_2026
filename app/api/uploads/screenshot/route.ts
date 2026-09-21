import { NextRequest, NextResponse } from "next/server";
import { adminStorage, isFirebaseAdminReal } from "@/lib/firebase-admin";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB — matches FileDropzone client guard
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * POST /api/uploads/screenshot
 * Body: { fileName?: string, dataUrl: "data:image/...;base64,..." }
 *
 * Validates type/size server-side, stores the file in Firebase Storage
 * (payment-screenshots/) via the Admin SDK, and returns a long-lived
 * read URL for the caller to attach to the registration payload.
 *
 * Dev/mock mode (no Admin SDK credentials): echoes the data URL back so the
 * full flow can be tested end-to-end without Firebase. Production Firestore
 * documents must NEVER embed multi-MB data URLs (1 MiB doc limit) — the
 * submit route rejects oversized inline screenshots when real Firebase is
 * configured.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, dataUrl } = body as {
      fileName?: string;
      dataUrl?: string;
    };

    if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
      return NextResponse.json(
        { error: "No screenshot image provided." },
        { status: 400 }
      );
    }

    const match = dataUrl.match(/^data:(image\/(jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!match) {
      return NextResponse.json(
        { error: "Only JPG, PNG, and WEBP screenshots are accepted." },
        { status: 400 }
      );
    }

    const mime = match[1];
    if (!ALLOWED_MIME.has(mime)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, and WEBP screenshots are accepted." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(match[3], "base64");
    if (buffer.length === 0 || buffer.length > MAX_BYTES) {
      return NextResponse.json(
        { error: "Screenshot must be a non-empty image under 5MB." },
        { status: 400 }
      );
    }

    // Dev/mock fallback — no Storage bucket available
    if (!isFirebaseAdminReal()) {
      return NextResponse.json({
        success: true,
        url: dataUrl,
        path: null,
        storage: "inline-dev",
      });
    }

    const safeName = (fileName || "screenshot.png")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 80);
    const path = `payment-screenshots/${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}/${safeName}`;

    const bucket = adminStorage.bucket();
    const file = bucket.file(path);
    await file.save(buffer, {
      metadata: { contentType: mime },
    });

    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: "2036-10-09",
    });

    return NextResponse.json({ success: true, url: signedUrl, path });
  } catch (error) {
    console.error("Screenshot Upload Error:", error);
    return NextResponse.json(
      { error: "Failed to upload screenshot. Please try again." },
      { status: 500 }
    );
  }
}
