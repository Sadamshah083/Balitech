"use client";



import Link from "next/link";

import { usePathname } from "next/navigation";

import { useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { Menu, X } from "lucide-react";

import { useWindowScroll } from "react-use";

import BrandLogo from "@/components/brand/BrandLogo";

import { applyNowLabel, joinUsHref, navLinks } from "@/lib/navigation";

import { gsap, registerGsap } from "@/lib/gsap-register";

import { cn } from "@/lib/cn";



function isActive(pathname: string, href: string) {

  if (href === "/") return pathname === "/";

  if (href.startsWith("/#")) return pathname === "/";

  return pathname.startsWith(href);

}



const allLinks = [...navLinks, { href: joinUsHref, label: applyNowLabel }] as const;



export default function SiteHeader() {

  const pathname = usePathname();

  const isHome = pathname === "/";

  const headerRef = useRef<HTMLElement>(null);

  const lastScrollY = useRef(0);

  const { y: scrollY } = useWindowScroll();



  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(isHome);

  useEffect(() => {
    if (!isHome) return;
    const loaderTimer = setTimeout(() => {
      setIsPageLoading(false);
    }, 3300);
    return () => clearTimeout(loaderTimer);
  }, [isHome]);



  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setMobileOpen(false);
    });
    return () => cancelAnimationFrame(handle);
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
        "site-navbar site-navbar-pro fixed left-0 right-0 top-0 z-50 transition-[background,backdrop-filter,box-shadow,border-color,transform,opacity] duration-700 ease-out",
        scrolled || mobileOpen ? "site-navbar-scrolled" : "",
        isPageLoading ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
      )}
    >

      <div className="site-navbar__inner mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-2 sm:px-8 lg:px-12 lg:py-2.5">

        <BrandLogo
          priority
          width={224}
          height={42}
          imageClassName="h-11 max-w-[13.5rem] sm:h-12 sm:max-w-[15rem] md:h-[3.35rem] md:max-w-[16.5rem]"
        />



        <nav

          className="hidden flex-1 items-center justify-center gap-1 xl:gap-1.5 lg:flex"

          aria-label="Main navigation"

        >

          {allLinks.map((link) => {

            const active = isActive(pathname, link.href);

            const isJoin = link.href === joinUsHref;



            return (

              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "nav-link rounded-full px-3 py-1.5 text-sm font-bold uppercase tracking-[0.08em] transition-all duration-300 xl:px-4 xl:text-base relative group",
                  isJoin
                    ? "btn-primary px-4 py-2 shadow-[0_0_16px_color-mix(in_srgb,var(--orange)_35%,transparent)]"
                    : active
                      ? "bg-orange/10 text-orange border border-orange/10 shadow-[0_0_15px_rgba(237,145,41,0.1)]"
                      : "text-foreground/85 hover:text-orange hover:bg-orange/5"
                )}
              >
                {link.label}
                {!isJoin && (
                  <span
                    className={cn(
                      "absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full bg-orange shadow-[0_0_8px_var(--orange)] transition-all duration-300 ease-out",
                      active ? "w-1/2 opacity-100" : "w-0 opacity-0 group-hover:w-1/3 group-hover:opacity-75"
                    )}
                  />
                )}
              </Link>

            );

          })}

        </nav>



        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link

            href={joinUsHref}

            className="btn-primary hidden rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider sm:inline-flex lg:hidden"

          >

            {applyNowLabel}

          </Link>



          <button

            type="button"

            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}

            aria-expanded={mobileOpen}

            aria-controls="mobile-navbar"

            onClick={() => setMobileOpen((open) => !open)}

            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-orange/40 text-orange transition hover:bg-orange hover:text-on-primary lg:hidden"

          >

            {mobileOpen ? <X size={18} /> : <Menu size={18} />}

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

              className="fixed inset-0 top-[var(--site-navbar-height)] z-40 bg-black/50 backdrop-blur-[2px] lg:hidden"

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

                  const isJoin = link.href === joinUsHref;



                  return (

                    <li key={link.href}>

                      <Link

                        href={link.href}

                        onClick={() => setMobileOpen(false)}

                        className={cn(

                          "mobile-nav-link flex items-center rounded-xl px-4 py-3.5 text-base font-bold uppercase tracking-wider transition-colors",

                          isJoin

                            ? "btn-primary justify-center py-3.5 shadow-[0_0_16px_color-mix(in_srgb,var(--orange)_35%,transparent)]"

                            : active

                              ? "bg-orange/15 text-orange"

                              : "text-foreground/90 hover:bg-orange/10 hover:text-orange"

                        )}

                      >

                        {link.label}

                      </Link>

                    </li>

                  );

                })}

              </ul>

            </motion.nav>

          </>

        )}

      </AnimatePresence>

    </header>

  );

}


