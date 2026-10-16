import { useId, useReducer, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../../../lib/utils";
import { withLabels } from "../../../lib/labels";
import { isFieldInvalid, withoutInvalidProps } from "../../../internal/field-invalid";
import {
  along,
  inRange,
  keyTarget,
  nearestPoint,
  thumbClasses,
  trackClasses,
  useCommitted,
  useFormReset,
  useScale,
  useTrackPress,
  type SliderSnapPoint,
} from "../Slider/track";
import { Fill, Marks, Message, Rail, SliderHeader, SnapChips } from "../Slider/track-parts";
import { useKeyFocus } from "../../../internal/key-focus";

/** A range's two values, low then high. */
export type RangeValue = [number, number];

/** Every word RangeSlider says. Pass any of them in `labels` to replace it. */
export interface RangeSliderLabels {
  /** The low thumb's name, heard after the slider's label: "Price Minimum". */
  low: string;
  /** The high thumb's name. */
  high: string;
  /** What a screen reader hears for a thumb's value, with the nearest snap point's label when there is one: "40, Likely". */
  valueText: (value: string, nearest: string | undefined) => string;
  /** The number shown beside the label, both values in one: "20 – 80". */
  range: (low: string, high: string) => string;
}

const LABELS: RangeSliderLabels = {
  low: "Minimum",
  high: "Maximum",
  valueText: (value, nearest) => (nearest ? `${value}, ${nearest}` : value),
  range: (low, high) => `${low} – ${high}`,
};

export interface RangeSliderProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** The two values, low then high. Pass it to control the slider; leave it out for one that starts from `defaultValue`. */
  value?: RangeValue;
  /** Where an uncontrolled slider starts. The whole range, `[min, max]`, by default. */
  defaultValue?: RangeValue;
  /** Each change: a tap, every step of a drag, a key, a snap point. */
  onChange?: (value: RangeValue) => void;
  /** Once a change is finished: a tap, the end of a drag, a key, a snap point. */
  onCommit?: (value: RangeValue) => void;
  /** The lowest value. */
  min?: number;
  /** The highest value. */
  max?: number;
  /** The smallest move: the arrows step by it, and every value lands on it. */
  step?: number;
  /** PageUp and PageDown's move. A tenth of the range, on a step, by default. */
  pageStep?: number;
  /**
   * Named stops, any values and labels. Each gets a mark on the track and a
   * chip under it, which does what a tap on its mark does: moves the nearer
   * thumb there. A point outside `min` to `max` is left out.
   */
  snapPoints?: SliderSnapPoint[];
  /**
   * The slider's name, shown above the track. A node as well as a string, so
   * it can carry markup; it names the group and each thumb by reference, so
   * what's read is its text. A consumer's own `aria-labelledby` names it
   * instead.
   */
  label?: ReactNode;
  /** Supporting text under the slider. */
  helperText?: string;
  /** The message for an invalid value. Implies the error state. */
  errorMessage?: string;
  disabled?: boolean;
  /** A form field name: both values are submitted under it, low then high, as a multiple select's are. */
  name?: string;
  /** How a value is written, in the readout and in what's said. */
  formatValue?: (value: number) => string;
  /** Every word the slider says, with English defaults. */
  labels?: Partial<RangeSliderLabels>;
  /** Classes for the track, the pointer's hit area. */
  trackClassName?: string;
  /** Classes for each thumb. */
  thumbClassName?: string;
  /** Classes for each snap chip. */
  chipClassName?: string;
  /** Classes for the label. */
  labelClassName?: string;
  /** Classes for the helper text or error message. */
  messageClassName?: string;
}

const order = ([a, b]: RangeValue): RangeValue => (a <= b ? [a, b] : [b, a]);

/**
 * Two values picked along one track, a low and a high: tapped, dragged,
 * stepped with the keys, or set from a named snap point.
 *
 * Each thumb is a slider of its own to a screen reader and the keyboard, a
 * tab stop named for the slider and for its end ("Price Minimum"), whose
 * range runs to the other thumb: the thumbs meet, and never cross. The track
 * takes a press for the nearer thumb. It starts at the whole range, and has
 * no not-set state: the whole range is what "any" looks like.
 */
