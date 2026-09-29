"use client";

import * as React from "react";
import Link from "next/link";

const COOKIE_NAME = "cw_cookie_consent";
const MAX_AGE = 60 * 60 * 24 * 180;

function readConsent(): string | null {
  const match = document.cookie.match(/(?:^|; )cw_cookie_consent=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function writeConsent(value: "accepted" | "essential") {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_NAME}=${value}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

export function CookieNotice() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (!readConsent()) setVisible(true);
  }, []);

  if (!visible) return null;

  const choose = (value: "accepted" | "essential") => {
    writeConsent(value);
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] p-4 sm:p-6">
      <div className="mx-auto max-w-3xl rounded-xl border border-white/15 bg-[#111111]/95 p-4 sm:p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur-md">
        <p className="text-sm text-zinc-200 leading-relaxed">
          This site stores only essential cookies: the admin sign-in cookie and this
          choice. It does not set advertising cookies.{" "}
          <Link href="/cookies" className="text-[#FF0007] underline underline-offset-2">
            Cookie notice
          </Link>
          {" · "}
          <Link href="/privacy" className="text-[#FF0007] underline underline-offset-2">
            Privacy
          </Link>
        </p>
        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => choose("essential")}
            className="inline-flex min-h-10 items-center justify-center border border-white/30 px-4 text-[10px] font-bold uppercase tracking-[0.14em] text-white hover:bg-white/10"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="inline-flex min-h-10 items-center justify-center bg-[#FF0007] px-4 text-[10px] font-bold uppercase tracking-[0.14em] text-white hover:opacity-95"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
