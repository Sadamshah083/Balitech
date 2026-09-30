import { companyContent } from "@/lib/content";
import { getPublicBlogs } from "@/lib/blogs";
import { SITE_DESCRIPTION, SITE_LEGAL_NAME, SITE_NAME, SITE_URL } from "@/lib/seo";
import { serviceHref, servicePages } from "@/lib/service-pages";
import { joinUsHref, navLinks } from "@/lib/navigation";

export const revalidate = 3600;

/** Plain-language site summary for AI assistants and agents (llmstxt.org). */
export async function GET() {
  const blogs = await getPublicBlogs();
  const services = servicePages.map((page) => {
    const title =
      companyContent.solutions.items.find((item) => item.id === page.slug)?.title ?? page.heading;
    return `- [${title}](${SITE_URL}${serviceHref(page.slug)}): ${page.metaDescription}`;
  });

  const nav = navLinks.map((link) => {
    const path = link.href === "/" ? "" : link.href;
    return `- [${link.label}](${SITE_URL}${path})`;
  });

  const body = [
    `# ${SITE_LEGAL_NAME} (${SITE_NAME})`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    `${SITE_NAME} is a best call center in Rawalpindi and Islamabad, Pakistan — a BPO / call center for inbound, outbound, lead generation, customer support, sales verification, medical billing and B2B outreach.`,
    "",
    `${SITE_NAME} was founded in April 2022 and runs 24/5 operations aligned to US business hours from four offices in Rawalpindi and Islamabad, Pakistan. ${companyContent.ceo.title}: ${companyContent.ceo.name}.`,
    "",
    "## Primary keyword",
    `- Best call center in Rawalpindi — ${SITE_URL}/`,
    `- Best call center in Rawalpindi & Islamabad — ${SITE_URL}/services`,
    `- Best call center in Rawalpindi (offices) — ${SITE_URL}/our-offices`,
    "",
    "## All pages",
    ...nav,
    `- [Careers](${SITE_URL}${joinUsHref}): Open roles and the online application form.`,
    `- [Privacy Policy](${SITE_URL}/privacy-policy)`,
    `- [Recruitment Privacy Notice](${SITE_URL}/recruitment-privacy-notice)`,
    "",
    "## Services",
    `- [All Services](${SITE_URL}/services): Full list of BALITECH BPO and call center services.`,
    ...services,
    "",
    "## Company",
    `- [About BALITECH](${SITE_URL}/about): Company story, mission and leadership.`,
    `- [Our Growth](${SITE_URL}/our-team): Team growth and top performers.`,
    `- [CEO Words](${SITE_URL}/ceo-words): Leadership message from the CEO.`,
    `- [Our Offices](${SITE_URL}/our-offices): Office addresses and contact details in Rawalpindi and Islamabad.`,
    `- [Gallery](${SITE_URL}/gallery): Events, awards and office life.`,
    "",
    "## Careers",
    `- [Join Us](${SITE_URL}${joinUsHref}): Open roles and the online application form.`,
    "",
    "## Blog",
    `- [Blog](${SITE_URL}/blog): Leadership insights and company articles.`,
    ...blogs.map(
      (blog) =>
        `- [${blog.title}](${SITE_URL}/blog/${blog.slug})${blog.excerpt ? `: ${blog.excerpt}` : ""}`
    ),
    "",
    "## Contact",
    `- Website: ${SITE_URL}/`,
    "- Email: hr@balitech.org",
    "- Phone: +92 370 0585660",
    "- Phone: +92 327 1233435",
    "",
    "## Machine-readable",
    `- Sitemap: ${SITE_URL}/sitemap.xml`,
    `- Robots: ${SITE_URL}/robots.txt`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
