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
              "absolute top-0 left-0 right-0 h-1 z-10",
              !brandColorTop && "bg-orange-500", // Default Theme Color
            )}
            style={
              brandColorTop ? { backgroundColor: brandColorTop } : undefined
            }
          />
        )}

        {/* --- Content --- */}
        {children}

        {/* --- Bottom Brand Stripe --- */}
        {branded && (
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 h-1 z-10",
              !brandColorBottom && "bg-primary-500", // Default Theme Color
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
