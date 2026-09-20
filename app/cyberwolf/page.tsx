import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Shield, Terminal, Users, Lock } from "lucide-react";

export default function CyberWolfPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <main className="flex-1 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#1E1E1E] text-xs font-mono text-[#E50914] border border-white/10">
              ORGANIZER COMMUNITY
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white">
              ABOUT <span className="text-[#E50914]">CYBERWOLF</span>
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto">
              Empowering student security researchers, builders, and innovators.
            </p>
          </div>

          <div className="p-8 rounded-xl bg-[#151515] border border-white/10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-[#E50914]/10 text-[#E50914] border border-[#E50914]/20">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold text-white">CyberWolf Community</h3>
                <p className="text-xs text-zinc-400 font-mono">LEARN • SECURE • BUILD</p>
              </div>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed">
              CyberWolf is a technical community dedicated to advancing security awareness, ethical hacking, secure software development, and technical innovation. Through hackathons, ideathons, and workshops, CyberWolf provides a platform for students to demonstrate their engineering and security talent.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
              <div className="p-4 rounded-lg bg-[#1E1E1E]">
                <Terminal className="w-5 h-5 text-[#E50914] mb-2" />
                <h4 className="font-bold text-sm text-white">Hands-on Skill</h4>
                <p className="text-xs text-zinc-400">Practical labs and competitions.</p>
              </div>
              <div className="p-4 rounded-lg bg-[#1E1E1E]">
                <Users className="w-5 h-5 text-[#E50914] mb-2" />
                <h4 className="font-bold text-sm text-white">Peer Network</h4>
                <p className="text-xs text-zinc-400">Connect with fellow researchers.</p>
              </div>
              <div className="p-4 rounded-lg bg-[#1E1E1E]">
                <Lock className="w-5 h-5 text-[#E50914] mb-2" />
                <h4 className="font-bold text-sm text-white">Ethical Standard</h4>
                <p className="text-xs text-zinc-400">Strict legal and ethical compliance.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
