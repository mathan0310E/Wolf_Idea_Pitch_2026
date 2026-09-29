import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { event } from "@/config/event";

export const metadata: Metadata = {
  title: "Cookie notice — WOLF IDEA PITCH 2026",
  description: "Cookies used by the WOLF IDEA PITCH 2026 site, and how to control them.",
};

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="COOKIES"
      title="COOKIE"
      accent="NOTICE"
      lede="This site uses a small set of first-party cookies. It does not use advertising cookies or third-party trackers."
    >
      <LegalSection heading="Essential cookies">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <span className="text-white">Admin sign-in cookie.</span> Set only after a
            verified organiser signs in. It is HttpOnly, SameSite=Lax, limited to the
            admin area, and marked Secure on HTTPS. It is not readable by page scripts.
          </li>
          <li>
            <span className="text-white">cw_cookie_consent.</span> Stores whether you
            chose Accept or Essential only. SameSite=Lax, lasts 180 days, and is marked
            Secure on HTTPS. It holds no personal data.
          </li>
        </ul>
      </LegalSection>
      <LegalSection heading="What we do not set">
        <p>
          There is no advertising cookie, no cross-site tracking cookie, and no
          analytics cookie on the public pages. Firebase authentication for organisers
          uses the admin sign-in described above.
        </p>
      </LegalSection>
      <LegalSection heading="How to control cookies">
        <p>
          Use Essential only or Accept on the notice at the bottom of the site. You can
          also delete cookies for this site in your browser. Blocking essential cookies
          stops organiser sign-in and hides whether you already answered the notice.
        </p>
        <p>
          Related pages:{" "}
          <Link href="/privacy" className="text-[#FF0007] underline underline-offset-2">
            Privacy notice
          </Link>
          {" · "}
          <Link href="/security" className="text-[#FF0007] underline underline-offset-2">
            Security
          </Link>
          . Questions: {event.contact.email}.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
