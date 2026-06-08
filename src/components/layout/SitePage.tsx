"use client";

import { useEffect } from "react";
import LightningAtmosphere from "@/components/animations/LightningAtmosphere";
import ParallelPageLines from "@/components/animations/ParallelPageLines";
import SiteHeader from "@/components/landing/SiteHeader";
import Footer from "@/components/landing/Footer";
import { registerGsap } from "@/lib/gsap-register";

export default function SitePage({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    registerGsap();
  }, []);

  return (
    <main className="site-main relative min-h-screen overflow-x-hidden bg-background">
      <LightningAtmosphere />
      <SiteHeader />
      <ParallelPageLines>{children}</ParallelPageLines>
      <Footer />
    </main>
  );
}
