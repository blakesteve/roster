import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { cn } from "../../../lib/utils";
import { prefersReducedMotion } from "../../../internal/motion";

/**
 * What `LiquidTabs` and `LiquidNav` share: the strip, the pill, and the motion.
 *
 * Internal. The two components differ in semantics only (a tablist of buttons,
 * or a `nav` of links), so everything here is about how they look and move.
 */

export type LiquidVariant = "pill" | "filled";
export type LiquidSize = "md" | "lg";

interface PillGeom {
  left: number;
  width: number;
}

export function liquidStripClassName(
  variant: LiquidVariant,
  fullWidth: boolean,
  className?: string,
): string {
  return cn(
    "rst:font-ui rst:relative rst:flex rst:border",
    variant === "filled"
      ? "rst:w-full rst:overflow-hidden rst:rounded-lg"
      : cn("rst:gap-1 rst:rounded-xl rst:p-1", fullWidth ? "rst:w-full" : "rst:w-fit"),
    className,
  );
}

/* Set inline because they were before, and a consumer's `className` has always
   lost to them. Moving them to classes now would change which of a consumer's
   existing overrides win. */
export const LIQUID_STRIP_STYLE = {
  background: "var(--roster-lt-bg)",
  borderColor: "var(--roster-lt-border)",
} as const;

export function liquidPillClassName(variant: LiquidVariant): string {
  return cn(
    "rst:absolute rst:rounded-lg",
    variant === "filled" ? "rst:top-0 rst:bottom-0" : "rst:top-1 rst:bottom-1",
  );
}

export const LIQUID_PILL_STYLE = {
  opacity: 0,
  left: 0,
  width: 0,
  background: "var(--roster-lt-pill)",
} as const;

/**
 * One tab or link.
 *
 * The focus indicator is an outline drawn inside the item, in its own text
 * color. Inside, because the `filled` strip clips its overflow and an outer
 * ring would lose its sides. The text color, because it is the one color
 * guaranteed to read against whatever is behind the item: the pill under the
 * active one, the strip under the rest. The library's `--roster-ring` would sit
 * on a pill painted `primary-500` by default, which is the ring's own color.
 * An outline rather than a box-shadow ring, because forced-colors mode drops
 * box-shadows and keeps outlines.
 */
export function liquidItemClassName({
  variant,
  fullWidth,
  size,
  isActive,
}: {
  variant: LiquidVariant;
  fullWidth: boolean;
  size: LiquidSize;
  isActive: boolean;
}): string {
  return cn(
    "rst:relative rst:z-10 rst:text-sm rst:font-medium rst:transition-colors rst:cursor-pointer",
    "rst:focus-visible:outline-2 rst:focus-visible:-outline-offset-4 rst:focus-visible:outline-current",
    /* `lg` is the 44px target (WCAG 2.5.5). `md` keeps the heights every
       existing consumer laid out against. */
    size === "lg" && "rst:min-h-11",
    variant === "filled"
      ? "rst:flex-1 rst:py-2"
      : cn("rst:rounded-lg rst:py-1.5", fullWidth ? "rst:flex-1" : "rst:px-4"),
    /* Until the pill has been measured, which needs script, the active item
       paints the pill's color itself. Without it, server-rendered HTML shows
       the active label in the pill's ink on the strip's background, which by
       default is white on white. */
    isActive
      ? "rst:text-(--roster-lt-text-active) rst:bg-(--roster-lt-pill) rst:in-data-[pill-ready]:bg-transparent"
      : "rst:text-(--roster-lt-text-inactive) rst:hover:text-(--roster-lt-text-hover)",
  );
}

/**
 * Drives the pill from `activeId`, and only from `activeId`.
 *
 * Earlier versions moved the pill on click, before the consumer had decided
 * anything, so a vetoed change or a slow navigation left it on the wrong item.
 * It now follows the controlled value, so it is wherever the consumer says the
 * selection is.
 *
 * Positions are written straight to the DOM, so the animation itself never
 * renders: only the change of `activeId` does. Two phases:
 *   1. Stretch: the pill spans old and new item (130ms ease-out, `scaleY(0.55)`).
 *   2. Contract: it settles on the new one (160ms ease-in).
 * Under `prefers-reduced-motion` it moves without either.
 */
