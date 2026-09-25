"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadGsap, loadGsapWhenIdle } from "@/lib/gsap-register";
import { onIdle } from "@/lib/on-idle";
import { onFirstInteraction } from "@/lib/on-interaction";
import { HERO_LOADER_REMOVE_MS } from "@/lib/hero-loader";
import { buildRibbon, type StrandTone } from "@/lib/light-path";

/** How far down the first viewport the ribbon has reached before any scrolling,
    so the hero opens on it rather than on an empty layer. */
const RESTING_TIP = 0.66;

/** Depth of the soft edge at the tip, in pixels. Mirrors the gradient on
    `.light-path__curtain`, which is what actually draws the fade. */
const TIP_FADE = 220;

/** Quiet time after `load` before GSAP is fetched ahead of the first scroll. */
const GSAP_WARM_AFTER_LOAD_MS = 2500;

/**
 * The comet's own little canvas, and where its head sits inside it.
 *
 * The comet used to be drawn in the full-page SVG and moved by writing its
 * `transform` attribute. That reads well but scrolls badly: an SVG geometry
 * change invalidates the SVG it belongs to, and that one is as tall as the
 * document and full of blurred strands, so every frame of comet travel re-ran
 * blurs over the whole visible area. It measured as three quarters of the
 * page's scroll jank.
 *
 * Drawn in a box of its own it is the same handful of shapes against the same
 * gradients — objectBoundingBox units mean the tail and glow are unchanged —
 * but now it moves by transforming a 192x96 layer, which costs a composite and
 * no layout at all.
 *
 * Wide enough for the tail (128px behind the head) and tall enough for the
 * glow at the top of its pulse (r26 scaled to 1.4), with room to spare so the
 * viewBox never clips it.
 */
const COMET_BOX = { width: 192, height: 96 };
const COMET_ORIGIN = { x: 140, y: 48 };

/**
 * Bands and filaments are stroked with different gradients of the same hue.
 *
 * This is what the reference actually does: the wide bands are deep, nearly
 * saturated colour, and all the brightness lives in the hairline filaments
 * running along them. Painting the bands hot as well would put a wall of light
 * behind whatever text the ribbon passes under, and would read as a printed
 * stripe rather than as something glowing.
 */
const GRADIENT: Record<StrandTone, { deep: string; hot: string }> = {
  blue: { deep: "url(#ribbon-blue)", hot: "url(#ribbon-blue-hot)" },
  warm: { deep: "url(#ribbon-warm)", hot: "url(#ribbon-warm-hot)" },
  white: { deep: "url(#ribbon-white)", hot: "url(#ribbon-white)" },
};

/** Back to front, matching the order the strand table is written in. */
const WEIGHTS = ["bloom", "band", "filament"] as const;

const MOTE_FILL: Record<StrandTone, string> = {
  blue: "url(#ribbon-mote-blue)",
  warm: "url(#ribbon-mote-warm)",
  white: "url(#ribbon-mote-warm)",
};

/**
 * The light ribbon behind the home page: woven blue and amber strands that
 * descend the full height of the document, extending as you scroll.
 *
 * It sits at the back of the page — first child of the shell, below every
 * section — so the glass panels read as floating over it. That only works
 * because the home page's sections are transparent; see the
 * `.site-main--index` band overrides in globals.css.
 *
 * The layer blends with `screen`, which can only lighten. That is what lets
 * overlapping strands build hot spots where blue crosses amber, and it is also
 * what makes the reveal cheap: black is `screen`'s identity, so an opaque black
 * block hides whatever it covers without ever showing itself.
 *
 * Nothing here can interfere with the page: `pointer-events: none`,
 * `aria-hidden`, and the only animated properties are transforms.
 */
