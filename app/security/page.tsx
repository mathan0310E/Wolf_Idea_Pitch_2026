import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { event } from "@/config/event";

export const metadata: Metadata = {
  title: "Security — WOLF IDEA PITCH 2026",
  description: "How to report a security issue with the WOLF IDEA PITCH 2026 site.",
  robots: { index: true, follow: true },
};

export default function SecurityPage() {
  return (
    <LegalPage
      eyebrow="SECURITY"
      title="SECURITY"
      accent="CONTACT"
      lede="If you believe you found a vulnerability in this site, tell the organisers directly. Please give us time to investigate before publishing details."
    >
      <LegalSection heading="Report an issue">
        <p>
          Email{" "}
          <a className="text-[#FF0007] underline underline-offset-2" href={`mailto:${event.contact.email}`}>
            {event.contact.email}
          </a>{" "}
          with the page, what you observed, and the impact. A machine-readable copy of
          this contact is at{" "}
          <Link href="/.well-known/security.txt" className="text-[#FF0007] underline underline-offset-2">
            /.well-known/security.txt
          </Link>
          .
        </p>
      </LegalSection>
      <LegalSection heading="What the site already does">
        <ul className="list-disc pl-5 space-y-2">
          <li>Responses send a content security policy, frame blocking, and related security headers.</li>
          <li>The admin area is not linked publicly, is omitted from the sitemap, and is disallowed in robots.txt.</li>
          <li>Admin sign-in uses an email allowlist, a verified email, and a second factor, with an HttpOnly cookie.</li>
          <li>Registration fees are recalculated on the server. Status lookup needs a secret token, not just the registration id.</li>
        </ul>
      </LegalSection>
      <LegalSection heading="Out of scope">
        <p>
          Reports about missing HTTPS on a local development copy, scanner output with
          no demonstrated impact, or issues in third-party services (Firebase, the
          browser, hosting) should go to those providers. Social-engineering attempts
          against participants are not a website bug, but please still tell us if you
          see a fake page using the event name.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
