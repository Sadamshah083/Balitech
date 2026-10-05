"use client";



import { usePathname } from "next/navigation";

import { useEffect, useState } from "react";

import { Menu, X } from "lucide-react";

import BrandLogo from "@/components/brand/BrandLogo";

import IntentLink from "@/components/navigation/IntentLink";

import { applyNowLabel, joinUsHref, navLinks } from "@/lib/navigation";

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


  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);



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



  /* The bar stays put at every scroll position — navigation is always one
     click away rather than something you have to scroll up to summon. All that
     tracks the scroll is how solid it looks: transparent over the hero,
     frosted once there is content behind it.
     
     A listener rather than a scroll-position hook: this only needs to know
     whether the page has passed 24px, so it writes state on the two frames
     where that flips instead of re-rendering the header on every scroll
     event — which matters on the home page, where the light path is already
     doing work on scroll. */
  useEffect(() => {
    let frame = 0;

    const read = () => {
      frame = 0;
      setScrolled(window.scrollY > 24);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(read);
    };

    /* Covers a restored scroll position on load or back-navigation. */
    frame = requestAnimationFrame(read);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);



  return (

    <header
      className={cn(
        "site-navbar site-navbar-pro fixed left-0 right-0 top-0 z-50 transition-[background,backdrop-filter,box-shadow,border-color,transform,opacity] duration-700 ease-out",
        scrolled || mobileOpen ? "site-navbar-scrolled" : "",
          isHome ? "site-navbar--intro" : ""
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

          {navLinks.map((link) => {

            const active = isActive(pathname, link.href);

            return (

              <IntentLink
                key={link.href}
                href={link.href}
                className={cn(
                  "nav-link whitespace-nowrap rounded-full px-2.5 py-1.5 text-sm font-bold uppercase tracking-[0.08em] transition-all duration-300 xl:px-4 xl:text-base relative group",
                  active
                    ? "bg-orange/10 text-orange border border-orange/10 shadow-[0_0_15px_rgba(237,145,41,0.1)]"
                    : "text-foreground/85 hover:text-orange hover:bg-orange/5"
                )}
              >
                {link.label}
                <span
                  className={cn(
                    "absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-orange shadow-[0_0_8px_var(--orange)] transition-all duration-300 ease-out",
                    active ? "w-1/2 opacity-100" : "w-0 opacity-0 group-hover:w-1/3 group-hover:opacity-75"
                  )}
                />
              </IntentLink>

            );

          })}

        </nav>



        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <IntentLink

            href={joinUsHref}

            className="btn-primary hidden rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-[0_0_16px_color-mix(in_srgb,var(--orange)_35%,transparent)] sm:inline-flex"

          >

            {applyNowLabel}

          </IntentLink>



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



      {/* Kept mounted and driven by CSS: framer-motion was loading on every
          page just to fade this panel in and out. `inert` keeps the closed
          menu out of the tab order and the accessibility tree. */}
      <button
        type="button"
        aria-label="Close navigation menu"
        data-open={mobileOpen}
        inert={!mobileOpen}
        className="mobile-nav-scrim fixed inset-0 top-[var(--site-navbar-height)] z-40 bg-black/50 backdrop-blur-[2px] lg:hidden"
        onClick={() => setMobileOpen(false)}
      />

      <nav
        id="mobile-navbar"
        data-open={mobileOpen}
        inert={!mobileOpen}
        className="mobile-navbar absolute left-0 right-0 top-full z-50 border-b border-orange/25 bg-background/98 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-lg lg:hidden"
        aria-label="Mobile navigation"
      >

              <ul className="mx-auto max-w-[1600px] px-4 py-4 sm:px-8">

                {allLinks.map((link) => {

                  const active = isActive(pathname, link.href);

                  const isJoin = link.href === joinUsHref;



                  return (

                    <li key={link.href}>

                      <IntentLink

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

                      </IntentLink>

                    </li>

                  );

                })}

              </ul>

      </nav>

    </header>

  );

}


