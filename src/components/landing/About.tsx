/**
 * Culture wall component — kept for reuse. The live collage now mounts on
 * /gallery; Growth no longer embeds event photography.
 */
import AboutEventCollage from "@/components/landing/AboutEventCollage";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";

export default function About() {
  return (
    <section id="about" className="section-with-net w-full overflow-hidden">
      <SectionAnimatedNet />
      <div className="about-collage-wrap section-gradient py-6 lg:py-8">
        <AboutEventCollage />
      </div>
    </section>
  );
}
