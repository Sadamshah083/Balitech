"use client";

import Image from "next/image";
import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { Quote } from "lucide-react";
import BentoTilt from "@/components/animations/BentoTilt";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import { HeadingBrush } from "@/components/brand/HeadingLastWord";
import { companyContent } from "@/lib/content";
import { cn } from "@/lib/cn";
import { gsap, registerGsap } from "@/lib/gsap-register";

const { ceo } = companyContent;
const [featuredGroup, ...otherGroups] = ceo.quoteGroups;
const allGroups = ceo.quoteGroups;

type CEOLeadershipShowcaseProps = {
  id?: string;
  className?: string;
  titleId?: string;
  variant?: "section" | "page";
};

function Reveal({
  children,
  className,
  tilt = true,
}: {
  children: ReactNode;
  className?: string;
  tilt?: boolean;
}) {
  if (!tilt) {
    return <div className={className}>{children}</div>;
  }

  return <BentoTilt className={className}>{children}</BentoTilt>;
}

export default function CEOLeadershipShowcase({
  id,
  className,
  titleId = "ceo-leadership-title",
  variant = "section",
}: CEOLeadershipShowcaseProps) {
  const isPage = variant === "page";
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      registerGsap();

      if (!isPage) {
        gsap.from(".ceo-leadership-showcase__title-line", {
          y: 48,
          opacity: 0,
          rotateX: -18,
          duration: 0.75,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        });
      }

      gsap.from(".ceo-leadership-showcase__reveal", {
        y: isPage ? 20 : 56,
        opacity: 0,
        duration: isPage ? 0.65 : 0.85,
        stagger: isPage ? 0.08 : 0.14,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: isPage ? "top 92%" : "top 78%",
          toggleActions: "play none none reverse",
        },
      });

      if (isPage) {
        gsap.fromTo(
          ".ceo-leadership-showcase__page-rule",
          { scaleX: 0, opacity: 0 },
          {
            scaleX: 1,
            opacity: 1,
            duration: 1.1,
            ease: "power3.inOut",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 90%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }
    },
    { scope: sectionRef, dependencies: [isPage] }
  );

  return (
    <section
      ref={sectionRef}
      id={id}
      className={cn(
        "ceo-leadership-showcase",
        !isPage && "section-gradient section-with-net",
        isPage && "ceo-leadership-showcase--page",
        className
      )}
      aria-labelledby={isPage ? undefined : titleId}
    >
      {!isPage && <SectionAnimatedNet />}

      <div className={cn(isPage && "blog-page__container")}>
        <div className="ceo-leadership-showcase__inner">
        {!isPage && (
          <header className="ceo-leadership-showcase__header">
            <p className="ceo-leadership-showcase__eyebrow brand-label">{ceo.label}</p>
            <span className="ceo-leadership-showcase__watermark" aria-hidden>
              Leadership
            </span>
            <h2 id={titleId} className="ceo-leadership-showcase__title">
              <span className="ceo-leadership-showcase__title-line">
                Leadership That
              </span>
              <span className="ceo-leadership-showcase__title-line">
                Builds{" "}
                <span className="ceo-leadership-showcase__title-highlight heading-last-word">
                  People
                  <HeadingBrush />
                </span>
              </span>
            </h2>
          </header>
        )}

        {isPage && (
          <div className="ceo-leadership-showcase__page-intro ceo-leadership-showcase__reveal">
            <div className="ceo-leadership-showcase__page-rule" aria-hidden />
            <p className="ceo-leadership-showcase__page-intro-label">From the CEO&apos;s desk</p>
            <div className="ceo-leadership-showcase__page-rule" aria-hidden />
          </div>
        )}

        <Reveal className="ceo-leadership-showcase__reveal" tilt={!isPage}>
          <article
            className={cn(
              "ceo-leadership-showcase__hero",
              isPage && "ceo-leadership-showcase__hero--page glow-border"
            )}
          >
            {isPage && (
              <span className="ceo-leadership-showcase__card-index" aria-hidden>
                01
              </span>
            )}
            {!isPage && (
              <div className="ceo-leadership-showcase__portrait">
                <div className="ceo-leadership-showcase__portrait-frame">
                  <Image
                    src={ceo.image}
                    alt={`${ceo.name}, ${ceo.title} of ${ceo.company}`}
                    fill
                    className="object-cover object-[center_18%]"
                    sizes="(max-width: 768px) 100vw, 42vw"
                    priority
                  />
                  <div className="ceo-leadership-showcase__portrait-shine" aria-hidden />
                </div>
                <div className="ceo-leadership-showcase__identity">
                  <p className="ceo-leadership-showcase__name">{ceo.name}</p>
                  <p className="ceo-leadership-showcase__role">
                    {ceo.shortTitle} — {ceo.title}
                  </p>
                  <p className="ceo-leadership-showcase__company">{ceo.company}</p>
                </div>
              </div>
            )}

            <div
              className={cn(
                "ceo-leadership-showcase__hero-quotes",
                isPage && "ceo-leadership-showcase__hero-quotes--page"
              )}
            >
              {isPage && (
                <div className="ceo-leadership-showcase__page-hero-meta">
                  <p className="ceo-leadership-showcase__page-hero-name">{ceo.name}</p>
                  <p className="ceo-leadership-showcase__page-hero-role">
                    {ceo.shortTitle} — {ceo.title} · {ceo.company}
                  </p>
                </div>
              )}
              <Quote className="ceo-leadership-showcase__quote-icon" aria-hidden size={36} />
              <div className="ceo-leadership-showcase__quote-list">
                {featuredGroup.lines.map((line) => (
                  <blockquote key={line} className="ceo-leadership-showcase__quote">
                    &ldquo;{line}&rdquo;
                  </blockquote>
                ))}
              </div>
              <p className="ceo-leadership-showcase__attribution">
                — {ceo.shortTitle} {ceo.name}
              </p>
            </div>
          </article>
        </Reveal>

        <div
          className={cn(
            "ceo-leadership-showcase__grid",
            isPage && "ceo-leadership-showcase__grid--page"
          )}
        >
          {otherGroups.map((group, index) => (
            <Reveal key={group.lines[0]} className="ceo-leadership-showcase__reveal ceo-leadership-showcase__grid-item" tilt={!isPage}>
              <article
                className={cn(
                  "ceo-leadership-showcase__card",
                  isPage && "ceo-leadership-showcase__card--page glow-border"
                )}
              >
                {isPage && (
                  <span className="ceo-leadership-showcase__card-index" aria-hidden>
                    {String(index + 2).padStart(2, "0")}
                  </span>
                )}
                <Quote
                  className="ceo-leadership-showcase__quote-icon ceo-leadership-showcase__quote-icon--sm"
                  aria-hidden
                  size={22}
                />
                <div className="ceo-leadership-showcase__quote-list">
                  {group.lines.map((line) => (
                    <blockquote
                      key={line}
                      className="ceo-leadership-showcase__quote ceo-leadership-showcase__quote--compact"
                    >
                      &ldquo;{line}&rdquo;
                    </blockquote>
                  ))}
                </div>
                <p className="ceo-leadership-showcase__attribution ceo-leadership-showcase__attribution--card">
                  — {ceo.shortTitle} {ceo.name}
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        {isPage && (
          <footer className="ceo-leadership-showcase__page-footer ceo-leadership-showcase__reveal">
            <div className="ceo-leadership-showcase__page-footer-glow" aria-hidden />
            <p className="ceo-leadership-showcase__page-footer-quote">
              &ldquo;{allGroups[allGroups.length - 1].lines[allGroups[allGroups.length - 1].lines.length - 1]}&rdquo;
            </p>
            <p className="ceo-leadership-showcase__page-footer-sign">
              {ceo.name} · {ceo.shortTitle} · {ceo.company}
            </p>
          </footer>
        )}
        </div>
      </div>
    </section>
  );
}
