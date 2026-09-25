import { companyContent } from "@/lib/content";
import { getPublicBlogs } from "@/lib/blogs";
import { SITE_DESCRIPTION, SITE_LEGAL_NAME, SITE_URL } from "@/lib/seo";
import { serviceHref, servicePages } from "@/lib/service-pages";

export const revalidate = 3600;

/** Plain-language site summary for AI assistants and agents (llmstxt.org). */
export async function GET() {
  const blogs = await getPublicBlogs();
  const services = servicePages.map((page) => {
    const title =
      companyContent.solutions.items.find((item) => item.id === page.slug)?.title ?? page.heading;
    return `- [${title}](${SITE_URL}${serviceHref(page.slug)}): ${page.metaDescription}`;
  });

  const body = [
    `# ${SITE_LEGAL_NAME} (BALITECH)`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    `BALITECH was founded in April 2022 and runs 24/5 operations aligned to US business hours from four offices in Rawalpindi and Islamabad, Pakistan. ${companyContent.ceo.title}: ${companyContent.ceo.name}.`,
    "",
    "## Services",
    ...services,
    "",
    "## Company",
    `- [About BALITECH](${SITE_URL}/about): Company story, mission and leadership.`,
    `- [Our Growth](${SITE_URL}/our-team): Team growth and top performers.`,
    `- [CEO Words](${SITE_URL}/ceo-words): Leadership message from the CEO.`,
    `- [Our Offices](${SITE_URL}/our-offices): Office addresses and contact details.`,
    `- [Gallery](${SITE_URL}/gallery): Events, awards and office life.`,
    "",
    "## Careers",
    `- [Join Us](${SITE_URL}/join-us): Open roles and the online application form.`,
    "",
    "## Blog",
    ...blogs.map((blog) => `- [${blog.title}](${SITE_URL}/blog/${blog.slug})`),
    "",
    "## Contact",
    "- Email: hr@balitech.org",
    "- Phone: +92 370 0585660",
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
