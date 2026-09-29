import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Page not found — WOLF IDEA PITCH 2026",
  description: "This page does not exist.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/10 bg-[#151515]">
          <p className="text-xs font-mono text-[#E50914] tracking-widest">404</p>
          <h1 className="font-display text-3xl font-extrabold">
            PAGE NOT <span className="text-[#E50914]">FOUND</span>
          </h1>
          <p className="text-sm text-zinc-400">
            That address is not on this site. It is not indexed.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-[#E50914] hover:bg-[#C10712] text-white font-bold text-xs uppercase tracking-wider"
            >
              Back to Home
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-2.5 border border-white/30 text-white font-bold text-xs uppercase tracking-wider hover:bg-white/10"
            >
              Contact
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
