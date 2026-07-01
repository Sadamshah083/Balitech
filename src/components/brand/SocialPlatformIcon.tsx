type SocialPlatformIconProps = {
  platform: "instagram" | "facebook" | "tiktok";
  size?: number;
};

export default function SocialPlatformIcon({
  platform,
  size = 18,
}: SocialPlatformIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": true,
  } as const;

  if (platform === "instagram") {
    return (
      <svg {...common}>
        <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm-5 3.5A5.5 5.5 0 1 1 6.5 13 5.5 5.5 0 0 1 12 7.5zm0 2A3.5 3.5 0 1 0 15.5 13 3.5 3.5 0 0 0 12 9.5zM18 6.2a1.2 1.2 0 1 1-1.2 1.2A1.2 1.2 0 0 1 18 6.2z" />
      </svg>
    );
  }

  if (platform === "facebook") {
    return (
      <svg {...common}>
        <path d="M13.5 22v-8.2h2.8l.4-3.2H13.5V8.9c0-.9.3-1.6 1.6-1.6h1.7V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.5v3.2h2.1V22h3.9z" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M16.6 5.82s.51.5 0 0A4.28 4.28 0 0 1 15.54 3h-3.09v12.77a2.73 2.73 0 1 1-2.73-2.73c.28 0 .54.04.79.13V9.66a5.62 5.62 0 1 0 5.62 5.62V8.56a6.95 6.95 0 0 0 4.07 1.31V6.42a4.7 4.7 0 0 1-1.6-.6z" />
    </svg>
  );
}
