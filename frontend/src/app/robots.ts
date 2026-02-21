import type { MetadataRoute } from "next";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/my",
          "/bookmarks",
        ],
      },
    ],
    host: siteUrl.origin,
    sitemap: absoluteUrl("/sitemap.xml").toString(),
  };
}
