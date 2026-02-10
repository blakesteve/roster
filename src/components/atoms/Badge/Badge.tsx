import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { badgeVariants } from "./badge-variants";

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    Omit<VariantProps<typeof badgeVariants>, "fill"> {
  fill?: VariantProps<typeof badgeVariants>["fill"];
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant,
      statusBadge,
      size,
      fill,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <span
        ref={ref}
        className={cn(
          badgeVariants({ variant, statusBadge, size, fill }),
          className,
        )}
        {...props}
      >
        {leftIcon && (
          <span className="flex items-center justify-center opacity-70">
            {leftIcon}
          </span>
        )}
        {children}
        {rightIcon && (
          <span className="flex items-center justify-center opacity-70">
            {rightIcon}
          </span>
        )}
      </span>
    );
  },
);
Badge.displayName = "Badge";

export { Badge };
