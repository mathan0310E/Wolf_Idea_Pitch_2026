import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { event, feePerMember } from "@/config/event";

export const metadata: Metadata = {
  title: "Event policy — WOLF IDEA PITCH 2026",
  description: "Participation, payment verification, and acceptable use for WOLF IDEA PITCH 2026.",
};

export default function PolicyPage() {
  return (
    <LegalPage
      eyebrow="POLICY"
      title="EVENT"
      accent="POLICY"
      lede={`These terms apply when you browse or register for ${event.shortName}. Registering means you accept this policy and the published rules.`}
    >
      <LegalSection heading="Participation">
        <p>
          Participants must give accurate team and college details. Team size is Solo,
          Duo, or Squad, as published on the rules page. Ideas and material submitted
          for the event must be original work created for this event. Judging decisions
          are final.
        </p>
      </LegalSection>
      <LegalSection heading="Fees and payment verification">
        <p>
          The fee is ₹{feePerMember} per participant. The server calculates the total
          from the team size. A registration is not confirmed until organisers verify
          the UTR or transaction id and the payment screenshot. Submitting false payment
          proof is a reason to reject the registration.
        </p>
      </LegalSection>
      <LegalSection heading="Acceptable use">
        <p>
          Do not attempt to access another team&apos;s registration, the admin area, or
          any system you are not authorised to use. Do not submit malware, scrape the
          site in a way that disrupts it, or misuse contact details published for the
          event. Status checks require the registration id and the lookup token issued
          to that team.
        </p>
      </LegalSection>
      <LegalSection heading="Security and privacy">
        <p>
          How data is handled is described in the{" "}
          <Link href="/privacy" className="text-[#FF0007] underline underline-offset-2">
            privacy notice
          </Link>
          , cookies in the{" "}
          <Link href="/cookies" className="text-[#FF0007] underline underline-offset-2">
            cookie notice
          </Link>
          , and how to report a vulnerability in the{" "}
          <Link href="/security" className="text-[#FF0007] underline underline-offset-2">
            security page
          </Link>
          .
        </p>
      </LegalSection>
      <LegalSection heading="Contact">
        <p>
          {event.venue}, {event.city}. Email{" "}
          <a className="text-[#FF0007] underline underline-offset-2" href={`mailto:${event.contact.email}`}>
            {event.contact.email}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
