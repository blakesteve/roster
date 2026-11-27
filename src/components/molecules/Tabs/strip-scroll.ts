import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { cn } from "../../../lib/utils";
import { prefersReducedMotion } from "../../../internal/motion";

/**
 * A tab strip that doesn't fit scrolls inside itself, for `Tabs` (plain and
 * liquid) and `LiquidNav`.
 *
 * Internal. The strip (the tablist or the nav) keeps every class and style it
 * had, so its frame, its place in the page and a consumer's `className` are
 * as they were. Inside it, a new box holds the items (and the liquid pill)
 * and is what scrolls. It lays out exactly as the strip's own row did, so a
 * strip that fits is unchanged.
 *
 * The strip is marked, on `data-roster-strip`, by script:
 * - **No mark,** before script has run (a server-rendered page): the row is
 *   today's, inside a scroll container, so it can never push the page.
 * - **`fit`:** the items' longest words fit side by side. Nothing clips and
 *   nothing differs from a strip without this.
 * - **`scroll`:** they don't. The items stop shrinking and sit on one line,
 *   each at most the strip less 32px, and the strip scrolls. A chevron on
 *   each side with more, in a 32px zone the items fade into, pages it for a
 *   mouse. The selected item, or the focused one, is kept clear of the
 *   chevrons by setting the box's own scroll, so the page never moves.
 */

export type StripKind = "plain" | "pill" | "filled";

/** The strip's own additions: never wider than what holds it. */
export const stripClassName = (kind: StripKind) =>
  cn(
    "rst:max-w-full rst:[--rst-strip-cue:32px] rst:data-[roster-cue-narrow]:[--rst-strip-cue:16px]",
    /* The plain strip has no positioned box for the chevrons to sit in. */
    kind === "plain" && "rst:data-[roster-strip=scroll]:relative",
  );

/**
 * The box that scrolls. The pill strip's padding moves onto it (and its
 * negative margin gives the room back), so its scrolling edge is the strip's
 * own inner edge and the pill, measured from it, sits where it did.
 */
export const scrollerClassName = (kind: StripKind) =>
  cn(
    "rst:relative rst:flex rst:min-w-0 rst:grow rst:overflow-x-auto rst:overflow-y-hidden rst:overscroll-x-contain",
    "rst:[scrollbar-width:none] rst:[&::-webkit-scrollbar]:hidden",
    "rst:in-data-[roster-strip=fit]:overflow-visible",
    kind !== "filled" && "rst:gap-1",
    kind === "pill" && "rst:-m-1 rst:p-1",
    /* The fade: each side with more is masked over its zone, clear under the
       chevron and fading in over the zone's inner half. A mask, not a wash of
       the strip's color, so whatever is behind the items shows through. */
    "rst:[--rst-strip-l:0px] rst:[--rst-strip-r:0px]",
    "rst:in-data-[roster-more-left]:[--rst-strip-l:var(--rst-strip-cue)] rst:in-data-[roster-more-right]:[--rst-strip-r:var(--rst-strip-cue)]",
    "rst:in-data-[roster-strip=scroll]:[mask-image:linear-gradient(to_right,transparent,transparent_calc(var(--rst-strip-l)/2),#000_var(--rst-strip-l),#000_calc(100%_-_var(--rst-strip-r)),transparent_calc(100%_-_var(--rst-strip-r)/2),transparent)]",
  );

/** An item's additions, for a strip that scrolls. Whole class names, each
    spelled out, so Tailwind finds them. */
export const scrollingItemClassName = (kind: StripKind) =>
  cn(
    "rst:in-data-[roster-strip=scroll]:flex-none rst:in-data-[roster-strip=scroll]:max-w-[calc(100%_-_32px)]",
    /* Liquid items take the pill's 1rem of side padding; `plain` keeps its own. */
    kind !== "plain" && "rst:in-data-[roster-strip=scroll]:px-4",
  );

/** One side's chevron: its zone, over the strip's inner edge. */
export const cueClassName = (side: "left" | "right", tone: "plain" | "liquid") =>
  cn(
    "rst:absolute rst:inset-y-0 rst:z-20 rst:hidden rst:w-(--rst-strip-cue) rst:cursor-pointer rst:items-center",
    /* Physical sides: the chevron points at the side with more, in either
       direction, and logical margins nudged the items. */
    side === "left"
      ? "rst:left-0 rst:justify-start rst:pl-1 rst:in-data-[roster-more-left]:flex"
      : "rst:right-0 rst:justify-end rst:pr-1 rst:in-data-[roster-more-right]:flex",
    /* A resting item's ink. */
    tone === "liquid" ? "rst:text-(--roster-lt-text-inactive)" : "rst:text-(--roster-tabs-text)",
    "rst:forced-colors:text-[CanvasText]",
  );

