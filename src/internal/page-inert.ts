/**
 * Makes the page behind an open `Dialog` or `Sheet` inert and hidden from
 * assistive technology, all of it.
 *
 * Internal, and not exported from the package.
 *
 * Headless UI does part of this and not the rest. It marks exactly one child
 * of `<body>`: the one the dialog is rendered from, found with
 * `closest("body > *:not(#headlessui-portal-root)")`, plus the dialog's
 * sibling portals. A page laid out as `body > header, main, footer` gets only
 * its `<main>` marked, and the header and footer stay reachable by a screen
 * reader's virtual cursor. A toast host mounted inside that one child goes the
 * other way: it is marked, and a toast shown over the dialog is not announced.
 *
 * So while any lock is held, every direct child of `<body>` is `inert` and
 * `aria-hidden`, except three:
 *
 * - Headless UI's portal root, which holds the dialog itself and any dialog
 *   stacked on it. Headless UI handles what is inside it.
 * - Anything carrying `data-roster-toaster`, which `Toaster` renders into.
 * - The child each lock was taken from. That one is Headless UI's, and it is
 *   left to Headless UI because two owners of one element can not both
 *   restore it: each records what it found, and whichever restores second
 *   writes back the other's `inert`, leaving the page stuck. Which one goes
 *   second depends on render timing, so skipping the element is the only
 *   order that is always right.
 *
 * The same reasoning covers an element that is already `inert` when a lock
 * reaches it: someone else marked it (a dialog built on Headless UI directly,
 * say, with a Roster one opened inside it) and will restore it. It stays
 * theirs until the last lock is released, even if they let go of it in the
 * meantime. Headless UI does let go and re-mark when the dialog on top
 * changes, and marking it in that gap would make a second owner after all.
 * The cost is that such an element can be live while a lock is held; the
 * alternative is a page left inert after every dialog has closed.
 *
 * Locks are counted. The page is marked on the first and restored on the
 * last. Each element the lock marked gets back the `aria-hidden` it had and
 * is made not inert, which is what it was, so a page that marked something
 * itself keeps it.
 */

const EXEMPT_ATTR = "data-roster-toaster";
const HEADLESS_PORTAL_ROOT = "headlessui-portal-root";

/** Put on the element `Toaster` renders into, so a toast stays announced. */
export const TOASTER_MARKER = { [EXEMPT_ATTR]: "" } as const;

/* Each lock is the body child it was taken from. Duplicates are fine: two
   dialogs opened from the same region are two locks on it. */
const locks: (Element | null)[] = [];
/* Each marked element's `aria-hidden` from before, `null` for none. Its
   `inert` is not recorded: only an element that was not inert is ever marked,
   so `false` is what it had. */
const marked = new Map<HTMLElement, string | null>();
/* Found already inert while locked: someone else's until the last release. */
const theirs = new Set<HTMLElement>();
let observer: MutationObserver | null = null;

function exempt(el: HTMLElement): boolean {
  return (
    el.id === HEADLESS_PORTAL_ROOT ||
    el.hasAttribute(EXEMPT_ATTR) ||
    locks.includes(el)
  );
}

function mark(el: HTMLElement) {
  marked.set(el, el.getAttribute("aria-hidden"));
  el.inert = true;
  el.setAttribute("aria-hidden", "true");
}

function restore(el: HTMLElement) {
  if (!marked.has(el)) return;
  const ariaHidden = marked.get(el)!;
  marked.delete(el);
  el.inert = false;
  if (ariaHidden === null) el.removeAttribute("aria-hidden");
  else el.setAttribute("aria-hidden", ariaHidden);
}

/* Brings the page to what the current locks say, from any starting point.
   Called on every lock, release, and change to `<body>`'s children. */
function sync() {
  const body = document.body;
  for (const el of Array.from(marked.keys())) {
    /* Gone from `<body>`, or it became exempt: give it back now, so an
       element moved elsewhere does not carry this page's `inert` with it. */
    if (!locks.length || el.parentElement !== body || exempt(el)) restore(el);
  }
  if (locks.length) {
    for (const el of Array.from(body.children)) {
      if (!(el instanceof HTMLElement) || marked.has(el) || exempt(el)) continue;
      if (el.inert) theirs.add(el);
      else if (!theirs.has(el)) mark(el);
    }
  }
  /* Something mounted under `<body>` while a dialog is open (a portal, a
     widget, the toast host itself) is caught here rather than left live. */
  if (!locks.length) theirs.clear();
  if (locks.length && !observer) {
    observer = new MutationObserver(sync);
    observer.observe(body, { childList: true });
  } else if (!locks.length && observer) {
    observer.disconnect();
    observer = null;
  }
}

/**
 * Takes a lock for a dialog rendered at `anchor`: any element in the tree
 * where the dialog is written, not inside its portal. Returns the release,
 * which is safe to call more than once.
 */
export function lockPage(anchor: Element | null): () => void {
  if (typeof document === "undefined") return () => {};
  const owner = anchor?.closest("body > *") ?? null;
  locks.push(owner);
  sync();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks.splice(locks.indexOf(owner), 1);
    sync();
  };
}
