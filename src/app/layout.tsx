import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { PWAInstaller } from "@/components/app/pwa-installer";
import { DarkModeProvider } from "@/components/app/dark-mode-provider";
import { LanguageProvider } from "@/contexts/language-context";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const plusJakarta = Plus_Jakarta_Sans({
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

export const metadata: Metadata = {
  title: "JANIBEAR - Janitorial Quality Inspection",
  description: "Mobile-first janitorial quality inspection and task management SaaS",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JANIBEAR",
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
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="JANIBEAR" />
      </head>
      <body className={`${inter.variable} ${plusJakarta.variable} ${inter.className} font-sans`}>
        <LanguageProvider>
          <DarkModeProvider>
            {children}
            <Toaster />
            <PWAInstaller />
          </DarkModeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
