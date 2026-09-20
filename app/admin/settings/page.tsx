"use client";

import * as React from "react";
import Link from "next/link";
import { Shield, Settings, Save, Lock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { event } from "@/config/event";

export default function AdminSettingsPage() {
  const [registrationOpen, setRegistrationOpen] = React.useState(true);
  const [announcement, setAnnouncement] = React.useState<string>(event.registration.announcement);
  const [saved, setSaved] = React.useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      <header className="border-b border-white/10 bg-[#151515] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#E50914]/10 text-[#E50914] flex items-center justify-center border border-[#E50914]/20">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-display font-extrabold text-sm tracking-wider text-white">
            EVENT SETTINGS
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-zinc-300">
          <Link href="/admin/dashboard" className="hover:text-white">Dashboard</Link>
          <Link href="/admin/registrations" className="hover:text-white">Registrations</Link>
          <Link href="/admin/payments" className="hover:text-white">Payments Queue</Link>
          <Link href="/admin/settings" className="text-[#E50914]">Settings</Link>
        </nav>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-white">Global Event Configuration</h1>
          <p className="text-xs text-zinc-400">Toggle registration status and customize announcement messages</p>
        </div>

        <Card variant="default" className="border-white/10 p-6 sm:p-8">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#1E1E1E] border border-white/10">
              <div>
                <h3 className="font-display font-bold text-white text-base">Registration Gate Status</h3>
                <p className="text-xs text-zinc-400">Allow or block new registration submissions on public portal</p>
              </div>
              <button
                type="button"
                onClick={() => setRegistrationOpen(!registrationOpen)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${
                  registrationOpen
                    ? "bg-emerald-600 text-white"
                    : "bg-[#E50914] text-white"
                }`}
              >
                {registrationOpen ? "OPEN FOR REGISTRATION" : "REGISTRATIONS CLOSED"}
              </button>
            </div>

            <Textarea
              label="Public Announcement Text"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              rows={3}
            />

            <div className="p-4 rounded-xl bg-[#1E1E1E] border border-white/10 space-y-2 text-xs text-zinc-300">
              <span className="font-bold text-white block uppercase">Read-only Event Variables</span>
              <div>Event Name: <span className="font-mono text-zinc-400">{event.name}</span></div>
              <div>Date: <span className="font-mono text-zinc-400">09 October 2026</span></div>
              <div>Fee per Participant: <span className="font-mono text-zinc-400">₹300</span></div>
              <div>UPI ID: <span className="font-mono text-zinc-400">{event.payment.upiId}</span></div>
            </div>

            {saved && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-medium">
                ✓ Settings updated successfully.
              </div>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E50914] hover:bg-[#C10712] text-white font-bold text-xs uppercase tracking-wider shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </form>
        </Card>
      </main>
    </div>
  );
}
