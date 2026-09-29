import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { event } from "@/config/event";

export const metadata: Metadata = {
  title: "Privacy notice — WOLF IDEA PITCH 2026",
  description:
    "How CyberWolf collects, uses, and protects registration data for WOLF IDEA PITCH 2026.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="PRIVACY"
      title="PRIVACY"
      accent="NOTICE"
      lede={`This notice explains what CyberWolf collects when you use the ${event.shortName} site, why it is collected, and how to reach us.`}
    >
      <LegalSection heading="Who we are">
        <p>
          The site is operated by CyberWolf for {event.shortName} on 09 October 2026
          at {event.venue}, {event.city}. Privacy questions go to{" "}
          <a className="text-[#FF0007] underline underline-offset-2" href={`mailto:${event.contact.email}`}>
            {event.contact.email}
          </a>
          .
        </p>
      </LegalSection>
      <LegalSection heading="Data we collect">
        <p>Registration collects the details you submit, including:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Team type and member names, college, and contact details.</li>
          <li>Payment reference (UTR or transaction id) and the payment screenshot you upload.</li>
          <li>A registration id and a secret lookup token used only to check status.</li>
        </ul>
        <p>
          The fee shown in the browser is not trusted. The server recalculates the
          amount from the team size before the registration is stored.
        </p>
      </LegalSection>
      <LegalSection heading="Why we use it">
        <p>
          We use this data to run the event: confirm registration, verify payment,
          let you check status, and let organisers review entries. We do not sell
          this data, and we do not use it for advertising.
        </p>
      </LegalSection>
      <LegalSection heading="Where it is stored">
        <p>
          Registrations are stored in Firebase (Google Cloud), configured from
          server credentials that are not sent to the browser. Payment screenshots
          are stored with the registration record, not in a public file bucket.
        </p>
      </LegalSection>
      <LegalSection heading="Cookies">
        <p>
          Cookie use is described in the{" "}
          <Link href="/cookies" className="text-[#FF0007] underline underline-offset-2">
            cookie notice
          </Link>
          . The public site does not set advertising or analytics cookies.
        </p>
      </LegalSection>
      <LegalSection heading="How long we keep it">
        <p>
          Registration records are kept for the event and a reasonable period
          afterwards so payment questions and attendance can be resolved. Contact{" "}
          {event.contact.email} to ask about a record.
        </p>
      </LegalSection>
      <LegalSection heading="Your choices">
        <p>
          You can refuse non-essential cookies, review the{" "}
          <Link href="/policy" className="text-[#FF0007] underline underline-offset-2">
            event policy
          </Link>
          , and email us to ask what we hold for your registration. Status lookup
          requires both the registration id and the lookup token issued at
          submission. The id alone is not enough.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
