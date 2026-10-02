import Script from "next/script";
import { ANALYTICS_ENABLED, META_PIXEL_ID } from "@/lib/analytics";
import MetaPixelRouteTracker from "@/components/seo/MetaPixelRouteTracker";

/**
 * Meta (Facebook) Pixel. `lazyOnload` keeps fbevents.js off the first-paint
 * TBT window, matching GTM / GA. PageView fires on load; route changes are
 * tracked by MetaPixelRouteTracker for the App Router.
 */
export default function MetaPixel() {
  if (!ANALYTICS_ENABLED || !META_PIXEL_ID) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="lazyOnload">
        {`
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');
        `.trim()}
      </Script>
      <MetaPixelRouteTracker />
    </>
  );
}

/** Noscript fallback Meta asks for immediately after the opening <body>. */
export function MetaPixelNoScript() {
  if (!ANALYTICS_ENABLED || !META_PIXEL_ID) return null;

  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
}
