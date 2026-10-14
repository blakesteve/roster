import { createContext, useContext, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "../../../lib/utils";

/**
 * A text size a line stands in for: its font size and line height, so one
 * line of skeleton is exactly one line of the text that replaces it.
 * `inherit` takes whatever the surrounding text is.
 */
const LINE_SIZE = {
  sm: "rst:text-xs",
  md: "rst:text-sm",
  lg: "rst:text-base",
  inherit: "",
} as const;

/* Avatar's sizes, so a circle is the avatar it stands in for. */
const CIRCLE_SIZE = {
  xs: "rst:h-6 rst:w-6",
  sm: "rst:h-8 rst:w-8",
  md: "rst:h-10 rst:w-10",
  lg: "rst:h-12 rst:w-12",
  xl: "rst:h-16 rst:w-16",
} as const;

const RADIUS = {
  sm: "rst:rounded-sm",
  md: "rst:rounded-md",
  lg: "rst:rounded-lg",
  xl: "rst:rounded-xl",
  full: "rst:rounded-full",
} as const;

/* A block's corners when `radius` isn't passed: the skeleton's own token, so
   an app can round its placeholders without moving the shared radius scale,
   which every other component reads. */
const BLOCK_RADIUS = "rst:rounded-skeleton";

/** How a skeleton moves while it waits. */
export type SkeletonAnimation = "shimmer" | "pulse" | "none";

/* The fill, and how it moves: a highlight sweeping across it, the fill
   fading, or neither. Both movements stop under reduced motion, on the flat
   fill. Forced colors drop the fill, so there the shape keeps an outline,
   which takes no room and moves nothing; the pulse stops there too, or the
   outline standing in for the fill would fade with it. */
const FILL: Record<SkeletonAnimation, string> = {
  shimmer: "rst:animate-skeleton rst:forced-colors:outline-solid rst:forced-colors:outline-1",
  pulse: "rst:animate-skeleton-pulse rst:forced-colors:outline-solid rst:forced-colors:outline-1 rst:forced-colors:animate-none",
  none: "rst:skeleton-fill rst:forced-colors:outline-solid rst:forced-colors:outline-1",
};

/* What a SkeletonRegion asks of the skeletons inside it, unless one asks
   otherwise. */
const SkeletonAnimationContext = createContext<SkeletonAnimation | undefined>(undefined);

export interface SkeletonProps {
  /**
   * - `"line"`: a line of text, one line box tall at its `size`.
   * - `"block"`: an image, a chart, any box: `height` sets it.
   * - `"circle"`: an avatar, at Avatar's sizes.
   */
  shape?: "line" | "block" | "circle";
  /**
   * For a line, the text it stands in for: `sm` (12px on 16), `md` (14px on
   * 20), `lg` (16px on 24), or `inherit`. For a circle, Avatar's sizes.
   */
  size?: keyof typeof LINE_SIZE | keyof typeof CIRCLE_SIZE;
  /** How many lines, for a paragraph. The last is shorter, as a last line is. */
  lines?: number;
  /** The width: a line's, or the last line's when there are several. */
  width?: CSSProperties["width"];
  /** A block's height. */
  height?: CSSProperties["height"];
  /**
   * A block's corners, from the radius scale. Without it a block reads
   * `--roster-skeleton-radius`, which defaults to `lg`. A line's corners are
   * `sm` unless this says otherwise; a circle is always round.
   */
  radius?: keyof typeof RADIUS;
  /**
   * `"shimmer"` (the default): a highlight sweeps across the fill. `"pulse"`:
   * the fill fades and returns, at `--roster-skeleton-pulse-duration` and down
   * to `--roster-skeleton-pulse-opacity`. `"none"`: the fill holds still.
   * Under reduced motion both movements stop. Inside a `SkeletonRegion`, it
   * defaults to the region's.
   */
  animation?: SkeletonAnimation;
  className?: string;
}

/**
 * A placeholder in the shape of what's loading.
 *
 * Hidden from screen readers, always: a skeleton is a picture of content that
 * isn't there yet. The region it stands in for says it's busy; use
 * `SkeletonRegion`, which does that, or set `aria-busy` on it yourself.
 */
function Skeleton({ shape = "line", size, lines = 1, width, height, radius, animation, className }: SkeletonProps) {
  const inherited = useContext(SkeletonAnimationContext);
  const fill = FILL[animation ?? inherited ?? "shimmer"];
  if (shape === "circle") {
    const circle = (size && size in CIRCLE_SIZE ? size : "md") as keyof typeof CIRCLE_SIZE;
    return (
      <span
        aria-hidden="true"
        /* Avatar's 1px border, transparent: an Avatar is its size with its
           border inside it only where a reset makes boxes border-box, and
           this matches it either way. */
        className={cn("rst:block rst:shrink-0 rst:rounded-full rst:border rst:border-transparent", CIRCLE_SIZE[circle], fill, className)}
        data-skeleton="circle"
      />
    );
  }
  if (shape === "block") {
    return (
      <span
        aria-hidden="true"
        className={cn("rst:block rst:w-full", radius ? RADIUS[radius] : BLOCK_RADIUS, fill, className)}
        style={{ height: height ?? "8rem", width }}
        data-skeleton="block"
      />
    );
  }
  const text = (size && size in LINE_SIZE ? size : "md") as keyof typeof LINE_SIZE;
  const count = Math.max(1, Math.floor(lines));
  /* A line is a no-break space set in the text's own size, so its height is
     the text's line box exactly, at any size, whatever the font. The bar is
     drawn over the middle of it, about as tall as the letters. */
  const line = (i: number) => {
    const last = i === count - 1;
    return (
      <span
        key={i}
        className={cn("rst:relative rst:block", count > 1 && !last && "rst:w-full")}
        style={{ width: count > 1 ? (last ? (width ?? "60%") : undefined) : width }}
      >
        {"\u00a0"}
        <span
          className={cn("rst:absolute rst:inset-x-0 rst:top-1/2 rst:h-[0.7em] rst:-translate-y-1/2", RADIUS[radius ?? "sm"], fill)}
        />
      </span>
    );
  };
  return (
    <span aria-hidden="true" className={cn("rst:block", LINE_SIZE[text], className)} data-skeleton="line">
      {Array.from({ length: count }, (_, i) => line(i))}
    </span>
  );
}

export interface SkeletonRegionProps {
  /** While true, the skeleton shows and the region says it's busy. */
  loading: boolean;
  /** What shows while loading. */
  skeleton: ReactNode;
  /** What a screen reader hears while loading: "Loading the schedule". */
  label?: string;
  /**
   * Say `label` (the default). Off for all but one when several regions load
   * together, a grid of cards say, or wrap them in one region instead.
   */
  announce?: boolean;
  /** How the skeletons inside move, unless one says otherwise: see `Skeleton`. */
  animation?: SkeletonAnimation;
  children?: ReactNode;
  className?: string;
}

/**
 * The region a skeleton stands in for: `aria-busy` while loading, the
 * skeleton hidden from screen readers, and `label` said once, politely.
 * When `loading` turns false the content replaces the skeleton in the same
 * box, so a skeleton drawn at the content's size means nothing moves.
 */
function SkeletonRegion({ loading, skeleton, label = "Loading", announce = true, animation, children, className }: SkeletonRegionProps) {
  /* A region inside another's skeleton keeps the outer one's, unless it says. */
  const inherited = useContext(SkeletonAnimationContext);
  /* The status stays in the page, empty, and its words go in a moment after
     loading starts: a status region that arrives already holding its text
     usually isn't read out. */
  const [said, setSaid] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSaid(loading && announce ? label : ""), loading ? 50 : 0);
    return () => clearTimeout(timer);
  }, [loading, label, announce]);
  /* Beside the busy region, not inside it: some screen readers hold a busy
     region's announcements until it's done, which would say "loading" once
     the loading is over. */
  return (
    <>
      <span role="status" className="rst:sr-only" data-skeleton-status="">
        {said}
      </span>
      <div aria-busy={loading || undefined} className={className} data-skeleton-region={loading ? "loading" : "ready"}>
        {loading ? (
          <SkeletonAnimationContext.Provider value={animation ?? inherited}>
            <div aria-hidden="true">{skeleton}</div>
          </SkeletonAnimationContext.Provider>
        ) : (
          children
        )}
      </div>
    </>
  );
}

export { Skeleton, SkeletonRegion };
