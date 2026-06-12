import { siteImages } from "@/lib/images";

export default function HeroBottomRightAccent() {
  return (
    <div
      className="hero-bottom-right-accent__color"
      style={{
        WebkitMaskImage: `url(${siteImages.heroRightAccent})`,
        maskImage: `url(${siteImages.heroRightAccent})`,
      }}
      aria-hidden
    />
  );
}
