import SitePage from "@/components/layout/SitePage";
import AnimateSection from "@/components/animations/AnimateSection";
import DeferredLightPath from "@/components/effects/DeferredLightPath";
import Hero from "@/components/landing/Hero";
import AudiencePaths from "@/components/landing/AudiencePaths";
import Metrics from "@/components/landing/Metrics";
import ServiceCards from "@/components/landing/ServiceCards";
import WhyBalitech from "@/components/landing/WhyBalitech";
import HowWeWork from "@/components/landing/HowWeWork";
import InsideCompany from "@/components/home/InsideCompany";
import HomeCareers from "@/components/home/HomeCareers";
import HomeOpenVacancies from "@/components/home/HomeOpenVacancies";
import HomeRecentBlogs from "@/components/home/HomeRecentBlogs";
import HomeLocations from "@/components/home/HomeLocations";
import GoalsFramework from "@/components/home/GoalsFramework";
import BusinessInquiry from "@/components/home/BusinessInquiry";

/* Safety net if an admin publish misses revalidatePath — home recent blogs
   refresh within a minute instead of waiting for the next deploy. */
export const revalidate = 60;

/**
 * Home page opens with the client pitch, then the campaign openings rail,
 * then admin vacancy cards, then the business / professionals split.
 * Recent blogs sit just above the footer.
 */
export default function Home() {
  return (
    <SitePage indexTheme>
      {/* Spans the whole page, so it is a direct child of the page shell
          rather than nested inside any one section. */}
      <DeferredLightPath />

      <Hero />
      <Metrics />

      <AnimateSection>
        <HomeCareers />
      </AnimateSection>
      <AnimateSection delay={0.05}>
        <HomeOpenVacancies />
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

      <AnimateSection delay={0.05}>
        <InsideCompany />
      </AnimateSection>
      <AnimateSection delay={0.05}>
        <HomeLocations />
      </AnimateSection>
      <BusinessInquiry />
      <AnimateSection delay={0.05}>
        <HomeRecentBlogs />
      </AnimateSection>
    </SitePage>
  );
}
