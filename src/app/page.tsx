import SitePage from "@/components/layout/SitePage";
import AnimateSection from "@/components/animations/AnimateSection";
import LightPath from "@/components/effects/LightPath";
import Hero from "@/components/landing/Hero";
import AudiencePaths from "@/components/landing/AudiencePaths";
import Metrics from "@/components/landing/Metrics";
import ServiceCards from "@/components/landing/ServiceCards";
import WhyBalitech from "@/components/landing/WhyBalitech";
import HowWeWork from "@/components/landing/HowWeWork";
import CaseStudies from "@/components/landing/CaseStudies";
import Testimonials from "@/components/landing/Testimonials";
import InsideCompany from "@/components/home/InsideCompany";
import HomeCareers from "@/components/home/HomeCareers";
import HomeLocations from "@/components/home/HomeLocations";
import GoalsFramework from "@/components/home/GoalsFramework";
import BusinessInquiry from "@/components/home/BusinessInquiry";

/**
 * Home page opens with the client pitch, then surfaces open roles right under
 * the hero so candidates reach the application form in one click. Every card
 * there deep-links into /join-us, and the culture, awards and leadership
 * stories stay on /join-us, /gallery, /our-team and /about so nothing here
 * competes for attention.
 */
export default function Home() {
  return (
    <SitePage indexTheme>
      {/* Spans the whole page, so it is a direct child of the page shell
          rather than nested inside any one section. */}
      <LightPath />

      <Hero />
      <Metrics />

      <AnimateSection>
        <HomeCareers />
      </AnimateSection>
      <AnimateSection delay={0.05}>
        <AudiencePaths />
      </AnimateSection>
      <AnimateSection delay={0.05}>
        <ServiceCards />
      </AnimateSection>

      {/* Self-animating on scroll, so it stays outside AnimateSection —
          wrapping it would fade the whole diagram in before its own
          connector draw had a chance to run. */}
      <GoalsFramework />

      <AnimateSection delay={0.05}>
        <WhyBalitech />
      </AnimateSection>
      <AnimateSection delay={0.05}>
        <HowWeWork />
      </AnimateSection>

      <CaseStudies />
      <Testimonials />

      <AnimateSection delay={0.05}>
        <InsideCompany />
      </AnimateSection>
      <AnimateSection delay={0.05}>
        <HomeLocations />
      </AnimateSection>
      <BusinessInquiry />
    </SitePage>
  );
}
