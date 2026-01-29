import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { PWAInstaller } from "@/components/app/pwa-installer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Janibear - Janitorial Quality Inspection",
  description: "Mobile-first janitorial quality inspection and task management SaaS",
  manifest: "/manifest.json",
  themeColor: "#3b82f6",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Janibear",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Janibear" />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster />
        <PWAInstaller />
      </body>
    </html>
  );
}
