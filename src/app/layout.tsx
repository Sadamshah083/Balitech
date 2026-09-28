import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import GoogleAnalytics from "@/components/seo/GoogleAnalytics";
import GoogleTagManager, {
  GoogleTagManagerNoScript,
} from "@/components/seo/GoogleTagManager";
import { GOOGLE_SITE_VERIFICATION } from "@/lib/analytics";
import ScrollToTopOnNavigate from "@/components/ScrollToTopOnNavigate";
import { companyContent } from "@/lib/content";
import { fallbackOffices } from "@/lib/fallback-offices";
import {
  DEFAULT_OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_LEGAL_NAME,
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";
import "./globals.css";

/* Manrope for body copy, Sora for headings and numerals. Both are variable
   fonts, so one Latin file each covers every weight the stylesheet uses, and
   the loader's metric-matched fallbacks keep lines from reflowing on swap.
   Not preloaded: on a slow connection their 57 KB queued ahead of the intro
   script face below, which is the home page's LCP resource. */
const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  preload: false,
});

const displayFont = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  preload: false,
});

/* Script face, used only for the intro animation — which happens to be the
   largest thing the home page ever paints, so this face is the page's
   largest-contentful-paint resource. Preloaded for exactly that reason: left to
   be discovered from the stylesheet it arrived a round trip later, and since
   `swap` paints the words in the fallback first, LCP landed on the repaint
   rather than on the first paint.

   Served from `public/fonts` rather than through the Google loader because it
   is subset to the twenty characters of HERO_INTRO_WORDMARK — 3.7 KB against
   28.9 KB for the full Latin range. `npm run optimize:media` cuts it; the
   master is in `media-src`. `adjustFontFallback` regenerates the Arial metric
   overrides the Google loader used to emit, which is what keeps the fallback
   from shifting the line as the real face swaps in. */
const scriptFont = localFont({
  src: "../../public/fonts/great-vibes-intro.woff2",
  weight: "400",
  variable: "--font-script",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Professional BPO & Call Center Services in Pakistan`,
    template: `%s | ${SITE_LEGAL_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_LEGAL_NAME, url: SITE_URL }],
  creator: SITE_LEGAL_NAME,
  publisher: SITE_LEGAL_NAME,
  category: "Business",
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    google: GOOGLE_SITE_VERIFICATION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_LEGAL_NAME,
    title: `${SITE_NAME} | Professional BPO & Call Center Services in Pakistan`,
    description: SITE_DESCRIPTION,
    locale: SITE_LOCALE,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — ${companyContent.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Professional BPO & Call Center Services`,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  /* `src/app/favicon.ico` and `src/app/icon.png` emit their own links;
     declaring /favicon.ico here as well made browsers fetch it twice. */
  icons: {
    apple: "/bali-tech-logo.png",
  },
};

function buildJsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_LEGAL_NAME,
    alternateName: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
    description: SITE_DESCRIPTION,
    slogan: companyContent.tagline,
    foundingDate: "2022-04",
    email: "hr@balitech.org",
    telephone: "+92 370 0585660",
    address: fallbackOffices.map((office) => ({
      "@type": "PostalAddress",
      streetAddress: office.address,
      addressLocality: office.city ?? "Rawalpindi",
      addressCountry: office.country,
    })),
    sameAs: [
      "https://www.instagram.com/balitech.commercial/",
      "https://www.facebook.com/balitech.commercial/",
      "https://www.tiktok.com/@balitech.commercial",
      "https://www.instagram.com/balitechpvt.ltd/",
      "https://www.facebook.com/Balitechpvt.ltd",
      "https://www.tiktok.com/@balitech.pvt.ltd",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+92 370 0585660",
        contactType: "customer service",
        areaServed: "PK",
        availableLanguage: ["English", "Urdu"],
      },
      {
        "@type": "ContactPoint",
        telephone: "+92 327 1233435",
        contactType: "sales",
        areaServed: "PK",
        availableLanguage: ["English", "Urdu"],
      },
    ],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_LEGAL_NAME,
    url: SITE_URL,
    inLanguage: "en",
    publisher: {
      "@type": "Organization",
      name: SITE_LEGAL_NAME,
    },
  };

  return [organization, website];
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = buildJsonLd();

  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable} ${scriptFont.variable} h-full antialiased`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <body
        className="min-h-full bg-background text-foreground transition-colors duration-300"
        suppressHydrationWarning
      >
        <GoogleTagManagerNoScript />
        {jsonLd.map((entry, index) => (
          <script
            key={`ld-${index}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
          />
        ))}
        <GoogleTagManager />
        <GoogleAnalytics />
        <ScrollToTopOnNavigate />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
