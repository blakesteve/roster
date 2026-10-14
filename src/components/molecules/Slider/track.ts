import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from "react";
import { cn } from "../../../lib/utils";

/* The track Slider and RangeSlider share: its scale, its keys, its pointer
   and its classes, with its parts in track-parts.tsx. Internal; neither
   module nor its names are exported from the package. */

/** A named stop on the track: a chip under it moves a thumb there. */
export interface SliderSnapPoint {
  value: number;
  label: string;
}

/* Half a thumb's 44px target. The rail stops this far short of each end of
   the track, so a thumb's whole target stays on the track at min and max. */
export const INSET = 22;
/* Half the rail's 10px height: the stops run this far inside each end of
   the rail, so one at `min` or `max` sits in the rounded cap, not over it. */
export const CAP = 5;

/** A place along the rail, as a share of it from the start edge, for `inset-inline-start`. */
export const along = (share: number, inset = INSET) => `calc(${inset}px + (100% - ${2 * inset}px) * ${share})`;

/* Decimal places in a number as written, an exponent included: 1e-7 has 7. */
const decimals = (n: number) => {
  const [digits, exponent = "0"] = String(n).split("e");
  const dot = digits.indexOf(".");
  return Math.max(0, (dot === -1 ? 0 : digits.length - dot - 1) - Number(exponent));
};

export interface Scale {
  clamp: (n: number) => number;
  /**
   * The nearest value on a step, in range. `toward` takes the next one that
   * way instead, for a key from a value between steps (a controlled value off
   * the grid, or a `max` that isn't on it): Left from 1 on a 0.3 step lands on
   * 0.9, not 0.6.
   */
  snap: (raw: number, toward?: -1 | 0 | 1) => number;
  /** PageUp and PageDown's move. */
  coarse: number;
  /** A value's share of the range, from `min`. */
  at: (v: number) => number;
}

export function useScale(min: number, max: number, step: number, pageStep: number | undefined): Scale {
  const places = Math.max(decimals(step), decimals(min));
  const clamp = useCallback((n: number) => Math.min(max, Math.max(min, n)), [min, max]);
  const snap = useCallback(
    (raw: number, toward: -1 | 0 | 1 = 0) => {
      const steps = (raw - min) / step;
      const near = Math.round(steps);
      const n = toward === 0 || Math.abs(steps - near) < 1e-6 ? near : toward > 0 ? Math.floor(steps) : Math.ceil(steps);
      /* Rounded to the step's places before the clamp, so the rounding can't
         carry a value past an end. */
      return clamp(Number((min + n * step).toFixed(places)));
    },
    [min, step, places, clamp],
  );
  const at = useCallback((v: number) => (max === min ? 0 : (v - min) / (max - min)), [min, max]);
  return { clamp, snap, at, coarse: pageStep ?? Math.max(step, snap(min + (max - min) / 10) - min) };
}

/**
 * Where a key takes a thumb, or `undefined` for a key that isn't the
 * slider's. The arrows step by `step` and the Page keys by the scale's
 * `coarse`, Home and End go to `floor` and `ceiling`, and a thumb with no
 * value goes to `start` on an arrow or Page key rather than stepping from
 * anywhere. A combination is the app's or the browser's, and so is a key its
 * owner has already handled.
 */
export function keyTarget(
  event: KeyboardEvent,
  now: number | null,
  o: { scale: Scale; step: number; start: number; floor: number; ceiling: number; rtl: boolean },
): number | undefined {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return undefined;
  const bound = (n: number) => Math.min(o.ceiling, Math.max(o.floor, n));
  const by = (delta: number) => (now === null ? o.start : bound(o.scale.snap(now + delta, delta > 0 ? 1 : -1)));
  switch (event.key) {
    case o.rtl ? "ArrowLeft" : "ArrowRight":
    case "ArrowUp":
      return by(o.step);
    case o.rtl ? "ArrowRight" : "ArrowLeft":
    case "ArrowDown":
      return by(-o.step);
    case "PageUp":
      return by(o.scale.coarse);
    case "PageDown":
      return by(-o.scale.coarse);
    case "Home":
      return o.floor;
    case "End":
      return o.ceiling;
    default:
      return undefined;
  }
}

type Handler = ((event: PointerEvent<HTMLDivElement>) => void) | undefined;

/**
 * The track's pointer, for any number of thumbs.
 *
 * A mouse press, or one on a thumb, drags at once. A touch on the track waits
 * to see which way it goes: across is a drag, down the page is a scroll and
 * sets nothing, and no movement is a tap, set when the finger lifts. A press
 * takes the thumb nearest it, worked out from the values rather than from
 * the drawn thumbs, which may still be easing there. Two thumbs on one spot
 * are told apart by the way the drag first moves: up the range takes the
 * higher one. A press on a thumb keeps where it landed on it, rather than
 * jumping the thumb to the pointer.
 */
