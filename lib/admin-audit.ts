import { adminDb } from "@/lib/firebase-admin";

const REDACTED_KEYS = new Set([
  "screenshotBase64",
  "lookupToken",
  "screenshotUrl",
  "password",
  "privateKey",
]);

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    out[key] = REDACTED_KEYS.has(key) ? "[redacted]" : redact(nested);
  }
  return out;
}

/**
 * Immutable security log. Written only by the Admin SDK.
 * Screenshot bytes, lookup tokens, and secrets are stripped before save.
 */
export async function writeAuditLog(entry: {
  actorUid: string;
  action: string;
  targetId: string;
  before?: unknown;
  after?: unknown;
}): Promise<void> {
  await adminDb.collection("auditLogs").add({
    actorUid: entry.actorUid,
    action: entry.action,
    targetId: entry.targetId.slice(0, 200),
    ...(entry.before !== undefined ? { before: redact(entry.before) } : {}),
    ...(entry.after !== undefined ? { after: redact(entry.after) } : {}),
    timestamp: new Date().toISOString(),
  });
}
