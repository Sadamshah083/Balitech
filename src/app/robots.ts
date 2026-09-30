import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/* Read-only endpoints that public pages fetch after hydration (careers rail,
   join-us form, office list). Crawlers need them to render those pages, and
   the longer Allow wins over the blanket /api/ Disallow. */
const PUBLIC_API_READS = [
  "/api/campaigns?public=true",
  "/api/vacancies?public=true",
  "/api/offices?public=true",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", ...PUBLIC_API_READS],
      /* No trailing slash, so /admin itself is covered as well as /admin/*. */
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
