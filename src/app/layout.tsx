import type { Metadata } from "next";
import { Geist, Great_Vibes } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { companyContent } from "@/lib/content";
import { fallbackOffices } from "@/lib/fallback-offices";
import {
  DEFAULT_KEYWORDS,
  DEFAULT_OG_IMAGE,
  SITE_LEGAL_NAME,
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const greatVibes = Great_Vibes({
  weight: "400",
  variable: "--font-great-vibes",
  subsets: ["latin"],
});

const SITE_DESCRIPTION = `${SITE_NAME} — ${companyContent.workforce.count} ${companyContent.workforce.label.toLowerCase()} nationwide. A rapidly growing BPO organization delivering high-quality client services, operational excellence, and career growth opportunities across Rawalpindi and Islamabad.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Professional BPO & Call Center Services in Pakistan`,
    template: `%s | ${SITE_LEGAL_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: DEFAULT_KEYWORDS,
  authors: [{ name: SITE_LEGAL_NAME, url: SITE_URL }],
  creator: SITE_LEGAL_NAME,
  publisher: SITE_LEGAL_NAME,
  category: "Business",
  alternates: {
    canonical: SITE_URL,
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
  icons: {
    icon: "/favicon.ico",
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
      className={`${geistSans.variable} ${greatVibes.variable} h-full antialiased`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <body
        className="min-h-full bg-background text-foreground transition-colors duration-300"
        suppressHydrationWarning
      >
        {jsonLd.map((entry, index) => (
          <script
            key={`ld-${index}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
          />
        ))}
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
