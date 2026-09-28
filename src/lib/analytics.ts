/**
 * Google tracking IDs. The env vars override them, e.g. to point a staging
 * build at a test property; otherwise the live IDs below are used.
 *
 * Tags only load in production builds, so browsing `npm run dev` does not add
 * visits to the live reports.
 */
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-1X5GVFCVGG";

export const GTM_CONTAINER_ID =
  process.env.NEXT_PUBLIC_GTM_ID?.trim() || "GTM-55JDM3MK";

/** Search Console ownership token, emitted as `google-site-verification`. */
export const GOOGLE_SITE_VERIFICATION =
  "sFrnCJRe0T1NZZFw84pBhu0oMyqMd07OEVpTk3r8V1s";

export const ANALYTICS_ENABLED = process.env.NODE_ENV === "production";

type DataLayerWindow = Window & { dataLayer?: unknown[] };

/**
 * Pushes an event to the GTM data layer. Safe to call before GTM has loaded:
 * GTM replays anything already queued in `dataLayer` when it starts.
 */
export function pushDataLayer(event: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const w = window as DataLayerWindow;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push(event);
}
