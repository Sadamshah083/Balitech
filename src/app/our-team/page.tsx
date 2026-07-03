import SitePage from "@/components/layout/SitePage";
import PageBanner from "@/components/layout/PageBanner";
import TopPerformers from "@/components/landing/TopPerformers";
import About from "@/components/landing/About";
import CompanyHistory from "@/components/landing/CompanyHistory";
import Metrics from "@/components/landing/Metrics";
import { siteImages } from "@/lib/images";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Our Growth & Top Performers",
  description:
    "From 7 people to 500+ professionals — meet the team, top performers, and leadership behind Bali Tech Pvt. Ltd's rapid growth across Pakistan.",
  path: "/our-team",
  keywords: [
    "Bali Tech team",
    "top performers",
    "BALITECH growth",
    "BPO leadership Pakistan",
    "Sheraz Bali",
  ],
});

export default function OurTeamPage() {
  return (
    <SitePage>
      <PageBanner
        title="Our Growth"
        subtitle="Dedicated professionals committed to delivering excellence every day."
        image={siteImages.career}
      />
      <CompanyHistory />
      <About />
      <TopPerformers />
      <Metrics />
    </SitePage>
  );
}
