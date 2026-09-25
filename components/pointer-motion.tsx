"use client";

import * as React from "react";

/**
 * PointerMotion — the single delegated pointer engine for the whole site.
 *
 * Renders nothing. It publishes CSS custom properties on elements that already
 * opt in with a class, so every effect is pure CSS in the end:
 *
 *   .spotlight  -> --mx / --my  (gradient centre, as percentages)
 *   .tilt       -> --rx / --ry  (rotation in deg)
 *   .magnetic   -> --tx / --ty  (offset in px, clamped to +/-10px)
 *
 * Why one window-level listener instead of a hook per element: attaching a
 * listener to every card would cost a listener per instance and a closure per
 * instance. Delegating from `window` means one listener for the whole document,
 * and `closest()` finds the right surface from the event target.
 *
 * Smoothness rules honoured here:
 *   - work happens inside a rAF callback and bursts of pointermove events are
 *     coalesced into a single frame (no more than one style write per frame);
 *   - only custom properties are written, and the CSS only ever animates
 *     `transform` / `opacity`, so nothing here triggers layout;
 *   - the listener is passive, so it can never block scrolling;
 *   - the whole engine is skipped for reduced-motion users and for devices with
 *     no real cursor (touch), where a hover effect would be meaningless.
 */
export function PointerMotion() {
  React.useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (reduce.matches || !fine.matches) return;

    const MAX_TILT_DEG = 7;
    const MAX_MAGNET_PX = 10;
    const MAGNET_PULL = 0.18; // how much of the cursor offset is followed

    let frame = 0;
    let lastEvent: PointerEvent | null = null;

    const clamp = (value: number, max: number) =>
      value > max ? max : value < -max ? -max : value;

    const apply = () => {
      frame = 0;
      const event = lastEvent;
      if (!event) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      // 1. Spotlight — move the gradient centre to the cursor.
      const spot = target.closest(".spotlight");
      if (spot instanceof HTMLElement) {
        const box = spot.getBoundingClientRect();
        if (box.width > 0 && box.height > 0) {
          spot.style.setProperty(
            "--mx",
            `${(((event.clientX - box.left) / box.width) * 100).toFixed(2)}%`
          );
          spot.style.setProperty(
            "--my",
            `${(((event.clientY - box.top) / box.height) * 100).toFixed(2)}%`
          );
        }
      }

      // 2. Tilt — rotate toward the cursor, clamped to MAX_TILT_DEG.
      const tilt = target.closest(".tilt");
      if (tilt instanceof HTMLElement) {
        const box = tilt.getBoundingClientRect();
        if (box.width > 0 && box.height > 0) {
          const px = (event.clientX - box.left) / box.width - 0.5;
          const py = (event.clientY - box.top) / box.height - 0.5;
          tilt.style.setProperty(
            "--ry",
            `${clamp(px * MAX_TILT_DEG * 2, MAX_TILT_DEG).toFixed(2)}deg`
          );
          tilt.style.setProperty(
            "--rx",
            `${clamp(-py * MAX_TILT_DEG * 2, MAX_TILT_DEG).toFixed(2)}deg`
          );
        }
      }

      // 3. Magnetic — a small pull toward the cursor, clamped so the element
      //    can never leave its own hit-area.
      const magnet = target.closest(".magnetic");
      if (magnet instanceof HTMLElement) {
        const box = magnet.getBoundingClientRect();
        if (box.width > 0 && box.height > 0) {
          const dx = event.clientX - (box.left + box.width / 2);
          const dy = event.clientY - (box.top + box.height / 2);
          magnet.style.setProperty(
            "--tx",
            `${clamp(dx * MAGNET_PULL, MAX_MAGNET_PX).toFixed(2)}px`
          );
          magnet.style.setProperty(
            "--ty",
            `${clamp(dy * MAGNET_PULL, MAX_MAGNET_PX).toFixed(2)}px`
          );
        }
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      lastEvent = event;
      if (frame) return; // coalesce bursts into one frame
      frame = window.requestAnimationFrame(apply);
    };

    // Settle an element back to rest only once the pointer has truly left it
    // (moving between children fires pointerout too, hence the containment
    // check) so tiles do not snap flat while the cursor is still inside.
    const onPointerOut = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const related = event.relatedTarget;
      const element = target.closest(".tilt, .magnetic");
      if (
        element instanceof HTMLElement &&
        !(related instanceof Node && element.contains(related))
      ) {
        element.style.removeProperty("--rx");
        element.style.removeProperty("--ry");
        element.style.removeProperty("--tx");
        element.style.removeProperty("--ty");
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerOut);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
