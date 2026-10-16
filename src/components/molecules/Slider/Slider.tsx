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
} from "./track";
import { Fill, Marks, Message, Rail, SliderHeader, SnapChips } from "./track-parts";
import { useKeyFocus } from "../../../internal/key-focus";

export type { SliderSnapPoint };

/** Every word Slider says. Pass any of them in `labels` to replace it. */
export interface SliderLabels {
  /** Shown, and said, while there's no value. */
  notSet: string;
  /** What a screen reader hears for a value, with the nearest snap point's label when there is one: "72, Likely". */
  valueText: (value: string, nearest: string | undefined) => string;
}

const LABELS: SliderLabels = {
  notSet: "Not set",
  valueText: (value, nearest) => (nearest ? `${value}, ${nearest}` : value),
};

export interface SliderProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /**
   * The value, or `null` for not set: no thumb and an empty track. Pass it to
   * control the slider, `null` included, which is how a consumer offers a
   * clear. Leave it out for an uncontrolled slider that starts from
   * `defaultValue`.
   */
  value?: number | null;
  /**
   * Where an uncontrolled slider starts: `startValue` when left out, the
   * middle unless that's set. `null` starts it not set.
   */
  defaultValue?: number | null;
  /** Each change: a tap, every step of a drag, a key, a snap point. */
  onChange?: (value: number | null) => void;
  /** Once a change is finished: a tap, the end of a drag, a key, a snap point. */
  onCommit?: (value: number) => void;
  /** The lowest value. */
  min?: number;
  /** The highest value. */
  max?: number;
  /** The smallest move: the arrows step by it, and every value lands on it. */
  step?: number;
  /** PageUp and PageDown's move. A tenth of the range, on a step, by default. */
  pageStep?: number;
  /**
   * Where the thumb first appears: an uncontrolled slider's start when
   * `defaultValue` is left out, and where the first arrow or Page key puts it
   * on an empty slider. The middle of the range by default. Home and End go to
   * `min` and `max`.
   */
  startValue?: number;
  /**
   * Named stops, any values and labels. Each gets a chip under the track that
   * moves the thumb to it, and a mark on the track. A point outside `min` to
   * `max` is left out, since the track can't show it.
   */
  snapPoints?: SliderSnapPoint[];
  /**
   * The slider's name, shown above the track. A node as well as a string, so
   * it can carry markup; it names the slider by reference, so what's read is
   * its text. A consumer's own `aria-labelledby` names it instead.
   */
  label?: ReactNode;
  /** Supporting text under the slider. */
  helperText?: string;
  /** The message for an invalid value. Implies the error state. */
  errorMessage?: string;
  disabled?: boolean;
  /** A form field name: the value is submitted under it, and an empty string while not set. */
  name?: string;
  /** How the value is written, in the readout and in what's said: `(v) => `${v}%`` for a percentage. */
  formatValue?: (value: number) => string;
  /** Every word the slider says, with English defaults. */
  labels?: Partial<SliderLabels>;
  /** Classes for the track's hit area, the element with the slider role. */
  trackClassName?: string;
  /** Classes for the thumb. */
  thumbClassName?: string;
  /** Classes for each snap chip. */
  chipClassName?: string;
  /** Classes for the label. */
  labelClassName?: string;
  /** Classes for the helper text or error message. */
  messageClassName?: string;
}

/**
 * A value picked along a track: tapped, dragged, stepped with the keys, or
 * set from a named snap point.
 *
 * It starts with the thumb at `startValue`, the middle by default. Not set is
 * there when it's asked for: `defaultValue={null}`, or `value={null}` when
 * controlled, gives no thumb and an empty track, and a form takes that as a
 * valid answer (an empty string under `name`). The first tap, drag or key sets
 * it, and a consumer controlling `value` can set it back to `null`.
 *
 * One thumb. Two, for a range, is `RangeSlider`, on the same track, so
 * `value` here stays a number.
 */
