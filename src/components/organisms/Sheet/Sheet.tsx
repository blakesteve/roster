import * as React from "react";
import {
  Description,
  Dialog as HeadlessDialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  TransitionChild,
} from "@headlessui/react";
import { cn } from "../../../lib/utils";
import { useDarkScope } from "../../../internal/popup";
import { useReducedMotion } from "../../../internal/motion";
import { lockPage } from "../../../internal/page-inert";
import {
  exceedsSheetTapSlop,
  sheetDragOutcome,
  sheetReleaseVelocity,
  type SheetDragSample,
} from "./sheet-drag";

export interface SheetProps {
  isOpen: boolean;
  /** Called by Escape, a backdrop click, the close button and a dismissing drag. */
  onClose: () => void;
  /**
   * Called once the leave transition has finished and the sheet is gone.
   *
   * Clear the sheet's content here rather than in `onClose`. Cleared in
   * `onClose`, it empties while it is still sliding out.
   */
  onAfterClose?: () => void;
  /**
   * The sheet's accessible name, rendered as an `h2`. Required, because a
   * dialog without a name is announced as "dialog" and nothing else.
   *
   * Changing it while the sheet is open counts as a content swap: focus moves
   * to the new title so a screen reader announces it. Not while `busy`: a
   * title that changes during loading is a provisional one being refined, and
   * the reader keeps their place.
   */
  title: string;
  /** Hides the title visually. It stays the accessible name. */
  hideTitle?: boolean;
  /** Wired to the dialog's `aria-describedby`. */
  description?: React.ReactNode;
  /** A slot in the header, before the close button: previous and next, say. */
  actions?: React.ReactNode;
  /**
   * The sheet's width from 768px up, where it centers. A number is px. Below
   * 768px the sheet is always full width.
   */
  maxWidth?: number | string;
  /** What receives focus on open. Defaults to the close button. */
  initialFocus?: React.RefObject<HTMLElement | null>;
  /**
   * Where focus goes on close, over whatever opened the sheet.
   *
   * A sheet opened on page load from a deep link has no opener, so without
   * this focus falls to `<body>`.
   */
  returnFocus?: React.RefObject<HTMLElement | null> | HTMLElement | null;
  /** Sets `aria-busy` on the content region while its content loads. */
  busy?: boolean;
  /** Drag the handle or header down to dismiss. The close button stays either way. */
  dragToDismiss?: boolean;
  /**
   * Counts as a content swap when it changes, like `title` does. For content
   * that changes under an unchanged title.
   */
  contentKey?: React.Key;
  /** Applied to the panel. */
  className?: string;
  children: React.ReactNode;
}

/* Two whole sets of transition classes rather than one set with
   `motion-reduce:` overrides, because the reduced set is not a smaller version
   of the full one: it animates a different property. Picking one is easier to
   read, and to test, than canceling five utilities in the other.

   Both leave `translate` at `--rst-sheet-drag` while open. A drag writes that
   property, and the leave transition starts from wherever it has got to: the
   slide goes from there to `translate-y-full`, the fade leaves the sheet where
   the finger put it and fades it. Neither jumps. */
const PANEL_SLIDE =
  "rst:transition-transform rst:duration-(--roster-sheet-enter-duration) rst:ease-(--roster-sheet-enter-easing) rst:data-leave:duration-(--roster-sheet-leave-duration) rst:data-leave:ease-(--roster-sheet-leave-easing) rst:data-closed:translate-y-full";
const PANEL_FADE =
  "rst:transition-opacity rst:duration-(--roster-sheet-fade-duration) rst:ease-out rst:data-closed:opacity-0";
const BACKDROP_SLIDE =
  "rst:transition-opacity rst:duration-(--roster-sheet-enter-duration) rst:ease-out rst:data-leave:duration-(--roster-sheet-leave-duration) rst:data-closed:opacity-0";
const BACKDROP_FADE =
  "rst:transition-opacity rst:duration-(--roster-sheet-fade-duration) rst:ease-out rst:data-closed:opacity-0";

const FIELD_SELECTOR = [
  "input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=reset]):not([type=range]):not([type=color]):not([type=file]):not([type=image])",
  "textarea",
  "select",
  "[contenteditable]:not([contenteditable=false])",
].join(",");

