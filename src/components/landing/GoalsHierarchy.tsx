"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { companyContent } from "@/lib/content";
import { gsap, registerGsap } from "@/lib/gsap-register";

const { goalsHierarchy } = companyContent;

const FLOW_PATHS = [
  { id: "culture", d: "M 500 6 C 500 42, 240 58, 168 134" },
  { id: "operations", d: "M 500 6 C 500 48, 500 92, 500 134" },
  { id: "growth", d: "M 500 6 C 500 42, 760 58, 832 134" },
] as const;

function TreeFlowLines() {
  return (
    <>
      <svg
        className="goals-tree-flow-svg goals-tree-flow-svg--desktop"
        viewBox="0 0 1000 140"
        preserveAspectRatio="none"
        aria-hidden
      >
        {FLOW_PATHS.map((path) => (
          <g key={path.id} className="goals-tree-flow-group">
            <path
              className="goals-tree-flow-path goals-tree-flow-path--track"
              d={path.d}
            />
            <path
              className="goals-tree-flow-path goals-tree-flow-path--draw"
              data-flow-path={path.id}
              d={path.d}
            />
            <circle className="goals-tree-flow-dot" r="5">
              <animateMotion
                dur="2.6s"
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

    </>
  );
}

function MobileBranchConnector({ pathId }: { pathId: string }) {
  const d = "M 50 4 L 50 56";

  return (
    <svg
      className="goals-tree-flow-svg goals-tree-flow-svg--mobile-branch"
      viewBox="0 0 100 60"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path className="goals-tree-flow-path goals-tree-flow-path--track" d={d} />
      <path
        className="goals-tree-flow-path goals-tree-flow-path--draw"
        data-flow-path={`mobile-${pathId}`}
        d={d}
      />
      <circle className="goals-tree-flow-dot" r="4">
        <animateMotion dur="1.8s" repeatCount="indefinite" path={d} />
      </circle>
    </svg>
  );
}

export default function GoalsHierarchy() {
  const treeRef = useRef<HTMLDivElement>(null);
  const { root, branches } = goalsHierarchy;

  useGSAP(
    () => {
      registerGsap();

      const drawPaths = gsap.utils.toArray<SVGPathElement>(
        ".goals-tree-flow-path--draw"
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
        stagger: 0.22,
        ease: "power2.inOut",
        scrollTrigger: {
          trigger: treeRef.current,
          start: "top 78%",
          toggleActions: "play none none reverse",
        },
      });
    },
    { scope: treeRef }
  );

  return (
    <div ref={treeRef} className="goals-tree goals-tree--branching">
      <div className="goals-tree-canopy" aria-hidden />

      <div className="goals-tree-root-wrap">
        <div className="goals-tree-root glow-border">
          <span className="goals-tree-root-icon" aria-hidden>
            ◆
          </span>
          <p className="goals-tree-root-title">{root.title}</p>
          <p className="goals-tree-root-sub">{root.subtitle}</p>
        </div>
      </div>

      <TreeFlowLines />

      <div className="goals-tree-columns">
        {branches.map((branch) => (
          <div key={branch.id} className="goals-tree-branch">
            <MobileBranchConnector pathId={branch.id} />
            <div className="goals-tree-branch-head glow-border">
              <span className="goals-tree-branch-dot goals-tree-branch-dot--red" aria-hidden />
              <p className="goals-tree-branch-title">{branch.title}</p>
            </div>

            <div className="goals-tree-branch-stem goals-tree-branch-stem--leaf" aria-hidden />

            <ul className="goals-tree-leaves-list">
              {branch.items.map((item) => (
                <li key={item.index} className="goals-tree-leaf-row">
                  <span className="goals-tree-leaf-line" aria-hidden />
                  <div className="goals-tree-leaf-card glow-border">
                    <span className="goals-tree-leaf-num">
                      {String(item.index).padStart(2, "0")}
                    </span>
                    <p className="goals-tree-leaf-label">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="goals-tree-ground" aria-hidden>
        <div className="goals-tree-trunk" />
        <div className="goals-tree-roots" />
      </div>
    </div>
  );
}
