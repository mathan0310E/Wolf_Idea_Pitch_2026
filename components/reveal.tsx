"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type RevealVariant = "up" | "left" | "scale";

const variantClass: Record<RevealVariant, string> = {
  up: "reveal",
  left: "reveal-x",
  scale: "reveal-scale",
};

export interface RevealProps extends React.HTMLAttributes<HTMLElement> {
  /** Entrance direction. Defaults to "up". */
  variant?: RevealVariant;
  /** Stagger delay in milliseconds (compositor-only, no JS timers). */
  delay?: number;
  /** Re-animate each time the element re-enters the viewport. */
  repeat?: boolean;
  /** Element to render. Defaults to "div". */
  as?: "div" | "section" | "article" | "aside" | "li" | "span" | "ul";
}

/**
 * Scroll-triggered entrance animation.
 *
 * The hidden state lives behind `html[data-motion="on"]`, which is only set
 * once this component mounts. That means server-rendered HTML (and any no-JS
 * visitor) shows the content at full opacity — the animation can never hide
 * content permanently. `prefers-reduced-motion` short-circuits to the visible
 * state immediately (see app/globals.css).
 */
export function Reveal({
  variant = "up",
  delay = 0,
  repeat = false,
  as = "div",
  className,
  style,
  children,
  ...props
}: RevealProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const Tag = as as "div";

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Users who prefer reduced motion never get the hidden state at all — and
    // must not have `data-motion` flipped on here, or content would blink to
    // opacity 0 before snapping back.
    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }

    // Only enable motion styling when JS is running (the inline script in
    // app/layout.tsx does this too, before first paint).
    document.documentElement.setAttribute("data-motion", "on");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            if (!repeat) observer.unobserve(entry.target);
          } else if (repeat) {
            entry.target.classList.remove("is-visible");
          }
        }
      },
      // threshold 0 (not a ratio) so that sections taller than the viewport
      // still trigger: with a ratio threshold a very tall element can never
      // reach it and would stay hidden forever.
      { threshold: 0, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [repeat]);

  return (
    <Tag
      ref={ref}
      className={cn(variantClass[variant], className)}
      style={
        {
          ...style,
          "--reveal-delay": `${delay}ms`,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </Tag>
  );
}
