import type { MetadataRoute } from "next";
import { publicRoutes } from "@/lib/public-routes";
import { siteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteUrl().origin;
  const lastModified = new Date("2026-09-28");

  return publicRoutes.map((route) => ({
    url: `${origin}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
