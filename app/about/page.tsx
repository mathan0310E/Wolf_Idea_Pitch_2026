import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Shield, Zap, Lock, Award } from "lucide-react";
import { event } from "@/config/event";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <main className="flex-1 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#1E1E1E] text-xs font-mono text-[#E50914] border border-white/10">
              ABOUT THE EVENT
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white">
              ABOUT <span className="text-[#E50914]">WOLF IDEATHON 2026</span>
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto">
              Presented by CyberWolf on 09 October 2026. Tagline: {event.tagline}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-xl bg-[#151515] border border-white/10 space-y-4">
              <Shield className="w-10 h-10 text-[#E50914]" />
              <h3 className="font-display text-2xl font-bold text-white">Our Mission</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                WOLF IDEATHON 2026 aims to foster innovative problem-solving in cybersecurity, threat mitigation, secure systems engineering, and resilient cloud/software architectures.
              </p>
            </div>

            <div className="p-8 rounded-xl bg-[#151515] border border-white/10 space-y-4">
              <Zap className="w-10 h-10 text-[#E50914]" />
              <h3 className="font-display text-2xl font-bold text-white">The Challenge</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Teams compete to present original ideas, architectures, and working prototypes across specialized cybersecurity and technical domains.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
