import Script from "next/script";
import { ANALYTICS_ENABLED, GTM_CONTAINER_ID } from "@/lib/analytics";

/**
 * Standalone GA4. Skipped when GTM is already active (tags live in the
 * container). `lazyOnload` keeps gtag off the first-paint TBT window.
 */
export default function GoogleAnalytics() {
  if (ANALYTICS_ENABLED && GTM_CONTAINER_ID) return null;

  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  if (!measurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="lazyOnload"
      />
      <Script id="ga4-init" strategy="lazyOnload">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId}', { anonymize_ip: true });
        `.trim()}
      </Script>
    </>
  );
}
