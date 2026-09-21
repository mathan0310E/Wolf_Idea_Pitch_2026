import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { event } from "@/config/event";
import { Clock, Calendar } from "lucide-react";

export default function SchedulePage() {
  const scheduleItems = [
    { time: "08:30 AM", title: "Reporting & Check-in", status: event.schedule.checkIn },
    { time: "09:30 AM", title: "Opening Ceremony & Briefing", status: event.schedule.opening },
    { time: "10:00 AM", title: "Idea Pitch Hacking Begins", status: event.schedule.hackathonStart },
    { time: "04:30 PM", title: "Final Pitch & Demonstration", status: event.schedule.hackathonEnd },
    { time: "05:30 PM", title: "Valedictory & Results", status: event.schedule.results },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <main className="flex-1 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#1E1E1E] text-xs font-mono text-[#E50914] border border-white/10">
              09 OCTOBER 2026
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white">
              EVENT <span className="text-[#E50914]">SCHEDULE</span>
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto">
              Timeline for WOLF IDEA PITCH 2026.
            </p>
          </div>

          <div className="space-y-4">
            {scheduleItems.map((item, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl bg-[#151515] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-[#E50914]/10 text-[#E50914] border border-[#E50914]/20 font-mono font-bold text-xs">
                    {item.time}
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-white">{item.title}</h3>
                  </div>
                </div>
                <div className="text-xs font-mono text-zinc-400 bg-[#1E1E1E] px-3 py-1.5 rounded-md border border-white/10 w-fit">
                  {item.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
