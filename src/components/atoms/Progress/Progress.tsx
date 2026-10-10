import { useEffect, useRef, useState } from "react";
import { cn } from "../../../lib/utils";
import { progressValues, type SegmentState } from "./progress-values";

export type ProgressStatus = "default" | "success" | "warning" | "error";
/** A segment's state: finished, under way, still to come, or not part of this one. */
export type ProgressSegmentState = SegmentState;

/** Every word Progress says. Pass any of them in `labels` to replace it. */
export interface ProgressLabels {
  /** A continuous value as said: "45%". */
  percent: (percent: number) => string;
  /** A segmented value as said: "3 of 8". Segments that don't apply aren't counted. */
  count: (done: number, total: number) => string;
  /** Said when there's no value to give. */
  indeterminate: string;
  /** The label and the value together: "Uploading photos: 45%". */
  status: (label: string | undefined, value: string) => string;
}

const LABELS: ProgressLabels = {
  percent: (percent) => `${percent}%`,
  count: (done, total) => `${done} of ${total}`,
  indeterminate: "Loading",
  status: (label, value) => (label ? `${label}: ${value}` : value),
};

/* Solid fills, never translucent: an alpha fill composites into whatever is
   behind it, and on a tinted or glass surface that measured 1.1:1. Each of
   these clears 3:1 against the track (--roster-skeleton) and the page in both
   themes; the numbers are in index.css beside the token. */
const FILL: Record<ProgressStatus, string> = {
  default: "rst:bg-primary-600 rst:dark:bg-primary-400",
  success: "rst:bg-success-600 rst:dark:bg-success-400",
  warning: "rst:bg-amber-700 rst:dark:bg-amber-400",
  error: "rst:bg-error-600 rst:dark:bg-error-400",
};
/* The current segment is the track with the fill's color as a 2px border:
   solid, so it holds on any surface, and a border, which forced colors keep
   where they drop a background. */
const RING: Record<ProgressStatus, string> = {
  default: "rst:border-primary-600 rst:dark:border-primary-400",
  success: "rst:border-success-600 rst:dark:border-success-400",
  warning: "rst:border-amber-700 rst:dark:border-amber-400",
  error: "rst:border-error-600 rst:dark:border-error-400",
};
const TRACK = "rst:bg-[var(--roster-skeleton)]";
/* Forced colors replace every background with the page's, which would leave
   nothing of a bar. The track and empty cells get an outline (no layout), and
   the fill keeps a background in the system's highlight color. */
const FORCED_TRACK = "rst:forced-colors:outline-solid rst:forced-colors:outline-1";
const FORCED_FILL = "rst:forced-colors:forced-color-adjust-none rst:forced-colors:bg-[Highlight]";
/* 6px and 10px, for both forms. */
const HEIGHT = { sm: "rst:h-1.5", md: "rst:h-2.5" } as const;

/**
 * The text a screen reader is given, changed at most once a `every`
 * milliseconds: a live region that changes on every byte of a fast upload
 * talks over everything. A final value goes at once.
 */
function useThrottled(text: string, every: number, final: boolean) {
  const [said, setSaid] = useState(text);
  /* What the region holds now. The first value isn't announced (a region that
     arrives with its text isn't read out), so it starts no wait: the first
     change goes at once. Text that's already there schedules nothing, so a
     remount or a value that comes back doesn't hold up the next change. */
  const saidRef = useRef(text);
  const lastSaid = useRef(Number.NEGATIVE_INFINITY);
  const latest = useRef(text);
  useEffect(() => {
    latest.current = text;
    if (text === saidRef.current) return;
    const wait = final ? 0 : Math.max(0, lastSaid.current + every - Date.now());
    const timer = setTimeout(() => {
      if (latest.current === saidRef.current) return;
      lastSaid.current = Date.now();
      saidRef.current = latest.current;
      setSaid(latest.current);
    }, wait);
    return () => clearTimeout(timer);
  }, [text, every, final]);
  return said;
}

