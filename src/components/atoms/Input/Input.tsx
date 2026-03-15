import React from "react";
import {
  Input as HeadlessInput,
  Field,
  Label,
  Description,
} from "@headlessui/react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { inputVariants, iconVariants } from "./input-variants";

export interface InputProps
  extends
    React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      label,
      helperText,
      errorMessage,
      variant,
      error,
      startIcon,
      endIcon,
      disabled,
      ...props
    },
    ref,
  ) => {
    const hasError = !!errorMessage || error;

    return (
      <Field className={cn("w-full space-y-1.5", className)}>
        {label && (
          <Label
            className={cn(
              "block text-sm font-medium leading-none text-left mb-1.5 transition-colors",
              "text-gray-900 dark:text-gray-100",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            )}
          >
            {label}
          </Label>
        )}

        <div className="relative">
          {startIcon && (
            <div
              className={cn(
                iconVariants({ variant, error: hasError }),
                "left-3",
              )}
            >
              {startIcon}
            </div>
          )}

          <HeadlessInput
            ref={ref}
            type={type}
            disabled={disabled}
            className={cn(
              inputVariants({ variant, error: hasError }),
              startIcon && "pl-10",
              endIcon && "pr-10",
            )}
            {...props}
          />

          {endIcon && (
            <div
              className={cn(
                iconVariants({ variant, error: hasError }),
                "right-3",
              )}
            >
              {endIcon}
            </div>
          )}
        </div>

        {(helperText || errorMessage) && (
          <Description
            className={cn(
              "text-xs text-left mt-1",
              hasError
                ? "text-error-600 dark:text-error-400 font-medium"
                : "text-gray-500 dark:text-gray-400",
            )}
          >
            {errorMessage || helperText}
          </Description>
        )}
      </Field>
    );
  },
);

Input.displayName = "Input";

export { Input };