export default function LightPath() {
  const rootRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const cometRef = useRef<HTMLDivElement>(null);
  const introPlayed = useRef(false);
  const firstBuildDone = useRef(false);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [armed, setArmed] = useState(false);

  /* The ribbon is a scroll effect, so it is built when there is a scroll to
     respond to. Before that it costs a full-page SVG rasterisation, the GSAP
     download, and a 2.3s reveal, all of it spent while the visitor is still
     reading the hero. */
  useEffect(() => onFirstInteraction(() => setArmed(true)), []);

  /* On a phone the first interaction is the touch that starts the first swipe,
     so fetching and evaluating GSAP then cost the opening frames of that
     scroll. Warming it once the page has loaded and gone quiet moves that work
     out of the swipe; the ribbon itself still waits for the interaction. */
  useEffect(() => {
    let cancel = () => {};
    const warm = () => {
      const timer = window.setTimeout(() => {
        cancel = onIdle(() => void loadGsap(), 3000);
      }, GSAP_WARM_AFTER_LOAD_MS);
      cancel = () => window.clearTimeout(timer);
    };
    if (document.readyState === "complete") warm();
    else window.addEventListener("load", warm, { once: true });
    return () => {
      window.removeEventListener("load", warm);
      cancel();
    };
  }, []);

  /* The geometry is built from the measured box, so it has to be remeasured
     whenever the page reflows — images loading and fonts swapping both change
     the document height well after mount. */
  const measure = useCallback(() => {
    const node = rootRef.current;
    if (!node) return;

    const width = node.clientWidth;
    const height = node.clientHeight;

    setBox((current) =>
      /* Rebuilding the geometry resets the whole rig, so the bar for doing it
         is deliberately high: sub-pixel scroll jitter reports height deltas
         every frame, and a carousel settling shifts it by a few more. Now that
         the sections below the fold size themselves as they render, the height
         also creeps by a few hundred pixels over the first scroll, and each of
         those steps would otherwise re-render a 16,000px SVG. */
      Math.abs(current.width - width) < 2 && Math.abs(current.height - height) < 600
        ? current
        : { width, height }
    );
  }, []);

  useEffect(() => {
    if (!armed) return;

    const node = rootRef.current;
    if (!node) return;

    /* Nothing here is visible until the intro overlay has gone: the ribbon sits
       behind the page, and the page is behind an opaque panel for the whole of
       the intro. Building it any earlier meant rasterising a full-page-height
       blurred layer, and playing its 2.3s reveal, underneath that panel —
       entirely unseen, and in direct competition with first paint. Waiting also
       means the reveal is now actually watched rather than missed.

       Someone who scrolls during the intro has already used up part of that
       wait, so only the remainder is held. */
    let cancelIdle = () => {};
    const startTimer = setTimeout(() => {
      cancelIdle = onIdle(() => {
        firstBuildDone.current = true;
        measure();
      });
    }, Math.max(0, HERO_LOADER_REMOVE_MS - performance.now()));

    /* ResizeObserver runs its callback once as soon as it starts observing, so
       observing straight away would have measured — and built — immediately,
       defeating the wait above. */
    const observer = new ResizeObserver(() => {
      if (!firstBuildDone.current) return;
      measure();
    });
    observer.observe(node);

    return () => {
      clearTimeout(startTimer);
      cancelIdle();
      observer.disconnect();
    };
  }, [armed, measure]);

  const ribbon = useMemo(
    () => (box.width > 0 && box.height > 0 ? buildRibbon(box.width, box.height) : null),
    [box.width, box.height]
  );

  useEffect(() => {
    const curtain = curtainRef.current;
    const comet = cometRef.current;
    const root = rootRef.current;
    if (!curtain || !comet || !root || !ribbon) return;

    let context: { revert: () => void } | undefined;
    /* Assigned from inside the GSAP context below. Kept out here because that
       function returns early on a rebuild, so it has no one place to hand a
       cleanup back from. */
    let detachIdle = () => {};

    /* Purely decorative, so the library it needs is fetched once the browser
       has nothing better to do rather than during page load. */
    const cancelIdle = loadGsapWhenIdle(({ gsap, ScrollTrigger }) => {
      /* The comet's tail hangs off one side, so its box centre — GSAP's default
         pivot — is not the head, and rotating about it would swing the head off
         the ribbon by tens of pixels. Pinning the origin to where the head is
         drawn inside its box makes `rotation` turn the comet about its head,
         which is what the old SVG `translate() rotate()` did. */
      gsap.set(comet, {
        transformOrigin: `${COMET_ORIGIN.x}px ${COMET_ORIGIN.y}px`,
      });

      /* One place where progress becomes pixels. The curtain hides the page below
         the tip and the comet sits on it, so both are driven from the same y.

         Both are moved with transforms on elements that have a compositing layer
         to themselves, so a frame of scroll is a composite: no layout, no paint,
         and in particular no re-running of the strand blurs. */
      const showTo = (y: number) => {
        const at = ribbon.pointAtY(y);
        gsap.set(curtain, { y: y - TIP_FADE / 2 });
        gsap.set(comet, {
          x: at.x - COMET_ORIGIN.x,
          y: at.y - COMET_ORIGIN.y,
          rotation: at.angle,
        });
      };

      const restingTip = Math.min(window.innerHeight * RESTING_TIP, box.height * 0.35);

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        /* The whole ribbon, held still: the effect still reads as light behind
           the page, it just does not move or trail a comet. */
        showTo(box.height);
        gsap.set(comet, { autoAlpha: 0 });
        return;
      }

      context = gsap.context(() => {
        /* The tip descends at the rate the page scrolls, so a section is lit at
           the moment it arrives rather than drifting against it. */
        const state = { y: restingTip };
        const bounds = {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          /* Lags the tip a little behind the wheel, which reads as the ribbon
             being trailed out rather than rigidly pinned to the scrollbar. */
          scrub: 0.8,
        } as const;

        const attachScroll = () =>
          gsap.to(state, {
            y: box.height,
            ease: "none",
            scrollTrigger: bounds,
            onUpdate: () => showTo(state.y),
          });

        const glow = gsap.to(".light-path__comet-glow", {
          scale: 1.4,
          opacity: 0.45,
          duration: 1.9,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          transformOrigin: "center",
        });

        /* Motes drift on their own clock so the ribbon never looks frozen while
           the page is still. Staggered from the middle out, which keeps the
           movement from reading as one pulse. */
        const drift = gsap.to(".light-path__mote", {
          y: (i) => (i % 2 === 0 ? -16 : 14),
          opacity: 0.18,
          duration: 3.4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          stagger: { each: 0.22, from: "center" },
        });

        /* Both of the above repeat forever, and "while the page is still" is
           the whole point of them — so they stand down while it is not.
           Scrolling already moves the ribbon far more than a drifting mote
           does: the tip is descending and the comet is running down it. Nobody
           can see the drift stop, and it is the difference between 30fps and 60
           on a mid-range phone.

           Also covers a backgrounded tab, where they would otherwise animate
           against a page nobody is looking at. */
        const idle = [glow, drift];
        let settle = 0;

        const rest = () => {
          for (const tween of idle) tween.pause();
        };

        const wake = () => {
          if (document.hidden) return;
          for (const tween of idle) tween.resume();
        };

        const onScroll = () => {
          rest();
          clearTimeout(settle);
          settle = window.setTimeout(wake, 240);
        };

        const onVisibility = () => (document.hidden ? rest() : wake());

        window.addEventListener("scroll", onScroll, { passive: true });
        document.addEventListener("visibilitychange", onVisibility);

        detachIdle = () => {
          clearTimeout(settle);
          window.removeEventListener("scroll", onScroll);
          document.removeEventListener("visibilitychange", onVisibility);
        };

        /* Images finishing and fonts swapping both change the document height,
           which rebuilds the geometry from scratch. Replaying the reveal each
           time would wipe the ribbon mid-read, so it runs once per mount and
           later rebuilds jump straight to the scrolled state. */
        if (introPlayed.current) {
          showTo(restingTip);
          attachScroll();
          return;
        }

        introPlayed.current = true;
        showTo(-TIP_FADE);
        gsap.set(comet, { autoAlpha: 0 });

        const intro = gsap.timeline();

        intro
          .fromTo(
            state,
            { y: -TIP_FADE },
            {
              y: restingTip,
              duration: 2.3,
              ease: "power2.inOut",
              onUpdate: () => showTo(state.y),
            },
            0
          )
          .to(comet, { autoAlpha: 1, duration: 0.9, ease: "power1.out" }, 0.6);

        /* Scrolling mid-reveal would leave the intro animating against the
           scrubbed value, so the first scroll ends the reveal early instead. */
        const handoff = () => {
          window.removeEventListener("scroll", handoff);
          intro.eventCallback("onComplete", null);
          intro.progress(1).kill();
          attachScroll();
        };

        intro.eventCallback("onComplete", handoff);
        window.addEventListener("scroll", handoff, { once: true, passive: true });
      }, root);

      ScrollTrigger.refresh();
    });

    return () => {
      cancelIdle();
      detachIdle();
      context?.revert();
    };
  }, [ribbon, box.height]);

  return (
    <div ref={rootRef} className="light-path" aria-hidden>
      {ribbon && (
        <>
          <svg
            className="light-path__svg"
            width={box.width}
            height={box.height}
            viewBox={`0 0 ${box.width} ${box.height}`}
            focusable="false"
            role="presentation"
          >
            <defs>
              {/* Each tone shifts along its own length rather than holding one
                  flat colour, so a strand changes hue as it descends and the
                  bundle never looks like a printed stripe. */}
              <linearGradient
                id="ribbon-blue"
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1="0"
                x2="0"
                y2={box.height}
              >
                <stop offset="0%" stopColor="var(--ribbon-blue-deep)" />
                <stop offset="30%" stopColor="var(--ribbon-blue)" />
                <stop offset="62%" stopColor="var(--ribbon-blue)" />
                <stop offset="100%" stopColor="var(--ribbon-blue-deep)" />
              </linearGradient>

              <linearGradient
                id="ribbon-blue-hot"
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1="0"
                x2="0"
                y2={box.height}
              >
                <stop offset="0%" stopColor="var(--ribbon-blue)" />
                <stop offset="26%" stopColor="var(--ribbon-blue-bright)" />
                <stop offset="58%" stopColor="var(--ribbon-blue-bright)" />
                <stop offset="100%" stopColor="var(--ribbon-blue)" />
              </linearGradient>

              <linearGradient
                id="ribbon-warm"
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1="0"
                x2="0"
                y2={box.height}
              >
                <stop offset="0%" stopColor="var(--ribbon-warm-deep)" />
                <stop offset="32%" stopColor="var(--ribbon-warm)" />
                <stop offset="66%" stopColor="var(--ribbon-warm)" />
                <stop offset="100%" stopColor="var(--ribbon-warm-deep)" />
              </linearGradient>

              <linearGradient
                id="ribbon-warm-hot"
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1="0"
                x2="0"
                y2={box.height}
              >
                <stop offset="0%" stopColor="var(--ribbon-warm)" />
                <stop offset="28%" stopColor="var(--ribbon-warm-bright)" />
                <stop offset="60%" stopColor="var(--ribbon-warm-bright)" />
                <stop offset="100%" stopColor="var(--ribbon-warm)" />
              </linearGradient>

              <linearGradient
                id="ribbon-white"
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1="0"
                x2="0"
                y2={box.height}
              >
                <stop offset="0%" stopColor="var(--ribbon-warm-bright)" />
                <stop offset="18%" stopColor="var(--ribbon-core)" />
                <stop offset="56%" stopColor="var(--ribbon-core)" />
                <stop offset="82%" stopColor="var(--ribbon-blue-bright)" />
                <stop offset="100%" stopColor="var(--ribbon-warm-bright)" />
              </linearGradient>

            </defs>

            {/* Ordered back to front by the strand table: haze, then bands,
                then the bright filaments that ride along their edges — which is
                also the order WEIGHTS lists them in, so grouping does not
                reorder anything.

                Grouped so that each weight is blurred once instead of each
                strand being blurred on its own. A filter costs an offscreen
                surface, and ten of them over a document-tall area was 18% of
                this page's raster time on an integrated GPU. Radius turned out
                not to matter at all — only how many separately filtered things
                there were — so the radii are untouched and the picture is the
                same to within 0.04% of pixels, which
                scripts/_ribbon_compare.js checks. */}
            {WEIGHTS.map((weight) => (
              <g key={weight} className={`light-path__strands--${weight}`}>
                {ribbon.strands
                  .filter((strand) => strand.weight === weight)
                  .map((strand, index) => (
                    <path
                      key={index}
                      /* The weight is on the path as well as the group purely
                         so scripts/_ribbon_compare.js can put the blurs back on
                         the individual paths and prove the grouped version
                         renders the same thing. Nothing styles it otherwise. */
                      className={`light-path__strand light-path__strand--${weight}`}
                      d={strand.d}
                      stroke={
                        GRADIENT[strand.tone][weight === "filament" ? "hot" : "deep"]
                      }
                      strokeWidth={strand.width}
                      opacity={strand.opacity}
                    />
                  ))}
              </g>
            ))}
          </svg>

          {/* Everything that moves, in its own SVG laid exactly over the one
              above — the single most important line in this file for how the
              page scrolls.

              A blur is only rasterised once so long as nothing else in the same
              layer changes. With the motes and the comet inside the SVG above,
              every drifting mote and every scroll frame dirtied that layer and
              made the browser re-run blurs the height of the whole document:
              measured, it held scrolling at 30fps and threw 800ms frames.
              Nothing in here is filtered, so moving it costs a composite.

              The strand gradients stay behind with the strands and these stay
              with the motes, so no id is defined twice. */}
          <svg
            className="light-path__svg light-path__svg--live"
            width={box.width}
            height={box.height}
            viewBox={`0 0 ${box.width} ${box.height}`}
            focusable="false"
            role="presentation"
          >
            <defs>
              {/* Radial falloff rather than flat discs — a solid circle at low
                  opacity still shows its edge and reads as a sticker. */}
              <radialGradient id="ribbon-mote-warm">
                <stop offset="0%" stopColor="var(--ribbon-core)" stopOpacity="0.95" />
                <stop offset="35%" stopColor="var(--ribbon-warm-bright)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="var(--ribbon-warm)" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="ribbon-mote-blue">
                <stop offset="0%" stopColor="var(--ribbon-core)" stopOpacity="0.9" />
                <stop offset="35%" stopColor="var(--ribbon-blue-bright)" stopOpacity="0.55" />
                <stop offset="100%" stopColor="var(--ribbon-blue)" stopOpacity="0" />
              </radialGradient>

            </defs>

            {ribbon.motes.map((mote, index) => (
              <circle
                key={index}
                className="light-path__mote"
                cx={mote.x}
                cy={mote.y}
                r={mote.r}
                fill={MOTE_FILL[mote.tone]}
                opacity={mote.opacity}
              />
            ))}
          </svg>

          {/* The comet, on a layer of its own so travelling down the page costs
              a composite rather than a repaint of everything it flies over.
              See COMET_BOX above for why it is not drawn in the SVGs. */}
          <div
            ref={cometRef}
            className="light-path__comet-rig"
            style={{ width: COMET_BOX.width, height: COMET_BOX.height }}
          >
            <svg
              width={COMET_BOX.width}
              height={COMET_BOX.height}
              viewBox={`${-COMET_ORIGIN.x} ${-COMET_ORIGIN.y} ${COMET_BOX.width} ${COMET_BOX.height}`}
              focusable="false"
              role="presentation"
            >
              <defs>
                <radialGradient id="ribbon-comet">
                  <stop offset="0%" stopColor="var(--ribbon-core)" stopOpacity="0.9" />
                  <stop offset="22%" stopColor="var(--ribbon-warm-bright)" stopOpacity="0.45" />
                  <stop offset="55%" stopColor="var(--ribbon-warm)" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="var(--ribbon-warm)" stopOpacity="0" />
                </radialGradient>

                {/* Brightest at the head and gone by the far end, so the tail
                    reads as light left behind rather than a drawn shape. The box
                    units make it turn with the comet. */}
                <linearGradient id="ribbon-comet-tail" x1="1" y1="0" x2="0" y2="0">
                  <stop offset="0%" stopColor="var(--ribbon-core)" stopOpacity="0.5" />
                  <stop offset="45%" stopColor="var(--ribbon-warm-bright)" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="var(--ribbon-warm)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Drawn about (0, 0) — the head — exactly as before, so the
                  tail still lies back along the ribbon once the rig is turned
                  onto the heading of the curve. */}
              <ellipse className="light-path__comet-tail" cx="-64" cy="0" rx="64" ry="6" />
              <circle className="light-path__comet-glow" r="26" />
              <circle className="light-path__comet-core" r="2.6" />
            </svg>
          </div>

          <div ref={curtainRef} className="light-path__curtain" />
        </>
      )}
    </div>
  );
}
