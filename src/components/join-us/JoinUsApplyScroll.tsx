"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getCampaignFromSearch } from "@/lib/apply";

/**
 * Soft navigation in the App Router often lands on /join-us without scrolling
 * to #apply. This watches the URL and brings the application form into view
 * whenever Apply Now (or a campaign deep link) asked for it.
 */
export default function JoinUsApplyScroll() {
  const searchParams = useSearchParams();
  const campaign = searchParams.get("campaign");
  const position = searchParams.get("position") ?? searchParams.get("vacancy");

  useEffect(() => {
    function sync() {
      const selected =
        campaign != null && campaign !== ""
          ? decodeURIComponent(campaign)
          : getCampaignFromSearch(window.location.search);
      const hash = window.location.hash;

      if (selected) {
        window.dispatchEvent(
          new CustomEvent("balitech:apply-campaign", { detail: selected })
        );
      }

      const targetId =
        hash === "#contact"
          ? "contact"
          : hash === "#apply" || Boolean(selected) || Boolean(position)
            ? "apply"
            : null;
      if (!targetId) return;

      const el = document.getElementById(targetId);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    sync();
    const timers = [80, 250, 600].map((ms) => window.setTimeout(sync, ms));
    window.addEventListener("hashchange", sync);
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("hashchange", sync);
    };
  }, [campaign, position]);

  return null;
}
