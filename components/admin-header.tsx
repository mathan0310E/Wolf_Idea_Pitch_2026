"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Menu, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Registrations", href: "/admin/registrations" },
  { label: "Payments Queue", href: "/admin/payments" },
  { label: "Settings", href: "/admin/settings" },
];

export function AdminHeader({ title }: { title: string }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (mobileMenuOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [mobileMenuOpen]);

  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    sessionStorage.removeItem("wolf_admin_session");
    window.location.href = "/admin/login";
  };

  return (
    <header className="border-b border-white/10 bg-[#151515] px-4 sm:px-6 py-3 sm:py-4">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-[#E50914]/10 text-[#E50914] flex items-center justify-center border border-[#E50914]/20">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-display font-extrabold text-xs sm:text-sm tracking-wider text-white truncate">
            {title}
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-2 sm:gap-4 text-xs font-semibold uppercase tracking-wider text-zinc-300">
          {adminNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-2 py-1.5 rounded-md transition-colors",
                pathname === item.href
                  ? "text-[#E50914] bg-[#E50914]/10"
                  : "hover:text-white hover:bg-white/5"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#1E1E1E] hover:bg-white/10 text-xs text-zinc-300 border border-white/10"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/30 text-white transition hover:bg-white/10"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="admin-mobile-nav"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <nav
          id="admin-mobile-nav"
          className="md:hidden mt-3 border-t border-white/10 pt-3 space-y-1 max-h-[calc(100dvh-4rem)] overflow-y-auto"
        >
          {adminNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "block px-3 py-2.5 rounded-md text-sm font-semibold transition-colors border-l-2",
                pathname === item.href
                  ? "text-[#E50914] bg-[#E50914]/10 border-[#E50914]"
                  : "text-zinc-300 hover:text-white hover:bg-white/5 border-transparent"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}