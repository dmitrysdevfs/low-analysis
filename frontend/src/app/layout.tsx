import type { Metadata } from "next";
import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Cormorant_Garamond, Inter, JetBrains_Mono } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import Header from "@/layout/Header/Header";
import Footer from "@/layout/Footer/Footer";
import { FooterStats } from "@/layout/Footer/FooterStats";
import { BackendWarmup } from "@/components/layout/BackendWarmup";
import { ScrollRestore } from "@/components/layout/ScrollRestore";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { RouteAccessGate } from "@/components/auth/RouteAccessGate";
import { BillingProvider } from "@/components/billing/BillingProvider";
import { GuestLimitsProvider } from "@/components/guest/GuestLimitsProvider";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { AppQueryProvider } from "@/providers/AppQueryProvider";
import { AiAssistant } from "@/components/ai/AiAssistant";
import { AssistantProvider } from "@/features/assistant";
import { SupportChatWidget } from "@/features/support";
import { SidebarDataProvider } from "@/components/layout/SidebarDataContext";
import { ApiMetricsTracker } from "@/components/layout/ApiMetricsTracker";
import { UserActivityTracker } from "@/components/layout/UserActivityTracker";

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
        <AppQueryProvider>
          <ErrorBoundary>
            <AuthProvider>
              <BillingProvider>
                <GuestLimitsProvider>
                  <AssistantProvider>
                    <SidebarDataProvider>
                      <div className="site-shell">
                        <ApiMetricsTracker />
                        <UserActivityTracker />
                        <BackendWarmup />
                        <ScrollRestore />
                        <Header />
                        <div className="site-content">
                          <RouteAccessGate>{children}</RouteAccessGate>
                        </div>
                        <AiAssistant />
                        <SupportChatWidget />
                        <FooterStats />
                        <Footer />
                      </div>
                    </SidebarDataProvider>
                  </AssistantProvider>
                </GuestLimitsProvider>
              </BillingProvider>
            </AuthProvider>
          </ErrorBoundary>
        </AppQueryProvider>
        <ToastContainer />
        <Script
          id="ms-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","x42vvdj1l2");`,
          }}
        />
      </body>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!} />
    </html>
  );
}
