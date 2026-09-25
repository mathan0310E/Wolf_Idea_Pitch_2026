"use client";

import * as React from "react";

/**
 * Thin reading-progress bar pinned to the top of the viewport.
 *
 * Written for smoothness: the bar is moved with `transform: scaleX()` (a
 * compositor-only property, so it never triggers layout or paint) and the
 * value is written straight to the DOM node inside a rAF callback instead of
 * through React state — a scroll handler that calls setState on every frame is
 * the classic cause of a stuttering page. The listener is passive, so it can
 * never block scrolling.
 */
export function ScrollProgress() {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const progress =
        max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 0;
      el.style.transform = `scaleX(${progress})`;
    };

    const onScroll = () => {
      if (frame) return; // coalesce bursts of scroll events into one frame
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={ref} className="scroll-progress" aria-hidden="true" />;
}
