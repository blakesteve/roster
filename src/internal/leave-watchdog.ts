import * as React from "react";

/**
 * Makes sure a closed `Dialog` or `Sheet` leaves the page, and says so once.
 *
 * Internal, and not exported from the package.
 *
 * Headless UI removes a dialog when its leave transition has ended, and it
 * finds that end by reading the panel's transitions once, a frame after the
 * classes change, then waiting for those. A close that arrives during the
 * entrance doesn't start a leave: it turns the entrance around. When that
 * turned-around transition ends, Headless UI 2.2.9 checks once more, and if
 * any transition on the element is still unfinished it returns without
 * waiting for it and never checks again. The dialog stays mounted, closed,
 * over the page, taking every click, and `afterLeave` never comes. Rare, and
 * commoner the busier the machine: in real Escapes during the entrance, 2
 * stuck in 1,800 at a load of 13 to 20, none in 2,700 at 3 to 5.
 *
 * Upstream, this is Headless UI's issue #3902
 * (https://github.com/tailwindlabs/headlessui/issues/3902). PR #3895
 * (https://github.com/tailwindlabs/headlessui/pull/3895), open and unreviewed
 * on 29 Oct 2026, reads the transitions again each time a batch of them
 * settles, which covers this. When a Headless UI release carries that fix,
 * the removal can come out. The wait in `afterLeave` (below) stays until a
 * release also stops ending a leave before it has run, which #3895 doesn't
 * (https://github.com/tailwindlabs/headlessui/issues/3902#issuecomment-6511980829).
 *
 * So each close is watched. A leave that ends goes as it always has: Headless
 * UI calls `afterLeave`, then removes the dialog. If the dialog is still
 * mounted `leaveMs` plus a margin after the close, with no transition running
 * inside it, nothing is going to remove it, and Roster does: `key` changes,
 * which remounts Headless UI's `Dialog` closed, and the stuck tree goes with
 * the old one. A transition still running (a leave made longer than its
 * default, say) is waited out, then checked again.
 *
 * Remounted rather than rendered only while open, so the way a dialog opens
 * is untouched: Headless UI's helper that finds the page behind is in place
 * before the open, as it always was, and a dialog open on its first render
 * behaves as it did.
 *
 * `onAfterClose` fires once for each close: after `afterLeave`, once no
 * transition runs on the dialog's own parts or it has gone (Headless UI can
 * call `afterLeave` with the leave still to run), or, when `afterLeave` never
 * came, once the stuck dialog is gone. A watched close that ends with `afterLeave` stays
 * watched until the dialog leaves the page, because the backdrop has its own
 * transition and can be the part left behind. Reopening during the leave ends
 * the watch, and that close never reports; so does unmounting.
 */

/** How long past its leave a closed dialog may stay mounted, with nothing running, before it counts as stuck. */
export const LEAVE_MARGIN_MS = 300;

/* A CSS transition running on the dialog's own parts: anything under `root`
   but what's inside the panel. A consumer's animation, a spinner say, can run
   forever, and a transition in the panel's content, a button's hover fade
   say, has nothing to do with the dialog leaving. Read by shape rather than
   `instanceof CSSTransition`, which jsdom doesn't have. */
function leaveRunning(root: Element, panel: Element | null): boolean {
  if (typeof root.getAnimations !== "function") return false;
  return root.getAnimations({ subtree: true }).some((a) => {
    if (!("transitionProperty" in a) || a.playState !== "running") return false;
    const target = (a.effect as { target?: Element | null } | null)?.target;
    return !(target && panel && target !== panel && panel.contains(target));
  });
}

/** How often a close whose `afterLeave` has come is looked at again while a transition still runs on the dialog: about a frame. */
const SETTLE_POLL_MS = 16;

type Close = { timer: number; reported: boolean; removed: boolean };

function report(c: Close, onAfterClose: (() => void) | undefined) {
  if (c.reported) return;
  c.reported = true;
  onAfterClose?.();
}

export interface LeaveWatchdog {
  /** For Headless UI's `Dialog`: changes when a stuck dialog is removed. */
  key: number;
  /** For the panel's `TransitionChild`, in place of `onAfterClose`. */
  afterLeave: () => void;
}

/**
 * `ref` is on Headless UI's `Dialog`, the element that holds the backdrop and
 * the panel, `panelRef` is on its `DialogPanel`, and `open` is what that
 * `Dialog` is given. `leaveMs` is the leave's default length, the panel's and
 * the backdrop's, whichever is longer.
 */
export function useLeaveWatchdog(
  ref: React.RefObject<HTMLElement | null>,
  panelRef: React.RefObject<HTMLElement | null>,
  open: boolean,
  leaveMs: number,
  onAfterClose?: () => void,
): LeaveWatchdog {
  const [key, setKey] = React.useState(0);
  const latest = React.useRef({ onAfterClose, leaveMs });
  React.useEffect(() => {
    latest.current = { onAfterClose, leaveMs };
  });

  /* The close being watched: `null` while open, and once a removal has
     reported. Kept after Headless UI removes the dialog itself, so a late
     `afterLeave` still counts. */
  const close = React.useRef<Close | null>(null);
  const opened = React.useRef(open);

  /* Headless UI can call `afterLeave` before the leave has run. Under load its
     one read of the transitions can come before the closing classes reach the
     page; it finds none and ends the leave there, while the panel is still
     opaque, and its transitions then run on screen until the dialog is
     removed. So the report waits until no transition runs on the dialog's
     own parts, the backdrop and the panel, or it has gone. Abandoned,
     unreported, if the close stops being watched. */
  const afterLeave = React.useCallback(() => {
    const c = close.current;
    if (!c) return;
    const settle = () => {
      if (close.current !== c || c.reported) return;
      const root = ref.current;
      if (root?.isConnected && leaveRunning(root, panelRef.current)) {
        window.setTimeout(settle, SETTLE_POLL_MS);
        return;
      }
      report(c, latest.current.onAfterClose);
    };
    settle();
  }, [ref, panelRef]);

  React.useEffect(() => {
    if (open) {
      opened.current = true;
      return;
    }
    if (!opened.current) return;
    opened.current = false;
    const c: Close = { timer: 0, reported: false, removed: false };
    close.current = c;
    const check = () => {
      const root = ref.current;
      /* Gone: Headless UI removed it, after its `afterLeave`. */
      if (!root?.isConnected) return;
      if (leaveRunning(root, panelRef.current)) {
        c.timer = window.setTimeout(check, LEAVE_MARGIN_MS);
        return;
      }
      c.removed = true;
      setKey((k) => k + 1);
    };
    c.timer = window.setTimeout(check, latest.current.leaveMs + LEAVE_MARGIN_MS);
    return () => {
      window.clearTimeout(c.timer);
      if (close.current === c) close.current = null;
    };
  }, [open, ref, panelRef]);

  /* After the remount has committed, so `onAfterClose` finds the dialog gone. */
  React.useLayoutEffect(() => {
    const c = close.current;
    if (!c?.removed) return;
    close.current = null;
    report(c, latest.current.onAfterClose);
  }, [key]);

  return { key, afterLeave };
}
