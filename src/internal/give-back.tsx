import { useEffect, useRef, type RefObject } from "react";

/** An element, or a ref to one. */
export type FocusTarget = RefObject<HTMLElement | null> | HTMLElement | null | undefined;

function resolveFocusTarget(target: FocusTarget): HTMLElement | null {
  if (!target) return null;
  return "current" in target ? target.current : target;
}

/* The element with focus, inside any shadow roots on the way. */
function deepActive(): Element | null {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active;
}

/**
 * Where focus goes as a `Sheet` or `Dialog` leaves the page.
 *
 * Headless UI gives focus back to what opened the dialog from its focus
 * trap's unmount, in a microtask, wherever focus is by then. Focus the app
 * moved while the dialog closed (once the close has rendered, or in
 * `onAfterClose`), or a person moved during its leave, was taken to the
 * opener as the dialog left.
 *
 * So this reads where focus is as the dialog's tree unmounts. Outside the
 * dialog and not on `<body>`, it was put there, and after Headless UI's
 * give-back it goes back there, where the page put it, without scrolling.
 * With nothing put anywhere, `fallback` takes it if there is one, and
 * Headless UI's give-back stands if not. Focus that was in the dialog is on
 * `<body>` by then, its nodes being gone; `root` rules it out where they
 * aren't.
 *
 * Rendered INSIDE the panel on purpose. React runs a deleted tree's cleanups
 * parent first, so a cleanup below the trap queues its microtask after the
 * trap's and runs second. Placed above the trap, this would focus the target
 * and then watch Headless UI take focus away again.
 */
export function GiveFocusBack({ root, fallback }: { root: RefObject<HTMLElement | null>; fallback?: FocusTarget }) {
  const latest = useRef(fallback);
  const unmounted = useRef(false);
  useEffect(() => {
    latest.current = fallback;
  });
  useEffect(() => {
    /* Reset on every mount: StrictMode unmounts and remounts once in
       development, and without this its pretend unmount would move focus. */
    unmounted.current = false;
    /* Kept from the mount: a ref is emptied before this cleanup runs. */
    const dialog = root.current;
    return () => {
      unmounted.current = true;
      /* Inside the dialog is read on the outer element: `contains` doesn't
         cross into a shadow root. What's focused again is the inner one. */
      const outer = document.activeElement;
      const inside = !!outer && !!dialog?.contains(outer);
      const active = deepActive();
      const placed = !inside && active instanceof HTMLElement && active !== document.body && active.isConnected ? active : null;
      queueMicrotask(() => {
        if (!unmounted.current) return;
        if (placed) {
          if (deepActive() !== placed) placed.focus({ preventScroll: true });
          return;
        }
        const to = resolveFocusTarget(latest.current);
        if (to?.isConnected && document.activeElement !== to) to.focus();
      });
    };
  }, [root]);
  return null;
}
