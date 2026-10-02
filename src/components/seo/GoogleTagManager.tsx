import Script from "next/script";
import { ANALYTICS_ENABLED, GTM_CONTAINER_ID } from "@/lib/analytics";

/**
 * Google Tag Manager. `lazyOnload` keeps gtm.js off the hydration / TBT window
 * while still firing after the page is usable — same tags, later start.
 */
export default function GoogleTagManager() {
  if (!ANALYTICS_ENABLED || !GTM_CONTAINER_ID) return null;

  return (
    <Script id="gtm-init" strategy="lazyOnload">
      {`
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_CONTAINER_ID}');
      `.trim()}
    </Script>
  );
}

/** The <noscript> fallback Google asks for immediately after the opening <body>. */
export function GoogleTagManagerNoScript() {
  if (!ANALYTICS_ENABLED || !GTM_CONTAINER_ID) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
