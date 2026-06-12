"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { Rocket, Settings2, Users } from "lucide-react";
import BentoTilt from "@/components/animations/BentoTilt";
import { companyContent } from "@/lib/content";
import { gsap, registerGsap } from "@/lib/gsap-register";

const { goalsHierarchy } = companyContent;

const BRANCH_ICONS = {
  culture: Users,
  operations: Settings2,
  growth: Rocket,
} as const;

const FLOW_PATHS = [
  { id: "culture", d: "M 600 4 C 600 50, 280 68, 200 112" },
  { id: "operations", d: "M 600 4 L 600 112" },
  { id: "growth", d: "M 600 4 C 600 50, 920 68, 1000 112" },
] as const;

function FlowLines() {
  return (
    <svg
      className="goals-showcase__flow goals-showcase__flow--desktop"
      viewBox="0 0 1200 120"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="goals-flow-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--orange-light)" />
          <stop offset="100%" stopColor="var(--orange)" />
        </linearGradient>
      </defs>
      {FLOW_PATHS.map((path) => (
        <g key={path.id}>
          <path className="goals-showcase__flow-track" d={path.d} />
          <path
            className="goals-showcase__flow-draw"
            data-flow-path={path.id}
            d={path.d}
          />
          <circle className="goals-showcase__flow-dot" r="5">
            <animateMotion
              dur="2.8s"
              repeatCount="indefinite"
              path={path.d}
              calcMode="spline"
              keySplines="0.42 0 0.58 1"
              keyTimes="0;1"
            />
          </circle>
        </g>
      ))}
    </svg>
  );
}

export default function GoalsHierarchy() {
  const treeRef = useRef<HTMLDivElement>(null);
  const { root, branches } = goalsHierarchy;
  const totalGoals = branches.reduce((sum, branch) => sum + branch.items.length, 0);

  useGSAP(
    () => {
      registerGsap();

      const drawPaths = gsap.utils.toArray<SVGPathElement>(
        ".goals-showcase__flow-draw"
      );

      drawPaths.forEach((path) => {
        const length = path.getTotalLength();
        gsap.set(path, {
          strokeDasharray: length,
          strokeDashoffset: length,
        });
      });

      gsap.to(drawPaths, {
        strokeDashoffset: 0,
        duration: 1.35,
        stagger: 0.2,
        ease: "power2.inOut",
        scrollTrigger: {
          trigger: treeRef.current,
          start: "top 78%",
          toggleActions: "play none none reverse",
        },
      });

      gsap.from(".goals-showcase__step", {
        x: -16,
        opacity: 0,
        duration: 0.55,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: {
          trigger: treeRef.current,
          start: "top 72%",
          toggleActions: "play none none reverse",
        },
      });
    },
    { scope: treeRef }
  );

  return (
    <div ref={treeRef} className="goals-showcase">
      <div className="goals-showcase__backdrop" aria-hidden>
        <span className="goals-showcase__orb goals-showcase__orb--left" />
        <span className="goals-showcase__orb goals-showcase__orb--right" />
      </div>

      <div className="goals-showcase__crown">
        <span className="goals-showcase__ring goals-showcase__ring--outer" aria-hidden />
        <span className="goals-showcase__ring goals-showcase__ring--inner" aria-hidden />

        <BentoTilt className="goals-showcase__root-tilt">
          <div className="goals-showcase__root">
            <p className="goals-showcase__root-kicker">Strategic Framework</p>
            <p className="goals-showcase__root-title">{root.title}</p>
            <p className="goals-showcase__root-sub">{root.subtitle}</p>
            <div className="goals-showcase__root-meta">
              <span>{branches.length} Pillars</span>
              <span className="goals-showcase__root-meta-dot" aria-hidden />
              <span>{String(totalGoals).padStart(2, "0")} Objectives</span>
            </div>
          </div>
        </BentoTilt>
      </div>

      <div className="goals-showcase__flow-wrap">
        <FlowLines />
      </div>

      <div className="goals-showcase__grid">
        {branches.map((branch) => {
          const Icon = BRANCH_ICONS[branch.id as keyof typeof BRANCH_ICONS];

          return (
            <BentoTilt key={branch.id} className="goals-showcase__pillar-tilt">
              <article className="goals-showcase__pillar">
                <header className="goals-showcase__pillar-head">
                  <span className="goals-showcase__pillar-icon" aria-hidden>
                    <Icon size={18} strokeWidth={2.25} />
                  </span>
                  <div className="goals-showcase__pillar-copy">
                    <p className="goals-showcase__pillar-title">{branch.title}</p>
                    <p className="goals-showcase__pillar-count">
                      {branch.items.length} goals
                    </p>
                  </div>
                  <span className="goals-showcase__pillar-node" aria-hidden />
                </header>

                <ol className="goals-showcase__timeline">
                  {branch.items.map((item, stepIndex) => (
                    <li key={item.index} className="goals-showcase__step">
                      <span className="goals-showcase__step-rail" aria-hidden>
                        <span className="goals-showcase__step-node" />
                        {stepIndex < branch.items.length - 1 ? (
                          <span className="goals-showcase__step-line" />
                        ) : null}
                      </span>

                      <div className="goals-showcase__step-card">
                        <span className="goals-showcase__step-num">
                          {String(item.index).padStart(2, "0")}
                        </span>
                        <p className="goals-showcase__step-text">{item.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </article>
            </BentoTilt>
          );
        })}
      </div>
    </div>
  );
}
