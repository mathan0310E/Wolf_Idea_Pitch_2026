import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import { sanitizeForCsv } from "@/lib/validation";
import Papa from "papaparse";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  try {
    const snapshot = await adminDb.collection("registrations").orderBy("createdAt", "desc").get();

    const rows: Record<string, string>[] = [];

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const members = (data.members as Array<Record<string, unknown>>) || [];
      const leader = (members[0] || {}) as Record<string, unknown>;

      rows.push({
        "Registration ID": sanitizeForCsv(data.registrationId),
        "Team Name": sanitizeForCsv(data.teamName),
        Category: sanitizeForCsv(data.teamType),
        "Member Count": sanitizeForCsv(data.memberCount),
        Domain: sanitizeForCsv(data.domain),
        "Total Fee (INR)": sanitizeForCsv(data.totalAmount),
        "Payment Status": sanitizeForCsv(data.paymentStatus),
        "Registration Status": sanitizeForCsv(data.registrationStatus),
        "Transaction ID": sanitizeForCsv(data.transactionId),
        UTR: sanitizeForCsv(data.utr),
        "Leader Name": sanitizeForCsv(leader.name),
        "Leader Email": sanitizeForCsv(leader.email),
        "Leader Phone": sanitizeForCsv(leader.phone),
        "Leader College": sanitizeForCsv(leader.college),
        "Leader Roll No": sanitizeForCsv(leader.registerNumber),
        "Created At": sanitizeForCsv(data.createdAt),
      });
    });

    const csvContent = Papa.unparse(rows);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="wolf_idea_pitch_registrations_${Date.now()}.csv"`,
      },
    });
  } catch (error: unknown) {
    console.error("Export Error:", error);
    return NextResponse.json({ error: "Failed to generate export file" }, { status: 500 });
  }
}
