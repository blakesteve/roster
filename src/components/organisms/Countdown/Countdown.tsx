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
    <span className={cn(countdownLabelVariants({ size }))}>{label}</span>
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
        {title && (
          <h3 className={cn(countdownTitleVariants({ size }))}>{title}</h3>
        )}
        <div className="rst:flex rst:justify-center rst:gap-4 rst:sm:gap-6 rst:md:gap-8">
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
    );
  },
);

Countdown.displayName = "Countdown";

export { Countdown };
