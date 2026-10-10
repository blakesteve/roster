/**
 * The numbers a Progress shows and says, worked out once so the bar, the
 * status and a ProgressField's visible value can't disagree.
 */
export type SegmentState = "done" | "current" | "remaining" | "na";

export interface ProgressValues {
  /** Whether there's a figure at all; without one, the bar is indeterminate. */
  known: boolean;
  /** 0 to 1. */
  fraction: number;
  /** The percent as said and shown: 1 to 99 while under way, never rounded to 0 or 100. */
  percent: number;
  /** Segmented: every segment's state. */
  states: SegmentState[];
  done: number;
  /** Segments that count: all but `na`. */
  applicable: number;
  /** Nothing left: the value is at the whole, or every applicable segment is done. */
  complete: boolean;
}

export function progressValues({
  value,
  max = 100,
  variant = "continuous",
  segments,
}: {
  value?: number | null;
  max?: number;
  variant?: "continuous" | "segmented";
  segments?: SegmentState[];
}): ProgressValues {
  /* A max of 0 is a real answer (nothing to do yet), not a missing one: it
     draws an empty bar, where falling back to 100 drew 100 segments. */
  const whole = Number.isFinite(max) ? Math.max(0, max) : 100;
  const known = value !== undefined && value !== null && Number.isFinite(value);
  const fraction = known && whole > 0 ? Math.min(1, Math.max(0, (value as number) / whole)) : 0;
  /* A value the bar shows (a dot) is never said as 0%, and one short of the
     end is never said as 100%. */
  const percent = fraction >= 1 ? 100 : fraction <= 0 ? 0 : Math.min(99, Math.max(1, Math.round(fraction * 100)));

  const states =
    variant === "segmented"
      ? (segments ??
        Array.from({ length: Math.floor(whole) }, (_, i): SegmentState => (known && i < Math.floor(value as number) ? "done" : "remaining")))
      : [];
  const done = states.filter((s) => s === "done").length;
  const applicable = states.filter((s) => s !== "na").length;
  const complete = variant === "segmented" ? applicable > 0 && done === applicable : known && fraction >= 1;
  return { known, fraction, percent, states, done, applicable, complete };
}