function resolveElement(
  target: SheetProps["returnFocus"],
): HTMLElement | null {
  if (!target) return null;
  return "current" in target ? target.current : target;
}

/**
 * Sends focus to `returnFocus` when the sheet unmounts.
 *
 * Rendered INSIDE the panel on purpose. Headless UI restores focus to the
 * opener from its focus trap's unmount, in a microtask. React runs a deleted
 * tree's cleanups parent first, so a cleanup below the trap queues its
 * microtask after the trap's and runs second. Placed above the trap, this
 * would focus the target and then watch Headless UI take focus back.
 */
function ReturnFocusOnUnmount({ target }: { target: SheetProps["returnFocus"] }) {
  const latest = React.useRef(target);
  const unmounted = React.useRef(false);
  React.useEffect(() => {
    latest.current = target;
  });
  React.useEffect(() => {
    /* Reset on every mount: StrictMode unmounts and remounts once in
       development, and without this its pretend unmount would move focus. */
    unmounted.current = false;
    return () => {
      unmounted.current = true;
      queueMicrotask(() => {
        if (!unmounted.current) return;
        const el = resolveElement(latest.current);
        if (el?.isConnected) el.focus();
      });
    };
  }, []);
  return null;
}

/**
 * The close glyph, drawn inline. Not Font Awesome: importing `faXmark` here
 * would bring the Font Awesome runtime to every route that opens a sheet and
 * does not already pay for it.
 */
function CloseGlyph() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 20 20"
      className="rst:h-5 rst:w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  );
}

type DragState = {
  pointerId: number;
  x0: number;
  y0: number;
  dy: number;
  phase: "pending" | "dragging" | "ignored";
  samples: SheetDragSample[];
};

/**
 * A panel anchored to the bottom of the screen, for detail that should not
 * take the reader off the page: full width on a phone, centered at `maxWidth`
 * from 768px.
 *
 * Three stacked parts, and only the last scrolls: a drag handle, a header with
 * the title, the `actions` slot and a close button, and the content. The header
 * is a sibling of the scroller rather than sticky inside it, so it can never
 * cover the element that has focus.
 *
 * Built on Headless UI's `Dialog`, so the focus trap, Escape and the scroll
 * lock are its. The rest of the page is made `inert` and `aria-hidden` by
 * Headless UI and Roster together, every child of `<body>` but the dialog
 * layer and the toast host. The scroll lock pads `<html>`
 * for the scrollbar it hides; a fixed element elsewhere on the page can still
 * shift by that width.
 *
 * Renders an empty `<span hidden>` where it is placed, to find out whether it
 * sits inside a scoped `.dark` subtree and which part of the page it was
 * opened from. The sheet itself is portaled to `<body>`, so it could not tell
 * otherwise.
 *
 * The bottom padding includes `env(safe-area-inset-bottom)`, which is 0 unless
 * the page's viewport meta sets `viewport-fit=cover`.
 */
