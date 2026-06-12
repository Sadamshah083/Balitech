"use client";

import { useEffect, useRef } from "react";

type GlowLine = {
  yCenter: number;
  ampRatio: number;
  freq: number;
  speed: number;
  opacity: number;
  weight: number;
  hue: number;
  glow: number;
  phase: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  hue: number;
  twinkle: number;
};

const GLOW_LINES: GlowLine[] = [
  { yCenter: 0.22, ampRatio: 0.048, freq: 1.05, speed: 0.00004, opacity: 0.68, weight: 1.55, hue: 32, glow: 22, phase: 0 },
  { yCenter: 0.36, ampRatio: 0.04, freq: 1.55, speed: 0.000055, opacity: 0.52, weight: 1.2, hue: 28, glow: 18, phase: 1.1 },
  { yCenter: 0.5, ampRatio: 0.034, freq: 2.05, speed: 0.00007, opacity: 0.44, weight: 1.05, hue: 35, glow: 15, phase: 2.2 },
  { yCenter: 0.64, ampRatio: 0.052, freq: 0.88, speed: 0.000032, opacity: 0.56, weight: 1.35, hue: 30, glow: 20, phase: 0.7 },
  { yCenter: 0.76, ampRatio: 0.044, freq: 1.28, speed: 0.000046, opacity: 0.48, weight: 1.12, hue: 33, glow: 16, phase: 1.8 },
  { yCenter: 0.88, ampRatio: 0.058, freq: 0.72, speed: 0.000028, opacity: 0.5, weight: 1.4, hue: 27, glow: 19, phase: 3.2 },
];

const VERTICAL_LINES = 10;
const PARTICLE_COUNT = 56;

function createParticles(w: number, h: number): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.35,
    vy: -0.15 - Math.random() * 0.55,
    size: 0.8 + Math.random() * 2.4,
    alpha: 0.15 + Math.random() * 0.45,
    hue: i % 3 === 0 ? 32 : i % 3 === 1 ? 210 : 45,
    twinkle: Math.random() * Math.PI * 2,
  }));
}

