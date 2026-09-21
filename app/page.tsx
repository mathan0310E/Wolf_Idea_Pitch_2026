"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Shield,
  Calendar,
  Users,
  Award,
  Lock,
  Zap,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { ClipButton } from "@/components/clip-button";
import { CountdownTimer } from "@/components/countdown-timer";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { event, teamTypes, formatINR } from "@/config/event";
import { cn } from "@/lib/utils";

export default function Home() {
  const [openFaq, setOpenFaq] = React.useState<number | null>(0);

  const faqs = [
    {
      q: "What is WOLF IDEA PITCH 2026?",
      a: "WOLF IDEA PITCH 2026 is an upcoming cybersecurity and technology idea pitch organized by Cyber Wolf on 09 October 2026. Participants innovate, design, and present solutions around the core pillars: LEARN, SECURE, BUILD.",
    },
    {
      q: "Who can participate?",
      a: "Students from any college, university, or technical institution can register individually or in teams of up to 4 members (Solo: 1, Duo: 2, Squad: 4).",
    },
    {
      q: "What is the registration fee model?",
      a: "Registration is ₹300 per participant. Solo (1 member): ₹300, Duo (2 members): ₹600, Squad (4 members): ₹1,200. Fees are verified automatically server-side.",
    },
    {
      q: "How does payment verification work?",
      a: "You pay via UPI using the generated UPI Intent or QR Code. Submit your UTR/Transaction ID and payment screenshot. The Cyber Wolf team manually verifies each submission before issuing confirmed registration.",
    },
    {
      q: "How do I check my registration status?",
      a: "Upon submitting your registration, you will receive a unique Registration ID (e.g., WOLF-2026-00001) along with a private Lookup Token. Enter both on the '/status' page anytime.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#000000] text-white">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION — CYBERWOLF 360 STYLE */}
        <section className="relative overflow-hidden bg-black text-white border-b border-white/10">
          {/* Background image */}
          <Image
            src="/bg.png"
            alt=""
            fill
            priority
            sizes="100vw"
            quality={75}
            className="object-cover object-center opacity-70"
            style={{ objectPosition: "center top" }}
          />
          <div className="absolute inset-0 bg-black/60 pointer-events-none" />

          <div className="absolute inset-0 bg-grid-cyberwolf opacity-30 pointer-events-none" />

          {/* Background glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-[#FF0007]/10 blur-[140px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20 sm:py-28 md:py-36">
            <div className="max-w-3xl text-center lg:text-left space-y-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/70 flex items-center justify-center lg:justify-start gap-2">
                <span className="h-1.5 w-1.5 shrink-0 bg-[#FF0007]" />
                CYBER WOLF PRESENTS
              </p>

              <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05]">
                WOLF IDEA PITCH <span className="text-[#FF0007]">2026</span>
              </h1>

              <p className="font-display text-xl sm:text-2xl font-bold tracking-[0.18em] text-white/90 uppercase">
                {event.tagline.split(" • ").map((word, i, { length }) => (
                  <span
                    key={word}
                    className={i === length - 1 ? "font-serif italic font-normal normal-case text-[#FF0007]" : undefined}
                  >
                    {word}
                    {i !== length - 1 && <span className="mx-1.5 opacity-50">•</span>}
                  </span>
                ))}
              </p>

              <p className="text-base sm:text-lg leading-relaxed text-white/80 max-w-2xl">
                The flagship cybersecurity & innovation idea pitch by Cyber Wolf. Build resilient architectures, tackle real-world vulnerability challenges, and pitch to industry experts on 09 October 2026.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3">
                <ClipButton
                  href="/register"
                  size="lg"
                  className="min-h-12 sm:min-h-14"
                >
                  <span>Register Your Team</span>
                  <ArrowRight className="w-4 h-4" />
                </ClipButton>

                <Link
                  href="/status"
                  className="inline-flex min-h-12 items-center justify-center rounded-none border border-white/40 bg-transparent px-5 sm:px-8 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] sm:tracking-[0.18em] text-white transition hover:border-white hover:bg-white/10 text-center whitespace-normal"
                >
                  <span>Check Registration Status</span>
                </Link>
              </div>

              {/* LIVE COUNTDOWN */}
              <div className="mt-8 sm:mt-10 flex flex-col items-center lg:items-start gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/70 flex items-center justify-center lg:justify-start gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF0007] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF0007]" />
                  </span>
                  HACKATHON LAUNCH COUNTDOWN
                </p>
                <CountdownTimer targetDate={event.date} />
              </div>
            </div>
          </div>

          {/* TRUST/STATS BAR */}
          <div className="relative z-10 border-t border-white/10 bg-black/90 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-center text-sm text-white/85 sm:text-left">
                Organized by Cyber Wolf — Cybersecurity, VAPT & Technical Community.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/80">
                <span><span className="font-semibold text-white">09 Oct 2026</span> Event Date</span>
                <span className="hidden h-3 w-px bg-white/25 sm:inline-block" aria-hidden="true" />
                <span><span className="font-semibold text-[#FF0007]">₹300</span> Fee / Participant</span>
                <span className="hidden h-3 w-px bg-white/25 md:inline-block" aria-hidden="true" />
                <span className="hidden md:inline"><span className="font-semibold text-white">100%</span> Manual Verification</span>
              </div>
            </div>
          </div>
        </section>

        {/* EVENT HIGHLIGHTS */}
        <section className="py-16 sm:py-20 border-b border-white/10 bg-[#0F0F0F]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card variant="hover">
                <CardHeader>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF0007]">01. FEE MODEL</span>
                  <CardTitle className="text-3xl font-extrabold text-[#FF0007]">₹300</CardTitle>
                  <CardDescription className="text-white/80 font-medium">Flat Fee Per Participant</CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-white/60">
                  Solo (₹300), Duo (₹600), Squad (₹1,200). Enforced server-side.
                </CardContent>
              </Card>

              <Card variant="hover">
                <CardHeader>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF0007]">02. TEAM TYPES</span>
                  <CardTitle className="text-3xl font-extrabold text-[#FF0007]">1 – 4</CardTitle>
                  <CardDescription className="text-white/80 font-medium">Members Per Team</CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-white/60">
                  Flexible participation: Solo, Duo of 2, or Squad of 4 members.
                </CardContent>
              </Card>

              <Card variant="hover">
                <CardHeader>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF0007]">03. EVENT DATE</span>
                  <CardTitle className="text-3xl font-extrabold text-[#FF0007]">09 OCT</CardTitle>
                  <CardDescription className="text-white/80 font-medium">Event Date 2026</CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-white/60">
                  Save the date for Cyber Wolf&apos;s annual flagship idea pitch.
                </CardContent>
              </Card>

              <Card variant="hover">
                <CardHeader>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF0007]">04. SECURITY</span>
                  <CardTitle className="text-3xl font-extrabold text-[#FF0007]">VERIFIED</CardTitle>
                  <CardDescription className="text-white/80 font-medium">Audit-Logged Admin Verification</CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-white/60">
                  Manual admin verification for all UPI submissions with live token lookup.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CORE PILLARS: LEARN • SECURE • BUILD */}
        <section className="py-20 sm:py-24 border-b border-white/10 bg-[#000000]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">
                <span className="h-1.5 w-1.5 shrink-0 bg-[#FF0007]" />
                CORE PILLARS
              </p>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                LEARN • SECURE • <span className="text-[#FF0007]">BUILD</span>
              </h2>
              <p className="mt-4 text-base text-white/70">
                WOLF IDEA PITCH 2026 is designed to challenge security researchers, developers, and innovators across three core engineering disciplines.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card variant="hover">
                <CardHeader>
                  <div className="w-12 h-12 bg-[#FF0007]/10 border border-[#FF0007]/30 flex items-center justify-center text-[#FF0007] mb-4">
                    <Zap className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF0007]">PILLAR 01</span>
                  <CardTitle className="text-2xl text-white">01. LEARN</CardTitle>
                  <CardDescription className="text-white/70">
                    Gain deep insights into modern vulnerability vectors, cloud misconfigurations, and threat landscape modeling.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card variant="hover">
                <CardHeader>
                  <div className="w-12 h-12 bg-[#FF0007]/10 border border-[#FF0007]/30 flex items-center justify-center text-[#FF0007] mb-4">
                    <Lock className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF0007]">PILLAR 02</span>
                  <CardTitle className="text-2xl text-white">02. SECURE</CardTitle>
                  <CardDescription className="text-white/70">
                    Architect zero-trust solutions, hardened APIs, and secure data pipeline protocols to defend critical systems.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card variant="hover">
                <CardHeader>
                  <div className="w-12 h-12 bg-[#FF0007]/10 border border-[#FF0007]/30 flex items-center justify-center text-[#FF0007] mb-4">
                    <Award className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF0007]">PILLAR 03</span>
                  <CardTitle className="text-2xl text-white">03. BUILD</CardTitle>
                  <CardDescription className="text-white/70">
                    Transform conceptual idea pitch proposals into functional prototypes and present them to Cyber Wolf mentors.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* CATEGORY & FEE MODEL */}
        <section className="py-20 sm:py-24 border-b border-white/10 bg-[#0F0F0F]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">
                <span className="h-1.5 w-1.5 shrink-0 bg-[#FF0007]" />
                REGISTRATION CATEGORIES
              </p>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
                TEAM TYPES & <span className="text-[#FF0007]">FEE MODEL</span>
              </h2>
              <p className="mt-4 text-base text-white/70">
                Fixed flat fee of ₹300 per participant across all categories.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {teamTypes.map((type) => (
                <Card key={type.id} variant="hover" className="flex flex-col justify-between">
                  <CardHeader>
                    <span className="inline-block px-3 py-1 bg-[#141414] border border-white/10 text-[10px] font-mono text-[#FF0007] w-fit mb-3 uppercase font-bold">
                      {type.memberCount} Participant{type.memberCount > 1 ? "s" : ""}
                    </span>
                    <CardTitle className="text-2xl">{type.label}</CardTitle>
                    <CardDescription>{type.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-4xl font-extrabold text-[#FF0007]">
                        {formatINR(type.memberCount * 300)}
                      </span>
                      <span className="text-xs text-white/60">total registration fee</span>
                    </div>
                    <ul className="space-y-2 text-xs text-white/80 pt-2 border-t border-white/10">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Every member submits full details</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>UPI QR & Intent payment support</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Live status lookup tracking</span>
                      </li>
                    </ul>
                  </CardContent>
                  <div className="p-6 pt-0 mt-4">
                    <Link
                      href={`/register?type=${type.id}`}
                      style={{ backgroundColor: "#FF0007" }}
                      className="w-full inline-flex h-11 items-center justify-center text-[10px] font-bold uppercase tracking-[0.14em] text-white transition hover:opacity-90"
                    >
                      Select {type.label} Category
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* VENUE SECTION */}
        <section className="py-20 sm:py-24 border-b border-white/10 bg-[#000000]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">
                  <span className="h-1.5 w-1.5 shrink-0 bg-[#FF0007]" />
                  LOCATION & VENUE
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
                  EVENT <span className="text-[#FF0007]">VENUE</span>
                </h2>
                <p className="text-white/70 text-sm leading-relaxed">
                  Join Cyber Wolf live at the official venue for WOLF IDEA PITCH 2026. High-speed networking, collaborative hacking labs, and presentation areas provided.
                </p>
                <div className="space-y-3 text-xs text-white/80">
                  <div className="p-4 bg-[#0F0F0F] border border-white/10">
                    <span className="font-bold text-white block">Venue Name:</span>
                    <span className="text-white/60 font-mono">{event.venue}</span>
                  </div>
                  <div className="p-4 bg-[#0F0F0F] border border-white/10">
                    <span className="font-bold text-white block">Full Address:</span>
                    <span className="text-white/60 font-mono">{event.venueAddress}</span>
                  </div>
                </div>
              </div>

              <div className="border border-white/10 bg-[#0F0F0F] overflow-hidden relative">
                <iframe
                  src={`https://www.google.com/maps?q=${encodeURIComponent(event.venueAddress)}&output=embed`}
                  width="100%"
                  height="350"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="WOLF IDEATHON 2026 venue map"
                  className="w-full h-[350px]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION */}
        <section className="py-20 sm:py-24 border-b border-white/10 bg-[#0F0F0F]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center space-y-3">
              <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">
                <span className="h-1.5 w-1.5 shrink-0 bg-[#FF0007]" />
                QUESTIONS & ANSWERS
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
                FREQUENTLY ASKED <span className="text-[#FF0007]">QUESTIONS</span>
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-[#000000] border border-white/10 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 font-display font-bold text-base text-white hover:text-[#FF0007] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={cn(
                        "w-5 h-5 text-white/50 transition-transform duration-200",
                        openFaq === idx && "transform rotate-180 text-[#FF0007]"
                      )}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="px-6 pb-6 text-sm text-white/70 leading-relaxed border-t border-white/10 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24 bg-[#000000] text-center relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-white">
              READY TO BUILD WITH <span className="text-[#FF0007]">CYBER WOLF</span>?
            </h2>
            <p className="text-white/70 text-sm sm:text-base max-w-2xl mx-auto">
              Secure your team registration for WOLF IDEA PITCH 2026 on 09 October 2026.
            </p>
            <div className="pt-4">
              <ClipButton
                href="/register"
                size="lg"
              >
                <span>Register Now</span>
                <ArrowRight className="w-4 h-4" />
              </ClipButton>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