const Sheet = ({
  isOpen,
  onClose,
  onAfterClose,
  title,
  hideTitle = false,
  description,
  actions,
  maxWidth = 560,
  initialFocus,
  returnFocus,
  busy = false,
  dragToDismiss = true,
  contentKey,
  className,
  children,
}: SheetProps) => {
  const { ref: scopeRef, inDarkScope } = useDarkScope<HTMLSpanElement>();
  const reducedMotion = useReducedMotion();

  /* Headless UI marks only the part of the page the sheet is written in;
     `lockPage` marks the rest, the header and footer beside it, and leaves the
     toast host live. The scope span is where the sheet is written, which is
     how it finds the part to leave to Headless UI. */
  React.useLayoutEffect(() => {
    if (!isOpen) return;
    return lockPage(scopeRef.current);
  }, [isOpen, scopeRef]);

  const panelRef = React.useRef<HTMLDivElement>(null);
  const handleRef = React.useRef<HTMLDivElement>(null);
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();

  /* ── Content swap ─────────────────────────────────────────────────────────
     Only a change seen while the sheet was ALREADY open is a swap. A consumer
     that sets new content and opens in the same render is opening, and focus
     belongs on the close button then, not the title. */
  const seen = React.useRef({ title, contentKey, open: isOpen, busy });
  React.useEffect(() => {
    const previous = seen.current;
    seen.current = { title, contentKey, open: isOpen, busy };
    if (!previous.open || !isOpen) return;
    const keyChanged = previous.contentKey !== contentKey;
    /* A title that changes while the content was loading is the provisional
       title being refined, not new content. */
    const titleChanged = previous.title !== title && !previous.busy;
    if (!keyChanged && !titleChanged) return;
    titleRef.current?.focus();
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [title, contentKey, isOpen, busy]);

  /* ── Touch devices ────────────────────────────────────────────────────────
     Headless UI skips `initialFocus` on a coarse pointer and focuses the dialog
     element instead, so the keyboard does not pop up over a sheet the reader
     has not touched yet. That is right for a text field and wrong for the close
     button, which opens no keyboard, so land where a mouse user lands. An
     explicit `initialFocus` is the consumer's call either way. */
  React.useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => {
      const panel = panelRef.current;
      const active = document.activeElement;
      if (!panel || (active && panel.contains(active))) return;
      (initialFocus?.current ?? closeRef.current)?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen, initialFocus]);

  /* ── On-screen keyboard ───────────────────────────────────────────────────
     `dvh` does not shrink for the iOS keyboard, so a field near the bottom of
     a tall sheet ends up under it. While a field inside has focus, the cap
     follows the visual viewport instead. */
  const [keyboardCap, setKeyboardCap] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (!isOpen) return;
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => {
      const active = document.activeElement;
      const inField =
        !!active &&
        !!panelRef.current?.contains(active) &&
        active.matches(FIELD_SELECTOR);
      setKeyboardCap(inField ? Math.round(viewport.height) : null);
    };
    viewport.addEventListener("resize", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    return () => {
      viewport.removeEventListener("resize", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
      setKeyboardCap(null);
    };
  }, [isOpen]);

  /* ── Drag to dismiss ──────────────────────────────────────────────────────
     Starts only on the handle and the header, never the content, so reading
     never turns into dismissing and the scroll lock never fights the gesture.
     The offset goes to a custom property rather than to `transform`, so the
     class-based leave transition can take over from it. */
  const drag = React.useRef<DragState | null>(null);
  const suppressClick = React.useRef(false);
  const openRef = React.useRef(isOpen);
  React.useEffect(() => {
    openRef.current = isOpen;
  }, [isOpen]);

  const setOffset = (px: number) => {
    panelRef.current?.style.setProperty("--rst-sheet-drag", `${px}px`);
  };

  const endDrag = (outcome: "close" | "stay") => {
    const panel = panelRef.current;
    drag.current = null;
    if (!panel) return;
    delete panel.dataset.dragging;
    if (outcome === "close") {
      onClose();
      /* The offset stays for the leave to start from. If the consumer
         refused the close (unsaved changes, say), the sheet is still open a
         frame later and goes back up. */
      requestAnimationFrame(() => {
        if (openRef.current && !drag.current) setOffset(0);
      });
    } else {
      setOffset(0);
    }
  };

  /* Closed by something else mid-drag, going back in history for instance:
     let go, so the leave starts from wherever the sheet is. */
  React.useEffect(() => {
    if (!isOpen && drag.current) {
      drag.current = null;
      if (panelRef.current) delete panelRef.current.dataset.dragging;
    }
    /* Reopened while still leaving: Headless UI keeps the same panel, and it
       must not open where the last drag left it. */
    if (isOpen && !drag.current) setOffset(0);
  }, [isOpen]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    /* One drag at a time. A second finger would otherwise replace the first
       drag's state and strand the sheet part-way down. */
    if (drag.current) return;
    suppressClick.current = false;
    if (!dragToDismiss || !isOpen) return;
    /* A mouse drags from the handle only. The header's title is text someone
       may want to select, and a mouse has no other way to do that. */
    if (event.pointerType === "mouse") {
      if (event.button !== 0) return;
      if (!handleRef.current?.contains(event.target as Node)) return;
    }
    drag.current = {
      pointerId: event.pointerId,
      x0: event.clientX,
      y0: event.clientY,
      dy: 0,
      phase: "pending",
      samples: [{ t: event.timeStamp, y: event.clientY }],
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || event.pointerId !== state.pointerId) return;
    const dx = event.clientX - state.x0;
    const dy = event.clientY - state.y0;

    if (state.phase === "pending") {
      if (!exceedsSheetTapSlop(dx, dy)) return;
      /* Axis lock: mostly sideways by the time it stopped being a tap, so it
         is a swipe meant for something else. */
      if (Math.abs(dx) > Math.abs(dy)) {
        state.phase = "ignored";
        return;
      }
      state.phase = "dragging";
      /* Past the slop, whatever button the drag started on must not click. */
      suppressClick.current = true;
      /* Captured from here, not from pointerdown: captured earlier, a tap's
         click would land on the drag zone rather than the button under it.
         It throws for a pointer the browser no longer considers active, and
         the drag works without it, only less well off the zone's edge. */
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* keep dragging uncaptured */
      }
      if (panelRef.current) panelRef.current.dataset.dragging = "";
    }
    if (state.phase !== "dragging") return;

    state.dy = dy;
    state.samples.push({ t: event.timeStamp, y: event.clientY });
    if (state.samples.length > 32) state.samples.shift();
    setOffset(Math.max(0, dy));
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || event.pointerId !== state.pointerId) return;
    if (state.phase !== "dragging") {
      drag.current = null;
      return;
    }
    state.samples.push({ t: event.timeStamp, y: event.clientY });
    const dy = event.clientY - state.y0;
    const height = panelRef.current?.getBoundingClientRect().height ?? 0;
    endDrag(sheetDragOutcome(dy, height, sheetReleaseVelocity(state.samples)));
  };

  const onPointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || event.pointerId !== state.pointerId) return;
    if (state.phase === "dragging") endDrag("stay");
    else drag.current = null;
  };

  const onClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    /* `detail` is 0 for a click from the keyboard or assistive technology,
       which no drag produced. A touch drag fires no click after it, so the
       flag can still be set when one of those arrives. */
    if (!suppressClick.current || event.detail === 0) return;
    suppressClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  const panelStyle = {
    "--rst-sheet-max-width":
      typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth,
    ...(keyboardCap !== null && { "--rst-sheet-keyboard-cap": `${keyboardCap}px` }),
  } as React.CSSProperties;

  return (
    <>
      <span ref={scopeRef} hidden />
      {/* `open` goes to the Dialog itself, not to an outer `<Transition show>`.
          Wrapped in one, which is how `Dialog` is built, Headless UI 2.2.9
          loses track of the page behind it and marks nothing `inert`: the
          focus trap holds, but a screen reader's virtual cursor walks out of
          the sheet into the page. Measured in Chromium both ways. The
          `TransitionChild` below is where the leave is observed instead. */}
      <HeadlessDialog
        open={isOpen}
        as="div"
        onClose={onClose}
        initialFocus={initialFocus ?? closeRef}
        className={cn(
          "rst:font-ui rst:relative rst:z-50 rst:focus:outline-hidden",
          inDarkScope && "dark",
        )}
      >
        <DialogBackdrop
          transition
          data-testid="sheet-backdrop"
          className={cn(
            "rst:fixed rst:inset-0 rst:bg-(--roster-sheet-backdrop)",
            reducedMotion ? BACKDROP_FADE : BACKDROP_SLIDE,
          )}
        />
        <div className="rst:fixed rst:inset-0 rst:flex rst:items-end rst:justify-center">
          <TransitionChild afterLeave={onAfterClose}>
            <DialogPanel
              ref={panelRef}
              style={panelStyle}
              data-testid="sheet-panel"
              className={cn(
                /* 92dvh, or the visual viewport while the keyboard is up,
                   whichever is shorter. */
                "rst:relative rst:flex rst:max-h-[min(92dvh,var(--rst-sheet-keyboard-cap,92dvh))] rst:w-full rst:flex-col",
                "rst:md:max-w-(--rst-sheet-max-width)",
                "rst:rounded-t-2xl rst:border rst:border-b-0 rst:elevation-overlay",
                "rst:bg-[var(--roster-popover-bg)] rst:border-[var(--roster-popover-border)] rst:text-[var(--roster-popover-text)]",
                /* The ring offset paints the gap between a focused control and
                   its ring, so it has to be this surface, not the page. */
                "rst:[--roster-ring-offset:var(--roster-popover-bg)]",
                "rst:pb-[env(safe-area-inset-bottom)]",
                "rst:translate-y-[var(--rst-sheet-drag,0px)]",
                reducedMotion ? PANEL_FADE : PANEL_SLIDE,
                "rst:data-dragging:transition-none",
                className,
              )}
            >
              <div
                data-testid="sheet-drag-zone"
                className={cn("rst:shrink-0", dragToDismiss && "rst:touch-none")}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
                onClickCapture={onClickCapture}
              >
                <div
                  ref={handleRef}
                  aria-hidden="true"
                  data-testid="sheet-handle"
                  className={cn(
                    /* The grip sits near the top edge, where a sheet's grabber
                       is expected, inside a 44px strip. The header below pulls
                       up over the strip's lower part, so a touch there drags
                       too (the header is a drag zone) and a mouse drags from
                       the 32px above it, the full width of the sheet. */
                    "rst:flex rst:h-11 rst:items-start rst:justify-center rst:pt-2",
                    dragToDismiss && "rst:cursor-grab rst:active:cursor-grabbing",
                  )}
                >
                  <span className="rst:h-1 rst:w-10 rst:rounded-full rst:bg-current rst:opacity-30" />
                </div>
                <div className="rst:-mt-3 rst:flex rst:items-start rst:gap-2 rst:px-5 rst:pb-4">
                  {/* pt-2 plus text-lg's own 28px line puts the first line's
                      middle at 22px, level with the 44px close button's. */}
                  <div className="rst:min-w-0 rst:flex-1 rst:pt-2">
                    <DialogTitle
                      as="h2"
                      id={titleId}
                      ref={titleRef}
                      tabIndex={-1}
                      className={cn(
                        "rst:text-lg rst:font-semibold rst:text-inherit rst:focus:outline-hidden",
                        hideTitle && "rst:sr-only",
                      )}
                    >
                      {title}
                    </DialogTitle>
                    {description && (
                      <Description
                        as="p"
                        className="rst:mt-1 rst:text-sm rst:text-inherit rst:opacity-75"
                      >
                        {description}
                      </Description>
                    )}
                  </div>
                  {actions && (
                    /* 44px tall like the close button, so actions of any
                       height center on the same line as it. */
                    <div className="rst:flex rst:h-11 rst:shrink-0 rst:items-center rst:gap-1">
                      {actions}
                    </div>
                  )}
                  <button
                    ref={closeRef}
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="rst:inline-flex rst:size-11 rst:shrink-0 rst:-mr-2 rst:cursor-pointer rst:items-center rst:justify-center rst:rounded-md rst:bg-transparent rst:text-inherit rst:opacity-60 rst:transition-opacity rst:hover:opacity-100 rst:focus:outline-hidden rst:focus-visible:opacity-100 rst:focus-visible:ring-2 rst:focus-visible:ring-ring rst:focus-visible:ring-offset-2 rst:ring-offset-background"
                  >
                    <CloseGlyph />
                  </button>
                </div>
              </div>
              {/* A tab stop and a named region, so its content can be scrolled
                  from the keyboard: focus starts in the header, outside this
                  scroller, and Safari does not make a scroller focusable on
                  its own. */}
              <div
                ref={contentRef}
                role="region"
                aria-labelledby={titleId}
                tabIndex={0}
                data-testid="sheet-content"
                aria-busy={busy || undefined}
                className="rst:min-h-0 rst:flex-1 rst:overflow-y-auto rst:overscroll-contain rst:px-5 rst:pb-4 rst:focus:outline-hidden rst:ring-inset rst:focus-visible:ring-2 rst:focus-visible:ring-ring"
              >
                {children}
              </div>
              <ReturnFocusOnUnmount target={returnFocus} />
            </DialogPanel>
          </TransitionChild>
        </div>
      </HeadlessDialog>
    </>
  );
};

export { Sheet };
