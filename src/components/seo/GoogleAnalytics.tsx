import Script from "next/script";
import { ANALYTICS_ENABLED, GA_MEASUREMENT_ID } from "@/lib/analytics";

/**
 * Loads Google Analytics 4 (gtag.js). Production builds only; see
 * `src/lib/analytics.ts` for the ID and its env override.
 */
export default function GoogleAnalytics() {
  if (!ANALYTICS_ENABLED || !GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');
        `.trim()}
      </Script>
    </>
  );
}
