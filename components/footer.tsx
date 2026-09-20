import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Lock } from "lucide-react";
import { event } from "@/config/event";

export function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-[#000000] text-white/70 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 flex-shrink-0">
                <Image
                  src="/cw-logo.png"
                  alt="Cyber Wolf Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-display font-bold text-lg text-white">
                Cyber Wolf
              </span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              {event.name} — {event.tagline}
            </p>
            <div className="inline-block px-3 py-1.5 bg-[#0F0F0F] border border-white/10 text-[11px] font-mono text-white/90">
              📅 Event Date: <span className="text-[#FF0007] font-bold">09 October 2026</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Event
                </Link>
              </li>
              <li>
                <Link href="/cyberwolf" className="hover:text-white transition-colors">
                  CyberWolf Community
                </Link>
              </li>
              <li>
                <Link href="/themes" className="hover:text-white transition-colors">
                  Ideathon Themes
                </Link>
              </li>
              <li>
                <Link href="/schedule" className="hover:text-white transition-colors">
                  Event Schedule
                </Link>
              </li>
              <li>
                <Link href="/rules" className="hover:text-white transition-colors">
                  Guidelines & Rules
                </Link>
              </li>
            </ul>
          </div>

          {/* Registration & Support */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">
              Registration & Support
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/register" className="text-[#FF0007] hover:underline font-bold">
                  Register Team / Solo
                </Link>
              </li>
              <li>
                <Link href="/status" className="hover:text-white transition-colors">
                  Check Registration Status
                </Link>
              </li>
              <li>
                <Link href="/venue" className="hover:text-white transition-colors">
                  Venue & Map
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Event Contact */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">
              Official Details
            </h4>
            <div className="space-y-2 text-xs text-white/80">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#FF0007] flex-shrink-0" />
                <span>{event.venue}, {event.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#FF0007] flex-shrink-0" />
                <span>{event.contact.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#FF0007] flex-shrink-0" />
                <span>{event.contact.phone}</span>
              </div>
            </div>
            <div className="pt-2">
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Admin Login Portal</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>© 2026 Cyber Wolf. All rights reserved. WOLF IDEATHON 2026.</p>
          <p className="font-mono text-[11px]">
            Security • Compliance • Innovation
          </p>
        </div>
      </div>
    </footer>
  );
}
