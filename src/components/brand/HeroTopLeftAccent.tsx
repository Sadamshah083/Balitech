import { siteImages } from "@/lib/images";

export default function HeroTopLeftAccent() {
  return (
    <div
      className="hero-top-left-accent__color"
      style={{
        WebkitMaskImage: `url(${siteImages.heroLeftAccent})`,
        maskImage: `url(${siteImages.heroLeftAccent})`,
      }}
      aria-hidden
    />
  );
}
