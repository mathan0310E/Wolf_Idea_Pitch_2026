import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Seamless running ticker of keywords.
 *
 * The list is rendered twice inside a `width: max-content` track and the track
 * translates -50%, so the second copy is exactly where the first started when
 * the loop restarts — no visible jump. The duplicate is `aria-hidden` so screen
 * readers hear the list once, and the animation pauses on hover.
 */
export function Marquee({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  return (
    <div className={cn("marquee", className)}>
      <div className="marquee__track">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            className="flex shrink-0 items-center"
            aria-hidden={copy === 1 ? true : undefined}
          >
            {items.map((item, i) => (
              <li
                key={`${copy}-${i}`}
                className="flex items-center whitespace-nowrap font-display text-[11px] font-bold uppercase tracking-[0.24em] text-white/70"
              >
                {item}
                <span
                  className="mx-6 h-1 w-1 shrink-0 bg-[#FF0007]"
                  aria-hidden="true"
                />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