export function useTrackPress(o: {
  trackRef: RefObject<HTMLDivElement | null>;
  disabled: boolean;
  scale: Scale;
  min: number;
  max: number;
  /** The values the thumbs are at, by index; `null` for one not placed. */
  values: () => (number | null)[];
  set: (thumb: number, value: number, finished: boolean) => void;
  focus: (thumb: number) => void;
  /** A drag that moved something has ended. */
  commit: () => void;
  /** The consumer's own handlers, called first. */
  own: { down: Handler; move: Handler; up: Handler; cancel: Handler; lost: Handler };
}) {
  const [dragging, setDragging] = useState(false);
  /* `thumb` is "either" while two thumbs on one spot wait for the drag's
     first move. `from` is the values the press started at. */
  const press = useRef<{
    id: number;
    x: number;
    y: number;
    mode: "pending" | "drag";
    thumb: number | "either";
    tied: number[];
    grab: number;
    from: (number | null)[];
  } | null>(null);

  const rtl = () => !!o.trackRef.current && getComputedStyle(o.trackRef.current).direction === "rtl";
  const box = () => o.trackRef.current!.getBoundingClientRect();
  const fromPointer = (clientX: number) => {
    const b = box();
    let share = (clientX - b.left - INSET) / Math.max(1, b.width - 2 * INSET);
    share = Math.min(1, Math.max(0, share));
    if (rtl()) share = 1 - share;
    return o.scale.snap(o.min + share * (o.max - o.min));
  };
  const thumbAt = (v: number) => {
    const b = box();
    return b.left + INSET + (b.width - 2 * INSET) * (rtl() ? 1 - o.scale.at(v) : o.scale.at(v));
  };
  const changed = (from: (number | null)[]) => o.values().some((v, i) => v !== from[i]);

  const beginDrag = (track: HTMLDivElement, pointerId: number) => {
    try {
      track.setPointerCapture(pointerId);
    } catch {
      /* A pointer the browser no longer tracks: the drag goes on without capture. */
    }
    setDragging(true);
  };
  const endPress = (track: HTMLDivElement, pointerId: number, commit: boolean) => {
    const was = press.current;
    if (!was || was.id !== pointerId) return;
    press.current = null;
    if (was.mode === "drag") {
      setDragging(false);
      if (track.hasPointerCapture(pointerId)) track.releasePointerCapture(pointerId);
      /* Only a drag that moved something commits: a press and release on a
         thumb changes nothing. */
      if (commit && changed(was.from)) o.commit();
    }
  };
  /* The drag's first move up or down the range picks between thumbs on one
     spot; no move in value yet picks nothing. */
  const settle = (p: NonNullable<typeof press.current>, next: number) => {
    if (p.thumb !== "either") return p.thumb;
    const at = o.values()[p.tied[0]]!;
    if (next === at) return undefined;
    p.thumb = next > at ? p.tied[p.tied.length - 1] : p.tied[0];
    o.focus(p.thumb);
    return p.thumb;
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    o.own.down?.(event);
    /* The main button only: another's menu may never send a pointerup. */
    if (o.disabled || event.button !== 0) return;
    /* One press at a time: a second finger while one is down is left alone.
       A new primary pointer means the last press ended unseen. */
    if (press.current) {
      if (!event.isPrimary) return;
      endPress(event.currentTarget, press.current.id, false);
    }
    /* No focus or selection from the browser: a press would focus the
       nearest focusable ancestor, or nothing, depending on the browser. The
       slider focuses its thumb once the press is a tap or a drag. */
    event.preventDefault();
    const track = event.currentTarget;
    const from = o.values();
    const placed = from.map((v, i) => ({ v, i })).filter((t): t is { v: number; i: number } => t.v !== null);
    const distance = (v: number) => Math.abs(event.clientX - thumbAt(v));
    const nearest = placed.reduce<{ v: number; i: number } | undefined>((best, t) => (!best || distance(t.v) < distance(best.v) ? t : best), undefined);
    const onThumb = !!nearest && distance(nearest.v) <= INSET;
    const tied = nearest ? placed.filter((t) => t.v === nearest.v).map((t) => t.i) : [0];
    let thumb: number | "either" = nearest ? nearest.i : 0;
    if (tied.length > 1) {
      /* On the spot, the drag decides. Beside it, the side does. */
      const side = fromPointer(event.clientX);
      thumb = onThumb ? "either" : side < nearest!.v ? tied[0] : tied[tied.length - 1];
    }
    const grab = onThumb ? thumbAt(nearest!.v) - event.clientX : 0;
    const base = { id: event.pointerId, x: event.clientX, y: event.clientY, thumb, tied, grab, from };
    if (event.pointerType === "mouse" || onThumb) {
      o.focus(thumb === "either" ? tied[0] : thumb);
      press.current = { ...base, mode: "drag" };
      beginDrag(track, event.pointerId);
      if (!onThumb && thumb !== "either") o.set(thumb, fromPointer(event.clientX), false);
      return;
    }
    /* A touch on the track. Not focused yet, so a scroll that starts here
       leaves focus where it was. */
    press.current = { ...base, mode: "pending" };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    o.own.move?.(event);
    /* Only a press in progress moves it. A browser can send a pointermove
       with no press at all, when content scrolls under a resting pointer, and
       that must not set anything. */
    const p = press.current;
    if (!p || p.id !== event.pointerId) return;
    if (p.mode === "pending") {
      const across = Math.abs(event.clientX - p.x);
      const down = Math.abs(event.clientY - p.y);
      if (across > 7 && across > down) {
        p.mode = "drag";
        beginDrag(event.currentTarget, event.pointerId);
        const thumb = settle(p, fromPointer(event.clientX));
        if (thumb !== undefined) {
          o.focus(thumb);
          o.set(thumb, fromPointer(event.clientX), false);
        }
      } else if (down > 10) {
        press.current = null;
      }
      return;
    }
    const next = fromPointer(event.clientX + p.grab);
    const thumb = settle(p, next);
    if (thumb !== undefined) o.set(thumb, next, false);
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    o.own.up?.(event);
    const p = press.current;
    if (p && p.id === event.pointerId && p.mode === "pending") {
      press.current = null;
      if (p.thumb !== "either") {
        o.focus(p.thumb);
        o.set(p.thumb, fromPointer(event.clientX), true);
      }
      return;
    }
    endPress(event.currentTarget, event.pointerId, true);
  };
  /* The browser took the press (a scroll), or the capture went: a drag keeps
     where it got to, and a touch still deciding sets nothing. */
  const onPointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    o.own.cancel?.(event);
    endPress(event.currentTarget, event.pointerId, true);
  };
  /* The track's own capture only. A touch is captured first by the part of
     the track it landed on, the rail or a mark, and when a drag takes the
     capture for the track that part's lostpointercapture comes up to it.
     Ending the press on that stopped a touch drag from the rail after its
     first step. */
  const onLostPointerCapture = (event: PointerEvent<HTMLDivElement>) => {
    o.own.lost?.(event);
    if (event.target === event.currentTarget) endPress(event.currentTarget, event.pointerId, true);
  };

  return { dragging, rtl, handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onLostPointerCapture } };
}

