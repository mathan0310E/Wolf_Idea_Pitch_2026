import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { event } from "@/config/event";
import { MapPin, Navigation, Phone, Mail, Calendar } from "lucide-react";

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="p-8 rounded-xl bg-[#151515] border border-white/10 space-y-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-8 h-8 text-[#E50914]" />
                <h3 className="font-display text-2xl font-bold text-white">Venue Details</h3>
              </div>
              <div className="space-y-4 text-sm text-zinc-300">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#E50914] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white block">Venue</p>
                    <p className="text-zinc-400">{event.venue}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Navigation className="w-5 h-5 text-[#E50914] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white block">Full Address</p>
                    <p className="text-zinc-400">{event.venueAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-[#E50914] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white block">Event Date</p>
                    <p className="text-zinc-400">
                      {new Date(event.date).toLocaleDateString("en-IN", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#E50914] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white block">Contact Phone</p>
                    <p className="text-zinc-400">{event.contact.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#E50914] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white block">Contact Email</p>
                    <p className="text-zinc-400">{event.contact.email}</p>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venueAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E50914] hover:text-white transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  View on Google Maps
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
