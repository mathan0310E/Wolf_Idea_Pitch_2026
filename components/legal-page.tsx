import type { ReactNode } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export function LegalPage({
  eyebrow,
  title,
  accent,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  accent: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <main className="flex-1 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="space-y-4">
            <p className="inline-flex items-center px-3 py-1 rounded-md bg-[#1E1E1E] text-xs font-mono text-[#E50914] border border-white/10">
              {eyebrow}
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white">
              {title} <span className="text-[#E50914]">{accent}</span>
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">{lede}</p>
          </div>
          <div className="space-y-8 text-sm text-zinc-300 leading-relaxed">{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 p-6 sm:p-8 rounded-xl bg-[#151515] border border-white/10">
      <h2 className="font-display text-xl font-bold text-white">{heading}</h2>
      {children}
    </section>
  );
}
