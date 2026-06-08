type HeroBrushStrokeProps = {
  variant: "title" | "tagline-top" | "tagline-bottom";
};

export default function HeroBrushStroke({ variant }: HeroBrushStrokeProps) {
  if (variant === "title") {
    return (
      <svg
        className="hero-brush-stroke hero-brush-stroke--title"
        viewBox="0 0 520 28"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M6 17 C90 11, 170 20, 255 14 S420 10, 512 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 19 C95 15, 175 22, 260 17 S415 13, 505 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.55"
        />
      </svg>
    );
  }

  if (variant === "tagline-top") {
    return (
      <svg
        className="hero-brush-stroke hero-brush-stroke--tagline-top"
        viewBox="0 0 340 20"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M8 11 C80 9, 150 13, 220 10 S300 8, 330 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      className="hero-brush-stroke hero-brush-stroke--tagline-bottom"
      viewBox="0 0 420 36"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M4 20 C55 14, 95 26, 140 18 C175 12, 205 24, 245 16 C285 10, 320 22, 360 15 C385 11, 405 18, 416 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 26 C60 30, 110 22, 155 28 C200 33, 250 24, 295 30 C330 34, 370 26, 410 29"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}
