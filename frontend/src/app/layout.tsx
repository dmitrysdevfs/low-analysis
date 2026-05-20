import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, JetBrains_Mono } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import Header from "@/layout/Header/Header";
import Footer from "@/layout/Footer/Footer";
import { BackendWarmup } from "@/components/layout/BackendWarmup";
import { ScrollRestore } from "@/components/layout/ScrollRestore";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { RouteAccessGate } from "@/components/auth/RouteAccessGate";
import { BillingProvider } from "@/components/billing/BillingProvider";
import { GuestLimitsProvider } from "@/components/guest/GuestLimitsProvider";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { SidebarDataProvider } from "@/components/layout/SidebarDataContext";

const display = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const body = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  weight: ["400", "500", "700"],
});

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://low-analysis.onrender.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Law Analysis — Аналіз законодавства України",
    template: "%s · Law Analysis",
  },
  description:
    "Платформа для структурування, перегляду та аналізу законодавства України. Конституція, кодекси, закони — у зручному ієрархічному форматі.",
  keywords: [
    "закони України",
    "законодавство",
    "Конституція України",
    "правовий аналіз",
    "нормативно-правові акти",
    "кодекс",
    "статті закону",
  ],
  openGraph: {
    type: "website",
    locale: "uk_UA",
    siteName: "Law Analysis",
    title: "Law Analysis — Аналіз законодавства України",
    description:
      "Платформа для структурування, перегляду та аналізу законодавства України.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Law Analysis — Аналіз законодавства України",
    description:
      "Платформа для структурування, перегляду та аналізу законодавства України.",
  },
  icons: {
    icon: "/favicon/favicon.ico",
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uk"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ErrorBoundary>
          <AuthProvider>
            <BillingProvider>
              <GuestLimitsProvider>
                <SidebarDataProvider>
                <div className="site-shell">
                  <BackendWarmup />
                  <ScrollRestore />
                  <Header />
                  <div className="site-content">
                    <RouteAccessGate>{children}</RouteAccessGate>
                  </div>
                  <Footer />
                </div>
                </SidebarDataProvider>
              </GuestLimitsProvider>
            </BillingProvider>
          </AuthProvider>
        </ErrorBoundary>
        <ToastContainer />
      </body>
    </html>
  );
}
