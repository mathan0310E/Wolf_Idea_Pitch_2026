import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { event } from "@/config/event";
import { Mail, Phone, MessageSquare, ExternalLink } from "lucide-react";

const phoneHref = `tel:${event.contact.phone.replace(/[^+\d]/g, "")}`;
const whatsappHref = `https://wa.me/${event.contact.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Hi CyberWolf team, I have a question about Wolf Idea Pitch 2026.")}`;
const mapEmbed = `https://www.google.com/maps?q=${encodeURIComponent(event.venueAddress)}&z=16&output=embed`;

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <main className="flex-1 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 stagger">
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
            <a
              href={phoneHref}
              className="group p-6 rounded-xl bg-[#151515] border border-white/10 space-y-3 text-center transition-colors hover:border-[#E50914]/40 hover:bg-[#1A1A1A]"
            >
              <Phone className="w-8 h-8 text-[#E50914] mx-auto" />
              <h3 className="font-display font-bold text-white">Phone Support</h3>
              <p className="text-xs text-zinc-400 group-hover:text-white transition-colors">{event.contact.phone}</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[#E50914]">
                Tap to call <ExternalLink className="w-3 h-3" />
              </span>
            </a>

            <a
              href={`mailto:${event.contact.email}`}
              className="group p-6 rounded-xl bg-[#151515] border border-white/10 space-y-3 text-center transition-colors hover:border-[#E50914]/40 hover:bg-[#1A1A1A]"
            >
              <Mail className="w-8 h-8 text-[#E50914] mx-auto" />
              <h3 className="font-display font-bold text-white">Email Support</h3>
              <p className="text-xs text-zinc-400 group-hover:text-white transition-colors break-all">{event.contact.email}</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[#E50914]">
                Tap to email <ExternalLink className="w-3 h-3" />
              </span>
            </a>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-6 rounded-xl bg-[#151515] border border-white/10 space-y-3 text-center transition-colors hover:border-[#E50914]/40 hover:bg-[#1A1A1A]"
            >
              <MessageSquare className="w-8 h-8 text-[#E50914] mx-auto" />
              <h3 className="font-display font-bold text-white">WhatsApp / Social</h3>
              <p className="text-xs text-zinc-400 group-hover:text-white transition-colors">{event.contact.whatsapp}</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[#E50914]">
                Tap to chat <ExternalLink className="w-3 h-3" />
              </span>
            </a>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-2xl font-bold text-white">
                Find <span className="text-[#E50914]">Us</span>
              </h2>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venueAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E50914] hover:text-white transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open in Google Maps
              </a>
            </div>
            <div className="h-[320px] rounded-xl overflow-hidden bg-[#151515] border border-white/10">
              <iframe
                title={`Map — ${event.venue}, ${event.city}`}
                src={mapEmbed}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <p className="text-xs text-zinc-400 text-center">
              <span className="font-bold text-white">{event.venue}</span> — {event.venueAddress}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
