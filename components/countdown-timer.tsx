"use client";

import * as React from "react";

interface CountdownTimerProps {
  targetDate: string | Date;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(target: number): TimeLeft {
  const diff = Math.max(0, target - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1_000) % 60),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function CountdownTimer({ targetDate, className }: CountdownTimerProps) {
  const target = new Date(targetDate).getTime();
  // Stay null through SSR and hydration. Date.now() during the first render
  // can tick between the server HTML and the client, which fails hydration.
  const [timeLeft, setTimeLeft] = React.useState<TimeLeft | null>(null);

  React.useEffect(() => {
    const tick = () => setTimeLeft(getTimeLeft(target));
    tick();
    const id = window.setInterval(tick, 1_000);
    return () => window.clearInterval(id);
  }, [target]);

  const units = [
    { label: "Days", value: timeLeft ? String(timeLeft.days) : "--" },
    { label: "Hours", value: timeLeft ? pad(timeLeft.hours) : "--" },
    { label: "Mins", value: timeLeft ? pad(timeLeft.minutes) : "--" },
    { label: "Secs", value: timeLeft ? pad(timeLeft.seconds) : "--" },
  ];

  return (
    <div className={`flex items-center gap-3 sm:gap-4 ${className ?? ""}`}>
      {units.map((unit, i) => {
        const isSeconds = unit.label === "Secs";
        return (
          <React.Fragment key={unit.label}>
            {i > 0 && <span className="text-2xl sm:text-3xl font-bold text-white/30">:</span>}
            <div className="flex flex-col items-center gap-1">
              <div className="min-w-[3.25rem] sm:min-w-[4.5rem] px-2 py-2.5 sm:py-3 rounded-md bg-white/10 border border-white/15 backdrop-blur-sm">
                {/* Re-keying on the value remounts the node, replaying the tick
                    animation exactly once per second — no JS timer per digit. */}
                <span
                  key={isSeconds && timeLeft ? unit.value : unit.label}
                  className={`font-mono text-2xl sm:text-4xl font-extrabold text-white tabular-nums${
                    isSeconds && timeLeft ? " animate-tick" : ""
                  }`}
                >
                  {unit.value}
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                {unit.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}