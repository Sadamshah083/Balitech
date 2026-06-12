import { companyContent } from "@/lib/content";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";

const { joinUs } = companyContent;

export default function JoinUsHero() {
  return (
    <section className="join-us-hero section-with-net" aria-labelledby="join-us-hero-title">
      <SectionAnimatedNet />
      <div className="join-us-hero__inner">
        <p className="join-us-hero__eyebrow brand-label">{joinUs.hero.eyebrow}</p>
        <h1 id="join-us-hero-title" className="join-us-hero__title">
          {joinUs.hero.titleLine}{" "}
          <span className="join-us-hero__highlight">
            {joinUs.hero.titleHighlight}
            <span className="join-us-hero__brush" aria-hidden>
              <span />
              <span />
              <span />
            </span>
          </span>
        </h1>
        <p className="join-us-hero__subtitle">{joinUs.hero.subtitle}</p>
      </div>
    </section>
  );
}
