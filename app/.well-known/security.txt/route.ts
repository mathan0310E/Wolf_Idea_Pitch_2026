import { event } from "@/config/event";
import { siteUrl } from "@/lib/site-url";

export function GET() {
  const origin = siteUrl().origin;
  const body = [
    `Contact: mailto:${event.contact.email}`,
    "Expires: 2027-10-09T18:30:00.000Z",
    "Preferred-Languages: en",
    `Canonical: ${origin}/.well-known/security.txt`,
    `Policy: ${origin}/security`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
