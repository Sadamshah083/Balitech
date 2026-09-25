"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/* The router's own scroll reset does not reach the top here (it scrolls only as
   far as the new page segment, and the smooth scroll-behavior on <html> lets
   that get cut short), so a link from the footer opened the next page halfway
   down. Back/forward keeps the browser's restored position, and #hash links
   keep their anchor. */
export default function ScrollToTopOnNavigate() {
  const pathname = usePathname();
  const fromHistory = useRef(false);
  const firstRender = useRef(true);

  useEffect(() => {
    const onPopState = () => {
      fromHistory.current = true;
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.hash) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    window.addEventListener("popstate", onPopState);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("click", onClick);
    };
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (fromHistory.current) {
      fromHistory.current = false;
      return;
    }
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
