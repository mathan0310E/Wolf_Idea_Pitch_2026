"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "CyberWolf", href: "/cyberwolf" },
  { label: "Themes", href: "/themes" },
  { label: "Schedule", href: "/schedule" },
  { label: "Rules", href: "/rules" },
  { label: "FAQ", href: "/faq" },
  { label: "Venue", href: "/venue" },
  { label: "Contact", href: "/contact" },
  { label: "Track Status", href: "/status" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Lock body scroll while the mobile menu is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [mobileMenuOpen]);

  // Close the mobile menu on route change
  const prevPath = React.useRef(pathname);
  React.useEffect(() => { if (prevPath.current !== pathname) { prevPath.current = pathname; setMobileMenuOpen(false); } });

  return (
    <header className="sticky top-0 z-[100] isolate border-b border-white/10 bg-[#000000]">
      <div className="max-w-7xl mx-auto flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0 group">
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 flex-shrink-0">
            <Image
              src="/cw.jpeg"
              alt="Cyber Wolf Logo"
              width={44}
              height={44}
              className="w-full h-full object-contain rounded-full"
              priority
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-display font-bold text-sm sm:text-lg tracking-tight text-white truncate group-hover:text-[#FF0007] transition-colors">
              Cyber Wolf
            </span>
            <span className="hidden min-[400px]:block text-[9px] font-bold tracking-[0.2em] text-white/60 uppercase">
              WOLF IDEATHON 2026
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-medium text-white/70">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-2.5 xl:px-3 py-2 transition-colors hover:text-white rounded-none whitespace-nowrap",
                  isActive ? "text-[#FF0007] font-semibold border-b-2 border-[#FF0007]" : ""
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Action CTA & Mobile Menu Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/register"
            style={{ backgroundColor: "#FF0007" }}
            aria-label="Register Now"
            className="inline-flex h-9 px-4 sm:px-5 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-none text-[10px] font-bold uppercase tracking-[0.14em] text-white transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <span>Register Now</span>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-none border border-white/30 text-white transition hover:bg-white/10"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav"
          className="lg:hidden border-b border-white/10 bg-[#0F0F0F] px-4 py-4 space-y-2 max-h-[calc(100dvh-3.5rem)] overflow-y-auto animate-in slide-in-from-top-2 duration-200"
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "block px-3 py-2 text-sm font-medium transition-colors border-l-2",
                  isActive
                    ? "bg-[#FF0007]/10 text-[#FF0007] font-bold border-[#FF0007]"
                    : "text-white/70 hover:text-white border-transparent"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
