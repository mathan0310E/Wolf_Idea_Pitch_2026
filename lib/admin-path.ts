/** Browser path for organizer pages. The segment is a SHA-256 digest. */
export function adminBasePath(): string {
  const segment = process.env.NEXT_PUBLIC_ADMIN_PATH?.trim() ?? "";
  if (!/^[a-f0-9]{64}$/.test(segment)) {
    throw new Error("Admin path is not configured.");
  }
  return `/${segment}`;
}

/** `/login` → `/{sha256}/login`. Empty subpath is the base itself. */
export function adminHref(subpath = ""): string {
  if (!subpath || subpath === "/") return adminBasePath();
  const suffix = subpath.startsWith("/") ? subpath : `/${subpath}`;
  return `${adminBasePath()}${suffix}`;
}
