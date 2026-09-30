import type { Metadata } from "next";

export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://balitech.org";

export const SITE_NAME = "BALITECH";
export const SITE_LEGAL_NAME = "Bali Tech Pvt. Ltd";
export const SITE_LOCALE = "en_US";

export const DEFAULT_OG_IMAGE = "/bali-tech-logo.png";

/* Google shows roughly 155 characters of a description before truncating. */
export const SITE_DESCRIPTION =
  "BALITECH is a BPO and call center company in Rawalpindi and Islamabad, Pakistan, running inbound, outbound, lead generation and customer support teams.";

/* No `keywords` meta: search engines have ignored it for years, and one list
   repeated on every page only added weight to each document. */
type PageSeoInput = {
  title: string;
  description: string;
  path?: string;
  image?: string;
};

export function pageMetadata({
  title,
  description,
  path = "/",
  image = DEFAULT_OG_IMAGE,
}: PageSeoInput): Metadata {
  const url = `${SITE_URL}${path === "/" ? "" : path}`;

  /* The root layout's title template already appends the legal name, so the
     page title stays bare — adding the brand here produced titles reading
     "… | BALITECH | Bali Tech Pvt. Ltd", which is both redundant and long
     enough for Google to truncate. Social cards do not run through the
     template, so those get the brand explicitly. */
  const socialTitle = title.includes(SITE_NAME)
    ? title
    : `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      url,
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      locale: SITE_LOCALE,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [image],
    },
  };
}

/**
 * Breadcrumb trail for a page one level below the home page.
 *
 * Search engines use this for the path shown under a result instead of the raw
 * URL, so every top-level page declares one.
 */
export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...trail].map(
      (entry, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: entry.name,
        item: `${SITE_URL}${entry.path === "/" ? "" : entry.path}`,
      })
    ),
  };
}

/** Question/answer pairs, eligible for the FAQ rich result. */
export function faqSchema(items: readonly { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/**
 * A single outsourcing line offered by the company. Emitted per service so the
 * scope of the business is machine-readable rather than only in prose.
 */
export function serviceSchema(items: readonly { title: string; text: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Service",
        name: item.title,
        description: item.text,
        serviceType: item.title,
        provider: { "@type": "Organization", name: SITE_LEGAL_NAME, url: SITE_URL },
        areaServed: [
          { "@type": "Country", name: "United States" },
          { "@type": "Country", name: "Pakistan" },
        ],
      },
    })),
  };
}
