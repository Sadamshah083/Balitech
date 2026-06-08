"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useWindowScroll } from "react-use";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { joinUsHref, navLinks } from "@/lib/navigation";
import { gsap, registerGsap } from "@/lib/gsap-register";
import { cn } from "@/lib/cn";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href.startsWith("/#")) return pathname === "/";
  return pathname.startsWith(href);
}

const allLinks = [...navLinks, { href: joinUsHref, label: "Join Us" }] as const;

export default function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const headerRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const { y: scrollY } = useWindowScroll();

  const [time, setTime] = useState("");
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    registerGsap();
    const header = headerRef.current;
    if (!header) return;

    const currentY = scrollY ?? 0;
    setScrolled(currentY > 24);

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
      className={cn(
        "site-navbar site-navbar-pro fixed left-0 right-0 top-0 z-50 transition-[background,backdrop-filter,box-shadow,border-color] duration-300",
        scrolled || mobileOpen ? "site-navbar-scrolled" : ""
      )}
    >
      <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-4 sm:px-8 lg:px-12 lg:py-5">
        <Link href="/" className="group shrink-0">
          <div className="flex items-baseline gap-1 sm:gap-2">
            <span className="hero-brand-bali relative text-lg font-black uppercase tracking-tight text-orange sm:text-xl">
              Bali
            </span>
            <span className="text-base font-light text-muted">•</span>
            <span className="hero-brand-tech relative text-lg font-black uppercase tracking-tight text-foreground sm:text-xl">
              Tech
            </span>
          </div>
        </Link>

        <nav
          className="hidden flex-1 items-center justify-center gap-1 xl:gap-2 lg:flex"
          aria-label="Main navigation"
        >
          {allLinks.map((link) => {
            const active = isActive(pathname, link.href);
            const isJoin = link.href === joinUsHref;
            const isContact = link.href === "/#contact";

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "nav-link rounded-full px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors xl:px-4 xl:text-xs",
                  active
                    ? "bg-orange/15 text-orange"
                    : isContact
                      ? "border border-orange/50 text-orange hover:bg-orange/10"
                      : isJoin
                        ? "text-orange hover:bg-orange hover:text-on-primary"
                        : "text-foreground/85 hover:bg-orange/10 hover:text-orange"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {!isHome && (
            <p className="hidden text-[10px] font-medium tracking-[0.2em] text-muted md:block lg:text-xs">
              Rawalpindi · {mounted ? time : "--:--"}
            </p>
          )}

          <ThemeToggle />

          <Link
            href={joinUsHref}
            className="btn-primary hidden rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-wider sm:inline-flex lg:hidden"
          >
            Join Us
          </Link>

          <button
            type="button"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navbar"
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-orange/40 text-orange transition hover:bg-orange hover:text-on-primary lg:hidden"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close navigation menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 top-[4.5rem] z-40 bg-black/50 backdrop-blur-[2px] lg:hidden"
              onClick={() => setMobileOpen(false)}
            />

            <motion.nav
              id="mobile-navbar"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="mobile-navbar absolute left-0 right-0 top-full z-50 border-b border-orange/25 bg-background/98 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-lg lg:hidden"
              aria-label="Mobile navigation"
            >
              <ul className="mx-auto max-w-[1600px] px-4 py-4 sm:px-8">
                {allLinks.map((link) => {
                  const active = isActive(pathname, link.href);

                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "mobile-nav-link flex items-center rounded-xl px-4 py-3.5 text-sm font-bold uppercase tracking-wider transition-colors",
                          active
                            ? "bg-orange/15 text-orange"
                            : "text-foreground/90 hover:bg-orange/10 hover:text-orange"
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
                <li className="mt-2 border-t border-orange/15 pt-3">
                  <div className="flex items-center justify-between rounded-xl px-4 py-3">
                    <span className="text-sm font-bold uppercase tracking-wider text-foreground/80">
                      Theme
                    </span>
                    <ThemeToggle showLabel />
                  </div>
                </li>
              </ul>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
