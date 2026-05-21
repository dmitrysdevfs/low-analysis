import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, JetBrains_Mono } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import Header from "@/layout/Header/Header";
import Footer from "@/layout/Footer/Footer";
import { BackendWarmup } from "@/components/BackendWarmup";
import { ScrollRestore } from "@/components/ScrollRestore";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { RouteAccessGate } from "@/components/auth/RouteAccessGate";
import { BillingProvider } from "@/components/billing/BillingProvider";
import { GuestLimitsProvider } from "@/components/guest/GuestLimitsProvider";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { AiAssistant } from "@/components/AiAssistant";

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

export const metadata: Metadata = {
  title: "Law Analysis",
  description:
    "Platform for structuring, exploring, and analyzing Ukrainian legislation.",
  icons: {
    icon: "/favicon/favicon.ico",
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
                <div className="site-shell">
                  <BackendWarmup />
                  <ScrollRestore />
                  <Header />
                  <div className="site-content">
                    <RouteAccessGate>{children}</RouteAccessGate>
                  </div>
                  <AiAssistant />
                  <Footer />
                </div>
              </GuestLimitsProvider>
            </BillingProvider>
          </AuthProvider>
        </ErrorBoundary>
        <ToastContainer />
      </body>
    </html>
  );
}
