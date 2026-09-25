import { BarChart3, Layers, Settings2, Target, Users } from "lucide-react";
import { companyContent } from "@/lib/content";

const { about, goalsHierarchy, tagline } = companyContent;

const PILLAR_ICONS = {
  culture: Users,
  operations: Settings2,
  growth: BarChart3,
} as const;

/**
 * The connector is a bus, not three separate lines: one trunk drops out of the
 * root card, turns along a shared horizontal, and sends a leg down to each
 * pillar. Drawn in a 1200-wide viewBox whose leg positions (200 / 600 / 1000)
 * are the column centres of the three-up grid below it.
 */
const TRUNK = "M 600 0 V 30";

const LEGS = [
  { id: "culture", d: "M 600 30 H 232 Q 200 30 200 62 V 104" },
  { id: "operations", d: "M 600 30 V 104" },
  { id: "growth", d: "M 600 30 H 968 Q 1000 30 1000 62 V 104" },
] as const;

/* Split so each reads as a stacked column of words down the margin. */
const LEFT_ASIDE = ["People", "Process", "Growth"];
const RIGHT_ASIDE = tagline.replace(/\.$/, "").split(" ");

function Connector() {
  return (
    <svg
      className="framework__flow"
      viewBox="0 0 1200 104"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path className="framework__flow-track" d={TRUNK} />
      <path className="framework__flow-draw" d={TRUNK} />

      {LEGS.map((leg) => (
        <g key={leg.id}>
          <path className="framework__flow-track" d={leg.d} />
          <path
            className={`framework__flow-draw framework__flow-draw--${leg.id}`}
            d={leg.d}
          />
          <circle className="framework__flow-spark" r="4">
            <animateMotion
              dur="3.4s"
              repeatCount="indefinite"
              path={leg.d}
              calcMode="spline"
              keySplines="0.4 0 0.6 1"
              keyTimes="0;1"
            />
          </circle>
        </g>
      ))}
    </svg>
  );
}

/**
 * The company's seven objectives, grouped under the three pillars they belong
 * to and hung off a single root card.
 *
 * Home-page only — the growth story on /our-team covers the same ground in
 * prose, so the diagram lives in exactly one place.
 *
 * No scroll-in reveal on purpose: hiding the painted diagram until GSAP has
 * loaded and replayed a fade makes the section look slow to load.
 */
export default function GoalsFramework() {
  const { root, branches } = goalsHierarchy;
  const objectives = branches.reduce((sum, branch) => sum + branch.items.length, 0);

  return (
    <section className="framework" aria-labelledby="framework-title">
      <div className="framework__aura" aria-hidden>
        <span className="framework__bloom framework__bloom--warm" />
        <span className="framework__bloom framework__bloom--cool" />
        <span className="framework__chip framework__chip--a" />
        <span className="framework__chip framework__chip--b" />
        <span className="framework__chip framework__chip--c" />
        <span className="framework__chip framework__chip--d" />
      </div>

      <div className="ent-shell">
        <p className="framework__label">{about.goalsLabel}</p>

        <div className="framework__stack">
          <p className="framework__aside framework__aside--left" aria-hidden>
            {LEFT_ASIDE.map((word) => (
              <span key={word}>{word}</span>
            ))}
          </p>
          <p className="framework__aside framework__aside--right" aria-hidden>
            {RIGHT_ASIDE.map((word) => (
              <span key={word}>{word}</span>
            ))}
          </p>

          <article className="framework__root">
            <span className="framework__root-spark" aria-hidden />
            <p className="framework__root-kicker">Strategic Framework</p>

            {/* One heading covering both lines, so the section landmark reads
                as "BALITECH — Organizational Structure & Goals" rather than
                leaving a bare brand name as the only h2 on the page. */}
            <h2 id="framework-title" className="framework__root-heading">
              <span className="framework__root-title">{root.title}</span>
              <span className="framework__root-sub">{root.subtitle}</span>
            </h2>

            <div className="framework__root-meta">
              <span className="framework__root-chip">
                <Layers size={15} strokeWidth={2.25} aria-hidden />
                {branches.length} Pillars
              </span>
              <span className="framework__root-rule" aria-hidden />
              <span className="framework__root-chip framework__root-chip--cool">
                <Target size={15} strokeWidth={2.25} aria-hidden />
                {String(objectives).padStart(2, "0")} Objectives
              </span>
            </div>
          </article>

          <Connector />

          <div className="framework__grid">
            {branches.map((branch, pillarIndex) => {
              const Icon = PILLAR_ICONS[branch.id as keyof typeof PILLAR_ICONS];

              return (
                <article
                  key={branch.id}
                  className={`framework__pillar framework__pillar--${branch.id}`}
                >
                  <span className="framework__pillar-node" aria-hidden />
                  <span className="framework__pillar-index" aria-hidden>
                    {String(pillarIndex + 1).padStart(2, "0")}
                  </span>

                  <header className="framework__pillar-head">
                    <span className="framework__pillar-icon" aria-hidden>
                      <Icon size={22} strokeWidth={2.15} />
                    </span>
                    <div>
                      <h3 className="framework__pillar-title">{branch.title}</h3>
                      <p className="framework__pillar-count">
                        {branch.items.length} goals
                      </p>
                    </div>
                  </header>

                  <ol className="framework__list">
                    {branch.items.map((item, itemIndex) => (
                      <li key={item.index} className="framework__item">
                        <span className="framework__item-rail" aria-hidden>
                          <span className="framework__item-node" />
                          {itemIndex < branch.items.length - 1 ? (
                            <span className="framework__item-line" />
                          ) : null}
                        </span>

                        <div className="framework__item-card">
                          <span className="framework__item-num">
                            {String(item.index).padStart(2, "0")}
                          </span>
                          <p className="framework__item-text">{item.text}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
