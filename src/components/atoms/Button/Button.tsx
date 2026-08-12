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
  /**
   * Which surface the button sits on.
   *
   * Roster's dark styling keys off an ancestor carrying `.dark`, so a button
   * placed on a hard-coded dark panel that never carries that class (a
   * campfire overlay, a lantern-night backdrop) falls back to the LIGHT
   * styles and flashes a near-white hover. Pass `surface="dark"` to force the
   * dark treatment regardless of the app's theme.
   */
  surface?: "auto" | "dark";
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
      surface = "auto",
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
          // Roster's dark variant is `&:where(.dark, .dark *)`, so an element
          // carrying `.dark` itself satisfies it. That is all forcing the
          // dark surface requires.
          surface === "dark" && "dark",
          className,
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {isLoading && (
          <span className="mr-2 flex shrink-0 items-center">
            <Spinner size="sm" variant="current" />
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
