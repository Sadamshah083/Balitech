import Script from "next/script";
import { ANALYTICS_ENABLED, GA_MEASUREMENT_ID } from "@/lib/analytics";

/**
 * Standalone GA4, loaded directly so reporting does not depend on the GTM
 * container having a GA4 tag. If you later add the GA4 tag inside GTM, remove
 * this component to avoid double-counting. `lazyOnload` keeps gtag off the
 * first-paint TBT window.
 */
export default function GoogleAnalytics() {
  if (!ANALYTICS_ENABLED || !GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="lazyOnload"
      />
      <Script id="ga4-init" strategy="lazyOnload">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}', { anonymize_ip: true });
        `.trim()}
      </Script>
    </>
  );
}
