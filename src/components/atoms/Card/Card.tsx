import React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { cardVariants } from "./card-variants";

export interface CardProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  children: React.ReactNode;
  /** Adds the signature top/bottom colored borders */
  branded?: boolean;
  /** Custom hex color for the top border. Defaults to theme Orange. */
  brandColorTop?: string;
  /** Custom hex color for the bottom border. Defaults to theme Primary. */
  brandColorBottom?: string;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      padding,
      branded = false,
      brandColorTop,
      brandColorBottom,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding }), className)}
        {...props}
      >
        {/* --- Top Brand Stripe --- */}
        {branded && (
          <div
            className={cn(
              "rst:absolute rst:top-0 rst:inset-x-0 rst:h-1 rst:z-10",
              !brandColorTop && "rst:bg-orange-500",
            )}
            style={
              brandColorTop ? { backgroundColor: brandColorTop } : undefined
            }
          />
        )}

        {/* Children render directly on the root so layout passed via
            `className` (flex, grid, gap-*, and `mt-auto` on a child) applies
            to the element that actually contains them. They used to sit in a
            `relative z-0` wrapper, which meant those classes landed on the
            outer div and silently did nothing. The stripes stay on top because
            the root is `isolate` and they carry z-10. */}
        {children}

        {/* --- Bottom Brand Stripe --- */}
        {branded && (
          <div
            className={cn(
              "rst:absolute rst:bottom-0 rst:inset-x-0 rst:h-1 rst:z-10",
              !brandColorBottom && "rst:bg-primary-500",
            )}
            style={
              brandColorBottom
                ? { backgroundColor: brandColorBottom }
                : undefined
            }
          />
        )}
      </div>
    );
  },
);

Card.displayName = "Card";

export { Card };
