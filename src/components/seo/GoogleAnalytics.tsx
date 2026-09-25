import Script from "next/script";

/**
 * Loads Google Analytics 4 when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set
 * (e.g. G-XXXXXXXXXX). Silent no-op when the env var is missing so local
 * and staging builds stay clean.
 */
export default function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  if (!measurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
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
