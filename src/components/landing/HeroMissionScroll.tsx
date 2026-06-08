"use client";

type HeroMissionScrollProps = {
  text: string;
};

export default function HeroMissionScroll({ text }: HeroMissionScrollProps) {
  return (
    <aside className="hero-mission-panel" aria-label="BALITECH mission">
      <div className="hero-mission-panel__fade hero-mission-panel__fade--top" aria-hidden />
      <div className="hero-mission-panel__fade hero-mission-panel__fade--bottom" aria-hidden />
      <div className="hero-mission-scroll">
        <div className="hero-mission-scroll__track">
          <p className="hero-mission-scroll__text text-4xl font-bold">{text}</p>
        </div>
      </div>
    </aside>
  );
}
