"use client";

import * as React from "react";

/**
 * Pointer-tracked spotlight for every `.spotlight` surface on the page.
 *
 * One delegated `pointermove` listener drives all of them (rather than a
 * listener per card), and it only writes two CSS custom properties on the
 * element under the cursor — the visual itself is a static radial-gradient in
 * CSS, so the browser only has to re-resolve a gradient rather than run JS per
 * frame or touch layout. `transform: scaleX`-style compositing is not possible
 * for gradients, so writes are coalesced into a single rAF.
 *
 * Skipped entirely on touch/coarse pointers, where there is no hover to track.
 */
export function PointerSpotlight() {
  React.useEffect(() => {
    if (
      typeof window.matchMedia === "function" &&
      (window.matchMedia("(hover: none)").matches ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    ) {
      return;
    }

    let frame = 0;
    let target: HTMLElement | null = null;
    let x = 0;
    let y = 0;

    const apply = () => {
      frame = 0;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      target.style.setProperty("--mx", `${x - rect.left}px`);
      target.style.setProperty("--my", `${y - rect.top}px`);
    };

    const onMove = (event: PointerEvent) => {
      const source = event.target;
      const el =
        source instanceof Element
          ? (source.closest(".spotlight") as HTMLElement | null)
          : null;

      target = el;
      if (!el) return;

      x = event.clientX;
      y = event.clientY;
      if (!frame) frame = window.requestAnimationFrame(apply);
    };

    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
