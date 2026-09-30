import * as React from "react";

/**
 * The user's reduced-motion preference, read from script.
 *
 * Internal, and not exported from the package. CSS handles this on its own
 * wherever a transition is a class (`motion-reduce:`), and that stays the
 * preferred route. This exists for the motion CSS can not see: an animation
 * written to inline styles by script, like `LiquidTabs`' pill, and a choice
 * between two whole sets of transition classes, like `Sheet`'s slide and its
 * fade, where one set has to be picked rather than overridden piece by piece.
 */

const QUERY = "(prefers-reduced-motion: reduce)";

function mediaQuery(): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null;
  }
  return window.matchMedia(QUERY);
}

/** Read at the moment of asking. For code that animates once, then forgets. */
export function prefersReducedMotion(): boolean {
  return mediaQuery()?.matches ?? false;
}

function subscribe(onChange: () => void): () => void {
  const query = mediaQuery();
  if (!query) return () => {};
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * The same preference as React state, so a component re-renders when the
 * setting changes while it is on screen.
 *
 * `false` on the server, and during hydration, which renders what the server
 * did before correcting itself. A component rendered on the client after that
 * reads the real value on its first render. A portaled overlay does not render
 * on the server anyway, and opens after hydration, so it animates correctly.
 */
export function useReducedMotion(): boolean {
  return React.useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}
