import React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { pillDotVariants, pillVariants } from "./pill-variants";

export interface PillProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof pillVariants> {
  children: React.ReactNode;
  /** Leading status dot, in the pill's color scheme. */
  dot?: boolean;
  /**
   * Animates the dot for genuinely live state: "Live now", "12 watching".
   * Requires `dot`. Honors `prefers-reduced-motion`, in which case the dot
   * still renders, it just stops moving.
   */
  pulse?: boolean;
  /** Leading icon or avatar. Ignored when `dot` is set. */
  leadingIcon?: React.ReactNode;
}

/**
 * Inline chrome for a short phrase: social proof, live state, an applied
 * filter. See pill-variants.ts for how this differs from Badge.
 */
const Pill = React.forwardRef<HTMLSpanElement, PillProps>(
  (
    {
      className,
      colorScheme = "neutral",
      variant = "soft",
      size = "sm",
      dot = false,
      pulse = false,
      leadingIcon,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <span
        ref={ref}
        className={cn(pillVariants({ colorScheme, variant, size }), className)}
        {...props}
      >
        {dot ? (
          // The pulse is a sibling ring rather than an animation on the dot
          // itself, so the dot stays a crisp solid circle while it radiates.
          <span className="relative inline-flex shrink-0" aria-hidden="true">
            {pulse && (
              <span
                className={cn(
                  pillDotVariants({ colorScheme, variant, size }),
                  "absolute inset-0 motion-safe:animate-ping opacity-75",
                )}
              />
            )}
            <span className={cn(pillDotVariants({ colorScheme, variant, size }), "relative")} />
          </span>
        ) : (
          leadingIcon && (
            <span className="inline-flex shrink-0 items-center" aria-hidden="true">
              {leadingIcon}
            </span>
          )
        )}

        {children}
      </span>
    );
  },
);

Pill.displayName = "Pill";

export { Pill };
