import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { event } from "@/config/event";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldAlert, Cpu, Lock, Network } from "lucide-react";

export default function ThemesPage() {
  const icons = [
    <ShieldAlert key="1" className="w-8 h-8 text-[#E50914]" />,
    <Cpu key="2" className="w-8 h-8 text-[#E50914]" />,
    <Lock key="3" className="w-8 h-8 text-[#E50914]" />,
    <Network key="4" className="w-8 h-8 text-[#E50914]" />,
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <main className="flex-1 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#1E1E1E] text-xs font-mono text-[#E50914] border border-white/10">
              IDEA PITCH DOMAINS
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white">
              EVENT <span className="text-[#E50914]">THEMES</span>
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto">
              Select one of the official themes for your proposal during registration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {event.themes.map((theme, idx) => (
              <Card key={theme.id} variant="hover">
                <CardHeader>
                  <div className="p-3 rounded-lg bg-[#E50914]/10 w-fit mb-3 border border-[#E50914]/20">
                    {icons[idx % icons.length]}
                  </div>
                  <CardTitle className="text-2xl text-white">{theme.title}</CardTitle>
                  <CardDescription className="text-zinc-400 text-sm">
                    {theme.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
