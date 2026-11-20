"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";

/* Four small behaviours, each of which degrades to nothing:

   `useCurtain`  — the first-paint choreography, once per session. The shell
                   takes a class for the length of the entrance and then gives
                   it back, so the ground settles into its slow ambient loop and
                   nothing is left keyed off a one-shot animation.
   `usePointerLight` — `--mx`/`--my` from the pointer's position over an element.
                   The stylesheet reads them only inside `:hover`, so touch and
                   keyboard users never see a stale light parked mid-button.
   `useNudge`    — one beat of scale when a value changes, replayed by class so
                   a count that lands on the same number twice still reports it.
   `useScrollDrift` — `--ohf-scroll`, a 0..1 depth for the instrument parallax.

   None of them holds render state, so no component re-renders because of the
   atmosphere. */

const CURTAIN_KEY = "ohf.curtain.v1";

/* The entrance has to be armed before the browser paints, or the ground shows
   for one frame at full strength and then jumps to the start of its curtain.
   `useLayoutEffect` is that guarantee; it is aliased so the server render, which
   has no layout, stays quiet. */
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function useCurtain<T extends HTMLElement>(ms = 2400) {
  const ref = useRef<T>(null);

  useBeforePaint(() => {
    const node = ref.current;
    if (!node) return;

    // Once per session: a second mount (a route change, a hot reload) must not
    // replay the whole entrance at the visitor.
    let seen = false;
    try {
      seen = sessionStorage.getItem(CURTAIN_KEY) === "1";
      sessionStorage.setItem(CURTAIN_KEY, "1");
    } catch {
      /* private mode — replaying is harmless */
    }
    if (seen) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    node.classList.add("ohf-curtain");
    const timer = window.setTimeout(() => node.classList.remove("ohf-curtain"), ms);
    return () => {
      window.clearTimeout(timer);
      node.classList.remove("ohf-curtain");
    };
  }, [ms]);

  return ref;
}

export function usePointerLight<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    // A coarse pointer has no hover to track, and the light costs a paint.
    if (window.matchMedia("(hover: none)").matches) return;

    let frame = 0;
    const onMove = (event: PointerEvent) => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const box = node.getBoundingClientRect();
        node.style.setProperty("--mx", `${event.clientX - box.left}px`);
        node.style.setProperty("--my", `${event.clientY - box.top}px`);
      });
    };
    const onLeave = () => {
      node.style.removeProperty("--mx");
      node.style.removeProperty("--my");
    };

    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", onLeave);
    return () => {
      window.cancelAnimationFrame(frame);
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return ref;
}

/* A one-shot flourish for a value that just changed — the batch count, the
   gallery count. Re-triggered by bumping `nonce`, so the element replays even
   when the number lands on the same value twice. */
export function useNudge<T extends HTMLElement>(nonce: number, className = "ohf-nudge") {
  const ref = useRef<T>(null);
  const first = useRef(true);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    // The value on first paint is not a change, so it must not be celebrated.
    if (first.current) {
      first.current = false;
      return;
    }
    node.classList.remove(className);
    // Reading offsetWidth would force layout; a microtask is enough to restart
    // the animation after the class was removed in the same frame.
    void node.offsetWidth;
    node.classList.add(className);
    const timer = window.setTimeout(() => node.classList.remove(className), 600);
    return () => window.clearTimeout(timer);
  }, [nonce, className]);

  return ref;
}

/* Writes the gallery's scroll position (0 at the top, 1 at the end) onto an
   element as `--ohf-scroll`, for the instrument parallax in motion.css. It
   listens passively on the element the gallery already scrolls, so it adds no
   layout, no state and no re-render — one custom property on one node. */
export function useScrollDrift(
  scrollRef: RefObject<HTMLElement | null>,
  targetRef: RefObject<HTMLElement | null>,
) {
  useBeforePaint(() => {
    const scroller = scrollRef.current;
    const target = targetRef.current;
    if (!scroller || !target) return;

    let frame = 0;
    const write = () => {
      frame = 0;
      const range = scroller.scrollHeight - scroller.clientHeight;
      // A gallery that fits on screen has no parallax to give.
      const depth = range > 8 ? Math.min(1, Math.max(0, scroller.scrollTop / range)) : 0;
      target.style.setProperty("--ohf-scroll", depth.toFixed(3));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(write);
    };

    write();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", onScroll);
      target.style.removeProperty("--ohf-scroll");
    };
  }, [scrollRef, targetRef]);
}
