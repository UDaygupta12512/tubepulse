import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: "TubePulse | AI YouTube Analytics & Growth",
  description: "Elite AI-powered YouTube analytics, A/B thumbnail simulator, keyword research, and director's cut script generator.",
  openGraph: {
    title: "TubePulse | AI YouTube Analytics",
    description: "Elite AI-powered YouTube tools for creators.",
    url: "https://tubepulse.com",
    siteName: "TubePulse",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TubePulse | AI YouTube Analytics",
    description: "Elite AI-powered YouTube tools for creators.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
