import type { Metadata } from "next";
import SitePage from "@/components/layout/SitePage";
import PageBanner from "@/components/layout/PageBanner";
import TopPerformers from "@/components/landing/TopPerformers";
import About from "@/components/landing/About";
import CompanyHistory from "@/components/landing/CompanyHistory";
import Metrics from "@/components/landing/Metrics";
import { siteImages } from "@/lib/images";

export const metadata: Metadata = {
  title: "Our Team | Bali Tech Pvt. Ltd",
  description: "Meet the talented professionals behind Bali Tech's success.",
};

export default function OurTeamPage() {
  return (
    <SitePage>
      <PageBanner
        title="Our Team"
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
