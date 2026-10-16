import type { ReactNode } from "react";
import { cn } from "../../../lib/utils";
import { Chip } from "../../atoms/Chip/Chip";
import { CAP, INSET, along, type SliderSnapPoint } from "./track";

/* The parts of the track Slider and RangeSlider share. Internal. */

/** The label and the visible number above the track. The number is hidden from screen readers, which hear it as the value. */
export function SliderHeader(props: { labelId: string; label?: ReactNode; readout: string; empty: boolean; disabled: boolean; labelClassName?: string }) {
  return (
    <div className="rst:flex rst:items-baseline rst:justify-between rst:gap-3">
      {props.label ? (
        <span
          id={props.labelId}
          className={cn("rst:text-sm rst:font-medium rst:text-[var(--roster-control-text)]", props.disabled && "rst:opacity-50", props.labelClassName)}
        >
          {props.label}
        </span>
      ) : (
        <span />
      )}
      <span
        aria-hidden="true"
        data-slider-readout=""
        className={cn(
          "rst:text-sm rst:tabular-nums",
          props.empty ? "rst:text-gray-500 rst:dark:text-gray-400" : "rst:font-semibold rst:text-[var(--roster-control-text)]",
          props.disabled && "rst:opacity-50",
        )}
      >
        {props.readout}
      </span>
    </div>
  );
}

/**
 * The rail, from the start edge's inset to the end edge's: a light surface
 * edged in the control border's color. With no value it's all there is of
 * the slider, so its edge carries the 3:1 a control's does.
 */
export function Rail() {
  return (
    <span
      aria-hidden="true"
      data-slider-rail=""
      className="rst:absolute rst:top-1/2 rst:h-2.5 rst:-translate-y-1/2 rst:rounded-full rst:border rst:border-[var(--roster-control-border)] rst:bg-gray-100 rst:dark:bg-gray-800"
      style={{ insetInline: INSET }}
    />
  );
}

/** The filled part of the rail, between two shares of it. */
export function Fill({ from, to, dragging }: { from: number; to: number; dragging: boolean }) {
  return (
    <span
      aria-hidden="true"
      data-slider-fill=""
      className={cn(
        "rst:absolute rst:top-1/2 rst:h-2.5 rst:-translate-y-1/2 rst:rounded-full rst:bg-primary-600 rst:dark:bg-primary-400",
        "rst:forced-colors:forced-color-adjust-none rst:forced-colors:bg-[Highlight]",
        !dragging && "rst:transition-[inset-inline-start,width] rst:duration-150 rst:ease-out rst:motion-reduce:transition-none",
      )}
      style={{ insetInlineStart: along(from), width: `calc((100% - ${2 * INSET}px) * ${to - from})` }}
    />
  );
}

/**
 * Each snap point's mark: a bead set in the rail, its edge's color on the
 * bare rail and the page's on the fill, so it shows on either.
 */
export function Marks({ points, at, filled }: { points: SliderSnapPoint[]; at: (v: number) => number; filled: (v: number) => boolean }) {
  return points.map((p) => (
    <span
      key={`${p.value}:${p.label}`}
      aria-hidden="true"
      data-slider-mark=""
      data-filled={filled(p.value) ? "" : undefined}
      className={cn(
        "rst:absolute rst:top-1/2 rst:size-1.5 rst:-translate-x-1/2 rst:-translate-y-1/2 rst:rounded-full rst:rtl:translate-x-1/2",
        "rst:transition-colors rst:duration-150 rst:motion-reduce:transition-none rst:forced-colors:forced-color-adjust-none",
        filled(p.value)
          ? "rst:bg-white rst:dark:bg-gray-900 rst:forced-colors:bg-[Canvas]"
          : "rst:bg-[var(--roster-control-border)] rst:forced-colors:bg-[CanvasText]",
      )}
      style={{ insetInlineStart: along(at(p.value), INSET + CAP) }}
    />
  ));
}

/**
 * A chip for each snap point, under the track, in a group named as the
 * slider is so the chips are heard as its presets.
 *
 * The clearance is what Chip's 44px target asks of its layout: it reaches up
 * to 8px above and below the chip, so the row sits 8px under the track (the
 * column's 6px and 2px more), where it can't take the bottom of a thumb's
 * target, and wrapped rows are 16px apart. A short label is widened to 44
 * too, since the target is only as wide as the chip, and no chip shrinks: a
 * min-width replaces the flex item's own floor of its label's width, so in a
 * row narrower than a label the chip would otherwise squeeze to 44 under it.
 *
 * A chip only ever moves a value to itself: pressed again, it stays, as a
 * preset does. Pressed swaps outline for solid, as Chip's own selectable
 * does, so it reads without color.
 */
export function SnapChips(props: {
  points: SliderSnapPoint[];
  labelledBy: string | undefined;
  label: string | undefined;
  pressed: (v: number) => boolean;
  pick: (v: number) => void;
  disabled: boolean;
  chipClassName?: string;
}) {
  if (props.points.length === 0) return null;
  return (
    <div
      role="group"
      aria-labelledby={props.labelledBy}
      aria-label={props.labelledBy ? undefined : props.label}
      className="rst:mt-0.5 rst:flex rst:flex-wrap rst:gap-x-2 rst:gap-y-4"
      data-slider-snaps=""
    >
      {props.points.map((p) => (
        <Chip
          key={`${p.value}:${p.label}`}
          selected={props.pressed(p.value)}
          onSelectedChange={() => props.pick(p.value)}
          variant={props.pressed(p.value) ? "solid" : "outline"}
          colorScheme={props.pressed(p.value) ? "primary" : "neutral"}
          disabled={props.disabled}
          className={cn("rst:min-w-11 rst:shrink-0 rst:justify-center", props.chipClassName)}
        >
          {p.label}
        </Chip>
      ))}
    </div>
  );
}

/** The helper text, or the error in its place. */
export function Message(props: { id: string; helperText?: string; errorMessage?: string; disabled: boolean; className?: string }) {
  if (!props.helperText && !props.errorMessage) return null;
  return (
    <p
      id={props.id}
      className={cn(
        "rst:m-0 rst:text-xs rst:text-left",
        props.errorMessage ? "rst:text-error-600 rst:dark:text-error-400 rst:font-medium" : "rst:text-gray-500 rst:dark:text-gray-400",
        props.disabled && "rst:opacity-50",
        props.className,
      )}
    >
      {props.errorMessage || props.helperText}
    </p>
  );
}
