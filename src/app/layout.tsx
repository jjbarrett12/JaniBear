import type { Metadata, Viewport } from "next";
import { Inter_Tight, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { PWAInstaller } from "@/components/app/pwa-installer";
import { DarkModeProvider } from "@/components/app/dark-mode-provider";
import { LanguageProvider } from "@/contexts/language-context";
import { Footer } from "@/components/site/Footer";

const sourceSans = Source_Sans_3({ subsets: ["latin"], variable: "--font-sans" });
const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-heading",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#3b82f6",
};

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://janibear.com";

const appTitle = "JANIBEAR | The Cleaning Company OS";

export const metadata: Metadata = {
  title: appTitle,
  description: "AI software for janitorial sales and operations. Bidding, inspections, quality proof, and automation built for serious cleaning companies.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: appTitle,
    description: "AI software for janitorial sales and operations. Bidding, inspections, quality proof, and automation built for serious cleaning companies.",
    url: siteUrl,
    siteName: "JANIBEAR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: appTitle,
    description: "AI software for janitorial sales and operations. Bidding, inspections, quality proof, and automation built for serious cleaning companies.",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: appTitle,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="JANIBEAR | The Cleaning Company OS" />
      </head>
      <body className={`${sourceSans.variable} ${interTight.variable} ${sourceSans.className} font-sans`}>
        <LanguageProvider>
          <DarkModeProvider>
            {children}
            <Footer />
            <Toaster />
            <PWAInstaller />
          </DarkModeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
