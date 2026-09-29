import type { MetadataRoute } from "next";
import { adminBasePath } from "@/lib/admin-path";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const origin = siteUrl().origin;
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [`${adminBasePath()}/`, "/admin/", "/api/"],
    },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
