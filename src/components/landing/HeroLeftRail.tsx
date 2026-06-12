import { companyContent } from "@/lib/content";

const { heroStats } = companyContent;

export default function HeroLeftRail() {
  return (
    <aside className="hero-left-rail" aria-label="BALITECH highlights">
      <div className="hero-left-rail__line" aria-hidden />
      <div className="hero-left-rail__content">
        <p className="hero-left-rail__brand">BALI·TECH</p>
        <div className="hero-left-rail__stats">
          {heroStats.map((item) => (
            <div key={item.label} className="hero-left-rail__item">
              <span className="hero-left-rail__value">{item.value}</span>
              <span className="hero-left-rail__label">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
