import SitePage from "@/components/layout/SitePage";
import PageBanner from "@/components/layout/PageBanner";
import SolutionsGrid from "@/components/landing/SolutionsGrid";
import ServiceDelivery from "@/components/services/ServiceDelivery";
import EngagementModels from "@/components/services/EngagementModels";
import ServicesFaq from "@/components/services/ServicesFaq";
import ContactForm from "@/components/landing/ContactForm";
import AnimateSection from "@/components/animations/AnimateSection";
import JsonLd from "@/components/seo/JsonLd";
import { companyContent } from "@/lib/content";
import { servicesBannerImage } from "@/lib/page-imagery";
import {
  breadcrumbSchema,
  faqSchema,
  pageMetadata,
  serviceSchema,
} from "@/lib/seo";

export const metadata = pageMetadata({
  title: "BPO & Call Center Services",
  description:
    "Inbound and outbound call center, customer support, lead generation, sales verification and medical billing outsourcing from BALITECH in Pakistan.",
  path: "/services",
});

/**
 * Services page = scope, delivery mechanics and commercial structure. No
 * recruitment content, and no reuse of the home page positioning sections.
 */
export default function ServicesPage() {
  return (
    <SitePage>
      <JsonLd
        data={[
          breadcrumbSchema([{ name: "Services", path: "/services" }]),
          serviceSchema(
            companyContent.solutions.items.map((item) => ({
              title: item.title,
              text: item.summary,
            }))
          ),
          faqSchema(companyContent.servicesFaq.items),
        ]}
      />
      <PageBanner
        title="Our Services"
        subtitle="Dedicated outsourcing teams for inbound, outbound, support, and back-office operations — managed against your performance targets."
        image={servicesBannerImage}
      />
      <AnimateSection>
        <SolutionsGrid />
      </AnimateSection>
      <AnimateSection delay={0.05}>
        <ServiceDelivery />
      </AnimateSection>
      <AnimateSection delay={0.05}>
        <EngagementModels />
      </AnimateSection>
      <AnimateSection delay={0.05}>
        <ServicesFaq />
      </AnimateSection>
      <ContactForm />
    </SitePage>
  );
}
