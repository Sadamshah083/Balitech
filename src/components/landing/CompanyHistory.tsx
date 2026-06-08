import AnimatedTitle from "@/components/animations/AnimatedTitle";
import { companyContent } from "@/lib/content";

const { about } = companyContent;

export default function CompanyHistory() {
  return (
    <section id="history" className="section-gradient px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <p className="brand-label mb-4">{about.historyLabel}</p>
        <AnimatedTitle containerClass="mx-auto max-w-3xl">
          {about.historyHeadline}
        </AnimatedTitle>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-6">
        {about.history.map((paragraph, index) => (
          <article
            key={paragraph.slice(0, 40)}
            className="glow-border rounded-2xl bg-card/60 p-6 sm:p-8"
          >
            <p className="brand-label mb-3">
              Chapter {String(index + 1).padStart(2, "0")}
            </p>
            <p className="text-sm leading-relaxed text-muted sm:text-base">
              {paragraph}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
