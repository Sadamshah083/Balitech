import { companyContent } from "@/lib/content";
import JoinUsBenefitsOrb from "@/components/join-us/JoinUsBenefitsOrb";
import { HeadingLastWord } from "@/components/brand/HeadingLastWord";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";

const { joinUs } = companyContent;

export default function JoinUsBenefits() {
  const left = joinUs.benefits.items.slice(0, 3);
  const right = joinUs.benefits.items.slice(3);

  return (
    <section className="join-us-benefits section-with-net" aria-labelledby="join-us-benefits-title">
      <SectionAnimatedNet />
      <div className="join-us-benefits__inner">
        <header className="join-us-benefits__header">
          <p className="brand-label">{joinUs.benefits.label}</p>
          <h2 id="join-us-benefits-title" className="join-us-benefits__title">
            <HeadingLastWord text={joinUs.benefits.title} />
          </h2>
        </header>

        <div className="join-us-benefits__layout">
          <div className="join-us-benefits__col">
            {left.map((item) => (
              <article key={item.num} className="join-us-benefit-card glow-border">
                <span className="join-us-benefit-card__num">{item.num}</span>
                <p className="join-us-benefit-card__title">{item.title}</p>
              </article>
            ))}
          </div>

          <div className="join-us-benefits__center">
            <JoinUsBenefitsOrb />
          </div>

          <div className="join-us-benefits__col">
            {right.map((item) => (
              <article key={item.num} className="join-us-benefit-card glow-border">
                <span className="join-us-benefit-card__num">{item.num}</span>
                <p className="join-us-benefit-card__title">{item.title}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