export interface ProgressProps {
  /**
   * How far, from 0 to `max`. Leave it out for indeterminate: work under way
   * with no figure, drawn as a pill crossing the track.
   */
  value?: number | null;
  /** The whole: 100 by default; for segmented, the number of segments. */
  max?: number;
  /**
   * - `"continuous"`: one filled track, for a fraction (bytes, percent).
   * - `"segmented"`: one cell per unit, for a count of discrete things:
   *   "twelve of sixteen" reads without a number beside it.
   */
  variant?: "continuous" | "segmented";
  /** Segmented: each segment's state, when there's more to say than done and not done. */
  segments?: ProgressSegmentState[];
  status?: ProgressStatus;
  size?: "sm" | "md";
  /** Segmented: round each cell into a capsule (the default), or keep them square. */
  rounded?: boolean;
  /**
   * The value stands but work goes on (a server finishing what it was sent):
   * the bar breathes in place. Stops under reduced motion.
   */
  busy?: boolean;
  /** What's progressing, for the status a screen reader hears: "Uploading photos". */
  label?: string;
  /** The value as said, in place of the percent or the count: "3 of 8 files". */
  valueText?: string;
  /** Give the value to screen readers in a polite status region. Off when something else already says it. */
  announce?: boolean;
  /** The least time between two announcements, in milliseconds. */
  announceEvery?: number;
  labels?: Partial<ProgressLabels>;
  className?: string;
}

/**
 * How far through something is: a continuous bar, or a segmented one.
 *
 * The bar is a picture and is hidden from screen readers; a status region
 * beside it carries the value as text, because a changed `aria-label` isn't
 * reliably announced and a `progressbar` may beep or speak on every update.
 * Most screens want ProgressField, which adds a visible label and value.
 */
function Progress({
  value,
  max = 100,
  variant = "continuous",
  segments,
  status = "default",
  size = "md",
  rounded = true,
  busy = false,
  label,
  valueText: valueOverride,
  announce = true,
  announceEvery = 1500,
  labels: overrides,
  className,
}: ProgressProps) {
  const l = { ...LABELS, ...overrides };
  const { known, fraction, percent, states, done, applicable, complete } = progressValues({ value, max, variant, segments });
  const valueText =
    valueOverride ?? (variant === "segmented" ? l.count(done, applicable) : known ? l.percent(percent) : l.indeterminate);
  const final = complete;
  const said = useThrottled(l.status(label, valueText), announceEvery, final);

  const pulse = busy && "rst:animate-pulse rst:motion-reduce:animate-none";

  const bar =
    variant === "segmented" ? (
      <div
        aria-hidden="true"
        className={cn("rst:flex rst:w-full", size === "sm" ? "rst:gap-0.5" : "rst:gap-1", HEIGHT[size], pulse)}
        data-progress-track=""
      >
        {states.map((state, i) => (
          <span
            key={i}
            className={cn(
              "rst:h-full rst:min-w-0 rst:flex-1",
              rounded ? "rst:rounded-full" : "rst:rounded-sm",
              state === "done" && [FILL[status], FORCED_FILL],
              /* Under way: the track inside a border of the fill's color. */
              state === "current" && [TRACK, "rst:border-2", RING[status]],
              state === "remaining" && [TRACK, FORCED_TRACK],
              /* Not part of this one: a dashed outline, neither filled nor to
                 fill. Gray-500 on light and gray-400 on dark clear 3:1. */
              state === "na" && "rst:border rst:border-dashed rst:border-gray-500 rst:dark:border-gray-400",
            )}
            data-segment={state}
          />
        ))}
      </div>
    ) : (
      <div
        aria-hidden="true"
        className={cn("rst:relative rst:w-full rst:overflow-hidden rst:rounded-full", HEIGHT[size], TRACK, FORCED_TRACK, pulse)}
        data-progress-track=""
      >
        {known ? (
          <div
            className={cn(
              "rst:h-full rst:rounded-full rst:transition-[width] rst:motion-reduce:transition-none",
              FILL[status],
              FORCED_FILL,
            )}
            /* Any value above nothing is at least as wide as the bar is tall,
               so a low value reads as a dot, not a sliver. */
            style={{ width: `${fraction * 100}%`, minWidth: fraction > 0 ? (size === "sm" ? "0.375rem" : "0.625rem") : undefined }}
            data-progress-fill=""
          />
        ) : (
          <div
            className={cn("rst:absolute rst:inset-y-0 rst:left-0 rst:w-[30%] rst:rounded-full rst:animate-progress-travel", FILL[status], FORCED_FILL)}
            data-progress-fill="indeterminate"
          />
        )}
      </div>
    );

  return (
    <div className={cn("rst:w-full", className)} data-progress={variant} data-status={status}>
      {bar}
      {announce && (
        <span role="status" className="rst:sr-only" data-progress-status="">
          {said}
        </span>
      )}
    </div>
  );
}

export { Progress };