export default function BreathingLoader() {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const fxCanvasRef = useRef<HTMLCanvasElement>(null);
  const glowCanvasRef = useRef<HTMLCanvasElement>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const bgCanvas = bgCanvasRef.current;
    const fxCanvas = fxCanvasRef.current;
    const glowCanvas = glowCanvasRef.current;
    const particleCanvas = particleCanvasRef.current;
    if (!bgCanvas || !fxCanvas || !glowCanvas || !particleCanvas) return;

    const bgCtx = bgCanvas.getContext("2d");
    const fxCtx = fxCanvas.getContext("2d");
    const glowCtx = glowCanvas.getContext("2d");
    const particleCtx = particleCanvas.getContext("2d");
    if (!bgCtx || !fxCtx || !glowCtx || !particleCtx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let animationId = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      width = bgCanvas.width = fxCanvas.width = glowCanvas.width = particleCanvas.width = Math.max(
        1,
        Math.floor(rect.width)
      );
      height = bgCanvas.height = fxCanvas.height = glowCanvas.height = particleCanvas.height = Math.max(
        1,
        Math.floor(rect.height)
      );
      particlesRef.current = createParticles(width, height);
    };

    const drawWave = (
      ctx: CanvasRenderingContext2D,
      t: number,
      yCenter: number,
      amplitude: number,
      frequency: number,
      speed: number,
      phaseOffset: number
    ) => {
      const yB = height * yCenter;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 3) {
        const nx = x / width;
        const ph = t * speed;
        const y =
          yB +
          Math.sin(nx * Math.PI * 2 * frequency + ph * 7) * amplitude +
          Math.sin(nx * Math.PI * 3 * frequency * 0.73 + ph * 5.2 + phaseOffset) *
            amplitude *
            0.4;
        if (x === 0) ctx.moveTo(0, y);
        else ctx.lineTo(x, y);
      }
    };

    const drawGlowWavePath = (
      ctx: CanvasRenderingContext2D,
      elapsed: number,
      line: GlowLine,
      amplitude: number
    ) => {
      ctx.beginPath();
      for (let x = 0; x <= width; x += 2) {
        const nx = x / width;
        const phase = elapsed * line.speed;
        const y =
          height * line.yCenter +
          Math.sin(nx * Math.PI * 2 * line.freq + phase * 8 + line.phase) * amplitude +
          Math.sin(nx * Math.PI * 3.2 * line.freq + phase * 5.5 + line.phase * 0.6) *
            amplitude *
            0.35;
        if (x === 0) ctx.moveTo(0, y);
        else ctx.lineTo(x, y);
      }
    };

    const waves = [
      { yCenter: 0.82, amp: 115, freq: 0.78, speed: 0.000082, hue: 222, sat: 63, lit: 8, op: 0.56 },
      { yCenter: 0.76, amp: 95, freq: 1.02, speed: 0.000115, hue: 216, sat: 60, lit: 11, op: 0.47 },
      { yCenter: 0.7, amp: 76, freq: 1.28, speed: 0.000152, hue: 200, sat: 85, lit: 14, op: 0.39 },
      { yCenter: 0.64, amp: 60, freq: 1.58, speed: 0.000192, hue: 225, sat: 58, lit: 15, op: 0.32 },
      { yCenter: 0.58, amp: 48, freq: 1.98, speed: 0.000238, hue: 195, sat: 75, lit: 18, op: 0.26 },
      { yCenter: 0.53, amp: 38, freq: 2.48, speed: 0.000285, hue: 205, sat: 80, lit: 20, op: 0.2 },
    ];

    const startTime = Date.now();

    const loop = () => {
      const elapsed = reducedMotion ? 0 : Date.now() - startTime;
      const breathe = 0.72 + 0.28 * Math.sin(elapsed * 0.0011);
      const blow = 0.85 + 0.15 * Math.sin(elapsed * 0.00073 + 1.4);

      bgCtx.fillStyle = "#050811";
      bgCtx.fillRect(0, 0, width, height);

      const orbs = [
        { x: 0.5, y: 0.5, r: 0.7, inner: "59, 130, 246", outer: "13, 26, 58" },
        { x: 0.18, y: 0.32, r: 0.36, inner: "237, 145, 41", outer: "13, 26, 58" },
        { x: 0.82, y: 0.28, r: 0.32, inner: "237, 145, 41", outer: "13, 26, 58" },
        { x: 0.5, y: 0.72, r: 0.4, inner: "147, 197, 253", outer: "13, 26, 58" },
      ];

      orbs.forEach((orb) => {
        const radius = Math.max(width, height) * orb.r * breathe;
        const gradient = bgCtx.createRadialGradient(
          width * orb.x,
          height * orb.y,
          0,
          width * orb.x,
          height * orb.y,
          radius
        );
        gradient.addColorStop(0, `rgba(${orb.inner}, ${0.24 * blow})`);
        gradient.addColorStop(0.4, `rgba(${orb.outer}, ${0.32 * blow})`);
        gradient.addColorStop(1, "transparent");
        bgCtx.fillStyle = gradient;
        bgCtx.fillRect(0, 0, width, height);
      });

      waves.forEach((w, i) => {
        drawWave(
          bgCtx,
          elapsed,
          w.yCenter,
          w.amp * breathe * (height / 900),
          w.freq,
          w.speed,
          i
        );
        bgCtx.lineTo(width, height);
        bgCtx.lineTo(0, height);
        bgCtx.closePath();
        bgCtx.fillStyle = `hsla(${w.hue}, ${w.sat}%, ${w.lit}%, ${w.op})`;
        bgCtx.fill();
      });

      fxCtx.clearRect(0, 0, width, height);
      const midYBase = height * 0.48;
      const midAmp = height * 0.042 * breathe;
      for (let layer = 0; layer < 4; layer += 1) {
        const phOff = layer * 1.1;
        fxCtx.beginPath();
        for (let x = 0; x <= width; x += 3) {
          const nx = x / width;
          const y =
            midYBase +
            Math.sin(nx * Math.PI * 2 + elapsed * 0.0003 + phOff) * midAmp +
            Math.sin(nx * Math.PI * 3.7 + elapsed * 0.00015 + phOff) * midAmp * 0.38;
          if (x === 0) fxCtx.moveTo(0, y);
          else fxCtx.lineTo(x, y);
        }
        const isOrange = layer % 2 === 1;
        fxCtx.shadowBlur = (16 - layer * 2.5) * breathe;
        fxCtx.shadowColor = isOrange
          ? `rgba(237, 145, 41, ${0.38 - layer * 0.07})`
          : `rgba(59, 130, 246, ${0.38 - layer * 0.07})`;
        fxCtx.strokeStyle = isOrange
          ? `rgba(237, 145, 41, ${0.2 - layer * 0.04})`
          : `rgba(59, 130, 246, ${0.24 - layer * 0.05})`;
        fxCtx.lineWidth = 1.4 - layer * 0.22;
        fxCtx.stroke();
      }
      fxCtx.shadowBlur = 0;

      glowCtx.clearRect(0, 0, width, height);

      GLOW_LINES.forEach((line) => {
        const amplitude = height * line.ampRatio * breathe * blow;
        drawGlowWavePath(glowCtx, elapsed, line, amplitude);
        glowCtx.shadowBlur = line.glow * breathe;
        glowCtx.shadowColor = `hsla(${line.hue}, 92%, 58%, ${line.opacity})`;
        glowCtx.strokeStyle = `hsla(${line.hue}, 88%, 62%, ${line.opacity * 0.92})`;
        glowCtx.lineWidth = line.weight;
        glowCtx.stroke();
        glowCtx.shadowBlur = line.glow * 0.55 * breathe;
        glowCtx.strokeStyle = `rgba(255, 255, 255, ${line.opacity * 0.32})`;
        glowCtx.lineWidth = line.weight * 0.4;
        glowCtx.stroke();
      });

      for (let i = 0; i < VERTICAL_LINES; i += 1) {
        const nx = (i + 1) / (VERTICAL_LINES + 1);
        const x = width * nx;
        const sway = Math.sin(elapsed * 0.0009 + i * 0.9) * width * 0.016 * breathe;
        const alpha = (0.11 + (i % 3) * 0.038) * blow;

        glowCtx.beginPath();
        glowCtx.moveTo(x + sway, height * 0.04);
        glowCtx.lineTo(x - sway * 0.55, height * 0.96);
        glowCtx.shadowBlur = 14 * breathe;
        glowCtx.shadowColor = `rgba(237, 145, 41, ${alpha * 2.4})`;
        glowCtx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        glowCtx.lineWidth = 1;
        glowCtx.stroke();
      }

      const diagonals = [
        { x1: 0, y1: height * 0.15, x2: width, y2: height * 0.85 },
        { x1: width, y1: height * 0.12, x2: 0, y2: height * 0.88 },
      ];
      diagonals.forEach((d, i) => {
        glowCtx.beginPath();
        glowCtx.moveTo(d.x1, d.y1);
        glowCtx.lineTo(d.x2, d.y2);
        glowCtx.shadowBlur = 22 * breathe;
        glowCtx.shadowColor = `rgba(237, 145, 41, ${0.12 + i * 0.04})`;
        glowCtx.strokeStyle = `rgba(255, 255, 255, ${0.06 + i * 0.02})`;
        glowCtx.lineWidth = 1;
        glowCtx.stroke();
      });

      glowCtx.shadowBlur = 0;

      particleCtx.clearRect(0, 0, width, height);
      if (!reducedMotion) {
        particlesRef.current.forEach((p) => {
          p.x += p.vx * breathe;
          p.y += p.vy * breathe;
          if (p.y < -8) {
            p.y = height + 8;
            p.x = Math.random() * width;
          }
          if (p.x < -8) p.x = width + 8;
          if (p.x > width + 8) p.x = -8;

          const twinkle = 0.55 + 0.45 * Math.sin(elapsed * 0.004 + p.twinkle);
          const a = p.alpha * twinkle * blow;
          particleCtx.beginPath();
          particleCtx.arc(p.x, p.y, p.size * breathe, 0, Math.PI * 2);
          particleCtx.shadowBlur = 10 * breathe;
          particleCtx.shadowColor = `hsla(${p.hue}, 90%, 62%, ${a})`;
          particleCtx.fillStyle = `hsla(${p.hue}, 85%, 68%, ${a})`;
          particleCtx.fill();
        });
        particleCtx.shadowBlur = 0;
      }

      animationId = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener("resize", resize);
    loop();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="breathing-loader absolute inset-0 z-0 overflow-hidden w-full h-full"
      aria-hidden
    >
      <canvas ref={bgCanvasRef} className="breathing-loader__canvas breathing-loader__canvas--bg" />
      <canvas ref={fxCanvasRef} className="breathing-loader__canvas breathing-loader__canvas--fx" />
      <canvas ref={glowCanvasRef} className="breathing-loader__canvas breathing-loader__canvas--glow" />
      <canvas
        ref={particleCanvasRef}
        className="breathing-loader__canvas breathing-loader__canvas--particles"
      />

      <div className="hero-loader-breathing__aurora hero-loader-breathing__aurora--1" />
      <div className="hero-loader-breathing__aurora hero-loader-breathing__aurora--2" />
      <div className="hero-loader-breathing__aurora hero-loader-breathing__aurora--3" />

      <div className="hero-loader-breathing__flare hero-loader-breathing__flare--tl" />
      <div className="hero-loader-breathing__flare hero-loader-breathing__flare--br" />

      <div className="hero-loader-breathing__ring hero-loader-breathing__ring--outer" />
      <div className="hero-loader-breathing__ring hero-loader-breathing__ring--inner" />

      <div className="hero-loader-breathing__grid" />

      <div className="hero-loader-breathing__scan" />
      <div className="hero-loader-breathing__scan hero-loader-breathing__scan--delayed" />
      <div className="hero-loader-breathing__scan hero-loader-breathing__scan--fast" />

      <div className="hero-loader-breathing__shimmer" />

      <div
        className="breathing-loader__grain absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="breathing-loader__vignette absolute inset-0 pointer-events-none" />
    </div>
  );
}
