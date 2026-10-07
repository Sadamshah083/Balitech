import { HeadingBrush } from "@/components/brand/HeadingLastWord";

export default function CareerHero({ openingCount }: { openingCount: number }) {
  return (
    <section className="career-hero" aria-labelledby="career-hero-title">
      <div className="career-hero__glow career-hero__glow--left" aria-hidden />
      <div className="career-hero__glow career-hero__glow--right" aria-hidden />
      <div className="ent-shell career-hero__inner">
        <p className="brand-label career-hero__eyebrow">Careers at BALITECH</p>
        <h1 id="career-hero-title" className="career-hero__title">
          Grow Your Future On Our{" "}
          <span className="heading-last-word">
            Floor
            <HeadingBrush />
          </span>
        </h1>
        <p className="career-hero__lede">
          Open roles across campaign floors, quality, leadership, and support —
          posted by HR as soon as a seat is ready to fill.
        </p>
        <div className="career-hero__actions">
          <a href="#openings" className="ent-btn">
            {openingCount > 0
              ? `View ${openingCount} open ${openingCount === 1 ? "role" : "roles"}`
              : "Browse openings"}
          </a>
          <a href="/join-us#apply" className="ent-btn ent-btn--ghost">
            General application
          </a>
        </div>
      </div>
    </section>
  );
}
