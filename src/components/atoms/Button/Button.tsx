import React from "react";
import { type VariantProps } from "class-variance-authority";
import { Button as HeadlessButton } from "@headlessui/react";
import { cn } from "../../../lib/utils";
import { Spinner } from "../Spinner/Spinner";

import { buttonVariants } from "./button-variants";

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      colorScheme,
      variant,
      size,
      isLoading = false,
      startIcon,
      endIcon,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <HeadlessButton
        className={cn(
          buttonVariants({ colorScheme, variant, size }),
          className,
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {isLoading && (
          <span className="mr-2 flex items-center">
            <Spinner size="sm" className="text-current" />
          </span>
        )}

        {!isLoading && startIcon && (
          <span className="mr-2 inline-flex shrink-0 items-center">
            {startIcon}
          </span>
        )}

        {children}

        {!isLoading && endIcon && (
          <span className="ml-2 inline-flex shrink-0 items-center">
            {endIcon}
          </span>
        )}
      </HeadlessButton>
    );
  },
);
Button.displayName = "Button";

export { Button };
