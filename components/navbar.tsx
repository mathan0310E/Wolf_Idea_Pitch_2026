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
  const [scrolled, setScrolled] = React.useState(false);

  // Elevate the header once the page is scrolled. Reads scrollY directly (no
  // layout measurement) and stays passive so scrolling never janks.
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  // Close the mobile menu on route change (including back/forward).
  // Adjusting state during render — not in an effect — is the React-recommended
  // pattern for "reset state when a prop/value changes": React re-renders
  // immediately without committing, so there is no extra paint.
  const [lastPath, setLastPath] = React.useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileMenuOpen(false);
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-[100] isolate border-b transition-[background-color,border-color,box-shadow] duration-300 ease-out",
        scrolled
          ? "border-white/15 bg-[#000000]/85 backdrop-blur-md shadow-[0_10px_30px_-18px_rgba(0,0,0,0.95)]"
          : "border-white/10 bg-[#000000]"
      )}
    >
      <div className="max-w-7xl mx-auto flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0 group">
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 flex-shrink-0 transition-transform duration-300 ease-out group-hover:scale-105 group-active:scale-95">
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
            <span className="font-display font-bold text-sm sm:text-lg tracking-tight text-white truncate group-hover:text-[#FF0007] transition-colors duration-200">
              Cyber Wolf
            </span>
            <span className="hidden min-[400px]:block text-[9px] font-bold tracking-[0.2em] text-white/60 uppercase">
              WOLF IDEA PITCH 2026
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
                data-active={isActive}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "underline-sweep px-2.5 xl:px-3 py-2 whitespace-nowrap rounded-none transition-colors duration-200",
                  isActive ? "text-[#FF0007] font-semibold" : "hover:text-white"
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
            className="inline-flex h-9 px-4 sm:px-5 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-none text-[10px] font-bold uppercase tracking-[0.14em] text-white transition-[transform,box-shadow,opacity] duration-200 ease-out hover:opacity-95 hover:shadow-[0_0_24px_-4px_rgba(255,0,7,0.6)] active:scale-[0.97]"
          >
            <span>Register Now</span>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-none border border-white/30 text-white transition-[background-color,transform] duration-200 ease-out hover:bg-white/10 active:scale-95"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
          >
            <span
              className="transition-transform duration-300 ease-out"
              style={{ transform: mobileMenuOpen ? "rotate(90deg)" : "none" }}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav"
          className="lg:hidden border-b border-white/10 bg-[#0F0F0F] px-4 py-4 space-y-2 max-h-[calc(100dvh-3.5rem)] overflow-y-auto animate-in slide-in-from-top-2 fade-in duration-200 ease-out"
        >
          {navItems.map((item, i) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{ animationDelay: `${Math.min(i * 22, 220)}ms` }}
                className={cn(
                  "animate-fade-up block px-3 py-2 text-sm font-medium transition-[color,background-color,border-color,transform] duration-200 ease-out border-l-2 hover:translate-x-0.5",
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
