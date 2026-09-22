import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { event } from "@/config/event";
import { MapPin, Navigation } from "lucide-react";

export default function VenuePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <main className="flex-1 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#1E1E1E] text-xs font-mono text-[#E50914] border border-white/10">
              LOCATION & DIRECTIONS
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white">
              EVENT <span className="text-[#E50914]">VENUE</span>
            </h1>
            <p className="text-zinc-400 text-sm max-w-2xl mx-auto">
              WOLF IDEA PITCH 2026 venue details.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            <div className="p-8 rounded-xl bg-[#151515] border border-white/10 space-y-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-8 h-8 text-[#E50914]" />
                <h3 className="font-display text-2xl font-bold text-white">Location</h3>
              </div>
              <div className="space-y-4 text-sm text-zinc-300">
                <div>
                  <p className="font-display font-bold text-white text-xl">{event.venue}</p>
                  <p className="mt-2 leading-relaxed">
                    No. 3A, 10th Street, Gandhi Nagar
                    <br />
                    Tiruvannamalai
                    <br />
                    Tamil Nadu – 606601, India
                  </p>
                </div>
                <p><span className="font-bold text-white">Contact Phone:</span> {event.contact.phone}</p>
                <p><span className="font-bold text-white">Contact Email:</span> {event.contact.email}</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex-1 min-h-[300px] rounded-xl overflow-hidden bg-[#151515] border border-white/10">
                <iframe
                  title={`Map — ${event.venue}, ${event.city}`}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(event.venueAddress)}&z=16&output=embed`}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl bg-[#151515] border border-white/10 px-5 py-4">
                <div className="min-w-0">
                  <h4 className="font-bold text-white">{event.venue}</h4>
                  <p className="text-xs text-zinc-400 truncate">{event.venueAddress}</p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venueAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-[#E50914] hover:text-white transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Directions
                </a>
              </div>
            </div>

            <div className="rounded-xl bg-[#151515] border border-white/10 overflow-hidden">
              <iframe
                src={`https://www.google.com/maps?q=${encodeURIComponent(event.venueAddress)}&output=embed`}
                width="100%"
                height="380"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="WOLF IDEATHON 2026 venue map"
                className="w-full h-[380px]"
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
