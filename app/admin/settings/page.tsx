"use client";

import * as React from "react";
import { Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AdminHeader } from "@/components/admin-header";
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
      <AdminHeader title="EVENT SETTINGS" />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:p-6 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-white">Global Event Configuration</h1>
          <p className="text-xs text-zinc-400">Toggle registration status and customize announcement messages</p>
        </div>

        <Card variant="default" className="border-white/10 p-6 sm:p-8">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between p-4 rounded-xl bg-[#1E1E1E] border border-white/10">
              <div className="min-w-0">
                <h3 className="font-display font-bold text-white text-base">Registration Gate Status</h3>
                <p className="text-xs text-zinc-400">Allow or block new registration submissions on public portal</p>
              </div>
              <button
                type="button"
                onClick={() => setRegistrationOpen(!registrationOpen)}
                className={`shrink-0 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${
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
