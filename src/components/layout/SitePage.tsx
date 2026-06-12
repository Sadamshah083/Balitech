"use client";

import { useEffect } from "react";
import SiteHeader from "@/components/landing/SiteHeader";
import Footer from "@/components/landing/Footer";
import { registerGsap } from "@/lib/gsap-register";

export default function SitePage({
  children,
  indexTheme = false,
}: {
  children: React.ReactNode;
  indexTheme?: boolean;
}) {
  useEffect(() => {
    registerGsap();
  }, []);

  return (
    <main
      className={`site-main relative min-h-screen overflow-x-hidden bg-background${indexTheme ? " site-main--index" : ""}`}
    >
      <SiteHeader />
      {children}
      <Footer />
    </main>
  );
}
