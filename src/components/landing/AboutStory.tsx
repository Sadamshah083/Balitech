import Image from "next/image";
import { ArrowRight, Compass, Target } from "lucide-react";
import IntentLink from "@/components/navigation/IntentLink";
import { HeadingBrush } from "@/components/brand/HeadingLastWord";
import { companyContent } from "@/lib/content";
import { aboutStoryImage } from "@/lib/page-imagery";

const { about, vision, mission, ceo, workforce } = companyContent;

export default function AboutStory() {
  return (
    <>
      <section className="about-story" aria-labelledby="about-story-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="brand-label">Who We Are</p>
              <h2 id="about-story-title" className="brand-heading mt-3">
                {about.historyHeadline.replace(" Professionals", "")}{" "}
                <span className="heading-last-word">
                  Professionals
                  <HeadingBrush />
                </span>
              </h2>
              <div className="mt-6 space-y-4">
                {about.history.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 40)}
                    className="text-sm leading-relaxed text-muted sm:text-base"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              <dl className="mt-8 grid gap-px overflow-hidden rounded-lg border border-foreground/10 bg-foreground/10 sm:grid-cols-3">
                {[
                  { value: workforce.count, label: workforce.labelLong },
                  { value: "24/5", label: "Operational coverage" },
                  { value: "4", label: "Offices in Pakistan" },
                ].map((item) => (
                  <div key={item.label} className="bg-card p-5">
                    <dt className="sr-only">{item.label}</dt>
                    <dd>
                      <span className="block text-2xl font-black text-orange">
                        {item.value}
                      </span>
                      <span className="mt-1 block text-xs text-muted">
                        {item.label}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="about-story__media relative overflow-hidden rounded-lg border border-foreground/10">
              <Image
                src={aboutStoryImage.src}
                alt={aboutStoryImage.alt}
                width={900}
                height={1100}
                className="h-full w-full object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="about-timeline" aria-labelledby="about-timeline-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <header className="mb-11 max-w-2xl">
            <p className="brand-label">Our Story</p>
            <h2 id="about-timeline-title" className="brand-heading mt-3">
              How BALITECH{" "}
              <span className="heading-last-word">
                Grew
                <HeadingBrush />
              </span>
            </h2>
          </header>

          <ol className="about-timeline__list">
            {about.timeline.map((entry) => (
              <li key={entry.period} className="about-timeline__item">
                <span className="about-timeline__period">{entry.period}</span>
                <h3 className="mt-3 text-base font-bold text-foreground">
                  {entry.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {entry.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="about-purpose" aria-labelledby="about-purpose-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 id="about-purpose-title" className="sr-only">
            Mission, vision and leadership
          </h2>

          <div className="grid gap-5 lg:grid-cols-3">
            <article className="rounded-lg border border-foreground/10 bg-card p-7">
              <span className="brand-icon-wrap size-11 rounded-lg" aria-hidden>
                <Compass size={20} strokeWidth={1.7} />
              </span>
              <h3 className="mt-5 text-xl font-bold text-foreground">
                {mission.label}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {mission.text}
              </p>
            </article>

            <article className="rounded-lg border border-foreground/10 bg-card p-7">
              <span className="brand-icon-wrap size-11 rounded-lg" aria-hidden>
                <Target size={20} strokeWidth={1.7} />
              </span>
              <h3 className="mt-5 text-xl font-bold text-foreground">
                {vision.label}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {vision.text}
              </p>
            </article>

            {/* Portrait and full message live on /ceo-words. */}
            <article className="about-purpose__leader rounded-lg border border-foreground/10 bg-card p-7">
              <p className="brand-label">Leadership</p>
              <div className="mt-5">
                <p className="text-base font-bold text-foreground">
                  {ceo.name}
                </p>
                <p className="mt-1 text-xs text-muted">{ceo.title}</p>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-muted">
                {about.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
                <IntentLink
                  href="/ceo-words"
                  className="inline-flex items-center gap-2 text-sm font-bold text-orange transition-all hover:gap-3"
                >
                  Read the CEO&rsquo;s message
                  <ArrowRight size={15} strokeWidth={2.25} aria-hidden />
                </IntentLink>
                <IntentLink
                  href="/our-team"
                  className="inline-flex items-center gap-2 text-sm font-bold text-orange transition-all hover:gap-3"
                >
                  Meet the team
                  <ArrowRight size={15} strokeWidth={2.25} aria-hidden />
                </IntentLink>
              </div>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
