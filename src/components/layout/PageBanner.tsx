import { BrandArcs, BrandBubbles } from "@/components/brand/BrandDecorations";
import { HeadingLastWord } from "@/components/brand/HeadingLastWord";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";

type PageBannerProps = {
  title: string;
  subtitle?: string;
  image?: string;
};

export default function PageBanner({ title, subtitle, image }: PageBannerProps) {
  const words = title.split(" ");
  const firstWord = words[0];
  const rest = words.slice(1).join(" ");

  return (
    <section className="section-with-net relative flex min-h-[280px] items-center justify-center overflow-hidden pt-24 sm:min-h-[320px]">
      <SectionAnimatedNet />
      {image && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${image}')` }}
          />
          <div className="hero-overlay absolute inset-0" />
        </>
      )}
      {!image && (
        <div className="absolute inset-0 bg-gradient-to-b from-background-light via-surface to-background" />
      )}

      <BrandArcs className="left-8 top-1/2 -translate-y-1/2 hidden md:block" />
      <BrandBubbles className="right-12 top-16 hidden md:flex" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        <p className="brand-label mb-3">Bali Tech Pvt. Ltd</p>
        <h1 className="brand-heading text-5xl uppercase tracking-wide sm:text-6xl md:text-7xl">
          {rest ? (
            <>
              <span className="orange-gradient-text">{firstWord}</span>{" "}
              <HeadingLastWord
                text={rest}
                lastWordClassName="brand-tech-text"
              />
            </>
          ) : (
            <HeadingLastWord text={title} lastWordClassName="brand-tech-text" />
          )}
        </h1>
        {subtitle && (
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted md:text-lg">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
