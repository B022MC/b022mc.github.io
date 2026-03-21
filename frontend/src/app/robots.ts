import type { MetadataRoute } from "next";
import { SITE_URL, buildSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/*", "/auth"],
      },
    ],
    sitemap: buildSiteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
