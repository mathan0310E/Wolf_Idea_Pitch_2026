import type { Metadata, Viewport } from "next";
import { Aleo, Host_Grotesk, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const displayFont = Aleo({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-display",
});

const bodyFont = Host_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

const serifFont = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#000000" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://wolf-idea-pitch-2026.vercel.app"
  ),
  applicationName: "WOLF IDEA PITCH 2026",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WOLF IDEA PITCH 2026",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.webmanifest",
  title: "CYBERWOLF PRESENTS — WOLF IDEA PITCH 2026",
  description:
    "Official event registration and portal for WOLF IDEA PITCH 2026 by CyberWolf on 09 October 2026. LEARN • SECURE • BUILD.",
  keywords: ["WOLF IDEA PITCH 2026", "CyberWolf", "Hackathon", "Cybersecurity", "Idea Pitch"],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "CYBERWOLF PRESENTS — WOLF IDEA PITCH 2026",
    description:
      "WOLF IDEA PITCH 2026 by CyberWolf on 09 October 2026. LEARN • SECURE • BUILD. Register your team now.",
    url: "/",
    siteName: "WOLF IDEA PITCH 2026",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "WOLF IDEA PITCH 2026 — CyberWolf" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CYBERWOLF PRESENTS — WOLF IDEA PITCH 2026",
    description:
      "WOLF IDEA PITCH 2026 by CyberWolf on 09 October 2026. LEARN • SECURE • BUILD.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} ${serifFont.variable} ${monoFont.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0A0A0A] text-white font-sans selection:bg-[#E50914] selection:text-white">
        {children}
      </body>
    </html>
  );
}
