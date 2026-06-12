import Link from "next/link";
import { Headphones, MapPin } from "lucide-react";
import { companyContent } from "@/lib/content";
import { HeadingLastWord } from "@/components/brand/HeadingLastWord";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";

const { joinUs } = companyContent;

export default function JoinUsOpenings() {
  return (
    <section className="join-us-openings section-with-net" aria-labelledby="join-us-openings-title">
      <SectionAnimatedNet />
      <div className="join-us-openings__inner">
        <header className="join-us-openings__header">
          <p className="brand-label">{joinUs.openings.label}</p>
          <h2 id="join-us-openings-title" className="join-us-openings__title">
            <HeadingLastWord text={joinUs.openings.title} />
          </h2>
        </header>

        <div className="join-us-openings__grid">
          {joinUs.openings.jobs.map((job) => (
            <article key={job.id} className="join-us-opening-card glow-border">
              <div className="join-us-opening-card__icon" aria-hidden>
                <Headphones size={28} strokeWidth={1.75} />
              </div>
              <h3 className="join-us-opening-card__title">{job.title}</h3>
              <p className="join-us-opening-card__role">{job.role}</p>
              <p className="join-us-opening-card__location">
                <MapPin size={14} aria-hidden />
                {job.location}
              </p>
              <ul className="join-us-opening-card__list">
                {job.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <Link href="#apply" className="join-us-opening-card__btn">
                Apply Now
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
