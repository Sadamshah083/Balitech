import SitePage from "@/components/layout/SitePage";
import PageBanner from "@/components/layout/PageBanner";
import ServiceCards from "@/components/landing/ServiceCards";
import MissionServices from "@/components/landing/MissionServices";
import CallCenterFeatures from "@/components/landing/CallCenterFeatures";
import Campaigns from "@/components/landing/Campaigns";
import ContactForm from "@/components/landing/ContactForm";
import { siteImages } from "@/lib/images";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "BPO & Call Center Services",
  description:
    "Professional call center, BPO, customer support, telemarketing, and lead generation services delivered by Bali Tech Pvt. Ltd across Pakistan.",
  path: "/services",
  keywords: [
    "BPO services",
    "call center services",
    "customer support outsourcing",
    "telemarketing Pakistan",
    "lead generation Pakistan",
    "inbound call center",
    "outbound call center",
  ],
});

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
