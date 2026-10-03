import * as React from "react";
import { Button, type ButtonProps } from "../../atoms/Button/Button";
import { cn } from "../../../lib/utils";
import { prefersReducedMotion } from "../../../internal/motion";
import {
  canScrollNext,
  canScrollPrev,
  currentIndex,
  nearestIndex,
  overflows,
  pageTarget,
  snapPosition,
  type CarouselGeometry,
  CAROUSEL_DRAG_THRESHOLD,
} from "./carousel-math";
import { FLUID_CLASSES, FLUID_ITEM_WIDTH, perViewVars } from "./carousel-layout";

/** Items per view at each width, from Roster's breakpoints up. */
export interface CarouselPerView {
  base: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

export interface CarouselHandle {
  /** Snaps item `i` into place. Instant under reduced motion, whatever is asked. */
  scrollToIndex: (index: number, options?: { behavior?: ScrollBehavior }) => void;
  /** What the previous arrow does: back one page. */
  scrollPrev: () => void;
  /** What the next arrow does: on one page. */
  scrollNext: () => void;
}

export interface CarouselArrowsRender {
  /** The previous arrow, or `null` while the row fits and there is nothing to page. */
  prev: React.ReactNode;
  next: React.ReactNode;
  /** The "2 of 5" readout when `showPosition` is on, otherwise `null`. */
  position: React.ReactNode;
}

export interface CarouselProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "aria-label" | "aria-labelledby"> {
  /** The row's name. One of this or `aria-labelledby` is required. */
  "aria-label"?: string;
  /** The id of the heading that names the row. */
  "aria-labelledby"?: string;
  /** One child per item. Each is wrapped in the list item the row snaps to. */
  children: React.ReactNode;
  /**
   * Fixed mode: every item is this wide (a number is px). The row overflows
   * once the items and gaps outgrow the box, and the next item peeks from then
   * on.
   */
  itemWidth?: number | string;
  /**
   * Fluid mode: how many items are in view at each width, and the component
   * sizes them. A fraction is the peek: `1.3` is one item and a third of the
   * next. Ignored when `itemWidth` is set.
   */
  perView?: number | CarouselPerView;
  /** Space between items. A number is px. */
  gap?: number | string;
  /**
   * The inline padding at each end, and the scroll padding a snapped item
   * lines up with. Match the page's own gutter so a snapped item sits under
   * the text above it. A number is px.
   */
  gutter?: number | string;
  /**
   * Pulls the row out by one gutter on each side, so it runs to the edges of
   * its container while the first item still lines up with the text.
   */
  bleed?: boolean;
  /** Where an item settles. */
  snap?: "start" | "center";
  /** `mandatory` always settles on an item; `proximity` only near one. */
  snapStrictness?: "mandatory" | "proximity";
  /** One item per swipe, for a gallery of one per view (`scroll-snap-stop: always`). */
  oneAtATime?: boolean;
  /**
   * When the arrows show. `hover`, the default, is wherever a pointer can
   * hover: a touch-only screen swipes instead, and gets no arrows to aim at.
   */
  arrows?: "hover" | "always" | "none";
  /**
   * `controls`, the default, puts the arrows on a line of their own above the
   * row, where they never cover an item or the peek and never fight a drag.
   * `overlay` floats them over the row's two ends and takes no space.
   * `renderArrows` overrides both.
   */
  arrowPlacement?: "controls" | "overlay";
  /**
   * Put the arrows (and the position readout) anywhere: a heading line beside
   * a "See all" link, say. What it returns replaces the default controls line,
   * so a heading rendered here sits above the row as before.
   */
  renderArrows?: (parts: CarouselArrowsRender) => React.ReactNode;
  /** The previous arrow's accessible name. Defaults to "Previous" and the row's label. */
  prevLabel?: string;
  /** The next arrow's accessible name. Defaults to "Next" and the row's label. */
  nextLabel?: string;
  /** Replaces the previous arrow's chevron. */
  prevIcon?: React.ReactNode;
  /** Replaces the next arrow's chevron. */
  nextIcon?: React.ReactNode;
  /** Passed to both arrow buttons, over the defaults. */
  arrowButtonProps?: Omit<ButtonProps, "onClick" | "disabled" | "children" | "aria-label">;
  /**
   * Fades the edge on a side with more to see. Never at an end, so the last
   * item is never faded.
   */
  fade?: boolean;
  /** Shows the native scrollbar. Hidden by default; the arrows and the mouse drag stand in for it. */
  scrollbar?: boolean;
  /**
   * Shows "2 of 5", for a gallery of one item per view. It is also each item's
   * name, and a change is announced politely.
   */
  showPosition?: boolean;
  /** The first item wholly in view, whenever it changes. */
  onIndexChange?: (index: number) => void;
  /** Whether the row can move each way, whenever that changes. */
  onScrollStateChange?: (state: { canScrollPrev: boolean; canScrollNext: boolean }) => void;
  /** Classes for each list item. */
  itemClassName?: string;
  /** Classes for the scrolling list. `className` is the outer wrapper. */
  listClassName?: string;
}


/**
 * How long a smooth settle may take before snapping is put back regardless,
 * in ms, for a glide of `distance` px. Chrome's glide lengthens with the
 * distance (about a second for 3000px), and putting snapping back before it
 * arrives would let the browser re-snap mid-way. Only a backstop: `scrollend`
 * normally ends the settle first.
 */
const settleFallbackMs = (distance: number) => Math.min(3000, 500 + distance * 0.35);

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable]:not([contenteditable="false"])';


