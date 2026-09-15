import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Okwin Pakistan - Electronic Slots, Aviator, Mines & Cricket Platform",
  description: "Play Aviator, Mines, Crazy 777 Slots and earn instant agent referral commissions with EasyPaisa, JazzCash, and USDT on Okwin.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Okwin",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#141414",
};

import { AppShell } from "@/components/layout/AppShell";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-[#080808]">
      <body className="min-h-screen bg-[#080808] text-white antialiased flex justify-center selection:bg-jjwin-primary selection:text-black">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
