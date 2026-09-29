import { adminDb } from "@/lib/firebase-admin";

const BACKUP_DOC_BUDGET = 900_000;

/**
 * Store a copy of a document that is about to be deleted.
 * Screenshot Base64 is moved to `backupScreenshots` so the archive
 * document stays under Firestore's 1 MiB limit. Clients cannot read
 * either collection (see firestore.rules).
 */
export async function archiveDocument(input: {
  sourceCollection: string;
  sourceId: string;
  data: Record<string, unknown>;
  actorUid: string;
  reason: string;
}): Promise<string> {
  const deletedAt = new Date().toISOString();
  const backupId = `${input.sourceCollection}_${input.sourceId}_${deletedAt.replace(/[:.]/g, "-")}`;
  const snapshot: Record<string, unknown> = { ...input.data };
  const screenshot = snapshot.screenshotBase64;
  delete snapshot.screenshotBase64;

  let screenshotStored = false;
  if (typeof screenshot === "string" && screenshot.length > 0) {
    await adminDb.collection("backupScreenshots").doc(backupId).set({
      backupId,
      sourceCollection: input.sourceCollection,
      sourceId: input.sourceId,
      screenshotBase64: screenshot,
      screenshotMimeType: snapshot.screenshotMimeType ?? null,
      screenshotSize: snapshot.screenshotSize ?? null,
      deletedAt,
    });
    snapshot.screenshotBase64 = "[stored in backupScreenshots]";
    screenshotStored = true;
  }

  const record = {
    backupId,
    sourceCollection: input.sourceCollection,
    sourceId: input.sourceId,
    deletedAt,
    deletedBy: input.actorUid,
    reason: input.reason.slice(0, 300),
    screenshotStored,
    data: snapshot,
  };

  if (JSON.stringify(record).length > BACKUP_DOC_BUDGET) {
    throw new Error("Backup document would exceed the Firestore size limit.");
  }

  await adminDb.collection("backups").doc(backupId).set(record);
  return backupId;
}
