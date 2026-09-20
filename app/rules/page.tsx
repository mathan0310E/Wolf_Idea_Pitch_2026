import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

export default function RulesPage() {
  const rules = [
    "All team members must be enrolled in an educational institution.",
    "Team sizes must adhere strictly to 1 member (Solo), 2 members (Duo), or 4 members (Squad).",
    "Registration fee is flat ₹300 per participant (recalculated and enforced server-side).",
    "All submitted ideas and code must be original work created for WOLF IDEATHON 2026.",
    "Decisions made by the CyberWolf judging panel are final.",
    "Payment verification requires submitting a valid UTR/Transaction ID and clear screenshot proof.",
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <main className="flex-1 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#1E1E1E] text-xs font-mono text-[#E50914] border border-white/10">
              OFFICIAL CODE OF CONDUCT
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white">
              RULES & <span className="text-[#E50914]">GUIDELINES</span>
            </h1>
            <p className="text-zinc-400 text-sm max-w-2xl mx-auto">
              Please review all official rules before registering.
            </p>
          </div>

          <div className="p-8 rounded-xl bg-[#151515] border border-white/10 space-y-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-[#E50914]" />
              <h3 className="font-display text-2xl font-bold text-white">General Rules</h3>
            </div>
            <ul className="space-y-4">
              {rules.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-zinc-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
