import SitePage from "@/components/layout/SitePage";
import JoinUsHero from "@/components/join-us/JoinUsHero";
import JoinUsApplicationForm from "@/components/join-us/JoinUsApplicationForm";
import JoinUsApplyScroll from "@/components/join-us/JoinUsApplyScroll";
import JoinUsJobs from "@/components/join-us/JoinUsJobs";
import JoinUsContact from "@/components/join-us/JoinUsContact";
import JoinUsBenefits from "@/components/join-us/JoinUsBenefits";
import EventsGallerySection from "@/components/landing/EventsGallerySection";
import AnimateSection from "@/components/animations/AnimateSection";
import { getHeadOffice } from "@/lib/offices";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import { Suspense } from "react";

export const metadata = pageMetadata({
  title: "Join Us — Careers & Job Openings",
  description:
    "Call center, customer support, and BPO careers in Rawalpindi & Islamabad. Competitive salary, real career growth, and a professional workplace.",
  path: "/join-us",
});

export default async function JoinUsPage() {
  const headOffice = await getHeadOffice();

  return (
    <SitePage>
      <JsonLd
        data={breadcrumbSchema([{ name: "Careers", path: "/join-us" }])}
      />
      <div className="join-us-page">
        <Suspense fallback={null}>
          <JoinUsApplyScroll />
        </Suspense>
        <JoinUsHero />
        <JoinUsApplicationForm />
        <JoinUsJobs />
        <JoinUsBenefits />
        <AnimateSection delay={0.05}>
          <EventsGallerySection />
        </AnimateSection>
        <JoinUsContact headOffice={headOffice} />
      </div>
    </SitePage>
  );
}
