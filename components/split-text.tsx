"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SplitTextProps {
  /** Text to render. Split on single spaces into individually animated words. */
  text: string;
  /** Element to render as. Defaults to "span". */
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  /** Words from this index onward get the accent treatment (e.g. the year). */
  accentFrom?: number;
  /** Classes for the accented words. Defaults to the brand red. */
  accentClassName?: string;
  /** Base delay in ms before the first word starts rising. */
  delay?: number;
  /** Per-word stagger in ms. */
  stagger?: number;
  className?: string;
}

/**
 * Word-level mask reveal for headings.
 *
 * Each word sits inside an `overflow-hidden` clip and rises into place, driven
 * entirely by CSS custom properties (`--i` per word, `--word-stagger`,
 * `--base-delay`) — there are no JS timers and therefore nothing to clean up.
 *
 * Accessibility and no-JS safety: the hidden "from" state lives inside the
 * keyframe AND the animation only exists under `html[data-motion="on"]`, which
 * is set by the inline script in app/layout.tsx. Server-rendered HTML, no-JS
 * visitors and `prefers-reduced-motion` users all get plain, fully visible
 * text — the animation can never leave a heading invisible. The rendered text
 * content and DOM order are unchanged, so screen readers read it normally.
 */
export function SplitText({
  text,
  as = "span",
  accentFrom,
  accentClassName = "text-[#FF0007]",
  delay = 0,
  stagger = 55,
  className,
}: SplitTextProps) {
  const Tag = as as "span";
  const words = text.split(" ");

  return (
    <Tag
      className={cn(className)}
      style={
        {
          "--base-delay": `${delay}ms`,
          "--word-stagger": `${stagger}ms`,
        } as React.CSSProperties
      }
    >
      {words.map((word, i) => (
        <React.Fragment key={`${word}-${i}`}>
          <span className="t-word-mask">
            <span
              className={cn(
                "t-word",
                accentFrom !== undefined && i >= accentFrom && accentClassName
              )}
              style={{ "--i": i } as React.CSSProperties}
            >
              {word}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </React.Fragment>
      ))}
    </Tag>
  );
}
