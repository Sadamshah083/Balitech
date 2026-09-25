import SiteHeader from "@/components/landing/SiteHeader";
import Footer from "@/components/landing/Footer";
import ScrollAtmosphere from "@/components/effects/ScrollAtmosphere";

export default function SitePage({
  children,
  indexTheme = false,
}: {
  children: React.ReactNode;
  indexTheme?: boolean;
}) {
  return (
    <main
      className={`site-main relative min-h-screen overflow-x-hidden bg-background${indexTheme ? " site-main--index" : ""}`}
    >
      <ScrollAtmosphere />
      <SiteHeader />
      {children}
      <Footer />
    </main>
  );
}