function Slider({
  value: controlled,
  defaultValue,
  onChange,
  onCommit,
  min = 0,
  max = 100,
  step = 1,
  pageStep,
  startValue,
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
  onKeyDown: onKeyDownProp,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  ...props
}: SliderProps) {
  useKeyFocus();
  const l = withLabels(LABELS, overrides);
  const id = useId();
  const labelId = `${id}-label`;
  const messageId = `${id}-message`;
  /* A consumer's own `aria-labelledby` names it over the label. */
  const labelledBy = ariaLabelledBy ?? (label ? labelId : undefined);
  const scale = useScale(min, max, step, pageStep);
  const start = scale.snap(startValue ?? min + (max - min) / 2);

  const isControlled = controlled !== undefined;
  const [own, setOwn] = useState<number | null>(defaultValue === undefined ? start : defaultValue);
  /* The value as the slider shows it: in range, whatever it was given. The
     thumb can't be drawn past an end, and a slider can't report a value
     beyond one. */
  const given = isControlled ? controlled : own;
  const value = given === null ? null : scale.clamp(given);
  const invalid = isFieldInvalid(!!errorMessage, { ...props, "aria-invalid": ariaInvalid });
  const rest = withoutInvalidProps(props);

  const committedRef = useCommitted(value);
  /* A controlled change renders the slider even when the owner keeps its
     value and so renders nothing: an owner that holds it at 50 or more and
     turns down 49 leaves the next key stepping from 50. */
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  /* A change. Nothing at all when it lands where the value already is: a key
     at an end, a chip already chosen. */
  const set = (next: number | null, finished: boolean) => {
    if (next === committedRef.current) return;
    committedRef.current = next;
    if (isControlled) rerender();
    else setOwn(next);
    onChange?.(next);
    if (finished && next !== null) onCommit?.(next);
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
  const { dragging, rtl, handlers } = useTrackPress({
    trackRef,
    disabled,
    scale,
    min,
    max,
    values: () => [committedRef.current],
    set: (_, next, finished) => set(next, finished),
    focus: () => trackRef.current?.focus({ preventScroll: true }),
    commit: () => committedRef.current !== null && onCommit?.(committedRef.current),
    own: { down: onPointerDown, move: onPointerMove, up: onPointerUp, cancel: onPointerCancel, lost: onLostPointerCapture },
  });

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDownProp?.(event);
    if (disabled) return;
    const next = keyTarget(event, committedRef.current, { scale, step, start, floor: min, ceiling: max, rtl: rtl() });
    if (next === undefined) return;
    event.preventDefault();
    set(next, true);
  };

  const points = inRange(snapPoints, min, max);
  const shown = value === null ? null : formatValue(value);
  const spoken = shown === null ? l.notSet : l.valueText(shown, nearestPoint(points, value)?.label);
  const describedBy = [helperText || errorMessage ? messageId : undefined, props["aria-describedby"]].filter(Boolean).join(" ") || undefined;
  /* The keyboard's focus ring is the thumb's. With no thumb yet, the track
     wears it. The outline is for forced colors, which drop the ring's
     shadow and draw the outline round the track in its place. */
  const ring = "rst:group-focus-visible/slider:ring-2 rst:group-focus-visible/slider:ring-ring rst:group-focus-visible/slider:ring-offset-2 rst:ring-offset-background";

  return (
    <div className={cn("rst:font-ui rst:flex rst:min-w-0 rst:flex-col rst:gap-1.5", className)} data-slider="">
      <SliderHeader labelId={labelId} label={label} readout={shown ?? l.notSet} empty={value === null} disabled={disabled} labelClassName={labelClassName} />
      <div
        {...rest}
        {...handlers}
        ref={trackRef}
        role="slider"
        /* Disabled, it takes no focus at all, from a key or a click, as a
           disabled input doesn't. */
        tabIndex={disabled ? undefined : 0}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value ?? undefined}
        aria-valuetext={spoken}
        aria-orientation="horizontal"
        aria-disabled={disabled || undefined}
        aria-invalid={invalid || undefined}
        data-dragging={dragging ? "" : undefined}
        data-empty={value === null ? "" : undefined}
        onKeyDown={onKeyDown}
        className={cn(
          trackClasses(disabled),
          "rst:group/slider rst:focus-visible:outline-hidden",
          value === null && "rst:focus-visible:ring-2 rst:focus-visible:ring-ring",
          trackClassName,
        )}
      >
        <Rail />
        {value !== null && <Fill from={0} to={scale.at(value)} dragging={dragging} />}
        <Marks points={points} at={scale.at} filled={(v) => value !== null && value >= v} />
        {value !== null && (
          <span aria-hidden="true" data-slider-thumb="" className={thumbClasses(dragging, ring, thumbClassName)} style={{ insetInlineStart: along(scale.at(value)) }} />
        )}
      </div>
      <SnapChips
        points={points}
        labelledBy={labelledBy}
        label={rest["aria-label"]}
        pressed={(v) => value === v}
        pick={(v) => set(v, true)}
        disabled={disabled}
        chipClassName={chipClassName}
      />
      <Message id={messageId} helperText={helperText} errorMessage={errorMessage} disabled={disabled} className={messageClassName} />
      {/* Disabled, it isn't submitted, as a disabled input isn't. */}
      {name && <input ref={inputRef} type="hidden" name={name} value={value === null ? "" : String(value)} disabled={disabled} readOnly />}
    </div>
  );
}

export { Slider };
