import type { Metadata } from "next";
import { Geist, Great_Vibes } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { companyContent } from "@/lib/content";
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

export const metadata: Metadata = {
  title: "BALITECH | Professional Outsourcing",
  description: `BALITECH — ${companyContent.workforce.count} ${companyContent.workforce.label.toLowerCase()} nationwide, dedicated to operational excellence, employee development, and high-quality client services.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
