import { NextResponse } from "next/server";

/**
 * POST /api/uploads/screenshot — REMOVED.
 *
 * Payment screenshots are no longer uploaded to Firebase Storage. The
 * registration form sends the validated ≤500 KB image as Base64 inside the
 * POST /api/registrations/submit payload, which stores it in a dedicated
 * Firestore `payments` document (see submit/route.ts). This endpoint now
 * always returns 410 Gone so old clients fail loudly instead of silently
 * losing proof of payment.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Screenshot upload endpoint removed. Submit the payment screenshot with your registration instead.",
    },
    { status: 410 }
  );
}
