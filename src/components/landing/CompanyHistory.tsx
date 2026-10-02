import AnimatedTitle from "@/components/animations/AnimatedTitle";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import { companyContent } from "@/lib/content";

const { about } = companyContent;

export default function CompanyHistory() {
  return (
    <section
      id="history"
      className="journey section-with-net px-4 py-20 sm:px-6 lg:px-8"
    >
      <SectionAnimatedNet />
      <div className="mx-auto max-w-4xl text-center">
        <p className="brand-label mb-4">{about.historyLabel}</p>
        <AnimatedTitle containerClass="mx-auto max-w-3xl">
          {about.historyHeadline}
        </AnimatedTitle>
      </div>

      <div className="journey__grid">
        {about.history.map((chapter, index) => {
          const n = String(index + 1).padStart(2, "0");
          return (
            <article key={chapter.title} className="journey-card">
              <div className="journey-card__meta">
                <span className="journey-card__chapter">Chapter {n}</span>
                <span className="journey-card__index" aria-hidden>
                  — {n}
                </span>
              </div>
              <h3 className="journey-card__title">{chapter.title}</h3>
              <p className="journey-card__text">{chapter.text}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
