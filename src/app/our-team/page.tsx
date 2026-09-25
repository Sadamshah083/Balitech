import SitePage from "@/components/layout/SitePage";
import PageBanner from "@/components/layout/PageBanner";
import CompanyHistory from "@/components/landing/CompanyHistory";
import TopPerformers from "@/components/landing/TopPerformers";
import CallCenterFeatures from "@/components/landing/CallCenterFeatures";
import AnimateSection from "@/components/animations/AnimateSection";
import { siteImages } from "@/lib/images";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import { companyContent } from "@/lib/content";

export const metadata = pageMetadata({
  title: "Our Growth & Top Performers",
  description: `From 7 people to ${companyContent.workforce.count} professionals — meet the team, top performers, and leadership behind Bali Tech Pvt. Ltd's rapid growth across Pakistan.`,
  path: "/our-team",
});

/**
 * Our Growth page = the people and expansion story: history, recognition,
 * and the organizational strengths behind the growth. Culture-day photography
 * lives on /gallery so event media stays in one place.
 */
export default function OurTeamPage() {
  return (
    <SitePage>
      <JsonLd
        data={breadcrumbSchema([{ name: "Our Growth", path: "/our-team" }])}
      />
      <PageBanner
        title="Our Growth"
        subtitle="Dedicated professionals committed to delivering excellence every day."
        image={siteImages.career}
      />
      <CompanyHistory />
      <TopPerformers />
      <AnimateSection delay={0.05}>
        <CallCenterFeatures />
      </AnimateSection>
    </SitePage>
  );
}
