import type { Metadata } from "next";
import SitePage from "@/components/layout/SitePage";
import PageBanner from "@/components/layout/PageBanner";
import ServiceCards from "@/components/landing/ServiceCards";
import MissionServices from "@/components/landing/MissionServices";
import CallCenterFeatures from "@/components/landing/CallCenterFeatures";
import Campaigns from "@/components/landing/Campaigns";
import ContactForm from "@/components/landing/ContactForm";
import { siteImages } from "@/lib/images";

export const metadata: Metadata = {
  title: "Services | Bali Tech Pvt. Ltd",
  description: "Professional call center and BPO services by Bali Tech.",
};

export default function ServicesPage() {
  return (
    <SitePage>
      <PageBanner
        title="Our Services"
        subtitle="Comprehensive outsourcing solutions tailored for your business growth."
        image={siteImages.office}
      />
      <Campaigns />
      <ServiceCards />
      <MissionServices />
      <CallCenterFeatures />
      <ContactForm />
    </SitePage>
  );
}
