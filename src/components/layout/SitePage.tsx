"use client";

import { useEffect, useState } from "react";
import LightningAtmosphere from "@/components/animations/LightningAtmosphere";
import ParallelPageLines from "@/components/animations/ParallelPageLines";
import SiteHeader from "@/components/landing/SiteHeader";
import HeroMenu from "@/components/landing/HeroMenu";
import Footer from "@/components/landing/Footer";
import { registerGsap } from "@/lib/gsap-register";

export default function SitePage({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    registerGsap();
  }, []);

  return (
    <main className="site-main relative min-h-screen overflow-x-hidden bg-background">
      <LightningAtmosphere />
      <SiteHeader onMenuOpen={() => setMenuOpen(true)} />
      <HeroMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <ParallelPageLines>{children}</ParallelPageLines>
      <Footer />
    </main>
  );
}
