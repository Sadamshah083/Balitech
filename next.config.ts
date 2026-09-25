import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2560],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 90, 93, 95, 98],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // The previous PHP site is still indexed and serves stale contact details.
  async redirects() {
    return [
      { source: "/contact.php", destination: "/our-offices", permanent: true },
      { source: "/contact", destination: "/our-offices", permanent: true },
      { source: "/index.php", destination: "/", permanent: true },
      { source: "/home.php", destination: "/", permanent: true },
      { source: "/about.php", destination: "/about", permanent: true },
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/services.php", destination: "/services", permanent: true },
      { source: "/service.php", destination: "/services", permanent: true },
      { source: "/career.php", destination: "/join-us", permanent: true },
      { source: "/careers.php", destination: "/join-us", permanent: true },
      { source: "/careers", destination: "/join-us", permanent: true },
      { source: "/gallery.php", destination: "/gallery", permanent: true },
      { source: "/team.php", destination: "/our-team", permanent: true },
      { source: "/blog.php", destination: "/blog", permanent: true },
      { source: "/insights", destination: "/blog", permanent: true },
      { source: "/ceo", destination: "/ceo-words", permanent: true },
      { source: "/leadership", destination: "/ceo-words", permanent: true },
    ];
  },
};

export default nextConfig;
