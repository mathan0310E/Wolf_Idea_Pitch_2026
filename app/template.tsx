import * as React from "react";

/**
 * Route transition wrapper.
 *
 * `template.tsx` (unlike `layout.tsx`) remounts on every navigation, so the
 * `animate-fade-in` class plays once per route change — giving a soft cross-
 * fade instead of a hard content swap. It is CSS-only and is neutralised by
 * the `prefers-reduced-motion` reset in app/globals.css.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-in min-h-full flex flex-col flex-1">{children}</div>;
}
