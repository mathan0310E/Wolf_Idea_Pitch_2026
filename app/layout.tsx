import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "CYBERWOLF PRESENTS — WOLF IDEATHON 2026",
  description:
    "Official event registration and portal for WOLF IDEATHON 2026 by CyberWolf on 09 October 2026. LEARN • SECURE • BUILD.",
  keywords: ["WOLF IDEATHON 2026", "CyberWolf", "Hackathon", "Cybersecurity", "Ideathon"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0A0A0A] text-white font-sans selection:bg-[#E50914] selection:text-white">
        {children}
      </body>
    </html>
  );
}
