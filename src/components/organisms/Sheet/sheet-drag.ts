/**
 * When a drag on a sheet's handle or header dismisses it.
 *
 * Pure, and kept out of the component so the thresholds can be tested with
 * literal numbers. jsdom has no layout, so a test that read the height from the
 * DOM would be testing zero.
 */

/** Movement at or under this, in px, is a tap rather than a drag. */
export const SHEET_TAP_SLOP = 8;

/** A drag further than this share of the sheet's height closes it. */
export const SHEET_CLOSE_DISTANCE = 0.3;

/** A downward flick at or above this speed, in px/ms, closes the sheet... */
export const SHEET_FLICK_VELOCITY = 0.5;

/** ...as long as it traveled at least this far, in px. */
export const SHEET_FLICK_MIN_DISTANCE = 16;

/** Release velocity is averaged over this much of the end of the drag, in ms. */
export const SHEET_VELOCITY_WINDOW = 100;

export type SheetDragOutcome = "close" | "stay";

/**
 * @param dy          downward travel in px; negative is upward
 * @param sheetHeight the sheet's rendered height in px
 * @param velocity    px/ms at release, downward positive, from `sheetReleaseVelocity`
 */
export function sheetDragOutcome(
  dy: number,
  sheetHeight: number,
  velocity: number,
): SheetDragOutcome {
  /* An upward flick is someone changing their mind, however far down they had
     already pulled the sheet. */
  if (velocity <= -SHEET_FLICK_VELOCITY) return "stay";
  if (dy <= SHEET_TAP_SLOP) return "stay";
  if (dy > sheetHeight * SHEET_CLOSE_DISTANCE) return "close";
  if (velocity >= SHEET_FLICK_VELOCITY && dy >= SHEET_FLICK_MIN_DISTANCE) {
    return "close";
  }
  return "stay";
}

/** Whether a pointer that moved this far has stopped being a tap. */
export function exceedsSheetTapSlop(dx: number, dy: number): boolean {
  return Math.hypot(dx, dy) > SHEET_TAP_SLOP;
}

export interface SheetDragSample {
  /** A timestamp in ms, from the pointer event. */
  t: number;
  /** The pointer's clientY in px. */
  y: number;
}

/**
 * Downward speed in px/ms over the last `SHEET_VELOCITY_WINDOW` ms of samples.
 *
 * The window is measured back from the LAST sample, not from now: a finger
 * that stops and then lifts has a last sample from when it stopped, and the
 * pause belongs in the average. Zero when the window holds a single instant.
 */
export function sheetReleaseVelocity(samples: readonly SheetDragSample[]): number {
  if (samples.length < 2) return 0;
  const last = samples[samples.length - 1];
  const first =
    samples.find((s) => last.t - s.t <= SHEET_VELOCITY_WINDOW) ?? last;
  const dt = last.t - first.t;
  return dt > 0 ? (last.y - first.y) / dt : 0;
}