/**
 * Keeps a ref on the values the thumbs are at, for the keys and the pointer
 * to step from. Set the moment a change is made, so input that arrives
 * before a render counts every press, and never read from the drawn thumbs,
 * which ease toward the values after them. Each render brings it back to the
 * values, which a controlling owner may have set from outside, or declined.
 */
export function useCommitted<T>(value: T) {
  const committed = useRef(value);
  useLayoutEffect(() => {
    committed.current = value;
  });
  return committed;
}

/**
 * A form's reset puts an uncontrolled slider back where it started, as it
 * does a native input. A controlled one is its owner's to reset.
 */
export function useFormReset(input: RefObject<HTMLInputElement | null>, controlled: boolean, reset: () => void, name: string | undefined) {
  const latest = useRef(reset);
  useEffect(() => {
    latest.current = reset;
  });
  useEffect(() => {
    const form = input.current?.form;
    if (!form || controlled) return;
    const onReset = () => latest.current();
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [input, controlled, name]);
}

/** Snap points in range, in the track's order, low to high from its start, whatever order they came in. */
export const inRange = (points: SliderSnapPoint[], min: number, max: number) =>
  points.filter((p) => p.value >= min && p.value <= max).sort((a, b) => a.value - b.value);

/** The snap point nearest a value. Halfway between two, the lower one's. */
export const nearestPoint = (points: SliderSnapPoint[], value: number | null) =>
  value === null || points.length === 0
    ? undefined
    : points.reduce((best, p) => (Math.abs(p.value - value) < Math.abs(best.value - value) ? p : best), points[0]);

/**
 * The track's classes. 44px tall, a thumb's whole target. pan-y: a finger
 * moving down the page still scrolls it; across, it drags.
 */
export const trackClasses = (disabled: boolean) =>
  cn(
    "rst:relative rst:h-11 rst:w-full rst:touch-pan-y rst:select-none rst:rounded-md",
    disabled ? "rst:cursor-not-allowed rst:opacity-50" : "rst:cursor-pointer",
  );

/**
 * A thumb's classes: drawn where its value is, eased there unless it's being
 * dragged. Its target is the 44px around it, which the track's height and
 * inset keep on the track. `ring` is the focus ring, for whichever state
 * shows it.
 */
export const thumbClasses = (dragging: boolean, ring: string, className?: string) =>
  cn(
    "rst:absolute rst:top-1/2 rst:size-5 rst:-translate-x-1/2 rst:-translate-y-1/2 rst:rounded-full rst:rtl:translate-x-1/2",
    "rst:border-2 rst:border-primary-600 rst:bg-white rst:elevation-control rst:dark:border-primary-400 rst:dark:bg-gray-900",
    "rst:forced-colors:border-[Highlight]",
    ring,
    !dragging && "rst:transition-[inset-inline-start] rst:duration-150 rst:ease-out rst:motion-reduce:transition-none",
    className,
  );
