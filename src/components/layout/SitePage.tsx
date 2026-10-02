import SiteHeader from "@/components/landing/SiteHeader";
import Footer from "@/components/landing/Footer";
import DeferredScrollAtmosphere from "@/components/effects/DeferredScrollAtmosphere";

export default function SitePage({
  children,
  indexTheme = false,
}: {
  children: React.ReactNode;
  indexTheme?: boolean;
}) {
  return (
    <main
      className={`site-main relative min-h-screen overflow-x-clip bg-background${indexTheme ? " site-main--index" : ""}`}
    >
      <DeferredScrollAtmosphere />
      <SiteHeader />
      {children}
      <Footer />
    </main>
  );
}
