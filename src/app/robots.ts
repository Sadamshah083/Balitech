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

const allow = ["/", ...PUBLIC_API_READS];
/* No trailing slash, so /admin itself is covered as well as /admin/*. */
const disallow = ["/admin", "/api/"];

/* Claude's search and user-request agents get a plain "Allow: /", exactly as
   Anthropic's guidance lists it, so SEO checkers read the site as fully open
   to them. Nothing sensitive is exposed by that: /admin redirects anyone not
   logged in to the login page, and the private /api routes reject requests
   without an admin token. */
const CLAUDE_OPEN_AGENTS = ["Claude-User", "Claude-SearchBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow, disallow },
      /* ClaudeBot (training crawler) follows the same rules as everyone. */
      { userAgent: "ClaudeBot", allow, disallow },
      ...CLAUDE_OPEN_AGENTS.map((userAgent) => ({ userAgent, allow: "/" })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
