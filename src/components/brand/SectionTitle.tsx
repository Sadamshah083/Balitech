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
      <h2 className="brand-heading text-3xl md:text-4xl">
        {title}{" "}
        {highlight && (
          <span className="brand-underline-orange">{highlight}</span>
        )}
      </h2>
      <div
        className={`mt-3 h-0.5 w-16 bg-orange/60 ${centered ? "mx-auto" : ""}`}
      />
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
