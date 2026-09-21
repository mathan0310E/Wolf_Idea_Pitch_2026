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
  const [timeLeft, setTimeLeft] = React.useState<TimeLeft>(() =>
    getTimeLeft(target)
  );

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setTimeLeft(getTimeLeft(target));
    }, 1_000);
    return () => window.clearInterval(id);
  }, [target]);

  const units = [
    { label: "Days", value: String(timeLeft.days) },
    { label: "Hours", value: pad(timeLeft.hours) },
    { label: "Mins", value: pad(timeLeft.minutes) },
    { label: "Secs", value: pad(timeLeft.seconds) },
  ];

  return (
    <div className={`flex items-center gap-3 sm:gap-4 ${className ?? ""}`}>
      {units.map((unit, i) => (
        <React.Fragment key={unit.label}>
          {i > 0 && <span className="text-2xl sm:text-3xl font-bold text-white/30">:</span>}
          <div className="flex flex-col items-center gap-1">
            <div className="min-w-[3.25rem] sm:min-w-[4.5rem] px-2 py-2.5 sm:py-3 rounded-md bg-white/10 border border-white/15 backdrop-blur-sm">
              <span className="font-mono text-2xl sm:text-4xl font-extrabold text-white tabular-nums">
                {unit.value}
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
              {unit.label}
            </span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}