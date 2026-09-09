import React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { useCountdown } from "../../../hooks/useCountdown";
import {
  countdownTitleVariants,
  countdownNumberVariants,
  countdownLabelVariants,
} from "./countdown-variants";

interface CountdownItemProps extends VariantProps<
  typeof countdownNumberVariants
> {
  value: number;
  label: string;
}

const CountdownItem = ({ value, label, size, variant }: CountdownItemProps) => (
  <div className="rst:flex rst:flex-col rst:items-center">
    <span className={cn(countdownNumberVariants({ size, variant }))}>
      {String(value).padStart(2, "0")}
    </span>
    {/* In a narrow container the label drops under the size scale's floor, for
        every size. That is what pays for a real gutter: at 10px with an 8px
        gap the four labels read as one word, "dayshoursminutesseconds". Nine
        pixels with a 12px gap is both narrower overall and legibly
        separated. */}
    <span
      className={cn(
        countdownLabelVariants({ size }),
        "rst:@max-[22rem]:text-[9px]",
      )}
    >
      {label}
    </span>
  </div>
);

export interface CountdownProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof countdownTitleVariants> {
  targetDate: Date;
  title?: string;
  completionText?: string;
  variant?: VariantProps<typeof countdownNumberVariants>["variant"];
}

const Countdown = React.forwardRef<HTMLDivElement, CountdownProps>(
  (
    {
      targetDate,
      title,
      size,
      variant = "gradient",
      className,
      completionText,
      ...props
    },
    ref,
  ) => {
    const { days, hours, minutes, seconds, isFinished } =
      useCountdown(targetDate);

    if (isFinished) {
      if (completionText) {
        return (
          <div
            ref={ref}
            className={cn(
              "rst:font-bold rst:w-full rst:text-center rst:text-gray-900 rst:dark:text-gray-100",
              className,
            )}
            {...props}
          >
            <h3 className={cn(countdownTitleVariants({ size }), "rst:mb-0")}>
              {completionText}
            </h3>
          </div>
        );
      }
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rst:font-bold rst:w-full rst:text-center rst:text-gray-900 rst:dark:text-gray-100",
          className,
        )}
        {...props}
      >
        {/* A wrapper carries `@container` so the row and labels below size
            against the space this component was GIVEN rather than the width of
            the window — a narrow card on a wide page is the case that kept
            overflowing. It is a separate element because an element cannot
            query itself.

            One trap worth knowing before you nest a Countdown:
            `container-type: inline-size` collapses when an ANCESTOR is sized to
            its content — `width: fit-content`, `inline-block`, a table cell.
            The `w-full` here covers the common `self-start` flex child, but an
            auto-width div in between brings it back. Give such an ancestor a
            definite width. */}
        <div className="rst:@container rst:w-full">
        {title && (
          <h3 className={cn(countdownTitleVariants({ size }))}>{title}</h3>
        )}
        {/* The gap steps DOWN in a narrow container rather than only up in a
            roomy one. Four
            content-sized columns plus three 16px gutters is 225px at the
            smallest size, and the space a Countdown actually gets is usually
            far less than the viewport. It clipped "SECONDS" outright and took
            half of "MINUTES" with it.

            Halving the gutters is the cheapest 24px available and costs
            nothing in a roomy container. With the label tracking below, `xs`
            drops from 225px to 189px, measured.

            These are CONTAINER steps, so a narrow column on a wide page is
            handled — that was the whole point. One limit remains: `lg` and
            `xl` still exceed a phone-width container even after the saving.
            They are hero sizes and were never going to fit there. */}
        <div className="rst:flex rst:justify-center rst:gap-3 rst:@[22rem]:gap-6 rst:@[35rem]:gap-8">
          <CountdownItem
            value={days}
            label="Days"
            size={size}
            variant={variant}
          />
          <CountdownItem
            value={hours}
            label="Hours"
            size={size}
            variant={variant}
          />
          <CountdownItem
            value={minutes}
            label="Minutes"
            size={size}
            variant={variant}
          />
          <CountdownItem
            value={seconds}
            label="Seconds"
            size={size}
            variant={variant}
          />
        </div>
        </div>
      </div>
    );
  },
);

Countdown.displayName = "Countdown";

export { Countdown };
