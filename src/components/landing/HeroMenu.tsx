"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { joinUsHref, navLinks } from "@/lib/navigation";

type HeroMenuProps = {
  open: boolean;
  onClose: () => void;
};

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function HeroMenu({ open, onClose }: HeroMenuProps) {
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className="site-menu fixed inset-0 z-[100]"
        >
          {/* Left — dimmed page visible behind */}
          <motion.button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="site-menu-backdrop absolute inset-0 backdrop-blur-[3px]"
          />

          {/* Right — white panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="site-menu-panel absolute right-0 top-0 flex h-full w-full flex-col sm:w-1/2"
          >
            <button
              type="button"
              onClick={onClose}
              className="site-menu-close absolute right-8 top-8 text-[11px] font-bold uppercase tracking-[0.35em] transition sm:right-10 sm:top-10"
            >
              Close
            </button>

            <nav className="flex flex-1 flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-20">
              <ul className="flex flex-col">
                {navLinks.map((link, i) => {
                  const active = isActive(pathname, link.href);

                  return (
                    <motion.li
                      key={link.href}
                      initial={{ opacity: 0, x: 32 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      transition={{
                        delay: 0.12 + i * 0.06,
                        duration: 0.45,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <Link
                        href={link.href}
                        onClick={onClose}
                        className={`site-menu-link group flex items-center py-1 sm:py-1.5 ${
                          active ? "is-active" : ""
                        }`}
                      >
                        <span className="site-menu-icon mr-2 sm:mr-3" aria-hidden>
                          ( ⦿ )
                        </span>
                        <span>{link.label}</span>
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>

              <motion.div
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{
                  delay: 0.12 + navLinks.length * 0.06,
                  duration: 0.45,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="mt-8 sm:mt-12"
              >
                <Link
                  href={joinUsHref}
                  onClick={onClose}
                  className={`site-menu-link site-menu-join ${
                    isActive(pathname, joinUsHref) ? "is-active" : ""
                  }`}
                >
                  Join Us
                </Link>
              </motion.div>
            </nav>

            <span className="site-menu-corner site-menu-corner-left" aria-hidden />
            <span className="site-menu-corner site-menu-corner-right" aria-hidden />
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