function RangeSlider({
  value: controlled,
  defaultValue,
  onChange,
  onCommit,
  min = 0,
  max = 100,
  step = 1,
  pageStep,
  snapPoints = [],
  label,
  helperText,
  errorMessage,
  disabled = false,
  name,
  formatValue = String,
  labels: overrides,
  className,
  trackClassName,
  thumbClassName,
  chipClassName,
  labelClassName,
  messageClassName,
  "aria-invalid": ariaInvalid,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  ...props
}: RangeSliderProps) {
  useKeyFocus();
  const l = withLabels(LABELS, overrides);
  const id = useId();
  const labelId = `${id}-label`;
  const messageId = `${id}-message`;
  const names = [`${id}-low`, `${id}-high`];
  /* A consumer's own `aria-labelledby` names it over the label. */
  const labelledBy = ariaLabelledBy ?? (label ? labelId : undefined);
  const scale = useScale(min, max, step, pageStep);

  const isControlled = controlled !== undefined;
  const [own, setOwn] = useState<RangeValue>(defaultValue ?? [min, max]);
  /* The values as the slider shows them: each in range, low first, whatever
     they were given. */
  const given = isControlled ? controlled : own;
  const pair = order([scale.clamp(given[0]), scale.clamp(given[1])]);
  const invalid = isFieldInvalid(!!errorMessage, { ...props, "aria-invalid": ariaInvalid });
  const rest = withoutInvalidProps(props);

  const committedRef = useCommitted(pair);
  /* A controlled change renders the slider even when the owner keeps its
     values and so renders nothing, so the next key steps from what it kept. */
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  /* A change to one thumb, which stops where the other is: they meet, and
     never cross. Nothing at all when it lands where it already is. */
  const set = (thumb: number, next: number, finished: boolean) => {
    const now = committedRef.current;
    const bounded = thumb === 0 ? Math.min(next, now[1]) : Math.max(next, now[0]);
    if (bounded === now[thumb]) return;
    const changed: RangeValue = thumb === 0 ? [bounded, now[1]] : [now[0], bounded];
    committedRef.current = changed;
    if (isControlled) rerender();
    else setOwn(changed);
    onChange?.(changed);
    if (finished) onCommit?.(changed);
  };

  const inputRef = useRef<HTMLInputElement>(null);
  const initial = useRef(own);
  useFormReset(
    inputRef,
    isControlled,
    () => {
      committedRef.current = initial.current;
      setOwn(initial.current);
    },
    name,
  );

  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRefs = [useRef<HTMLSpanElement>(null), useRef<HTMLSpanElement>(null)];
  const { dragging, rtl, handlers } = useTrackPress({
    trackRef,
    disabled,
    scale,
    min,
    max,
    values: () => committedRef.current,
    set,
    focus: (thumb) => thumbRefs[thumb].current?.focus({ preventScroll: true }),
    commit: () => onCommit?.(committedRef.current),
    own: { down: undefined, move: undefined, up: undefined, cancel: undefined, lost: undefined },
  });

  /* Each thumb's keys, between `min` and the other thumb, or the other thumb
     and `max`: End on the low thumb takes it to the high one. */
  const onThumbKey = (thumb: number) => (event: KeyboardEvent<HTMLSpanElement>) => {
    if (disabled) return;
    const now = committedRef.current;
    const next = keyTarget(event, now[thumb], {
      scale,
      step,
      start: now[thumb],
      floor: thumb === 0 ? min : now[0],
      ceiling: thumb === 0 ? now[1] : max,
      rtl: rtl(),
    });
    if (next === undefined) return;
    event.preventDefault();
    set(thumb, next, true);
  };

  /* A chip does what a tap on its mark does: moves the nearer thumb there.
     Halfway between the two, the low one. */
  const pick = (v: number) => {
    const [low, high] = committedRef.current;
    set(v <= low ? 0 : v >= high ? 1 : v - low <= high - v ? 0 : 1, v, true);
  };

  const points = inRange(snapPoints, min, max);
  /* Each thumb is described, not the group, so the text is heard once, with the thumb. */
  const describedBy = [helperText || errorMessage ? messageId : undefined, ariaDescribedBy].filter(Boolean).join(" ") || undefined;
  /* The outline is for forced colors, which drop the ring's shadow and draw
     the outline in its place. */
  const ring =
    "rst:focus-visible:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring rst:focus-visible:ring-offset-2 rst:ring-offset-background";

  return (
    <div
      {...rest}
      role="group"
      aria-labelledby={labelledBy}
      className={cn("rst:font-ui rst:flex rst:min-w-0 rst:flex-col rst:gap-1.5", className)}
      data-range-slider=""
    >
      <SliderHeader
        labelId={labelId}
        label={label}
        readout={l.range(formatValue(pair[0]), formatValue(pair[1]))}
        empty={false}
        disabled={disabled}
        labelClassName={labelClassName}
      />
      {/* The thumbs' own names, read by reference only. */}
      <span id={names[0]} hidden>
        {l.low}
      </span>
      <span id={names[1]} hidden>
        {l.high}
      </span>
      <div
        {...handlers}
        ref={trackRef}
        data-dragging={dragging ? "" : undefined}
        className={cn(trackClasses(disabled), trackClassName)}
      >
        <Rail />
        <Fill from={scale.at(pair[0])} to={scale.at(pair[1])} dragging={dragging} />
        <Marks points={points} at={scale.at} filled={(v) => v >= pair[0] && v <= pair[1]} />
        {pair.map((v, i) => (
          <span
            key={i}
            ref={thumbRefs[i]}
            role="slider"
            /* Disabled, it takes no focus at all, as a disabled input doesn't. */
            tabIndex={disabled ? undefined : 0}
            aria-labelledby={[labelledBy, names[i]].filter(Boolean).join(" ")}
            aria-describedby={describedBy}
            aria-valuemin={i === 0 ? min : pair[0]}
            aria-valuemax={i === 0 ? pair[1] : max}
            aria-valuenow={v}
            aria-valuetext={l.valueText(formatValue(v), nearestPoint(points, v)?.label)}
            aria-orientation="horizontal"
            aria-disabled={disabled || undefined}
            aria-invalid={invalid || undefined}
            data-slider-thumb={i === 0 ? "low" : "high"}
            onKeyDown={onThumbKey(i)}
            className={thumbClasses(dragging, ring, thumbClassName)}
            style={{ insetInlineStart: along(scale.at(v)) }}
          />
        ))}
      </div>
      <SnapChips
        points={points}
        labelledBy={labelledBy}
        label={rest["aria-label"]}
        pressed={(v) => v === pair[0] || v === pair[1]}
        pick={pick}
        disabled={disabled}
        chipClassName={chipClassName}
      />
      <Message id={messageId} helperText={helperText} errorMessage={errorMessage} disabled={disabled} className={messageClassName} />
      {/* Both values under one name, low first. Disabled, neither is submitted. */}
      {name && (
        <>
          <input ref={inputRef} type="hidden" name={name} value={String(pair[0])} disabled={disabled} readOnly />
          <input type="hidden" name={name} value={String(pair[1])} disabled={disabled} readOnly />
        </>
      )}
    </div>
  );
}

export { RangeSlider };