const length = (value: number | string) => (typeof value === "number" ? `${value}px` : value);

function px(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/* Arrows shown only where a pointer can hover. A media query rather than
   script, so the server render already has it right for the device. */
const ON_HOVER_DEVICES = "rst:hidden rst:[@media(any-hover:hover)]:inline-flex";
const LINE_ON_HOVER_DEVICES = "rst:hidden rst:[@media(any-hover:hover)]:flex";

function Chevron({ direction }: { direction: "prev" | "next" }) {
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
      strokeLinejoin="round"
    >
      <path d={direction === "prev" ? "M12.5 4.5 7 10l5.5 5.5" : "M7.5 4.5 13 10l-5.5 5.5"} />
    </svg>
  );
}

const INITIAL_STATE = {
  overflowing: null,
  canScrollPrev: false,
  canScrollNext: false,
  index: 0,
} as const satisfies Record<string, unknown>;

type ScrollState = {
  /* `null` until measured, which is the whole of the server render. */
  overflowing: boolean | null;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  index: number;
};

/**
 * A sideways row of items: a row of cards, a selection strip, a gallery of one
 * per view.
 *
 * Native first. The row is a real scroll container with CSS scroll snap, so
 * touch, trackpad, Shift with the wheel and focus all scroll it without
 * script, and every item is in the server render: no clones, no
 * virtualization, no loop, and nothing moves on its own.
 *
 * Script adds what a mouse is missing. Pressing and dragging moves the row one
 * to one and settles it on the nearest item; a drag past 6px drops the one
 * click that ends it and nothing else. Previous and next arrows page by as
 * many items as are wholly in view, measured each time, and are `disabled`,
 * out of the tab order, at an end. A vertical wheel over the row scrolls the
 * page, and sideways overscroll is contained so a swipe at an end can't go
 * back a page.
 *
 * Keyboard focus moving onto an item snaps that item into place at once. If
 * no item can take focus, the list itself is the tab stop, so a keyboard can
 * still scroll it.
 *
 * Under reduced motion every programmatic scroll is instant: the arrows, the
 * settle after a drag, and `scrollToIndex`.
 *
 * Renders a `ul` named by `aria-label` or `aria-labelledby`, one `li` per
 * child. There is no carousel role and no slide role: nothing rotates.
 */