const ZONE = 32;
const NARROW = 16;
const ITEMS = "[data-tab-id]";
const px = (value: string) => parseFloat(value) || 0;
/* The box's own scroll, to a place: the same place however many times it's
   asked for in one frame (Chromium adds a `scrollBy` to a glide already
   under way). Where an element can't scroll by script (jsdom), it moves at
   once. */
const scrollBoxTo = (box: HTMLElement, left: number, smooth: boolean) => {
  if (typeof box.scrollTo === "function") box.scrollTo({ left, behavior: smooth && !prefersReducedMotion() ? "smooth" : "instant" });
  else box.scrollLeft = left;
};

type Mode = "fit" | "scroll";

/**
 * Marks the strip, keeps the item in view clear of the chevrons, and returns
 * the box that scrolls and what a chevron's press does.
 *
 * Call it in the component that renders the strip, before the pill's hook, so
 * the pill measures the strip as marked.
 */
export function useStripScroll(
  stripRef: RefObject<HTMLElement | null>,
  activeId: string,
  /** Changes whenever the set of items does. */
  itemsKey: string,
) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const mode = useRef<Mode | null>(null);
  const active = useRef(activeId);
  const sized = useRef("");
  const mounted = useRef(false);

  const parts = useCallback(() => {
    const strip = stripRef.current;
    const scroller = scrollerRef.current;
    return strip && scroller ? { strip, scroller, items: [...scroller.querySelectorAll<HTMLElement>(ITEMS)] } : null;
  }, [stripRef]);

  /* What sizes the decision: the strip, what holds it, and every item. */
  const signature = useCallback(() => {
    const p = parts();
    if (!p) return "";
    const w = (el: Element | null) => (el ? Math.round(el.getBoundingClientRect().width * 100) : 0);
    return [w(p.strip), w(p.strip.parentElement), ...p.items.map(w)].join(" ");
  }, [parts]);

  /* Whether the items fit, read with the strip unmarked: today's row, in a
     box that clips. Put back as it was before anything paints. With it, the
     sizes as read, which a strip that fits keeps once marked, so it's read
     once. */
  const fits = useCallback(() => {
    const p = parts();
    if (!p || !p.items.length) return { fits: true, sized: signature() };
    const { strip, scroller, items } = p;
    const was = strip.getAttribute("data-roster-strip");
    if (was !== null) strip.removeAttribute("data-roster-strip");
    const box = scroller.getBoundingClientRect();
    const s = getComputedStyle(scroller);
    const rects = items.map((el) => el.getBoundingClientRect());
    const need = Math.max(...rects.map((r) => r.right)) - Math.min(...rects.map((r) => r.left)) + px(s.paddingLeft) + px(s.paddingRight);
    const sized = signature();
    if (was !== null) strip.setAttribute("data-roster-strip", was);
    return { fits: need <= box.width + 0.5, sized };
  }, [parts, signature]);

  /* The chevrons: one on each side with more. */
  const cues = useCallback(() => {
    const p = parts();
    if (!p) return;
    const { strip, scroller, items } = p;
    let left = false;
    let right = false;
    if (mode.current === "scroll" && items.length) {
      const box = scroller.getBoundingClientRect();
      const s = getComputedStyle(scroller);
      const rects = items.map((el) => el.getBoundingClientRect());
      /* Under a pixel isn't more: Chromium can't scroll right to left by the
         fraction a strip's content may run to, so its far end hides 0.75px. */
      left = Math.min(...rects.map((r) => r.left)) < box.left + px(s.paddingLeft) - 1;
      right = Math.max(...rects.map((r) => r.right)) > box.right - px(s.paddingRight) + 1;
    }
    strip.toggleAttribute("data-roster-more-left", left);
    strip.toggleAttribute("data-roster-more-right", right);
  }, [parts]);

  /* The item to keep in view: the focused one, or else the selected one. */
  const inView = useCallback(() => {
    const p = parts();
    if (!p) return null;
    const focused = document.activeElement instanceof HTMLElement ? document.activeElement.closest<HTMLElement>(ITEMS) : null;
    if (focused && p.scroller.contains(focused)) return focused;
    return p.items.find((el) => el.dataset.tabId === active.current) ?? null;
  }, [parts]);

  /* Scrolls the box so the item sits clear of both zones: by the box's own
     scroll, never the page's. The zones narrow to 16px when the item leaves
     no more room. */
  const reveal = useCallback(
    (smooth: boolean) => {
      const p = parts();
      const item = inView();
      if (!p || !item || mode.current !== "scroll") return;
      const { strip, scroller } = p;
      const box = scroller.getBoundingClientRect();
      const r = item.getBoundingClientRect();
      const zone = r.width > box.width - 2 * ZONE ? NARROW : ZONE;
      strip.toggleAttribute("data-roster-cue-narrow", zone === NARROW);
      let by = 0;
      if (r.left < box.left + zone) by = r.left - (box.left + zone);
      else if (r.right > box.right - zone) by = r.right - (box.right - zone);
      if (Math.abs(by) < 0.5) return;
      /* To a whole pixel, as WebKit scrolls: whichever leaves less of the tab
         under a chevron, which for a tab that fills the room between them
         isn't always the one away from the nearer. */
      const from = scroller.scrollLeft;
      const under = (to: number) => {
        const shift = to - from;
        return Math.max(box.left + zone - (r.left - shift), r.right - shift - (box.right - zone), 0);
      };
      const [down, up] = [Math.floor(from + by), Math.ceil(from + by)];
      const to = under(down) < under(up) || (under(down) === under(up) && by < 0) ? down : up;
      scrollBoxTo(scroller, to, smooth);
    },
    [inView, parts],
  );

  const mark = useCallback(
    (next: Mode, sizedAsRead: string) => {
      const p = parts();
      if (!p) return;
      if (mode.current === "scroll" && next === "fit") p.scroller.scrollLeft = 0;
      mode.current = next;
      p.strip.setAttribute("data-roster-strip", next);
      if (next === "fit") {
        p.strip.removeAttribute("data-roster-cue-narrow");
        cues();
        sized.current = sizedAsRead;
        return;
      }
      cues();
      reveal(false);
      sized.current = signature();
    },
    [cues, parts, reveal, signature],
  );

  /* Before the first paint, and whenever the items change: decide once. */
  useLayoutEffect(() => {
    const read = fits();
    mark(read.fits ? "fit" : "scroll", read.sized);
  }, [fits, itemsKey, mark]);

  /* A new selection is brought into view smoothly; the first, instantly
     above. */
  useLayoutEffect(() => {
    active.current = activeId;
    if (mounted.current) reveal(true);
    mounted.current = true;
  }, [activeId, reveal]);

  useEffect(() => {
    const p = parts();
    if (!p) return;
    const { strip, scroller } = p;
    let frame = 0;
    /* A size changed. Decide again only if something that sizes it moved,
       and mark in the next frame: marking here would resize what's observed
       while it's being reported. */
    const resized = () => {
      const now = signature();
      if (now === sized.current) return;
      const width = sized.current.split(" ")[0];
      sized.current = now;
      const read = fits();
      const next: Mode = read.fits ? "fit" : "scroll";
      if (next !== mode.current) {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const again = fits();
          mark(again.fits ? "fit" : "scroll", again.sized);
        });
        return;
      }
      cues();
      if (now.split(" ")[0] !== width) reveal(false);
    };
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(resized);
    observer?.observe(strip);
    if (strip.parentElement) observer?.observe(strip.parentElement);
    scroller.querySelectorAll(ITEMS).forEach((el) => observer?.observe(el));
    const scrolled = () => cues();
    /* A frame later: focus that wasn't told not to scroll (the Tab key, an
       app's own `focus()`) brings its element into view the browser's way
       first, and in WebKit that stops a glide begun with it. */
    let focusFrame = 0;
    const focused = (e: FocusEvent) => {
      if (!(e.target instanceof HTMLElement) || !e.target.closest(ITEMS)) return;
      cancelAnimationFrame(focusFrame);
      focusFrame = requestAnimationFrame(() => reveal(true));
    };
    scroller.addEventListener("scroll", scrolled, { passive: true });
    strip.addEventListener("focusin", focused);
    let live = true;
    document.fonts?.ready.then(() => {
      if (live) resized();
    });
    return () => {
      live = false;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(focusFrame);
      observer?.disconnect();
      scroller.removeEventListener("scroll", scrolled);
      strip.removeEventListener("focusin", focused);
    };
  }, [cues, fits, itemsKey, mark, parts, reveal, signature]);

  /* A chevron's press: the strip less both zones, toward its side. */
  const page = useCallback((side: "left" | "right") => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const zone = px(getComputedStyle(scroller).getPropertyValue("--rst-strip-cue")) || ZONE;
    const by = scroller.clientWidth - 2 * zone;
    scrollBoxTo(scroller, scroller.scrollLeft + (side === "right" ? by : -by), true);
  }, []);

  return { scrollerRef, page };
}
