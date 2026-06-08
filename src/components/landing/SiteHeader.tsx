"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useWindowScroll } from "react-use";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { gsap, registerGsap } from "@/lib/gsap-register";

type SiteHeaderProps = {
  onMenuOpen: () => void;
};

export default function SiteHeader({ onMenuOpen }: SiteHeaderProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const headerRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const { y: scrollY } = useWindowScroll();

  const [time, setTime] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Karachi",
          hour12: false,
        })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    registerGsap();
    const header = headerRef.current;
    if (!header) return;

    const currentY = scrollY ?? 0;

    if (currentY <= 0) {
      gsap.to(header, { y: 0, opacity: 1, duration: 0.2 });
      header.classList.remove("site-header-hidden");
    } else if (currentY > lastScrollY.current) {
      gsap.to(header, { y: -100, opacity: 0, duration: 0.2 });
      header.classList.add("site-header-hidden");
    } else {
      gsap.to(header, { y: 0, opacity: 1, duration: 0.2 });
      header.classList.remove("site-header-hidden");
    }

    lastScrollY.current = currentY;
  }, [scrollY]);

  return (
    <header
      ref={headerRef}
      className={`site-header-bar fixed left-0 right-0 top-0 z-50 ${
        isHome ? "site-header-bar-hero" : "site-header-bar-page"
      }`}
    >
      <div className="mx-auto grid max-w-[1600px] grid-cols-3 items-center px-6 py-6 sm:px-10 sm:py-7 lg:px-14">
        <Link href="/" className="group justify-self-start">
          <div className="flex items-baseline gap-1 sm:gap-2">
            <span className="hero-brand-bali relative text-xl font-black uppercase tracking-tight text-orange sm:text-2xl">
              Bali
            </span>
            <span
              className={`text-lg font-light ${
                isHome ? "site-header-hero-muted" : "text-muted"
              }`}
            >
              •
            </span>
            <span
              className={`hero-brand-tech relative text-xl font-black uppercase tracking-tight sm:text-2xl ${
                isHome ? "site-header-hero-text" : "text-foreground"
              }`}
            >
              Tech
            </span>
          </div>
        </Link>

        <p
          className={`justify-self-center text-center text-[10px] font-medium tracking-[0.25em] sm:text-xs ${
            isHome ? "site-header-hero-muted" : "text-muted"
          }`}
        >
          ( Rawalpindi ) {mounted ? time : "--:--"}
        </p>

        <div className="flex items-center justify-end gap-3 sm:gap-4">
          <ThemeToggle />
          <button
            type="button"
            onClick={onMenuOpen}
            className="text-xs font-bold uppercase tracking-[0.3em] text-orange transition-colors hover:text-orange-light"
          >
            Menu
          </button>
        </div>
      </div>
    </header>
  );
}
