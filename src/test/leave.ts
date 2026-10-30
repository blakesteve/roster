/* For checks of how an overlay leaves: Dialog's and Sheet's. */

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Stalls Headless UI's leave on `el`, as if the leave had never ended: it
 * hands Headless UI one transition whose end never comes, so Headless UI
 * waits on it forever and never calls `afterLeave`. That is the end state a
 * close cut into the entrance can leave behind, made certain.
 *
 * Only Headless UI is fooled. It asks `el` itself; anything that asks an
 * ancestor with `{ subtree: true }` still sees the element's real
 * transitions, which run and finish as usual, so nothing is left running.
 */
export function stallLeave(el: HTMLElement) {
  const never = Object.create(CSSTransition.prototype) as CSSTransition;
  Object.defineProperties(never, {
    finished: { value: new Promise(() => {}) },
    playState: { value: "paused" },
  });
  el.getAnimations = () => [never];
}

/**
 * Whether a CSS transition runs on the element `find` returns, in any frame
 * from now until the element leaves the page or `ms` pass. A check made in a
 * single frame can land before a transition starts: Headless UI starts a
 * leave two frames after it decides to.
 */
export async function transitionRunsOn(find: () => Element | null, ms = 300): Promise<boolean> {
  const end = performance.now() + ms;
  while (performance.now() < end) {
    const el = find();
    if (!el) return false;
    if (el.getAnimations().some((a) => "transitionProperty" in a && a.playState === "running")) return true;
    await frame();
  }
  return false;
}
