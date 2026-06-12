import SitePage from "@/components/layout/SitePage";
import AnimateSection from "@/components/animations/AnimateSection";
import Hero from "@/components/landing/Hero";
import ServiceCards from "@/components/landing/ServiceCards";
import About from "@/components/landing/About";
import AnimatedExploreLinks from "@/components/landing/AnimatedExploreLinks";
import EventsGallerySection from "@/components/landing/EventsGallerySection";
import Metrics from "@/components/landing/Metrics";
import Campaigns from "@/components/landing/Campaigns";
import CallCenterFeatures from "@/components/landing/CallCenterFeatures";
import CareerCTA from "@/components/landing/CareerCTA";
import BlogsSection from "@/components/landing/BlogsSection";
import SectionUnderline from "@/components/animations/SectionUnderline";

export default function Home() {
  return (
    <SitePage indexTheme>
      <Hero />
      <AnimateSection>
        <Campaigns />
      </AnimateSection>
      <SectionUnderline />
      <AnimateSection delay={0.1}>
        <ServiceCards />
      </AnimateSection>
      <SectionUnderline />
      <AnimateSection delay={0.1}>
        <About />
      </AnimateSection>
      <SectionUnderline />
      <AnimateSection delay={0.05}>
        <AnimatedExploreLinks />
      </AnimateSection>
      <EventsGallerySection />
      <AnimateSection delay={0.05}>
        <Metrics />
      </AnimateSection>
      <SectionUnderline />
      <AnimateSection delay={0.1}>
        <CallCenterFeatures />
      </AnimateSection>
      <SectionUnderline />
      <AnimateSection delay={0.1}>
        <BlogsSection />
      </AnimateSection>
      <AnimateSection delay={0.1}>
        <CareerCTA />
      </AnimateSection>
      <SectionUnderline />
    </SitePage>
  );
}
