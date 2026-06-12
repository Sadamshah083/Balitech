import { HeadingBrush, HeadingLastWord } from "@/components/brand/HeadingLastWord";

type SectionTitleProps = {
  label?: string;
  title: string;
  highlight?: string;
  subtitle?: string;
  centered?: boolean;
};

export default function SectionTitle({
  label,
  title,
  highlight,
  subtitle,
  centered = false,
}: SectionTitleProps) {
  return (
    <div className={`mb-12 ${centered ? "text-center" : ""}`}>
      {label && <p className="brand-label mb-3">{label}</p>}
      <h2 className="brand-heading text-5xl md:text-6xl">
        {highlight ? (
          <>
            {title}{" "}
            <span className="heading-last-word">
              <span className="brand-underline-orange">{highlight}</span>
              <HeadingBrush />
            </span>
          </>
        ) : (
          <HeadingLastWord text={title} />
        )}
      </h2>
      {subtitle && (
        <p
          className={`mt-4 max-w-2xl text-muted ${centered ? "mx-auto" : ""}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