const Carousel = React.forwardRef<CarouselHandle, CarouselProps>(function Carousel(
  {
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    children,
    itemWidth,
    perView,
    gap = 12,
    gutter = 16,
    bleed = false,
    snap = "start",
    snapStrictness = "mandatory",
    oneAtATime = false,
    arrows = "hover",
    arrowPlacement = "controls",
    renderArrows,
    prevLabel,
    nextLabel,
    prevIcon,
    nextIcon,
    arrowButtonProps,
    fade = false,
    scrollbar = false,
    showPosition = false,
    onIndexChange,
    onScrollStateChange,
    itemClassName,
    listClassName,
    className,
    style,
    ...rest
  },
  ref,
) {
  const listRef = React.useRef<HTMLUListElement>(null);
  const listId = `${React.useId()}-list`;
  const items = React.Children.toArray(children);
  const count = items.length;

  const [state, setState] = React.useState<ScrollState>(INITIAL_STATE);
  /* The last state measured, so a change is found and reported outside the
     state updater: an updater may run during render, and twice. */
  const measured = React.useRef<ScrollState>(INITIAL_STATE);
  /* The text of the heading named by `aria-labelledby`, for the arrows'
     default names. Read after mount, since only the DOM has it. */
  const [labelledText, setLabelledText] = React.useState("");
  const [listIsTabStop, setListIsTabStop] = React.useState(false);

  const callbacks = React.useRef({ onIndexChange, onScrollStateChange });
  React.useEffect(() => {
    callbacks.current = { onIndexChange, onScrollStateChange };
  });

  const geometry = React.useCallback((): CarouselGeometry | null => {
    const list = listRef.current;
    if (!list) return null;
    const box = list.getBoundingClientRect();
    const css = getComputedStyle(list);
    const origin = box.left + list.clientLeft - list.scrollLeft;
    const boxes = Array.from(list.children).map((child) => {
      const r = child.getBoundingClientRect();
      return { start: r.left - origin, end: r.right - origin };
    });
    return {
      items: boxes,
      scrollLeft: list.scrollLeft,
      clientWidth: list.clientWidth,
      scrollWidth: list.scrollWidth,
      paddingStart: px(css.scrollPaddingInlineStart || css.scrollPaddingLeft),
      paddingEnd: px(css.scrollPaddingInlineEnd || css.scrollPaddingRight),
      align: snap,
    };
  }, [snap]);

  const measure = React.useCallback(() => {
    const g = geometry();
    if (!g) return;
    const next: ScrollState = {
      overflowing: overflows(g),
      canScrollPrev: canScrollPrev(g),
      canScrollNext: canScrollNext(g),
      index: g.items.length ? currentIndex(g) : 0,
    };
    const prev = measured.current;
    if (
      prev.overflowing === next.overflowing &&
      prev.canScrollPrev === next.canScrollPrev &&
      prev.canScrollNext === next.canScrollNext &&
      prev.index === next.index
    ) {
      return;
    }
    measured.current = next;
    setState(next);
    if (prev.index !== next.index) callbacks.current.onIndexChange?.(next.index);
    if (prev.canScrollPrev !== next.canScrollPrev || prev.canScrollNext !== next.canScrollNext) {
      callbacks.current.onScrollStateChange?.({
        canScrollPrev: next.canScrollPrev,
        canScrollNext: next.canScrollNext,
      });
    }
  }, [geometry]);

  /* Measured on scroll (once a frame), on any resize of the row or an item,
     whenever an item is added or swapped, and when the sizing props change. */
  const sizing = JSON.stringify([gap, gutter, itemWidth, perView]);
  React.useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    measure();
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };
    list.addEventListener("scroll", onScroll, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => measure());
    const observeAll = () => {
      observer?.observe(list);
      Array.from(list.children).forEach((child) => observer?.observe(child));
    };
    observeAll();
    /* Items swapped in at the same count are new nodes the resize observer
       has never seen. */
    const items = typeof MutationObserver === "undefined" ? null : new MutationObserver(() => {
      observeAll();
      measure();
    });
    items?.observe(list, { childList: true });
    return () => {
      list.removeEventListener("scroll", onScroll);
      observer?.disconnect();
      items?.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [measure, count, sizing]);

  /* The list is the tab stop only when nothing inside it can take focus, and
     only while there is somewhere to scroll. */
  React.useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    setListIsTabStop(!list.querySelector(FOCUSABLE));
    if (ariaLabelledBy) {
      const text = ariaLabelledBy
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent?.trim() ?? "")
        .filter(Boolean)
        .join(" ");
      setLabelledText(text);
    }
    /* `children` so an item that gains or loses a link is re-read. */
  }, [children, ariaLabelledBy]);

  /* ── Scrolling on request ─────────────────────────────────────────────── */

  /* Set while the row is carried by script (a drag or its settle), so snapping
     stays off until it is done and can't yank the row mid-way. */
  const carrying = React.useRef<{ timer: number; done: () => void; target: number } | null>(null);

  const releaseCarry = React.useCallback(() => {
    const list = listRef.current;
    const carry = carrying.current;
    if (!carry) return;
    carrying.current = null;
    window.clearTimeout(carry.timer);
    list?.removeEventListener("scrollend", carry.done);
    if (list) {
      list.style.scrollSnapType = "";
      delete list.dataset.settling;
    }
  }, []);

  /** Moves the row to `left`, then puts snapping back once it has arrived. */
  const settleTo = React.useCallback(
    (left: number, behavior: ScrollBehavior) => {
      const list = listRef.current;
      if (!list) return;
      releaseCarry();
      const instant = behavior !== "smooth" || prefersReducedMotion();
      if (instant || Math.abs(list.scrollLeft - left) < 1) {
        list.style.scrollSnapType = "none";
        list.scrollTo({ left, behavior: "instant" });
        list.style.scrollSnapType = "";
        return;
      }
      list.style.scrollSnapType = "none";
      list.dataset.settling = "";
      const done = () => releaseCarry();
      carrying.current = {
        timer: window.setTimeout(done, settleFallbackMs(Math.abs(list.scrollLeft - left))),
        done,
        target: left,
      };
      list.addEventListener("scrollend", done, { once: true });
      list.scrollTo({ left, behavior: "smooth" });
    },
    [releaseCarry],
  );

  const page = React.useCallback(
    (direction: 1 | -1) => {
      const g = geometry();
      if (!g) return;
      /* Mid-glide, page on from where the row is going, not from where it
         has got to, so two quick clicks are two whole pages. */
      const from = carrying.current ? { ...g, scrollLeft: carrying.current.target } : g;
      settleTo(pageTarget(from, direction), "smooth");
    },
    [geometry, settleTo],
  );

  React.useImperativeHandle(
    ref,
    () => ({
      scrollToIndex: (index, options) => {
        const g = geometry();
        if (!g || !g.items.length) return;
        const i = Math.min(Math.max(0, Math.round(index)), g.items.length - 1);
        settleTo(snapPosition(g, i), options?.behavior ?? "smooth");
      },
      scrollPrev: () => page(-1),
      scrollNext: () => page(1),
    }),
    [geometry, page, settleTo],
  );

  React.useEffect(() => releaseCarry, [releaseCarry]);

  /* ── Focus at an end ──────────────────────────────────────────────────────
     An arrow that reaches its end is disabled, and a disabled button can't
     hold focus: it would fall to the page. Hand it to the other arrow. */
  const prevRef = React.useRef<HTMLButtonElement>(null);
  const nextRef = React.useRef<HTMLButtonElement>(null);
  const arrowFocus = React.useRef<"prev" | "next" | null>(null);
  React.useLayoutEffect(() => {
    const was = arrowFocus.current;
    if (!was) return;
    const self = was === "prev" ? prevRef.current : nextRef.current;
    const other = was === "prev" ? nextRef.current : prevRef.current;
    const nowDisabled = was === "prev" ? !state.canScrollPrev : !state.canScrollNext;
    const active = document.activeElement;
    if (!nowDisabled) return;
    if (active !== self && active !== document.body && active !== null) return;
    if (other && !other.disabled) other.focus();
  }, [state.canScrollPrev, state.canScrollNext]);

  /* ── Mouse drag ───────────────────────────────────────────────────────────
     A mouse only. Touch and pen already scroll the row natively, with the
     system's own momentum, and script would only make that worse. */
  const drag = React.useRef<{
    pointerId: number;
    x0: number;
    scroll0: number;
    dragging: boolean;
  } | null>(null);
  /* The click that ends a drag lands on whatever was under the pointer. This
     drops that one click, and is cleared straight after, so the next click
     and every keyboard activation go through. */
  const dropClick = React.useRef(false);

  const onPointerDown = (event: React.PointerEvent<HTMLUListElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    if (!state.overflowing) return;
    releaseCarry();
    dropClick.current = false;
    drag.current = {
      pointerId: event.pointerId,
      x0: event.clientX,
      scroll0: event.currentTarget.scrollLeft,
      dragging: false,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLUListElement>) => {
    const d = drag.current;
    if (!d || event.pointerId !== d.pointerId) return;
    const list = event.currentTarget;
    const dx = event.clientX - d.x0;
    if (!d.dragging) {
      if (Math.abs(dx) <= CAROUSEL_DRAG_THRESHOLD) return;
      d.dragging = true;
      list.dataset.dragging = "";
      list.style.scrollSnapType = "none";
      window.getSelection?.()?.removeAllRanges();
      /* Captured from here, not from the press, so a plain click still lands
         on the item under it. */
      try {
        list.setPointerCapture(event.pointerId);
      } catch {
        /* drags uncaptured, only less well off the row's edge */
      }
    }
    list.scrollLeft = d.scroll0 - dx;
  };

  const endDrag = (event: React.PointerEvent<HTMLUListElement>) => {
    const d = drag.current;
    if (!d || event.pointerId !== d.pointerId) return;
    drag.current = null;
    if (!d.dragging) return;
    const list = event.currentTarget;
    delete list.dataset.dragging;
    dropClick.current = event.type === "pointerup";
    /* The click, if one comes, is dispatched with this pointerup. A timer
       clears the flag after it either way, so it never outlives the drag. */
    window.setTimeout(() => {
      dropClick.current = false;
    }, 0);
    const g = geometry();
    if (g) settleTo(snapPosition(g, nearestIndex(g)), "smooth");
    else list.style.scrollSnapType = "";
  };

  const onClickCapture = (event: React.MouseEvent<HTMLUListElement>) => {
    /* `detail` is 0 for a click from the keyboard or assistive technology,
       which no drag produced. */
    if (!dropClick.current || event.detail === 0) return;
    dropClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  /* No native drag of a link or an image out of the row: its ghost would
     replace the drag, and cancel the pointer. */
  const onDragStart = (event: React.DragEvent<HTMLUListElement>) => {
    if (state.overflowing) event.preventDefault();
  };

  /* ── Keyboard focus ───────────────────────────────────────────────────────
     Focus from the keyboard snaps its item into place at once. A mouse click
     focuses too, and must not move the row under the pointer, so only a
     visible focus counts. */
  const onFocus = (event: React.FocusEvent<HTMLUListElement>) => {
    const list = event.currentTarget;
    const target = event.target as HTMLElement;
    if (target === list || drag.current?.dragging) return;
    let visible = false;
    try {
      visible = target.matches(":focus-visible");
    } catch {
      visible = false;
    }
    if (!visible) return;
    const item = target.closest("[data-carousel-item]");
    if (!item || item.parentElement !== list) return;
    const g = geometry();
    if (!g) return;
    const index = Array.prototype.indexOf.call(list.children, item);
    settleTo(snapPosition(g, index), "instant");
  };

  /* ── Rendering ────────────────────────────────────────────────────────── */

  /* The readout follows the index once it has held still for a moment, so a
     drag across three photos is announced once, not three times. */
  const [shownIndex, setShownIndex] = React.useState(0);
  React.useEffect(() => {
    const timer = window.setTimeout(() => setShownIndex(state.index), 150);
    return () => window.clearTimeout(timer);
  }, [state.index]);

  const label = ariaLabel ?? labelledText;
  const named = (verb: string) => (label ? `${verb} ${label}` : verb);
  /* Rendered while unmeasured (on the server, and until the first layout
     effect), disabled, so a row that overflows, the usual case, gets its
     arrows in the first paint and nothing shifts. A row that turns out to fit
     drops them. */
  const showArrows = arrows !== "none" && state.overflowing !== false;
  const visibility = arrows === "hover" ? ON_HOVER_DEVICES : "rst:inline-flex";

  const arrowButton = (direction: "prev" | "next") => {
    const isPrev = direction === "prev";
    const { className: arrowClassName, ...buttonRest } = arrowButtonProps ?? {};
    return (
      <Button
        type="button"
        variant="outline"
        colorScheme="neutral"
        size="icon"
        {...buttonRest}
        aria-label={isPrev ? (prevLabel ?? named("Previous")) : (nextLabel ?? named("Next"))}
        aria-controls={listId}
        disabled={isPrev ? !state.canScrollPrev : !state.canScrollNext}
        onClick={() => page(isPrev ? -1 : 1)}
        ref={isPrev ? prevRef : nextRef}
        onFocus={() => {
          arrowFocus.current = direction;
        }}
        onBlur={(event: React.FocusEvent) => {
          /* Only a move somewhere else. Being disabled blurs with no target,
             and that is the case to recover from. */
          if (event.relatedTarget) arrowFocus.current = null;
        }}
        data-carousel-arrow={direction}
        className={cn(
          /* 44px, the target size, whatever the Button's own icon size is. */
          "rst:size-11 rst:shrink-0 rst:rounded-full",
          /* Over the row, a disabled arrow would sit on top of the first or
             last item for nothing, so it hides. Hidden is also out of the tab
             order and the accessibility tree, as disabled already was. */
          arrowPlacement === "overlay" &&
            !renderArrows &&
            "rst:bg-[var(--roster-popover-bg)] rst:elevation-raised rst:hover:bg-[var(--roster-popover-bg)] rst:disabled:invisible",
          visibility,
          arrowClassName,
        )}
      >
        {isPrev ? (prevIcon ?? <Chevron direction="prev" />) : (nextIcon ?? <Chevron direction="next" />)}
      </Button>
    );
  };

  const prev = showArrows ? arrowButton("prev") : null;
  const next = showArrows ? arrowButton("next") : null;
  const position = showPosition && count ? (
    /* `font-ui` here and not on the root: the readout is the only text the
       carousel owns. The items are the host's content, and not Roster's to
       restyle. */
    <p aria-live="polite" className="rst:font-ui rst:m-0 rst:text-sm rst:tabular-nums rst:opacity-75" data-carousel-position="">
      {shownIndex + 1} of {count}
    </p>
  ) : null;

  let controls: React.ReactNode = null;
  if (renderArrows) {
    controls = renderArrows({ prev, next, position });
  } else if (arrowPlacement === "controls" && (prev || position)) {
    controls = (
      <div
        className={cn(
          "rst:mb-2 rst:items-center rst:justify-end rst:gap-2",
          /* A line with only arrows in it takes no room where they can't show. */
          !position && arrows === "hover" ? LINE_ON_HOVER_DEVICES : "rst:flex",
        )}
        data-carousel-controls=""
      >
        {position && <div className="rst:mr-auto">{position}</div>}
        {prev}
        {next}
      </div>
    );
  }

  const fadeMask =
    fade && state.overflowing && (state.canScrollPrev || state.canScrollNext)
      ? `linear-gradient(to right, ${state.canScrollPrev ? "transparent, black 48px" : "black"}, ${
          state.canScrollNext ? "black calc(100% - 48px), transparent" : "black"
        })`
      : undefined;

  const fluid = itemWidth === undefined && perView !== undefined;
  const listStyle = {
    "--rst-cv-gap": length(gap),
    "--rst-cv-gutter": length(gutter),
    ...(fluid ? perViewVars(perView!) : {}),
    ...(fadeMask ? { maskImage: fadeMask, WebkitMaskImage: fadeMask } : {}),
  } as React.CSSProperties;

  const itemStyle: React.CSSProperties | undefined =
    itemWidth !== undefined ? { width: length(itemWidth) } : fluid ? { width: FLUID_ITEM_WIDTH } : undefined;

  return (
    <div className={cn("rst:min-w-0", className)} style={style} {...rest}>
      {controls}
      <div className="rst:relative">
        <ul
          ref={listRef}
          id={listId}
          role="list"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabel ? undefined : ariaLabelledBy}
          tabIndex={listIsTabStop && state.overflowing ? 0 : undefined}
          data-overflowing={state.overflowing ? "" : undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onLostPointerCapture={endDrag}
          onClickCapture={onClickCapture}
          onDragStart={onDragStart}
          onFocus={onFocus}
          style={listStyle}
          className={cn(
            "rst:m-0 rst:flex rst:list-none rst:overflow-x-auto rst:overflow-y-hidden",
            "rst:gap-(--rst-cv-gap) rst:px-(--rst-cv-gutter) rst:py-1 rst:scroll-px-(--rst-cv-gutter)",
            "rst:overscroll-x-contain",
            snapStrictness === "mandatory" ? "rst:snap-x rst:snap-mandatory" : "rst:snap-x rst:snap-proximity",
            bleed && "rst:-mx-(--rst-cv-gutter)",
            !scrollbar && "rst:[scrollbar-width:none] rst:[&::-webkit-scrollbar]:hidden",
            fluid && FLUID_CLASSES,
            "rst:data-overflowing:cursor-grab rst:data-dragging:cursor-grabbing rst:data-dragging:select-none",
            "rst:focus-visible:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring rst:focus-visible:ring-inset",
            listClassName,
          )}
        >
          {items.map((child, i) => (
            <li
              key={React.isValidElement(child) && child.key != null ? child.key : i}
              data-carousel-item=""
              aria-label={showPosition ? `${i + 1} of ${count}` : undefined}
              style={itemStyle}
              className={cn(
                "rst:shrink-0",
                snap === "start" ? "rst:snap-start" : "rst:snap-center",
                oneAtATime && "rst:snap-always",
                itemClassName,
              )}
            >
              {child}
            </li>
          ))}
        </ul>
        {!renderArrows && arrowPlacement === "overlay" && showArrows && (
          <>
            <div className="rst:pointer-events-none rst:absolute rst:inset-y-0 rst:start-1 rst:flex rst:items-center">
              <div className="rst:pointer-events-auto">{prev}</div>
            </div>
            <div className="rst:pointer-events-none rst:absolute rst:inset-y-0 rst:end-1 rst:flex rst:items-center">
              <div className="rst:pointer-events-auto">{next}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

export { Carousel };
