import type { Metadata, Viewport } from "next";
import { Aleo, Host_Grotesk, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { CookieNotice } from "@/components/cookie-notice";
import { PointerMotion } from "@/components/pointer-motion";
import { ScrollProgress } from "@/components/scroll-progress";
import "./globals.css";

const displayFont = Aleo({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-aleo",
  display: "swap",
});

const bodyFont = Host_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-host",
  display: "swap",
});

const serifFont = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-jetbrains",
  display: "swap",
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
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
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
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${displayFont.variable} ${bodyFont.variable} ${serifFont.variable} ${monoFont.variable} dark h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-[#0A0A0A] text-white font-sans selection:bg-[#E50914] selection:text-white"
      >
        {/* Enable the motion styles on <html> before first paint so entrance
            animations can never cause a flash of fully-visible content that
            then jumps back to hidden. Use a <template> wrapper because React
            doesn't execute <script> tags inside components on the client —
            Next.js logs a dev-only notice for this, absent in production. */}
        <template
          dangerouslySetInnerHTML={{
            __html:
              `<script>try{if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.setAttribute('data-motion','on')}}catch(e){}<\/script>`,
          }}
        />
        {/* Reading-progress bar. Global so every route gets it; renders as an
            empty aria-hidden div that JS animates via transform: scaleX(). */}
        <ScrollProgress />
        {/* Single delegated pointer engine driving .spotlight / .tilt /
            .magnetic everywhere. Renders nothing — it only publishes CSS
            custom properties for surfaces already on the page. */}
        <PointerMotion />
        {children}
        <CookieNotice />
      </body>
    </html>
  );
}