export function useLiquidPill(
  containerRef: RefObject<HTMLElement | null>,
  pillRef: RefObject<HTMLDivElement | null>,
  activeId: string,
  /** Changes whenever the set of items does, so new items get observed. */
  itemsKey: string,
): void {
  const geom = useRef<PillGeom | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = useRef(activeId);
  const animatedTo = useRef<string | null>(null);

  /* The pill is absolutely positioned, so its `left` is measured from the
     container's PADDING edge, and it scrolls with the container's content.
     `getBoundingClientRect` measures from the BORDER edge of what is on screen
     now. So: take the border width off, and put the scroll back on. Without
     the first, every strip drew the pill one border-width to the right. */
  const measure = useCallback(
    (id: string): PillGeom | null => {
      const container = containerRef.current;
      if (!container) return null;
      const item = Array.from(
        container.querySelectorAll<HTMLElement>("[data-tab-id]"),
      ).find((el) => el.dataset.tabId === id);
      if (!item) return null;
      const c = container.getBoundingClientRect();
      const b = item.getBoundingClientRect();
      return {
        left: b.left - c.left - container.clientLeft + container.scrollLeft,
        width: b.width,
      };
    },
    [containerRef],
  );

  const apply = useCallback(
    (g: PillGeom, transition: string, scaleY: number) => {
      const pill = pillRef.current;
      if (!pill) return;
      pill.style.transition = transition;
      pill.style.left = `${g.left}px`;
      pill.style.width = `${g.width}px`;
      pill.style.transform = `scaleY(${scaleY})`;
    },
    [pillRef],
  );

  const snap = useCallback(() => {
    const pill = pillRef.current;
    const g = measure(active.current);
    geom.current = g;
    if (!pill) return;
    if (!g) {
      /* No item matches: show no selection rather than a stale one. */
      pill.style.opacity = "0";
      return;
    }
    apply(g, "none", 1);
    pill.style.opacity = "1";
    containerRef.current?.setAttribute("data-pill-ready", "");
  }, [apply, containerRef, measure, pillRef]);

  // Layout effect, so the pill is in place before the first paint.
  useLayoutEffect(() => {
    active.current = activeId;
    const from = geom.current;
    const to = measure(activeId);
    /* Only a change of `activeId` animates. The same id again (StrictMode's
       second run in development, or `<Activity>` showing the strip again)
       snaps, rather than squashing a pill that has nowhere to go. */
    const moved = animatedTo.current !== null && animatedTo.current !== activeId;
    animatedTo.current = activeId;

    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (!from || !to || !moved || prefersReducedMotion()) {
      snap();
      return;
    }

    const left = Math.min(from.left, to.left);
    const right = Math.max(from.left + from.width, to.left + to.width);
    apply(
      { left, width: right - left },
      "left 130ms ease-out, width 130ms ease-out, transform 130ms ease-out",
      0.55,
    );
    timer.current = setTimeout(() => {
      timer.current = null;
      const settled = measure(activeId) ?? to;
      geom.current = settled;
      apply(
        settled,
        "left 160ms ease-in, width 160ms ease-in, transform 160ms ease-in",
        1,
      );
    }, 130);
  }, [activeId, apply, measure, snap]);

  /* Re-measure whenever anything could have moved the items: the strip or an
     item resizing (a viewport change, a label render function), and web fonts
     arriving, which change every label's width at once. An animation in
     flight settles on its own re-measure, so it is left alone. */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const resnap = () => {
      if (!timer.current) snap();
    };
    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(resnap);
      observer.observe(container);
      container
        .querySelectorAll<HTMLElement>("[data-tab-id]")
        .forEach((el) => observer!.observe(el));
    }
    let live = true;
    document.fonts?.ready.then(() => {
      if (live) resnap();
    });
    return () => {
      live = false;
      observer?.disconnect();
    };
  }, [containerRef, itemsKey, snap]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
}
