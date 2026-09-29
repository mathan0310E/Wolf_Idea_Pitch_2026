/**
 * Server-only Firebase Auth calls. The web API key is read from
 * FIREBASE_WEB_API_KEY and is never sent to the browser. Errors from
 * the upstream request are not rethrown, because the request URL
 * contains the key.
 */

export type IdentityErrorCode =
  | "invalid-credential"
  | "too-many-requests"
  | "user-disabled"
  | "unavailable"
  | "unverified";

type IdentityResult =
  | { ok: true; idToken: string; emailVerified: boolean }
  | { ok: false; code: IdentityErrorCode };

function apiKey(): string | null {
  const key = process.env.FIREBASE_WEB_API_KEY?.trim();
  return key ? key : null;
}

async function postIdentity(
  method: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; message: string; payload: Record<string, unknown> }> {
  const key = apiKey();
  if (!key) return { ok: false, message: "unavailable", payload: {} };

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/${method}?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );
    const payload = (await response.json().catch(() => ({}))) as {
      error?: { message?: string };
    } & Record<string, unknown>;
    const message =
      typeof payload.error?.message === "string" ? payload.error.message : "";
    return { ok: response.ok, message, payload };
  } catch {
    return { ok: false, message: "unavailable", payload: {} };
  }
}

function mapAuthError(message: string): IdentityErrorCode {
  if (
    message.includes("INVALID_PASSWORD") ||
    message.includes("EMAIL_NOT_FOUND") ||
    message.includes("INVALID_LOGIN_CREDENTIALS") ||
    message.includes("INVALID_EMAIL")
  ) {
    return "invalid-credential";
  }
  if (message.includes("TOO_MANY_ATTEMPTS") || message.includes("TOO_MANY_REQUESTS")) {
    return "too-many-requests";
  }
  if (message.includes("USER_DISABLED")) return "user-disabled";
  return "unavailable";
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<IdentityResult> {
  const signedIn = await postIdentity("accounts:signInWithPassword", {
    email,
    password,
    returnSecureToken: true,
  });
  if (!signedIn.ok) return { ok: false, code: mapAuthError(signedIn.message) };

  const idToken = signedIn.payload.idToken;
  if (typeof idToken !== "string" || idToken.length < 20) {
    return { ok: false, code: "unavailable" };
  }

  const lookup = await postIdentity("accounts:lookup", { idToken });
  const users = lookup.payload.users;
  const emailVerified =
    lookup.ok &&
    Array.isArray(users) &&
    users[0] &&
    typeof users[0] === "object" &&
    (users[0] as { emailVerified?: unknown }).emailVerified === true;

  if (!emailVerified) {
    await postIdentity("accounts:sendOobCode", {
      requestType: "VERIFY_EMAIL",
      idToken,
    });
    return { ok: false, code: "unverified" };
  }

  return { ok: true, idToken, emailVerified: true };
}

/** Always resolves without revealing whether the address exists. */
export async function sendPasswordReset(email: string): Promise<"ok" | "limited" | "unavailable"> {
  const result = await postIdentity("accounts:sendOobCode", {
    requestType: "PASSWORD_RESET",
    email,
  });
  if (result.ok) return "ok";
  if (mapAuthError(result.message) === "too-many-requests") return "limited";
  if (
    result.message.includes("EMAIL_NOT_FOUND") ||
    result.message.includes("INVALID_EMAIL")
  ) {
    return "ok";
  }
  if (!apiKey()) return "unavailable";
  return "ok";
}
