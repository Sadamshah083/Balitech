import SitePage from "@/components/layout/SitePage";
import PageBanner from "@/components/layout/PageBanner";
import AboutStory from "@/components/landing/AboutStory";
import CompanyValues from "@/components/about/CompanyValues";
import AnimatedExploreLinks from "@/components/landing/AnimatedExploreLinks";
import AnimateSection from "@/components/animations/AnimateSection";
import { aboutBannerImage } from "@/lib/page-imagery";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import { companyContent } from "@/lib/content";

const { count: headcount } = companyContent.workforce;

export const metadata = pageMetadata({
  title: "About BALITECH",
  description: `Founded April 2022, BALITECH now runs 24/5 international BPO campaigns with ${headcount} professionals across four Rawalpindi and Islamabad offices.`,
  path: "/about",
});

/**
 * About page = company identity: story, timeline, purpose and operating
 * principles. The CEO leadership showcase belongs to /ceo-words so his portrait and
 * message are not repeated on two pages.
 */
export default function AboutPage() {
  return (
    <SitePage>
      <JsonLd
        data={breadcrumbSchema([{ name: "About", path: "/about" }])}
      />
      <PageBanner
        title="About BALITECH"
        subtitle={`A BPO organization built from a 7-person team in 2022 into ${headcount} professionals delivering international campaigns.`}
        image={aboutBannerImage}
      />
      <AnimateSection>
        <AboutStory />
      </AnimateSection>
      <AnimateSection delay={0.05}>
        <CompanyValues />
      </AnimateSection>
      <AnimateSection delay={0.05}>
        <AnimatedExploreLinks />
      </AnimateSection>
    </SitePage>
  );
}
