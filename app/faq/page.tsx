"use client";

import * as React from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FaqPage() {
  const [openFaq, setOpenFaq] = React.useState<number | null>(0);

  const faqs = [
    {
      q: "What is WOLF IDEATHON 2026?",
      a: "WOLF IDEATHON 2026 is an upcoming cybersecurity and technology ideathon organized by CyberWolf on 09 October 2026. Participants innovate, design, and present solutions around the core pillars: LEARN, SECURE, BUILD.",
    },
    {
      q: "Who can participate?",
      a: "Students from any college, university, or technical institution can register individually or in teams of up to 4 members (Individual: 1, Duo: 2, Square: 4).",
    },
    {
      q: "What is the registration fee model?",
      a: "Registration is ₹300 per participant. Individual (1 member): ₹300, Duo (2 members): ₹600, Square (4 members): ₹1,200. Fees are verified automatically server-side.",
    },
    {
      q: "How does payment verification work?",
      a: "You pay via UPI using the generated UPI Intent or QR Code. Submit your UTR/Transaction ID and payment screenshot. The CyberWolf team manually verifies each submission before issuing confirmed registration.",
    },
    {
      q: "How do I check my registration status?",
      a: "Upon submitting your registration, you will receive a unique Registration ID (e.g., WOLF-2026-00001) along with a private Lookup Token. Enter both on the '/status' page anytime.",
    },
    {
      q: "Can team members be modified after submission?",
      a: "No. All team details are locked upon submission. If corrections are required, contact support before verification.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <main className="flex-1 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#1E1E1E] text-xs font-mono text-[#E50914] border border-white/10">
              HELP & FAQ
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white">
              FREQUENTLY ASKED <span className="text-[#E50914]">QUESTIONS</span>
            </h1>
            <p className="text-zinc-400 text-sm max-w-2xl mx-auto">
              Everything you need to know about WOLF IDEATHON 2026.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-[#151515] border border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-display font-bold text-base text-white hover:text-[#E50914] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-zinc-400 transition-transform duration-200",
                      openFaq === idx && "transform rotate-180 text-[#E50914]"
                    )}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-6 text-sm text-zinc-400 leading-relaxed border-t border-white/5 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
