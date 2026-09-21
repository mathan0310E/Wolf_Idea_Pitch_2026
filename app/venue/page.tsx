import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { event } from "@/config/event";
import { MapPin, Navigation, Phone } from "lucide-react";

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
              WOLF IDEATHON 2026 venue details.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="p-8 rounded-xl bg-[#151515] border border-white/10 space-y-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-8 h-8 text-[#E50914]" />
                <h3 className="font-display text-2xl font-bold text-white">Venue Details</h3>
              </div>
              <div className="space-y-3 text-sm text-zinc-300">
                <p><span className="font-bold text-white">Venue Name:</span> {event.venue}</p>
                <p><span className="font-bold text-white">Address:</span> {event.venueAddress}</p>
                <p><span className="font-bold text-white">City / Region:</span> {event.city}</p>
                <p><span className="font-bold text-white">Contact Phone:</span> {event.contact.phone}</p>
                <p><span className="font-bold text-white">Contact Email:</span> {event.contact.email}</p>
              </div>
            </div>

            <div className="h-[300px] rounded-xl bg-[#151515] border border-white/10 flex items-center justify-center p-6 text-center">
              <div className="space-y-2">
                <Navigation className="w-10 h-10 text-[#E50914] mx-auto animate-bounce" />
                <h4 className="font-bold text-white text-lg">Cyber Wolf HQ</h4>
                <p className="text-xs text-zinc-400">No. 3A, 10th Street, Gandhi Nagar, Tiruvannamalai, Tamil Nadu - 606601, India</p>
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
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
