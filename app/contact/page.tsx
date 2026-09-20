import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { event } from "@/config/event";
import { Mail, Phone, MessageSquare, Shield } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <main className="flex-1 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#1E1E1E] text-xs font-mono text-[#E50914] border border-white/10">
              GET IN TOUCH
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white">
              CONTACT <span className="text-[#E50914]">CYBERWOLF</span>
            </h1>
            <p className="text-zinc-400 text-sm max-w-2xl mx-auto">
              Have questions about registration, sponsorships, or guidelines? Contact the CyberWolf organizing team.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-[#151515] border border-white/10 space-y-3 text-center">
              <Phone className="w-8 h-8 text-[#E50914] mx-auto" />
              <h3 className="font-display font-bold text-white">Phone Support</h3>
              <p className="text-xs text-zinc-400">{event.contact.phone}</p>
            </div>

            <div className="p-6 rounded-xl bg-[#151515] border border-white/10 space-y-3 text-center">
              <Mail className="w-8 h-8 text-[#E50914] mx-auto" />
              <h3 className="font-display font-bold text-white">Email Support</h3>
              <p className="text-xs text-zinc-400">{event.contact.email}</p>
            </div>

            <div className="p-6 rounded-xl bg-[#151515] border border-white/10 space-y-3 text-center">
              <MessageSquare className="w-8 h-8 text-[#E50914] mx-auto" />
              <h3 className="font-display font-bold text-white">WhatsApp / Social</h3>
              <p className="text-xs text-zinc-400">{event.contact.whatsapp}</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
