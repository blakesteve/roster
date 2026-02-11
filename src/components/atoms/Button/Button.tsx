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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      colorScheme,
      variant,
      size,
      isLoading = false,
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
          buttonVariants({ colorScheme, variant, size, className }),
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {isLoading ? <Spinner size="sm" className="text-current" /> : children}
      </HeadlessButton>
    );
  },
);
Button.displayName = "Button";

export { Button };
