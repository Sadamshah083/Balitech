import type { Metadata } from "next";

export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://balitech.org";

export const SITE_NAME = "BALITECH";
export const SITE_LEGAL_NAME = "Bali Tech Pvt. Ltd";
export const SITE_LOCALE = "en_US";

export const DEFAULT_OG_IMAGE = "/bali-tech-logo.png";

export const DEFAULT_KEYWORDS = [
  "BALITECH",
  "Bali Tech",
  "Bali Tech Pvt. Ltd",
  "BPO Pakistan",
  "Call center Pakistan",
  "Outsourcing services Pakistan",
  "Customer support Rawalpindi",
  "BPO Rawalpindi",
  "BPO Islamabad",
  "Call center Islamabad",
  "Jobs in Rawalpindi",
  "Jobs in Islamabad",
  "Call center jobs",
  "BPO careers",
];

type PageSeoInput = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  image?: string;
};

export function pageMetadata({
  title,
  description,
  path = "/",
  keywords = [],
  image = DEFAULT_OG_IMAGE,
}: PageSeoInput): Metadata {
  const url = `${SITE_URL}${path === "/" ? "" : path}`;
  const fullTitle = title.includes(SITE_NAME)
    ? title
    : `${title} | ${SITE_NAME}`;

  return {
    title: fullTitle,
    description,
    keywords: Array.from(new Set([...DEFAULT_KEYWORDS, ...keywords])),
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      url,
      siteName: SITE_LEGAL_NAME,
      title: fullTitle,
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
      title: fullTitle,
      description,
      images: [image],
    },
  };
}
